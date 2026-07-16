# TASK MW6: auto-create the first L/R pair on per-side exercises

STATUS: DRAFT   <!-- GATED ON MW4's audit verdict - do not flip to QUEUED
                     or dispatch until MW4 lands and its findings are
                     folded into this contract. If MW4 finds the per-side
                     foundation broken, fixes land first and this block
                     gets re-authored on top of them. -->
MODEL: opus
MODE: 1-relay

CONTEXT:
Seth's ask #15 (July 16): when an exercise name matches the "single"
per-side convention, auto-generate the first set pair instead of
requiring a manual "+ Add set" tap. Per-side MODE detection already
exists (`derivePerSideMode` / `exerciseNameImpliesPerSide` in
`client/src/pages/SessionDetailPage.jsx` ~:207-221) and pair creation
already exists (`createSetPairForExercise`) - this unit only adds the
automatic trigger.

CONTRACT SKETCH (to finalize post-MW4):
- Trigger on the LIVE path only, when a session exercise's COMMITTED name
  newly implies per-side mode AND the exercise has zero sets. Committed
  name, not draft keystrokes - a user typing "single..." must not get
  sets spawned mid-word (same committed-vs-draft discipline as the
  tracked pill's interactivity guard, ~:1381-1387).
- Exactly one auto-creation per exercise per qualifying commit - no
  re-trigger loops when the pair is deleted (deleting the pair is a user
  statement; respect it), none on page load of existing data, none on
  completed sessions.
- Reuse `createSetPairForExercise` verbatim - no second creation path.

OPEN ITEMS BLOCKING QUEUED:
1. MW4's verdicts on pair semantics and the detection edges - if the
   audit flags `anySetHasSide`/mode-flip traps, this trigger inherits
   them and the contract must address each named trap.
2. Whether auto-creation should also fire when the manual per-side
   override toggles on (not just name-implied) - decide when finalizing.

ACCEPTANCE CRITERIA (machine-checkable): to be finalized with the
contract; will include the committed-name trigger cases, the
no-re-trigger case, client build green, unit-lane tripwire, and zero raw
colors if any CSS is touched.

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
