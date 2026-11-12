/* Optional cross-device training clock.  Both independent PWAs use this exact file.
 * Only explicit training events count; Demo and idle time never do.
 * Cloud synchronization requires deploying the companion Cloudflare Worker and
 * entering the same 128-bit pairing key and endpoint on every site/device.
 */
(function (root) {
    "use strict";
    const START_DATE = '2026-10-29', EXEMPT = '2026-10-30';
    const GOAL = 3600000, IDLE = 75000, SEGMENT_MAX = 60000;
    const STORAGE = 'musik-training-tracker-v1';
    const fmt = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'});
    const jstDate = (ms = Date.now()) => {
        const parts=Object.fromEntries(fmt.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
        return `${parts.year}-${parts.month}-${parts.day}`;
    };
    let stored;
    try { stored = JSON.parse(localStorage.getItem(STORAGE) || 'null') || {}; }
    catch (_) { stored = {}; }
    const state = {endpoint: stored.endpoint || '', key: stored.key || '',
        segments: Array.isArray(stored.segments) ? stored.segments : [],
        pending: [...(Array.isArray(stored.pending) ? stored.pending : []), ...(stored.checkpoint && stored.checkpoint.end > stored.checkpoint.start ? [stored.checkpoint] : [])], remote: stored.remote || null};
    let active = null, lastAction = 0, uploadBusy = false, pollBusy = false;
    const LANGUAGE_TEXT = {
      "en": ["Training time sync", "Shared Cloudflare Worker HTTPS URL", "Personal pairing code (same on both sites and devices)", "Save sync settings", "Copy pairing code", "Local only · not synced", "Cloud sync configured", "Active training", "min", "Pending uploads", "Not configured: sites and devices cannot share progress.", "Pairing code copied; paste the same code in your other site/device.", "Settings saved. Syncing…", "Saved as local-only time.", "Enter an HTTPS URL and a 32-digit hexadecimal pairing code.", "Historical overdue", "Exempt"],
      "de": ["Trainingszeit-Synchronisierung", "Gemeinsame Cloudflare-Worker-HTTPS-Adresse", "Privater Kopplungscode (auf allen Geräten identisch)", "Einstellungen speichern", "Kopplungscode kopieren", "Nur lokal · nicht synchronisiert", "Cloud-Sync konfiguriert", "Aktives Training", "Min.", "Uploads ausstehend", "Ohne Server keine geräteübergreifende Synchronisierung.", "Kopplungscode kopiert; auf anderen Geräten einfügen.", "Einstellungen gespeichert. Synchronisiere…", "Nur lokal gespeichert.", "HTTPS-Adresse und 32-stelligen Hexadezimalcode eingeben.", "Historischer Rückstand", "Befreit"],
      "ja": ["練習時間の同期", "共有 Cloudflare Worker の HTTPS アドレス", "個人ペアリングコード（両サイト・全端末で共通）", "同期設定を保存", "コードをコピー", "端末内のみ・未同期", "クラウド同期設定済み", "有効練習時間", "分", "未アップロード", "設定前は別サイト・別端末の時間を合算できません。", "コードをコピーしました。他の端末にも入力してください。", "設定を保存しました。同期中…", "端末内のみ保存しました。", "HTTPS URL と32文字の16進ペアリングコードを入力してください。", "過去の未達累計", "免除"],
      "it": ["Sincronizzazione allenamento", "URL HTTPS del Worker Cloudflare condiviso", "Codice personale (uguale su entrambi i siti e dispositivi)", "Salva impostazioni", "Copia codice", "Solo locale · non sincronizzato", "Sincronizzazione cloud configurata", "Allenamento attivo", "min", "Caricamenti in sospeso", "Senza server, siti e dispositivi non condividono i dati.", "Codice copiato; inseriscilo sugli altri dispositivi.", "Impostazioni salvate. Sincronizzazione…", "Salvato solo in locale.", "Inserisci URL HTTPS e codice esadecimale di 32 caratteri.", "Debito storico", "Esente"],
      "el": ["Συγχρονισμός χρόνου εξάσκησης", "HTTPS URL κοινού Cloudflare Worker", "Προσωπικός κωδικός ζεύξης (ίδιος παντού)", "Αποθήκευση ρυθμίσεων", "Αντιγραφή κωδικού", "Μόνο τοπικά · χωρίς συγχρονισμό", "Ο συγχρονισμός ρυθμίστηκε", "Ενεργή εξάσκηση", "λεπτά", "Εκκρεμείς μεταφορές", "Χωρίς διακομιστή δεν συνδυάζονται τα δεδομένα των συσκευών.", "Αντιγράφηκε. Χρησιμοποιήστε τον ίδιο κωδικό παντού.", "Αποθηκεύτηκε. Συγχρονισμός…", "Μόνο τοπική καταγραφή.", "Δώστε HTTPS URL και 32ψήφιο δεκαεξαδικό κωδικό.", "Ιστορική οφειλή", "Εξαίρεση"],
      "zh-TW": ["訓練時間同步", "共用 Cloudflare Worker HTTPS 網址", "個人配對碼（兩個網站與所有裝置相同）", "儲存同步設定", "複製配對碼", "僅本機 · 未同步", "雲端同步已設定", "今日有效訓練", "分鐘", "待上傳", "未設定同步服務前，無法合併不同網站與裝置的進度。", "已複製配對碼，請在其他網站與裝置填入相同代碼。", "已儲存，正在同步…", "已儲存為本機記錄。", "請輸入 HTTPS 網址和32位十六進位配對碼。", "歷史累計欠帳", "豁免"]
    };
    let language = 'en';
    function translate(index) {return (LANGUAGE_TEXT[language]||LANGUAGE_TEXT.en)[index];}
    function setLanguage(locale) {
        language = LANGUAGE_TEXT[locale] ? locale : 'en';
        const ids = ['trackerSettingTitle','trackerEndpointLabel','trackerKeyLabel','trackerSave','trackerCopy'];
        ids.forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=translate(i);});
        const tip=document.getElementById('trackerConfigMessage');
        if(tip && !state.endpoint) tip.textContent=translate(10);
        render();
    }

    function mergeSegments(rows) {
        const merged = new Map();
        for (const row of rows) {
            const old=merged.get(row.id);
            if (!old || row.end>old.end) merged.set(row.id,row);
        }
        return [...merged.values()];
    }
    const save = () => {
        try {
            const disk=JSON.parse(localStorage.getItem(STORAGE)||'{}');
            state.segments=mergeSegments([...(disk.segments||[]),...state.segments]);
            const done=new Map(state.segments.map(row=>[row.id,row.end]));
            state.pending=mergeSegments([...(disk.pending||[]),...state.pending]).filter(row=>!done.has(row.id)||done.get(row.id)<row.end);
            localStorage.setItem(STORAGE,JSON.stringify({...state,checkpoint:active ? {...active} : null}));
        } catch (_) {TrainingCore.storageError();}
    };
    const keyPattern = /^[a-f0-9]{32}$/i;
    const id = () => typeof crypto.randomUUID === 'function' ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    function unionMs(rows, from, to) {
        const intervals = rows.map((s) => [Math.max(s.start, from), Math.min(s.end, to)])
            .filter(([a,b]) => b > a).sort((a,b) => a[0]-b[0]);
        let lastEnd = from, total = 0;
        for (const [a,b] of intervals) {
            total += Math.max(0, b - Math.max(a, lastEnd));
            lastEnd = Math.max(lastEnd,b);
        }
        return total;
    }
    function bounds(date) {
        // Asia/Tokyo is always UTC+9; no daylight saving in Japan.
        const base = Date.parse(date + 'T00:00:00+09:00');
        return [base,base+86400000];
    }
    function todayMs(rows, date = jstDate()) {return unionMs(rows,...bounds(date));}
    function endActive() {
        if (!active) return;
        const end = Math.max(active.start,Math.min(Date.now(),lastAction + IDLE,active.start+SEGMENT_MAX));
        active.end = Math.max(active.end,end);
        if (active.end > active.start) state.pending.push({...active});
        active = null; save();
    }
    function activity(kind) {
        if (!['question','answer','free-play','ap-learning','ap-check','ap-answer','staff-replay'].includes(kind)) return;
        if (document.hidden || document.querySelector('.app-shell.demo-running')) return;
        const now = Date.now();
        if (active && (now - lastAction >= IDLE || now - active.start >= SEGMENT_MAX)) endActive();
        lastAction = now;
        if (!active) active = {id:id(), start:now,end:now};
        save();render();
    }
    function pause() { endActive(); lastAction = 0; render(); }
    function tick() {
        if (document.hidden || (typeof document.hasFocus === 'function' && !document.hasFocus())) {
            pause(); return;
        }
        if (active) {
            active.end = Math.max(active.end, Math.min(Date.now(),lastAction+IDLE,active.start+SEGMENT_MAX));
            if (Date.now() >= lastAction + IDLE) endActive();
            else if (Date.now() >= active.start + SEGMENT_MAX) {
                endActive();
                // Continued recent activity should not stop being counted at 60 seconds.
                active = {id:id(),start:Date.now(),end:Date.now()};
                save();
            } else save();
        }
        render();
    }
    function allLocal() { return [...state.segments,...state.pending,...(active ? [active] : [])]; }
    function summary() {
        const date = jstDate();
        const localMs = todayMs(allLocal());
        const remoteMs = state.remote?.date === date ? state.remote.ms : 0;
        // Remote and local may overlap; a single device cannot precisely merge them.
        // Prefer remote authoritative tally when synced, local-only estimate otherwise;
        // queued additions are shown as a pending amount, not double-counted.
        return {date, ms: state.endpoint && state.key && state.remote ? Math.max(remoteMs,localMs) : localMs,
            synced: Boolean(state.endpoint && state.key && state.remote?.date === date), localMs,
            remoteMs, pending: state.pending.length + (active ? 1 : 0)};
    }
    function render() {
        const s = summary();
        const minutes = (s.ms/60000).toFixed(1);
        const pct = Math.min(100,Math.floor(100*s.ms/GOAL));
        const text = document.getElementById('trackerStatus');
        if (text) text.textContent = `${translate(7)} ${minutes}/60 ${translate(8)} · ${pct}% · ${translate(s.synced?6:5)}`;
        const history = document.getElementById('trackerHistory');
        if (history) {
            history.replaceChildren();
            if (state.remote?.history?.length) {
                const summary = document.createElement('p');
                summary.textContent = `${translate(15)}: ${Math.round(state.remote.overdue_minutes)} ${translate(8)}`;
                history.appendChild(summary);
                state.remote.history.slice(-7).reverse().forEach(row=>{
                    const item=document.createElement('p');
                    item.textContent=`${row.date}: ${(row.training_ms/60000).toFixed(1)}/60 · ${row.exempt?translate(16):Math.max(0,Math.round(row.overdue_minutes))+' '+translate(8)}`;
                    history.appendChild(item);
                });
            }
        }
        const sync = document.getElementById('trackerSync');
        if (sync) sync.textContent = s.pending ? `${translate(9)} ${s.pending}` : '';
    }
    function ensurePairing() {
        if (keyPattern.test(state.key)) return state.key;
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        state.key = [...bytes].map((x) => x.toString(16).padStart(2,'0')).join('');
        save();
        return state.key;
    }
    function showConfig() {
        document.getElementById('trackerEndpoint').value = state.endpoint;
        document.getElementById('trackerKey').value = ensurePairing();
        render();
    }
    function setConfig() {
        const url = document.getElementById('trackerEndpoint').value.trim().replace(/\/$/,'');
        const key = document.getElementById('trackerKey').value.trim().toLowerCase();
        if (url && (!/^https:\/\/[^/]+/.test(url) || !keyPattern.test(key))) {
            document.getElementById('trackerConfigMessage').textContent = translate(14);
            return;
        }
        state.endpoint = url; state.key = key;
        state.remote = null;
        save();
        document.getElementById('trackerConfigMessage').textContent = translate(url?12:13);
        poll(); flush(); render();
    }
    function rememberUploaded(row) {
        const i = state.segments.findIndex((s) => s.id === row.id);
        if (i < 0) state.segments.push({...row}); else state.segments[i].end = Math.max(state.segments[i].end,row.end);
        state.pending = state.pending.filter((s) => s.id !== row.id);
        // Retain a bounded 90-day local history; remote is authoritative when enabled.
        const cutoff = Date.now() - 100*86400000;
        state.segments = state.segments.filter((s) => s.end >= cutoff);
        save();
    }
    async function flush() {
        if (!state.endpoint || !keyPattern.test(state.key) || uploadBusy) return;
        uploadBusy = true;
        try {
            const rows = state.pending.slice(0, 30);
            for (const row of rows) {
                const response = await fetch(state.endpoint+'/v1/segments', {
                    method:'POST', headers:{'Content-Type':'application/json','X-Training-Key':state.key},
                    body:JSON.stringify(row), cache:'no-store'});
                if (!response.ok) break;
                rememberUploaded(row);
            }
        } catch (_) { /* Offline queue intentionally retained. */ }
        finally { uploadBusy = false; render(); }
    }
    async function poll() {
        if (!state.endpoint || !keyPattern.test(state.key) || pollBusy) return;
        pollBusy = true;
        try {
            const date = jstDate();
            const response = await fetch(state.endpoint+'/v1/summary?date='+date,
                {headers:{'X-Training-Key':state.key},cache:'no-store'});
            if (!response.ok) throw new Error('not synced');
            const payload = await response.json();
            state.remote = {date,ms:payload.today_ms || 0,
                overdue_minutes:payload.historical_overdue_minutes || 0,history:payload.history || []};
            save();
        } catch (_) {state.remote = null;}
        finally {pollBusy=false; render();}
    }
    function setup() {
        const status=document.getElementById('trackerStatus'); if(!status) return;
        document.getElementById('trackerSave').addEventListener('click',setConfig);
        document.getElementById('trackerCopy').addEventListener('click',async() => {
            try {await navigator.clipboard.writeText(ensurePairing());
                document.getElementById('trackerConfigMessage').textContent=translate(11);}
            catch (_) {document.getElementById('trackerKey').select();}
        });
        showConfig();
        setLanguage(document.documentElement.lang || "en");
        root.addEventListener('training-activity',(event)=>activity(event.detail?.kind));
        root.addEventListener('training-pause',pause);
        document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(); else {poll();render();}});
        root.addEventListener('blur',pause);
        root.addEventListener('pagehide',pause);
        setInterval(tick, 3000);
        setInterval(()=>{flush();poll();},15000);
        flush();poll();
    }
    root.TrainingTracker={activity,pause,summary,jstDate,START_DATE,EXEMPT,GOAL,setLanguage};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
}(window));
