# Violin_Ear_Trainer v2.4.1

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
