const coreVitals = [
  { id:'rr', label:'Respiratory rate', unit:'/min', abnormal:value=>value<=8||value>=25 },
  { id:'spo2', label:'SpO₂', unit:'%', abnormal:value=>value<=91 },
  { id:'sbp', label:'Systolic BP', unit:'mmHg', abnormal:value=>value<=90||value>=220 },
  { id:'hr', label:'Heart rate', unit:'/min', abnormal:value=>value<=40||value>=131 },
  { id:'temp', label:'Temperature', unit:'°C', abnormal:value=>value<=35 },
];

const allChecks = [...document.querySelectorAll('input[type="checkbox"]')];
const vitalInputs = coreVitals.map(item=>document.getElementById(item.id));
const mental = document.getElementById('mental');
const state = document.getElementById('urgency-state');
const findingList = document.getElementById('finding-list');
const vitalNote = document.getElementById('vital-note');
const copyButton = document.getElementById('copy-summary');

function enteredVitals(){
  return coreVitals.map(item=>{
    const raw=document.getElementById(item.id).value;
    return {...item,raw,value:raw===''?null:Number(raw)};
  });
}

function assessment(){
  const selected=allChecks.filter(input=>input.checked);
  const emergency=selected.filter(input=>input.dataset.tier==='emergency');
  const modifiers=selected.filter(input=>input.dataset.tier==='urgent');
  const safeguards=selected.filter(input=>input.classList.contains('safeguard'));
  const vitals=enteredVitals();
  const abnormal=vitals.filter(item=>item.value!==null&&item.abnormal(item.value));
  const vitalsComplete=vitals.every(item=>item.value!==null)&&mental.value!=='';
  const altered=mental.value==='confusion';

  if(emergency.length){
    return {tier:'emergency',label:'Emergency response',title:'Activate emergency response / ED evaluation now',detail:'Initiate time-critical stabilization and transport according to local protocol. Do not delay care to complete this checklist.',selected,vitals,abnormal,vitalsComplete};
  }
  if(abnormal.length||altered||modifiers.length){
    return {tier:'urgent',label:'Same-day escalation',title:'Arrange urgent same-day in-person evaluation',detail:'Use the ED when deterioration, resource needs, transport risk, or clinician concern exceeds the capability of the available setting.',selected,vitals,abnormal,vitalsComplete};
  }
  if(safeguards.length===3&&vitalsComplete){
    return {tier:'lower',label:'Lower-acuity pathway',title:'No listed escalation trigger identified',detail:'A diagnosis-specific outpatient pathway may be reasonable with explicit return precautions and reassessment. This result does not establish that home care is safe.',selected,vitals,abnormal,vitalsComplete};
  }
  return {tier:'incomplete',label:'Assessment incomplete',title:'Lower urgency cannot be supported yet',detail:'Complete vital signs and all three safeguards. Blank or unchecked fields are not interpreted as normal.',selected,vitals,abnormal,vitalsComplete};
}

function render(){
  const result=assessment();
  state.className=`urgency-state urgency-state--${result.tier}`;
  state.innerHTML=`<span class="urgency-label">${result.label}</span><strong>${result.title}</strong><p>${result.detail}</p>`;

  const findings=result.selected.filter(input=>!input.classList.contains('safeguard')).map(input=>input.dataset.label);
  const vitalFindings=result.abnormal.map(item=>`${item.label}: ${item.value} ${item.unit} (marked abnormality)`);
  if(mental.value==='confusion') vitalFindings.push('Mental status: new confusion or altered mentation');
  const items=[...findings,...vitalFindings];
  findingList.innerHTML=items.length?items.map(item=>`<li>${item}</li>`).join(''):'<li>No findings selected</li>';

  if(result.abnormal.length||mental.value==='confusion'){
    const labels=[...result.abnormal.map(item=>`${item.label} ${item.value} ${item.unit}`),...(mental.value==='confusion'?['new confusion / altered mentation']:[])];
    vitalNote.className='vital-note is-abnormal';
    vitalNote.textContent=`Marked physiologic concern: ${labels.join('; ')}. Interpret in the full clinical context and escalate promptly.`;
  }else if(result.vitalsComplete){
    vitalNote.className='vital-note';
    vitalNote.textContent='All core vital fields entered; no NEWS2 single-parameter score-3 boundary is present. This does not exclude serious illness.';
  }else{
    vitalNote.className='vital-note';
    vitalNote.textContent='Enter available vital signs; incomplete values prevent a lower-acuity result.';
  }
}

function summaryText(){
  const result=assessment();
  const selected=result.selected.filter(input=>!input.classList.contains('safeguard')).map(input=>`- ${input.dataset.label}`);
  const vitalLines=result.vitals.map(item=>`- ${item.label}: ${item.value===null?'not entered':`${item.value} ${item.unit}`}`);
  vitalLines.push(`- Mental status: ${mental.value==='alert'?'alert / baseline':mental.value==='confusion'?'new confusion / altered mentation':'not entered'}`);
  const safeguards=allChecks.filter(input=>input.classList.contains('safeguard')).map(input=>`- ${input.dataset.label}: ${input.checked?'confirmed':'not confirmed'}`);
  return [
    'Adult Urgency & Disposition',
    `Guidance: ${result.label} — ${result.title}`,
    result.detail,
    '',
    'Selected escalation findings:',
    ...(selected.length?selected:['- None selected']),
    '',
    'Vital signs:',...vitalLines,
    '',
    'Lower-acuity safeguards:',...safeguards,
    '',
    'Clinical note: This checklist does not diagnose, exclude serious illness, or replace a validated triage scale, local protocol, or clinical judgment.',
    `Generated: ${new Date().toLocaleString()}`,
    'Source: noahpac.com/triage/',
  ].join('\n');
}

allChecks.forEach(input=>input.addEventListener('change',render));
vitalInputs.forEach(input=>input.addEventListener('input',render));
mental.addEventListener('change',render);

copyButton.addEventListener('click',()=>navigator.clipboard.writeText(summaryText()).then(()=>{
  const original=copyButton.textContent;copyButton.textContent='Copied';copyButton.classList.add('copied');
  setTimeout(()=>{copyButton.textContent=original;copyButton.classList.remove('copied')},1800);
}));

document.getElementById('reset-assessment').addEventListener('click',()=>{
  allChecks.forEach(input=>{input.checked=false});
  vitalInputs.forEach(input=>{input.value=''});
  mental.value='';render();document.getElementById('threats').scrollIntoView({behavior:'smooth',block:'start'});
});

render();
