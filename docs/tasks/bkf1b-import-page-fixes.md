# TASK bkf1b: critic round 1 fixes - the import page

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The blocks-v2 wave (BK) failed its first coach-persona critique at 6/10
(`docs/tasks/bk-critic-round-1-FINDINGS.md` - read it; finding numbers below
refer to it). This block fixes the import page. The real-world case is Seth's
6-week rehab program (216 rows, 29 distinct exercise names, most not in a new
user's library): today the preview opens mid-page and a ~3000px matching list
stands between the stats and the program. Sibling blocks bkf1a (builder /
run / library / shared primitives) and bkf1c (logger summary + analytics
dates) run in parallel on DISJOINT files - stay inside the list below.
Design of record: `docs/specs/blocks-v2.md` sections 4 and 10.

FILES TO TOUCH:
- `client/src/pages/ImportBlockPage.jsx`
- `client/src/components/blocks/import/*`
- `client/src/styles/blocks/bk-import.css`
Do NOT modify anything outside these files (NOT `components/blocks/builder/*`
or `components/blocks/ui/*` - consume them as they are).

CHANGE (observable contract, finding number in brackets):
1. [5] Moving to the preview step (and back to the source step) scrolls the
   page to the top.
2. [6] **The matching section is compact and the program comes first.**
   - Order on the preview step: stats + chips, warnings, warm-up toggle,
     then BROWSE (the program), then EXERCISES (matching), then name +
     Create.
   - Matching: names that matched the library collapse under one line
     "22 match your library" (expandable `Disclosure` listing them, each
     still showing "Matches <name>" when it differs). Unmatched names are
     compact rows - one line each on a 390px phone for names up to ~24
     characters: name, "Not in your library", "Match..." - no per-row card
     chrome; "Keep as typed" stays the default (a quiet label, not a
     separate row). The existing Match -> picker -> `renames` flow is
     unchanged.
   - A sticky footer (inside the page column, above the app's bottom nav)
     carries the block name field's current value summary and "Create
     block" so Create is reachable from anywhere on the preview.
3. [16] Create block shows a busy state ("Creating..." + disabled) until
   the request resolves; a second tap cannot double-create.
4. [18] Every count string on the page pluralizes ("1 WEEK · 1 DAY · 2
   EXERCISES · 4 SETS", "1 TIMED SET"), and the toast passed to the builder
   reads "Imported 1 week" / "Imported 6 weeks".
5. The Browse section shows the selected day's NAME as a heading above its
   exercise cards (today only the tile shows it, truncated).
Tokens only (`--bk-*` aliases), 44px targets, motion rules per spec 10.2.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles (paste the tail);
  `node scripts/check-hex.mjs` clean; `npx eslint src/pages/ImportBlockPage.jsx
  src/components/blocks/import` 0 errors.
- A pure exported helper formats the stats line; a `node --input-type=module`
  snippet in DELIVERY.md prints (verbatim): `{ weeks: 1, days: 1, exercises:
  2, sets: 4, timedSets: 1 }` -> "1 WEEK · 1 DAY · 2 EXERCISES · 4 SETS" and
  "1 TIMED SET"; `{ weeks: 6, days: 30, exercises: 216, sets: 602,
  timedSets: 84 }` -> "6 WEEKS · 30 DAYS · 216 EXERCISES · 602 SETS" and
  "84 TIMED SETS".
- A pure exported helper splits the preview's `exercises` array into
  `{ matched, unmatched }` preserving order; the snippet prints it for a
  3-name sample (one matched with a different `matchedName`).
- DELIVERY.md walks items 1-5 naming the implementing file, and lists the
  reviewer's LIVE check: paste a 36-row TSV with ~20 unmatched names at
  390px -> preview opens at the top, stats then program, matching list
  compact, Create reachable without scrolling to the bottom, one tap
  creates exactly one block.

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
