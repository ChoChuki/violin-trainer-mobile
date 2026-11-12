'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const repo = process.argv[2] || path.join(__dirname, '..');
const context = {console, Intl, Date, Math, localStorage:{getItem:()=>null}, window:null};
context.window = context;
vm.createContext(context);
for (const file of ['training-core.js', 'ap-science.js']) vm.runInContext(fs.readFileSync(path.join(repo,file),'utf8'),context,{filename:file});
const S = context.APPitchScience;
const runCases = [
  {from:60,to:71,known:[5],total:20000},
  {from:60,to:71,known:[5,4,6],total:20000},
  {from:60,to:95,known:[5,4,6],total:20000},
  {from:55,to:88,known:[5,4,6],total:20000},
  {from:60,to:71,known:null,total:20000},
  {from:60,to:95,known:null,total:20000},
  {from:60,to:71,known:[5],total:20000,knownWeights:{5:4}},
];
for (const c of runCases) {
  const a = Array.from(S.makeSequence({...c,previousMidi:64}));
  assert.equal(a.length,c.total,`expected ${c.total} AP questions`);
  assert.notEqual(a[0],64,'boundary with preceding AP session');
  let last=64, samePC=0;
  for(const p of a) { assert(Number.isInteger(p)); assert(p>=c.from && p<=c.to);assert.notEqual(p,last,'adjacent same MIDI');if(p%12===last%12)samePC++;last=p; }
  console.log('PASS AP',`${c.from}-${c.to}`,`known=${c.known}`,`count=${a.length}`,`same-pitch-class-different-octave=${samePC}`);
}
let prior=65;for(let i=0;i<6000;i++){
  const forced = i%2===0?5:4;
  const arr=S.makeSequence({from:60,to:95,total:1,known:[5,4,6],previousMidi:prior,forcedPC:forced});
  assert.equal(arr.length,1);assert.equal(arr[0]%12,forced);assert.notEqual(arr[0],prior);prior=arr[0];
}
assert.deepEqual(Array.from(S.makeSequence({from:60,to:71,total:1,known:[5],previousMidi:65,forcedPC:5})),[], 'defer impossible one-octave F->F forced repair');
const seq=Array.from(S.makeSequence({from:60,to:71,total:5000,known:[5]}));
let otherOther=0;for(let i=1;i<seq.length;i++)if(seq[i]%12!==5 && seq[i-1]%12!==5)otherOther++;
assert(otherOther>1000,'must not accidentally force F / Other alternation');
console.log('PASS forced reviews and no deterministic F/Other alternation; other-after-other=',otherOther);
