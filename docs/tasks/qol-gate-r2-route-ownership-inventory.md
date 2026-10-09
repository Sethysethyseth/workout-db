# TASK qol-gate-r2: Gate fuel - route + ownership inventory for the QOL wave's server surface (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Pre-main gate for the quality-of-life wave: branch `quality-of-life-updates`,
61 commits ahead of `main` @ `b5c6777`. The wave added a saved coach key
(encrypted), saved coach conversations, last-performance lookups, custom
exercise edits, and session changes. Cross-user isolation is a standing
review surface: the reviewer needs a complete map of every server entry
point the wave added or changed and how each one scopes data to the
signed-in user. This is a REPORT lane: no code changes, no git operations.
You map; the reviewer judges.

FILES TO TOUCH:
- REPORT-QOL-GATE-R2.md at the repo root (new, the ONLY file you write)
Do NOT modify, create or delete anything else. No DB connection.

CHANGE (report only):

1. **Every route the wave added or changed.** From
   `git diff b5c6777...HEAD -- server/src/routes/ server/src/app.js` AND every
   handler changed in `git diff b5c6777...HEAD -- server/src/controllers/`,
   list each route: METHOD, path, middleware chain (auth, rate limiters,
   body limits), handler function and its file:line. Mark each NEW or
   CHANGED.
2. **Per handler, every Prisma call** (including `$queryRaw` /
   `$executeRaw` and calls inside helpers it invokes in `server/src/coach/`,
   `server/src/lib/`, `server/src/analytics/`, `server/src/blocks/`): model
   + operation, file:line, and HOW it is scoped to the user - one of:
   `where.userId = authUserId`; scoped through a relation (say which);
   ownership checked by a prior read (say where the 404/403 happens,
   file:line); or **UNSCOPED** (no user condition). Mark intended reads of
   shared rows (e.g. the global exercise catalog) as `SHARED-READ` and quote
   the condition.
3. **Writes that take an id from the request** (params or body:
   conversation id, message id, exercise id, session id, set id, etc.):
   list each, and quote the code that proves the id belongs to the user
   BEFORE the write. Flag any where the proof is missing or happens after
   the write. Include `updateMany` / `deleteMany` calls and say whether
   their `where` carries the user id.
4. **The key vault** (`server/src/coach/keyVault.js`,
   `server/src/coach/keyResolver.js`, `server/src/coach/config.js`, and the
   coach controller's key routes): quote verbatim the cipher, key
   derivation, IV/nonce generation, auth-tag handling, and what happens
   when `COACH_KEY_SECRET` is missing or wrong (boot, save, and use paths,
   file:line each). List every place a plaintext key or the secret could
   reach a log line, an error message, an API response, or the client
   (grep `console.`, `logger`, `res.json`, `err.message` along those
   paths). Report whether any GET route returns the stored key or any part
   of it (quote what it returns instead).
5. **Coach cost and abuse limits.** For every coach route the wave added
   or changed: rate limiter (file:line or "none"), request body size limit,
   max message/history length enforced server-side (file:line), and where
   the usage reservation happens relative to the provider call. Say which
   paths use the user's own key vs the hosted key, and whether the
   hosted-usage counter is skipped for own-key calls.
6. **Conversation storage.** For `server/src/coach/conversationStore.js`:
   the caps (conversations per user, messages per conversation, chars per
   message) with file:line, what happens at a cap, and whether deleting a
   conversation deletes its messages (code path or FK cascade, cite
   `schema.prisma` line).

ACCEPTANCE CRITERIA (machine-checkable):
- `REPORT-QOL-GATE-R2.md` exists with sections 1-6, every claim carrying a
  file:line.
- A summary table at the top: route/handler -> scoping verdict (SCOPED /
  SHARED-READ / UNSCOPED / UNSURE).
- `git status --porcelain` shows ONLY `?? REPORT-QOL-GATE-R2.md` (paste it
  at the end of the report).

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
