const APP_VERSION = "violin-v2";
const PLAY_DURATION = 1.4;
const SUPPORTED_MIN_MIDI = 55;
const SUPPORTED_MAX_MIDI = 88;
const DEFAULT_MIN_MIDI = 60;
const DEFAULT_MAX_MIDI = 71;
const VIOLIN_OPEN_STRINGS = [{ name: "E5", midi: 76 }, { name: "A4", midi: 69 }, { name: "D4", midi: 62 }, { name: "G3", midi: 55 }];
const VIOLIN_MAX_POSITION = 12;
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

const LETTER_INDICES = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6
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

const TREBLE_SHARP_POSITIONS = [
    ["F", 5],
    ["C", 5],
    ["G", 5],
    ["D", 5],
    ["A", 4],
    ["E", 5],
    ["B", 4]
];

const TREBLE_FLAT_POSITIONS = [
    ["B", 4],
    ["E", 5],
    ["A", 4],
    ["D", 5],
    ["G", 4],
    ["C", 5],
    ["F", 4]
];

const BASS_SHARP_POSITIONS = [
    ["F", 3],
    ["C", 3],
    ["G", 3],
    ["D", 3],
    ["A", 2],
    ["E", 3],
    ["B", 2]
];

const BASS_FLAT_POSITIONS = [
    ["B", 2],
    ["E", 3],
    ["A", 2],
    ["D", 3],
    ["G", 2],
    ["C", 3],
    ["F", 2]
];

// An octave fits fully inside the available phone viewport, including B.
let WHITE_WIDTH = 52;
let BLACK_WIDTH = 32;
const SVG_NS = "http://www.w3.org/2000/svg";

const elements = {
    status: document.getElementById("status"),
    answerText: document.getElementById("answerText"),
    startNote: document.getElementById("startNote"),
    endNote: document.getElementById("endNote"),
    keySelect: document.getElementById("keySelect"),
    clefSelect: document.getElementById("clefSelect"),
    modeSelect: document.getElementById("modeSelect"),
    instrumentSelect: document.getElementById("instrumentSelect"),
    applyButton: document.getElementById("applyButton"),
    playButton: document.getElementById("playButton"),
    nextButton: document.getElementById("nextButton"),
    staff: document.getElementById("staff"),
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
let questionSerial = 0;
let currentMidi = null;
let answered = false;
let testActive = false;
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

const VIOLIN_SAMPLE_URL = "https://surikov.github.io/webaudiofontdata/sound/0400_JCLive_sf2_file.js";
function selectedPreset() {
    return violinReady ? window._tone_0400_JCLive_sf2_file : null;
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
                player.loader.decodeAfterLoading(audioContext, "_tone_0400_JCLive_sf2_file");
                player.loader.waitLoad(() => {
                    violinReady = true;
                    resolve();
                });
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
    localStorage.setItem("violinEarTrainerLanguage", currentLanguage);
    document.documentElement.lang = currentLanguage;
    document.getElementById("languageSelect").value = currentLanguage;
    const labels = {
        languageLabel: "language", fromLabel: "from", toLabel: "to",
        keyLabel: "key", clefLabel: "clef", modeLabel: "mode", applyButton: "apply",
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
        option.textContent = t(option.value);
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
            button.setAttribute("aria-label", `${button.dataset.string} \u00b7 ${t("violinPosition", { position: button.dataset.position })} \u00b7 ${noteName(Number(button.dataset.midi))}`);
        });
    }
    updatePlayButton();
    setStatus(statusMessage.key, statusMessage.args);
    setAnswer(answerMessage.key, answerMessage.args);
    if (ready) {
        if (!testActive && activePointers.size > 0) {
            renderHeldNotes();
        } else if (testActive && answered && currentMidi !== null) {
            setAnswer("raw", { text: formatAnswerText() });
        }
    }
    if (typeof drawStaff === "function" && !demoRunning) {
        if (!testActive && activePointers.size > 0) {
            drawStaff([...new Set(activePointers.values())]);
        } else if (answered && currentMidi !== null) {
            drawAnsweredStaff();
        } else {
            drawQuestionStaff();
        }
    }
    updateStaffReplayAccess();
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

