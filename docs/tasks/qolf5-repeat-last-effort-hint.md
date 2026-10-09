# TASK qolf5: Repeat last time shows last time's RPE / RIR as a grey hint - visible until you enter today's, never filled in

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's smoke finding, Oct 9: "the rpe is important for the user to see".
qol7's Repeat last time ghosts last session's weight and reps into empty
sets, but effort shows "—": the server never sends it
(`buildLastPerformance` in `server/src/analytics/lastPerformance.js` maps
only side / weight / reps / durationSec). If he did 3x10 at RPE 7 last week,
the RPE box should show a grey "7".

The rule that does NOT change: effort is never filled in or logged for the
user. "Log set N as last time" (`applyLastTime` ->
`fillDraftFromPlanExceptEffort`) still leaves effort empty, and an empty
effort still counts as missing for the qol4 finish warning and the qolf3
Add RIR highlight. The hint is a placeholder only.

Design rules: `docs/specs/quality-of-life-wave.md` section 2.

FILES TO TOUCH:
- server/src/controllers/sessionController.js   (ONLY the last-performance query's set `select`: add `rir`, `rpe`)
- server/src/analytics/lastPerformance.js
- server/test/analytics/lastPerformance.test.js
- client/src/pages/SessionDetailPage.jsx
- client/src/components/blocks/log/ghostPlaceholders.js
- client/src/components/blocks/log/BlockSetRow.jsx   (only if the block-day hint needs it)
- server/data/app-guide.md   (the Repeat last time paragraph only)
Do NOT modify anything outside these files.

CHANGE:

1. **Server: send last time's effort.** The last-performance route's set
   select adds `rir` and `rpe`. `coreLoggedSets` returns `rir` and `rpe` per
   set via `asNumber` (null when absent). Nothing else about the response
   shape changes. The query stays owner-scoped exactly as today.
2. **Quick and template workouts: the hint in empty effort fields.** On a row
   that maps to last time's set N (`lastTimeFieldsForRow` /
   `ghostPlanFromLastSet`), the effort field's placeholder shows last time's
   set N value in the field's own scale:
   - RIR field: last time's `rir`
   - RPE field: last time's `rpe`
   - If last time logged the other scale (or nothing), the placeholder
     stays "—". No conversion between RIR and RPE.
3. **The hint survives logging the set (the point of the unit).** Today a
   row loses its last-time mapping once it is logged, so the effort hint
   would disappear exactly when the lifter needs it. A LOGGED set k (1-based,
   per side for per-side exercises, the same indexing `lastTimeRowsForSide`
   uses) whose effort is still empty shows last time's set k effort as its
   placeholder. It disappears when the lifter types a value.
   - Weight and reps of a logged row are unchanged: they show what was
     logged.
   - Only the effort placeholder comes from last time.
4. **Effort is still never filled.**
   - `applyLastTime` and `fillDraftFromPlanExceptEffort` keep leaving
     effort empty.
   - A placeholder is not a value. `canFinishWorkout`, the "N sets have no
     RIR" warning, and the `highlightMissingEffort` tint behave exactly as
     today.
5. **Block days: the plan comes first.** `planSetWithLastTimeWeight`
   (ghostPlaceholders.js) merges last time's weight only when the plan left
   it blank. Apply the same rule to effort: when the plan set has an effort
   target, that target is the placeholder, as today. When it has none, last
   time's effort for that set shows, in the block's scale. A last-time hint
   is shown plain, never with the plan's "≤ / ≥" cap glyph.
6. **App guide.** In `server/data/app-guide.md`, the Repeat last time
   paragraph currently says "Effort is never filled in." Make it say that
   last time's RPE or RIR shows in grey as a reminder, but you always enter
   today's yourself. Plain words, and keep the rest of the paragraph.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with new cases in
  `lastPerformance.test.js`:
  - a prior set {weight 100, reps 10, rpe 7} -> returned set includes
    `rpe: 7, rir: null`
  - a prior set {weight 100, reps 10, rir 2} -> `rir: 2, rpe: null`
  - a prior set with neither -> both null
  - existing cases still pass unchanged
- `npm run build` from `client/` compiles clean; `node scripts/check-hex.mjs` clean.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -n "rpe\|rir" server/src/controllers/sessionController.js` shows the
  two new select lines in the last-performance query, and no other change in
  that file.
- DELIVERY.md quotes the code path that keeps the hint on a LOGGED set's
  empty effort field (item 3), and the line that keeps a plan target first
  on block days (item 5).
- Real-app items for the reviewer (390x844, a quick workout, Repeat last on,
  an exercise whose last session logged RPE 7 on every set, RPE scale on):
  - Every ghost row's RPE box shows a grey "7".
  - Tap "Log set 1 as last time": set 1 logs weight and reps, and its RPE
    box is EMPTY with a grey "7" placeholder.
  - Typing 8 replaces the hint, and 8 is saved.
  - Finish with sets that have only the hint -> the "N sets have no RPE"
    warning counts them as missing.
  - Switch the scale to RIR in Training: the RIR boxes show "—" (last time
    was RPE).

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
