# TASK sr3-r1: RECON - block runs (pause/resume), 7-day cap, import of non-library exercises

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the smoke-round-3 wave (`docs/tasks/bk-smoke-FINDINGS.md`
-> "Smoke round 3" and "Round 3 rulings"). The frontier seat will write unit
contracts FROM this report, so it needs what exists TODAY with file:line
evidence and the patterns already in use - not proposals. Design of record
for blocks: `docs/specs/blocks-v2.md`.

FILES TO TOUCH:
- DELIVERY.md (repo root) - the report. NOTHING else.
Do NOT modify anything outside this file.

CHANGE:
REPORT ONLY - no code changes, no git operations. Answer each question with
file:line evidence; say "not found" rather than guess. Quote short code
excerpts where the exact shape matters.

**A. Block runs -> pause + resume (ruling: one active block at a time;
switching pauses the old one; starting a block that has an unfinished
earlier run offers "Resume at Wn - Day" or "Start over"; no schema change -
reopen the old run).**
1. Every server path that creates, ends, or reads a `BlockRun`
   (`server/src/controllers/blockRunController.js`,
   `server/src/routes/blockRunRoutes.js`, `sessionController.js`
   start-from-block, coach / connector paths, `askCoach.js` block focus,
   anything else). For each: what it assumes about `endedAt`.
2. `server/src/blocks/blockRunLogic.js` `computeRunProgress`: its output
   shape, how it decides "next day" and "finished", and whether it can be
   called on an ENDED run unchanged.
3. Anything that treats `endedAt != null` as "completed" (block history,
   Execution / plan-vs-actual, analytics, Home, Library "Running" chip,
   block summary pages) - i.e. what would break or mislead if an ended run
   is reopened (endedAt set back to null), and what would mislead if a
   PAUSED run looks identical to a deliberately ENDED one.
4. Every client entry point that starts a run (`blockRunApi.startBlockRun`
   callers: `BlockRunPage.jsx`, `MyTemplatesPage.jsx`, Home, import "start
   now", any other) - what it shows before/after, and which confirm copy it
   uses today.
5. Existing tests for block runs (unit lane `server/test/**` glob per
   `server/package.json`, and integration) - names and what they assert.
6. The BK7 note "start-from-block has no unique guard (race -> two
   sessions)": where that race lives, and whether a reopen path adds a
   similar race (two runs open for one user).

**B. 7-day cap everywhere (ruling: "+ Day" greys at 7 with "7 days max";
the server refuses an 8th day on save; import / AI previews list an 8+ day
week as a problem).**
1. Builder: `addDay` and every other path that adds days (copy week, copy
   forward, duplicate day, coach draft apply, restore draft) in
   `client/src/components/blocks/builder/`.
2. Server: block create/update validation (`blockTemplateStore.js`,
   `createBlockTemplateForUser`, the normalizer) - existing caps on weeks,
   days, exercises, sets, and the error shape returned.
3. Block Format v1 validator + CSV/TSV parsers (`server/src/lib/blocks/` or
   wherever BK2 put them) and the import preview's problems list (how a
   problem is represented and rendered client-side).
4. Coach block draft + import-map + import-fix paths: any structured-output
   schema or prompt text that bounds days per week.
5. Any existing max constants (grep MAX_ / max days / max weeks) and where
   they are shared between client and server.

**C. Imported blocks with exercises not in the library (future CR: "the
app should probably catch that and have you add them to the library").**
1. How an imported exercise name is resolved to an `Exercise` row (catalog
   + the user's custom exercises) - the function, and what an UNMATCHED name
   becomes in the saved block (`BlockWorkoutExercise` fields, exerciseId
   null? name kept?).
2. What the import preview shows for unmatched names today (warning text,
   component, file:line).
3. The custom-exercise create API (L3: route, body, validation, dedupe by
   name) - can it be called once per unmatched name from the client.
4. After save, does anything re-link a block exercise if the user later
   creates a matching custom exercise?

**D. Collision map.** For units A, B, C list the candidate FILES TO TOUCH
(client + server + tests) and flag every file that appears in more than one
unit.

Write it all to `DELIVERY.md` with headings A-D and numbered answers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status` in the lane shows NO changes except an untracked or ignored
  `DELIVERY.md`.
- DELIVERY.md has sections A, B, C, D; every numbered question is answered
  with at least one file:line that exists on this branch, or "not found"
  plus where you looked.

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
