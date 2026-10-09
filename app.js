'use strict';
/* Independent violin-only practice app. No Pitch Trainer/piano global state. */
const STRINGS = [
  {name:'E5', midi:76}, {name:'A4', midi:69},
  {name:'D4', midi:62}, {name:'G3', midi:55}
];
const SEMITONES = 12;
const COLUMN = 52;
const X_START = 50;
const ROW_TOP = 21;
const ROW_HEIGHT = 49;
const RANGES = {beginner:[55,71],standard:[55,76],full:[55,88]};
const NOTES = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const STAFF_LETTERS = ['C','D','E','F','G','A','B'];
const el = Object.fromEntries(['language','status','mode','range','labels','play','next','replay','demo','answer','staff','board','boardScroll','positionNav'].map(id=>[id,document.getElementById(id)]));
const state = {lang:'en',mode:'single',range:'beginner',labels:true,active:false,answered:false,target:null,reference:null,ready:false,demo:false,serial:0,feedback:'free',feedbackVars:{}};
let context = null, player = null, preset = null, demoAbort = false, timerHandles = [];
const $ = (id) => document.getElementById(id);
const t = (key,vars={}) => {
  let value = (I18N[state.lang]||I18N.en)[key] ?? I18N.en[key] ?? key;
  return value.replace(/\{(\w+)\}/g,(_,k)=>String(vars[k]??''));
};
const noteName = midi => NOTES[midi%12] + (Math.floor(midi/12)-1);
const random = n => Math.floor(Math.random()*n);
function setStatus(key,vars={}){state.feedback=key;state.feedbackVars=vars;el.status.textContent=t(key,vars);}
function setAnswer(text){el.answer.textContent=text;}
function setLanguage(lang){
  state.lang=I18N[lang]?lang:'en';
  try{localStorage.setItem('violinEarTrainerLanguage',state.lang);}catch(_e){}
  document.documentElement.lang=state.lang;
  el.language.value=state.lang;
  ['title','subtitle','langLabel','modeLabel','rangeLabel','labelsLabel','boardLabel','scrollHint','footnote','score-label'].forEach((id,i)=>{
    const keys=['title','sub','language','mode','range','labels','board','swipe','foot','rangeTitle'];
    $(id).textContent=t(keys[i]);
  });
  for(const opt of el.mode.options)opt.textContent=t(opt.value);
  for(const opt of el.labels.options)opt.textContent=t(opt.value==='yes'?'show':'hide');
  for(const [id,key] of [['next','next'],['replay','replay'],['demo','demo']])el[id].textContent=t(key);
  updateButtons();
  setStatus(state.feedback,state.feedbackVars);
  if(state.active && state.answered)showFeedback();
}
function updateButtons(){
  el.play.textContent=t(state.active?'stop':'play');
  el.play.disabled=!state.ready||state.demo;
  el.next.disabled=!state.ready||!state.active||state.demo;
  el.replay.disabled=!state.ready||!state.active||state.demo;
  el.demo.disabled=!state.ready;
  el.demo.textContent=t('demo');
}
function availableNotes(){
  const [lo,hi]=RANGES[state.range];
  return Array.from({length:hi-lo+1},(_,i)=>lo+i);
}
function pickQuestion(){
  const candidates=availableNotes();
  if(state.mode==='single'){
    state.reference=null;
    state.target=candidates[random(candidates.length)];
  }else{
    state.reference=candidates[random(candidates.length)];
    const targets=candidates.filter(m=>m!==state.reference && Math.abs(m-state.reference)<=12);
    state.target=targets[random(targets.length)];
  }
}
function markPitch(midi,klass){
  for(const item of el.board.querySelectorAll(`[data-midi="${midi}"]`))item.classList.add(klass);
}
function resetHighlights(){
  for(const item of el.board.querySelectorAll('.place'))item.classList.remove('reference','correct','wrong','active');
}
function bestPlaceFor(midi){
  const matches=[...el.board.querySelectorAll(`[data-midi="${midi}"]`)];
  return matches.sort((a,b)=>Number(a.dataset.offset)-Number(b.dataset.offset))[0];
}
function ensureVisible(place){
  if(!place)return;
  const itemLeft=place.offsetLeft, itemRight=itemLeft+place.offsetWidth;
  const scrollLeft=el.boardScroll.scrollLeft, width=el.boardScroll.clientWidth;
  if(itemLeft<scrollLeft+5 || itemRight>scrollLeft+width-5){
    el.boardScroll.scrollTo({left:Math.max(0,itemLeft-width/2+place.offsetWidth/2),behavior:'smooth'});
  }
}
function renderBoard(){
  el.board.replaceChildren();
  const [min,max]=RANGES[state.range];
  for(const [row,string] of STRINGS.entries()){
    const y=ROW_TOP+row*ROW_HEIGHT;
    const line=document.createElement('div');line.className='string';line.style.top=`${y+21}px`;el.board.appendChild(line);
    const label=document.createElement('span');label.className='string-label';label.style.top=`${y+4}px`;label.textContent=string.name;el.board.appendChild(label);
    for(let offset=0;offset<=SEMITONES;offset++){
      const midi=string.midi+offset;
      const btn=document.createElement('button');btn.type='button';
      btn.className='place'+(offset===0?' open':'')+(midi<min||midi>max?' outside':'');
      btn.style.left=`${X_START+COLUMN*offset}px`;
      btn.style.top=`${y}px`;
      btn.dataset.midi=String(midi);btn.dataset.string=string.name;btn.dataset.offset=String(offset);
      btn.setAttribute('aria-label',`${string.name}, ${offset} ${noteName(midi)}`);
      const n=document.createElement('span');n.className='pitch';n.textContent=state.labels?noteName(midi):'·';
      const o=document.createElement('span');o.className='offset';o.textContent=String(offset);
      btn.append(n,o);
      btn.addEventListener('click',()=>handlePosition(midi));
      el.board.appendChild(btn);
    }
  }
  if(state.active){
    if(state.reference!==null)markPitch(state.reference,'reference');
    if(state.answered)applyResultColors();
  }
}
function selectNav(step){
  for(const button of el.positionNav.querySelectorAll('button'))button.classList.toggle('selected',Number(button.dataset.step)===step);
}
function setupNav(){
  el.positionNav.addEventListener('click',(ev)=>{
    const button=ev.target.closest('button');if(!button||state.demo)return;
    const step=Number(button.dataset.step);
    el.boardScroll.scrollTo({left:step*COLUMN,behavior:'smooth'});
    selectNav(step);
  });
  el.boardScroll.addEventListener('scroll',()=>{
    const step=Math.round(el.boardScroll.scrollLeft/COLUMN);
    selectNav(step>=9?9:step>=5?5:0);
  });
}
function svgNode(tag,attrs={}){
  const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));
  return e;
}
function addText(x,y,text,size=17,weight=700,fill='#51433b'){
  const item=svgNode('text',{x,y,'font-family':'system-ui,Arial,sans-serif','font-size':size,'font-weight':weight,'text-anchor':'middle',fill});
  item.textContent=text;el.staff.appendChild(item);
}
function diatonicIndex(midi){
  const classLetter=NOTES[midi%12][0];
  return (Math.floor(midi/12)-1)*7+STAFF_LETTERS.indexOf(classLetter);
}
function drawNote(midi,x,shownName=false){
  const center=112-(diatonicIndex(midi)-(4*7+2))*7;
  const index=diatonicIndex(midi); const bottomIndex=4*7+2;
  if(index<bottomIndex){
    for(let i=bottomIndex-2;i>=index;i-=2){const ly=112-(i-bottomIndex)*7;el.staff.appendChild(svgNode('line',{x1:x-20,y1:ly,x2:x+20,y2:ly,stroke:'#392f2a','stroke-width':2}));}
  }
  if(index>bottomIndex+8){
    for(let i=bottomIndex+10;i<=index;i+=2){const ly=112-(i-bottomIndex)*7;el.staff.appendChild(svgNode('line',{x1:x-20,y1:ly,x2:x+20,y2:ly,stroke:'#392f2a','stroke-width':2}));}
  }
  if(NOTES[midi%12].includes('♯'))addText(x-28,center+5,'♯',21,700);
  el.staff.appendChild(svgNode('ellipse',{cx:x,cy:center,rx:11,ry:6.8,fill:'#342d28'}));
  const up=index<bottomIndex+4;
  el.staff.appendChild(svgNode('line',{
    x1:x+(up?10:-10),y1:center,x2:x+(up?10:-10),y2:center+(up?-41:41),
    stroke:'#342d28','stroke-width':2
  }));
  if(shownName)addText(x,155,noteName(midi),14,750);
}
function renderStaff(){
  el.staff.replaceChildren();
  for(let i=0;i<5;i++){const y=56+i*14;el.staff.appendChild(svgNode('line',{x1:82,y1:y,x2:690,y2:y,stroke:'#77716b','stroke-width':1.5}));}
  addText(47,114,'𝄞',65,400,'#76543c');
  if(!state.active){addText(380,96,'♪',45,400,'#a69a8d');return;}
  if(state.mode==='single'){
    if(state.answered)drawNote(state.target,390,true);
    else addText(390,95,'?',36,600,'#9e8d7f');
  }else{
    drawNote(state.reference,state.answered?285:385,true);
    if(state.answered)drawNote(state.target,490,true);
    else addText(492,95,'?',32,700,'#a69a8d');
  }
}
function formatDistance(n){return n>0?`+${n}`:String(n);}
let selectedAnswer=null;
function applyResultColors(){
  if(!state.answered)return;
  markPitch(state.target,'correct');
  if(selectedAnswer!==state.target)markPitch(selectedAnswer,'wrong');
}
function showFeedback(){
  const actual=noteName(state.target);
  if(state.mode==='single'){
    setStatus(selectedAnswer===state.target?'correct':'wrong',{note:actual});
    setAnswer(actual);
  }else{
    const correct=formatDistance(state.target-state.reference);
    const selected=formatDistance(selectedAnswer-state.reference);
    setStatus(selectedAnswer===state.target?'pairRight':'pairWrong',{delta:correct,selected});
    setAnswer(`${noteName(state.reference)} → ${actual}  (${correct})`);
  }
}
function showFree(){
  setAnswer(t('free'));renderStaff();
}
function setReady(value){state.ready=value;updateButtons();}
async function initAudio(){
  setReady(false);setStatus('loading');
  try{
    if(typeof WebAudioFontPlayer!=='function'||!window._tone_0400_JCLive_sf2_file)throw new Error('Violin preset not available');
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)throw new Error('Web Audio API not available');
    context=new Context();player=new WebAudioFontPlayer();preset=window._tone_0400_JCLive_sf2_file;
    player.loader.decodeAfterLoading(context,'_tone_0400_JCLive_sf2_file');
    player.loader.waitLoad(()=>{setReady(true);setStatus('ready');});
  }catch(err){setStatus('error');console.error(err);}
}
async function unlockAudio(){if(context?.state==='suspended')await context.resume();}
function cancelSound(){if(player&&context)player.cancelQueue(context);}
async function playNotes(items){
  if(!state.ready||!player)return;
  try{
    await unlockAudio();
    cancelSound();
    const start=context.currentTime+0.045;
    for(const entry of items){
      player.queueWaveTable(context,context.destination,preset,start+entry.offset,entry.midi,entry.duration,.72);
    }
  }catch(e){setStatus('error');console.error(e);}
}
function playSingle(midi){return playNotes([{midi,offset:0,duration:.9}]);}
function playQuestion(){
  if(!state.active)return;
  return state.mode==='single'?playSingle(state.target):playNotes([
    {midi:state.reference,offset:0,duration:.62},
    {midi:state.target,offset:.82,duration:.9}
  ]);
}
function newQuestion(){
  if(!state.ready||state.demo)return;
  state.serial++;
  state.active=true;state.answered=false;selectedAnswer=null;
  pickQuestion();resetHighlights();
  if(state.reference!==null){markPitch(state.reference,'reference');ensureVisible(bestPlaceFor(state.reference));}
  setStatus(state.mode==='single'?'hear':'hearPair',{note:noteName(state.reference)});
  setAnswer(t(state.mode==='single'?'choose':'choosePair'));
  updateButtons();renderStaff();playQuestion();
}
function stopTest(){
  state.serial++;state.active=false;state.answered=false;state.reference=null;state.target=null;selectedAnswer=null;
  cancelSound();resetHighlights();updateButtons();setStatus('ready');showFree();
}
function handlePosition(midi){
  if(!state.ready||state.demo)return;
  if(state.active&&!state.answered){
    if(state.reference===midi){playSingle(midi);return;}
    state.answered=true;selectedAnswer=midi;
    cancelSound();resetHighlights();
    if(state.reference!==null)markPitch(state.reference,'reference');
    applyResultColors();showFeedback();renderStaff();ensureVisible(bestPlaceFor(state.target));playQuestion();
  }else if(state.active){playSingle(midi);}else{playSingle(midi);}
}
function syncSettings(){
  if(state.demo)return;
  const hadTest=state.active;
  if(hadTest)stopTest();
  state.mode=el.mode.value;
  state.range=el.range.value;
  state.labels=el.labels.value==='yes';
  renderBoard();renderStaff();
  if(hadTest)setStatus('ready');
}
const wait=ms=>new Promise(resolve=>{const h=setTimeout(()=>{timerHandles=timerHandles.filter(x=>x!==h);resolve();},ms);timerHandles.push(h);});
async function runDemo(){
  if(!state.ready)return;
  if(state.demo){demoAbort=true;return;}
  const snapshot={mode:state.mode,range:state.range,labels:state.labels,active:state.active,answered:state.answered,target:state.target,reference:state.reference,selectedAnswer,feedback:state.feedback,feedbackVars:{...state.feedbackVars},scroll:el.boardScroll.scrollLeft};
  demoAbort=false;state.demo=true;state.serial++;cancelSound();
  $('shell').classList.add('demo-running');
  el.demo.textContent=t('stop');
  el.play.disabled=el.next.disabled=el.replay.disabled=true;
  const wasActive=state.active;state.active=false;state.answered=false;resetHighlights();renderStaff();setAnswer(t('free'));
  try{
    setStatus('demoStatus');
    for(const pitch of [55,62,69,76]){
      if(demoAbort)break;
      markPitch(pitch,'active');ensureVisible(bestPlaceFor(pitch));
      await playSingle(pitch);await wait(750);
      resetHighlights();
    }
    if(!demoAbort){
      setStatus('demoPair');
      state.mode='interval';state.reference=62;state.target=66;state.active=true;state.answered=false;
      markPitch(62,'reference');renderStaff();await playQuestion();await wait(1900);
      if(!demoAbort){state.answered=true;selectedAnswer=66;resetHighlights();markPitch(62,'reference');applyResultColors();renderStaff();setAnswer('D4 → F♯4  (+4)');await wait(1350);}
    }
  }finally{
    cancelSound();resetHighlights();
    state.mode=snapshot.mode;state.range=snapshot.range;state.labels=snapshot.labels;state.active=wasActive;state.answered=snapshot.answered;
    state.target=snapshot.target;state.reference=snapshot.reference;selectedAnswer=snapshot.selectedAnswer;
    state.demo=false;demoAbort=false;
    $('shell').classList.remove('demo-running');
    renderBoard();
    el.boardScroll.scrollLeft=snapshot.scroll;
    if(state.active){
      if(state.reference!==null)markPitch(state.reference,'reference');
      if(state.answered){applyResultColors();showFeedback();}
      else{setStatus(snapshot.feedback,snapshot.feedbackVars);setAnswer(t(state.mode==='single'?'choose':'choosePair'));}
    }else{setStatus('demoDone');setAnswer(t('free'));}
    renderStaff();updateButtons();
  }
}
function init(){
  let language='en';
  try{language=localStorage.getItem('violinEarTrainerLanguage')||navigator.language||'en';}catch(_e){language=navigator.language||'en';}
  const lower=language.toLowerCase();
  language=lower.startsWith('zh')?'zh-TW':lower.startsWith('ja')?'ja':lower.startsWith('de')?'de':lower.startsWith('it')?'it':lower.startsWith('el')?'el':'en';
  state.lang=language;
  el.mode.addEventListener('change',syncSettings);
  el.range.addEventListener('change',syncSettings);
  el.labels.addEventListener('change',syncSettings);
  el.language.addEventListener('change',event=>{if(!state.demo){setLanguage(event.target.value);renderBoard();renderStaff();}});
  el.play.addEventListener('click',()=>{if(state.demo)return;if(state.active)stopTest();else newQuestion();});
  el.next.addEventListener('click',newQuestion);
  el.replay.addEventListener('click',()=>{if(!state.demo)playQuestion();});
  el.demo.addEventListener('click',runDemo);
  el.staff.addEventListener('click',()=>{if(!state.demo&&state.active)playQuestion();});
  setupNav();setLanguage(language);renderBoard();renderStaff();initAudio();
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
init();
