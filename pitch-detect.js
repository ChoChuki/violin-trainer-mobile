/* Monophonic pitch estimate for the optional "sing / play first" check.
 * Audio is analysed on the device only; nothing is recorded, stored or uploaded.
 * The ±50 cent pass band is a product choice, not a validated intonation standard.
 */
(function(root) {
 'use strict';
 // McLeod pitch method: normalised square difference, first strong peak.
 function detect(buffer, sampleRate, minHz = 70, maxHz = 1700) {
  const n = buffer.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += buffer[i] * buffer[i];
  const rms = Math.sqrt(energy / n);
  if (rms < .006) return {freq:null, clarity:0, rms};
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(n - 2, Math.ceil(sampleRate / minHz));
  const nsdf = new Float32Array(maxLag + 2);
  for (let lag = 0; lag <= maxLag + 1; lag++) {
   let product = 0, norm = 0;
   for (let i = 0, end = n - lag; i < end; i++) {
    const a = buffer[i], b = buffer[i + lag];
    product += a * b; norm += a * a + b * b;
   }
   nsdf[lag] = norm ? 2 * product / norm : 0;
  }
  let pos = 0;
  while (pos <= maxLag && nsdf[pos] > 0) pos++;
  const peaks = [];
  while (pos <= maxLag) {
   while (pos <= maxLag && nsdf[pos] <= 0) pos++;
   let best = -1;
   while (pos <= maxLag && nsdf[pos] > 0) { if (best < 0 || nsdf[pos] > nsdf[best]) best = pos; pos++; }
   if (best >= minLag && best < maxLag) peaks.push(best);
  }
  if (!peaks.length) return {freq:null, clarity:0, rms};
  const top = Math.max(...peaks.map(p => nsdf[p]));
  const lag = peaks.find(p => nsdf[p] >= .93 * top);
  const a = nsdf[lag - 1], b = nsdf[lag], c = nsdf[lag + 1], curve = a - 2 * b + c;
  const shift = curve ? .5 * (a - c) / curve : 0;
  return {freq:sampleRate / (lag + shift), clarity:b, rms};
 }
 const toMidi = freq => 69 + 12 * Math.log2(freq / 440);
 // Distance in cents to the nearest octave of the target (singers may use any octave).
 function centsFromClass(midi, target) {
  let d = (midi - target) % 12;
  if (d > 6) d -= 12; else if (d < -6) d += 12;
  return 100 * d;
 }
 function median(values) {
  const sorted = values.slice().sort((x, y) => x - y), mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
 }
 // A note counts once it stays within ±spread semitones for holdMs.
 function createTracker({holdMs = 350, spread = .45, minClarity = .88, minFrames = 4} = {}) {
  let run = [];
  return {
   push(frame) {
    if (frame.midi === null || !(frame.clarity >= minClarity)) { run = []; return null; }
    if (run.length && Math.abs(frame.midi - median(run.map(f => f.midi))) > spread) run = [];
    run.push(frame);
    return run.length >= minFrames && frame.t - run[0].t >= holdMs
     ? {midi:median(run.map(f => f.midi)), frames:run.length} : null;
   },
   reset() { run = []; }
  };
 }
 function supported() { return !!(root.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
 function open() {
  if (!supported()) return Promise.reject(new Error('Microphone unsupported'));
  return navigator.mediaDevices.getUserMedia({video:false,
   audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}});
 }
 // Resolves with {midi, frames} for the first steady note, or null on timeout / stop().
 function listen(context, stream, {timeoutMs = 7000, intervalMs = 50} = {}) {
  const source = context.createMediaStreamSource(stream), analyser = context.createAnalyser();
  analyser.fftSize = 2048; source.connect(analyser);
  const data = new Float32Array(analyser.fftSize), tracker = createTracker(), started = performance.now();
  let timer = null, settle;
  const promise = new Promise(resolve => {
   settle = value => {
    if (timer === null) return;
    clearInterval(timer); timer = null;
    try { source.disconnect(); } catch (_) {}
    resolve(value);
   };
   timer = setInterval(() => {
    analyser.getFloatTimeDomainData(data);
    const found = detect(data, context.sampleRate), now = performance.now();
    const hit = tracker.push({midi:found.freq ? toMidi(found.freq) : null, clarity:found.clarity, t:now});
    if (hit) settle(hit); else if (now - started > timeoutMs) settle(null);
   }, intervalMs);
  });
  return {promise, stop:() => settle(null)};
 }
 function close(stream) { if (stream) for (const track of stream.getTracks()) track.stop(); }
 root.PitchDetect = {detect, toMidi, centsFromClass, createTracker, supported, open, listen, close};
})(typeof window !== 'undefined' ? window : globalThis);