function diatonicIndex(letter, octave) {
    return octave * 7 + LETTER_INDICES[letter];
}

function resolveClef(midi) {
    if (clefMode !== "Auto") {
        return clefMode;
    }

    return midi >= 60 ? "Treble" : "Bass";
}

function staffGeometry(clef) {
    const lineSpacing = 18;
    const bottomY = 125;
    const halfStep = lineSpacing / 2;
    const bottomIndex = clef === "Treble"
        ? diatonicIndex("E", 4)
        : diatonicIndex("G", 2);

    return {
        lineSpacing,
        bottomY,
        halfStep,
        bottomIndex
    };
}

function staffY(letter, octave, clef) {
    const geometry = staffGeometry(clef);
    const noteIndex = diatonicIndex(letter, octave);

    return geometry.bottomY
        - (noteIndex - geometry.bottomIndex) * geometry.halfStep;
}

function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    return element;
}

function addSvgText(x, y, text, size = 16, weight = 600, anchor = "middle") {
    const element = svgElement("text", {
        x,
        y,
        "font-size": size,
        "font-family": "Arial, sans-serif",
        "font-weight": weight,
        "text-anchor": anchor,
        fill: "#111827"
    });

    element.textContent = text;
    elements.staff.appendChild(element);
    return element;
}

function drawKeySignature(clef, fifths) {
    if (fifths === 0) {
        return 135;
    }

    let positions;
    let symbol;

    if (fifths > 0) {
        symbol = "#";
        positions = clef === "Treble"
            ? TREBLE_SHARP_POSITIONS.slice(0, fifths)
            : BASS_SHARP_POSITIONS.slice(0, fifths);
    } else {
        symbol = "b";
        positions = clef === "Treble"
            ? TREBLE_FLAT_POSITIONS.slice(0, -fifths)
            : BASS_FLAT_POSITIONS.slice(0, -fifths);
    }

    let x = 115;

    positions.forEach(([letter, octave]) => {
        addSvgText(
            x,
            staffY(letter, octave, clef) + 6,
            symbol,
            20,
            800
        );
        x += 22;
    });

    return x + 12;
}

function drawLedgerLines(noteIndex, noteX, bottomIndex, halfStep, bottomY) {
    const topIndex = bottomIndex + 8;

    if (noteIndex < bottomIndex) {
        for (
            let lineIndex = bottomIndex - 2;
            lineIndex >= noteIndex;
            lineIndex -= 2
        ) {
            const y = bottomY - (lineIndex - bottomIndex) * halfStep;

            elements.staff.appendChild(svgElement("line", {
                x1: noteX - 18,
                y1: y,
                x2: noteX + 18,
                y2: y,
                stroke: "#111827",
                "stroke-width": 2
            }));
        }
    } else if (noteIndex > topIndex) {
        for (
            let lineIndex = topIndex + 2;
            lineIndex <= noteIndex;
            lineIndex += 2
        ) {
            const y = bottomY - (lineIndex - bottomIndex) * halfStep;

            elements.staff.appendChild(svgElement("line", {
                x1: noteX - 18,
                y1: y,
                x2: noteX + 18,
                y2: y,
                stroke: "#111827",
                "stroke-width": 2
            }));
        }
    }
}

function selectStaffClefs(midis) {
    if (clefMode !== "Auto") {
        return [clefMode];
    }
    if (midis.length === 0) {
        return ["Treble"];
    }
    const needsBass = midis.some((midi) => midi < 60);
    const needsTreble = midis.some((midi) => midi >= 60);
    if (needsBass && needsTreble) {
        return ["Treble", "Bass"];
    }
    return needsTreble ? ["Treble"] : ["Bass"];
}

function keySignatureLabel(name) {
    const [tonic, mode] = name.split(" ");
    return `${tonic} ${t(mode)}`;
}

