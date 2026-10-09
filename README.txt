Violin Ear Trainer v1 — INDEPENDENT violin-only PWA
====================================================

This is a NEW, SEPARATE application. It is not an update to Pitch Trainer Mobile.
Do not upload it over the existing Piano Pitch Trainer Worker!

DEPLOY TO CLOUDFLARE
1. In Cloudflare Workers & Pages, create a NEW static-assets Worker/application.
2. Extract Violin_Ear_Trainer_v1_site.zip.
3. Upload all 8 files to the root of the NEW Worker (index.html at root).
4. Deploy. Share this NEW URL, not the piano app's URL.

WHAT IT DOES
- Four genuine violin strings G3, D4, A4, E5; each displays 0–12 semitone positions.
- Uses WebAudioFont sampled Violin 0400_JCLive_sf2_file.js (not piano sound).
- Single-note and reference+target two-note listening quizzes.
- Fingering positions with matching pitch on different strings count equally.
- Reference locations marked blue; correct target green; incorrect answer red.
- A short demonstration of four open strings and one two-note example.
- Treble staff. Six interface languages; standalone PWA and separate cache.

IMPORTANT
- This is a SCHEMATIC FINGERBOARD, not physical measured finger-placement guidance.
  The numbers 0–12 count semitones above the open string, NOT finger numbers.
- Violin has no frets; actual fingertip spacing is not uniform.
- The violin sample comes from a third-party HTTPS source (Surikov WebAudioFont).
  First use requires network access; that script may cache for later use.
- Browser audio needs a user gesture; click Play/tap a position to hear sound.
- The original piano project and its Die Forelle demo are unchanged.
