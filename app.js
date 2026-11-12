const APP_VERSION = "2.4.1";
const PLAY_DURATION = 0.7;
const SUPPORTED_MIN_MIDI = 55;
const SUPPORTED_MAX_MIDI = 88;
const DEFAULT_MIN_MIDI = 60;
const DEFAULT_MAX_MIDI = 71;
const VIOLIN_OPEN_STRINGS = [{ name: "E5", midi: 76 }, { name: "A4", midi: 69 }, { name: "D4", midi: 62 }, { name: "G3", midi: 55 }];
const VIOLIN_MAX_POSITION = 12;
let violinDrawnWidth = 0; // scroller width the fingerboard was last drawn for (0 = drawn while hidden)
const VIOLIN_ROUND_CHROME = 204; // px above and around the board in the tallest round layout (RP locate)
const VIOLIN_MIN_MIDI = 55;
const VIOLIN_MAX_MIDI = 88;

const PITCH_NAMES = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];

const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);

const LETTER_PITCH_CLASSES = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11
};

const SOLFEGE_NAMES = {
    C: "Do",
    D: "Re",
    E: "Mi",
    F: "Fa",
    G: "Sol",
    A: "La",
    B: "Si"
};

const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];

const SHARP_SPELLINGS = {
    0: ["C", 0],
    1: ["C", 1],
    2: ["D", 0],
    3: ["D", 1],
    4: ["E", 0],
    5: ["F", 0],
    6: ["F", 1],
    7: ["G", 0],
    8: ["G", 1],
    9: ["A", 0],
    10: ["A", 1],
    11: ["B", 0]
};

const FLAT_SPELLINGS = {
    0: ["C", 0],
    1: ["D", -1],
    2: ["D", 0],
    3: ["E", -1],
    4: ["E", 0],
    5: ["F", 0],
    6: ["G", -1],
    7: ["G", 0],
    8: ["A", -1],
    9: ["A", 0],
    10: ["B", -1],
    11: ["B", 0]
};

const KEY_FIFTHS = {
    "Cb major": -7,
    "Gb major": -6,
    "Db major": -5,
    "Ab major": -4,
    "Eb major": -3,
    "Bb major": -2,
    "F major": -1,
    "C major": 0,
    "G major": 1,
    "D major": 2,
    "A major": 3,
    "E major": 4,
    "B major": 5,
    "F# major": 6,
    "C# major": 7,
    "Ab minor": -7,
    "Eb minor": -6,
    "Bb minor": -5,
    "F minor": -4,
    "C minor": -3,
    "G minor": -2,
    "D minor": -1,
    "A minor": 0,
    "E minor": 1,
    "B minor": 2,
    "F# minor": 3,
    "C# minor": 4,
    "G# minor": 5,
    "D# minor": 6,
    "A# minor": 7
};

const KEY_OPTIONS = [
    "C major",
    "G major",
    "D major",
    "A major",
    "E major",
    "B major",
    "F# major",
    "C# major",
    "F major",
    "Bb major",
    "Eb major",
    "Ab major",
    "Db major",
    "Gb major",
    "Cb major",
    "A minor",
    "E minor",
    "B minor",
    "F# minor",
    "C# minor",
    "G# minor",
    "D# minor",
    "A# minor",
    "D minor",
    "G minor",
    "C minor",
    "F minor",
    "Bb minor",
    "Eb minor",
    "Ab minor"
];

// An octave fits fully inside the available phone viewport, including B.
let WHITE_WIDTH = 52;
let BLACK_WIDTH = 32;

const elements = {
    status: document.getElementById("status"),
    answerText: document.getElementById("answerText"),
    startNote: document.getElementById("startNote"),
    endNote: document.getElementById("endNote"),
    keySelect: document.getElementById("keySelect"),
    clefSelect: document.getElementById("clefSelect"),
    modeSelect: document.getElementById("modeSelect"),
    maxIntervalSelect: document.getElementById("maxIntervalSelect"),
    minIntervalSelect: document.getElementById("minIntervalSelect"),
    directionSelect: document.getElementById("directionSelect"),
    intervalPicker: document.getElementById("intervalPicker"),
    apPicker: document.getElementById("apPicker"),
    apTrialsSelect: document.getElementById("apTrialsSelect"),
    apTimeSelect: document.getElementById("apTimeSelect"),
    apAnswerPanel: document.getElementById("apAnswerPanel"),
    apAnswers: document.getElementById("apAnswers"),
    apReview: document.getElementById("apReview"),
    instrumentSelect: document.getElementById("instrumentSelect"),
    applyButton: document.getElementById("applyButton"),
    playButton: document.getElementById("playButton"),
    nextButton: document.getElementById("nextButton"),
    staff: document.getElementById("staff"),
    intervalReplayButton: document.getElementById("intervalReplayButton"),
    keyboard: document.getElementById("keyboard"),
    keyboardScroller: document.getElementById("keyboardScroller")
};

let minMidi = DEFAULT_MIN_MIDI;
let maxMidi = DEFAULT_MAX_MIDI;
let keyName = "C major";
let clefMode = "Treble";
let testMode = "single";
let instrumentMode = "violin";
let violinReady = false;
let violinLoadingPromise = null;
let currentReferenceMidi = null;
let maxIntervalSemitones = null; // null = unlimited
let minIntervalSemitones = 1;
let targetDirection = "both"; // higher / lower / both, compared with reference pitch
let questionSerial = 0;
let currentMidi = null;
let answered = false;
let testActive = false;
let legacyAudioReady = false;
let ready = false;
let demoRunning = false;
let demoCancelled = false;
let keyboardMinX = 0;
let demoSelectedOctave = null;
let demoOctaveTapTimeout = null;
let demoTimer = null;
let demoResolve = null;
const demoWaits = new Set();
let currentLanguage = "en";
let statusMessage = { key: "loading", args: {} };
let answerMessage = { key: "free", args: {} };
let freeDisplayTimeout = null;

const keyElements = new Map();
const activePointers = new Map();
const activeVoices = new Map();

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContextClass();
const player = typeof WebAudioFontPlayer === "function" ? new WebAudioFontPlayer() : null;

const VIOLIN_SAMPLE_URL = "./vendor/0400_JCLive_sf2_file.js";
// Mean rendered pitch of each sample zone in cents against A4 = 440 Hz equal temperament,
// measured in Chromium (frame-wise over one second; the samples carry roughly ±11 cents of
// vibrato). Before the correction A4 sounded about 11 cents flat and neighbouring zones
// differed by up to 8 cents. Training sounds use the corrected copy; the Demo keeps the
// untouched samples. tests/claude_browser.cjs re-measures the result.
const VIOLIN_ZONE_CENTS = [[21,58,-4.0],[59,62,0.5],[63,66,-6.2],[67,67,-11.4],[68,70,-11.4],[71,71,-7.8],
    [72,74,-7.8],[75,78,-3.6],[79,79,3.0],[80,82,3.0],[83,86,-5.5],[87,87,2.0],[88,90,2.0]];
let violinTuned = null;
function demoPreset() {
    return violinReady ? window._tone_0400_JCLive_sf2_file : null;
}
function selectedPreset() {
    if (!violinReady) return null;
    if (!violinTuned) {
        const original = window._tone_0400_JCLive_sf2_file;
        // Shallow copies share the decoded buffers; only the fine tuning differs.
        violinTuned = {...original, zones: original.zones.map((zone) => {
            const fix = VIOLIN_ZONE_CENTS.find(([low, high]) => zone.keyRangeLow === low && zone.keyRangeHigh === high);
            return fix ? {...zone, fineTune: (Number(zone.fineTune) || 0) - fix[2]} : zone;
        })};
    }
    return violinTuned;
}
function loadViolinPreset() {
    if (violinReady) return Promise.resolve();
    if (violinLoadingPromise) return violinLoadingPromise;
    violinLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = VIOLIN_SAMPLE_URL;
        script.async = true;
        script.onload = () => {
            if (!window._tone_0400_JCLive_sf2_file) {
                reject(new Error("Violin preset missing"));
                return;
            }
            try {
                TrainingCore.decodePreset(player,audioContext,"_tone_0400_JCLive_sf2_file").then(() => {
                    violinReady = true;
                    resolve();
                },reject);
            } catch (error) { reject(error); }
        };
        script.onerror = () => reject(new Error("Violin sample download failed"));
        document.head.appendChild(script);
    }).catch((error) => {
        violinLoadingPromise = null;
        throw error;
    });
    return violinLoadingPromise;
}

function resolveInitialLanguage() {
    const saved = localStorage.getItem("violinEarTrainerLanguage");
    if (saved && TRANSLATIONS[saved]) {
        return saved;
    }
    const detected = navigator.language.toLowerCase();
    if (detected.startsWith("zh")) {
        return "zh-TW";
    }
    const base = detected.split("-")[0];
    return TRANSLATIONS[base] ? base : "en";
}