function drawStaff(midi = null, showHint = false) {
    const midis = midi === null ? [] : (Array.isArray(midi) ? [...new Set(midi)].sort((a, b) => a - b) : [midi]);
    // Staff geometry depends on the selected range, never on held notes.
    const rangeMidis = [];
    for (let pitch = minMidi; pitch <= maxMidi; pitch += 1) {
        rangeMidis.push(pitch);
    }
    const clefs = selectStaffClefs(rangeMidis);
    const fifths = KEY_FIFTHS[keyName];
    const mixed = clefs.length === 2;
    const gap = mixed ? 160 : 0;
    const noteRecords = [];
    const allPositions = [];
    const baselines = clefs.map((clef, index) => ({
        clef,
        bottomY: 125 + gap * index,
        index,
        signatureEnd: 0
    }));

    for (const staff of baselines) {
        allPositions.push(staff.bottomY - 4 * 18, staff.bottomY);
    }

    for (const pitch of rangeMidis) {
        const clef = clefs.length === 2 ? (pitch < 60 ? "Bass" : "Treble") : clefs[0];
        const staff = baselines.find((item) => item.clef === clef);
        const note = spelledNote(pitch, fifths);
        const geometry = staffGeometry(clef);
        allPositions.push(staff.bottomY - (diatonicIndex(note.letter, note.octave) - geometry.bottomIndex) * geometry.halfStep);
    }

    for (const pitch of midis) {
        const clef = clefs.length === 2 ? (pitch < 60 ? "Bass" : "Treble") : clefs[0];
        const staff = baselines.find((item) => item.clef === clef);
        const note = spelledNote(pitch, fifths);
        const geometry = staffGeometry(clef);
        const noteIndex = diatonicIndex(note.letter, note.octave);
        const y = staff.bottomY - (noteIndex - geometry.bottomIndex) * geometry.halfStep;
        noteRecords.push({ pitch, clef, staff, note, noteIndex, y, geometry });
        allPositions.push(y);
    }

    const top = Math.min(...allPositions, 45) - 35;
    const bottom = Math.max(...allPositions, 130) + 58;
    elements.staff.setAttribute("viewBox", `0 ${top} 800 ${bottom - top}`);
    elements.staff.replaceChildren();

    for (const staff of baselines) {
        for (let line = 0; line < 5; line += 1) {
            const y = staff.bottomY - line * 18;
            elements.staff.appendChild(svgElement("line", {
                x1: 35, y1: y, x2: 765, y2: y,
                stroke: "#111827", "stroke-width": 2
            }));
        }
        const clefX = 70;
        addSvgText(clefX, staff.bottomY - 4 * 18 - 10,
            t(staff.clef === "Treble" ? "treble" : "bass"), 12, 800);

        staff.signatureEnd = drawKeySignatureAt(staff.clef, fifths, staff.bottomY);
    }

    addSvgText(710, Math.min(...allPositions, 45) - 16, keySignatureLabel(keyName), 12, 800);

    if (midis.length === 0) {
        if (showHint) {
            addSvgText(400, baselines.at(-1).bottomY + 31, t("staffHidden"), 12, 500);
        }
        return;
    }

    const baseX = Math.max(380, ...baselines.map((item) => item.signatureEnd + 80));
    const accidentalItems = [];

    for (const staff of baselines) {
        const group = noteRecords.filter((item) => item.staff === staff);
        let previousIndex = null;
        let shifted = false;

        for (const item of group) {
            if (previousIndex !== null && item.noteIndex - previousIndex <= 1) {
                shifted = !shifted;
            } else {
                shifted = false;
            }
            item.x = baseX + (shifted ? 19 : 0);
            previousIndex = item.noteIndex;
        }

        for (const item of group) {
            drawLedgerLinesAt(item.noteIndex, item.x, item.geometry.bottomIndex,
                item.geometry.halfStep, item.staff.bottomY);
        }

        for (const item of group) {
            const keyAccidental = keySignature(fifths)[item.note.letter];
            const sharedStep = group.some((other) => other !== item && other.noteIndex === item.noteIndex);
            if (sharedStep || keyAccidental !== item.note.accidental) {
                const accidental = item.note.accidental === 1 ? "#" : item.note.accidental === -1 ? "b" : "n";
                accidentalItems.push({ y: item.y, text: accidental, staff, x: item.x });
            }
        }
    }

    accidentalItems.sort((a, b) => a.y - b.y || a.x - b.x);
    const occupiedColumns = [];
    for (const item of accidentalItems) {
        let column = 0;
        while (occupiedColumns[column] !== undefined && Math.abs(item.y - occupiedColumns[column]) < 25) {
            column += 1;
        }
        occupiedColumns[column] = item.y;
        addSvgText(Math.min(baseX, item.x) - 29 - column * 23, item.y + 6, item.text, 20, 800);
    }

    for (const item of noteRecords) {
        elements.staff.appendChild(svgElement("ellipse", {
            cx: item.x, cy: item.y, rx: 10, ry: 6, fill: "#111827"
        }));
    }

    for (const staff of baselines) {
        const group = noteRecords.filter((item) => item.staff === staff);
        if (group.length === 0) continue;
        const lowest = group[0];
        const highest = group.at(-1);
        const middleIndex = lowest.geometry.bottomIndex + 4;
        const upward = lowest.noteIndex < middleIndex;
        const stemX = upward ? Math.max(...group.map((item) => item.x)) + 10
            : Math.min(...group.map((item) => item.x)) - 10;
        elements.staff.appendChild(svgElement("line", {
            x1: stemX,
            y1: upward ? lowest.y : highest.y,
            x2: stemX,
            y2: upward ? highest.y - 48 : lowest.y + 48,
            stroke: "#111827", "stroke-width": 2
        }));
    }

    const names = midis.map((pitch) => spelledNoteName(pitch, fifths)).join("  ");
    addSvgText(400, bottom - 12, names, 13, 800);
}

