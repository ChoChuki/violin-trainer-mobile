/* UI adapter: called by the existing app when testMode==='rpCourse'.
 * Uses the existing audio player and TrainingTracker; never creates a second clock.
 */
(function(root) {
 'use strict';
 const C = root.RelativePitchCourse;
 const $ = id=>document.getElementById(id);
 const shell=()=>document.querySelector('.app-shell');
 let state, session=null, audioVersion=0, heardAt=0, replayCount=0, selectedAnswer=null, started=false, questionAudioReady=false, feedbackBusy=false, historyReady=false;
 // Production ("sing / play first"): idle | listen | wait | mic | reveal | rate | done
 let produceStage='idle', micStream=null, micListener=null, micOpening=false, micTimer=null;
 const MIC_KEY='ear-produce-mic', PASS_CENTS=50;
 const isMode=()=>typeof testMode!=='undefined'&&testMode==='rpCourse';
 const lang=()=>typeof currentLanguage!=='undefined'?currentLanguage:'en';
 const tx=key=>C.T(lang(),key);
 const config=()=>({level:Number($('rpLevel').value),activity:$('rpActivity').value,direction:$('rpDirection').value});
 const current=()=>session && !session.finished ? session.questions[Math.max(0,session.records.length-(answered?1:0))] : null;
 const isPosition=()=>session?.activity==='locate';
 const isProduce=()=>session?.activity==='produce';
 const adaptive=activity=>activity==='practice'||activity==='review';
 const arrow=direction=>direction==='lower'?'↓':direction==='higher'?'↑':'＝';
 const fmtNote=m=>typeof noteName==='function'?noteName(m):String(m);
 const rpMarkPitch=(m,style)=>document.querySelectorAll(`.keyboard [data-midi="${m}"]`).forEach(el=>el.classList.add(style));
 const today=()=>APPitchScience.day();
 const autoNext=ms=>{if(typeof scheduleAutoNext==='function')scheduleAutoNext(ms);};
 const micAvailable=()=>!!(root.PitchDetect&&PitchDetect.supported());
 function translate() {
  if(!started)return;
  for(const [id,key] of Object.entries({rpLevelLabel:'level',rpActivityLabel:'activity',rpDirectionLabel:'direction',rpIntro:'lesson',rpTimbreLabel:'testTimbre',rpSampleSummary:'showExamples',rpCorrectAudio:'replayCorrect',rpSelectedAudio:'replaySelected',rpExport:'export',rpHistorySummary:'stats',rpProduceReveal:'produceReveal',rpProduceMatched:'produceMatched',rpProduceMissed:'produceMissed',rpMicText:'produceMic'})) $(id).textContent=tx(key);
  for(const el of $('rpActivity').options) el.textContent=tx(el.value);
  for(const el of $('rpDirection').options) el.textContent=tx(el.value);
  Array.from($('rpLevel').options).forEach((el,i)=>el.textContent=`L${i} · ${C.levelName(i,lang())}`);
  for(const button of $('rpAnswers').querySelectorAll('button')){
   const raw=button.dataset.answer;
   const value=/^\d+$/.test(raw)?Number(raw):raw;
   button.textContent=typeof value==='number'?C.label(value,lang())
    :value==='higher'?'↑ '+tx('up'):value==='lower'?'↓ '+tx('down'):'＝ '+tx('same');
  }
  for(const option of $('rpTimbre').options) option.textContent=tx(option.value);
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
  $('rpLevel').addEventListener('change',()=>{if((testActive||micOpening)&&isMode()){cancelRound();}state.level=Number($('rpLevel').value);autoAdjustDirection();C.save(AP_APP_ID,state);sampleButtons();render();});
  for (const id of ['rpActivity','rpDirection','rpTimbre']) $(id).addEventListener('change',()=>{if((testActive||micOpening)&&isMode())cancelRound();sampleButtons();render();});
  $('rpReplay').addEventListener('click',()=>{if(!current()||!isMode()||feedbackBusy||(session.activity==='test'&&!session.audioFailed))return;
    if(isProduce()){if(answered||!['wait','mic'].includes(produceStage))return;stopListening();produceStage='listen';}
    if(!answered) replayCount++;
    TrainingTracker.activity('question');
    questionPlayback(current());render();
  });
  $('rpCorrectAudio').addEventListener('click',()=>{const q=lastAnswered();if(q&&isMode()&&!feedbackBusy){TrainingTracker.activity('question');playPair(q.reference,q.target).catch(()=>{$('rpMessage').textContent=tx('audioRetry');});}});
  $('rpSelectedAudio').addEventListener('click',()=>{const q=lastAnswered();if(q&&isMode()&&Number.isInteger(selectedAnswer)){TrainingTracker.activity('question');playPair(q.reference,q.reference+(q.direction==='lower'?-selectedAnswer:selectedAnswer)).catch(()=>{$('rpMessage').textContent=tx('audioRetry');});}});
  $('rpExport').addEventListener('click',()=>{const blob=new Blob([C.csv(state.records)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`rp-${AP_APP_ID}-${today()}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);});
  $('rpProduceReveal').addEventListener('click',reveal);
  $('rpProduceMatched').addEventListener('click',()=>rateProduce(true));
  $('rpProduceMissed').addEventListener('click',()=>rateProduce(false));
  try{$('rpMicCheck').checked=localStorage.getItem(MIC_KEY)==='1'&&micAvailable();}catch(_){}
  $('rpMicCheck').addEventListener('change',()=>{
   const box=$('rpMicCheck');
   if(box.checked&&!micAvailable())box.checked=false;
   saveMicChoice();
   // Ask once now, inside the tap, and release the microphone again until a round starts.
   if(box.checked)PitchDetect.open().then(PitchDetect.close).catch(micRefused);
  });
  translate();modeChanged();
  C.hydrate(AP_APP_ID,state).then(()=>{historyReady=true;render();});
 }
 function saveMicChoice(){try{localStorage.setItem(MIC_KEY,$('rpMicCheck').checked?'1':'0');}catch(_){}}
 function micRefused(){$('rpMicCheck').checked=false;saveMicChoice();if(isMode())$('rpMessage').textContent=tx('micDenied');}
 function stopListening(){
  clearTimeout(micTimer);micTimer=null;
  if(micListener){const listener=micListener;micListener=null;listener.stop();}
 }
 function closeMic(){stopListening();if(root.PitchDetect)PitchDetect.close(micStream);micStream=null;}
 function cancelRound(){
  TrainingTracker.pause();audioVersion++; feedbackBusy=false; TrainingCore.cancelAudio(); if(typeof player!=='undefined'&&player&&audioContext)player.cancelQueue(audioContext);
  closeMic();produceStage='idle';
  if(session&&!session.finished&&session.records.length){const summary={id:session.id,at:Date.now(),level:session.level,activity:session.activity,completed:false,total:session.records.length,planned:session.total,protocol:C.PROTOCOL};state.sessions.push(summary);C.append(AP_APP_ID,'sessions',summary);C.save(AP_APP_ID,state);}
  session=null;replayCount=0;selectedAnswer=null;testActive=false;answered=false;questionAudioReady=false;
  currentMidi=null;currentReferenceMidi=null;questionSerial++;
  resetKeyboardColors();updatePlayButton();
 }
 function modeChanged(){
  if(!started)return;
  const chosen=$('modeSelect').value==='rpCourse';
  $('rpPanel').hidden=!chosen;
  if(!chosen){
   // Discard an unfinished round when leaving RP; never resume a stale question
   // after the user's instrument/mode/range settings change.
   if(session && !session.finished) cancelRound();
   closeMic();
   shell().classList.remove('rp-mode','rp-naming','rp-position');return;
  }
  shell().classList.add('rp-mode');
  render();
 }
 function sampleButtons() {
  if(!started)return;
  const box=$('rpSamples');box.replaceChildren();
  const level=Number($('rpLevel').value);
  if(!C.LEVELS[level])return;
  const items=C.LEVELS[level].distances;
  const sampleDirection=$('rpDirection').value==='lower'?'lower':'higher';
  const samplePool=C.referencePool(SUPPORTED_MIN_MIDI,SUPPORTED_MAX_MIDI,items,sampleDirection);
  const sampleReference=samplePool[Math.floor(samplePool.length/2)];
  for(const distance of items){
   const b=document.createElement('button');b.className='secondary rp-sample';b.type='button';
   b.textContent=`▶ ${C.label(distance,lang())}`;
   b.setAttribute('aria-label',`${tx('sample')} ${C.name(distance,lang())}`);
   b.addEventListener('click',()=>{if(testActive&&isMode())return;TrainingTracker.activity('question');APPitchScience.markPractice(AP_APP_ID);
    const direction=distance===0?'same':sampleDirection;
    const pool=C.referencePool(SUPPORTED_MIN_MIDI,SUPPORTED_MAX_MIDI,[distance],direction==='same'?'higher':direction);
    if(!pool.length)return;
    const ref=sampleReference,target=ref+(direction==='lower'?-distance:distance);
    $('rpMessage').textContent=`${C.name(distance,lang())} · ${distance} · ${arrow(direction)}`;
    playPair(ref,target).catch(()=>{$('rpMessage').textContent=tx('audioRetry');});
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
 function describe(q){return `${arrow(q.direction)} ${C.name(q.distance,lang())} (${C.label(q.distance,lang())})`;}
 function focusText(){
  const cfg=config(),list=C.focusList(state.memory,cfg.level,cfg.direction);
  return list.length?tx('due')+list.map(x=>`${arrow(x.dir)} ${C.label(x.distance,lang())}`).join('   '):tx('noData');
 }
 function render(){
  if(!started)return;
  const chosen=$('modeSelect').value==='rpCourse';if(!chosen)return;
  const activity=session&&!session.finished?session.activity:config().activity;
  const busy=!!session&&!session.finished;
  const locate=activity==='locate', produce=activity==='produce', naming=!locate;
  shell().classList.toggle('rp-naming',naming);
  shell().classList.toggle('rp-position',locate);
  $('rpAnswers').hidden=locate || produce || (session?.finished??false);
  $('rpReference').hidden=!session||session.finished||!locate;
  $('rpReplay').hidden=!session||session.finished;
  const activeQ=current();
  $('rpReference').textContent=activeQ&&locate?`${tx('reference')}: ${fmtNote(activeQ.reference)}`:'';
  $('rpReplay').textContent=tx(produce?'produceAgain':'replay');
  $('rpReplay').disabled=!activeQ||feedbackBusy||(session.activity==='test'&&!session.audioFailed)
   ||(produce&&(answered||!['wait','mic'].includes(produceStage)));
  // In locate rounds Replay already repeats the pair; an extra row would push the board down after a tap.
  $('rpCorrectAudio').hidden=!(session&&session.records.length&&answered&&session.activity!=='test'&&!session.finished)||isPosition();
  $('rpSelectedAudio').hidden=$('rpCorrectAudio').hidden||selectedAnswer===null||isPosition();
  $('rpProduce').hidden=!(busy&&produce);
  if(busy&&produce){
   const q=answered?lastAnswered():activeQ;
   $('rpProducePrompt').textContent=q?`${describe(q)} · ${tx('reference')}: ${fmtNote(q.reference)}`:'';
   $('rpProduceReveal').hidden=!['listen','wait','mic'].includes(produceStage);
   $('rpProduceReveal').disabled=!questionAudioReady||feedbackBusy;
   $('rpProduceRate').hidden=produceStage!=='rate';
  }
  for(const id of ['rpLevel','rpActivity','rpTimbre'])$(id).disabled=busy;
  $('rpDirection').disabled=busy || Number($('rpLevel').value)===0;
  if(busy){
    $('rpQuestionNumber').textContent=`${session.records.length+(answered?0:1)} / ${session.total}`;
    $('rpMessage').textContent=$('rpMessage').textContent||tx('listen');
  }else if(session?.finished){
    $('rpQuestionNumber').textContent=`${session.total} / ${session.total}`;
  }else{
    $('rpQuestionNumber').textContent='';$('rpMessage').textContent=tx('ready');
  }
  if(typeof ready!=='undefined'&&ready) elements.nextButton.disabled=!(busy&&answered&&!feedbackBusy);
  document.querySelector('.rp-history').hidden=busy;
  $('rpExamples').hidden=busy;
  $('rpIntro').hidden=busy;
  $('rpTimbre').parentElement.hidden=config().activity!=='test';
  $('rpMicRow').hidden=busy||config().activity!=='produce'||!micAvailable();
  $('rpFocus').hidden=busy||config().activity!=='review'||Number($('rpLevel').value)===0;
  if(busy) return;
  if(!$('rpFocus').hidden)$('rpFocus').textContent=focusText();
  $('rpIntro').textContent=tx(config().activity==='produce'?'produceTip':'lesson');
  const recent=state.sessions.filter(r=>r.completed&&r.protocol>=4&&r.level===config().level).slice(-6);
  $('rpStats').textContent=recent.length?recent.map(r=>`${new Date(r.at).toLocaleDateString(lang())} · ${tx(r.activity)} · ${tx(r.timbre)} · ${tx(r.direction)} · ${r.correct}/${r.total}`).join(' | '):tx('noData');
 }
 function tone(m,start,duration){
  const preset=typeof selectedPreset === 'function'?selectedPreset():pianoPreset;
  if(session&&!session.finished&&session.timbre==='neutral')TrainingCore.neutralTone(audioContext,start,m,duration);
  else if(!player.queueWaveTable(audioContext,audioContext.destination,preset,start,m,duration,.75))throw new Error('Audio unavailable');
 }
 async function playPair(ref,target,prelude=null){
  if(!ready)return false;
  const serial=++audioVersion;
  await ensureAudio();if(serial!==audioVersion||!isMode())return false;
  player.cancelQueue(audioContext);TrainingCore.cancelAudio();
  let at=audioContext.currentTime+.05;
  if(prelude!==null){tone(prelude,at,.5);at+=.68;}
  tone(ref,at,.58);tone(target,at+.8,.78);
  const latency=(audioContext.outputLatency||0)+(audioContext.baseLatency||0);
  heardAt=performance.now()+1000*(at+.8-audioContext.currentTime+latency);
  return TrainingCore.waitForAudio(audioContext,at+1.58+latency,()=>serial===audioVersion&&isMode()&&!document.hidden);
 }
 async function playOne(midi,duration=.9){
  if(!ready)return false;
  const serial=++audioVersion;
  await ensureAudio();if(serial!==audioVersion||!isMode())return false;
  player.cancelQueue(audioContext);TrainingCore.cancelAudio();
  const at=audioContext.currentTime+.05;
  tone(midi,at,duration);
  const latency=(audioContext.outputLatency||0)+(audioContext.baseLatency||0);
  return TrainingCore.waitForAudio(audioContext,at+duration+latency,()=>serial===audioVersion&&isMode()&&!document.hidden);
 }
 function playQuestion(q){return isProduce()?playOne(q.reference):playPair(q.reference,q.target,q.prelude);}
 function questionPlayback(q){
  // A displayed question is not answerable until its audio has been scheduled.
  // If playback fails, the user can retry without recording an incorrect trial.
  questionAudioReady=false;
  for(const b of $('rpAnswers').querySelectorAll('button'))b.disabled=true;
  return playQuestion(q).then(played=>{
   if(!isMode()||!testActive||answered||current()!==q)return;
   if(!played)throw new Error('Audio paused');
   session.audioFailed=false;
   questionAudioReady=true;
   for(const b of $('rpAnswers').querySelectorAll('button'))b.disabled=false;
   if(isProduce()){produceStage='wait';if(micStream)startListening(q);render();}
  }).catch(()=>{
   if(isMode()&&testActive&&!answered&&current()===q){
    session.audioFailed=true;$('rpReplay').disabled=false;
    if(isProduce())produceStage='wait';
    $('rpMessage').textContent=tx('audioRetry');
    setStatus('raw',{text:$('rpMessage').textContent});
   }
  });
 }
 function startNext(){
  if(!ready||!isMode())return;
  if(!historyReady){setStatus('raw',{text:tx('loadingRecords')});return;}
  if((testActive&&!answered)||feedbackBusy||micOpening)return;
  if(!session||session.finished){
   const cfg=config();let direction=cfg.direction;
   // Sung or played answers on the violin stay within first position (up to B5): a product
   // assumption for adult learners, so that the note can actually be played.
   const low=SUPPORTED_MIN_MIDI,high=cfg.activity==='produce'&&AP_APP_ID==='violin'?Math.min(SUPPORTED_MAX_MIDI,83):SUPPORTED_MAX_MIDI;
   let total=cfg.activity==='test'?20:cfg.activity==='melody'||cfg.activity==='produce'?10:12;
   session=C.createRound({level:cfg.level,activity:cfg.activity,direction,low,high,total,memory:state.memory});
   if(session.error){session=null;setStatus('raw',{text:tx('challenge')});$('rpMessage').textContent=tx('challenge');render();return;}
   session.id=`${AP_APP_ID}-rp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
   session.timbre=cfg.activity==='test'?$('rpTimbre').value:'instrument';
   makeOptions();$('rpResults').hidden=true;$('rpResults').replaceChildren();
   if(session.activity==='produce'&&$('rpMicCheck').checked&&micAvailable()&&!micStream){
    // The permission prompt may take a while; the first question waits for it.
    micOpening=true;const opening=session;
    PitchDetect.open().then(stream=>{if(session===opening)micStream=stream;else PitchDetect.close(stream);})
     .catch(micRefused)
     .finally(()=>{micOpening=false;if(session===opening&&isMode()&&!testActive)nextQuestion();});
    return;
   }
  }
  nextQuestion();
 }
 function nextQuestion(){
  if(!session||session.finished)return;
  if(session.records.length===session.total){finish();return;}
  if(adaptive(session.activity)){
   const repair=TrainingCore.takeRepair(session.repairs,session.records.length);
   session.questions[session.records.length]=C.question({...session,memory:state.memory,repair});
  }
  const q=session.questions[session.records.length];if(!q){finish();return;}
  audioVersion++;stopListening();
  currentReferenceMidi=q.reference;currentMidi=q.target;
  testActive=true;answered=false;questionAudioReady=false;selectedAnswer=null;replayCount=0;questionSerial++;
  produceStage=isProduce()?'listen':'idle';
  player.cancelQueue(audioContext);resetKeyboardColors();
  if(isPosition()){rpMarkPitch(q.reference,'reference');if(AP_APP_ID==='piano')showOctave(q.reference,'instant');}
  $('rpCorrectAudio').hidden=true;$('rpSelectedAudio').hidden=true;
  $('rpMessage').textContent=activityPrompt(session.activity,session.level);
  setStatus('raw',{text:activityPrompt(session.activity,session.level)});
  setAnswer('raw',{text:isPosition()?`${tx('reference')}: ${fmtNote(q.reference)}`:`${tx('listen')}`});
  for(const b of $('rpAnswers').querySelectorAll('button')) {b.disabled=false;b.classList.remove('rp-picked','rp-right','rp-wrong');}
  TrainingTracker.activity('question');APPitchScience.markPractice(AP_APP_ID);
  heardAt=performance.now()+50;updatePlayButton();render();
  questionPlayback(q);
 }
 function activityPrompt(activity,level){return activity==='produce'?tx('produceTip'):C.LEVELS[level].directionOnly?tx('directionTip'):activity==='locate'?tx('locationTip'):activity==='melody'?tx('melodyTip'):tx('listen');}
 function answerPosition(midi){if(!isMode())return false;if(!testActive||answered)return true;if(!isPosition())return true;answer(midi,true);return true;}
 function answer(value,position=false){
  if(!isMode()||!session||!testActive||answered||!questionAudioReady||isProduce())return;
  const q=current();if(!q)return;
  const isDirection=C.LEVELS[session.level].directionOnly;
  const selected=position?Number(value):value;
  const correct=position ? selected===q.target :isDirection?selected===q.direction:selected===q.distance;
  const rtMs=Math.max(0,Math.round(performance.now()-heardAt));
  const item={protocol:C.PROTOCOL,sessionId:session.id,timbre:session.timbre,repair:!!q.repair,id:`${AP_APP_ID}-rp-${Date.now()}-${session.records.length}`,time:Date.now(),day:today(),site:AP_APP_ID,
   level:session.level,activity:session.activity,direction:q.direction,reference:q.reference,target:q.target,distance:q.distance,
   signed:q.signed,selected:position?null:selected,selectedMidi:position?selected:null,correct,replayed:replayCount,hints:0,rtMs};
  session.records.push(item);state.records.push(item);C.append(AP_APP_ID,'trials',item);
  if(adaptive(session.activity)){
   const key=C.memoryKey(q);state.memory[key]=TrainingCore.review(state.memory[key],correct,Date.now(),replayCount>0||q.repair);
   if(!correct){
    // Remember which distance it was mistaken for: the review contrasts that pair.
    if(!isDirection&&Number.isInteger(selected))state.memory[key]=TrainingCore.confuse(state.memory[key],selected);
    TrainingCore.queueRepair(session.repairs,key,session.records.length);
   }
  }
  C.save(AP_APP_ID,state);
  answered=true;TrainingTracker.activity('answer');
  const feedback=session.activity!=='test';
  if(!position){for(const b of $('rpAnswers').querySelectorAll('button')){b.disabled=true;
   const mine=b.dataset.answer===String(selected),right=b.dataset.answer===String(isDirection?q.direction:q.distance);
   if(mine)b.classList.add(feedback?(correct?'rp-right':'rp-wrong'):'rp-picked');
   if(feedback&&right)b.classList.add('rp-right');}}
  if(position){resetKeyboardColors();rpMarkPitch(q.reference,'reference');rpMarkPitch(q.target,'correct');if(!correct)rpMarkPitch(selected,'wrong');}
  if(session.activity==='test'){
   $('rpMessage').textContent=`${session.records.length} / ${session.total}`;
  }else{
   $('rpMessage').textContent=correct?`✓ ${tx('correct')} · ${describe(q)}`:`✗ ${tx('wrong')}: ${describe(q)}`;
   if(!correct && !position && Number.isInteger(selected))selectedAnswer=selected;
   if(!correct && !position && !isDirection){
    const diff=selected-q.distance; $('rpMessage').textContent+=` · Δ${diff>0?'+':''}${diff}`;
   }
  }
  setStatus('raw',{text:$('rpMessage').textContent});
  if(session.activity!=='test'&&!correct){
   feedbackBusy=true;const feedbackSession=session;
   playPair(q.reference,q.target).then(()=>{}).catch(()=>{$('rpMessage').textContent=tx('audioRetry');}).finally(()=>{
    if(session!==feedbackSession||session.finished)return;feedbackBusy=false;
    if(session.records.length>=session.total)finish();else render();
   });
   render();
  }else if(session.records.length>=session.total){finish();}
  else{render();autoNext(session.activity==='test'?350:800);}
 }
 // ---- Production: sing, play or imagine the second note before hearing it ----
 function startListening(q){
  stopListening();
  // Wait for the played reference to die away before the microphone is read.
  const owner=session;
  micTimer=setTimeout(()=>{
   micTimer=null;
   if(session!==owner||!micStream||!isProduce()||!testActive||answered||current()!==q||produceStage!=='wait')return;
   produceStage='mic';$('rpMessage').textContent=tx('produceListening');render();
   const listener=PitchDetect.listen(audioContext,micStream,{timeoutMs:7000});
   micListener=listener;
   listener.promise.then(hit=>{
    if(micListener===listener)micListener=null;
    if(session!==owner||!testActive||answered||current()!==q||produceStage!=='mic')return;
    if(!hit){produceStage='wait';$('rpMessage').textContent=tx('produceNoPitch');render();return;}
    const cents=Math.round(PitchDetect.centsFromClass(hit.midi,q.target));
    recordProduce({correct:Math.abs(cents)<=PASS_CENTS,checkedBy:'mic',producedMidi:Math.round(hit.midi*100)/100,cents});
   });
  },250);
 }
 function reveal(){
  if(!isMode()||!isProduce()||!testActive||answered||!questionAudioReady||feedbackBusy)return;
  if(!['wait','mic'].includes(produceStage))return;
  const q=current();if(!q)return;
  stopListening();TrainingTracker.activity('question');
  produceStage='reveal';feedbackBusy=true;$('rpMessage').textContent=describe(q);render();
  const owner=session;
  playPair(q.reference,q.target).catch(()=>{$('rpMessage').textContent=tx('audioRetry');}).finally(()=>{
   if(session!==owner||session.finished||answered)return;
   feedbackBusy=false;produceStage='rate';render();
  });
 }
 function rateProduce(matched){
  if(!isMode()||!isProduce()||!testActive||answered||produceStage!=='rate')return;
  recordProduce({correct:matched,checkedBy:'self'});
 }
 function recordProduce({correct,checkedBy,producedMidi=null,cents=null}){
  const q=current();if(!q)return;
  const item={protocol:C.PROTOCOL,sessionId:session.id,timbre:session.timbre,repair:false,id:`${AP_APP_ID}-rp-${Date.now()}-${session.records.length}`,time:Date.now(),day:today(),site:AP_APP_ID,
   level:session.level,activity:session.activity,direction:q.direction,reference:q.reference,target:q.target,distance:q.distance,
   signed:q.signed,selected:null,selectedMidi:null,correct,replayed:replayCount,hints:0,rtMs:null,checkedBy,producedMidi,cents};
  session.records.push(item);state.records.push(item);C.append(AP_APP_ID,'trials',item);C.save(AP_APP_ID,state);
  answered=true;produceStage='done';TrainingTracker.activity('answer');
  const last=session.records.length>=session.total;
  if(checkedBy==='mic'){
   // Show what was heard, then play the intended pair for comparison.
   $('rpMessage').textContent=`${correct?'✓':'✗'} ${tx('produceYou')}: ${fmtNote(Math.round(producedMidi))} ${cents>0?'+':''}${cents}¢ · ${describe(q)}`;
   setStatus('raw',{text:$('rpMessage').textContent});
   feedbackBusy=true;const owner=session;render();
   playPair(q.reference,q.target).catch(()=>{}).finally(()=>{
    if(session!==owner||session.finished)return;feedbackBusy=false;
    if(last)finish();else{render();if(correct)autoNext(500);}
   });
  }else{
   $('rpMessage').textContent=`${correct?'✓':'✗'} ${tx('selfRated')} · ${describe(q)}`;
   setStatus('raw',{text:$('rpMessage').textContent});
   if(last)finish();else{render();autoNext(350);}
  }
 }
 function finish(){
  if(!session||session.finished)return;
  session.finished=true;testActive=false;answered=true;questionAudioReady=false;
  player.cancelQueue(audioContext);TrainingCore.cancelAudio();audioVersion++;questionSerial++;
  closeMic();produceStage='idle';
  const ok=session.records.filter(r=>r.correct).length;
  const clean=session.records.filter(r=>r.correct&&r.replayed===0&&!r.repair).length;
  const summary={id:session.id,protocol:C.PROTOCOL,completed:true,timbre:session.timbre,direction:session.direction,at:Date.now(),level:session.level,activity:session.activity,correct:ok,total:session.total,independent:clean};
  state.sessions.push(summary);C.append(AP_APP_ID,'sessions',summary);
  TrainingTracker.pause();C.save(AP_APP_ID,state);
  const result=$('rpResults');result.hidden=false;result.replaceChildren();
  const independent=session.records.filter(r=>!r.repair&&r.replayed===0);
  let rate=independent.length?independent.filter(r=>r.correct).length/independent.length:0;
  if(session.activity==='produce'){
   // Self-ratings and microphone checks are different kinds of evidence; never merge them.
   const part=(by,label)=>{const rows=session.records.filter(r=>r.checkedBy===by);return rows.length?`${tx(label)} ${rows.filter(r=>r.correct).length}/${rows.length}`:'';};
   $('rpMessage').textContent=`${tx('results')}: ${[part('mic','micChecked'),part('self','selfRated')].filter(Boolean).join(' · ')}`;
   rate=session.records.length?ok/session.records.length:0;
  }else{
   $('rpMessage').textContent=`${tx('results')}: ${ok}/${session.total} · ${tx('fresh')}: ${clean}/${independent.length}`;
  }
  setStatus('raw',{text:$('rpMessage').textContent});
  const title=document.createElement('strong');title.textContent=$('rpMessage').textContent;result.appendChild(title);
  if(session.activity!=='produce'){
   const aided=session.records.filter(r=>r.repair||r.replayed);
   const detail=document.createElement('p');detail.textContent=`${tx('assisted')}: ${aided.filter(r=>r.correct).length}/${aided.length}`;result.appendChild(detail);
  }
  if(session.activity==='test'){
   const chance=document.createElement('p');chance.textContent=`${tx('chance')}: ${(100/(C.LEVELS[session.level].directionOnly?3:C.LEVELS[session.level].distances.length)).toFixed(1)}%`;result.appendChild(chance);
  }

  const mistakes=session.records.filter(r=>!r.correct).slice(0,12);
  for(const m of mistakes){const p=document.createElement('p');
   const picked=m.activity==='produce'?(m.checkedBy==='mic'?`${fmtNote(Math.round(m.producedMidi))} ${m.cents>0?'+':''}${m.cents}¢`:tx('selfRated')):m.selected===null?fmtNote(m.selectedMidi):m.selected;
   p.textContent=`${arrow(m.direction)} ${C.name(m.distance,lang())} · ${m.distance}: ${picked}`;result.appendChild(p);}
  const note=document.createElement('p');
  // 90 % follows the criterion used in adult pitch-naming studies; 60 % is a product heuristic.
  const hint=rate<.6?'lowerLevelHint':rate>=.9&&session.activity==='test'?'nextLevelHint':'keepLevelHint';
  note.textContent=tx(hint)+' '+tx('roundBreak');result.appendChild(note);
  const counts=document.createElement('p');counts.textContent=tx('coverage')+': '+C.LEVELS[session.level].distances.map(d=>`${C.label(d,lang())}=${session.records.filter(r=>r.distance===d).length}`).join(' · ');result.appendChild(counts);

  currentMidi=null;currentReferenceMidi=null;resetKeyboardColors();updatePlayButton();render();
 }
 function stop(){if(!isMode())return;cancelRound();$('rpResults').hidden=true;$('rpResults').replaceChildren();setStatus('raw',{text:tx('ready')});setAnswer('free');TrainingTracker.pause();render();}
 function redraw(){
  if(!isMode()||!isPosition()||!session||session.finished)return;
  const q=answered?lastAnswered():current();if(!q)return;
  rpMarkPitch(q.reference,'reference');
  if(answered)rpMarkPitch(q.target,'correct');
 }
 function changedLanguage(){translate();}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&isMode()&&testActive)stop();});
 root.addEventListener('blur',()=>{if(isMode()&&testActive)stop();});
 root.addEventListener('pagehide',closeMic);
 // Called after Apply regardless of which mode was previously selected.
 function configurationApplied(){
  if(session){cancelRound();$('rpResults').hidden=true;$('rpResults').replaceChildren();}
  if(started)render();
 }
 return root.RPUI={init,modeChanged,configurationApplied,startNext,stop,answerPosition,changedLanguage,redraw,render};
})(typeof window!=='undefined'?window:globalThis);
