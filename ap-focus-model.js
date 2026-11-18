/* The focused AP course uses the same pitch classes, database and clock as the host. */
(function (root) {
    'use strict';
    const protocol = 7;
    const sourceVersion = 'iowa-prototype-1';
    const notes = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
    const order = root.APPitchScience.ORDER;
    const validSet = a => Array.isArray(a) && a.length > 0 && a.length <= 12 &&
        a.every(n => Number.isInteger(n) && n >= 0 && n < 12) && new Set(a).size === a.length;
    const sameSet = (a,b) => validSet(a) && a.length === b.length && b.every(n => a.includes(n));
    const otherInstrument = instrument => instrument === 'violin' ? 'piano' : 'violin';
    const label = midi => notes[midi % 12] + (Math.floor(midi / 12) - 1);
    const isFocus = row => row?.protocol === protocol && row.sourceVersion === sourceVersion;
    const scored = row => row.result === 'answered' || row.result === 'assisted';
    const first = row => row.result === 'answered' && row.replayed === 0;
    const isTarget = row => row.known.includes(row.pitch % 12);
    const correct = row => row.result === 'answered' && row.guess === (isTarget(row) ? row.pitch % 12 : 'out');
    function defaults(known = [5]) {
        return {known: [...known], share: 0, size: 24, hit: 75, falseAlarm: 25};
    }
    function validSettings(s) {
        return s && validSet(s.known) && [0, .2, .5].includes(s.share) && [12,24,36,48,60].includes(s.size) &&
            Number.isInteger(s.hit) && s.hit >= 50 && s.hit <= 100 &&
            Number.isInteger(s.falseAlarm) && s.falseAlarm >= 0 && s.falseAlarm <= 50;
    }
    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    function pickMidi(pc, previous) {
        return root.TrainingCore.choose([60 + pc, 72 + pc, 84 + pc].filter(n => n !== previous));
    }
    function plan(settings, mode, instrument, weights = {}) {
        const n = mode === 'cold' ? 12 : settings.size;
        const known = settings.known;
        const outside = order.filter(pc => !known.includes(pc));
        const nOther = outside.length ? Math.round(n / 4) : 0;
        const nTarget = n - nOther;
        const extra = mode === 'learn' ? Math.min(Math.floor(nTarget / 5), Math.max(0, nTarget - known.length)) : 0;
        let targetPCs = [];
        while (targetPCs.length < nTarget - extra) targetPCs.push(...shuffle(known));
        targetPCs = targetPCs.slice(0, nTarget - extra);
        for (let i = 0; i < extra; i++) {
            targetPCs.push(root.TrainingCore.choose(known, known.map(pc => weights[pc] || 1)));
        }
        const foilWeights = outside.map(pc => {
            const d = Math.min(...known.map(k => root.APPitchScience.chromaDistance(pc,k)));
            return d === 1 ? 3 : d === 2 ? 2 : 1;
        });
        for (let i = 0; i < nOther; i++) targetPCs.push(root.TrainingCore.choose(outside,foilWeights));
        const secondary = mode === 'cold' ? 0 : Math.round(n * settings.share);
        const instruments = shuffle([...Array(secondary).fill(otherInstrument(instrument)), ...Array(n - secondary).fill(instrument)]);
        return shuffle(targetPCs).map((pc,i) => ({pc, instrument: instruments[i]}));
    }
    function counts(rows) {
        const usable = rows.filter(scored);
        const targets = usable.filter(isTarget);
        const outsiders = usable.filter(row => !isTarget(row) && first(row));
        return {hits: targets.filter(row => first(row) && correct(row)).length, targets: targets.length,
            alarms: outsiders.filter(row => row.known.includes(row.guess)).length, outside: outsiders.length,
            assisted: usable.filter(row => row.replayed > 0).length, total: usable.length};
    }
    function promotion(rows, sessions, settings, instrument, now = Date.now()) {
        const blocks = sessions.filter(s => isFocus(s) && s.completed && s.source === instrument &&
            ['learn','consolidate'].includes(s.kind) && sameSet(s.known, settings.known) &&
            s.started >= now - 14 * 86400000 && s.started <= now)
            .sort((a,b) => b.started - a.started).slice(0,6);
        const ids = new Set(blocks.map(s => s.id));
        const recent = rows.filter(r => isFocus(r) && ids.has(r.sessionId) && r.timbre === instrument && scored(r));
        const perNote = settings.known.map(pc => {
            const items = recent.filter(r => r.pitch % 12 === pc);
            return {pc, first: items.filter(first).length,
                rate: items.length ? items.filter(r => first(r) && correct(r)).length / items.length : 0};
        });
        const c = counts(recent);
        const hit = perNote.reduce((sum,p) => sum + p.rate, 0) / perNote.length;
        const fa = c.outside ? c.alarms / c.outside : null;
        const next = order.find(pc => !settings.known.includes(pc));
        return {blocks: ids.size, perNote, outside: c.outside, hit, fa, next,
            ready: next !== undefined && ids.size >= 2 && perNote.every(p => p.first >= 5) && c.outside >= 10 &&
                hit * 100 + 1e-9 >= settings.hit && fa * 100 <= settings.falseAlarm + 1e-9};
    }
    function outputClock(ctx, start, now = performance.now()) {
        const stamp = ctx.getOutputTimestamp?.();
        if (stamp && stamp.performanceTime > 0 && stamp.contextTime > 0) {
            const when = stamp.performanceTime + (start - stamp.contextTime) * 1000;
            if (Number.isFinite(when) && when >= now - 10 && when < now + 1500)
                return {when, method: 'output-estimate'};
        }
        return {when: now + (start - ctx.currentTime + (ctx.outputLatency || ctx.baseLatency || 0)) * 1000,
            method: 'context-estimate'};
    }
    root.APFocusModel = {protocol,sourceVersion,notes,order,label,validSet,sameSet,defaults,validSettings,otherInstrument,
        isFocus,scored,first,correct,isTarget,pickMidi,plan,counts,promotion,outputClock};
})(typeof window === 'undefined' ? globalThis : window);