function drawKeySignatureAt(clef, fifths, bottomY) {
    if (fifths === 0) {
        return 135;
    }
    const sharp = fifths > 0;
    const positions = sharp
        ? (clef === "Treble" ? TREBLE_SHARP_POSITIONS : BASS_SHARP_POSITIONS).slice(0, fifths)
        : (clef === "Treble" ? TREBLE_FLAT_POSITIONS : BASS_FLAT_POSITIONS).slice(0, -fifths);
    const geometry = staffGeometry(clef);
    let x = 115;
    positions.forEach(([letter, octave]) => {
        const y = bottomY - (diatonicIndex(letter, octave) - geometry.bottomIndex) * geometry.halfStep;
        addSvgText(x, y + 6, sharp ? "#" : "b", 20, 800);
        x += 22;
    });
    return x + 12;
}

function drawLedgerLinesAt(noteIndex, x, bottomIndex, halfStep, bottomY) {
    const topIndex = bottomIndex + 8;
    if (noteIndex < bottomIndex) {
        for (let lineIndex = bottomIndex - 2; lineIndex >= noteIndex; lineIndex -= 2) {
            const y = bottomY - (lineIndex - bottomIndex) * halfStep;
            elements.staff.appendChild(svgElement("line", {
                x1: x - 18, y1: y, x2: x + 18, y2: y,
                stroke: "#111827", "stroke-width": 2
            }));
        }
    } else if (noteIndex > topIndex) {
        for (let lineIndex = topIndex + 2; lineIndex <= noteIndex; lineIndex += 2) {
            const y = bottomY - (lineIndex - bottomIndex) * halfStep;
            elements.staff.appendChild(svgElement("line", {
                x1: x - 18, y1: y, x2: x + 18, y2: y,
                stroke: "#111827", "stroke-width": 2
            }));
        }
    }
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
    const scroller = elements.keyboardScroller;
    const board = elements.keyboard;
    const col = 46;
    const rowH = 40;
    board.replaceChildren();
    board.classList.add("violin-board");
    board.style.width = `${48 + (VIOLIN_MAX_POSITION + 1) * col}px`;
    board.style.removeProperty("--white-width");
    board.style.removeProperty("--black-width");
    keyElements.clear();
    keyboardMinX = 0;
    const nav = document.getElementById("octaveNav");
    nav.replaceChildren();
    nav.hidden = false;
    nav.setAttribute("aria-label", t("violinNavigation"));
    for (const group of [{ step: 0, label: "0\u20134" }, { step: 5, label: "5\u20138" }, { step: 9, label: "9\u201312" }]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "octave-jump";
        button.dataset.midi = String(group.step);
        button.textContent = group.label;
        button.setAttribute("aria-label", t("violinJump", { position: group.label }));
        button.addEventListener("click", () => { if (!demoRunning) showOctave(group.step); });
        nav.appendChild(button);
    }
    VIOLIN_OPEN_STRINGS.forEach((string, row) => {
        const line = document.createElement("div");
        line.className = "violin-string-line";
        line.style.top = `${8 + rowH * row + 17}px`;
        board.appendChild(line);
        const label = document.createElement("span");
        label.className = "violin-string-label";
        label.style.top = `${8 + rowH * row + 7}px`;
        label.textContent = string.name;
        board.appendChild(label);
        for (let step = 0; step <= VIOLIN_MAX_POSITION; step += 1) {
            const midi = string.midi + step;
            const key = document.createElement("button");
            key.type = "button";
            key.className = `violin-note${step === 0 ? " open-string" : ""}${midi < minMidi || midi > maxMidi ? " out-of-range" : ""}`;
            key.style.left = `${45 + step * col}px`;
            key.style.top = `${8 + rowH * row}px`;
            key.dataset.midi = String(midi);
            key.dataset.string = string.name;
            key.dataset.position = String(step);
            key.setAttribute("aria-label", `${string.name} \u00b7 ${t("violinPosition", { position: step })} \u00b7 ${noteName(midi)}`);
            const pitch = document.createElement("span");
            pitch.className = "violin-pitch";
            pitch.textContent = noteName(midi);
            const number = document.createElement("span");
            number.className = "violin-position-number";
            number.textContent = String(step);
            key.append(pitch, number);
            key.addEventListener("pointerdown", (event) => {
                if (demoRunning) return;
                event.preventDefault();
                key.setPointerCapture(event.pointerId);
                pressKey(midi, event.pointerId);
            });
            key.addEventListener("pointerup", (event) => releasePointer(event.pointerId));
            key.addEventListener("pointercancel", (event) => releasePointer(event.pointerId));
            key.addEventListener("lostpointercapture", (event) => releasePointer(event.pointerId));
            board.appendChild(key);
            if (!keyElements.has(midi) || step < Number(keyElements.get(midi).dataset.position)) {
                keyElements.set(midi, key);
            }
        }
    });
    scroller.onscroll = () => {
        const step = Math.round(scroller.scrollLeft / col);
        const active = step >= 9 ? 9 : step >= 5 ? 5 : 0;
        highlightOctave(active);
    };
    scroller.scrollLeft = 0;
    highlightOctave(0);
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
        const step = midi <= VIOLIN_MAX_POSITION ? midi : (violinPositionForMidi(midi)?.step ?? 0);
        const group = step >= 9 ? 9 : step >= 5 ? 5 : 0;
        elements.keyboardScroller.scrollTo({ left: group * 46, behavior });
        highlightOctave(group);
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
            key.setPointerCapture(event.pointerId);
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
    elements.modeSelect.disabled = !enabled;
    elements.instrumentSelect.disabled = !enabled;
    document.getElementById("demoButton").disabled = !enabled;
}

