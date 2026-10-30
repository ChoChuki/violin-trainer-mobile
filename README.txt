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
