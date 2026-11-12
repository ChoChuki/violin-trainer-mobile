/* Pitch-name retrieval records retain their original storage key. */
(function(root) {
 'use strict';
 const key = id => `ap-memory-v1-${id}`;
 function load(id) { try { const v=JSON.parse(localStorage.getItem(key(id)) || '{}'); return v && typeof v==='object' && !Array.isArray(v) ? v : {}; } catch (_) {return {};} }
 function record(id,pc,correct,at=Date.now(),assisted=false,cold=true) {
  const state=load(id); state[pc]=TrainingCore.review(state[pc],correct,at,assisted,cold);
  TrainingCore.write(key(id),state); return state[pc];
 }
 // A learned name was given for another note: that name's boundary is unsure too.
 function confuse(id,pc,other,at=Date.now()) {
  const state=load(id); state[pc]=TrainingCore.confuse(state[pc],other);
  TrainingCore.write(key(id),state); return state[pc];
 }
 function due(id,classes) {
  const state=load(id);
  return classes.map(pc=>({pc,...(state[pc]||{streak:0,hits:0,attempts:0,nextAt:0})})).sort((a,b)=>a.nextAt-b.nextAt);
 }
 root.APMemory={load,record,confuse,due,INTERVALS:TrainingCore.DELAYS};
})(typeof window !== 'undefined' ? window : globalThis);
