/* UI adapter: called by the existing app when testMode==='rpCourse'.
 * Uses the existing audio player and TrainingTracker; never creates a second clock.
 */
(function(root) {
 'use strict';
 const C = root.RelativePitchCourse;
 const $ = id=>document.getElementById(id);
 const shell=()=>document.querySelector('.app-shell');
 let state, session=null, audioVersion=0, heardAt=0, replayCount=0, selectedAnswer=null, started=false;
 const isMode=()=>typeof testMode!=='undefined'&&testMode==='rpCourse';
 const lang=()=>typeof currentLanguage!=='undefined'?currentLanguage:'en';
 const tx=key=>C.T(lang(),key);
 const config=()=>({level:Number($('rpLevel').value),activity:$('rpActivity').value,direction:$('rpDirection').value});
 const current=()=>session && !session.finished ? session.questions[Math.max(0,session.records.length-(answered?1:0))] : null;
 const isPosition=()=>session?.activity==='locate';
 const fmtNote=m=>typeof noteName==='function'?noteName(m):String(m);
 const rpMarkPitch=(m,style)=>document.querySelectorAll(`.keyboard [data-midi="${m}"]`).forEach(el=>el.classList.add(style));
 const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 function translate() {
  if(!started)return;
  for(const [id,key] of Object.entries({rpLevelLabel:'level',rpActivityLabel:'activity',rpDirectionLabel:'direction',rpIntro:'note',rpSampleSummary:'showExamples',rpReplay:'replay',rpCorrectAudio:'replayCorrect',rpSelectedAudio:'replaySelected',rpExport:'export',rpHistorySummary:'stats'})) $(id).textContent=tx(key);
  for(const el of $('rpActivity').options) el.textContent=tx(el.value);
  for(const el of $('rpDirection').options) el.textContent=tx(el.value);
  Array.from($('rpLevel').options).forEach((el,i)=>el.textContent=`L${i} · ${C.LEVELS[i].name}`);
  sampleButtons(); render();
 }
 function autoAdjustDirection(){
  if(AP_APP_ID!=='violin'||$('rpDirection').value!=='both')return;
  const level=Number($('rpLevel').value);
  const cfg=C.LEVELS[level];
  if(cfg&&!C.referencePool(SUPPORTED_MIN_MIDI,SUPPORTED_MAX_MIDI,cfg.distances,'both').length)
   $('rpDirection').value='higher';
 }
 function init() {
  if(started)return;
  state=C.load(AP_APP_ID); started=true;
  for(let n=0;n<C.LEVELS.length;n++){
    const el=document.createElement('option');el.value=String(n);$('rpLevel').appendChild(el);
  }
  $('rpLevel').value=String(Math.max(0,Math.min(C.LEVELS.length-1,state.level)));
  autoAdjustDirection();
  $('rpLevel').addEventListener('change',()=>{if(testActive&&isMode()){cancelRound();}state.level=Number($('rpLevel').value);autoAdjustDirection();C.save(AP_APP_ID,state);sampleButtons();render();});
  for (const id of ['rpActivity','rpDirection']) $(id).addEventListener('change',()=>{if(testActive&&isMode())cancelRound();sampleButtons();render();});
  $('rpReplay').addEventListener('click',()=>{if(!current()||!isMode())return;replayCount++;TrainingTracker.activity('question');playQuestion(current());render();});
  $('rpCorrectAudio').addEventListener('click',()=>{const q=lastAnswered();if(q&&isMode())playPair(q.reference,q.target);});
  $('rpSelectedAudio').addEventListener('click',()=>{const q=lastAnswered();if(q&&isMode()&&Number.isInteger(selectedAnswer))playPair(q.reference,q.reference+(q.direction==='lower'?-selectedAnswer:selectedAnswer));});
  $('rpExport').addEventListener('click',()=>{const blob=new Blob([C.csv(state.records)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`rp-${AP_APP_ID}-${today()}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);});
  translate();modeChanged();
 }
 function cancelRound(){
  audioVersion++; if(typeof player!=='undefined'&&player&&audioContext)player.cancelQueue(audioContext);
  session=null;replayCount=0;selectedAnswer=null;testActive=false;answered=false;
  currentMidi=null;currentReferenceMidi=null;questionSerial++;
  resetKeyboardColors();updatePlayButton();
 }
 function modeChanged(){
  if(!started)return;
  const chosen=$('modeSelect').value==='rpCourse';
  $('rpPanel').hidden=!chosen;
  if(!chosen){shell().classList.remove('rp-mode','rp-naming','rp-position');return;}
  shell().classList.add('rp-mode');
  render();
 }
 function sampleButtons() {
  if(!started)return;
  const box=$('rpSamples');box.replaceChildren();
  const level=Number($('rpLevel').value);
  if(!C.LEVELS[level])return;
  const items=C.LEVELS[level].distances;
  for(const distance of items){
   const b=document.createElement('button');b.className='secondary rp-sample';b.type='button';
   b.textContent=`▶ ${C.label(distance,lang())}`;
   b.setAttribute('aria-label',`${tx('sample')} ${C.name(distance,lang())}`);
   b.addEventListener('click',()=>{if(testActive&&isMode())return;TrainingTracker.activity('question');APPitchScience.markPractice(AP_APP_ID);
    const direction=Math.random()<.5?'higher':'lower';
    const pool=C.referencePool(SUPPORTED_MIN_MIDI,SUPPORTED_MAX_MIDI,[distance],direction);
    if(!pool.length)return;
    const ref=pool[Math.floor(Math.random()*pool.length)],target=ref+(direction==='lower'?-distance:distance);
    $('rpMessage').textContent=`${C.name(distance,lang())} · ${distance} · ${direction==='lower'?'↓':'↑'}`;
    playPair(ref,target);
   });box.appendChild(b);
  }
 }
 function makeOptions() {
  const box=$('rpAnswers');box.replaceChildren();
  const level=Number($('rpLevel').value),cfg=C.LEVELS[level];if(!cfg)return;
  const options=cfg.directionOnly?['higher','same','lower']:cfg.distances;
  for(const value of options){
   const b=document.createElement('button');b.type='button';b.className='secondary rp-choice';b.dataset.answer=String(value);
   b.textContent=typeof value==='number'?C.label(value,lang()):value==='higher'?'↑ '+tx('up'):value==='lower'?'↓ '+tx('down'):'＝ '+tx('same');
   b.addEventListener('click',()=>answer(value));box.appendChild(b);
  }
 }
 function lastAnswered(){if(!session||!session.records.length)return null;return session.questions[session.records.length-1];}
 function render(){
  if(!started)return;
  const chosen=$('modeSelect').value==='rpCourse';if(!chosen)return;
  const activity=session&&!session.finished?session.activity:config().activity;
  $('rpDirection').disabled=Number($('rpLevel').value)===0 || (!!session&&!session.finished);
  const locate=activity==='locate', naming=!locate;
  shell().classList.toggle('rp-naming',naming);
  shell().classList.toggle('rp-position',locate);
  $('rpAnswers').hidden=locate || (session?.finished??false);
  $('rpReference').hidden=!session||session.finished;
  $('rpReplay').hidden=!session||session.finished;
  const activeQ=current();
  $('rpReference').textContent=activeQ?`${tx('reference')}: ${fmtNote(activeQ.reference)}`:'';
  $('rpReplay').disabled=!activeQ;
  $('rpCorrectAudio').hidden=!(session&&session.records.length&&answered&&session.activity!=='test'&&!session.finished);
  $('rpSelectedAudio').hidden=$('rpCorrectAudio').hidden||selectedAnswer===null||isPosition();
  const busy=!!session&&!session.finished;
  for(const id of ['rpLevel','rpActivity'])$(id).disabled=busy;
  $('rpDirection').disabled=busy || Number($('rpLevel').value)===0;
  if(busy){
    $('rpQuestionNumber').textContent=`${session.records.length+(answered?0:1)} / ${session.total}`;
    $('rpMessage').textContent=$('rpMessage').textContent||tx('listen');
  }else if(session?.finished){
    $('rpQuestionNumber').textContent=`${session.total} / ${session.total}`;
  }else{
    $('rpQuestionNumber').textContent='';$('rpMessage').textContent=tx('ready');
  }
  if(typeof ready!=='undefined'&&ready) elements.nextButton.disabled=!(busy&&answered);
  const recent=state.records.slice(-200);
  const stat=(rows)=>rows.length?`${rows.filter(r=>r.correct).length}/${rows.length} · ${tx('independent')} ${rows.filter(r=>r.correct&&r.replayed===0).length}/${rows.length}`:tx('noData');
  const checks=recent.filter(r=>r.activity==='test');
  const learn=recent.filter(r=>['practice','review'].includes(r.activity));
  const location=recent.filter(r=>r.activity==='locate');
  $('rpStats').textContent=`${tx('practice')}: ${stat(learn)} | ${tx('test')}: ${stat(checks)} | ${tx('locate')}: ${stat(location)}`;
 }
 async function playPair(ref,target,prelude=null){
  if(!ready)return;
  const serial=++audioVersion;
  await ensureAudio();if(serial!==audioVersion||!isMode())return;
  player.cancelQueue(audioContext);
  let at=audioContext.currentTime+.05;
  const preset=typeof selectedPreset === "function" ? selectedPreset() : pianoPreset;
  if(prelude!==null){player.queueWaveTable(audioContext,audioContext.destination,preset,at,prelude,.5,.75);at+=.68;}
  player.queueWaveTable(audioContext,audioContext.destination,preset,at,ref,.58,.75);
  player.queueWaveTable(audioContext,audioContext.destination,preset,at+.80,target,.78,.75);
  heardAt=performance.now()+850+(prelude!==null?680:0);
 }
 function playQuestion(q){return playPair(q.reference,q.target,q.prelude);}
 function startNext(){
  if(!ready||!isMode())return;
  if(testActive&&!answered)return;
  if(!session||session.finished){
   const cfg=config();let direction=cfg.direction;
   const low=SUPPORTED_MIN_MIDI,high=SUPPORTED_MAX_MIDI;
   let total=cfg.activity==='test'?20:cfg.activity==='melody'?10:12;
   session=C.createRound({level:cfg.level,activity:cfg.activity,direction,low,high,total,history:state.records});
   if(session.error){session=null;setStatus('raw',{text:tx('challenge')});$('rpMessage').textContent=tx('challenge');render();return;}
   makeOptions();$('rpResults').hidden=true;$('rpResults').replaceChildren();
  }
  if(session.records.length===session.total){finish();return;}
  const q=session.questions[session.records.length];if(!q){finish();return;}
  audioVersion++;
  currentReferenceMidi=q.reference;currentMidi=q.target;
  testActive=true;answered=false;selectedAnswer=null;replayCount=0;questionSerial++;
  player.cancelQueue(audioContext);resetKeyboardColors();
  if(isPosition()){rpMarkPitch(q.reference,'reference');if(AP_APP_ID==='piano')showOctave(q.reference,'instant');}
  $('rpCorrectAudio').hidden=true;$('rpSelectedAudio').hidden=true;
  $('rpMessage').textContent=activityPrompt(session.activity,session.level);
  setStatus('raw',{text:activityPrompt(session.activity,session.level)});
  setAnswer('raw',{text:isPosition()?`${tx('reference')}: ${fmtNote(q.reference)}`:`${tx('listen')}`});
  for(const b of $('rpAnswers').querySelectorAll('button')) {b.disabled=false;b.classList.remove('rp-picked');}
  TrainingTracker.activity('question');APPitchScience.markPractice(AP_APP_ID);
  heardAt=performance.now()+50;updatePlayButton();render();playQuestion(q);
 }
 function activityPrompt(activity,level){return C.LEVELS[level].directionOnly?tx('directionTip'):activity==='locate'?tx('locationTip'):activity==='melody'?tx('melodyTip'):tx('listen');}
 function answerPosition(midi){if(!isMode())return false;if(!testActive||answered)return true;if(!isPosition())return true;answer(midi,true);return true;}
 function answer(value,position=false){
  if(!isMode()||!session||!testActive||answered)return;
  const q=current();if(!q)return;
  const isDirection=C.LEVELS[session.level].directionOnly;
  const selected=position?Number(value):value;
  const correct=position ? selected===q.target :isDirection?selected===q.direction:selected===q.distance;
  const rtMs=Math.max(0,Math.round(performance.now()-heardAt));
  const item={id:`${AP_APP_ID}-rp-${Date.now()}-${session.records.length}`,time:Date.now(),day:today(),site:AP_APP_ID,
   level:session.level,activity:session.activity,direction:q.direction,reference:q.reference,target:q.target,distance:q.distance,
   signed:q.signed,selected:position?null:selected,selectedMidi:position?selected:null,correct,replayed:replayCount,hints:0,rtMs};
  session.records.push(item);state.records.push(item);state.records=state.records.slice(-1500);C.save(AP_APP_ID,state);
  answered=true;TrainingTracker.activity('answer');
  if(!position){for(const b of $('rpAnswers').querySelectorAll('button')){b.disabled=true;if(b.dataset.answer===String(selected))b.classList.add('rp-picked');}}
  if(position){resetKeyboardColors();rpMarkPitch(q.reference,'reference');rpMarkPitch(q.target,'correct');if(!correct)rpMarkPitch(selected,'wrong');}
  if(session.activity==='test'){
   $('rpMessage').textContent=`${session.records.length} / ${session.total}`;
  }else{
   const explanation=`${C.name(q.distance,lang())} (${C.label(q.distance,lang())}) ${q.direction==='lower'?'↓':q.direction==='higher'?'↑':'＝'}`;
   $('rpMessage').textContent=correct?`${tx('correct')} · ${explanation}`:`${tx('wrong')}: ${explanation}`;
   if(!correct && !position && Number.isInteger(selected))selectedAnswer=selected;
   if(!correct && !position && !isDirection){
    const diff=selected-q.distance; $('rpMessage').textContent+=` · Δ${diff>0?'+':''}${diff}`;
   }
  }
  setStatus('raw',{text:$('rpMessage').textContent});
  if(session.records.length>=session.total){finish();}else{render();}
 }
 function finish(){
  if(!session||session.finished)return;
  session.finished=true;testActive=false;answered=true;
  player.cancelQueue(audioContext);audioVersion++;questionSerial++;
  const ok=session.records.filter(r=>r.correct).length;
  const clean=session.records.filter(r=>r.correct&&r.replayed===0).length;
  state.sessions.push({at:Date.now(),level:session.level,activity:session.activity,correct:ok,total:session.total,independent:clean});
  state.sessions=state.sessions.slice(-200);C.save(AP_APP_ID,state);
  $('rpMessage').textContent=`${tx('results')}: ${ok}/${session.total} · ${tx('independent')}: ${clean}/${session.total}`;
  setStatus('raw',{text:$('rpMessage').textContent});
  const result=$('rpResults');result.hidden=false;result.replaceChildren();
  const title=document.createElement('strong');title.textContent=$('rpMessage').textContent;result.appendChild(title);
  const mistakes=session.records.filter(r=>!r.correct).slice(0,12);
  for(const m of mistakes){const p=document.createElement('p');p.textContent=`${m.direction==='lower'?'↓':m.direction==='higher'?'↑':'='} ${C.name(m.distance,lang())} · ${m.distance}: ${m.selected===null?fmtNote(m.selectedMidi):m.selected}`;result.appendChild(p);}
  if(session.activity!=='test'&&session.total>=12&&ok/session.total>=.85){const note=document.createElement('p');note.textContent=`≥85% · ${tx('resume')}`;result.appendChild(note);}
  currentMidi=null;currentReferenceMidi=null;resetKeyboardColors();updatePlayButton();render();
 }
 function stop(){if(!isMode())return;cancelRound();$('rpResults').hidden=true;$('rpResults').replaceChildren();setStatus('raw',{text:tx('ready')});setAnswer('free');TrainingTracker.pause();render();}
 function changedLanguage(){translate();}
 return root.RPUI={init,modeChanged,startNext,stop,answerPosition,changedLanguage,render};
})(typeof window!=='undefined'?window:globalThis);
