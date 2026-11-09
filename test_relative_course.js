'use strict';
const assert=require('assert');
require('./relative-course.js');
const C=globalThis.RelativePitchCourse;
for (let lev=0;lev<13;lev++){
  for(const site of ['piano','violin']){
    const [low,high]=site==='piano'?[36,95]:[55,88];
    const direction=(site==='violin' && lev>=11)?'higher':'both';
    const s=C.createRound({level:lev,activity:'test',direction,low,high,total:200});
    assert(!s.error,`level ${lev} ${site}: ${s.error}`);
    const allowed=C.LEVELS[lev].distances;
    const refPool=C.referencePool(low,high,allowed,direction);
    for(const q of s.questions){
      assert(q.reference>=low&&q.reference<=high);
      assert(q.target>=low&&q.target<=high);
      assert(allowed.includes(q.distance));
      assert(q.target-q.reference===q.signed);
      assert(refPool.includes(q.reference));
      if(q.distance===0) assert(q.direction==='same');
    }
  }
}
let counts=new Map();
for(let j=0;j<2000;j++){
 const s=C.createRound({level:1,activity:'test',direction:'both',low:55,high:88,total:20});
 for(const q of s.questions)counts.set(q.distance,(counts.get(q.distance)||0)+1);
}
for(const num of C.LEVELS[1].distances){
 const p=counts.get(num)/40000;
 assert(Math.abs(p-.25)<.02,`nonuniform interval ${num}: ${p}`);
}
for(const lang of ['en','zh-TW','ja','de','it','el'])assert(C.T(lang,'course')!=='course');
console.log('Relative Pitch Course: 13 levels × 2 instruments, bounds, shared reference pool, uniform test sampling and six languages PASSED');