async function ensureAudio() {
    if (audioContext.state === "suspended") {
        await audioContext.resume();
    }
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
    const canReplay = testActive && testMode === "interval";
    elements.staff.setAttribute("role", canReplay ? "button" : "img");
    elements.staff.setAttribute("tabindex", canReplay ? "0" : "-1");
    elements.staff.setAttribute("aria-label", canReplay ? t("replayInterval") : "Music staff");
    elements.staff.style.cursor = canReplay ? "pointer" : "";
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
    const serial = questionSerial;
    const target = currentMidi;
    const reference = currentReferenceMidi;
    if (testMode !== "interval" || reference === null) {
        playTone(target);
        return;
    }
    await ensureAudio();
    if (serial !== questionSerial || !testActive || target !== currentMidi) return;
    player.cancelQueue(audioContext);
    const start = audioContext.currentTime + 0.05;
    player.queueWaveTable(audioContext, audioContext.destination, selectedPreset(),
        start, reference, 0.6, 0.75);
    player.queueWaveTable(audioContext, audioContext.destination, selectedPreset(),
        start + 0.8, target, 0.9, 0.75);
}

async function playTone(midi) {
    if (!ready) {
        return;
    }

    await ensureAudio();
    player.cancelQueue(audioContext);

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

function updatePlayButton() {
    elements.playButton.textContent = t(testActive ? "stop" : "play");
    elements.playButton.classList.toggle("danger", testActive);
    elements.playButton.classList.toggle("primary", !testActive);
}

function newQuestion() {
    if (!ready) {
        return;
    }
    releaseAllKeys();
    window.clearTimeout(freeDisplayTimeout);
    resetKeyboardColors();

    testActive = true;
    answered = false;
    questionSerial += 1;
    updatePlayButton();
    if (testMode === "interval") {
        currentReferenceMidi = Math.floor(Math.random() * (maxMidi - minMidi + 1)) + minMidi;
        const targets = [];
        for (let pitch = minMidi; pitch <= maxMidi; pitch += 1) {
            if (pitch !== currentReferenceMidi && Math.abs(pitch - currentReferenceMidi) <= 12) {
                targets.push(pitch);
            }
        }
        currentMidi = targets[Math.floor(Math.random() * targets.length)];
        setStatus("listenInterval", { note: spelledNoteName(currentReferenceMidi, KEY_FIFTHS[keyName]) });
        setAnswer("chooseInterval");
        markReferenceKey();
        jumpToReferenceOctave();
    } else {
        currentReferenceMidi = null;
        currentMidi = Math.floor(Math.random() * (maxMidi - minMidi + 1)) + minMidi;
        setStatus("listen");
        setAnswer("choose");
    }
    drawQuestionStaff();
    updateStaffReplayAccess();
    playQuestion();
}

function stopTest() {
    if (!ready) {
        return;
    }

    player.cancelQueue(audioContext);
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
    setAnswer("free");
}

function freePlay(midi, pointerId) {
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
    answered = true;
    questionSerial += 1;
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
        playQuestion();
    } else {
        setStatus(correctAnswer ? "correct" : "wrong", { note: targetName });
        setAnswer("raw", { text: formatAnswerText() });
        drawStaff(currentMidi);
        playTone(currentMidi);
    }
}

