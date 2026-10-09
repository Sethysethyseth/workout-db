# TASK qol5: Server fixes - friendly "too large" on coach imports, history import keeps the top 7 workouts

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Two stowed gate follow-ups. Recon: `docs/tasks/qol-r3-...-FINDINGS.md`
section E.
- **(a)** `/coach/import-map` and the import-fix recipe path accept up to
  1,000,000 characters (`server/src/coach/importMap.js` 15,
  `importFix.js` 14). But `/coach/*` sits behind the global
  `express.json()` with its default 100 kB limit (`server/src/app.js` 138).
  Import routes already get a 2mb parser (`app.js` 137). A >100 kB paste
  gets a raw 413, which the client shows as "Request failed (413 ...)"
  (`client/src/api/http.js` 128-130).
- **(b)** History import builds one day per distinct workout title
  (`server/src/blocks/historyToBlock.js` 167-193). With 8+ titles the
  preview hard-fails on the 7-day cap (`blockFormat.js` 12, 205-208).

FILES TO TOUCH:
- server/src/app.js
- client/src/api/http.js
- server/src/blocks/historyToBlock.js
- server/test/lib/blocks/  (extend the existing history test file, or add
                            `historyToBlock.topTitles.test.js`)
Do NOT modify anything outside these files.

CHANGE:
1. **`app.js`:** give `/coach` routes a JSON parser with `limit: "2mb"`,
   mounted before the global parser, the same way the import special case
   at line 137 is done. Every other route keeps its current limit.
2. **`http.js`:** a 413 response throws an Error whose message is "That's
   too large to send. Try a smaller file or paste less text.", with
   `status = 413` set on the error. Every other status behaves exactly as
   today.
3. **`historyToBlock.js`:** when there are more than 7 distinct titles,
   keep the 7 MOST-LOGGED titles and drop the sessions of the rest. Order:
   - session count, descending
   - then most recent session date, descending
   - then title, ascending

   Then push ONE warning into the function's existing `warnings` array:
   "Kept your 7 most-logged workouts. Skipped: Arms, Calves." Skipped
   titles are listed in the same order. With 7 or fewer titles, nothing
   changes and no warning is added. `blockFormat.js` keeps its hard cap
   untouched.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, including new tests:
  - 9 distinct titles (counts 9,8,7,6,5,4,3,2,2, the two 2s with different
    last dates) -> a 7-day result. The warning names the 2 skipped titles
    in the specified order, and `validateBlockDraft` on the result has no
    "a week holds at most 7" error.
  - exactly 7 titles -> no warning, output identical to before
  - tie on count and date -> broken by title ascending
- Client `npm run build` clean.
- `app.js` diff shows the `/coach` parser added and the global parser
  unchanged (quote it).
- The reviewer proves (a) live: a 300 kB JSON body POSTed to
  `/coach/import-map` returns the controller's own response (validation
  or auth), not 413. Note "needs live check" in DELIVERY.md.

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