function t(key, args = {}) {
    if (instrumentMode === "violin") {
        if (key === "choose") key = "chooseViolin";
        if (key === "hint") key = "violinHint";
    }
    let text = TRANSLATIONS[currentLanguage][key] ?? TRANSLATIONS.en[key] ?? key;
    for (const [name, value] of Object.entries(args)) {
        text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
}

function setStatus(key, args = {}) {
    statusMessage = { key, args };
    elements.status.textContent = key === "raw" ? args.text : t(key, args);
}

function setAnswer(key, args = {}) {
    answerMessage = { key, args };
    elements.answerText.textContent = key === "raw" ? args.text : t(key, args);
}

function setLanguage(language) {
    currentLanguage = TRANSLATIONS[language] ? language : "en";
    document.getElementById("audioReload").textContent = t("audioReload");
    if (window.TrainingTracker?.setLanguage) window.TrainingTracker.setLanguage(currentLanguage);
    localStorage.setItem("violinEarTrainerLanguage", currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.getElementById("languageSelect").value = currentLanguage;
    const labels = {
        languageLabel: "language", fromLabel: "from", toLabel: "to",
        keyLabel: "key", clefLabel: "clef", modeLabel: "mode", maxIntervalLabel: "maxInterval", minIntervalLabel: "minInterval", targetDirectionLabel: "targetDirection", applyButton: "apply",
        apTrialsLabel: "apTrials", apTimeLabel: "apTime", apDescription: "apDescription",
        playButton: "play", nextButton: "next", demoButton: "demo", helpText: "hint"
    };
    for (const [id, key] of Object.entries(labels)) {
        document.getElementById(id).textContent = t(key);
    }
    const keySelect = elements.keySelect;
    for (const option of keySelect.options) {
        const [tonic, mode] = option.value.split(" ");
        option.textContent = `${tonic} ${t(mode)}`;
    }
    for (const option of elements.modeSelect.options) {
        option.textContent = option.value === "rpCourse"
            ? RelativePitchCourse.T(currentLanguage,"course") : t(option.value);
    }
    elements.maxIntervalSelect.options[0].textContent = t("unlimited");
    elements.apTimeSelect.options[0].textContent = t("apSeconds");
    elements.apTimeSelect.options[1].textContent = t("apTwoSeconds");
    elements.apTimeSelect.options[2].textContent = t("apUnlimited");
    const otherButton = elements.apAnswers.querySelector('[data-pitch-class="out"]');
    if (otherButton) otherButton.textContent = t("apNoteOther");
    for (const option of elements.directionSelect.options) {
        option.textContent = t(`direction${option.value.charAt(0).toUpperCase()}${option.value.slice(1)}`);
    }
    const clefSelect = elements.clefSelect;
    for (const option of clefSelect.options) {
        option.textContent = t(option.value.toLowerCase());
    }
    document.getElementById("octaveNav").setAttribute("aria-label", t("octaveNavigation"));
    for (const button of document.querySelectorAll(".octave-jump")) {
        const label = instrumentMode === "violin"
            ? t("violinJump", { position: button.textContent })
            : t("jumpToOctave", { note: noteName(Number(button.dataset.midi)) });
        button.setAttribute("aria-label", label);
    }
    if (instrumentMode === "violin") {
        elements.keyboard.querySelectorAll(".violin-note").forEach((button) => {
            button.setAttribute("aria-label", `${button.dataset.string} \u00b7 ${t("violinPosition", { position: button.dataset.position })}`);
        });
    }
    updatePlayButton();
    setStatus(statusMessage.key, statusMessage.args);
    setAnswer(answerMessage.key, answerMessage.args);
    if (ready) {
        if (!testActive && activePointers.size > 0) {
            renderHeldNotes();
        } else if (!isApMode() && testMode !== "rpCourse" && testActive && answered && currentMidi !== null) {
            setAnswer("raw", { text: formatAnswerText() });
        }
    }
    if (typeof drawStaff === "function" && !demoRunning) {
        if (!testActive && activePointers.size > 0) {
            drawStaff([...new Set(activePointers.values())]);
        } else if (!isApMode() && testMode !== "rpCourse" && answered && currentMidi !== null) {
            drawAnsweredStaff();
        } else {
            drawQuestionStaff();
        }
    }
    updateStaffReplayAccess();
    updateApView();
    document.getElementById("autoNextText").textContent = t("autoNextText");
    document.getElementById("updateButton").textContent = t("updateReady");
    if (apMessageBuild) setApMessage(apMessageBuild);
    if (window.RPUI) RPUI.changedLanguage();
    renderApMemory();
}
function noteName(midi) {
    const octave = Math.floor(midi / 12) - 1;
    return `${PITCH_NAMES[midi % 12]}${octave}`;
}

function isWhiteKey(midi) {
    return WHITE_PITCH_CLASSES.has(midi % 12);
}

function keySignature(fifths) {
    const accidentals = {
        C: 0,
        D: 0,
        E: 0,
        F: 0,
        G: 0,
        A: 0,
        B: 0
    };

    if (fifths > 0) {
        SHARP_ORDER.slice(0, fifths).forEach((letter) => {
            accidentals[letter] = 1;
        });
    } else if (fifths < 0) {
        FLAT_ORDER.slice(0, -fifths).forEach((letter) => {
            accidentals[letter] = -1;
        });
    }

    return accidentals;
}

function spelledNote(midi, fifths) {
    const pitchClass = midi % 12;
    const signature = keySignature(fifths);

    let letter = null;
    let accidental = null;

    for (const candidate of Object.keys(LETTER_PITCH_CLASSES)) {
        const candidatePitch = (
            LETTER_PITCH_CLASSES[candidate] + signature[candidate] + 12
        ) % 12;

        if (candidatePitch === pitchClass) {
            letter = candidate;
            accidental = signature[candidate];
            break;
        }
    }

    if (letter === null) {
        const spelling = fifths >= 0
            ? SHARP_SPELLINGS[pitchClass]
            : FLAT_SPELLINGS[pitchClass];

        [letter, accidental] = spelling;
    }

    for (let octave = -1; octave <= 9; octave += 1) {
        const naturalMidi = (
            12 * (octave + 1) + LETTER_PITCH_CLASSES[letter]
        );

        if (naturalMidi + accidental === midi) {
            return { letter, accidental, octave };
        }
    }

    throw new Error("Unable to spell MIDI note.");
}

function accidentalText(accidental) {
    if (accidental === 1) {
        return "#";
    }

    if (accidental === -1) {
        return "b";
    }

    return "";
}

function spelledNoteName(midi, fifths) {
    const note = spelledNote(midi, fifths);
    return `${note.letter}${accidentalText(note.accidental)}${note.octave}`;
}

function solfegeName(midi, fifths) {
    const note = spelledNote(midi, fifths);
    return `${SOLFEGE_NAMES[note.letter]}${accidentalText(note.accidental)}${note.octave}`;
}

function keySignatureLabel(name) {
    const [tonic, mode] = name.split(" ");
    return `${tonic} ${t(mode)}`;
}

function drawStaff() {
    elements.staff.replaceChildren();
}

function whiteGlobalIndex(midi) {
    const octave = Math.floor(midi / 12);
    const pitchClass = midi % 12;
    const offsets = {
        0: 0,
        2: 1,
        4: 2,
        5: 3,
        7: 4,
        9: 5,
        11: 6
    };

    return octave * 7 + offsets[pitchClass];
}

function keyBounds(midi) {
    if (isWhiteKey(midi)) {
        const left = whiteGlobalIndex(midi) * WHITE_WIDTH;

        return {
            left,
            right: left + WHITE_WIDTH,
            black: false
        };
    }

    const pitchClass = midi % 12;
    const octave = Math.floor(midi / 12);
    const leftWhiteOffset = {
        1: 0,
        3: 1,
        6: 3,
        8: 4,
        10: 5
    }[pitchClass];

    const boundary = (octave * 7 + leftWhiteOffset + 1) * WHITE_WIDTH;

    return {
        left: boundary - BLACK_WIDTH / 2,
        right: boundary + BLACK_WIDTH / 2,
        black: true
    };
}

function resetKeyboardColors() {
    elements.keyboard.querySelectorAll(".piano-key, .violin-note").forEach((element) => {
        element.classList.remove("correct", "wrong", "active", "reference");
    });
}
function markPitch(midi, className) {
    elements.keyboard.querySelectorAll(`[data-midi="${midi}"]`).forEach((key) => key.classList.add(className));
}
function violinPositionForMidi(midi) {
    // Prefer a playable position closest to an open string; one pitch may have several fingerings.
    const positions = VIOLIN_OPEN_STRINGS.map((string, row) => ({ row, step: midi - string.midi }))
        .filter(({ step }) => step >= 0 && step <= VIOLIN_MAX_POSITION);
    return positions.sort((a, b) => a.step - b.step)[0] || null;
}
function drawViolinFingerboard() {
    // Complete four-string vertical board: every open string and every 0-12
    // semitone offset is visible simultaneously. No horizontal pages or auto-jumps.
    const scroller = elements.keyboardScroller;
    const board = elements.keyboard;
    // Thirteen rows must fit below the round controls without scrolling on short
    // screens (browser toolbars included); rows shrink before anything is cut off.
    const header = 25, rowHeight = Math.max(28, Math.min(36, Math.floor((window.innerHeight - VIOLIN_ROUND_CHROME) / 13))), gutter = 25;
    // The board is laid out in pixels. While an AP or RP naming screen hides it the real
    // width is unknown: estimate it now and let the ResizeObserver redraw once it is shown.
    violinDrawnWidth = scroller.clientWidth;
    const viewport = Math.max(280, violinDrawnWidth || Math.min(window.innerWidth, 620) - 36);
    const cell = (viewport - gutter - 4) / VIOLIN_OPEN_STRINGS.length;
    board.replaceChildren();
    board.classList.add("violin-board");
    board.style.width = "100%";
    board.style.minWidth = "0";
    board.style.height = `${header + (VIOLIN_MAX_POSITION + 1) * rowHeight + 4}px`;
    board.style.removeProperty("--white-width");
    board.style.removeProperty("--black-width");
    keyElements.clear(); keyboardMinX = 0;
    const nav = document.getElementById("octaveNav");
    nav.replaceChildren(); nav.hidden = true; nav.style.display = "none";
    scroller.style.overflowX = "hidden";
    scroller.style.overflowY = "visible";
    scroller.onscroll = null;
    scroller.scrollLeft = 0;
    for (let step = 0; step <= VIOLIN_MAX_POSITION; step++) {
        const number = document.createElement("span");
        number.className = "violin-step-label";
        number.textContent = String(step);
        number.style.top = `${header + rowHeight * step + 10}px`;
        board.appendChild(number);
    }
    VIOLIN_OPEN_STRINGS.slice().reverse().forEach((string, col) => {
        const x = gutter + col * cell;
        const line = document.createElement("div");
        line.className = "violin-string-line";
        line.style.left = `${x + cell/2}px`;
        line.style.top = `${header - 2}px`;
        line.style.height = `${(VIOLIN_MAX_POSITION + 1) * rowHeight + 3}px`;
        board.appendChild(line);
        const label = document.createElement("span");
        label.className = "violin-string-label";
        label.style.left = `${x + 2}px`;
        label.style.top = "1px";
        label.style.width = `${cell - 4}px`;
        label.textContent = string.name;
        board.appendChild(label);
        for (let step = 0; step <= VIOLIN_MAX_POSITION; step++) {
            const midi = string.midi + step;
            const key = document.createElement("button");
            key.type = "button";
            key.className = `violin-note${step === 0 ? " open-string" : ""}${midi < minMidi || midi > maxMidi ? " out-of-range" : ""}`;
            key.style.left = `${x + 3}px`;
            key.style.top = `${header + rowHeight * step + 2}px`;
            key.style.width = `${cell - 6}px`;
            key.style.height = `${rowHeight - 4}px`;
            key.dataset.midi = String(midi);
            key.dataset.string = string.name;
            key.dataset.position = String(step);
            key.setAttribute("aria-label", `${string.name} · ${t("violinPosition", {position:step})}`);
            const dot = document.createElement("span");
            dot.className = "violin-touch-dot";
            dot.setAttribute("aria-hidden", "true");
            key.appendChild(dot);
            key.addEventListener("pointerdown", event => {
                if (demoRunning) return;
                event.preventDefault();
                try { key.setPointerCapture(event.pointerId); } catch (_) { /* pointer already released */ }
                pressKey(midi,event.pointerId);
            });
            key.addEventListener("pointerup", event => releasePointer(event.pointerId));
            key.addEventListener("pointercancel", event => releasePointer(event.pointerId));
            key.addEventListener("lostpointercapture", event => releasePointer(event.pointerId));
            board.appendChild(key);
            if (!keyElements.has(midi) || step < Number(keyElements.get(midi).dataset.position)) {
                keyElements.set(midi,key);
            }
        }
    });
}
function octaveGroups() {
    if (instrumentMode === "violin") return [
        { midi: 0, label: "0\u20134" }, { midi: 5, label: "5\u20138" }, { midi: 9, label: "9\u201312" }
    ];
    const groups = [];
    const first = Math.floor(minMidi / 12) * 12;

    for (let base = first; base <= maxMidi; base += 12) {
        const firstNote = Math.max(base, minMidi);
        if (firstNote > maxMidi) continue;
        groups.push({
            midi: firstNote,
            label: noteName(firstNote)
        });
    }

    return groups;
}

function showOctave(midi, behavior = "smooth") {
    if (instrumentMode === "violin") {
        // All 52 positions are visible: preserve the user's visual reference.
        return;
    }
    const bounds = keyBounds(midi);
    const left = Math.max(0, bounds.left - keyboardMinX);
    elements.keyboardScroller.scrollTo({ left, behavior });
}

function highlightOctave(midi) {
    document.querySelectorAll(".octave-jump").forEach((button) => {
        button.classList.toggle("current", Number(button.dataset.midi) === midi);
    });
}

function drawKeyboard() {
    if (instrumentMode === "violin") {
        drawViolinFingerboard();
        return;
    }
    elements.keyboard.classList.remove("violin-board");
    // Keep natural-size keys when possible, but fit seven white keys (C-B)
    // on a phone. Every octave uses the same width and left alignment.
    const viewport = elements.keyboardScroller.clientWidth;
    WHITE_WIDTH = Math.min(52, (viewport - 2) / 7);
    BLACK_WIDTH = WHITE_WIDTH * (32 / 52);
    elements.keyboard.style.setProperty("--white-width", `${WHITE_WIDTH}px`);
    elements.keyboard.style.setProperty("--black-width", `${BLACK_WIDTH}px`);
    elements.keyboard.replaceChildren();
    keyElements.clear();

    const midis = [];

    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
        midis.push(midi);
    }

    const bounds = midis.map((midi) => keyBounds(midi));
    const minX = Math.min(...bounds.map((item) => item.left));
    const maxX = Math.max(...bounds.map((item) => item.right));
    // Leave enough horizontal content for every octave jump to align its
    // starting key at the same left-side position in the fixed viewport.
    const finalOctaveStart = keyBounds(
        Math.floor(maxMidi / 12) * 12
    ).left - minX;
    const viewWidth = elements.keyboardScroller.clientWidth;
    const width = Math.max(maxX - minX, finalOctaveStart + viewWidth, 100);

    keyboardMinX = minX;
    elements.keyboard.style.width = `${width}px`;

    const nav = document.getElementById("octaveNav");
    nav.replaceChildren();
    const groups = octaveGroups();
    nav.hidden = groups.length <= 1;
    nav.setAttribute("aria-label", t("octaveNavigation"));
    const navButtons = [];

    groups.forEach((group) => {
        const button = document.createElement("button");
        button.className = "octave-jump";
        button.type = "button";
        button.textContent = group.label;
        button.dataset.midi = String(group.midi);
        button.setAttribute("aria-label", t("jumpToOctave", { note: group.label }));
        button.addEventListener("click", () => {
            if (!demoRunning) showOctave(group.midi);
        });
        nav.appendChild(button);
        navButtons.push({ button, midi: group.midi });

        const marker = document.createElement("span");
        marker.className = "octave-mark";
        marker.textContent = group.label;
        marker.style.left = `${Math.max(0, keyBounds(group.midi).left - minX) + 4}px`;
        elements.keyboard.appendChild(marker);
    });

    const markCurrentOctave = () => {
        if (demoRunning && demoSelectedOctave !== null) {
            highlightOctave(demoSelectedOctave);
            return;
        }
        const offset = elements.keyboardScroller.scrollLeft;
        let selected = 0;
        for (let i = 0; i < navButtons.length; i += 1) {
            const groupX = keyBounds(navButtons[i].midi).left - minX;
            if (groupX <= offset + 14) selected = i;
        }
        navButtons.forEach(({ button }, i) => button.classList.toggle("current", i === selected));
    };
    elements.keyboardScroller.onscroll = markCurrentOctave;
    markCurrentOctave();

    const ordered = [
        ...midis.filter((midi) => isWhiteKey(midi)),
        ...midis.filter((midi) => !isWhiteKey(midi))
    ];

    ordered.forEach((midi) => {
        const boundsForKey = keyBounds(midi);
        const key = document.createElement("button");

        key.type = "button";
        key.className = `piano-key ${boundsForKey.black ? "black-key" : "white-key"}`;
        key.style.left = `${boundsForKey.left - minX}px`;
        key.style.width = `${boundsForKey.right - boundsForKey.left}px`;
        key.dataset.midi = String(midi);
        key.setAttribute("aria-label", noteName(midi));

        key.addEventListener("pointerdown", (event) => {
            if (demoRunning) {
                return;
            }
            event.preventDefault();
            try { key.setPointerCapture(event.pointerId); } catch (_) { /* pointer already released */ }
            pressKey(midi, event.pointerId);
        });
        key.addEventListener("pointerup", (event) => releasePointer(event.pointerId));
        key.addEventListener("pointercancel", (event) => releasePointer(event.pointerId));
        key.addEventListener("lostpointercapture", (event) => releasePointer(event.pointerId));

        elements.keyboard.appendChild(key);
        keyElements.set(midi, key);
    });

    elements.keyboardScroller.scrollLeft = 0;
}

function setControlsEnabled(enabled) {
    elements.applyButton.disabled = !enabled;
    elements.playButton.disabled = !enabled;
    elements.nextButton.disabled = !enabled;
    elements.startNote.disabled = !enabled;
    elements.endNote.disabled = !enabled;
    elements.keySelect.disabled = !enabled;
    elements.clefSelect.disabled = !enabled;
    elements.maxIntervalSelect.disabled = !enabled;
    elements.minIntervalSelect.disabled = !enabled;
    elements.directionSelect.disabled = !enabled;
    elements.apTrialsSelect.disabled = !enabled;
    elements.apTimeSelect.disabled = !enabled;
    elements.modeSelect.disabled = !enabled;
    elements.instrumentSelect.disabled = !enabled;
    document.getElementById("demoButton").disabled = !enabled;
}

async function ensureAudio() {
    if (audioContext.state !== "running") {
        await audioContext.resume();
    }
    if (audioContext.state !== "running") throw new Error("Audio unavailable");
}

function releaseAllKeys() {
    for (const pointerId of [...activePointers.keys()]) {
        releasePointer(pointerId);
    }
}

const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);
const pendingVoices = new Set();

