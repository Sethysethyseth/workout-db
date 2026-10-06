# TASK bkr-d1: DIAGNOSIS - "Finish workout" bar disappears during a block workout

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (Oct 5, `docs/tasks/bk-smoke-FINDINGS.md`, "Smoke round 2").
Seth, on his phone (iOS Safari, staging Vercel), logging a day of a running
block: the bottom "Finish workout" button disappears and only comes back
after he touches the workout. This is a DIAGNOSIS block - report only.

FILES TO TOUCH:
- DELIVERY.md (repo root, the report) - NOTHING else.
Do NOT modify any source file.

CHANGE:
Trace, make NO code changes. The live block logger is
`client/src/pages/SessionDetailPage.jsx` (the block path renders the
per-planned-set rows from bks2/bksf1a/bksf3b - `BlockSetRow` and friends);
the Finish control and any bottom/fixed bar live there or in components it
renders. Find every condition that hides, unmounts, translates, or
collapses that Finish control, and every state or event that flips it
(focus/blur, keyboard detection such as `visualViewport` listeners,
scroll direction, "editing" flags, draft state, re-render on set log).
Compare the block path against a normal quick-log session, where Seth did
not report it.

Write to DELIVERY.md:
1. Root cause: file:line, the mechanism, and why it explains the EXACT
   symptom (gone without any touch; back after a touch).
2. Whether quick-log / saved-workout sessions share the cause.
3. Blast radius: what else reads the same state.
4. The smallest correct fix (prose plus a sketch, not applied), and how a
   reviewer can verify it at 390px in Playwright (emulated or real
   `visualViewport` behaviour - say which).

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain` shows no change except the untracked DELIVERY.md.
- DELIVERY.md names at least one file:line for the hide/show condition and
  quotes the code it cites.
- DELIVERY.md states which events toggle the condition, in order, for the
  reported sequence (open block day -> bar gone -> touch -> bar back).

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
