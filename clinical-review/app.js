'use strict';

const state = {topics: [], active: null};
const labels = {pending:'Review pending', second_review:'Independent review pending', error:'Monitor error', not_checked:'Not checked', current:'Monitoring current', reviewed:'Clinically reviewed'};
const list = document.getElementById('reviewList');
const message = document.getElementById('portalMessage');
const dialog = document.getElementById('reviewDialog');
const form = document.getElementById('reviewForm');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(value) {
  if (!value) return 'No date recorded';
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {dateStyle:'medium'}).format(date);
}

function sourceVersionDraft(topic) {
  const accessed=new Intl.DateTimeFormat(undefined,{dateStyle:'long'}).format(new Date());
  const targetIds=new Set(topic.review_source_ids||topic.sources.map(source=>source.id));
  const lines=topic.sources.filter(source=>targetIds.has(source.id)).map(source=>{
    const metadata=source.publication_date?`published ${source.publication_date}`:source.version?`version ${source.version}`:null;
    return `${source.title}${metadata?` — ${metadata}`:''}; accessed ${accessed}.`;
  });
  const seen=new Set();
  (topic.review_events||[]).forEach(event=>(event.findings||[]).forEach(finding=>{
    if (!finding.pubdate || !finding.title) return;
    const key=`${finding.pmid||''}:${finding.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(`${finding.title} — published ${finding.pubdate}${finding.pmid?`; PMID ${finding.pmid}`:''}.`);
  }));
  let draft='';
  for (const line of lines) {
    const candidate=draft?`${draft}\n${line}`:line;
    if (candidate.length>1000) break;
    draft=candidate;
  }
  return draft;
}

function triggerLabel(value) {
  return ({'topic-monitor':'Literature or guideline monitor','document-fingerprint':'Source document changed','urgent-official-alert':'Official urgent alert','legacy-detection':'Legacy broad detection','scheduled-review':'Scheduled comprehensive review'})[value] || value || 'Monitored source change';
}

function diffSide(title, lines, emptyText) {
  const side=el('section','diff-side');
  side.append(el('h5',null,title));
  const code=el('div','diff-code');
  if (!lines.length) code.append(el('div','diff-line diff-line--empty',emptyText));
  lines.forEach(line=>{
    const row=el('div',`diff-line${line.changed?' diff-line--changed':''}`);
    row.append(el('span','diff-line__number',String(line.number)),el('code',null,line.text||' '));
    code.append(row);
  });
  side.append(code);
  return side;
}

function hunkView(hunk) {
  const card=el('article',`diff-hunk diff-hunk--${hunk.kind||'source'}`);
  const heading=el('div','diff-hunk__heading');
  const title=el('div');
  title.append(el('strong',null,hunk.label||'Text change'),el('span','evidence-finding__meta',hunk.kind==='implementation'?'Noah PA-C implementation':'Authoritative source'));
  heading.append(title,el('span','diff-hunk__range',`Old ${hunk.old_start||'—'} → new ${hunk.new_start||'—'}`));
  const comparison=el('div','diff-comparison');
  comparison.append(diffSide('Previous',hunk.old_lines||[],'Not present'),diffSide('Current',hunk.new_lines||[],'Removed'));
  const confirmation=el('label','hunk-confirmation');
  const input=el('input'); input.type='checkbox'; input.name='hunk'; input.value=hunk.id;
  confirmation.append(input,el('span',null,'I verified this specific change is accurately understood and addressed by my decision.'));
  card.append(heading,comparison);
  if (hunk.truncated) card.append(el('p','evidence-warning','This hunk was bounded for display. Open the authoritative source or Git comparison before confirming it.'));
  card.append(confirmation);
  return card;
}

function findingView(finding) {
  const item=el('div','evidence-finding');
  if (finding.title) item.append(el('strong','evidence-finding__title',finding.title));
  const metadata=[finding.journal,finding.pubdate,finding.pmid?`PMID ${finding.pmid}`:null].filter(Boolean).join(' · ');
  if (metadata) item.append(el('span','evidence-finding__meta',metadata));
  if (finding.detail) item.append(el('p',null,finding.detail));
  if (finding.abstract) { const details=el('details','evidence-abstract'); details.append(el('summary',null,'View abstract'),el('p',null,finding.abstract)); item.append(details); }
  (finding.diff_hunks||[]).forEach(hunk=>item.append(hunkView(hunk)));
  if (finding.diff_truncated) item.append(el('p','evidence-warning','Additional source changes were omitted from this bounded packet. Review the complete authoritative source before deciding.'));
  if (finding.diff_excerpt && !(finding.diff_hunks||[]).length) { const details=el('details','evidence-diff'); details.append(el('summary',null,'View legacy source text changes'),el('pre',null,finding.diff_excerpt)); item.append(details); }
  if (finding.previous_sha256 && finding.current_sha256) item.append(el('span','evidence-finding__meta',`Document fingerprint ${finding.previous_sha256.slice(0,10)}… → ${finding.current_sha256.slice(0,10)}…`));
  if (finding.extraction_error) item.append(el('p','evidence-warning',`Text comparison unavailable: ${finding.extraction_error}`));
  if (finding.url) { const link=el('a','evidence-link','Open detected source ↗'); link.href=finding.url; link.target='_blank'; link.rel='noopener noreferrer'; item.append(link); }
  return item;
}

function eventView(event) {
  const card=el('article',`evidence-card evidence-${event.evidence_scope}`);
  const header=el('div','evidence-card__header');
  const copy=el('div'); copy.append(el('strong',null,event.title),el('span','evidence-finding__meta',`${triggerLabel(event.trigger_type)} · ${formatDate(event.detected_at)}`));
  header.append(copy,el('span','evidence-scope',event.evidence_scope==='focused'?'Focused':'Broad review'));
  card.append(header);
  (event.findings||[]).forEach(finding=>card.append(findingView(finding)));
  if ((event.implementation_hunks||[]).length) {
    const intro=el('div','implementation-heading');
    intro.append(el('strong',null,'Noah PA-C implementation changes'),el('p',null,'Compare the prior deployed content with the updated implementation below.'));
    card.append(intro);
    (event.implementation_hunks||[]).forEach(hunk=>card.append(hunkView(hunk)));
  }
  const hasHunks=(event.implementation_hunks||[]).length||(event.findings||[]).some(finding=>(finding.diff_hunks||[]).length);
  if (!hasHunks && ['legacy-detection','scheduled-review'].includes(event.trigger_type)) card.append(el('p','evidence-warning','Line-by-line comparison unavailable: this alert predates retained snapshots or represents a scheduled review.'));
  else if (!hasHunks) card.append(el('p','evidence-finding__meta','No old version exists for this newly detected evidence. Review the linked source and record whether it affects the deployed content.'));
  return card;
}

function renderSummary(counts) {
  const grid = document.getElementById('summaryGrid');
  grid.replaceChildren();
  [['pending','Pending'],['second_review','Second review'],['error','Errors'],['reviewed','Reviewed'],['current','Monitoring current']].forEach(([key,label]) => {
    const card = el('div', `summary-card status-${key}`);
    card.append(el('strong','summary-number',String(counts[key] || 0)), el('span','summary-label',label));
    grid.append(card);
  });
}

function topicCard(topic) {
  const article = el('article', `review-card status-${topic.state}`);
  const header = el('div','review-card__header');
  const titleWrap = el('div');
  const title = el('h3',null,topic.title);
  const metadata = el('p','review-card__meta',`${topic.risk_tier} risk · ${topic.cadence} review cadence`);
  titleWrap.append(title, metadata);
  const badge = el('span',`status-badge status-${topic.state}`,labels[topic.state] || topic.state);
  header.append(titleWrap,badge);

  const details = el('dl','review-details');
  [['Monitor status', labels[topic.state] || topic.status],['Status date',formatDate(topic.status_date)],['Last reviewer',topic.secondary_reviewer || topic.reviewer || 'Not recorded'],['Last clinical review',formatDate(topic.secondary_reviewed_at || topic.reviewed_at)],['Next review due',formatDate(topic.next_review_due)]].forEach(([term,value]) => {
    const wrap=el('div'); wrap.append(el('dt',null,term),el('dd',null,value)); details.append(wrap);
  });
  const packetCount=(topic.review_events||[]).length;
  const focusedCount=(topic.review_claim_ids||[]).length;
  const relevantSourceIds=new Set(topic.review_source_ids||topic.sources.map(source=>source.id));
  const sources = el('div','review-sources');
  sources.append(el('h4',null,packetCount?'Sources in this packet':'Authoritative sources'));
  const sourceList = el('ul');
  topic.sources.filter(source=>relevantSourceIds.has(source.id)).forEach(source => { const li=el('li'); const a=el('a',null,source.title); a.href=source.url; a.target='_blank'; a.rel='noopener noreferrer'; li.append(a); sourceList.append(li); });
  sources.append(sourceList);
  const claimSummary=el('p','review-card__meta',packetCount?`${packetCount} evidence packet${packetCount===1?'':'s'} · ${focusedCount} affected content area${focusedCount===1?'':'s'} · ${topic.independent_review_required?'independent review required':'independent review recommended'}`:`${topic.claims.length} mapped content area${topic.claims.length===1?'':'s'}`);
  const actions=el('div','review-card__actions');
  const pageLink=el('a','secondary-button','Open clinical page'); pageLink.href=topic.path; pageLink.target='_blank'; pageLink.rel='noopener';
  actions.append(pageLink);
  if (['pending','second_review'].includes(topic.state)) {
    const reviewLabel=topic.state==='second_review'?'Complete independent review':'Review focused packet';
    const review=el('button','primary-button',reviewLabel); review.type='button'; review.addEventListener('click',()=>openReview(topic)); actions.append(review);
  }
  article.append(header,details,claimSummary,sources,actions);
  return article;
}

function renderTopics() {
  const query=document.getElementById('topicSearch').value.trim().toLowerCase();
  const filter=document.getElementById('statusFilter').value;
  const priority={pending:0,second_review:1,error:2,not_checked:3,current:4,reviewed:5};
  const topics=state.topics.filter(t=>(filter==='all'||t.state===filter)&&(!query||`${t.title} ${t.id}`.toLowerCase().includes(query))).sort((a,b)=>(priority[a.state]??9)-(priority[b.state]??9)||a.title.localeCompare(b.title));
  list.replaceChildren(...topics.map(topicCard));
  const actionable=topics.filter(topic=>['pending','second_review','error','not_checked'].includes(topic.state)).length;
  message.textContent=topics.length ? `${topics.length} clinical topic${topics.length===1?'':'s'} shown${actionable ? ` · ${actionable} requiring attention` : ''}.` : 'No topics match these filters.';
  document.getElementById('clearFilters').hidden=!query&&filter==='all';
  const params=new URLSearchParams(); if(query) params.set('q',document.getElementById('topicSearch').value.trim()); if(filter!=='all') params.set('status',filter);
  history.replaceState(null,'',`${location.pathname}${params.size?`?${params}`:''}`);
}

function openReview(topic) {
  state.active=topic;
  form.reset();
  document.getElementById('dialogTitle').textContent=topic.title;
  document.getElementById('dialogContext').textContent=`Current state: ${labels[topic.state]}. Status dated ${formatDate(topic.status_date)}.`;
  document.getElementById('reviewTopic').value=topic.id;
  document.getElementById('reviewRevision').value=topic.revision;
  const stage=topic.independent_review_pending?'secondary':'primary';
  document.getElementById('reviewStage').value=stage;
  document.getElementById('dialogTitle').textContent=stage==='secondary'?`${topic.title} — independent review`:topic.title;
  document.getElementById('dialogError').textContent='';
  document.getElementById('changeReferenceField').hidden=true;
  document.getElementById('sourceVersions').value=sourceVersionDraft(topic);
  const evidence=document.getElementById('reviewEvidence'); evidence.replaceChildren(...(topic.review_events||[]).map(eventView));
  const hunkCount=(topic.review_hunk_ids||[]).length;
  document.getElementById('evidenceCount').textContent=`${(topic.review_events||[]).length} packet${(topic.review_events||[]).length===1?'':'s'}${hunkCount?` · ${hunkCount} change${hunkCount===1?'':'s'}`:''}`;
  const targetClaims=new Set(topic.review_claim_ids||topic.claims.map(claim=>claim.id));
  const claims=document.getElementById('claimChecklist'); claims.replaceChildren();
  topic.claims.filter(claim=>targetClaims.has(claim.id)).forEach(claim=>{
    const label=el('label'); const input=el('input'); input.type='checkbox'; input.name='claim'; input.value=claim.id;
    const copy=el('span'); copy.append(el('strong',null,claim.scope),el('small',null,`${claim.review_priority} priority · independent review ${claim.independent_review}`)); label.append(input,copy); claims.append(label);
  });
  const targetSources=new Set(topic.review_source_ids||topic.sources.map(source=>source.id));
  const checklist=document.getElementById('sourceChecklist'); checklist.replaceChildren();
  topic.sources.filter(source=>targetSources.has(source.id)).forEach(source=>{
    const label=el('label'); const input=el('input'); input.type='checkbox'; input.name='source'; input.value=source.id;
    const copy=el('span'); copy.append(el('strong',null,source.title)); const link=el('a',null,'Open source ↗'); link.href=source.url; link.target='_blank'; link.rel='noopener noreferrer'; copy.append(link); label.append(input,copy); checklist.append(label);
  });
  dialog.showModal();
}

async function loadStatus() {
  message.textContent='Loading clinical review status…';
  try {
    const response=await fetch('/review/api/status',{headers:{'Accept':'application/json'}});
    if (!response.ok) throw new Error('Unable to load protected review status.');
    const data=await response.json(); state.topics=data.topics; document.getElementById('reviewUser').textContent=`Signed in: ${data.authenticated_user}`; renderSummary(data.counts); renderTopics();
  } catch (error) { message.textContent=error.message; list.replaceChildren(); }
}

const initialParams=new URLSearchParams(location.search);
document.getElementById('topicSearch').value=initialParams.get('q')||'';
if(Object.prototype.hasOwnProperty.call(labels,initialParams.get('status'))) document.getElementById('statusFilter').value=initialParams.get('status');

form.addEventListener('change',event=>{
  if (event.target.name==='decision') { const updated=event.target.value==='content-updated'; document.getElementById('changeReferenceField').hidden=!updated; document.getElementById('changeReference').required=updated; }
});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const submit=document.getElementById('submitReview'); const error=document.getElementById('dialogError'); error.textContent='';
  const sourceIds=[...form.querySelectorAll('input[name="source"]:checked')].map(input=>input.value);
  const claimIds=[...form.querySelectorAll('input[name="claim"]:checked')].map(input=>input.value);
  const verifiedHunkIds=[...form.querySelectorAll('input[name="hunk"]:checked')].map(input=>input.value);
  if (!sourceIds.length) { error.textContent='Select at least one authoritative source you reviewed.'; return; }
  if (claimIds.length!==(state.active.review_claim_ids||state.active.claims.map(claim=>claim.id)).length) { error.textContent='Confirm every clinical content area in this focused packet.'; return; }
  if (verifiedHunkIds.length!==(state.active.review_hunk_ids||[]).length) { error.textContent='Check every old-versus-new change before recording this review.'; return; }
  const decision=form.elements.decision.value;
  const payload={topic:document.getElementById('reviewTopic').value,expected_revision:document.getElementById('reviewRevision').value,review_stage:document.getElementById('reviewStage').value,event_ids:(state.active.review_events||[]).map(event=>event.id),source_ids:sourceIds,claim_ids:claimIds,verified_hunk_ids:verifiedHunkIds,source_versions:document.getElementById('sourceVersions').value,limitations:document.getElementById('reviewLimitations').value,decision,note:document.getElementById('reviewNote').value,change_reference:document.getElementById('changeReference').value,confirmed:document.getElementById('reviewConfirmed').checked};
  submit.disabled=true; submit.textContent='Recording…';
  try {
    const response=await fetch('/review/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'NoahPACReviewPortal'},body:JSON.stringify(payload)});
    const data=await response.json(); if (!response.ok) throw new Error(data.error||'Unable to record review.'); dialog.close(); await loadStatus(); message.textContent=data.independent_review_pending?`Primary review recorded for ${state.active.title}; independent review is now required.`:`Clinical review recorded for ${state.active.title}.`;
  } catch (err) { error.textContent=err.message; }
  finally { submit.disabled=false; submit.textContent='Record review'; }
});

document.getElementById('topicSearch').addEventListener('input',renderTopics);
document.getElementById('statusFilter').addEventListener('change',renderTopics);
document.getElementById('refreshButton').addEventListener('click',loadStatus);
document.getElementById('clearFilters').addEventListener('click',()=>{document.getElementById('topicSearch').value='';document.getElementById('statusFilter').value='all';renderTopics();document.getElementById('topicSearch').focus();});
document.getElementById('closeDialog').addEventListener('click',()=>dialog.close());
document.getElementById('cancelReview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{ if(event.target===dialog) dialog.close(); });
loadStatus();
