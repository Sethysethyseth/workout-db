# TASK <unit-id>: <one-line title>

STATUS: DRAFT            <!-- Claude Code flips to QUEUED when final -->
MODEL: <opus | auto>     <!-- Cursor model tier AND dispatch rung: opus =
                              judgment-heavy (named rung, plan credit);
                              auto = mechanical (free rung). Passed
                              verbatim to `--model`, so it must be a live
                              model - never `fable` (departed July 18). -->
MODE: <1-relay | 2-worktree @ C:\dev\worktrees\<unit-id> on branch unit/<unit-id>>

CONTEXT:
<1-2 sentences. What roadmap unit this is, how it fits the existing codebase.
Reference the spec section if one exists.>

FILES TO TOUCH:
- path/or/directory     (what changes; directories + contract allowed at
                         unit scale, e.g. "new modules under
                         server/src/analytics/, tests under
                         server/test/analytics/")
Do NOT modify anything outside these files.

CHANGE:
<Plain, specific description. Reference existing patterns/functions by NAME
so Cursor matches the codebase style instead of inventing one.>

ACCEPTANCE CRITERIA (machine-checkable):
- <e.g. `npm run test:unit` green from server/>
- <concrete input -> output examples for the unit's public contract - the
  reviewer verifies these, not vibes>
- <e.g. client `npm run build` compiles with no errors>

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
