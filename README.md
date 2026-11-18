# Violin_Ear_Trainer v2.5.0

[Open focused AP practice](https://chochuki.github.io/violin-trainer-mobile/#ap)

The focused course is integrated into the existing trainer. Open **Focused AP practice** on the home screen. On the first day you can listen to labelled examples and start active learning. On subsequent days the independent check has 12 single-listen questions before practice. Active learning gives immediate feedback. Consolidation gives feedback at the end of each block. Set the note names yourself, or accept the suggested next name when the practice evidence supports it.

Both instruments use individually recorded C4–B6 notes. Each instrument and pitch has one recording. See [audio credits and quality limits](ap-audio/README.md). Active learning and consolidation default to 24 questions. In a partial learning set, about a quarter of each block comes from outside the set. “Other” means outside the set. “Not sure” records uncertainty. The second instrument can be mixed at 20% or 50% after hearing its examples. Independent checks use this site's primary instrument.

The original interference setting also controls 250 ms of unpitched noise between focused questions. The first note of a block, examples and replays play directly. Response time starts at the estimated audible onset of the recorded note.

A new-note suggestion uses up to six completed focused practice blocks with the same learning set from the last fourteen days. The primary instrument needs two blocks, at least five first responses to each target and ten first responses outside the set. Default thresholds are a 75% equal-weight target hit rate and at most 25% false alarms. Replays and interrupted audio are identified separately. Thresholds and the learning set are editable. Each block and each trial retain the primary site, sound source and actual instrument.

Answers use the original site's device-local AP database. The first visit picks up an existing course level or previous course evidence when available. Earlier course versions and scores remain available in the original AP history. Each site's focused records can be exported and restored under **Practice records**. The existing tracker continues to count training time. On a shared origin the two trainers can observe a previous local audio exposure; other devices or origins have separate histories.

## Previous release notes

Independent PWA deployment. All files in this directory belong in the site's Cloudflare deployment root.
No build step: upload the directory as it is. HTTPS is required for offline use and for the optional microphone check.

Round 3 (Claude) changes from 2.3.1, in short:

- AP rounds show their prompt, right/wrong and the note name beside the answers (in 2.3.1 the violin site hid them).
- The cold check uses the selected range and no longer rewrites From/To.
- Optional interference burst before each AP question; "Other" notes lean towards neighbours of the learned names.
- Day-scale review intervals need a recall made after a break; recent errors and confusions drive review weights.
- "Weak intervals" is a real error-driven review; references cover the whole register in each direction.
- New activity "Sing / play first" (self-check, optional experimental microphone check).
- One tap per question (automatic continue after a hit; a miss waits for Next); no scrolling during a round on 320–430 px screens.
- A waiting new version is offered through an "Update" button, never applied during a round.

Unchanged: Demo score and tempo, Cloudflare training-time protocol (training-tracker.js is byte-identical),
RP level structure, six languages, stored history formats (new fields are additive; new rows carry protocol 6).

Updating an installed PWA: open it online once; when "Update to the new version" appears in the header, tap it
outside a round (or close every window of the app and reopen it).

See the full source package: README_START_HERE.md and docs/CLAUDE_ROUND3_REPORT_zh.md.


## Minor update: AP consecutive-note rule
This release excludes the exact MIDI pitch used in the previous AP question,
including across AP rounds/reloads on the same site. All other settings and
methods follow Claude's prior release. On a one-octave, low-level AP lesson,
excluding repeats necessarily changes the conditional distribution of labels;
this is a learner-requested constraint, not a guarantee against inference.
