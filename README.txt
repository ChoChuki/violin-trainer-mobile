Violin Ear Trainer v2.2.4 — added Absolute Pitch assessment mode

Based on the complete preceding v18.3 / v2.2.3 source archive, with no refactoring.
The Mode selector now offers a third, strictly optional Absolute pitch mode alongside
unchanged Single note and Two notes. Default Mode remains Single note.

Absolute pitch mode:
- 12 or 20 questions per round; 5s default limit, optional 2s or untimed.
- Only one isolated note is sounded per question; no reference/replay/correct-note audio.
- A minimum 24-semitone From/To span is required. Consecutive targets differ by
  >12 semitones AND by pitch class; target generation uses finite eligible pools.
- Answer via one of 12 note-name buttons, ignoring octave to test pitch chroma.
- Suppress correctness, pitch-name and staff feedback until the full round ends.
  Do not play instrument keys in this mode, since that would give a reference pitch.
- Next remains a manual action after an answer or timeout. On finishing, show
  per-question answers and total score; Stop Test cancels the round.
- Demo starts/restores the previous mode, settings, and current test state.
- All six interface languages and independent Service Worker cache versions are updated.

Original Single note, Two notes, unrestricted free playing, demo-score.js events,
0.7s ordinary single-note audio, interval 0.6s/0.9s audio and held-key timing
are preserved. This mode reduces reliance on relative-pitch strategies but cannot
prove that all relative-pitch strategies have been eliminated.

To deploy, extract this version's _site.zip and upload its NINE site files to the
EXISTING appropriate Cloudflare Worker, with index.html at the root.
Never upload the piano ZIP to the violin Worker, or vice versa.

Evidence: Wong et al. (2025), Psychonomic Bulletin & Review,
DOI: 10.3758/s13423-024-02620-2. The paper includes restricted-feedback
assessment, octave-spanning adjacent test tones, chroma generalization and
response time windows. Our implementation is not a reproduction of their full
8-week training curriculum.

--- Previous release notes ---

Violin Ear Trainer v2.2.3 — Two notes: minimum/maximum interval and target direction

New in this release:
- Min interval: 1–24 semitones (default 1); Max interval unchanged: 1–24 or Unlimited (default Unlimited).
- Target direction: Higher, Lower, or Both (random; default Both).
- Both reference and target remain inside From/To and respect the chosen interval limits.
- Reject impossible combinations and settings that yield only one target pitch (non-repeat rule).
- Two-note settings are isolated from Single note and restored after Demo, including pending form edits.
- No changes to either music Demo, 0.7s listening tone, or free-play timing.

New release: violin-v2.2.2 — non-repeating targets and user-selectable maximum two-note interval

Based on the user-provided violin-v2.2.1 source package. All original demo-score.js events and demo audio
scheduling remain unchanged. The ordinary 0.7-second single-note audition remains unchanged.

- Single note: each new quiz target excludes the previous real quiz target (exact MIDI pitch).
- Two notes: the target likewise never equals the previous real quiz target. The two pitches
  must be different and must both lie inside the original From/To range.
- Two notes: Max interval select offers Unlimited (default) or any 1–24 semitones.
  A numeric limit applies to the absolute semitone distance, up or down.
- At least two pitches in From/To are required for any quiz, otherwise a translated error
  appears at Apply. This avoids impossible no-repeat single-pitch quiz ranges.
- Next, not a timer, advances to the next question. The previous real target remains
  remembered over Stop/Apply; the prerecorded scripted Demo does not alter it.
- The new setting is applied by pressing Apply; its selector is visible only when the
  form's Mode is Two notes. The Demo snapshot restores both applied and un-applied settings.
- Piano and Violin are separate PWAs, with separate caches and upload destinations.

Cloudflare Worker static assets: use the _site.zip, extract its nine website files
into the EXISTING respective Worker and Deploy. Do not overwrite the other app.

Violin Ear Trainer v2.2.1 — standalone PWA (NOT a Piano/Violin toggle)

Contents: full parity with Pitch Trainer Mobile v18: language selection (six locales),
From/To, Key, Clef, Single note / Two notes, Apply, Play / Stop Test, Next,
free play, music staff, note/solfege feedback, repeat by tapping the staff,
reference pitch highlight, demo rehearsal, and restored settings after Demo.

Only the playing surface and sound differ: 4 violin strings (G3 D4 A4 E5),
positions 0-12 semitones from open string, WebAudioFont violin #0400.
Positions are SEMITONE OFFSETS, not finger numbers or physically proportional spacing.
Playable range G3-E6; use Treble clef as normal violin default.

Demo: same single-note and two-note practice tour, then Beethoven's
Violin Concerto in D major, Op.61, III (Rondo), first 8 bars plus one-eighth pickup, ending on D4; removes the following A–E–F#–G–E tail.
Solo violin part only (no fabricated orchestration), 132 quarter-note BPM.
Source: https://github.com/MutopiaProject/MutopiaProject/blob/master/ftp/BeethovenLv/O61/violin_concerto_3/violin_concerto_3-lys/violinoprincipale.ly
Mutopia #1165, original published score, public-domain edition.

Deployment: Create a NEW Cloudflare Worker static-assets site; do not upload
this into the existing Pitch Trainer Worker. Keep index.html at upload root.
First start requires internet for WebAudioFont and violin soundfont.
Cache name violin-ear-trainer-v2.2.1, separate from piano PWA.

Training surface: each fingerboard touch target is intentionally unlabelled (neutral dot), with no pitch names or numeric offsets. The four open strings remain identified; target pitch is revealed in feedback after answering. Accessible touch target labels say string and position, not the answer pitch.


v2.2.1 patch (based on v2.2, NOT v2.3):
- Reduced single-note tap/replay duration from 1.4 s to 0.7 s.
- Preserved fingerboard, existing 0-4 / 5-8 / 9-12 navigation, and all quiz logic.
- Preserved two-note quiz sequence (reference 0.6 s, target 0.9 s), free-play hold/release, and complete Beethoven Op.61 Demo timing and events.
- Rotated service-worker cache key so the deployed PWA can pick up the new JavaScript.

To update an existing deployed Violin Worker, upload all nine web assets in the site ZIP to the SAME Worker (not the Piano Worker). Reload the installed app after deployment.

Absolute-pitch assessment mode: 12/20-trial batches; feedback only after the round;
>12 semitone adjacent jumps; 12 chroma answers across octaves; optional 5s/2s/untimed.
Existing Single / Two notes / Demo are unchanged except for mode integration.
