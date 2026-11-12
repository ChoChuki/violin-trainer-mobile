/* Shared, framework-free absolute-pitch curriculum and assessment helpers.
 * No sound is played here.  The two instruments integrate it independently.
 * Results are descriptive training measurements, not an AP diagnosis.
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
    const chromaDistance = (a,b) => Math.min(Math.abs(a-b)%12,12-Math.abs(a-b)%12);
    function learned(level) { return ORDER.slice(0,Math.max(1,Math.min(12,level))); }
    function effectiveRange(from,to) {
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to > 127 || to-from < 11) return null;
        // A common full chromatic octave has every pitch class with equal register
        // support. Using the incomplete edge octave could leak the label by register.
        const first = Math.ceil(from / 12) * 12;
        const last = Math.floor((to - 11) / 12) * 12 + 11;
        return first <= last ? {from:first,to:last} : null;
    }
    // Avoid exact MIDI repeats between adjacent AP questions (including between
    // rounds), while retaining a weighted random distribution over every legal
    // pitch. On a single octave, repeating the *same* pitch class may sometimes
    // be impossible; this constraint then necessarily changes conditional odds.
    function makeSequence({from,to,total,known=null,knownWeights=null,previousMidi=null,forcedPC=null}) {
        if (!Number.isInteger(from)||!Number.isInteger(to)||from<0||to>127||to<from||
            !Number.isInteger(total)||total<1) return [];
        const all=Array.from({length:to-from+1},(_,i)=>from+i);
        const available=[...new Set(all.map(m=>m%12))];
        const active=known===null?available:known.filter(c=>available.includes(c));
        const outside=known===null?[]:available.filter(c=>!active.includes(c));
        if (!active.length) return [];
        const classes=active.concat(outside);
        const octaves=classes.map(c=>new Set(all.filter(m=>m%12===c).map(m=>Math.floor(m/12))));
        const common=[...octaves[0]].filter(o=>octaves.every(set=>set.has(o)));
        if (!common.length) return [];
        const own=active.map(c=>Math.max(1,Math.min(4,knownWeights?.[c]||1)));
        // "Other" receives roughly one trained label's total weight. Its concrete
        // notes favour semitone neighbours instead of very distant foils.
        const otherWeight=own.reduce((a,b)=>a+b,0)/own.length;
        const foil=outside.map(c=>{const gap=Math.min(...active.map(a=>chromaDistance(a,c)));return gap<=1?3:gap===2?2:1;});
        const foilTotal=foil.reduce((a,b)=>a+b,0);
        const weightedNotes=[];
        for (const pc of classes) {
            if (forcedPC !== null && pc !== forcedPC) continue;
            const learnedIndex=active.indexOf(pc), outsideIndex=outside.indexOf(pc);
            const weight=learnedIndex>=0 ? own[learnedIndex]
                : (foilTotal ? otherWeight*foil[outsideIndex]/foilTotal : 0);
            if (weight<=0) continue;
            for (const octave of common) weightedNotes.push({midi:12*octave+pc,weight:weight/common.length});
        }
        const result=[];
        let prior=previousMidi;
        for (let i=0;i<total;i++) {
            const eligible=weightedNotes.filter(note=>note.midi!==prior);
            if (!eligible.length) return []; // e.g. forced repair in a single octave
            const next=TrainingCore.choose(eligible,eligible.map(note=>note.weight)).midi;
            result.push(next); prior=next;
        }
        return result;
    }
    // C notes that start each complete octave of the effective range.
    function octaveBases(from,to) {
        const range=effectiveRange(from,to);
        if (!range) return [];
        return Array.from({length:(range.to-range.from+1)/12},(_,i)=>range.from+12*i);
    }

    function loadCourse(id) {
        try {
            const value=JSON.parse(localStorage.getItem(`ap-course-v1-${id}`)||'null');
            if (value && Number.isInteger(value.level) && value.level>=1 && value.level<=12)
                return {...value,courseVersion:4};
        } catch (_) {}
        return {level:3,courseVersion:4};
    }
    function saveCourse(id,course) { TrainingCore.write(`ap-course-v1-${id}`,course); }
    function practiceToday(id) {
        try { return localStorage.getItem(`ap-practiced-day-${id}`) === day(); } catch (_) { return false; }
    }
    // Both trainers share storage when served from one origin; a note heard on the
    // sibling site also ends a break. Other origins and devices remain undetectable.
    const SITE_IDS = ["piano", "violin"];
    function lastPracticeAt(id) {
        try {
            const stamps = [...new Set([id, ...SITE_IDS])]
                .map((site) => Number(localStorage.getItem(`ap-last-practice-at-${site}`)) || 0);
            return Math.max(...stamps) || null;
        } catch (_) { return null; }
    }
    function markPractice(id) {
        try {
            localStorage.setItem(`ap-practiced-day-${id}`, day());
            localStorage.setItem(`ap-last-practice-at-${id}`, String(Date.now()));
        } catch (_) {}
    }
    function dbFor(id, namespace = "ap") {
        if (!('indexedDB' in root)) return Promise.resolve(null);
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(`${namespace}-training-data-${id}`, 1);
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
    function fallbackRows(id,store,namespace = "ap") {
        try {return JSON.parse(localStorage.getItem(`${namespace}-fallback-${id}-${store}`)||'[]');}
        catch (_) {return [];}
    }
    const pageRows=new Map();
    const rowKey=(id,store,namespace)=>`${namespace}:${id}:${store}`;
    async function putRows(id,store,rows,namespace = "ap") {
        const key=rowKey(id,store,namespace),recent=pageRows.get(key)||new Map();
        for(const row of rows)recent.set(row.id,row);
        pageRows.set(key,recent);
        const fallback=()=>{
            const saved=new Map(fallbackRows(id,store,namespace).concat(rows).map(r=>[r.id,r]));
            TrainingCore.write(`${namespace}-fallback-${id}-${store}`,[...saved.values()]);
        };
        const db=await dbFor(id,namespace);
        if (!db) {fallback();return;}
        await new Promise(resolve=>{
            try {
                const tx=db.transaction(store,'readwrite');
                for (const row of rows) tx.objectStore(store).put(row);
                tx.oncomplete=()=>{db.close();resolve();};
                tx.onabort=()=>{db.close();fallback();resolve();};
            } catch (_) {db.close();fallback();resolve();}
        });
    }
    async function allRows(id,store,namespace = "ap") {
        const recent=[...(pageRows.get(rowKey(id,store,namespace))||new Map()).values()];
        const fallback=[...new Map(fallbackRows(id,store,namespace).concat(recent).map(r=>[r.id,r])).values()], db=await dbFor(id,namespace);
        if (!db) return fallback;
        return new Promise(resolve=>{
            try {
                const tx=db.transaction(store,'readonly');
                const request=tx.objectStore(store).getAll();
                request.onsuccess=()=>resolve([...new Map(fallback.concat(request.result||[],recent).map(r=>[r.id,r])).values()]);
                request.onerror=()=>resolve(fallback);
                tx.oncomplete=()=>db.close();
            } catch (_) {db.close();resolve(fallback);}
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
    root.APPitchScience = {ORDER, day, learned, makeSequence, effectiveRange, octaveBases, chromaDistance, loadCourse, saveCourse,
        practiceToday, lastPracticeAt, markPractice, putRows, allRows, metrics};
}(window));
