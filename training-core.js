/* Shared learning rules. Intervals and weights are product heuristics, not diagnostic cutoffs. */
(function(root) {
 'use strict';
 const DELAYS = [60000, 3*60000, 12*60000, 3600000, 86400000, 3*86400000, 7*86400000];
 function choose(items, weights = items.map(() => 1)) {
  let pick = Math.random() * weights.reduce((a,b) => a+b, 0);
  for (let i=0; i<items.length; i++) { pick -= weights[i]; if (pick < 0) return items[i]; }
  return items[items.length-1];
 }
 // Rungs 1-4 (1, 3, 12, 60 min) can be earned inside one sitting. Day-scale rungs
 // need a recall made after a break ("cold"): a success right after labelled
 // feedback may rest on the previous note rather than on long-term memory.
 const SESSION_RUNGS = 4;
 function recentMiss(item) {
  if (!item) return null;
  if (typeof item.miss === 'number') return item.miss;
  return item.attempts ? 1 - (item.hits || 0) / item.attempts : null;
 }
 function fade(conf, factor) {
  const out = {};
  for (const [key, value] of Object.entries(conf || {})) if (value * factor >= .05) out[key] = value * factor;
  return out;
 }
 function review(old = {}, correct, at = Date.now(), assisted = false, cold = true) {
  const due = at >= (old.nextAt || 0);
  const success = correct && !assisted;
  let streak = success ? Math.min(DELAYS.length, (old.streak || 0) + (due ? 1 : 0)) : 0;
  if (success && due && !cold) streak = Math.min(streak, Math.max(old.streak || 0, SESSION_RUNGS));
  // Recency-weighted miss rate: lifetime totals stop reacting after long histories.
  const before = recentMiss(old), error = success ? 0 : correct ? .5 : 1;
  const miss = before === null ? (error ? .5 + error / 4 : .25) : before * .75 + error * .25;
  const next = {...old, streak, attempts:(old.attempts || 0)+1, hits:(old.hits || 0)+(correct?1:0), miss,
   nextAt: success && !due ? old.nextAt : at + DELAYS[Math.max(0, streak - 1)], lastAt:at};
  if (success && old.conf) next.conf = fade(old.conf, .85);
  return next;
 }
 // Remember what an item was mistaken for; older confusions fade.
 function confuse(old = {}, other) {
  const conf = fade(old.conf, .9);
  conf[other] = (conf[other] || 0) + 1;
  return {...old, conf};
 }
 function weight(item, at = Date.now()) {
  if (!item) return 2;
  const miss = recentMiss(item);
  return (item.nextAt <= at ? 2 : 1) + 2 * (miss === null ? .5 : miss);
 }
 function queueRepair(queue, key, ordinal) {
  if (!queue.some(x => x.key === key)) queue.push({key, after:ordinal+2+Math.floor(Math.random()*3)});
 }
 function takeRepair(queue, ordinal) {
  const eligible = queue.filter(x => x.after <= ordinal);
  if (!eligible.length || Math.random() >= .5) return null;
  const item = choose(eligible); queue.splice(queue.indexOf(item),1); return item.key;
 }
 function storageError() { if (root.dispatchEvent) root.dispatchEvent(new Event('training-storage-error')); }
 function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { storageError(); return false; }
 }
 function decodePreset(player, context, name) {
  player.loader.decodeAfterLoading(context,name);
  const deadline=Date.now()+15000;
  return new Promise((resolve,reject)=>{
   function check() {
    if (player.loader.loaded(name)) {resolve();return;}
    if (Date.now()>deadline) {reject(new Error('Sample decoding timed out'));return;}
    setTimeout(check,30);
   }
   check();
  });
 }
 function waitForAudio(context, at, valid) {
  return new Promise(resolve => {
   function check() {
    if (!valid() || context.state !== 'running') { resolve(false); return; }
    if (context.currentTime >= at) { resolve(true); return; }
    setTimeout(check, 20);
   }
   check();
  });
 }
 const voices = new Set();
 function neutralTone(context, at, midi, duration = .7) {
  const oscillator = context.createOscillator(), gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 440 * 2 ** ((midi-69)/12);
  gain.gain.setValueAtTime(0,at);
  gain.gain.linearRampToValueAtTime(.16,at+.025);
  gain.gain.setValueAtTime(.16,at+duration-.05);
  gain.gain.linearRampToValueAtTime(0,at+duration);
  oscillator.connect(gain); gain.connect(context.destination);
  voices.add(oscillator);
  oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  oscillator.start(at); oscillator.stop(at+duration);
 }
 // Interference burst: random, non-tempered pips disturb the echo of the previous
 // note (cf. Deutsch 1970). It reduces, but cannot rule out, relative-pitch carry-over.
 function maskTone(context, at, duration = 1) {
  const pip = .09, count = Math.max(4, Math.floor(duration / .1));
  for (let i = 0; i < count; i++) {
   const start = at + i * (duration / count);
   const oscillator = context.createOscillator(), gain = context.createGain();
   oscillator.type = 'triangle';
   oscillator.frequency.value = 180 * Math.pow(2200 / 180, Math.random());
   gain.gain.setValueAtTime(0, start);
   gain.gain.linearRampToValueAtTime(.11, start + .008);
   gain.gain.setValueAtTime(.11, start + pip - .012);
   gain.gain.linearRampToValueAtTime(0, start + pip);
   oscillator.connect(gain); gain.connect(context.destination);
   voices.add(oscillator);
   oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
   oscillator.start(start); oscillator.stop(start + pip);
  }
  return at + duration;
 }
 function cancelAudio() { for (const voice of voices) { try {voice.stop();} catch (_) {} } voices.clear(); }
 root.TrainingCore = {DELAYS, SESSION_RUNGS, choose, review, weight, recentMiss, confuse, queueRepair, takeRepair, write, storageError, decodePreset, waitForAudio, neutralTone, maskTone, cancelAudio};
})(typeof window !== 'undefined' ? window : globalThis);
