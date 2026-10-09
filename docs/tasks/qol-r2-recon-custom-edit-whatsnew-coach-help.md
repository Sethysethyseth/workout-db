# TASK qol-r2: RECON - edit custom exercises, What's New pipeline, coach app-help

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the `quality-of-life-updates` wave. Seth's asks: (2) a
What's New system where shipped changes are recorded in a source file and a
separate "what's new" agent turns them into concise release notes with an
optional in-depth view, the latest one reachable from Profile any time;
(5) edit your own custom exercises from the Library (name, muscles hit,
etc.); (6) the in-app AI coach also tells users it can help them navigate
the app - and actually can. The frontier seat writes contracts FROM this
report: it needs what exists TODAY with file:line evidence - not proposals.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
REPORT ONLY - no code changes, no git operations. Answer each question with
file:line evidence; say "not found" rather than guess. Quote short code
excerpts where the exact shape matters.

**A. Custom exercises (ask 5).**
1. The Prisma model(s) for a user's custom exercise (fields, uniqueness,
   relation to the catalog, muscle data - primary/secondary muscles,
   weights, equipment, per-side flag) - `server/prisma/schema.prisma`
   line refs.
2. Every route that creates / reads / updates / deletes a custom exercise
   (method, path, validator, controller) - is there ANY update route today?
3. What references a custom exercise and how: session exercises,
   template exercises, block exercises, analytics (muscle volume,
   `searchCatalog`, exercise detail page). Is the link an FK id or a
   copied NAME? Exactly what would go stale if a custom exercise were
   renamed or its muscles changed (e.g. historical sessions storing the
   name string).
4. The Library UI where custom exercises are listed and the create flow
   (NT2 stepped sheet / sr3-4 add-to-library) - components, the fields the
   create form collects, and whether that form could be reopened
   pre-filled for editing.
5. Name dedupe rules on create (case, catalog-name collisions).

**B. What's New (ask 2).**
1. `client/src/data/whatsNew.js` (RELEASES shape: id, date, title,
   tagline, sections, items), `client/src/components/whatsnew/*`,
   `client/src/lib/whatsNewStorage.js`, the What's New page route, and the
   Profile link - file:line for each, and how `isProdEnv()`
   (`client/src/lib/appEnv.js`) gates each one.
2. How the modal decides to show (seen-id storage), and what the archive
   page renders per release (all sections expanded? collapsible?).
3. The latest RELEASES entry's date, and the list of user-facing features
   merged to main SINCE that date that have no release entry - derive it
   from `docs/tasks/QUEUE.md` (unit ids + one-line scopes, LANDED units
   only) and `git log --oneline` on this branch. Plain list, newest first.
4. Any existing changelog-ish file in the repo (`CHANGELOG`, release
   notes, `docs/releases/`) - "not found" if none.

**C. Coach app-help (ask 6).**
1. Client: `client/src/components/coach/*` - where the coach panel mounts
   (which pages), its intro/empty-state copy, suggestion chips
   (`client/src/lib/coachSuggestions.js`), consent gating, loading state
   while waiting for the first answer.
2. Server: the coach route(s), the system prompt (file:line, quote its
   structure in short), what context is sent (training summary? raw
   data?), the provider abstraction (`COACH_PROVIDER` mock/cursor/BYO
   key), per-user rate/usage caps (`CoachUsage`), and the max
   prompt/response size.
3. Is there any existing in-repo description of the app's screens and
   features that could serve as an "app guide" knowledge source for the
   coach (README, specs, onboarding copy, whatsNew.js)? List candidates
   with size in lines.
4. Does the coach refuse or deflect non-training questions today (prompt
   rules, tests)?

**D. Collision map.** For the three asks, list candidate FILES TO TOUCH
(client + server + tests + CSS) and flag every file that appears under
more than one ask.

Write it all to `DELIVERY.md` with headings A-D and numbered answers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md has sections A-D; every numbered question is answered with at
  least one file:line that exists on this branch, or "not found" plus where
  you looked.

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
