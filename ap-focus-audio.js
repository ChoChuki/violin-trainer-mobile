/* A bank holds twelve complete MP3s. Decode the original note on demand. */
(function (root) {
    'use strict';
    function create(context) {
        const cache = new Map();
        let source = null, noiseSource = null, noiseBuffer = null, generation = 0;
        function load(key, read) {
            if (!cache.has(key)) cache.set(key, read().catch(error => { cache.delete(key); throw error; }));
            return cache.get(key);
        }
        async function fetchAsset(name, json = false) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 15000);
            try {
                const response = await fetch('./ap-audio/' + name, {signal:controller.signal});
                if (!response.ok) throw Error('Audio download failed');
                return await (json ? response.json() : response.arrayBuffer());
            } finally {clearTimeout(timer);}
        }
        function stop() {
            generation++;
            if (source) {try {source.stop();} catch (_) {} source = null;}
            if (noiseSource) {try {noiseSource.stop();} catch (_) {} noiseSource = null;}
        }
        function playNoise(at) {
            if (!noiseBuffer) {
                const length = Math.round(context.sampleRate * .25);
                noiseBuffer = context.createBuffer(1, length, context.sampleRate);
                const samples = noiseBuffer.getChannelData(0);
                const ramp = Math.max(1, Math.round(context.sampleRate * .012));
                for (let i = 0; i < length; i++) {
                    const envelope = Math.min(1, i / ramp, (length - 1 - i) / ramp);
                    samples[i] = (2 * Math.random() - 1) * .07 * envelope;
                }
            }
            const noise = context.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.connect(context.destination);
            noise.onended = () => {noise.disconnect(); if (noiseSource === noise) noiseSource = null;};
            noise.start(at);
            noiseSource = noise;
            return at + noiseBuffer.duration + .06;
        }
        async function play(instrument, midi, mask = false) {
            stop();
            const token = generation;
            if (context.state !== 'running') await context.resume();
            const id = instrument + '-' + midi + '-1';
            const buffer = await load(id, async () => {
                const index = await load('index', () => fetchAsset('sources.json', true));
                const meta = index.samples.find(s => s.id === id);
                if (index.version !== APFocusModel.sourceVersion || !meta) throw Error('Missing recording');
                const bytes = await load(meta.bank, () => fetchAsset(meta.bank));
                if (bytes.byteLength < meta.offset + meta.bytes) throw Error('Incomplete audio bank');
                return context.decodeAudioData(bytes.slice(meta.offset, meta.offset + meta.bytes));
            });
            if (token !== generation || document.hidden || context.state !== 'running') throw Error('Playback interrupted');
            const node = context.createBufferSource();
            node.buffer = buffer;
            node.connect(context.destination);
            node.onended = () => {node.disconnect(); if (source === node) source = null;};
            const ready = context.currentTime + .04;
            const at = mask ? playNoise(ready) : ready;
            const clock = APFocusModel.outputClock(context, at);
            node.start(at);
            source = node;
            return {...clock, id};
        }
        return {play, stop};
    }
    root.APFocusAudio = {create};
})(window);
