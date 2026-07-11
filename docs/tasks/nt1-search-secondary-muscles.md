# TASK NT1: searchCatalog rows carry secondaryMuscles (seeding profile payload)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
First unit of the not-tracked-ux wave (branch `not-tracked-ux-wave`; design
doc: `docs/design/not-tracked-add-flow-brainstorm.md`). The reworked
add-to-library sheet (NT2) seeds a custom exercise's muscle picker from a
base exercise chosen via `GET /exercises/search`. Search rows already carry
`primaryMuscles`; adding `secondaryMuscles` gives the client the complete
profile with NO new endpoint - catalog entries store both fields in the
same 17-muscle vocabulary the picker uses (`deriveMuscleVocabulary` in
`exerciseController.js` derives the vocab from exactly these fields).

FILES TO TOUCH:
- server/src/analytics/searchCatalog.js        (row shape gains secondaryMuscles)
- server/test/analytics/searchCatalog.test.js  (pin the new field for both row sources)
Do NOT modify anything outside these files.

CHANGE:
In `searchCatalog.js`:
- `makeCatalogRow` additionally returns `secondaryMuscles: entry.secondaryMuscles || []`.
- `makeUserRow` additionally returns a `secondaryMuscles` array derived from
  the user entry's `muscles` map, mirroring the existing
  `primaryMusclesFromUserEntry` helper exactly but filtering for the
  `"secondary"` designation (add a sibling helper; keep the sorted-array
  contract).
The change is ADDITIVE only: no existing field is renamed, reordered, or
removed; ranking/dedupe logic untouched. The module stays pure (no fs, no
Prisma, no DB - the analytics-engine purity rule).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`.
- New/extended fixture tests pin BOTH sources: a catalog hit whose entry has
  secondary muscles returns them verbatim (e.g. a bench-press-family entry
  returning a non-empty sorted `secondaryMuscles`), and a user-exercise hit
  with `muscles: { chest: "primary", triceps: "secondary", shoulders: "secondary" }`
  returns `secondaryMuscles: ["shoulders", "triceps"]` (sorted) alongside the
  existing `primaryMuscles: ["chest"]`.
- A catalog entry with no secondary muscles yields `secondaryMuscles: []`
  (not undefined/null) - pinned by a test.
- `grep -n "require(" server/src/analytics/searchCatalog.js` shows no new
  imports (purity preserved).

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