function pressKey(midi, pointerId) {
    if (!ready) {
        return;
    }

    if (testActive && currentMidi !== null && !answered) {
        if (testMode === "interval" && midi === currentReferenceMidi) {
            // A marked reference key is a replay control, not a valid answer.
            playTone(currentReferenceMidi);
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

    if (elements.instrumentSelect.value === "violin" &&
        (startMidi < VIOLIN_MIN_MIDI || endMidi > VIOLIN_MAX_MIDI)) {
        setStatus("violinRangeError");
        return;
    }
    if (startMidi > endMidi) {
        setStatus("invalidRange");
        return;
    }
    if (elements.modeSelect.value === "interval" && startMidi === endMidi) {
        setStatus("intervalRangeError");
        return;
    }

    player.cancelQueue(audioContext);
    instrumentMode = elements.instrumentSelect.value;
    document.getElementById("helpText").textContent = t("hint");
    minMidi = startMidi;
    maxMidi = endMidi;
    keyName = elements.keySelect.value;
    clefMode = elements.clefSelect.value;
    testMode = elements.modeSelect.value;

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
    setAnswer("free");
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
    elements.modeSelect.value = "single";
    elements.instrumentSelect.value = "violin";
}

function initializeAudio() {
    setStatus("loadingViolin");
    setControlsEnabled(false);
    if (player === null) {
        setStatus("audioError");
        return;
    }
    loadViolinPreset().then(() => {
        ready = true;
        setControlsEnabled(true);
        setStatus("ready");
        setAnswer("free");
        document.getElementById("demoButton").disabled = false;
    }).catch(() => {
        setStatus("audioError");
    });
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js");
    }
}

const unlessDemo = (callback) => (event) => {
    if (!demoRunning) callback(event);
};

elements.applyButton.addEventListener("click", unlessDemo(applySettings));
elements.playButton.addEventListener("click", unlessDemo(() => {
    if (testActive) stopTest();
    else newQuestion();
}));
elements.nextButton.addEventListener("click", unlessDemo(newQuestion));
elements.staff.addEventListener("click", unlessDemo(() => {
    if (testActive && testMode === "interval") playQuestion();
}));
elements.staff.addEventListener("keydown", unlessDemo((event) => {
    if (testActive && testMode === "interval" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        playQuestion();
    }
}));
document.getElementById("languageSelect").addEventListener("change", unlessDemo((event) => setLanguage(event.target.value)));
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        releaseAllKeys();
        if (demoRunning) {
            cancelDemo();
        }
    }
});
window.addEventListener("blur", releaseAllKeys);

