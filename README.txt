Violin Ear Trainer v2.2.6 — Absolute-pitch learning + cold-start checks + optional training-time sync

BASELINE
Violin Ear Trainer v2.2.5 complete source ZIP, NOT reconstructed from chat.
Piano and violin remain two independent static PWAs / Cloudflare Workers projects.
Original Single note, Two notes, free play, six languages, clefs, key signatures,
Demo, touch interactions and 0.7-second single-note timing are retained.

AP SCIENCE / GATE v2 (updated after independent A/B review)
- The two applications remain independent, including their course progress and
  trial records. Historical data and training-time records are NOT cleared.
- Critical security-of-measurement fix: AP learning and AP cold check draw
  each class independently, allow repeated note names, and equalize octaves.
  No forced alternation or search rewarding long adjacent jumps is used.
- AP cold checks: fixed C4-B5, 24 notes in two complete octaves (endpoint
  distance 23 semitones), both instruments. Thirty questions, 5s response.
  Written confirmations cover the other trainer, tuning/playing and known
  pitch music within the prior four hours. These remain SELF-REPORTED.
- To count for promotion: first self-confirmed check of the local Japan day,
  at least four hours after this site's last recorded pitch activity, no
  loss of focus or hidden page, 27/30 or better, and at least 80% accuracy
  separately on trained and Other categories (where present).
- Promotion needs TWO CONSECUTIVE eligible-day passes, and at least ten
  trials for the newest note with >=80% correct, plus four Other trials with
  >=80% correct (within seven days). Evidence requirements are experimental
  product criteria, NOT scientifically validated AP thresholds.
- An interrupted/abandoned qualifying cold check counts as a failed day;
  later retries that day are practice-only. Prior vulnerable gate passes are
  archived as legacyGatePasses and NOT reused for promotion. Unlocked levels
  and older stored results remain available.
- Cold answer lists may optionally be hidden after completion and revealed
  later, allowing back-to-back piano/violin checks without instant labels.
- AP learning keeps 12-question immediate feedback and now plays labelled
  feedback for timeout and the final question too. Optional pitch sweep is
  OFF by default. This is learning, not promotion evidence.
- AP informal assessment 12/20 trials uses independent pitch classes; 36/48
  uses per-name and octave-balanced quotas. No fixed >12-semitone jump is
  promised, because the old optimiser created serious sequence clues.
- Trial CSV includes pointer event timing, output-device self-report,
  latency estimates, hidden counts and the selected distractor option.
  These timestamps are NOT an acoustic-onset measurement for Bluetooth.
- From/To, clefs and other older Single/Two note/free play controls remain
  available. Demo note events and schedules are byte-identical to v18.5 or
  v2.2.5. All six locales include the new AP labels.
- The training-time backend from the previous delivery is unchanged. Cloud
  sync still requires a separately configured Worker; local time survives
  updates. No external tonal samples were added (source licensing and
  timbral verification remain future work).

TRAINING TIME (OPTIONAL)
- Both sites include the same training-tracker.js. It counts only meaningful
  question/answer/free-play actions, pauses after 75 seconds without activity
  and when the tab is hidden or loses focus. Tokyo day boundaries are respected.
- Offline local segments survive refreshes/updates. Cloud sync is NOT automatic:
  a separate shared Cloudflare Worker + D1 must first be deployed, then both
  sites/devices configured with its URL and the same 128-bit pairing code.
- The shared backend, plugin API contract and setup guide are delivered in
  Musik_Training_Sync_Worker_v1.zip. DO NOT deploy backend files as static assets.
- The existing Chrome reminder extension's source was NOT supplied; its old
  reminder logic is not modified here. The plugin developer must switch to the
  shared API and stop independent time-counting to avoid double counting.

FILES MODIFIED OR ADDED
app.js, index.html, i18n.js, styles.css, service-worker.js,
ap-science.js (new), training-tracker.js (new), this README, verification tools.
manifest.webmanifest and both demo-score.js files were not altered.

DEPLOYMENT
Unzip the **site** package. Upload the root-level index.html and assets to the
EXISTING Cloudflare Worker for this exact instrument. Do not create a new piano
or violin Worker, do not mix the packages, and do not add a parent folder.
Cache revision: violin-ear-trainer-v2.2.6.

VERIFICATION
- JavaScript syntax: node --check for all site JS files.
- tools/test_ap_curriculum.py: Playwright simulated 360x667 and 390x844,
  complete 12-question learning, 30-question cold check, 48-note balanced test,
  new intervals, six translations and on-screen bounds.
- tools/test_quiz_rules.py, tools/test_interval_refinement.py: old quiz rules.
- tools/test_training_clock.js: Node simulated idle, Tokyo midnight and reload.
- Demo file byte SHA-256 compared with previous stable complete source.
- For piano tools/test_score.js checks all 59 vocal melody events.
- Legacy absolute-pitch test is preserved as *legacy* but its prior 13-semitone
  hard constraint and 12-button assertion no longer describe the new design.

LIMITATIONS
Simulated audio calls do not establish real phone touch/audio latency or sound.
Cloudflare live Worker+D1 sync, cloud interruptions, external Bluetooth output,
true cross-day learning outcomes, multiple timbres and actual Chrome extension
integration have NOT been verified. Test these before treating the progress as a
rigorous measure of absolute-pitch learning.