function playFreeVoice(midi) {
    releaseVoice(midi);
    const envelope = player.queueWaveTable(audioContext, masterGain, selectedPreset(), 0, midi, 8, 0.76);
    if (envelope) activeVoices.set(midi, envelope);
}

function releaseVoice(midi) {
    const voice = activeVoices.get(midi);
    if (!voice) return;
    voice.cancel();
    activeVoices.delete(midi);
}

function releasePointer(pointerId) {
    if (!activePointers.has(pointerId)) {
        return;
    }
    const midi = activePointers.get(pointerId);
    activePointers.delete(pointerId);
    if (![...activePointers.values()].includes(midi)) {
        releaseVoice(midi);
    }
    if (!testActive && !demoRunning) {
        renderHeldNotes();
    }
}

function renderNotes(midis, options = {}) {
    const unique = [...new Set(midis)].sort((a, b) => a - b);
    resetKeyboardColors();
    unique.forEach((midi) => markPitch(midi, "active"));
    if (unique.length) {
        const fifths = KEY_FIFTHS[keyName];
        const names = unique.length === 1
            ? `${solfegeName(unique[0], fifths)} / ${spelledNoteName(unique[0], fifths)}`
            : unique.map((midi) => spelledNoteName(midi, fifths)).join("  ");
        setAnswer("raw", { text: names });
    } else {
        setAnswer(options.keepStatus ? "raw" : "free", options.keepStatus ? { text: "" } : {});
    }
    drawStaff(unique);
    if (!options.keepStatus) {
        setStatus(unique.length ? "held" : "free", { count: unique.length });
    }
}

function renderHeldNotes() {
    window.clearTimeout(freeDisplayTimeout);
    const midis = [...activePointers.values()];
    if (midis.length === 0) {
        resetKeyboardColors();
        freeDisplayTimeout = window.setTimeout(() => {
            if (!testActive && !demoRunning && activePointers.size === 0) {
                renderNotes([]);
            }
        }, 250);
        return;
    }
    renderNotes(midis);
}

function drawQuestionStaff() {
    if (testActive && !answered && testMode === "interval" && currentReferenceMidi !== null) {
        drawStaff(currentReferenceMidi);
    } else {
        drawStaff(null, testActive && !answered);
    }
}

// The reference is public information: make it discoverable on the keyboard.
function markReferenceKey() {
    if (testActive && testMode === "interval" && currentReferenceMidi !== null) {
        markPitch(currentReferenceMidi, "reference");
    }
}

function jumpToReferenceOctave() {
    if (currentReferenceMidi === null) return;
    if (instrumentMode === "violin") { showOctave(currentReferenceMidi, "instant"); return; }
    const group = octaveGroups().find(({ midi }, index, groups) =>
        currentReferenceMidi >= midi &&
        (index === groups.length - 1 || currentReferenceMidi < groups[index + 1].midi));
    if (group) showOctave(group.midi, "instant");
}

function showCorrectKeyIfHidden() {
    if (instrumentMode === "violin") { showOctave(currentMidi, "instant"); return; }
    const key = keyElements.get(currentMidi);
    if (!key) return;
    const viewport = elements.keyboardScroller.getBoundingClientRect();
    const rect = key.getBoundingClientRect();
    if (rect.left < viewport.left + 2 || rect.right > viewport.right - 2) {
        const group = octaveGroups().find(({ midi }, index, groups) =>
            currentMidi >= midi && (index === groups.length - 1 || currentMidi < groups[index + 1].midi));
        if (group) showOctave(group.midi, "instant");
    }
}

function drawAnsweredStaff() {
    if (testMode === "interval" && currentReferenceMidi !== null) {
        drawStaff([currentReferenceMidi, currentMidi]);
    } else {
        drawStaff(currentMidi);
    }
}

function updateStaffReplayAccess() {
    const canReplay = testActive && testMode === "interval" && currentReferenceMidi !== null;
    elements.intervalReplayButton.hidden = !canReplay;
    elements.intervalReplayButton.textContent = t("replay");
    elements.intervalReplayButton.setAttribute("aria-label", t("replayInterval"));
    const chip = document.getElementById("referenceChip");
    chip.hidden = !canReplay;
    if (canReplay) {
        const pos = instrumentMode === "violin" ? violinPositionForMidi(currentReferenceMidi) : null;
        const string = pos ? VIOLIN_OPEN_STRINGS[pos.row].name + " +" + pos.step : "";
        chip.textContent = `${RelativePitchCourse.T(currentLanguage,"reference")} ${noteName(currentReferenceMidi)}${string ? " · " + string : ""}`;
    }
}

function formatAnswerText() {
    const fifths = KEY_FIFTHS[keyName];
    if (testMode === "interval" && currentReferenceMidi !== null) {
        const difference = currentMidi - currentReferenceMidi;
        const direction = t(difference > 0 ? "intervalUp" : "intervalDown", { count: Math.abs(difference) });
        return `${spelledNoteName(currentReferenceMidi, fifths)} \u2192 ${spelledNoteName(currentMidi, fifths)} (${direction})`;
    }
    return `${solfegeName(currentMidi, fifths)}    ${spelledNoteName(currentMidi, fifths)}`;
}

async function playQuestion() {
    if (!ready || currentMidi === null) return;
    APPitchScience.markPractice(AP_APP_ID);
    const serial=questionSerial,target=currentMidi,reference=currentReferenceMidi;
    legacyAudioReady=false;
    await ensureAudio();
    if (serial!==questionSerial || !testActive) return;
    player.cancelQueue(audioContext);TrainingCore.cancelAudio();
    const start=audioContext.currentTime+.05;
    const pair=testMode==='interval' && reference!==null;
    if(pair) player.queueWaveTable(audioContext,audioContext.destination,selectedPreset(),start,reference,.6,.75);
    if(!player.queueWaveTable(audioContext,audioContext.destination,selectedPreset(),start+(pair?.8:0),target,.7,.75)) throw new Error('Audio unavailable');
    const latency=(audioContext.outputLatency||0)+(audioContext.baseLatency||0);
    legacyAudioReady=await TrainingCore.waitForAudio(audioContext,start+(pair?1.5:.7)+latency,()=>serial===questionSerial&&testActive&&!document.hidden);
}

async function playTone(midi) {
    APPitchScience.markPractice(AP_APP_ID);
    if (!ready) {
        return;
    }

    await ensureAudio();
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();

    player.queueWaveTable(
        audioContext,
        audioContext.destination,
        selectedPreset(),
        0,
        midi,
        PLAY_DURATION,
        0.75
    );
}

// Protocol 4: learning gives labelled feedback; independent checks reveal
// answers only after the round. Legacy history remains readable.
const AP_PITCH_LABELS = ["C", "C\u266f/D\u266d", "D", "D\u266f/E\u266d", "E", "F",
    "F\u266f/G\u266d", "G", "G\u266f/A\u266d", "A", "A\u266f/B\u266d", "B"];
const AP_APP_ID = "violin";
let apCourse = APPitchScience.loadCourse(AP_APP_ID);
let apSession = null;
// Keep the last presented AP pitch across modes, sessions and page reloads.
// This is a test-sequence constraint, not an additional memory/score signal.
const AP_LAST_MIDI_KEY = `ap-last-midi-${AP_APP_ID}`;
let lastApPresentedMidi = (() => {
    try {
        const saved = localStorage.getItem(AP_LAST_MIDI_KEY);
        if (saved === null) return null;
        const value = Number(saved);
        return Number.isInteger(value) && value >= 0 && value <= 127 ? value : null;
    } catch (_) { return null; }
})();
let apTimer = null;
let apDeadline = null;
let apAudioReady = false;
let apFeedbackPlaying = false;
let apFeedbackTimer = null;
let apSoundStart = null;
let apAudioLatencyMs = 0;
const AP_COLD_MIN_REST_MS = 4 * 3600 * 1000; // conservative product assumption, not a validated cut-off
// Protocol 5: interference burst, neighbouring "Other" notes, spacing that needs
// after-break evidence, selectable round length and sound, automatic continue.
const AP_PROTOCOL = 6;
const AP_MASK_SECONDS = 1;
const AP_MASK_GAP = 0.25;
const AP_MASK_KEY = "ear-ap-mask";
const AUTO_NEXT_KEY = "ear-auto-next";
let apHideColdAnswers = false;
let apStudyOctave = null; // C of the octave played by the labelled study cards
let apMessageBuild = null;
let autoNextTimer = null;


