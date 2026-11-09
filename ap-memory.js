/* AP memory support: editable study cards and adaptive spaced review suggestions.
   The particular intervals below are heuristics, not the Ebbinghaus formula or a clinical guarantee.
   Saved independently per instrument and never used to restrict cold checks. */
(function(root){
 'use strict';
 const INTERVALS=[60_000,3*60_000,12*60_000,60*60_000,24*60*60_000,3*24*60*60_000,7*24*60*60_000];
 const key=id=>`ap-memory-v1-${id}`;
 function load(id){try{const v=JSON.parse(localStorage.getItem(key(id))||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{};}catch(_){return {};}}
 function save(id,s){try{localStorage.setItem(key(id),JSON.stringify(s));}catch(_){}}
 function record(id,pc,correct,at=Date.now()){
   const s=load(id), k=String(pc), old=s[k]||{streak:0,hits:0,attempts:0,nextAt:0};
   const streak=correct?Math.min(6,(old.streak||0)+1):0;
   s[k]={streak,attempts:(old.attempts||0)+1,hits:(old.hits||0)+(correct?1:0),
     nextAt:at+(correct?INTERVALS[streak]:INTERVALS[0]),lastAt:at};
   save(id,s);return s[k];
 }
 function due(id,classes,at=Date.now()){
   const s=load(id);
   return classes.map(pc=>({pc,...(s[String(pc)]||{streak:0,hits:0,attempts:0,nextAt:0})}))
    .sort((a,b)=>(a.nextAt||0)-(b.nextAt||0));
 }
 root.APMemory=Object.freeze({load,record,due,INTERVALS});
})(typeof window!=='undefined'?window:globalThis);