populateSelectors();
setLanguage(resolveInitialLanguage());
drawKeyboard();
drawStaff();
window.addEventListener("resize", () => {
    if (demoRunning) return;
    const previousOffset = elements.keyboardScroller.scrollLeft;
    if (instrumentMode === "violin") {
        releaseAllKeys();
        drawKeyboard();
        elements.keyboardScroller.scrollLeft = previousOffset;
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
    if (player) player.cancelQueue(audioContext);
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
    player.cancelQueue(audioContext);
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
                    audioContext, audioContext.destination, selectedPreset(),
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
        applied: { minMidi, maxMidi, keyName, clefMode, testMode, instrumentMode },
        form: {
            startNote: elements.startNote.value,
            endNote: elements.endNote.value,
            keySelect: elements.keySelect.value,
            clefSelect: elements.clefSelect.value,
            modeSelect: elements.modeSelect.value,
            instrumentSelect: elements.instrumentSelect.value
        },
        state: { testActive, answered, currentMidi, currentReferenceMidi },
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
    elements.instrumentSelect.value = applied.instrumentMode;
    applySettings();

    elements.startNote.value = form.startNote;
    elements.endNote.value = form.endNote;
    elements.keySelect.value = form.keySelect;
    elements.clefSelect.value = form.clefSelect;
    elements.modeSelect.value = form.modeSelect;
    elements.instrumentSelect.value = form.instrumentSelect;
    testActive = state.testActive;
    answered = state.answered;
    currentMidi = state.currentMidi;
    currentReferenceMidi = state.currentReferenceMidi;
    questionSerial += 1;
    updatePlayButton();
    updateStaffReplayAccess();

    resetKeyboardColors();
    snapshot.keyClasses.forEach(({ midi, state: classNames }) => {
        const key = keyElements.get(midi);
        if (key) classNames.forEach((name) => markPitch(midi, name));
    });
    if (testActive && currentMidi !== null && answered) {
        drawAnsweredStaff();
    } else {
        drawQuestionStaff();
    }
    setStatus(snapshot.status.key, snapshot.status.args);
    setAnswer(snapshot.answer.key, snapshot.answer.args);
    elements.keyboardScroller.scrollTo({ left: snapshot.keyboardScrollLeft, behavior: "instant" });
    window.scrollTo({ top: snapshot.pageScrollY, behavior: "instant" });
}

async function runDemo() {
    if (!ready || demoRunning) return;
    const snapshot = captureDemoSnapshot();
    demoRunning = true;
    demoCancelled = false;
    document.querySelector(".app-shell").classList.add("demo-running");
    setDemoControlsLocked(true);

    try {
        await ensureAudio();
        if (demoCancelled) return;
        player.cancelQueue(audioContext);
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
        player.cancelQueue(audioContext);
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
