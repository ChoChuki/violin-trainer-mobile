/* Shared, framework-free absolute-pitch curriculum and assessment helpers.
 * No sound is played here.  The two instruments integrate it independently.
 * Learning gates are a proposed practice rule, not a validated diagnostic test.
 */
(function (root) {
    "use strict";
    const ORDER = [5, 4, 6, 3, 7, 2, 8, 1, 9, 0, 10, 11]; // F, neighbours, etc.
    const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
    });
    const day = (date = new Date()) => {
        const parts = Object.fromEntries(DAY_FORMAT.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    };
    const rand = (n) => Math.floor(Math.random() * n);
    const shuffle = (items) => {
        const a = items.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };
    const chromaDistance = (a, b) => { const d = Math.abs(a - b) % 12; return Math.min(d, 12 - d); };

    function learned(level) { return ORDER.slice(0, Math.max(1, Math.min(12, level))); }
    function boundaries(active) {
        if (active.length === 12) return [];
        const set = new Set(active), candidates = new Set();
        for (const pitch of active) {
            for (const delta of [-2, -1, 1, 2]) {
                const c = (pitch + delta + 12) % 12;
                if (!set.has(c)) candidates.add(c);
            }
        }
        return [...candidates].sort((a, b) => a - b);
    }
    // For 12/20-question informal checks, sample pitch classes independently.
    // For longer assessments, balance pitch classes and octave placements.
    // Never reorder the sequence to maximise jumps: the old objective leaked
    // "F/Other" via an almost perfect alternation of question categories.
    function makeSequence({from, to, total, known = null, previousMidi = null, knownWeights = null}) {
        if (!Number.isInteger(from) || !Number.isInteger(to) || to < from ||
            !Number.isInteger(total) || total < 1) return [];
        const inRange = Array.from({length: to - from + 1}, (_, i) => from + i);
        const available = [...new Set(inRange.map(p => p % 12))];
        const active = known === null ? available : known.filter(c => available.includes(c));
        const outside = known === null ? [] : boundaries(active).filter(c => available.includes(c));
        if (!active.length || (known !== null && active.length < 12 && !outside.length)) return [];
        const pools = new Map(available.map(c => [c, inRange.filter(p => p % 12 === c)]));
        // For course training, all answer classes share the same octave choices.
        // Otherwise a high/low register could itself reveal 'Other'.
        if (known !== null) {
            const classes = active.concat(outside);
            const octaves = classes.map(c => new Set(pools.get(c).map(m => Math.floor(m / 12) - 1)));
            const common = [...octaves[0]].filter(o => octaves.every(set => set.has(o)));
            if (common.length < 2) return [];
            for (const c of classes) {
                pools.set(c, pools.get(c).filter(m => common.includes(Math.floor(m / 12) - 1)));
            }
        }
        if (known !== null || total < 36) {
            // Categories must be chosen independently. Never prohibit adjacent
            // copies of a note *name*: it would recreate the F/Other alternating
            // sequence leak. Only exclude an identical MIDI target.
            const pKnown = outside.length ? Math.max(.5, active.length / (active.length + outside.length)) : 1;
            const result = [];
            let previous = previousMidi;
            for (let i = 0; i < total; i++) {
                const classes = outside.length && Math.random() >= pKnown ? outside : active;
                const chroma = classes === active && knownWeights
                    ? (() => {const w=classes.map(c=>Math.max(.25,Number(knownWeights[c])||1));let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let j=0;j<classes.length;j++){r-=w[j];if(r<0)return classes[j];}return classes[classes.length-1];})()
                    : classes[rand(classes.length)];
                const options = pools.get(chroma).filter(p => p !== previous);
                if (!options.length) return [];
                const chosen = options[rand(options.length)];
                result.push(chosen);
                previous = chosen;
            }
            return result;
        }
        // Formal 36/48-note assessment: preserve class and octave quotas,
        // then shuffle the MIDI multiset without adjacent identical targets.
        const counts = new Map();
        const bag = [];
        for (const chroma of shuffle(Array.from({length: total}, (_, i) => available[i % available.length]))) {
            const choices = pools.get(chroma);
            const least = Math.min(...choices.map(m => counts.get(m) || 0));
            const equal = choices.filter(m => (counts.get(m) || 0) === least);
            const picked = equal[rand(equal.length)];
            bag.push(picked);
            counts.set(picked, (counts.get(picked) || 0) + 1);
        }
        for (let attempt = 0; attempt < 200; attempt++) {
            const result = shuffle(bag);
            if (result[0] !== previousMidi && result.every((m, i) => !i || m !== result[i-1])) {
                return result;
            }
        }
        return []; // Rather than silently introduce a predictable sequence.
    }

    function loadCourse(id) {
        try {
            const value = JSON.parse(localStorage.getItem(`ap-course-v1-${id}`) || "null");
            if (value && Number.isInteger(value.level) && value.level >= 1 && value.level <= 12) {
                return {level: value.courseVersion === 3 ? value.level : Math.max(3, value.level),
                    courseVersion: 3,
                    // v18.5/v2.2.5 passes were vulnerable to sequence leakage.
                    // Preserve old data for audit, but don't reuse them to promote.
                    legacyGatePasses: Array.isArray(value.legacyGatePasses) ? value.legacyGatePasses
                        : (Array.isArray(value.gatePasses) ? value.gatePasses : []),
                    gatePasses: value.gateVersion === 2 && Array.isArray(value.gatePasses) ? value.gatePasses : [],
                    gateHistory: value.gateVersion === 2 && Array.isArray(value.gateHistory) ? value.gateHistory : [],
                    gateVersion: 2};
            }
        } catch (_) { /* storage may be unavailable */ }
        return {level: 3, courseVersion: 3, gatePasses: [], gateHistory: [], gateVersion: 2};
    }
    function saveCourse(id, course) {
        try { localStorage.setItem(`ap-course-v1-${id}`, JSON.stringify(course)); } catch (_) {}
    }
    function practiceToday(id) {
        try { return localStorage.getItem(`ap-practiced-day-${id}`) === day(); } catch (_) { return false; }
    }
    function lastPracticeAt(id) {
        try { return Number(localStorage.getItem(`ap-last-practice-at-${id}`)) || null; }
        catch (_) { return null; }
    }
    function markPractice(id) {
        try {
            localStorage.setItem(`ap-practiced-day-${id}`, day());
            localStorage.setItem(`ap-last-practice-at-${id}`, String(Date.now()));
        } catch (_) {}
    }
    function gateStats(records, newest, known) {
        const valid = (records || []).filter(r => r.result === 'answered' || r.result === 'timeout');
        const target = (r) => r.pitch % 12;
        const hit = r => r.guess === target(r);
        const other = r => !known.includes(target(r));
        const newly = valid.filter(r => target(r) === newest);
        const out = valid.filter(other);
        const trained = valid.filter(r => !other(r));
        return {newAttempts: newly.length, newHits: newly.filter(hit).length,
            outAttempts: out.length, outHits: out.filter(r => r.guess === 'out').length,
            knownAttempts: trained.length, knownHits: trained.filter(hit).length};
    }
    function applyGate(course, record) {
        if (record.level !== course.level || record.total !== 30 || !record.eligible) {
            return {advanced:false, qualifying:false, reason:'not-eligible'};
        }
        if (course.gateHistory.some(p => p.day === record.day)) {
            return {advanced:false, qualifying:false, reason:'already-checked'};
        }
        const known = learned(course.level);
        const newest = known[known.length - 1];
        const stats = gateStats(record.records, newest, known);
        const passed = Boolean(record.completed && !record.interrupted && record.correct >= 27 &&
            stats.knownAttempts > 0 && stats.knownHits / stats.knownAttempts >= .8 &&
            (!stats.outAttempts || stats.outHits / stats.outAttempts >= .8));
        const todayEntry = {day:record.day, at:record.at, passed, ...stats};
        // Keep seven calendar days of evidence. Only completed first-checks count.
        const oldest = record.at - 7 * 86400000;
        course.gateHistory = (course.gateHistory || []).filter(p => p.at >= oldest);
        course.gateHistory.push(todayEntry);
        course.gatePasses = passed ? [...(course.gatePasses || []), {day:record.day, at:record.at}].slice(-7) : [];
        const consecutive = course.gatePasses.length >= 2;
        const recent = course.gateHistory;
        const newAttempts = recent.reduce((n,p)=>n+p.newAttempts,0);
        const newHits = recent.reduce((n,p)=>n+p.newHits,0);
        const outAttempts = recent.reduce((n,p)=>n+p.outAttempts,0);
        const outHits = recent.reduce((n,p)=>n+p.outHits,0);
        const evidence = newAttempts >= 10 && newHits / newAttempts >= .8 &&
            (known.length === 12 || (outAttempts >= 4 && outHits / outAttempts >= .8));
        if (passed && consecutive && evidence && course.level < 12) {
            course.level++;
            course.gatePasses = [];
            course.gateHistory = [];
            return {advanced:true, qualifying:true, reason:'advanced', newAttempts};
        }
        return {advanced:false, qualifying:passed,
            reason:passed ? (consecutive ? 'need-evidence' : 'one-pass') : 'failed', newAttempts};
    }

    function dbFor(id) {
        if (!('indexedDB' in root)) return Promise.resolve(null);
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(`ap-training-data-${id}`, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('trials')) db.createObjectStore('trials', {keyPath: 'id'});
                    if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', {keyPath: 'id'});
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (_) { resolve(null); }
        });
    }
    async function putRows(id, store, rows) {
        const db = await dbFor(id);
        if (!db) {
            // Fallback is append-only, bounded, and never cleared during an app update.
            try {
                const key = `ap-fallback-${id}-${store}`;
                const saved = JSON.parse(localStorage.getItem(key) || '[]');
                localStorage.setItem(key, JSON.stringify(saved.concat(rows).slice(-4000)));
            } catch (_) {}
            return;
        }
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(store, 'readwrite');
                for (const row of rows) tx.objectStore(store).put(row);
                tx.oncomplete = () => { db.close(); resolve(); };
                tx.onerror = () => { db.close(); resolve(); };
            } catch (_) { db.close(); resolve(); }
        });
    }
    async function allRows(id, store) {
        const db = await dbFor(id);
        if (!db) {
            try { return JSON.parse(localStorage.getItem(`ap-fallback-${id}-${store}`) || '[]'); }
            catch (_) { return []; }
        }
        return new Promise((resolve) => {
            try {
                const tx = db.transaction(store, 'readonly');
                const request = tx.objectStore(store).getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
                tx.oncomplete = () => db.close();
            } catch (_) { db.close(); resolve([]); }
        });
    }
    function median(values) {
        if (!values.length) return null;
        const sorted = values.slice().sort((a, b) => a - b);
        return sorted.length % 2 ? sorted[Math.floor(sorted.length / 2)]
            : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    }
    function metrics(rows) {
        const eligible = rows.filter((r) => r.result !== 'interrupted' && r.result !== 'audio-error');
        const successes = eligible.filter((r) => r.correct);
        const chroma = eligible.filter((r) => typeof r.guess === 'number');
        const times = successes.map((r) => r.rtMs).filter((t) => Number.isFinite(t));
        return {total: eligible.length, correct: successes.length, medianRt: median(times),
            meanError: chroma.length ? chroma.reduce((sum, r) => sum + chromaDistance(r.target % 12, r.guess), 0) / chroma.length : null};
    }
    root.APPitchScience = {ORDER, day, learned, boundaries, makeSequence, loadCourse, saveCourse,
        practiceToday, lastPracticeAt, markPractice, applyGate, putRows, allRows, metrics};
}(window));
