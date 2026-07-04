# TASK L2: "Tracked" indicator - is this exercise counted by analytics?

STATUS: QUEUED
MODEL: sonnet
MODE: 1-relay

CONTEXT:
FIRST unit of the L-wave (L-wave order: L2 -> L1 -> L3 -> L4). It goes
before L1 deliberately: this unit runs the integration lane, and L1 puts
an unapplied migration in the tree that `npm test`'s pretest would
silently apply (gated). The analytics engine only counts
an exercise's sets when its name resolves against the catalog
(`server/src/analytics/resolve.js`, exact normalized-name match). Users
have no way to know whether the name they just typed is being tracked.
This unit surfaces it: a small, theme-fitting check indicator next to the
exercise heading while logging - present = "counts toward your analytics",
absent/hollow = "not in the exercise library". NO schema change; the
resolver + catalog already exist server-side and stay the single source of
truth (do NOT duplicate the catalog or `normalizeExerciseName` into the
client - resolution happens over the API).

FILES TO TOUCH:
- server/src/routes/exerciseRoutes.js        (replace the placeholder route)
- server/src/controllers/exerciseController.js  (NEW)
- server/src/routes/index.js                 (mount if not already mounted -
                                              check first; the placeholder
                                              may already be wired)
- server/test/exercises.integration.test.js  (NEW)
- client/src/api/exerciseApi.js              (NEW - resolve call via shared
                                              `http`, same shape as
                                              analyticsApi.js)
- client/src/pages/SessionDetailPage.jsx     (indicator in the exercise
                                              heading)
- client/src/index.css                       (indicator styles)
Do NOT modify anything outside these files. Nothing under
`server/src/analytics/` changes - the controller IMPORTS the engine
(the analyticsController pattern), the engine never imports the controller.

CHANGE:

1. **Endpoint**: `POST /api/exercises/resolve` behind `authRequired`
   (mounted at `/exercises` - the placeholder router already exists;
   replace its stub GET). Body: `{ names: string[] }` (cap 100 entries,
   400 over that or when `names` is not a nonempty array of strings).
   Response: `{ results: [{ name, resolved, catalogId, canonicalName }] }`
   - one row per input name, in order, using `resolveExercise` from
   `server/src/analytics/resolve.js` (`catalogId`/`canonicalName` null
   when unresolved). POST-for-read is deliberate: exercise names do not
   belong in URLs/log lines, and it batches.

2. **Client api**: `resolveExerciseNames(names)` in `exerciseApi.js`.

3. **Indicator UI** (SessionDetailPage): in the exercise block heading row
   (next to the `session-exercise-heading-meta` set count), render:
   - Resolved: a small check-in-circle glyph (inline SVG or styled span,
     NOT an emoji), colored via
     `color-mix(in srgb, var(--color-interactive) ...)` like the existing
     `session-set-sync-badge` - quiet, ~14px, no motion. `title` +
     `aria-label`: "Tracked - counts toward your analytics".
   - Unresolved (nonblank name only): a hollow dashed circle in muted
     border color, `title`/`aria-label`: "Not in the exercise library yet
     - analytics can't attribute this one". Blank names show nothing.
   - Both live sessions and completed (read-only) sessions show it.
4. **Resolution wiring**: one batched `resolveExerciseNames` call per
   session load for all current exercise names, plus a re-resolve of a
   single name after its commit path succeeds (`commitName` /
   `onExerciseCommitted`). Cache results in a module-level Map keyed by
   the raw trimmed lowercase name so revisits don't refetch. Resolution
   failures (network) render NO indicator rather than a wrong one - never
   show "not tracked" because a request failed.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from server/; client `npm run build` green.
- Integration tests (fine to RUN this unit - no schema change, `npm test`
  applies no new migration): 401 unauthenticated; happy path where
  "Bench press" (a catalog name) resolves with a non-null catalogId and
  "zzz not real zzz" comes back `resolved: false`; 400 on `names: []`.
- Manual contract (reviewer verifies in dev): typing "Bench press" in a
  live session shows the check with the exact title string above; typing
  gibberish shows the hollow state; a completed session renders
  indicators too.
- `grep -rn "normalizeExerciseName\|exercises.json" client/src` -> no hits
  (no client-side catalog duplication).
- No new hex colors in changed CSS; both `package.json` files
  byte-identical.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
