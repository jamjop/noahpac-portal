'use strict';
(() => {
  const type = document.body.dataset.protocol;
  if (!['als','pals'].includes(type)) return;
  const configs = {
    als: {
      groups:[['Cardiac arrest',['vfpvt','pea']],['Peri-arrest',['brady','tachy']],['Recovery & emergencies',['rosc','acs','stroke','opioid']]],
      hashes:{vfpvt:'vf-pvt',pea:'asystole-pea',brady:'bradycardia',tachy:'tachycardia',rosc:'post-arrest',acs:'acs',stroke:'stroke',opioid:'opioid-emergency'},
      meta:{
        vfpvt:['Shockable arrest','Defibrillate → resume CPR immediately → epinephrine → antiarrhythmic'],pea:['Non-shockable arrest','High-quality CPR → epinephrine early → identify reversible causes'],brady:['Pulse present · assess perfusion','Unstable: atropine and pacing pathway · Stable: identify and treat cause'],tachy:['Pulse present · determine stability and QRS width','Unstable: synchronized cardioversion · Polymorphic VT: defibrillate'],rosc:['Post-cardiac arrest stabilization','Protect oxygenation, ventilation, perfusion, temperature, and neurologic recovery'],acs:['Time-sensitive coronary syndrome','ECG and aspirin → identify STEMI → activate reperfusion pathway'],stroke:['Time-sensitive neurologic emergency','Last-known-well → glucose and imaging → reperfusion eligibility'],opioid:['Ventilation-first emergency','Support breathing → naloxone → reassess every 2–3 minutes']}
    },
    pals: {
      groups:[['Cardiac arrest',['vfpvt','pea']],['Peri-arrest',['brady','tachy']],['Recovery & support',['rosc','resp','shock']],['Reference',['meds']]],
      hashes:{vfpvt:'vf-pvt',pea:'asystole-pea',brady:'bradycardia',tachy:'tachycardia',rosc:'post-arrest',resp:'respiratory',shock:'shock',meds:'medications'},
      meta:{
        vfpvt:['Pediatric shockable arrest','2 J/kg first shock → 4 J/kg → CPR, epinephrine, antiarrhythmic'],pea:['Pediatric non-shockable arrest','Oxygenation and ventilation → CPR → epinephrine → reversible causes'],brady:['Bradycardia with a pulse','Oxygenate and ventilate first → CPR if HR <60 with poor perfusion'],tachy:['Tachycardia with a pulse','Assess stability, QRS width, and probable sinus tachycardia versus SVT'],rosc:['Post-cardiac arrest stabilization','Protect oxygenation, ventilation, perfusion, temperature, glucose, and neurologic recovery'],resp:['Respiratory emergency','Open airway → support oxygenation and ventilation → treat the underlying process'],shock:['Pediatric shock','Identify shock type → cautious weight-based fluid → early vasoactive support'],meds:['Weight-based medication reference','Verify measured weight, concentration, calculated dose, volume, and maximum dose']}
    }
  };
  const config = configs[type];
  const nav = document.getElementById('tabNav');
  const pane = document.getElementById('content');
  const status = document.getElementById('cacheStatus');
  const esc = value => String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug = value => String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const hashToId = Object.fromEntries(Object.entries(config.hashes).map(([id,hash])=>[hash,id]));
  const initialRequestedHash = location.hash.slice(1).split('--')[0];
  const buttons = [...nav.querySelectorAll('[role="tab"]')];
  const labels = Object.fromEntries(buttons.map(button=>[button.dataset.id,button.textContent.trim()]));

  nav.innerHTML = config.groups.map(([group,ids])=>`<div class="nav-group"><div class="nav-group-label">${esc(group)}</div>${ids.map(id=>buttons.find(button=>button.dataset.id===id)?.outerHTML||'').join('')}</div>`).join('');
  const clickSection = id => nav.querySelector(`[data-id="${id}"]`)?.click();
  const centerActiveTab = (behavior='auto') => {
    const active = nav.querySelector('[aria-selected="true"]');
    if (!active || !matchMedia('(max-width: 860px)').matches) return;
    active.scrollIntoView({behavior,block:'nearest',inline:'center'});
  };
  nav.addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;history.replaceState(null,'',`#${config.hashes[button.dataset.id]}`);localStorage.setItem(`${type}-section`,button.dataset.id);centerActiveTab('smooth');});

  const medicationIndex = [];
  if (type === 'als') {
    const restore = pane.dataset.section;
    Object.keys(labels).forEach(id=>{
      clickSection(id);
      pane.querySelectorAll('.drug-card').forEach(card=>{
        const name=card.querySelector('.drug-name')?.textContent?.trim();
        if(name&&!medicationIndex.some(item=>item.name===name)) medicationIndex.push({name,section:id,preview:card.querySelector('.drug-row-val')?.textContent?.trim()||'',text:card.innerText.toLowerCase()});
      });
    });
    clickSection(restore);
  }

  let weight = type==='pals' ? Number(localStorage.getItem('pals-weight-kg')||0) : 0;
  const calcRules = {
    'Adenosine': w=>`Calculated: ${Math.min(.1*w,6).toFixed(2).replace(/\.00$/,'')} mg first dose · ${Math.min(.2*w,12).toFixed(2).replace(/\.00$/,'')} mg second dose`,
    'Amiodarone': w=>`Calculated: ${Math.min(5*w,300).toFixed(1).replace(/\.0$/,'')} mg (300 mg maximum)`,
    'Calcium chloride 10%': w=>`Calculated: ${(20*w).toFixed(0)} mg · ${(0.2*w).toFixed(1)} mL of 10% solution`,
    'Epinephrine (cardiac arrest)': w=>`Calculated: ${Math.min(.01*w,1).toFixed(3).replace(/0+$/,'').replace(/\.$/,'')} mg · ${Math.min(.1*w,10).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')} mL of 0.1 mg/mL`,
    'Lidocaine (cardiac arrest)': w=>`Calculated: ${w.toFixed(1).replace(/\.0$/,'')} mg`,
    'Magnesium sulfate': w=>`Calculated range: ${(25*w).toFixed(0)}–${Math.min(50*w,2000).toFixed(0)} mg`,
    'Naloxone': w=>`Calculated initial dose: ${Math.min(.01*w,.4).toFixed(3).replace(/0+$/,'').replace(/\.$/,'')} mg (opioid-naive maximum 0.4 mg)`,
    'Procainamide': w=>`Calculated: ${Math.min(15*w,1000).toFixed(0)} mg`,
    'Sodium bicarbonate': w=>`Calculated: ${w.toFixed(1).replace(/\.0$/,'')} mEq`
  };

  function convertMedicationTable() {
    const table = pane.querySelector('.drug-table');
    if (!table || pane.querySelector('.med-reference')) return;
    const rows = [...table.querySelectorAll('tbody tr')];
    const cards = rows.map(row=>{
      const cells=row.querySelectorAll('td'); const name=cells[0]?.innerText.replace(/\s+/g,' ').trim()||''; const dose=cells[1]?.innerHTML||''; const note=cells[2]?.innerHTML||'';
      const key=Object.keys(calcRules).find(k=>name.toLowerCase().startsWith(k.toLowerCase()));
      const calculation=weight&&key?calcRules[key](weight):'';
      return `<details class="med-card" id="pals-med-${slug(name)}" data-med="${esc(`${name} ${row.innerText}`.toLowerCase())}"><summary><strong>${esc(name)}</strong><span>${dose}</span></summary><div><p class="med-dose">${dose}</p>${calculation?`<p class="calculated-dose">${esc(calculation)}</p>`:''}<p>${note}</p></div></details>`;
    }).join('');
    const reference=document.createElement('section');reference.className='med-reference';reference.innerHTML=`<div class="med-search"><label for="medSearch">Search medication or indication</label><input id="medSearch" type="search" placeholder="Try epinephrine, SVT, anaphylaxis…"><span id="medCount"></span></div><div class="med-card-list">${cards}</div>`;
    table.closest('.protocol-table-wrap')?.replaceWith(reference);
    reference.querySelectorAll('.med-card').forEach(card=>card.addEventListener('toggle',()=>{if(card.open)history.replaceState(null,'',`#${config.hashes.meds}--${card.id}`);}));
    const search=reference.querySelector('input'); const apply=()=>{let shown=0;reference.querySelectorAll('.med-card').forEach(card=>{const match=!search.value||card.dataset.med.includes(search.value.toLowerCase());card.hidden=!match;if(match){shown++;if(search.value)card.open=true;}});reference.querySelector('#medCount').textContent=`${shown} medications shown`;};search.addEventListener('input',apply);apply();
  }

  function compactDetails() {
    pane.querySelectorAll('.drug-card').forEach(card=>{if(card.parentElement?.classList.contains('compact-detail'))return;const title=card.querySelector('.drug-name')?.textContent||'Medication';const first=card.querySelector('.drug-row-val')?.textContent||'';const details=document.createElement('details');details.className='compact-detail drug-detail';details.id=`${type}-drug-${slug(title)}`;details.innerHTML=`<summary><strong>${esc(title)}</strong><span>${esc(first)}</span></summary>`;card.before(details);details.appendChild(card);details.addEventListener('toggle',()=>{if(details.open)history.replaceState(null,'',`#${config.hashes[pane.dataset.section]}--${details.id}`);});});
    pane.querySelectorAll('.callout').forEach(callout=>{const label=callout.querySelector('.callout-label')?.textContent||'';if(!/reversible|contraindication|consideration|checklist|causes/i.test(label)||callout.parentElement?.classList.contains('compact-detail'))return;const details=document.createElement('details');details.className=`compact-detail callout-detail ${[...callout.classList].find(c=>['danger','warn','info','ok','purple'].includes(c))||''}`;details.innerHTML=`<summary><strong>${esc(label)}</strong><span>Reference detail</span></summary>`;callout.before(details);details.appendChild(callout);});
  }

  function addAlsMedicationFinder() {
    if(type!=='als'||!medicationIndex.length||pane.querySelector('.med-finder'))return;
    const overview=pane.querySelector('.algorithm-overview');
    overview?.insertAdjacentHTML('afterend','<details class="med-finder"><summary>Medication finder</summary><div><label for="alsMedSearch">Search medication or indication</label><input id="alsMedSearch" type="search" placeholder="Try epinephrine, SVT, opioid…"><div id="alsMedResults"></div></div></details>');
    const search=pane.querySelector('#alsMedSearch'); const results=pane.querySelector('#alsMedResults');
    const apply=()=>{const q=search.value.trim().toLowerCase();const matches=q?medicationIndex.filter(item=>`${item.name} ${item.text}`.toLowerCase().includes(q)).slice(0,8):[];results.innerHTML=matches.map(item=>`<button type="button" data-med-section="${item.section}" data-med-name="${esc(item.name)}"><strong>${esc(item.name)}</strong><span>${esc(item.preview)} · ${esc(labels[item.section])}</span></button>`).join('');};
    search.addEventListener('input',apply);results.addEventListener('click',event=>{const button=event.target.closest('[data-med-section]');if(!button)return;clickSection(button.dataset.medSection);requestAnimationFrame(()=>{const card=[...pane.querySelectorAll('.compact-detail')].find(detail=>detail.textContent.includes(button.dataset.medName));if(card instanceof HTMLDetailsElement)card.open=true;card?.scrollIntoView({block:'center'});});});
  }

  function addWeightContext() {
    if(type!=='pals'||pane.querySelector('.weight-context'))return;
    pane.insertAdjacentHTML('afterbegin',`<section class="weight-context" aria-label="Measured weight context"><div><label for="palsWeight">Measured weight</label><div class="weight-input"><input id="palsWeight" type="number" min="0.5" max="200" step="0.1" inputmode="decimal" value="${weight||''}" placeholder="Enter"><span>kg</span></div></div><p>${weight?`Calculations shown for ${weight} kg. Independently verify every dose and concentration.`:'No weight entered — formulas and maximum doses are shown only.'}</p><button type="button" id="clearWeight"${weight?'':' hidden'}>Clear</button></section>`);
    pane.querySelector('#palsWeight').addEventListener('change',event=>{weight=Math.max(0,Math.min(200,Number(event.target.value)||0));weight?localStorage.setItem('pals-weight-kg',String(weight)):localStorage.removeItem('pals-weight-kg');clickSection(pane.dataset.section);});
    pane.querySelector('#clearWeight').addEventListener('click',()=>{weight=0;localStorage.removeItem('pals-weight-kg');clickSection(pane.dataset.section);});
  }

  function enhance() {
    if(pane.querySelector('.algorithm-overview'))return;
    const id=pane.dataset.section; const meta=config.meta[id]; const title=pane.querySelector('.sec-title');
    addWeightContext();
    if(title&&meta) title.insertAdjacentHTML('afterend',`<section class="algorithm-overview"><span>${esc(meta[0])}</span><p>${esc(meta[1])}</p></section>`);
    pane.querySelectorAll('.phase-label,.callout-label').forEach((label,index)=>{const owner=label.closest('.phase,.callout');if(!owner)return;owner.id=`${id}-${slug(label.textContent)}-${index}`;});
    const targets=[...pane.querySelectorAll('.phase,.callout')];
    if(title&&targets.length){const links=targets.slice(0,8).map(target=>`<a href="#${config.hashes[id]}--${target.id}" data-target="${target.id}">${esc(target.querySelector('.phase-label,.callout-label')?.textContent||'Section')}</a>`).join('');title.nextElementSibling.insertAdjacentHTML('afterend',`<nav class="subsection-jumps" aria-label="Within this section">${links}</nav>`);pane.querySelectorAll('[data-target]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.getElementById(link.dataset.target)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});history.replaceState(null,'',link.getAttribute('href'));}));}
    pane.querySelectorAll('.phase-label').forEach(label=>{if(/cycle|shock|rhythm check/i.test(label.textContent))label.closest('.phase')?.classList.add('algorithm-cycle');});
    compactDetails(); convertMedicationTable(); addAlsMedicationFinder();
    const requestedTarget=location.hash.split('--')[1];
    if(requestedTarget) requestAnimationFrame(()=>{const target=document.getElementById(requestedTarget);if(target instanceof HTMLDetailsElement)target.open=true;target?.scrollIntoView({block:'start'});});
  }
  const observer=new MutationObserver(()=>enhance());observer.observe(pane,{childList:true});enhance();
  const requestedId=hashToId[initialRequestedHash]||localStorage.getItem(`${type}-section`);if(requestedId&&labels[requestedId])clickSection(requestedId);
  requestAnimationFrame(()=>requestAnimationFrame(()=>centerActiveTab()));
  window.addEventListener('hashchange',()=>{const id=hashToId[location.hash.slice(1).split('--')[0]];if(id)clickSection(id);});

  const cachePath=`/${type}/index.html`;
  const cacheState=async()=>{if(!navigator.onLine){status.textContent='Offline · cached reference';status.dataset.state='offline';return;}try{const cached='caches'in window&&await caches.match(cachePath);status.textContent=cached?'Offline ready':'Preparing offline access';status.dataset.state=cached?'ready':'checking';}catch{status.textContent='Online';}};
  if('serviceWorker'in navigator){navigator.serviceWorker.ready.then(cacheState).catch(cacheState);window.addEventListener('online',cacheState);window.addEventListener('offline',cacheState);}else status.textContent='Online · offline cache unavailable';
})();
