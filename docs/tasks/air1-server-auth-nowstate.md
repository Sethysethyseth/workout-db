# TASK AIR1: RECON (REPORT ONLY) - now-state of the server auth + API surface

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the AI connector wave (`docs/specs/ai-layer.md`, phases
AI1-AI4). The wave adds an OAuth-protected remote MCP server layered OVER
LogChamp's existing cookie/JWT authentication - the server keeps its own users
and login, and a vendor authorization server (WorkOS Standalone Connect, per
`docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`) issues connector tokens.
This is the FIRST server-side wave in a long while; the E and F waves were
client-only, so every server assumption in the spec needs re-grounding against
the tree before any contract is authored. This block produces a REPORT that the
frontier seat authors the wave's task-block contracts FROM.

FILES TO TOUCH:
- DELIVERY.md   (the report - this is the ONLY file you may create or modify)
Make NO changes to any other file, and NO git operations of any kind.

CHANGE:
Produce a REPORT ONLY. Read the server tree and answer each question below
with FILE:LINE evidence and short verbatim code excerpts. Where a question's
answer is "does not exist", say so explicitly - an absence is a finding, and a
guessed answer is worse than no answer. Do not propose designs, do not
recommend an approach, do not write code. Facts and citations only.

Answer these, in this order, with a heading per section:

1. **Express app assembly.** Where the app is constructed and what middleware
   runs in what ORDER (`server/src/app.js` / `server.js` / wherever it lives).
   Give the exact mount order: body parsers, CORS (with its exact origin
   config), session middleware, `attachAuthUser`, routers, error handlers.
   Name every `app.use(...)` in order with its line number.

2. **Session cookie auth.** How the cookie session is configured - store
   (connect-pg-simple?), cookie name, `secure`/`sameSite`/`maxAge` settings,
   secret source. Quote the config block verbatim with file:line.

3. **JWT Bearer auth.** `server/src/lib/jwt.js` - what is signed (exact claim
   set), what algorithm, what secret/key source, what TTL, and every call site
   that signs or verifies. Quote the sign and verify functions verbatim.

4. **`attachAuthUser` and route protection.** `server/src/middleware/
   attachAuthUser.js` verbatim. Then: what exactly does it put on `req`
   (`req.user`? `req.userId`? shape?), and how does a route DECLARE that it
   requires auth - is there a `requireAuth` guard, or does each controller
   check? List every distinct auth-guard pattern in use with one example
   file:line each.

5. **The analytics endpoints the MCP tools will read.** For EACH of:
   `GET /api/analytics/summary`, and the exercise-detail endpoint - give the
   exact route path and its file:line in `server/src/routes/`, the exact query
   parameters it accepts (names, formats, defaults, validation), how it derives
   the user, and the TOP-LEVEL SHAPE of the JSON it returns (key names one or
   two levels deep - not the full object, but enough that a tool schema could
   be written against it). Include whether `meta.effortCoverage` and
   `meta.honestyNotes` are actually present in the response, with evidence.

6. **The full route inventory.** Every router mounted under `/api`, its mount
   path, and its file. One line each. Flag any route that is NOT user-scoped.

7. **Rate limiting, helmet, and abuse controls.** Does ANY exist today? Which
   packages are in `server/package.json` dependencies that relate to auth,
   security, sessions, or rate limiting - list them with their versions.
   If there is no rate limiting, say so plainly.

8. **The Prisma `User` model** verbatim from `server/prisma/schema.prisma`,
   plus any model that already stores per-user preferences or flags on the
   server (as opposed to localStorage). If per-user server-side preferences do
   not exist at all, say so.

9. **Migration conventions.** List the last 5 migration directory names under
   `server/prisma/migrations/` in order, and quote ONE of them in full, so the
   naming and SQL style are legible. State how migrations are run per
   `package.json` scripts and `prisma.config.ts`.

10. **Environment variables.** Every env var the server reads, from
    `server/.env.example` and from any `process.env.` reference in
    `server/src/`. Give the list with the file:line of first use.

11. **Server test coverage.** What lives in `server/test/` - which directories,
    and specifically: is there ANY test that exercises an Express route or
    middleware (as opposed to the pure analytics functions)? Give evidence.
    State plainly whether `npm run test:unit` touches any server route code.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain --untracked-files=all` is EMPTY when you finish
  (`DELIVERY.md` is gitignored). Paste the verbatim output in the report.
- All ELEVEN numbered sections above are present as headings in DELIVERY.md,
  each with at least one `file:line` citation or an explicit "does not exist"
  statement.
- Section 5 gives, for each of the two endpoints, a route path, a file:line, a
  parameter list, and a JSON key outline.
- Section 4 quotes `attachAuthUser.js` verbatim in full.
- Zero code changes; zero git commands other than the `git status` above.

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