function isApMode(mode = testMode) { return ["ap", "apLearn", "apCold"].includes(mode); }
function clearApTimer() { window.clearTimeout(apTimer); apTimer = null; apDeadline = null; }
function clearApFeedback() {
    window.clearTimeout(apFeedbackTimer); apFeedbackTimer = null;
    apFeedbackPlaying = false;
}
function apEligiblePitches(from = minMidi, to = maxMidi) {
    // Preserve equal register support across pitch classes; an arbitrary
    // 12-note range (e.g. C#4–C5) is not a complete aligned C–B octave.
    const range = APPitchScience.effectiveRange(from, to);
    if (!range) return [];
    return Array.from({length: range.to - range.from + 1}, (_, i) => range.from + i);
}
function apCorrect(record, session = apSession) {
    if (record.result === "interrupted" || record.result === "audio-error") return false;
    if (record.guess === "out") return session?.known && !session.known.includes(record.pitch % 12);
    return record.guess === record.pitch % 12;
}
function apMetricFor(session) {
    return APPitchScience.metrics(session.records.map((r) => ({...r, correct: apCorrect(r, session), target: r.pitch})));
}
const AP_RANGE_COPY = {
    en: "Actual AP question range",
    de: "Tatsächlicher AP-Testbereich",
    ja: "AP出題の実際の音域",
    it: "Estensione effettiva delle domande AP",
    el: "Πραγματικό εύρος ερωτήσεων AP",
    "zh-TW": "AP 實際出題音域"
};
const AP_MEMORY_COPY = {
    en: ["1 · Listen and remember", "Tap each labelled note as often as needed. Then press Play for untimed recall; mistakes return sooner.", "Due now", "Next review", "Replay correct note"],
    de: ["1 · Anhören und merken", "Beschriftete Töne mehrfach hören. Danach ohne Zeitlimit erinnern; Fehler werden früher wiederholt.", "Jetzt wiederholen", "Nächste Wiederholung", "Richtigen Ton anhören"],
    ja: ["1 · 聴いて覚える", "音名を見ながら何度でも試聴。Playで時間制限なしの想起練習へ。間違えた音を早めに復習。", "復習する", "次の復習", "正しい音をもう一度"],
    it: ["1 · Ascolta e memorizza", "Riascolta le note etichettate. Poi richiamale senza limite; ripassa presto gli errori.", "Ripasso ora", "Prossimo ripasso", "Riascolta nota corretta"],
    el: ["1 · Άκουσε και θυμήσου", "Άκουσε επανειλημμένα τις νότες με ετικέτα και μετά εξασκήσου χωρίς χρονικό όριο.", "Επανάληψη τώρα", "Επόμενη επανάληψη", "Άκουσε ξανά τη σωστή νότα"],
    "zh-TW": ["1 · 先聽再記", "先反覆聆聽有名稱的音，再按 Play 進行不限時回憶；錯音會安排較早複習。", "現在應複習", "下次複習", "重聽正確音"]
};
function apMemoryText(which) {
    const copy = AP_MEMORY_COPY[currentLanguage] || AP_MEMORY_COPY.en;
    return copy[{title:0,subtitle:1,due:2,next:3,replay:4}[which]];
}
function setApMessage(build) {
    // The panel carries its own prompt and feedback: the header is hidden during a round.
    apMessageBuild = build;
    const box = document.getElementById("apMessage");
    if (box) box.textContent = build ? build() : "";
}
function apGuessLabel(guess) {
    return guess === null ? t("apEmpty") : guess === "out" ? t("apNoteOther") : AP_PITCH_LABELS[guess];
}
function apStudyBases() {
    const bases = APPitchScience.octaveBases(Number(elements.startNote.value), Number(elements.endNote.value));
    return bases.length ? bases : [60];
}
function apBreakText() {
    const last = APPitchScience.lastPracticeAt(AP_APP_ID);
    if (last === null) return `${t("apBreakLabel")}: \u2014 \xb7 ${t("ordinaryCheck")}`;
    const minutes = Math.max(0, Math.floor((Date.now() - last) / 60000));
    const rested = minutes * 60000 >= AP_COLD_MIN_REST_MS;
    return `${t("apBreakLabel")}: ${Math.floor(minutes / 60)} h ${minutes % 60} min \xb7 ${t(rested ? "afterBreak" : "ordinaryCheck")}`;
}
function renderApMemory() {
    const panel = document.getElementById("apStudyPanel");
    if (!panel) return;
    const selectedMode = elements.modeSelect.value;
    panel.hidden = selectedMode !== "apLearn" || Boolean(apSession && !apSession.finished);
    if (panel.hidden) return;
    document.getElementById("apStudyTitle").textContent = apMemoryText("title");
    document.getElementById("apStudySubtitle").textContent = t("apLearnDesc");
    // A study card is a stable anchor: it stays in one octave (C4–B4 when available)
    // until the learner deliberately switches to another complete octave of the range.
    const bases = apStudyBases();
    if (!bases.includes(apStudyOctave)) apStudyOctave = bases.includes(60) ? 60 : bases[0];
    const octaves = document.getElementById("apStudyOctaves");
    octaves.replaceChildren();
    octaves.hidden = bases.length < 2;
    if (!octaves.hidden) {
        const label = document.createElement("span");
        label.textContent = t("apStudyOctave");
        octaves.appendChild(label);
        for (const base of bases) {
            const choice = document.createElement("button");
            choice.type = "button";
            choice.className = `secondary ap-study-octave${base === apStudyOctave ? " current" : ""}`;
            choice.textContent = `${noteName(base)}\u2013${noteName(base + 11)}`;
            choice.setAttribute("aria-pressed", String(base === apStudyOctave));
            choice.addEventListener("click", () => {
                if (demoRunning || testActive) return;
                apStudyOctave = base;
                renderApMemory();
            });
            octaves.appendChild(choice);
        }
    }
    const cards = document.getElementById("apStudyCards");
    cards.replaceChildren();
    const available = APPitchScience.learned(apCourse.level);
    const items = APMemory.due(AP_APP_ID,available).sort((a,b)=>available.indexOf(a.pc)-available.indexOf(b.pc));
    const newest = available[available.length - 1];
    for (const entry of items) {
        const button = document.createElement("button");
        button.type = "button";
        // The newest name of a level has hardly been heard yet: listen before recalling.
        const fresh = entry.pc === newest && entry.attempts < 6;
        button.className = `secondary ap-study-note${entry.nextAt <= Date.now() ? " due" : ""}${fresh ? " fresh" : ""}`;
        const studyMidi = apStudyOctave + entry.pc;
        button.textContent = `\u25b6 ${AP_PITCH_LABELS[entry.pc]}${Math.floor(studyMidi / 12) - 1} \xb7 ${entry.hits}/${entry.attempts}${fresh ? ` \xb7 ${t("apNewNote")}` : ""}`;
        button.addEventListener("click", async () => {
            if (demoRunning || testActive || elements.modeSelect.value !== "apLearn") return;
            TrainingTracker.activity("ap-learning");
            await playTone(studyMidi);
        });
        cards.appendChild(button);
    }
    const due = items.filter(x => x.nextAt <= Date.now());
    const next = items.filter(x => x.nextAt > Date.now()).sort((a,b)=>a.nextAt-b.nextAt)[0];
    const time = next ? new Date(next.nextAt).toLocaleString(currentLanguage,{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : "\u2014";
    document.getElementById("apStudyDue").textContent = `${apMemoryText("due")}: ${due.length ? due.map(x=>AP_PITCH_LABELS[x.pc]).join(", ") : "\u2014"} \xb7 ${apMemoryText("next")}: ${time}`;
}
function refreshApCourseUI() {
    const mode = elements.modeSelect.value;
    const pane = document.getElementById("apCourseInfo");
    document.getElementById("apDescription").hidden = mode !== "ap";
    if (!pane) return;
    pane.hidden = !["apLearn", "apCold"].includes(mode);
    const level = APPitchScience.learned(apCourse.level).map((x) => AP_PITCH_LABELS[x]).join(" \xb7 ");
    document.getElementById("apCourseLevel").textContent = t("apCourseLevel", {level: apCourse.level, names: level});
    document.getElementById("apColdConfirmation").hidden = mode !== "apCold";
    document.getElementById("apLevelPicker").hidden = !["apLearn", "apCold"].includes(mode);
    document.getElementById("apLevelSelect").value = String(apCourse.level);
    document.getElementById("apLevelLabel").textContent = t("apLevelLabel");
    // The study panel already shows the learning description; do not print it twice.
    const description = document.getElementById("apCourseDescription");
    description.hidden = mode === "apLearn";
    description.textContent = t(mode === "apLearn" ? "apLearnDesc" : "apColdDesc");
    document.getElementById("apColdDeviceLabel").textContent = t("apColdDeviceLabel");
    for (const option of document.getElementById("apColdDevice").options) {
        option.textContent = t("apDevice" + option.value.charAt(0).toUpperCase() + option.value.slice(1));
    }
    document.getElementById("apHideColdText").textContent = t("apHideColdText");
    document.getElementById("apColdRangeText").textContent = t("apColdRangeText");
    document.getElementById("apBreakInfo").textContent = mode === "apCold" ? apBreakText() : "";
    // Every AP mode, the cold check included, draws from the range the user selected.
    const range = APPitchScience.effectiveRange(Number(elements.startNote.value), Number(elements.endNote.value));
    const describe = range ? `${noteName(range.from)}\u2013${noteName(range.to)}` : "\u2014";
    document.getElementById("apEffectiveRange").textContent = `${AP_RANGE_COPY[currentLanguage] || AP_RANGE_COPY.en}: ${describe}`;
    document.getElementById("apExportButton").textContent = t("apExportButton");
    document.getElementById("apProgressTitle").textContent = t("apProgressTitle");
    // The sound is part of the recorded condition: compare rounds with the same sound only.
    document.getElementById("apTimbreLabel").textContent = t("apSoundLabel");
    for (const option of document.getElementById("apTimbre").options) option.textContent = t(option.value);
    document.getElementById("apMaskText").textContent = t("apMaskText");
    renderApMemory();
}
function updateApView() {
    const isAp = isApMode() && !demoRunning;
    const running = Boolean(apSession && !apSession.finished);
    document.querySelector(".app-shell").classList.toggle("ap-mode", isAp);
    document.querySelector(".app-shell").classList.toggle("ap-complete", Boolean(isAp && apSession?.finished));
    elements.apAnswerPanel.hidden = !isAp || !apSession;
    elements.apAnswers.querySelectorAll("button").forEach((button) => {
        const answer = button.dataset.pitchClass === "out" ? "out" : Number(button.dataset.pitchClass);
        const allowed = testMode === "ap" ? answer !== "out" : (apSession && (answer === "out"
            ? apSession.known && apSession.known.length < 12 : apSession.known?.includes(answer)));
        button.hidden = isAp && !allowed;
        button.disabled = !ready || !testActive || answered || !apAudioReady || !isAp || !allowed;
    });
    document.getElementById("apLevelSelect").disabled = running;
    if (ready) {
        elements.nextButton.disabled = isAp && (!testActive || !answered || apSession?.finished || apFeedbackPlaying);
    }
    if (isAp) {
        elements.apReview.hidden = !apSession?.finished;
        if (apSession?.finished) renderApResults();
        else elements.apReview.replaceChildren();
    }
    refreshApCourseUI();
    const replayNote = document.getElementById("apRepeatNote");
    replayNote.hidden = !(isAp && testMode === "apLearn" && running && !apFeedbackPlaying && (apAudioReady || answered));
    if (!replayNote.hidden) replayNote.textContent = answered ? apMemoryText("replay") : t("replayTarget");
}
function markApButtons(record) {
    // Learning shows right and wrong; checks only confirm which button was taken.
    const feedback = apSession.kind === "learn" && (record.result === "answered" || record.result === "timeout");
    const target = apSession.known && !apSession.known.includes(record.pitch % 12) ? "out" : String(record.pitch % 12);
    elements.apAnswers.querySelectorAll("button").forEach((button) => {
        const value = button.dataset.pitchClass;
        button.classList.remove("ap-picked", "ap-right", "ap-wrong");
        if (record.guess !== null && value === String(record.guess)) {
            button.classList.add(feedback ? (value === target ? "ap-right" : "ap-wrong") : "ap-picked");
        }
        if (feedback && value === target) button.classList.add("ap-right");
    });
}
function clearApButtons() {
    elements.apAnswers.querySelectorAll("button").forEach((button) => button.classList.remove("ap-picked", "ap-right", "ap-wrong"));
}
function renderApResults() {
    if (!apSession?.finished) return;
    const results = elements.apReview;
    results.replaceChildren();
    const summary = document.createElement("h3");
    const metric = apMetricFor(apSession);
    const rt = metric.medianRt === null ? "\u2014" : `${(metric.medianRt / 1000).toFixed(2)}s`;
    summary.textContent = `${t("apReview")} \xb7 ${metric.correct}/${metric.total} \xb7 ${t("apMedianRT")}: ${rt}`;
    results.appendChild(summary);
    const fresh=apSession.records.filter(r=>!r.repair&&!r.replayed&&(r.result==='answered'||r.result==='timeout'));
    const detail=document.createElement('p');
    detail.textContent=`${t('fresh')}: ${fresh.filter(r=>apCorrect(r)).length}/${fresh.length} · ${t(apSession.timbre)}`;
    results.appendChild(detail);
    const aided=apSession.records.filter(r=>r.repair||r.replayed);
    detail.textContent+=` · ${t('assisted')}: ${aided.filter(r=>apCorrect(r)).length}/${aided.length}`;
    const counts=document.createElement('p');
    const known=apSession.known||Array.from({length:12},(_,i)=>i);
    if(apSession.kind!=='learn'){
        const chance=document.createElement('p');
        chance.textContent=`${t('chance')}: ${(100/(known.length+(known.length<12?1:0))).toFixed(1)}%`;
        results.appendChild(chance);
    }
    counts.textContent=t('coverage')+': '+known.map(pc=>`${AP_PITCH_LABELS[pc]}=${apSession.records.filter(r=>r.pitch%12===pc).length}`).join(' · ');
    results.appendChild(counts);
    if(apSession.known&&apSession.known.length<12){
        const named=apSession.records.filter(r=>known.includes(r.pitch%12));
        const other=apSession.records.filter(r=>!known.includes(r.pitch%12));
        const split=document.createElement('p');split.textContent=`${t('apKnownScore')}: ${named.filter(r=>apCorrect(r)).length}/${named.length} · ${t('apOtherScore')}: ${other.filter(r=>apCorrect(r)).length}/${other.length}`;results.appendChild(split);
    }
    const guide=document.createElement('p');
    // 90 % follows the criterion of adult pitch-naming studies; 60 % is a product heuristic.
    const freshRate=fresh.length?fresh.filter(r=>apCorrect(r)).length/fresh.length:0;
    guide.textContent=t(freshRate<.6?'lowerLevelHint':freshRate>=.9?'nextLevelHint':'keepLevelHint')+' '+t('roundBreak');results.appendChild(guide);
    if (apSession.effectiveRange) {
        const where=document.createElement('p');
        where.textContent=`${AP_RANGE_COPY[currentLanguage] || AP_RANGE_COPY.en}: ${noteName(apSession.effectiveRange[0])}\u2013${noteName(apSession.effectiveRange[1])}`;
        results.appendChild(where);
    }
    if (apSession.kind === "cold") {
        const note = document.createElement("p");
        note.textContent = apSession.interrupted ? t("apInterrupted")
            : apSession.eligible ? t("apColdFirstResult") : t("apColdPracticeResult");
        results.appendChild(note);
    }
    if (apSession.kind === "cold" && apHideColdAnswers) {
        const reveal = document.createElement("button");
        reveal.type = "button";
        reveal.className = "secondary";
        reveal.textContent = t("apRevealColdAnswers");
        reveal.addEventListener("click", () => {apHideColdAnswers = false; renderApResults();});
        results.appendChild(reveal);
        return;
    }
    const list = document.createElement("ol");
    for (const result of apSession.records) {
        const item = document.createElement("li");
        const correct = apCorrect(result);
        const label = result.guess === null ? t("apResultMiss") : t(correct ? "apResultCorrect" : "apResultWrong");
        const picked = result.guess === null ? t("apEmpty")
            : result.guess === "out" ? t("apNoteOther") : AP_PITCH_LABELS[result.guess];
        item.textContent = `${label} \xb7 ${t("apTarget")}: ${noteName(result.pitch)} \xb7 ${t("apPicked")}: ${picked}`;
        list.appendChild(item);
    }
    results.appendChild(list);
}
function finishApRound() {
    if (!apSession || apSession.finished) return;
    clearApTimer(); clearApFeedback();
    window.clearTimeout(autoNextTimer);
    apSession.finished = true;
    TrainingTracker.pause();
    testActive = false; answered = true; currentMidi = null;
    questionSerial += 1; apAudioReady = false;
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    const metric = apMetricFor(apSession);
    const session = apSession;
    session.completedAt = Date.now();
    // Checks measure progress without deciding what the user may learn.
    // Existing history stays on the device; level selection is explicit.
    APPitchScience.putRows(AP_APP_ID, "sessions", [{id: session.id, kind: session.kind,
        protocol:AP_PROTOCOL, timbre:session.timbre, gapSincePracticeMs:session.gapSincePracticeMs,
        range:[minMidi,maxMidi],effectiveRange:session.effectiveRange,
        limitMs:session.limitMs,known:session.known,masked:session.masked,afterBreak:session.afterBreak,
        day: session.day, level: session.level, started: session.startAt,
        finished: session.completedAt, eligible: session.eligible, interrupted: session.interrupted,
        total: session.total, attempted:session.records.length, ...metric}]);
    setStatus("apSummary", {score: metric.correct, total: session.total});
    setAnswer("apSummary", {score: metric.correct, total: session.total});
    setApMessage(() => t("apSummary", {score: metric.correct, total: session.total}));
    clearApButtons();
    drawStaff(); updatePlayButton(); updateApView();
    refreshApHistory();
}
// Spacing evidence. In a feedback round only the very first note after a break is
// free of a labelled reference; in a no-feedback check after a break every note is.
function updateApMemory(record) {
    const known = apSession.known || [], pc = record.pitch % 12;
    const correct = apCorrect(record);
    const assisted = !!record.repair || record.replayed > 0;
    const cold = !!apSession.afterBreak && (apSession.kind === "cold" || apSession.records.length === 1);
    const guessed = typeof record.guess === "number" ? record.guess : null;
    if (known.includes(pc)) {
        APMemory.record(AP_APP_ID, pc, correct, Date.now(), assisted, cold);
        if (!correct && guessed !== null) APMemory.confuse(AP_APP_ID, pc, guessed);
        if (!correct && apSession.kind === "learn") TrainingCore.queueRepair(apSession.repairs, pc, apSession.records.length);
    }
    // A learned name given to a different note: that name's boundary is unsure as well.
    if (!correct && guessed !== null && guessed !== pc && known.includes(guessed)) {
        APMemory.record(AP_APP_ID, guessed, false, Date.now(), false, false);
        APMemory.confuse(AP_APP_ID, guessed, pc);
        if (apSession.kind === "learn") TrainingCore.queueRepair(apSession.repairs, guessed, apSession.records.length);
    }
}
function recordApAnswer(guess = null, result = null, inputEvent = null) {
    if (!isApMode() || !apSession || apSession.finished || !testActive || answered) return;
    if (result === null && (!apAudioReady || performance.now() < apSoundStart)) return;
    clearApTimer();
    TrainingTracker.activity("ap-answer");
    const pitch = currentMidi;
    const now = Date.now();
    const responseTime = inputEvent?.timeStamp ?? performance.now();
    const rtMs = apSoundStart === null ? null : Math.max(0, Math.round(responseTime - apSoundStart));
    const status = result || (guess === null ? "timeout" : "answered");
    const scored = status === "answered" || status === "timeout";
    const record = {protocol:AP_PROTOCOL, timbre:apSession.trialTimbre || apSession.timbre, repair:!!apSession.currentRepair, replayed:apSession.replayed||0, id: `${apSession.id}-${apSession.records.length + 1}`, sessionId: apSession.id,
        kind: apSession.kind, level: apSession.level, day: apSession.day,
        ordinal: apSession.records.length + 1, pitch, guess, result: status, rtMs,
        playedAt: now - (Number.isFinite(rtMs) ? rtMs : 0), submittedAt: now,
        audibleLatencyEstimateMs: apAudioLatencyMs, source: AP_APP_ID,
        previousPitch: apSession.records.length ? apSession.records[apSession.records.length - 1].pitch : null,
        eligibleCold: apSession.eligible, afterBreak: apSession.afterBreak, resetSoundOn: !!apSession.masked,
        pointerTimeStamp: inputEvent?.timeStamp ?? null,
        pointerX: inputEvent?.clientX ?? null, pointerY: inputEvent?.clientY ?? null,
        buttonIndex: guess === "out" ? 12 : guess,
        baseLatencyRaw: audioContext.baseLatency ?? null,
        outputLatencyRaw: audioContext.outputLatency ?? null,
        sampleRate: audioContext.sampleRate ?? null,
        outputDevice: apSession.outputDevice,
        hiddenCount: apSession.hiddenCount || 0,
        gapSincePracticeMs: apSession.gapSincePracticeMs,
        coldSourceRange: apSession.kind === "cold" && apSession.effectiveRange
            ? `${noteName(apSession.effectiveRange[0])}-${noteName(apSession.effectiveRange[1])}` : "configured"};
    apSession.records.push(record);
    APPitchScience.putRows(AP_APP_ID, "trials", [{...record, correct: apCorrect(record)}]);
    if (scored && apSession.kind !== "assessment") updateApMemory(record);
    if (status === "interrupted" || status === "audio-error") apSession.interrupted = true;
    answered = true; apAudioReady = false;
    questionSerial += 1;
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    resetKeyboardColors(); drawStaff();
    markApButtons(record);
    const last = apSession.records.length >= apSession.total;
    if (last && apSession.kind !== "learn") {finishApRound(); return;}
    if (apSession.kind === "learn" && scored) {
        apSession.pendingFinish = last;
        const correct = apCorrect(record);
        const note = AP_PITCH_LABELS[pitch % 12];
        setStatus(correct ? "apLearnCorrect" : "apLearnWrong", {note});
        setAnswer(correct ? "apLearnCorrect" : "apLearnWrong", {note});
        setApMessage(() => correct ? `\u2713 ${t("apLearnCorrect", {note})}`
            : `\u2717 ${t("apLearnWrong", {note})} \xb7 ${t("apPicked")}: ${apGuessLabel(guess)}`);
        playApLearningFeedback(pitch, correct).catch(() => {
            apFeedbackPlaying = false;
            if (apSession?.pendingFinish) finishApRound(); else updateApView();
        });
    } else {
        if (last) {finishApRound(); return;}
        const auto = autoNextEnabled();
        const key = status === "interrupted" ? "apInterrupted" : guess === null
            ? (auto ? "apTimedOutShort" : "apTimedOut") : (auto ? "apRecordedShort" : "apRecorded");
        const done = apSession.records.length, total = apSession.total;
        setStatus(key);
        setAnswer(key);
        setApMessage(() => `${done} / ${total} \xb7 ${t(key)}`);
        // An interrupted or silent question waits for the learner; it never chains on.
        if (scored) scheduleAutoNext(350);
    }
    updateApView();
}
async function playApLearningFeedback(pitch, correct = false) {
    const serial = questionSerial;
    apFeedbackPlaying = true; updateApView();
    await ensureAudio();
    if (serial !== questionSerial || !apSession || apSession.finished || testMode !== "apLearn") return;
    const start = audioContext.currentTime + 0.04;
    // The labelled answer sounds exactly like the question that was just heard.
    if (apSession.trialTimbre === "neutral") TrainingCore.neutralTone(audioContext, start, pitch, 0.7);
    else player.queueWaveTable(audioContext, audioContext.destination, selectedPreset(), start, pitch, 0.7, 0.7);
    // One correct pitch only: no additional octave playback after answering.
    const waitMs = 840;
    apFeedbackTimer = window.setTimeout(() => {
        if (serial !== questionSerial) return;
        apFeedbackPlaying = false;
        if (apSession?.pendingFinish) { finishApRound(); return; }
        updateApView();
        // A miss waits for Next so the labelled note can be replayed and compared.
        if (correct) scheduleAutoNext(300);
    }, waitMs);
}
async function playApPitch(midi, serial, withMask = true) {
    await ensureAudio();
    if (serial !== questionSerial || !testActive || !isApMode() ||
        currentMidi !== midi || !apSession || apSession.finished || document.hidden) return;
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    const scheduledAt = audioContext.currentTime + 0.05;
    // The interference burst precedes each new question, never a replay of the same note.
    const startAt = withMask && apSession.masked
        ? TrainingCore.maskTone(audioContext, scheduledAt, AP_MASK_SECONDS) + AP_MASK_GAP : scheduledAt;
    if (apSession.trialTimbre === "neutral") TrainingCore.neutralTone(audioContext, startAt, midi, PLAY_DURATION);
    else if (!player.queueWaveTable(audioContext, audioContext.destination,
        selectedPreset(), startAt, midi, PLAY_DURATION, 0.75)) throw new Error("Audio unavailable");
    // Browser APIs cannot observe the exact acoustic onset of a Bluetooth headset;
    // this is a scheduling + output-latency estimate, recorded explicitly as such.
    apAudioLatencyMs = 50 + 1000 * ((audioContext.outputLatency || 0) + (audioContext.baseLatency || 0));
    apSoundStart = performance.now() + 1000 * (startAt - scheduledAt) + apAudioLatencyMs;
    const played = await TrainingCore.waitForAudio(audioContext, startAt + PLAY_DURATION + apAudioLatencyMs/1000,
        () => serial === questionSerial && testActive && !document.hidden);
    if (!played) {
        if (serial === questionSerial && testActive && !document.hidden) throw new Error("Audio paused");
        return;
    }
    apAudioReady = true;
    if (apSession.limitMs !== null) {
        const remaining = Math.max(0, apSession.limitMs - (performance.now()-apSoundStart));
        apDeadline = Date.now() + remaining;
        apTimer = window.setTimeout(() => recordApAnswer(null, "timeout"), remaining);
    }
    updateApView();
}
function startApQuestion() {
    window.clearTimeout(autoNextTimer);
    if (!apSession || apSession.finished) {
        const kind = testMode === "apLearn" ? "learn" : testMode === "apCold" ? "cold" : "assessment";
        const known = kind === "assessment" ? null : APPitchScience.learned(apCourse.level);
        const total = kind === "cold" ? 20 : Number(elements.apTrialsSelect.value);
        // All three kinds use the selected range; nothing rewrites From/To.
        const plan = APPitchScience.makeSequence({from: minMidi, to: maxMidi, total, known,
            previousMidi: lastApPresentedMidi,
            knownWeights: kind === "learn" ? Object.fromEntries(
                APMemory.due(AP_APP_ID,known || []).map(x => [x.pc, x.nextAt <= Date.now() ? 2.5 : 1])) : null});
        if (plan.length !== total) {setStatus("apNeedRange"); return;}
        const lastPractice = APPitchScience.lastPracticeAt(AP_APP_ID);
        const gapSincePracticeMs = lastPractice === null ? null : Date.now() - lastPractice;
        // Informational only: evidence gathered after a break weighs more. Never a gate.
        const afterBreak = gapSincePracticeMs !== null && gapSincePracticeMs >= AP_COLD_MIN_REST_MS;
        const eligible = kind === "cold" && afterBreak;
        apHideColdAnswers = kind === "cold" && document.getElementById("apHideColdCheck").checked;
        const range = APPitchScience.effectiveRange(minMidi, maxMidi);
        apSession = {id: `${AP_APP_ID}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            kind, total, plan, records: [], known, protocol:AP_PROTOCOL, repairs:[],
            timbre: document.getElementById("apTimbre").value,
            masked: document.getElementById("apMaskCheck").checked,
            limitMs: kind === "assessment" && elements.apTimeSelect.value !== "none"
                ? Number(elements.apTimeSelect.value) * 1000 : null,
            finished: false, eligible, afterBreak, interrupted: false, hiddenCount: 0,
            gapSincePracticeMs,
            outputDevice: document.getElementById("apColdDevice").value,
            level: apCourse.level, day: APPitchScience.day(), startAt: Date.now(),
            effectiveRange: range ? [range.from, range.to] : null};
        // The local timestamp is only a break indicator; other devices are unknown.
        APPitchScience.markPractice(AP_APP_ID);
    }
    TrainingTracker.activity(apSession.kind === "learn" ? "ap-learning" : "ap-check");
    if (testActive && !answered) return;
    if (apFeedbackPlaying) return;
    clearApTimer(); clearApFeedback();
    apSession.currentRepair = false;
    apSession.replayed = 0;
    apSession.trialTimbre = apSession.timbre === "mixed"
        ? TrainingCore.choose(["instrument", "neutral"]) : apSession.timbre;
    if (apSession.kind === "learn" && apSession.records.length < apSession.total) {
        const repair = TrainingCore.takeRepair(apSession.repairs, apSession.records.length);
        const weights = Object.fromEntries(APMemory.due(AP_APP_ID, apSession.known).map(x=>[x.pc,TrainingCore.weight(x)]));
        const normalOptions={from:minMidi,to:maxMidi,total:1,known:apSession.known,
            knownWeights:weights,previousMidi:lastApPresentedMidi};
        let next;
        if (repair !== null) {
            next=APPitchScience.makeSequence({...normalOptions,forcedPC:repair})[0];
            if (next !== undefined) apSession.currentRepair=true;
            else TrainingCore.queueRepair(apSession.repairs, repair, apSession.records.length);
        }
        if (next === undefined) next=APPitchScience.makeSequence(normalOptions)[0];
        apSession.plan[apSession.records.length]=next;
    }
    const target = apSession.plan[apSession.records.length];
    if (target === undefined) {finishApRound(); return;}
    releaseAllKeys(); window.clearTimeout(freeDisplayTimeout);
    player.cancelQueue(audioContext); TrainingCore.cancelAudio(); resetKeyboardColors();
    currentMidi = target; currentReferenceMidi = null;
    lastApPresentedMidi = target;
    try { localStorage.setItem(AP_LAST_MIDI_KEY, String(target)); } catch (_) {}
    testActive = true; answered = false; apAudioReady = false; apSoundStart = null;
    questionSerial += 1;
    const serial = questionSerial;
    updatePlayButton();
    const index = apSession.records.length + 1, total = apSession.total;
    const listenKey = apSession.kind === "learn" ? "apLearnListen" : "apListen";
    setStatus(listenKey, {index, total});
    setAnswer("apChoose");
    setApMessage(() => t(listenKey, {index, total}));
    clearApButtons();
    drawStaff(null, true); updateStaffReplayAccess(); updateApView();
    playApPitch(target, serial).catch(() => {
        if (serial === questionSerial) recordApAnswer(null, "audio-error");
    });
}
function autoNextEnabled() {
    return document.getElementById("autoNextCheck").checked;
}
// One tap per question: the next one starts by itself unless the learner has
// stopped, moved on by hand, or left the page in the meantime.
function scheduleAutoNext(ms) {
    window.clearTimeout(autoNextTimer);
    if (!autoNextEnabled() || demoRunning) return;
    const serial = questionSerial;
    autoNextTimer = window.setTimeout(() => {
        if (serial === questionSerial && testActive && answered && !demoRunning && !document.hidden) newQuestion();
    }, ms);
}
function rememberToggle(id, key) {
    const box = document.getElementById(id);
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null) box.checked = saved === "1";
    } catch (_) {}
    box.addEventListener("change", () => {
        try { localStorage.setItem(key, box.checked ? "1" : "0"); } catch (_) {}
    });
}
function createApAnswerButtons() {
    for (let pitch = 0; pitch <= 12; pitch++) {
        const button = document.createElement("button");
        button.type = "button"; button.className = "secondary ap-note-button";
        const answer = pitch === 12 ? "out" : pitch;
        button.textContent = pitch === 12 ? t("apNoteOther") : AP_PITCH_LABELS[pitch];
        button.dataset.pitchClass = String(answer);
        button.disabled = true;
        button.addEventListener("pointerdown", unlessDemo((event) => {
            if (event.pointerType === "touch" || event.pointerType === "mouse" || event.pointerType === "pen") {
                event.preventDefault();
                recordApAnswer(answer, null, event);
            }
        }));
        button.addEventListener("click", unlessDemo((event) => recordApAnswer(answer, null, event)));
        elements.apAnswers.appendChild(button);
    }
}
async function exportApCSV() {
    const rows = await APPitchScience.allRows(AP_APP_ID, "trials");
    const fields = ["protocol", "timbre", "repair", "replayed", "sessionId", "day", "kind", "level", "ordinal", "pitch", "guess", "result", "correct", "rtMs", "playedAt", "submittedAt", "audibleLatencyEstimateMs", "previousPitch", "eligibleCold", "afterBreak", "source", "resetSoundOn", "pointerTimeStamp",
        "pointerX", "pointerY", "buttonIndex", "baseLatencyRaw", "outputLatencyRaw",
        "sampleRate", "outputDevice", "hiddenCount", "gapSincePracticeMs", "coldSourceRange"];
    const csv = [fields.join(","), ...rows.map((row) => fields.map((name) => {
        const v = row[name] === undefined || row[name] === null ? "" : String(row[name]);
        return `"${v.replaceAll('"', '""')}"`;
    }).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], {type: "text/csv;charset=utf-8"}));
    const link = document.createElement("a"); link.href = url;
    link.download = `ap-${AP_APP_ID}-${APPitchScience.day()}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function refreshApHistory() {
    const box = document.getElementById("apRecentHistory");
    if (!box) return;
    const sessions = await APPitchScience.allRows(AP_APP_ID, "sessions");
    box.replaceChildren();
    for (const s of sessions.sort((a, b) => b.started - a.started).slice(0, 8)) {
        const p = document.createElement("p");
        const where = Array.isArray(s.effectiveRange) ? ` · ${noteName(s.effectiveRange[0])}\u2013${noteName(s.effectiveRange[1])}` : "";
        p.textContent = `${s.day} · ${s.protocol >= 4 ? "v" + s.protocol : "legacy"} · L${s.level} · ${t({learn:"apLearn",cold:"apCold",assessment:"ap"}[s.kind] || "ap")} · ${t(s.timbre || "instrument")}${where} · ${s.correct}/${s.total} \xb7 ${s.medianRt == null ? "\u2014" : (s.medianRt / 1000).toFixed(2) + "s"}`;
        if (s.kind === "cold" && !s.interrupted) p.textContent += ` · ${t(s.eligible ? "afterBreak" : "ordinaryCheck")}`;
        if (s.interrupted) p.textContent += ` · interrupted (${s.attempted ?? 0}/${s.total})`;
        box.appendChild(p);
    }
}

function updatePlayButton() {
    const shell = document.querySelector(".app-shell");
    shell.classList.toggle("training-round", testActive && !demoRunning);
    document.getElementById("demoButton").disabled = !ready || (testActive && !demoRunning);
    elements.nextButton.disabled = !ready || !testActive || !answered;
    document.querySelector(".app-shell").classList.toggle("board-test",
        testActive && (testMode === "interval" || (testMode === "rpCourse" && document.getElementById("rpActivity").value === "locate")));
    elements.playButton.textContent = t(testActive ? "stop" : "play");
    elements.playButton.classList.toggle("danger", testActive);
    elements.playButton.classList.toggle("primary", !testActive);
}

function updateIntervalPickerVisibility() {
    const visible = elements.modeSelect.value === "interval";
    elements.intervalPicker.hidden = !visible;
    elements.apPicker.hidden = !["ap", "apLearn", "apCold"].includes(elements.modeSelect.value);
    // Sound is chosen in every AP mode, round length for learning and assessment,
    // a response limit for the assessment only (a cold check is always 20 untimed questions).
    document.getElementById("apAssessmentOptions").hidden = !isApMode(elements.modeSelect.value);
    document.getElementById("apTrialsPicker").hidden = elements.modeSelect.value === "apCold";
    document.getElementById("apTimePicker").hidden = elements.modeSelect.value !== "ap";
    refreshApCourseUI();
    if (window.RPUI) RPUI.modeChanged();
}

function intervalTargetPools(from, to, minDistance, maxDistance, direction) {
    // Collect only feasible target/reference choices; no retry loops, even at boundaries.
    const limit = Math.min(maxDistance ?? (to - from), to - from);
    const higher = [];
    const lower = [];
    for (let target = from; target <= to; target += 1) {
        if (direction !== "lower") {
            const refMin = Math.max(from, target - limit);
            const refMax = target - minDistance;
            if (refMin <= refMax) higher.push({ target, refMin, refMax });
        }
        if (direction !== "higher") {
            const refMin = target + minDistance;
            const refMax = Math.min(to, target + limit);
            if (refMin <= refMax) lower.push({ target, refMin, refMax });
        }
    }
    return [higher, lower].filter((pool) => pool.length > 0);
}

function pickIntervalQuestion() {
    // Legacy Two notes is NOT constrained by the Relative Pitch Course's 24-semitone
    // limit. Draw a distance first, then choose a reference valid for that distance.
    // With Unlimited, the full selected range is usable without endpoint collapse.
    const span = maxMidi - minMidi;
    const maximum = Math.min(maxIntervalSemitones ?? span, span);
    if (!Number.isInteger(span) || span < 1 || maximum < minIntervalSemitones) return null;
    const directions = targetDirection === "both" ? ["higher", "lower"] : [targetDirection];
    if (!directions.every(value => value === "higher" || value === "lower")) return null;
    const distance = minIntervalSemitones + Math.floor(Math.random() * (maximum - minIntervalSemitones + 1));
    const direction = TrainingCore.choose(directions);
    const refMin = direction === "higher" ? minMidi : minMidi + distance;
    const refMax = direction === "higher" ? maxMidi - distance : maxMidi;
    if (refMin > refMax) return null;
    const reference = refMin + Math.floor(Math.random() * (refMax - refMin + 1));
    return {reference, target: reference + (direction === "lower" ? -distance : distance)};
}

function newQuestion() {
    if (!ready || (testActive && !answered)) return;
    TrainingTracker.activity("question");
    if (isApMode()) { startApQuestion(); return; }
    if (testMode === "rpCourse") { RPUI.startNext(); return; }
    APPitchScience.markPractice(AP_APP_ID);
    releaseAllKeys();
    window.clearTimeout(freeDisplayTimeout);
    resetKeyboardColors();

    let target;
    if (testMode === "interval") {
        // Draw a distance independently, then a reference that supports every allowed distance.
        const pair = pickIntervalQuestion();
        if (!pair) {
            setStatus("intervalNoRepeat");
            return;
        }
        target = pair.target;
        currentReferenceMidi = pair.reference;
    } else {
        const targets = [];
        for (let pitch = minMidi; pitch <= maxMidi; pitch += 1) {
            targets.push(pitch);
        }
        if (!targets.length) {
            setStatus("distinctRangeError");
            return;
        }
        target = targets[Math.floor(Math.random() * targets.length)];
        currentReferenceMidi = null;
    }

    testActive = true;
    answered = false;
    legacyAudioReady = false;
    questionSerial += 1;
    updatePlayButton();
    currentMidi = target;
    if (testMode === "interval") {
        setStatus("listenInterval", { note: spelledNoteName(currentReferenceMidi, KEY_FIFTHS[keyName]) });
        setAnswer("chooseInterval");
        markReferenceKey();
        jumpToReferenceOctave();
    } else {
        setStatus("listen");
        setAnswer("choose");
    }
    drawQuestionStaff();
    updateStaffReplayAccess();
    playQuestion().catch(() => setStatus("audioRetry"));
}

function abandonQualifyingCold() {
    // No streak or promotion penalty: the cold check is now optional.
    if (apSession?.kind === "cold" && !apSession.finished) {
        apSession.interrupted = true;
    }
}
function saveInterruptedApSession() {
    if (!apSession || apSession.finished) return;
    const session = apSession, metric = apMetricFor(session);
    session.interrupted = true;
    session.finished = true;
    APPitchScience.putRows(AP_APP_ID, "sessions", [{
        id:session.id, kind:session.kind, protocol:AP_PROTOCOL, timbre:session.timbre,
        day:session.day, level:session.level, started:session.startAt,
        finished:Date.now(), interrupted:true, eligible:false,
        total:session.total, attempted:session.records.length, effectiveRange:session.effectiveRange,
        range:[minMidi,maxMidi], limitMs:session.limitMs, known:session.known, ...metric
    }]);
}
function stopTest() {
    if (testMode === "rpCourse") { RPUI.stop(); return; }
    abandonQualifyingCold();
    saveInterruptedApSession();
    TrainingTracker.pause();
    clearApTimer();
    window.clearTimeout(autoNextTimer);
    setApMessage(null);
    apSession = null;
    apAudioReady = false;
    clearApFeedback();
    if (!ready) {
        return;
    }

    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    releaseAllKeys();
    testActive = false;
    currentMidi = null;
    currentReferenceMidi = null;
    questionSerial += 1;
    answered = false;
    updatePlayButton();
    updateStaffReplayAccess();

    resetKeyboardColors();
    drawStaff();

    setStatus("stopped");
    setAnswer(isApMode() ? "apStart" : "free");
    updateApView();
}

function freePlay(midi, pointerId) {
    TrainingTracker.activity("free-play");
    APPitchScience.markPractice(AP_APP_ID);
    activePointers.set(pointerId, midi);
    if (!activeVoices.has(midi) && !pendingVoices.has(midi)) {
        pendingVoices.add(midi);
        ensureAudio().then(() => {
            pendingVoices.delete(midi);
            if (!testActive && !demoRunning && [...activePointers.values()].includes(midi)
                && !activeVoices.has(midi)) {
                playFreeVoice(midi);
            }
        }).catch(() => pendingVoices.delete(midi));
    }
    renderHeldNotes();
}

function answer(selectedMidi) {
    if (!demoRunning && (!testActive || answered || !legacyAudioReady)) return;
    TrainingTracker.activity("answer");
    answered = true;
    questionSerial += 1;
    updatePlayButton();
    updateStaffReplayAccess();

    const correctAnswer = selectedMidi === currentMidi;
    const fifths = KEY_FIFTHS[keyName];
    const targetName = spelledNoteName(currentMidi, fifths);

    resetKeyboardColors();
    markReferenceKey();

    if (correctAnswer) {
        markPitch(selectedMidi, "correct");
    } else {
        markPitch(selectedMidi, "wrong");
        markPitch(currentMidi, "correct");
    }

    if (testMode === "interval" && currentReferenceMidi !== null) {
        const selectedDistance = selectedMidi - currentReferenceMidi;
        const correctDistance = currentMidi - currentReferenceMidi;
        const distanceText = (value) => `${value > 0 ? "+" : ""}${value}`;
        setStatus(correctAnswer ? "correctInterval" : "wrongInterval", {
            selected: distanceText(selectedDistance),
            correct: distanceText(correctDistance)
        });
        setAnswer("raw", { text: formatAnswerText() });
        drawAnsweredStaff();
        showCorrectKeyIfHidden();
        playQuestion().catch(() => setStatus("audioRetry"));
    } else {
        setStatus(correctAnswer ? "correct" : "wrong", { note: targetName });
        setAnswer("raw", { text: formatAnswerText() });
        drawStaff(currentMidi);
        playTone(currentMidi);
    }
    // A miss stays on screen until Next; a hit moves on after its feedback sound.
    if (correctAnswer) scheduleAutoNext(testMode === "interval" ? 2000 : 1100);
}

function pressKey(midi, pointerId) {
    if (testMode === "rpCourse" && !demoRunning && RPUI.answerPosition(midi)) return;
    if (isApMode() && !demoRunning) return; // Never play a reference note in the assessment.
    if (!ready) {
        return;
    }

    if (testActive && currentMidi !== null && !answered) {
        if (testMode === "interval" && midi === currentReferenceMidi) {
            // A marked reference key is a replay control, not a valid answer.
            playQuestion().catch(() => setStatus("audioRetry"));
        } else {
            answer(midi);
        }
        return;
    }

    if (testActive) {
        playTone(midi);
        return;
    }

    freePlay(midi, pointerId);
}

function applySettings() {
    if (player) player.cancelQueue(audioContext);
    TrainingCore.cancelAudio();
    abandonQualifyingCold();
    saveInterruptedApSession();
    if (elements.instrumentSelect.value === "violin" && !violinReady) {
        setControlsEnabled(false);
        setStatus("loadingViolin");
        loadViolinPreset().then(() => {
            setControlsEnabled(true);
            if (!demoRunning && elements.instrumentSelect.value === "violin") applySettings();
        }).catch(() => {
            elements.instrumentSelect.value = instrumentMode;
            setControlsEnabled(true);
            setStatus("violinAudioError");
        });
        return;
    }
    const startMidi = Number(elements.startNote.value);
    const endMidi = Number(elements.endNote.value);
    const rpConfig = elements.modeSelect.value === "rpCourse";

    if (elements.instrumentSelect.value === "violin" &&
        (startMidi < VIOLIN_MIN_MIDI || endMidi > VIOLIN_MAX_MIDI)) {
        setStatus("violinRangeError");
        return;
    }
    if (startMidi > endMidi) {
        setStatus("invalidRange");
        return;
    }
    if (startMidi === endMidi) {
        setStatus("distinctRangeError");
        return;
    }
    if (["ap", "apLearn", "apCold"].includes(elements.modeSelect.value) && apEligiblePitches(startMidi, endMidi).length < 2) {
        setStatus("apNeedRange");
        return;
    }
    if (elements.modeSelect.value === "interval") {
        const minDistance = Number(elements.minIntervalSelect.value);
        const maxDistance = elements.maxIntervalSelect.value === "unlimited"
            ? null : Number(elements.maxIntervalSelect.value);
        if (maxDistance !== null && minDistance > maxDistance) {
            setStatus("invalidIntervalLimits");
            return;
        }
        const pools = intervalTargetPools(startMidi, endMidi, minDistance,
            maxDistance, elements.directionSelect.value);
        if (!pools.length) {
            setStatus("intervalNoPairs");
            return;
        }
    
    }

    if (window.RPUI) RPUI.configurationApplied();
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    instrumentMode = elements.instrumentSelect.value;
    document.getElementById("helpText").textContent = t("hint");
    minMidi = rpConfig ? SUPPORTED_MIN_MIDI : startMidi;
    maxMidi = rpConfig ? SUPPORTED_MAX_MIDI : endMidi;
    keyName = elements.keySelect.value;
    clefMode = elements.clefSelect.value;
    testMode = elements.modeSelect.value;
    clearApTimer();
    window.clearTimeout(autoNextTimer);
    setApMessage(null);
    apSession = null;
    apAudioReady = false;
    clearApFeedback();
    maxIntervalSemitones = elements.maxIntervalSelect.value === "unlimited"
        ? null : Number(elements.maxIntervalSelect.value);
    minIntervalSemitones = Number(elements.minIntervalSelect.value);
    targetDirection = elements.directionSelect.value;
    updateIntervalPickerVisibility();

    releaseAllKeys();
    window.clearTimeout(freeDisplayTimeout);
    currentMidi = null;
    currentReferenceMidi = null;
    questionSerial += 1;
    answered = false;
    testActive = false;
    updatePlayButton();
    updateStaffReplayAccess();

    resetKeyboardColors();
    drawKeyboard();
    drawStaff();

    setStatus("range", {
        from: noteName(minMidi), to: noteName(maxMidi),
        key: keySignatureLabel(keyName), clef: t(clefMode.toLowerCase())
    });
    setAnswer(isApMode() ? "apStart" : "free");
    updateApView();
    RPUI.modeChanged();
}

function populateSelectors() {
    for (
        let midi = SUPPORTED_MIN_MIDI;
        midi <= SUPPORTED_MAX_MIDI;
        midi += 1
    ) {
        const startOption = document.createElement("option");
        startOption.value = String(midi);
        startOption.textContent = noteName(midi);
        elements.startNote.appendChild(startOption);

        const endOption = document.createElement("option");
        endOption.value = String(midi);
        endOption.textContent = noteName(midi);
        elements.endNote.appendChild(endOption);
    }

    KEY_OPTIONS.forEach((key) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key;
        elements.keySelect.appendChild(option);
    });

    elements.startNote.value = String(DEFAULT_MIN_MIDI);
    elements.endNote.value = String(DEFAULT_MAX_MIDI);
    elements.keySelect.value = "C major";
    elements.clefSelect.value = "Treble";
    const unlimited = document.createElement("option");
    unlimited.value = "unlimited";
    elements.maxIntervalSelect.appendChild(unlimited);
    for (let semitones = 1; semitones <= 24; semitones += 1) {
        const option = document.createElement("option");
        option.value = String(semitones);
        option.textContent = String(semitones);
        elements.maxIntervalSelect.appendChild(option);
    }
    elements.maxIntervalSelect.value = "unlimited";
    for (let semitones = 1; semitones <= 24; semitones += 1) {
        const option = document.createElement("option");
        option.value = String(semitones);
        option.textContent = String(semitones);
        elements.minIntervalSelect.appendChild(option);
    }
    elements.minIntervalSelect.value = "1";
    elements.directionSelect.value = "both";
    elements.modeSelect.value = "single";
    elements.instrumentSelect.value = "violin";
}

function initializeAudio() {
    document.getElementById("audioReload").hidden=true;
    setStatus("loadingViolin");
    setControlsEnabled(false);
    if (player === null) {
        setStatus("audioError");
        document.getElementById("audioReload").hidden=false;
        return;
    }
    loadViolinPreset().then(() => {
        ready = true;
        setControlsEnabled(true);
        setStatus("ready");
        setAnswer("free");
        document.getElementById("demoButton").disabled = false;
        updatePlayButton();updateApView();
    }).catch(() => {
        setStatus("audioError");document.getElementById("audioReload").hidden=false;
    });
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    const button = document.getElementById("updateButton");
    let reloading = false, lastCheck = Date.now();
    // A new version never takes over during training. It waits until the learner
    // taps the button (outside a round) or closes every window of the app.
    const offer = (registration) => {
        if (!registration.waiting || !navigator.serviceWorker.controller) return;
        button.hidden = false;
        button.onclick = () => {
            if (testActive || demoRunning || !registration.waiting) return;
            reloading = true; button.disabled = true;
            registration.waiting.postMessage({type: "SKIP_WAITING"});
        };
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloading) location.reload(); });
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
        offer(registration);
        registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (worker) worker.addEventListener("statechange", () => { if (worker.state === "installed") offer(registration); });
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden || testActive || Date.now() - lastCheck < 3600000) return;
            lastCheck = Date.now();
            registration.update().catch(() => {});
        });
    }).catch(() => {});
}

const unlessDemo = (callback) => (event) => {
    if (!demoRunning) callback(event);
};

// Users choose difficulty directly; cold checks remain a measurement, not a lock.
const apLevelSelect = document.getElementById("apLevelSelect");
for (let level = 1; level <= 12; level++) {
    const option = document.createElement("option");
    option.value = String(level);
    option.textContent = `${level} / 12`;
    apLevelSelect.appendChild(option);
}
apLevelSelect.value = String(apCourse.level);
apLevelSelect.addEventListener("change", unlessDemo(() => {
    if (apSession && !apSession.finished) {
        apLevelSelect.value = String(apCourse.level);
        return;
    }
    const selected = Number(apLevelSelect.value);
    if (!Number.isInteger(selected) || selected < 1 || selected > 12) return;
    apCourse.level = selected;
    apCourse.courseVersion = 4;
    APPitchScience.saveCourse(AP_APP_ID, apCourse);
    apSession = null;
    testActive = false;
    answered = false;
    updateApView();
}));
elements.applyButton.addEventListener("click", unlessDemo(applySettings));
elements.modeSelect.addEventListener("change", unlessDemo(() => {
    // Respect the explicitly selected range in every mode, the cold check included:
    // nothing rewrites From/To when the mode changes.
    if (ready) applySettings(); else updateIntervalPickerVisibility();
}));
elements.playButton.addEventListener("click", unlessDemo(() => {
    if (testActive) stopTest();
    else newQuestion();
}));
elements.nextButton.addEventListener("click", unlessDemo(newQuestion));
elements.intervalReplayButton.addEventListener("click", unlessDemo(() => {
    if (testActive && testMode === "interval") {
        TrainingTracker.activity("question");
        playQuestion();
    }
}));
document.getElementById("languageSelect").addEventListener("change", unlessDemo((event) => setLanguage(event.target.value)));
function invalidateHiddenAp() {
    if (!apSession || apSession.finished || !isApMode()) return;
    if (apSession.kind === "cold") {
        apSession.interrupted = true;
        apSession.hiddenCount = (apSession.hiddenCount || 0) + 1;
        if (answered) setStatus("apColdInvalidated");
    }
    if (testActive && !answered) recordApAnswer(null, "interrupted");
}
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (testActive && !isApMode() && testMode !== "rpCourse" && !demoRunning) stopTest();
        invalidateHiddenAp();
        releaseAllKeys();
        if (demoRunning) {
            cancelDemo();
        }
    }
});
window.addEventListener("blur", () => {
    invalidateHiddenAp();
    if (testActive && !isApMode() && testMode !== "rpCourse" && !demoRunning) stopTest();
    releaseAllKeys();
});
window.addEventListener("pagehide", abandonQualifyingCold);

document.getElementById("audioReload").addEventListener("click", () => location.reload());
document.getElementById("appVersion").textContent = APP_VERSION;
populateSelectors();
createApAnswerButtons();
rememberToggle("apMaskCheck", AP_MASK_KEY);
rememberToggle("autoNextCheck", AUTO_NEXT_KEY);
RPUI.init();
document.getElementById("apExportButton").addEventListener("click", exportApCSV);
document.getElementById("apRepeatNote").addEventListener("click", unlessDemo(() => {
    if (testMode !== "apLearn" || !apSession || apSession.finished || apFeedbackPlaying || currentMidi === null) return;
    TrainingTracker.activity("ap-learning");
    if (answered) playTone(currentMidi).catch(() => setStatus("audioRetry"));
    else if (apAudioReady) {
        apSession.replayed=(apSession.replayed||0)+1;apAudioReady=false;updateApView();
        playApPitch(currentMidi,questionSerial,false).catch(()=>setStatus("audioRetry"));
    }
}));
window.addEventListener("training-storage-error", () => {
    const warning=document.getElementById("storageWarning");warning.hidden=false;warning.textContent=t("storageWarning");
});

refreshApHistory();
updateIntervalPickerVisibility();
setLanguage(resolveInitialLanguage());
drawKeyboard();
drawStaff();
function redrawViolinBoard() {
    releaseAllKeys();
    drawKeyboard();
    if (testActive && testMode === "interval" && currentReferenceMidi !== null) markPitch(currentReferenceMidi,"reference");
    if (testActive && ["single","interval"].includes(testMode) && answered && currentMidi !== null) markPitch(currentMidi,"correct");
    if (testMode === "rpCourse") RPUI.redraw();
}
if (window.ResizeObserver) {
    // v2.3.1 drew the board 300 px wide whenever it was hidden at draw time (after any AP
    // mode): the E string was cut off on 320 px screens and a blank strip appeared on wider ones.
    new ResizeObserver(() => {
        const width = elements.keyboardScroller.clientWidth;
        if (instrumentMode !== "violin" || demoRunning || !width || width === violinDrawnWidth) return;
        redrawViolinBoard();
    }).observe(elements.keyboardScroller);
}
window.addEventListener("resize", () => {
    if (demoRunning) return;
    const previousOffset = elements.keyboardScroller.scrollLeft;
    if (instrumentMode === "violin") {
        redrawViolinBoard();
        return;
    }
    const oldMinX = keyboardMinX;
    const target = octaveGroups().reduce((best, group) => {
        const distance = Math.abs(keyBounds(group.midi).left - oldMinX - previousOffset);
        return distance < best.distance ? { midi: group.midi, distance } : best;
    }, { midi: minMidi, distance: Infinity });
    releaseAllKeys();
    drawKeyboard();
    showOctave(target.midi, "auto");
    // Keep the existing answer and staff contents intact while resizing.
});
initializeAudio();
registerServiceWorker();


function midiFromName(name) {
    const match = name.match(/^([A-G])(#|b)?(-?\d+)$/);

    if (!match) {
        throw new Error(`Invalid note name: ${name}`);
    }

    const pitchClasses = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11
    };

    let pitchClass = pitchClasses[match[1]];

    if (match[2] === "#") {
        pitchClass += 1;
    } else if (match[2] === "b") {
        pitchClass -= 1;
    }

    const octave = Number(match[3]);

    return 12 * (octave + 1) + pitchClass;
}

function sleep(ms) {
    return new Promise((resolve) => {
        const finish = () => {
            window.clearTimeout(timer);
            demoWaits.delete(finish);
            resolve();
        };
        const timer = window.setTimeout(finish, ms);
        demoWaits.add(finish);
    });
}

function cancelDemo() {
    demoCancelled = true;
    if (player) player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    if (demoTimer !== null) {
        window.clearInterval(demoTimer);
        demoTimer = null;
    }
    if (demoResolve !== null) {
        const resolve = demoResolve;
        demoResolve = null;
        resolve();
    }
    for (const finish of [...demoWaits]) finish();
}

function createDemoInterface() {
    const button = document.getElementById("demoButton");
    button.addEventListener("click", () => {
        if (demoRunning) {
            cancelDemo();
        } else {
            runDemo();
        }
    });
    const pointer = document.createElement("div");
    pointer.id = "demoPointer";
    document.body.appendChild(pointer);
}

function demoPointer() {
    return document.getElementById("demoPointer");
}

async function pointToElement(element, tap = true) {
    element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    const pointer = demoPointer();
    const rect = element.getBoundingClientRect();

    pointer.style.left = `${rect.left + rect.width / 2}px`;
    pointer.style.top = `${rect.top + rect.height / 2}px`;
    pointer.classList.add("visible");

    await sleep(330);

    if (tap) {
        pointer.classList.add("tap");
        await sleep(150);
        pointer.classList.remove("tap");
    }
}

function hideDemoPointer() {
    const pointer = demoPointer();
    pointer.classList.remove("visible", "tap");
}

function setDemoControlsLocked(locked) {
    const button = document.getElementById("demoButton");
    button.disabled = !ready;
    button.textContent = locked ? t("stopDemo") : t("demo");
}

function startDemoQuestion(midi, referenceMidi = null) {
    resetKeyboardColors();
    testActive = true;
    questionSerial += 1;
    currentMidi = midi;
    currentReferenceMidi = testMode === "interval" ? referenceMidi : null;
    answered = false;
    updatePlayButton();
    drawQuestionStaff();
    updateStaffReplayAccess();
    if (testMode === "interval") {
        setStatus("listenInterval", { note: spelledNoteName(referenceMidi, KEY_FIFTHS[keyName]) });
        setAnswer("chooseInterval");
        markReferenceKey();
        jumpToReferenceOctave();
    } else {
        setStatus("listen");
        setAnswer("choose");
    }
    playQuestion();
}

async function demoAnswer(selectedMidi) {
    const key = keyElements.get(selectedMidi);

    await pointToElement(key);
    answer(selectedMidi);
}

// Original published score: Beethoven Op.61, III. Rondo, opening solo violin line.
// Mutopia #1165 LilyPond transcription, no invented accompaniment.
const DEMO_TEMPO = 132;
const DEMO_GAP_SECONDS = 0.025;
const DEMO_MELODY_VOLUME = 0.72;

function prepareDemoEvents(data) {
    return data.events
        .filter((event) => event.part === "melody")
        .map((event) => ({ ...event, volume: DEMO_MELODY_VOLUME }))
        .sort((a, b) => a.start - b.start || a.midi - b.midi);
}

const DEMO_EVENTS = prepareDemoEvents(window.DEMO_SCORE_DATA);

function demoJumpOctave(midi) {
    if (instrumentMode === "violin") {
        const step = violinPositionForMidi(midi)?.step ?? 0;
        midi = step >= 9 ? 9 : step >= 5 ? 5 : 0;
    }
    if (midi === null || midi === demoSelectedOctave) return;
    const button = [...document.querySelectorAll(".octave-jump")].find((element) => (
        Number(element.dataset.midi) === midi
    ));
    if (!button) return;
    demoSelectedOctave = midi;
    showOctave(midi, "auto");
    highlightOctave(midi);
    const pointer = demoPointer();
    const rect = button.getBoundingClientRect();
    pointer.style.left = `${rect.left + rect.width / 2}px`;
    pointer.style.top = `${rect.top + rect.height / 2}px`;
    pointer.classList.add("visible", "tap");
    window.clearTimeout(demoOctaveTapTimeout);
    demoOctaveTapTimeout = window.setTimeout(() => {
        pointer.classList.remove("visible", "tap");
    }, 145);
}

function buildDemoMusicPointers() {
    if (document.querySelector(".demo-music-pointer")) return;
    for (let i = 0; i < 5; i += 1) {
        const pointer = document.createElement("div");
        pointer.className = "demo-music-pointer";
        document.body.appendChild(pointer);
    }
}

function hideDemoMusicPointers() {
    document.querySelectorAll(".demo-music-pointer").forEach((pointer) => {
        pointer.classList.remove("visible");
    });
}

function renderDemoChord(events) {
    const midis = [...new Set(events.map((event) => event.midi))].sort((a, b) => a - b);
    renderNotes(midis, { keepStatus: true });
    const view = elements.keyboardScroller.getBoundingClientRect();
    const visible = midis.map((midi) => keyElements.get(midi)?.getBoundingClientRect()).filter(
        (rect) => rect && rect.right > view.left + 6 && rect.left < view.right - 6
    );
    const pointers = [...document.querySelectorAll(".demo-music-pointer")];
    pointers.forEach((pointer, index) => {
        const rect = visible[index];
        if (!rect) {
            pointer.classList.remove("visible");
            return;
        }
        pointer.style.left = `${(Math.max(rect.left, view.left) + Math.min(rect.right, view.right)) / 2}px`;
        pointer.style.top = `${rect.top + Math.min(rect.height * 0.7, 150)}px`;
        pointer.classList.add("visible");
    });
}

async function playViolinConcertoDemo() {
    await ensureAudio();
    if (demoCancelled) return;
    player.cancelQueue(audioContext); TrainingCore.cancelAudio();
    buildDemoMusicPointers();
    setStatus("demoTitle");
    const data = window.DEMO_SCORE_DATA;
    const secondsPerTick = (60 / DEMO_TEMPO) / data.ticksPerQuarter;
    const startTime = audioContext.currentTime + 0.18;
    const events = DEMO_EVENTS;
    const finalTick = data.stopTick;
    let next = 0;
    let previousSignature = null;

    await new Promise((resolve) => {
        demoResolve = resolve;
        demoTimer = window.setInterval(() => {
            if (demoCancelled || document.hidden) {
                cancelDemo();
                return;
            }
            const now = audioContext.currentTime;
            const tick = Math.max(0, (now - startTime) / secondsPerTick);
            const horizon = now + 0.20;
            while (next < events.length && startTime + events[next].start * secondsPerTick < horizon) {
                const event = events[next++];
                const duration = Math.max(
                    0.05,
                    (event.end - event.start) * secondsPerTick - DEMO_GAP_SECONDS
                );
                player.queueWaveTable(
                    audioContext, audioContext.destination, demoPreset(),
                    startTime + event.start * secondsPerTick,
                    event.midi, duration, event.volume
                );
            }
            const sounding = events.filter((event) => event.start <= tick && tick < event.end);
            // Do not choose the most-used octave of an entire measure.
            // It can hide currently playing notes across C4/C5 boundaries.
            // The melody is monophonic; follow its current pitch directly.
            // In a rest, get ready for the next note so the first key is visible.
            const visibleEvent = sounding[0] || events.find((event) => event.start > tick);
            if (visibleEvent) {
                demoJumpOctave(instrumentMode === "violin"
                    ? visibleEvent.midi : Math.floor(visibleEvent.midi / 12) * 12);
            }
            const signature = sounding.map((event) => event.midi).sort((a, b) => a - b).join(",");
            if (signature !== previousSignature) {
                renderDemoChord(sounding);
                previousSignature = signature;
            }
            if (tick >= finalTick + 0.25 * data.ticksPerQuarter) {
                window.clearInterval(demoTimer);
                demoTimer = null;
                demoResolve = null;
                resolve();
            }
        }, 25);
    });
    hideDemoMusicPointers();
    resetKeyboardColors();
}


function captureDemoSnapshot() {
    return {
        applied: { minMidi, maxMidi, keyName, clefMode, testMode, maxIntervalSemitones, minIntervalSemitones, targetDirection, instrumentMode },
        form: {
            startNote: elements.startNote.value,
            endNote: elements.endNote.value,
            keySelect: elements.keySelect.value,
            clefSelect: elements.clefSelect.value,
            modeSelect: elements.modeSelect.value,
            maxIntervalSelect: elements.maxIntervalSelect.value,
            minIntervalSelect: elements.minIntervalSelect.value,
            directionSelect: elements.directionSelect.value,
            apTrialsSelect: elements.apTrialsSelect.value,
            apTimeSelect: elements.apTimeSelect.value,
            instrumentSelect: elements.instrumentSelect.value
        },
        state: { testActive, answered, currentMidi, currentReferenceMidi },
        ap: {session: apSession ? { ...apSession, records: apSession.records.map((entry) => ({...entry})) } : null,
            remainingMs: apDeadline === null ? null : Math.max(0, apDeadline - Date.now()),
            audioReady: apAudioReady, message: apMessageBuild},
        status: { ...statusMessage },
        answer: { ...answerMessage },
        keyClasses: [...keyElements.entries()].map(([midi, element]) => ({
            midi,
            state: ["correct", "wrong", "reference"].filter((name) => element.classList.contains(name))
        })),
        keyboardScrollLeft: elements.keyboardScroller.scrollLeft,
        pageScrollY: window.scrollY
    };
}

function restoreDemoSnapshot(snapshot) {
    const { applied, form, state } = snapshot;
    elements.startNote.value = String(applied.minMidi);
    elements.endNote.value = String(applied.maxMidi);
    elements.keySelect.value = applied.keyName;
    elements.clefSelect.value = applied.clefMode;
    elements.modeSelect.value = applied.testMode;
    elements.maxIntervalSelect.value = applied.maxIntervalSemitones === null
        ? "unlimited" : String(applied.maxIntervalSemitones);
    elements.minIntervalSelect.value = String(applied.minIntervalSemitones);
    elements.directionSelect.value = applied.targetDirection;
    elements.instrumentSelect.value = applied.instrumentMode;
    applySettings();

    elements.startNote.value = form.startNote;
    elements.endNote.value = form.endNote;
    elements.keySelect.value = form.keySelect;
    elements.clefSelect.value = form.clefSelect;
    elements.modeSelect.value = form.modeSelect;
    elements.maxIntervalSelect.value = form.maxIntervalSelect;
    elements.minIntervalSelect.value = form.minIntervalSelect;
    elements.directionSelect.value = form.directionSelect;
    elements.apTrialsSelect.value = form.apTrialsSelect;
    elements.apTimeSelect.value = form.apTimeSelect;
    updateIntervalPickerVisibility();
    elements.instrumentSelect.value = form.instrumentSelect;
    testActive = state.testActive;
    answered = state.answered;
    currentMidi = state.currentMidi;
    currentReferenceMidi = state.currentReferenceMidi;
    apSession = snapshot.ap.session;
    apAudioReady = snapshot.ap.audioReady;
    setApMessage(snapshot.ap.message);
    if (apSession && isApMode() && testActive && !answered && snapshot.ap.remainingMs !== null) {
        const remaining = Math.max(1, snapshot.ap.remainingMs);
        apDeadline = Date.now() + remaining;
        apTimer = window.setTimeout(() => recordApAnswer(null), remaining);
    }
    questionSerial += 1;
    updatePlayButton();
    updateStaffReplayAccess();

    resetKeyboardColors();
    snapshot.keyClasses.forEach(({ midi, state: classNames }) => {
        const key = keyElements.get(midi);
        if (key) classNames.forEach((name) => markPitch(midi, name));
    });
    if (!isApMode() && testActive && currentMidi !== null && answered) {
        drawAnsweredStaff();
    } else {
        drawQuestionStaff();
    }
    setStatus(snapshot.status.key, snapshot.status.args);
    setAnswer(snapshot.answer.key, snapshot.answer.args);
    updateApView();
    elements.keyboardScroller.scrollTo({ left: snapshot.keyboardScrollLeft, behavior: "instant" });
    window.scrollTo({ top: snapshot.pageScrollY, behavior: "instant" });
}

async function runDemo() {
    if (!ready || demoRunning) return;
    if (testActive) { setStatus("apBlockedDuringTest"); return; }
    APPitchScience.markPractice(AP_APP_ID);
    TrainingTracker.pause();
    const snapshot = captureDemoSnapshot();
    clearApTimer();
    demoRunning = true;
    demoCancelled = false;
    document.querySelector(".app-shell").classList.remove("ap-mode");
    document.querySelector(".app-shell").classList.add("demo-running");
    setDemoControlsLocked(true);

    try {
        await ensureAudio();
        if (demoCancelled) return;
        player.cancelQueue(audioContext); TrainingCore.cancelAudio();
        releaseAllKeys();
        elements.startNote.value = String(midiFromName("C4"));
        elements.endNote.value = String(midiFromName("B4"));
        elements.keySelect.value = "C major";
        elements.clefSelect.value = "Treble";
        elements.modeSelect.value = "single";

        await pointToElement(elements.applyButton);
        if (demoCancelled) return;
        applySettings();
        await sleep(400);

        if (demoCancelled) return;
        await pointToElement(elements.playButton);
        if (demoCancelled) return;
        startDemoQuestion(midiFromName("F#4"));
        await sleep(750);

        if (demoCancelled) return;
        await demoAnswer(midiFromName("G4"));
        if (demoCancelled) return;
        await sleep(750);

        if (demoCancelled) return;
        await pointToElement(elements.nextButton);
        if (demoCancelled) return;
        startDemoQuestion(midiFromName("A4"));
        await sleep(720);

        if (demoCancelled) return;
        await demoAnswer(midiFromName("A4"));
        if (demoCancelled) return;
        await sleep(720);

        if (demoCancelled) return;
        await pointToElement(elements.playButton);
        if (demoCancelled) return;
        stopTest();
        await sleep(280);

        // Demonstrate two-note training before the Op.61 violin solo excerpt.
        if (demoCancelled) return;
        elements.modeSelect.value = "interval";
        await pointToElement(elements.modeSelect);
        if (demoCancelled) return;
        await pointToElement(elements.applyButton);
        if (demoCancelled) return;
        applySettings();
        await sleep(230);
        if (demoCancelled) return;
        await pointToElement(elements.playButton);
        if (demoCancelled) return;
        startDemoQuestion(midiFromName("A4"), midiFromName("F4"));
        await sleep(1850);
        if (demoCancelled) return;
        await demoAnswer(midiFromName("A4"));
        if (demoCancelled) return;
        await sleep(1950); // Let the two-note feedback replay complete.
        if (demoCancelled) return;
        await pointToElement(elements.playButton);
        if (demoCancelled) return;
        stopTest();
        await sleep(280);

        if (demoCancelled) return;
        elements.startNote.value = String(midiFromName("C4"));
        elements.endNote.value = String(midiFromName("E5"));
        elements.keySelect.value = "D major";
        elements.clefSelect.value = "Treble";
        elements.modeSelect.value = "single";
        await pointToElement(elements.applyButton);
        if (demoCancelled) return;
        applySettings();
        await sleep(350);

        if (demoCancelled) return;
        hideDemoPointer();
        setStatus("demoFree");
        setAnswer("raw", { text: t("demoTitle") });
        await sleep(320);
        if (demoCancelled) return;
        document.querySelector(".keyboard-card").scrollIntoView({ block: "end", behavior: "instant" });
        await playViolinConcertoDemo();
    } finally {
        hideDemoPointer();
        hideDemoMusicPointers();
        window.clearTimeout(demoOctaveTapTimeout);
        if (demoTimer !== null) {
            window.clearInterval(demoTimer);
            demoTimer = null;
        }
        demoResolve = null;
        player.cancelQueue(audioContext); TrainingCore.cancelAudio();
        demoSelectedOctave = null;
        demoRunning = false;
        demoCancelled = false;
        releaseAllKeys();
        window.clearTimeout(freeDisplayTimeout);
        document.querySelector(".app-shell").classList.remove("demo-running", "demo-music");
        restoreDemoSnapshot(snapshot);
        setDemoControlsLocked(false);
    }
}


createDemoInterface();
