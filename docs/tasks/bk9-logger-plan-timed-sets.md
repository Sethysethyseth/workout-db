# TASK BK9: the workout logger shows a block's plan - targets, caps, rest, timed sets

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
When a lifter starts a day from a block (BK7/BK8), the logger must show what
the plan asks for - mid-set, on a phone, at arm's length - and must be able
to log a timed set (5 x 45 sec, 30 sec/side). Design of record:
`docs/specs/blocks-v2.md` sections 7.3-7.4 and 10. Needs BK7 (LANDED: a
block session's `SessionExercise.plan` snapshot `{ v, effort, effortCap,
restSec, sets: [{ reps, repsMax, durationSec, weight, rpe, rir }] }`,
`GET /sessions/:id` -> `blockContext` with `useRIR` / `useRPE`, and set
create/update accepting `durationSec`) and BK4 (primitives, `rxFormat.js`).

`client/src/pages/SessionDetailPage.jsx` is the largest file in the app.
Scope discipline is the whole game here: sessions WITHOUT a `plan` /
`blockContext` must behave byte-for-byte as today. Known traps (HANDOFF
archive, E/F-wave gotchas): the F-wave made effort MANDATORY on logged sets;
`rir = 0` is a real value, not blank (blank-vs-truthiness); prop-ABSENCE
seams (a new prop that is absent on old paths must not change them).

FILES TO TOUCH:
- `client/src/pages/SessionDetailPage.jsx`
- `client/src/components/blocks/log/*`       (NEW - small components for the
                                              plan line, the per-set target
                                              hint, the timed input)
- `client/src/styles/blocks/bk-log.css`      (NEW)
- `client/src/api/sessionApi.js`             (ONLY if the set payload is
                                              whitelisted there and needs
                                              `durationSec`)
Do NOT modify anything outside these files.

CHANGE - for session exercises that carry a `plan` (block sessions):

1. **Effort seeding.** Where the logger seeds RIR/RPE from
   `session.workoutTemplate` (~2295-2304), block sessions seed from
   `session.blockContext` with the SAME resolution rules (RIR wins when both;
   an effort currency already on the session's sets outranks it). Template
   and quick-log sessions are untouched.
2. **Header context:** an eyebrow above the session title,
   `<BLOCK NAME> · W<n> · <DAY NAME>` (+ the week label when present).
3. **Plan line** under each planned exercise's name: `ExerciseRx` from the
   plan (sets, reps / `8-10` / time, load, `RPE ≤ 7` or `RIR ≥ 2` for caps,
   `Rest 2:00`), and the exercise notes (setup, lead side...) visible
   without a tap - they are the coach's instructions for this set.
4. **Per-set targets:** each set row's empty inputs show the planned value
   of the matching plan set (by order) as the placeholder (reps or `8-10`,
   load). A one-tap "as planned" control per set fills reps (or seconds)
   and load from the plan into that row and saves it through the normal
   path. It NEVER fills effort - effort is what the lifter felt, and the
   F-wave requirement stays the lifter's to meet.
5. **Caps:** with `effortCap`, a logged RPE above the cap (or RIR below it)
   is marked in the warn tone with a short label ("over cap"); nothing is
   blocked.
6. **Timed sets:** when the plan set has `durationSec`, the row logs
   SECONDS instead of reps (a seconds field; `mm:ss` typed input is
   accepted and converted), saved as `durationSec` with reps null;
   "+ Add set" on a timed exercise adds a timed row. A logged timed set
   counts as logged for Finish and for the effort requirement exactly like
   a reps set.
7. **Rest:** the planned rest shows on the exercise (`Rest 2:00`). No timer
   is added in this unit.
8. Non-block sessions: no visual or behavioral change. Tokens only; 44px
   targets.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` reports no raw colors in the diff.
- `npx eslint src/pages/SessionDetailPage.jsx src/components/blocks/log`
  from `client/` reports 0 errors (or no NEW errors versus `HEAD` - paste
  both counts if the file already has some).
- Every new branch in `SessionDetailPage.jsx` is guarded by the presence of
  `plan` / `blockContext` / `durationSec`; DELIVERY.md lists each hunk with
  its guard.
- The seconds parser is a pure exported helper; a `node --input-type=module`
  snippet in DELIVERY.md prints (verbatim output): `"45"` -> 45, `"1:30"` ->
  90, `"0:45"` -> 45, `"5:00"` -> 300, `""` -> null, `"abc"` -> null,
  `"-5"` -> null.
- `rg -n "rir \?\?|rir \|\||!rir|rir ===" src/components/blocks/log src/pages/SessionDetailPage.jsx`
  output is pasted with a one-line note per NEW hit confirming `0` is
  treated as a value.
- DELIVERY.md walks items 1-8 and lists the reviewer's LIVE check: start a
  block day with a timed exercise and a capped exercise; log one set "as
  planned", one timed set, one over-cap RPE; Finish; reopen - values
  intact.

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
