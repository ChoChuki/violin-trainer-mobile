Violin Ear Trainer v2 — standalone PWA (NOT a Piano/Violin toggle)

Contents: full parity with Pitch Trainer Mobile v18: language selection (six locales),
From/To, Key, Clef, Single note / Two notes, Apply, Play / Stop Test, Next,
free play, music staff, note/solfege feedback, repeat by tapping the staff,
reference pitch highlight, demo rehearsal, and restored settings after Demo.

Only the playing surface and sound differ: 4 violin strings (G3 D4 A4 E5),
positions 0-12 semitones from open string, WebAudioFont violin #0400.
Positions are SEMITONE OFFSETS, not finger numbers or physically proportional spacing.
Playable range G3-E6; use Treble clef as normal violin default.

Demo: same single-note and two-note practice tour, then Beethoven's
Violin Concerto in D major, Op.61, III (Rondo), first 9 bars plus one-eighth pickup.
Solo violin part only (no fabricated orchestration), 132 quarter-note BPM.
Source: https://github.com/MutopiaProject/MutopiaProject/blob/master/ftp/BeethovenLv/O61/violin_concerto_3/violin_concerto_3-lys/violinoprincipale.ly
Mutopia #1165, original published score, public-domain edition.

Deployment: Create a NEW Cloudflare Worker static-assets site; do not upload
this into the existing Pitch Trainer Worker. Keep index.html at upload root.
First start requires internet for WebAudioFont and violin soundfont.
Cache name violin-ear-trainer-v2, separate from piano PWA.
