# TASK gate-r2: Gate fuel - route + ownership inventory for the wave's server surface (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Pre-main gate for `ai-connector-wave` (BK + bkr + sr3 waves, 142 commits ahead
of `main` @ `7d3b91e`). Cross-user isolation is a standing review surface: the
reviewer needs a complete map of every server entry point the wave added or
changed and how each one scopes data to the signed-in user. This is a REPORT
lane: no code changes, no git operations. You map; the reviewer judges.

FILES TO TOUCH:
- REPORT-GATE-R2.md at the repo root (new, the ONLY file you write)
Do NOT modify, create or delete anything else. No DB connection.

CHANGE (report only):

1. **Every route the wave added or changed.** From
   `git diff 7d3b91e...HEAD -- server/src/routes/ server/src/app.js`, list each
   route: METHOD, path, middleware chain (e.g. `authRequired`, rate limiters),
   handler function and its file:line.
2. **Every MCP tool the wave added or changed** (`server/src/ai/mcpServer.js`,
   `server/src/ai/blockDraftAccess.js`, `server/src/ai/analyticsAccess.js`):
   tool name, how the user id is obtained, handler file:line.
3. **Per handler, every Prisma call** (including `$queryRaw` / `$executeRaw`
   and calls inside helpers it invokes in `server/src/blocks/`,
   `server/src/coach/`, `server/src/lib/`): model + operation, file:line, and
   HOW it is scoped to the user - one of: `where.userId = authUserId`;
   scoped through a relation (say which, e.g.
   `blockTemplate: { userId }`); ownership checked by a prior read (say where
   the 404/403 happens, file:line); or **UNSCOPED** (no user condition). Mark
   reads of OTHER users' rows that are intended (e.g. public blocks) as
   `PUBLIC-READ` and quote the condition that makes them public-only.
4. **Writes that take an id from the request** (params or body - template id,
   run id, session id, week/workout/exercise ids, `resumeRunId`, etc.): list
   each, and quote the code that proves the id belongs to the user BEFORE the
   write. Flag any where the proof is missing or happens after the write.
5. **Raw SQL.** Quote every `$queryRaw` / `$executeRaw` / `$queryRawUnsafe` /
   `$executeRawUnsafe` added in the wave, verbatim, with file:line, and say
   whether every interpolation is a tagged-template parameter.
6. **Request-size and cost limits** on the new upload / AI endpoints
   (`/blocks/import*`, `/coach/*`): body-size limits, file-size limits,
   rate limiters, and where the coach usage reservation happens relative to
   the provider call (file:line).

ACCEPTANCE CRITERIA (machine-checkable):
- `REPORT-GATE-R2.md` exists with sections 1-6, every claim carrying a
  file:line.
- A summary table at the top: handler -> scoping verdict (SCOPED /
  PUBLIC-READ / UNSCOPED / UNSURE).
- `git status --porcelain` shows ONLY `?? REPORT-GATE-R2.md` (paste it at the
  end of the report).

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
