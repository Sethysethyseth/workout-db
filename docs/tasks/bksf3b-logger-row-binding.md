# TASK bksf3b: Block logger - a tap never logs the wrong row or drops a typed value; Up next skips the live day

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Critic round 3 (`docs/tasks/bks-critic-round-3-FINDINGS.md`, P1-3 and P2-1).

**P1-3, block-day logger** (`SessionDetailPage.jsx` + `components/blocks/log/`):
- Cable Seated Lateral Raise, nothing logged, tap set number "3" -> row **1**
  gets the check; row 3 keeps its values in full ink, unlogged.
- Pullups: type RPE 7 on row 1 (still a draft), tap "2" -> ~1.5 s later row 1
  is logged with RPE EMPTY (the 7 is gone) and row 2 is left as an ink draft.
  The lost RPE then blocks Finish.
- In-order use works (type RPE on a row, tap that row's number -> logged with
  the RPE) and must keep working.

**Why, and the frontier ruling that bounds the fix.** Block sessions are
POSITIONAL by design: logged `WorkoutSet` rows pair with the plan snapshot by
order (`server/src/analytics/planVsActual.js` header; `docs/specs/blocks-v2.md`
sections 1 and 7.3). `WorkoutSet.blockWorkoutSetId` exists in the schema but
is deliberately unused, and this unit must NOT start using it or change the
schema. So a logged set always occupies the next position; the bug is that the
UI lets a LATER row create it, and row drafts live in per-row component state
(`BlockSetRow` `useState` draft) that gets reassigned when the logged set
takes position 1. The contract is therefore **in-order logging, with drafts
that belong to their planned row**.

**P2-1, Home:** during the live W3 · Upper B, Home reads "Up next after this:
W3 · Upper B" - `UpNextCard.jsx` uses `progress.nextDay`, which is still the
in-progress day (`server/src/blocks/blockRunLogic.js` picks the first day not
"done").

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx (block-day logger paths only)
- client/src/components/blocks/log/* (BlockSetRow, BlockExerciseCard,
  helpers next to them; tests next to them if any exist)
- client/src/components/blocks/run/UpNextCard.jsx,
  client/src/pages/DashboardPage.jsx (P2-1 only)
- client/src/styles/blocks/bk-log.css
Do NOT modify anything outside these files. No server, schema or API change.
NOT the builder, import, Library or the run page.

CHANGE:
1. **Only the next row logs.** Per exercise, the "log as planned" tap on the
   set number is active ONLY on the first unlogged planned row. Later
   unlogged rows still show their number (same column, same width, visibly
   not a button - e.g. muted), and tapping it does not create a set. Keep the
   existing aria-label on the active one ("Log set N as planned"); the
   inactive ones are not buttons for assistive tech either.
2. **Drafts belong to their planned row.** Values typed on any unlogged row
   (reps, load, RPE/RIR, seconds, set note) stay on THAT row until that row
   is logged or the lifter clears them. Logging another row, an autosave,
   removing a row or adding a set never clears, moves or reassigns another
   row's draft. Hold row drafts in state keyed by the planned row's identity
   (exercise + planned index), not by render position.
3. **No set is created from a later row.** The existing auto-promote (a row
   with a dose typed becomes a logged set - `tryPromote` in BlockSetRow) runs
   only on the next unlogged row. A later row with a full dose typed stays a
   draft (its values kept, shown as typed), and is promoted - with exactly
   those values - as soon as it becomes the next row and the lifter taps its
   number or confirms its field as today.
4. **Typed values win when logging.** Logging the next row sends its typed
   draft values over the plan (today's in-order behaviour - keep it), and
   still never invents effort: a planned RPE is never sent unless typed.
5. Per-side (L/R) mode, "+ Add set", remove-with-confirm, hidden planned
   rows (`hiddenPlannedRows.js`) and timed sets keep working under the new
   rule; an added extra set (beyond the plan) logs like any next row.
6. **P2-1:** while a live block session is open, the Home muted line names
   the day AFTER the live one: the first day in block order (rest of the
   current week, then later weeks, using `progress.weeks[].days[]`) that is
   neither done nor the live session's day (`activeSession.blockContext`
   identifies it). If none is left, render nothing (no "Up next" line).

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
  `npm run test:unit` from `server/` green.
- **Hook rule:** no hook after an early return in any component you touch
  (SessionDetailPage has crashed on this before - `924bc66`). State it per
  component in DELIVERY.md.
- Pure helpers for (a) "which planned row is next" and (b) "the day after the
  live day" are exported functions with small tests next to them if the
  client has a test setup; otherwise put input -> output tables for each in
  DELIVERY.md, including:
  - rows [logged, unlogged, unlogged] -> next = index 1
  - rows [unlogged x3] with a typed draft on index 2 -> next = index 0, and
    index 2's draft is unchanged after index 0 logs
  - progress W3 days [done, done, in_progress(live), not_started] -> W3 day 4
  - live day is the last undone day of the block -> null (no line)
- DELIVERY.md traces every code path that can create a set on a block day
  (file:line) and shows each one is gated to the next unlogged row.
- DELIVERY.md walks the two critic repros against the new code and states
  the result of each (row 3 tap does nothing; typed RPE 7 on row 1 survives
  a tap on row 2 and is sent when row 1 logs).

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
