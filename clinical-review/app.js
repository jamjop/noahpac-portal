'use strict';

const state = {topics: [], active: null};
const labels = {pending:'Review pending', error:'Monitor error', not_checked:'Not checked', current:'Monitoring current', reviewed:'Clinically reviewed'};
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

function renderSummary(counts) {
  const grid = document.getElementById('summaryGrid');
  grid.replaceChildren();
  [['pending','Pending'],['error','Errors'],['reviewed','Reviewed'],['current','Monitoring current']].forEach(([key,label]) => {
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
  [['Monitor status', labels[topic.state] || topic.status],['Status date',formatDate(topic.status_date)],['Last reviewer',topic.reviewer || 'Not recorded'],['Last clinical review',formatDate(topic.reviewed_at)]].forEach(([term,value]) => {
    const wrap=el('div'); wrap.append(el('dt',null,term),el('dd',null,value)); details.append(wrap);
  });
  const sources = el('div','review-sources');
  sources.append(el('h4',null,'Authoritative sources'));
  const sourceList = el('ul');
  topic.sources.forEach(source => { const li=el('li'); const a=el('a',null,source.title); a.href=source.url; a.target='_blank'; a.rel='noopener noreferrer'; li.append(a); sourceList.append(li); });
  sources.append(sourceList);
  const actions=el('div','review-card__actions');
  const pageLink=el('a','secondary-button','Open clinical page'); pageLink.href=topic.path; pageLink.target='_blank'; pageLink.rel='noopener';
  const review=el('button','primary-button',topic.state === 'reviewed' ? 'Record new review' : 'Review topic'); review.type='button'; review.addEventListener('click',()=>openReview(topic));
  actions.append(pageLink,review);
  article.append(header,details,sources,actions);
  return article;
}

function renderTopics() {
  const query=document.getElementById('topicSearch').value.trim().toLowerCase();
  const filter=document.getElementById('statusFilter').value;
  const topics=state.topics.filter(t=>(filter==='all'||t.state===filter)&&(!query||`${t.title} ${t.id}`.toLowerCase().includes(query)));
  list.replaceChildren(...topics.map(topicCard));
  message.textContent=topics.length ? `${topics.length} clinical topic${topics.length===1?'':'s'} shown.` : 'No topics match these filters.';
}

function openReview(topic) {
  state.active=topic;
  form.reset();
  document.getElementById('dialogTitle').textContent=topic.title;
  document.getElementById('dialogContext').textContent=`Current state: ${labels[topic.state]}. Status dated ${formatDate(topic.status_date)}.`;
  document.getElementById('reviewTopic').value=topic.id;
  document.getElementById('reviewRevision').value=topic.revision;
  document.getElementById('dialogError').textContent='';
  document.getElementById('changeReferenceField').hidden=true;
  const checklist=document.getElementById('sourceChecklist'); checklist.replaceChildren();
  topic.sources.forEach(source=>{
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

form.addEventListener('change',event=>{
  if (event.target.name==='decision') { const updated=event.target.value==='content-updated'; document.getElementById('changeReferenceField').hidden=!updated; document.getElementById('changeReference').required=updated; }
});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const submit=document.getElementById('submitReview'); const error=document.getElementById('dialogError'); error.textContent='';
  const sourceIds=[...form.querySelectorAll('input[name="source"]:checked')].map(input=>input.value);
  if (!sourceIds.length) { error.textContent='Select at least one authoritative source you reviewed.'; return; }
  const decision=form.elements.decision.value;
  const payload={topic:document.getElementById('reviewTopic').value,expected_revision:document.getElementById('reviewRevision').value,source_ids:sourceIds,decision,note:document.getElementById('reviewNote').value,change_reference:document.getElementById('changeReference').value,confirmed:document.getElementById('reviewConfirmed').checked};
  submit.disabled=true; submit.textContent='Recording…';
  try {
    const response=await fetch('/review/api/reviews',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'NoahPACReviewPortal'},body:JSON.stringify(payload)});
    const data=await response.json(); if (!response.ok) throw new Error(data.error||'Unable to record review.'); dialog.close(); await loadStatus(); message.textContent=`Clinical review recorded for ${state.active.title}.`;
  } catch (err) { error.textContent=err.message; }
  finally { submit.disabled=false; submit.textContent='Record review'; }
});

document.getElementById('topicSearch').addEventListener('input',renderTopics);
document.getElementById('statusFilter').addEventListener('change',renderTopics);
document.getElementById('refreshButton').addEventListener('click',loadStatus);
document.getElementById('closeDialog').addEventListener('click',()=>dialog.close());
document.getElementById('cancelReview').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{ if(event.target===dialog) dialog.close(); });
loadStatus();
