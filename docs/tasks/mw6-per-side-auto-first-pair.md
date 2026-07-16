# TASK MW6: per-side detection fix + auto-create the first L/R pair

STATUS: QUEUED
MODEL: opus
MODE: 1-relay

CONTEXT:
Seth's ask #15 (July 16), finalized against the MW4 audit
(`mw4-per-side-analytics-audit-FINDINGS.md`) and Seth's rulings
(`mw6-seth-rulings.md`, interpreted by Fable July 16). Per-side MODE
detection exists (`derivePerSideMode` / `exerciseNameImpliesPerSide`,
`client/src/pages/SessionDetailPage.jsx` ~:203-217) and pair creation
exists (`createSetPairForExercise` ~:277-289). MW4 found the detector is
exactly `/\bsingle\b/i` - it misses all ~50 One-Arm/One Arm catalog names
and false-positives on "(single response)" - and found one display
inconsistency (Sets stepper counts pairs while the heading counts rows).

RULINGS BAKED IN - do not re-litigate:
- A pair = 2 sets on every COUNTING surface (analytics untouched by this
  block; the heading's raw row count "2 sets" is CORRECT and stays).
- The stepper is the one control that operates in pairs, so it alone
  speaks "Pairs" in per-side mode. Everything that COUNTS says sets.
- Decimal RIR stays rejected server-side (schema untouched); the client
  gains an input gate so a user typing 1.5 is stopped or informed inline,
  never flashed a server error + reload.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (detector, auto-pair trigger,
                                            stepper label wiring, summary
                                            side cue, RIR input gate)
- client/src/components/templates/PlanningSetCountControl.jsx
                                           (optional label prop, default
                                            "Sets" - template and block
                                            builders must be zero-diff in
                                            behavior)
- client/src/index.css                     (only if a new class is
                                            genuinely needed; prefer the
                                            existing muted/small idioms)
Do NOT modify anything outside these files.

CHANGE (five parts, one file-coherent unit):

1. DETECTOR BROADENING - `exerciseNameImpliesPerSide` must recognize the
   catalog's unilateral naming, not just `\bsingle\b`, and must dodge the
   known false positive. Mechanism is Cursor's choice (broader regex,
   word-pair test, denylist - whatever reads cleanest); the observable
   contract is the name table in the acceptance criteria. Keep the
   existing blank-name guard (`isBlankSessionExerciseName`) intact.

2. AUTO-CREATE THE FIRST PAIR - on the LIVE path only: when a qualifying
   event leaves the exercise in per-side mode with ZERO sets, create
   exactly one L/R pair via `createSetPairForExercise` VERBATIM - no
   second creation path. Qualifying events, and only these:
   (a) the COMMITTED exercise name changes (the `onExerciseCommitted`
       path - same committed-vs-draft discipline as the tracked pill's
       interactivity guard, see the comment at ~:1378-1383) such that
       `derivePerSideMode` is now true; draft keystrokes must never
       trigger it - a user typing "single..." mid-word gets nothing;
   (b) the manual L/R override chip toggles ON (per-side override true).
   Hard non-triggers: completed sessions; initial mount/page load of
   existing data; any exercise that already has sets; override === false
   (the trigger keys off the derived MODE, not the raw name, so a forced-
   bilateral override wins over a per-side name); and re-trigger loops -
   deleting the auto-created pair is a user statement, respected: with an
   unchanged committed name and override state, the pair must NOT come
   back. A LATER qualifying event (another name commit that implies
   per-side, or the override toggled off and on again) may create again.
   Auto-creation must not steal focus from whatever field the user was in
   (same discipline as L1's autofill).

3. STEPPER SPEAKS PAIRS - `PlanningSetCountControl` gains an optional
   label prop (default "Sets", aria-label following suit) so template and
   block builders are untouched; the live session passes "Pairs" when
   `perSideMode` is on. The heading's `setCountLabel` (~:1355) stays raw
   row count - that is ruling 1, not an oversight. Net result for one
   L/R pair: heading "· 2 sets", toolbar "Pairs: 1" - different words,
   no contradiction.

4. LAST-LOGGED SIDE CUE - `sessionExerciseLastLoggedSummary` (~:346-357)
   includes the side letter when the summarized set is sided, e.g.
   collapsed line "Last R 60 × 10"; unsided sets render exactly as today.

5. DECIMAL-RIR INPUT GATE - the live session RIR field (SessionSetRow
   draft field, `inputMode="numeric"`, payload at ~:834) must never send
   a non-integer RIR to the server. Either make a decimal impossible to
   enter, or accept the keystrokes but block the PATCH and inform the
   user inline (existing muted/small error idioms) that decimal RIR won't
   count - Cursor's choice which, per Seth's ruling ("make it impossible
   or inform the user"). Integer entry, clearing the field, and the RPE
   field (where 8.5 is legal and correct) must be byte-for-byte
   unaffected. Live session only - the template builder's SetRow is out
   of scope.

ACCEPTANCE CRITERIA (machine-checkable):

- Detector name table - `exerciseNameImpliesPerSide` returns TRUE for:
  "One-Arm Dumbbell Row", "Dumbbell One-Arm Shoulder Press",
  "Cable One Arm Tricep Extension", "Dumbbell Seated One-Leg Calf Raise",
  "Single-Arm Cable Crossover", "Single Leg Glute Bridge",
  "Single Dumbbell Raise", "Unilateral Leg Press";
  and FALSE for: "Chest Push (single response)", "Barbell Bench Press",
  "Deadlift", "" and blank/placeholder names. Evidence: node eval of the
  function (or its extracted predicate) in the delivery report.
- Trigger matrix, each case evidenced (code-path walkthrough + manual
  trace in the report):
  - commit "One-Arm Dumbbell Row" on a live zero-set exercise -> exactly
    one L/R pair appears (2 rows, L then R), created via
    `createSetPairForExercise`;
  - same commit on an exercise WITH sets -> no creation;
  - toggling the L/R chip ON with zero sets -> one pair;
  - override false + per-side name commit -> no creation;
  - deleting the auto pair, name/override unchanged -> stays deleted
    (no effect-loop respawn);
  - completed session -> no creation anywhere;
  - page load of an existing live session with a per-side name and zero
    sets -> no creation.
- Stepper: in per-side mode the control label reads "Pairs" (aria-label
  updated to match); bilateral mode and the template/block builders still
  read "Sets" - `grep` shows PlanningSetCountControl's default unchanged
  and no other call site passes the new prop.
- Collapsed summary: a sided last-logged set renders "Last R 60 × 10"
  (side letter present); unsided renders "Last 60 × 10" as today.
- RIR gate: entering 1.5 in a live RIR field results in ZERO network
  write for that value and either a blocked input or an inline
  explanation; entering 2 persists exactly as today; RPE 8.5 still
  persists as 8.5.
- `npm run test:unit` from server/ green (tripwire - no server files in
  scope).
- Client `npm run build` compiles with no errors.
- Zero raw colors in any CSS touched (tokens only; check-hex clean).

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
