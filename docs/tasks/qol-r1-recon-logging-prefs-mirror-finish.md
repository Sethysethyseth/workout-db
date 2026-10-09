# TASK qol-r1: RECON - logging preferences, mirror-last-numbers, finish-without-effort

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the `quality-of-life-updates` wave. Seth's asks: (1) move
the lbs/kg choice and the RIR/RPE/notes capture toggles OUT of the logging
screens into one preferences surface (Profile or a Home section near the log
button); (3) an opt-in setting that pre-fills a lift's weight/reps from the
LAST time it was logged - the way block days already ghost the plan
(`client/src/components/blocks/log/ghostPlaceholders.js`); (4) effort no
longer blocks Finish - warn that some sets have no RIR/RPE, let the user
finish anyway (normal workouts AND block days). The frontier seat writes
contracts FROM this report: it needs what exists TODAY with file:line
evidence and the patterns in use - not proposals.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
REPORT ONLY - no code changes, no git operations. Answer each question with
file:line evidence; say "not found" rather than guess. Quote short code
excerpts where the exact shape matters.

**A. Where the preferences live today (ask 1).**
1. Every place the user can switch lbs/kg (`client/src/lib/weightUnitPref.js`
   and every component that renders a unit toggle or reads the pref) -
   file:line, and what storage backs it (localStorage key, account column?).
2. Every place the user picks RIR vs RPE, turns effort capture on/off, or
   turns notes on/off: quick-log (`quickWorkoutLogPrefs.js`), template
   create/edit, block builder settings (`BlockSettingsSheet.jsx`),
   `effortSignalPref.js`, the live session screen. For each: the component,
   the storage (localStorage key / template column / block column / session
   column), and whether the value is per-device, per-template, per-block or
   per-session.
3. Server side: which of those are columns (Prisma model + field), which
   routes write them, and whether any per-user preference column or
   `/me`-style settings endpoint already exists.
4. Profile page and Home page structure top to bottom on a 390px phone
   (component + CSS file per section), and any existing "settings" or
   "preferences" section, sheet or route.

**B. Mirror last numbers (ask 3).**
1. How a normal (non-block) workout's set rows get their initial weight/reps
   today: blank? copied from the template? from the previous set in the
   same exercise? Any existing "last time" / "previous" display in the
   logger (e.g. a previous column, a hint line, the exercise detail page) -
   file:line.
2. Block days: how `ghostPlaceholders.js` / `planHelpers.js` feed the
   placeholders, whether a ghost is a placeholder (greyed, not saved) or a
   real value, and what a tap/check on a ghosted row writes.
3. Any existing server endpoint or client helper that returns "the last
   completed set(s) for exercise X for this user" (sessions history,
   exercise detail endpoint `n5`, analytics helpers) - route, response
   shape, and how exercises are matched (catalog FK `exerciseId` vs name).
4. Per-side (L/R) and duration-based exercises: how their set rows differ,
   so a prefill contract can cover them.
5. What marks a set as logged/complete (a checkbox? non-empty reps?) - this
   decides whether a pre-filled value could be saved without the user
   doing the set.

**C. Finish without effort (ask 4).**
1. Normal workouts: the exact gate that disables Finish until every
   core-logged set has an effort value (F-wave / effort-mandatory-wave) -
   client file:line and any SERVER-side enforcement on
   `POST /sessions/:id/complete` (validator, error message, tests that
   assert it).
2. Block days: the same for the block logger's finish path.
3. Any copy, nudge or education UI tied to the mandate (lock messages,
   "why" text) and the existing confirm-dialog pattern for leaving/finishing
   (`confirmLeaveLiveSession.js`, WD1's `.session-discard-confirm`) that a
   "some sets have no RIR - finish anyway?" warning could reuse BY NAME.
4. Unit tests under `server/test/analytics/**` or `server/test/lib/**`
   that encode the mandate (would break if it relaxes).

**D. Collision map.** For the three asks, list candidate FILES TO TOUCH
(client + server + tests + CSS) and flag every file that appears under
more than one ask.

Write it all to `DELIVERY.md` with headings A-D and numbered answers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md has sections A-D; every numbered question is answered with at
  least one file:line that exists on this branch, or "not found" plus where
  you looked.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
