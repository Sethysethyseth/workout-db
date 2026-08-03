# TASK F3: live session - either-or signal, lock after first value, block completion

STATUS: QUEUED
MODEL: auto     <!-- was opus; named rung unavailable on this plan (refused
                     August 2 on F1). Auto is the only rung. -->
MODE: 1-relay

CONTEXT:
F-wave unit 4 of 4, and the one that makes the mandate real. F0 made a
template's stored signal reach the live session; F1 made the signal either-or
and remembered; F2 resolved legacy templates. This unit brings the LIVE SESSION
in line and enforces the mandate at completion.

Three things are wrong today, all verified August 2:
- Template-driven sessions render a two-checkbox grid
  (`SessionDetailPage.jsx:2755-2807`) that can still reach both-off, while every
  other surface is now either-or.
- The signal can be flipped at any point in a session, so one workout can end up
  with some sets in RIR and some in RPE - a mixed-currency session that the
  matched-effort analytics cannot read cleanly.
- Nothing stops a user finishing a workout with the effort field blank on every
  set. `completeSession` (`server/src/controllers/sessionController.js:1280+`)
  checks auth, session existence and already-completed; it never looks at
  `rir`/`rpe`. The client's only gate is `canFinishWorkout = totalSetsLogged >= 1`
  (`:2650-2651`).

LINE NUMBERS ARE APPROXIMATE. Every `:NNNN` reference below was captured against
the pre-F0 tree; F0, F1 and F2 have since edited `SessionDetailPage.jsx` and
shifted them (the F1 call site cited as `:2810` now sits at `:2817`). Locate
every anchor by SYMBOL - `canFinishWorkout`, `sessionSetHasCoreLogged`,
`sessionNoteTogglesInitRef`, `session-set-field--needs-value` - and treat the
numbers as a hint about where to start reading, never as the target.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx
- client/src/index.css                    (ONLY if unavoidable; tokens, no hex)
Do NOT modify anything outside these files. This unit is CLIENT-ONLY - see the
ENFORCEMENT BOUNDARY section, which explains why, and treat that as settled.

CHANGE:

**1. Either-or control in the live session.** Replace the two RIR/RPE checkboxes
in the template-session options grid (`:2755-2807`) with the same
`RirRpeToggleRow` either-or control F1 established, so template sessions and
quick logs present one model. Leave the OTHER checkboxes in that grid (notes
toggles, duration, etc.) exactly as they are. The quick-log branch already
renders this control after F1 - do not restructure it.

Seeding stays F0's: the template's stored signal, resolved once per session id
via the existing `sessionNoteTogglesInitRef` guard. Do not convert that one-time
seed into a continuous sync.

**The nudge prop - read this before you render the control (added August 3,
after F2).** `RirRpeToggleRow` renders its OWN copy block when `value === null`
(the "Effort logging off ... two sets of 10" nudge). F2 shipped a screen where
that nudge and the page's own null-state copy stacked back to back saying nearly
the same thing twice; the fix was a `showNudge` prop, default TRUE. For THIS
unit the default is correct and you should NOT pass `showNudge`: a live session
with a `null` signal is exactly the legacy case that is not enforced, and
"volume still tracks, but effort-based analytics stay locked" is a true and
useful thing to say there. The point of naming it here is that it is now a
DECISION, not an accident - if you add any null-state copy of your own to the
live session, pass `showNudge={false}` so the sentence does not ship twice.

Also note the LOCK line (change 2) is separate copy on a NON-null signal, so it
cannot collide with the nudge; the two are mutually exclusive by construction.

**2. Lock the signal after the first effort value.** Seth's August 2 ruling:
the signal is switchable until the session's first effort value is logged, then
locked for the rest of that session. This is what keeps one session's data in a
single currency.

- Lock condition: ANY set in the current session has a non-null, non-blank
  `rir` OR `rpe`.
- When locked, the control is visibly disabled and a short line says why -
  something to the effect that the signal is fixed once effort has been logged.
  Do not hide the control; a user must still be able to SEE which signal is
  active.
- Unlocking is not a feature. There is no override affordance in this unit.
- A session whose signal is `null` (legacy, nothing chosen) does not lock and
  does not enforce - see 3.

**3. Block completion when effort is missing.** Extend the existing finish-dock
gate rather than inventing a new mechanism: `canFinishWorkout` at `:2650-2651`,
the hint at `:3067-3070`, the `disabled` on the Finish button at `:3076`. This
idiom is already the page's blocking pattern - follow it BY NAME.

Which sets count: use the existing helper `sessionSetHasCoreLogged`
(`:321-326`) to decide whether a set is really logged. A set that is not
core-logged is a scaffold row and is NOT subject to the mandate.

The rule, exactly:
- Active signal `"rir"` -> every core-logged set in the session must have a
  non-null `rir`.
- Active signal `"rpe"` -> every core-logged set must have a non-null `rpe`.
- Active signal `null` -> NO enforcement. Legacy sessions where nothing was ever
  chosen must stay finishable; this unit must not strand a user mid-workout in a
  session they cannot complete.

When blocked, the hint must say how many sets still need a value - a bare
disabled button with no count is the failure mode this criterion exists to
prevent. Reuse the soft per-field cue the page already has for missing
weight/reps (`session-set-field--needs-value` + `aria-invalid`, `:1075-1078`,
`:1179-1225`) to point at the offending fields if it is straightforward; if it
is not, say so in DELIVERY.md rather than forcing it.

**4. Already-completed sessions are untouched.** Enforcement applies only while
`completedAt` is null. Reopening or viewing historical sessions must not
retroactively demand effort values, and must not block anything.

ENFORCEMENT BOUNDARY (settled - do not "improve" this):
Enforcement is CLIENT-SIDE in this unit, deliberately. The live signal is
session-local state: it is not persisted on `WorkoutSession` (no `useRIR`/
`useRPE` column exists there), so the server cannot know which signal a session
was actually capturing. A server-side check would therefore either trust a
client-supplied flag or read the template and contradict the user's in-session
override. Doing it properly needs a session-level column, which is a schema
change - a migration, Seth's manual track, and explicitly out of scope for this
wave. Do NOT add a column, do NOT add a migration, and do NOT touch any file
under `server/`. State this limitation plainly in DELIVERY.md.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` is green (expected 204 tests / 15 suites).
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` exits 0.
- No file under `server/` appears in the diff, and `server/prisma/schema.prisma`
  is absent from it.
- The two RIR/RPE checkboxes are gone from the template options grid, replaced
  by the either-or control. Quote the before/after JSX.
- Lock: quote the lock condition and show that it is driven by logged set
  values, not by a timer or a manual flag.
- Enforcement truth table - walk ALL of these in DELIVERY.md against the code:
  - signal `"rir"`, 3 core-logged sets, all with rir -> Finish ENABLED
  - signal `"rir"`, 3 core-logged sets, one missing rir -> Finish DISABLED,
    hint names the count 1
  - signal `"rpe"`, sets have rir but no rpe -> Finish DISABLED
  - signal `null`, sets have no effort at all -> Finish ENABLED (no enforcement)
  - zero core-logged sets -> Finish DISABLED by the PRE-EXISTING
    `totalSetsLogged >= 1` rule, unchanged by this unit
- A completed session (`completedAt` non-null) renders with no enforcement and
  no lock messaging. Quote the guard.

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
