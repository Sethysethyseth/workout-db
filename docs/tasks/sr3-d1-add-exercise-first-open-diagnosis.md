# TASK sr3-d1: DIAGNOSIS - builder "+ Add exercise" opens wrong the first time

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Smoke round 3, item 2 (`docs/tasks/bk-smoke-FINDINGS.md` -> "Smoke round
3"). In the block builder (`/create-template?type=block` or
`/blocks/:id/edit`), on Android Chrome against the staging Vercel deploy,
tapping "+ ADD EXERCISE" usually opens - the FIRST time - an "ADD EXERCISE"
sheet whose header shows, with the soft keyboard up, but NO search field and
NO exercise list visible. Closing and tapping "+ Add exercise" again opens
the normal search screen. Screenshot (read it):
`claudefiledrop/smoke-r3-add-exercise-first-open.png` - the sheet header sits
directly on top of the keyboard; the builder page is still visible above it.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
DIAGNOSIS ONLY - make NO code changes. Trace and explain the symptom.

Start from `client/src/components/blocks/builder/ExercisePicker.jsx` and the
sheet that hosts it (`BuilderSheet.jsx`, plus how `BlockBuilder.jsx` opens
the picker), and the CSS that sizes/positions them
(`client/src/styles/` - find the builder/sheet rules). Things worth checking,
not a checklist to stop at: autofocus of the search input on mount and when
it fires relative to the open transition; any height computed from
`window.innerHeight` / `visualViewport` / `dvh` / `svh` at mount (before vs
after the keyboard resizes the viewport); what is different on the SECOND
open (component kept mounted? cached exercise list? a ref or measured height
that only exists after the first open? the keyboard already being "warm"?);
whether the list renders empty until a fetch resolves and the sheet height
collapses to its header meanwhile; Android Chrome's `interactive-widget` /
viewport meta behaviour in `client/index.html`.

You may run the client locally to reproduce (`npm run dev` from `client/`
with `VITE_API_URL` pointed at a non-prod API or with the network stubbed -
`client/.env` points at PRODUCTION, never let a dev run hit it) and use a
mobile-emulated viewport; say plainly if you could not reproduce the
keyboard part (desktop Chromium has no soft keyboard) and what you proved
instead.

Write to `DELIVERY.md`:
1. Root cause - file:line, the mechanism, and why it explains the EXACT
   symptom (header visible, keyboard up, no search/list, first open only,
   fine on second open).
2. Evidence - what you read/ran, and what you proved vs inferred.
3. Blast radius - other sheets/pickers that share the mechanism (e.g. the
   logger's add-exercise sheet, Library pickers) and whether they show it.
4. Smallest correct fix - described, not applied, with the files it would
   touch.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md contains the four numbered sections above, each root-cause
  claim anchored to a file:line that exists on this branch.
- The report states explicitly which parts were reproduced and which are
  inferred from code.

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
