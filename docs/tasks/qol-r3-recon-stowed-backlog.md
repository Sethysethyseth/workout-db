# TASK qol-r3: RECON - the stowed backlog (discard entry points, coach wait state, exercise reorder, polish deferrals)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the `quality-of-life-updates` wave, which also folds in
the backlog stowed in `docs/HANDOFF.md` ("Next-wave candidates" and "Seth's
asks, Sept 29"). The frontier seat writes contracts FROM this report: it
needs what exists TODAY with file:line evidence and the reusable patterns BY
NAME - not proposals. Polish sources of record:
`docs/tasks/sr3-critic-round-1-FINDINGS.md` (P3s) and
`docs/tasks/cr2-critic-round-2-FINDINGS.md`.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
REPORT ONLY - no code changes, no git operations. Answer each question with
file:line evidence; say "not found" rather than guess. Keep each answer
short - this report covers many items.

**A. Discard from the live-workout entry points.** WD1's discard X lives
in `SessionDetailPage`. Find: the Home "In progress / Resume workout" card
and the floating "In progress" bar (components + files), WD1's confirm
UI (`.session-discard-confirm`) and the `POST /sessions/:id/discard` client
call - is the confirm a reusable component or inline JSX? Does a block-day
session use the same entry points and the same discard route?

**B. Coach "thinking" state.** What the coach panel shows between send and
first answer today (`client/src/components/coach/`), whether responses
stream, and the existing loader components (`LoadingState.jsx`, the T3
dynamic loading screens, `bkr1` AI wait loader) that could be reused BY
NAME.

**C. Exercise hold-to-move in the builder.** sr3-6's `useHoldToReorder`
(file, its API, axis support) and where it is used for weeks/days; the
builder exercise list component and how exercise order is stored/changed
today (up/down buttons? order field?).

**D. Polish deferrals - for EACH, the owning file:line and a one-line
"what it does now":**
1. sr3 P3-1 builder name row, P3-2 coach box placement / title wrap, P3-5
   action-sheet styles (list every distinct action-sheet implementation),
   P3-8 recent exercises on an empty search, P3-10 Library load time (what
   requests fire on Library mount and their count).
2. No rest timer after a set (any timer code at all?).
3. Fractional Execution numbers (where Execution values render, where the
   fraction comes from).
4. Desktop In-progress bar width.
5. "Per side" offered on bilateral lifts in the builder.
6. Builder week pill renders as a bright white bar (which token/CSS).
7. Crimson palette "good" colour reads amber (`client/src/index.css`
   crimson tokens).
8. Quick-log set-count and L/R pair confirms still use browser
   `window.confirm` (list every remaining `window.confirm`/`alert`/`prompt`
   in `client/src/`).
9. ~1 s Login flash after iOS clears site data (the auth bootstrap path in
   `ProtectedRoute.jsx` / session restore).

**E. Server stowed items.**
1. The JSON body limit (`express.json` config) vs the 1,000,000-char caps
   on `/coach/import-map` and the import-fix recipe path - file:line; how
   a 413 surfaces in the client today.
2. History import: where 8+ distinct titles hard-fail the preview (the cap
   constant, the error), and what "keep the 7 most-used, warn about the
   skipped" would touch.
3. Migration line endings: any `.gitattributes` today; how many files
   under `server/prisma/migrations/` are CRLF vs LF in this checkout.

**F. Coach discoverability.** Every page/route where the coach panel can
be opened today, and the app's nav structure (bottom nav items, Profile
sections) - where a persistent entry point could live.

**G. Collision map.** Group A-F into candidate units and list each one's
FILES TO TOUCH (client + server + tests + CSS); flag every file that
appears in more than one group, especially `client/src/index.css`, the
Home page, the builder, and the live session page.

Write it all to `DELIVERY.md` with headings A-G and numbered answers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md has sections A-G; every question is answered with at least
  one file:line that exists on this branch, or "not found" plus where you
  looked.

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
