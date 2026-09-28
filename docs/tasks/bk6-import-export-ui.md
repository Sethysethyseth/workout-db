# TASK BK6: import a block (paste, file, old app, any AI) with a trustworthy preview; export a block

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth wants to bring blocks in from previous apps and from any AI. Research
(`docs/specs/blocks-v2-import-research-2026-09-28.md`): most apps export
HISTORY not programs, programs live in spreadsheets, and AI-assisted import
works only with a review step before save. His own requirements for
importing his Phase-1 sheet (`logchampIssues.md`, quoted in
`docs/specs/blocks-v2.md` section 1) come down to: nothing silently dropped,
blanks stay blank, timed sets survive, exact names, and the user reviews
before anything is created. Design of record: spec sections 2-5 (the format
and grammar the server applies) and 10 (visual language). Needs BK3
(LANDED: `GET /block-templates/format`, `POST /block-templates/import/preview`,
`POST /block-templates/import`, `GET /block-templates/:id/export`), BK4
(primitives), BK5 + BK5b (LANDED: the builder, its `readOnly` exercise
card, its exercise picker sheet) - read them first.

FILES TO TOUCH:
- `client/src/pages/ImportBlockPage.jsx`     (NEW - route `/blocks/import`)
- `client/src/components/blocks/import/*`    (NEW)
- `client/src/styles/blocks/bk-import.css`   (NEW)
- `client/src/api/blockTemplateApi.js`       (`getBlockFormat`,
                                              `previewBlockImport`,
                                              `importBlock`, `exportBlock`)
- `client/src/App.jsx`                       (the one route)
- `client/src/pages/MyTemplatesPage.jsx`     (an "Import a block" entry
                                              beside the create-block action)
- `client/src/components/blocks/builder/*`   (an Export action in the
                                              builder's menu)
Do NOT modify anything outside these files.

CHANGE - observable contract (root class `bk`, 390px first, 720px column):

1. **Step 1 - Source.** `StickyHeader` "IMPORT A BLOCK". A `Segmented`
   source picker: Paste | File | Old app | Any AI.
   - **Paste:** a large monospace textarea - "Paste cells from Excel,
     Google Sheets or Numbers. Include the header row." - with a small
     "What columns work?" `Disclosure` listing the main headers (Week, Day,
     Exercise, Sets, Reps, Load, RPE or RIR, Rest, Notes) and 3 example
     rows.
   - **File:** `.csv`, `.tsv`, `.txt`, `.json` via a file input (read with
     `FileReader`, max 2 MB, larger -> an inline error before any request).
   - **Old app:** Strong and Hevy, each with its two-line "how to export"
     (Strong: Settings -> Export Strong Data. Hevy: Profile -> Settings ->
     Export & Import Data -> Export Workouts), a file input, a "Weeks to
     build" `Stepper` (1-12, default 4), and for Strong a "Unit you logged
     in" `Segmented` lb / kg (default the device unit). One line explains
     what happens: "We rebuild your recent workouts as one week, repeated -
     then you shape the progression."
   - **Any AI:** three numbered steps - (1) "Copy the instructions"
     (copies `instructions` from `GET /block-templates/format` to the
     clipboard; the button confirms "Copied"), (2) "Paste them into
     ChatGPT, Gemini, Claude or any AI, with your program or a description
     of what you want", (3) "Paste the AI's answer here" (textarea). One
     line: "The AI's answer is checked the same way as any import - you
     review everything before it's saved."
   - Primary action "Preview" (disabled while empty).
2. **Step 2 - Preview** (`previewBlockImport` with `options.unit` = the
   device unit mapped `lbs -> lb`):
   - Stats header: `6 WEEKS · 5 DAYS · 34 EXERCISES · 612 SETS` (display
     type), plus a `Chip` per notable fact (e.g. `12 TIMED SETS`).
   - Warnings: a `Disclosure` "N things we changed or skipped" listing each
     warning with its source row ("Row 14: ..."). Zero warnings -> a good
     chip "Nothing skipped".
   - When `notices.warmupRows > 0`: a toggle "Include warm-up rows (N)"
     that re-runs the preview with `skipWarmups`.
   - **Exercise matching** (`SectionRule` "EXERCISES"): each distinct name
     once - matched names show a check (and "Matches <matchedName>" when
     the library name differs); unmatched names show "Not in your library"
     with Match... (opens BK5's exercise picker; the choice becomes a
     `renames` entry) and the default "Keep as typed". A one-line note:
     "Names are kept exactly as written - two spellings are two exercises."
   - **Browse:** `WeekStrip` + `DayPicker` + BK5's exercise cards in
     `readOnly` mode, so the user can check any week and day before saving.
   - Block name field (prefilled from the block), then "Create block" ->
     `importBlock({ block, renames })` -> navigate to `/blocks/<id>/edit`
     with a toast "Imported <n> weeks - review and tweak anything".
   - "Back" returns to step 1 with the input intact.
3. **Errors.** 422 from preview: a card "We couldn't read that yet" with
   each error translated from its path into words - `weeks[1].days[0].
   exercises[2].sets[3].reps` -> "Week 2 › <day name> › <exercise name> ›
   Set 4 › reps: <message>" (names taken from the submitted JSON when
   present, else positions) - and the input kept for editing. Network
   failure: an inline retry, input kept.
4. **Export** (builder menu): "Export block" -> `exportBlock(id, unit)` ->
   downloads `<slugified-name>.logchamp.json` (Blob + an `<a download>`)
   and offers "Copy JSON". An exported file imported through the File tab
   must preview with zero warnings.
5. Tokens only; 44px targets; all copy plain language (no "payload",
   "schema" or "JSON" outside the Any AI and export surfaces).

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` reports no raw colors in the diff.
- `npx eslint src/pages/ImportBlockPage.jsx src/components/blocks` from
  `client/` reports 0 errors.
- The path-to-words helper is pure and exported; a `node --input-type=module`
  snippet in DELIVERY.md prints (verbatim output pasted): the example path
  above against a small input -> "Week 2 › Upper A › Bench Press › Set 4 ›
  reps: ..."; a path into an input whose day has no name -> "Week 2 › Day 1
  › ..."; the empty path `""` -> the message alone.
- `App.jsx` diff is exactly one new route; `MyTemplatesPage.jsx` diff only
  adds the import entry (show both hunks).
- DELIVERY.md walks items 1-5 naming the implementing component/file, and
  lists for the reviewer's LIVE check: paste a 3-row TSV -> preview ->
  create; export it -> re-import the file -> zero warnings.

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
