# TASK FP1: rebrand title/copy leaks + never-gate-history line

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
FP-wave polish unit. Evidence base: `docs/tasks/
fp0-frontier-parity-report-FINDINGS.md` sections R1 and R10 (in this
tree - read them). The rename boundary in AGENTS.md governs: display
text only; storage keys, cookies, routes, service names, API messages
all stay untouched.

FILES TO TOUCH:
- client/index.html
- client/src/pages/HelloPage.jsx
Do NOT modify anything outside these files.

CHANGE:
1. `client/index.html` title becomes exactly `LogChamp` (drop "beta").
2. `HelloPage.jsx:17` "Welcome to WorkoutDB Beta" -> "Welcome to
   LogChamp"; `:49` "save WorkoutDB to your phone's home screen" ->
   same sentence with LogChamp.
3. Add the history guarantee to HelloPage as one muted line in the
   existing copy idiom, placed with the other product blurbs:
   "Your history stays yours - every set, no time limit."
Do NOT touch the auth tagline (AuthLayout.jsx) - that decision is
pending elsewhere.

ACCEPTANCE CRITERIA (machine-checkable):
- Grep of client/src JSX string literals + index.html finds ZERO
  rendered "WorkoutDB" (storage keys / hostnames / comments exempt).
- The guarantee line renders on HelloPage; exact string above.
- client `npm run build` green; `npm run test:unit` green from server/
  (tripwire).

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
