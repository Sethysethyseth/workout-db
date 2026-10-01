# TASK bks4: Excel (.xlsx) upload on the block importer

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
From Seth's BK smoke (Sept 30, `docs/tasks/bk-smoke-FINDINGS.md`, CR1 follow-up):
people's programs live in spreadsheets. Today the import File tab
(`client/src/components/blocks/import/ImportSourceStep.jsx`) only reads text files
(.csv/.tsv/.txt/.json, `FileReader.readAsText`). Every Excel user has to "Save As
CSV" first. Seth approved adding the `read-excel-file` package, and it is ALREADY
INSTALLED in `client/package.json`; do not add or change any dependency.

The design keeps parsing where it is: the browser turns the chosen sheet into TSV
text, and that text enters the EXISTING delimited preview path unchanged. That
gives an Excel file the same preview, warnings, matching and the bks1 "Let AI
read this layout" action, with no server change.

FILES TO TOUCH:
- client/src/components/blocks/import/xlsxToTsv.js (NEW - pure, no browser or
  React imports, so it runs under plain Node)
- client/src/components/blocks/import/ImportSourceStep.jsx (and a NEW small
  sheet-picker component in the same folder, if you split it out)
- client/src/components/blocks/import/index.js (only to export new pieces)
- client/src/styles/blocks/bk-import.css
Do NOT modify anything outside these files. No server changes, no
`package.json` / lockfile changes, NOT `client/src/index.css`.

CHANGE:
1. `xlsxToTsv.js` exports `xlsxRowsToTsv(rows)`. It takes the 2-D array that
   `read-excel-file` returns and produces TSV text:
   - `null` / `undefined` cells become empty.
   - `Date` cells become `YYYY-MM-DD`.
   - Numbers use `String(n)`, never locale-formatted.
   - Booleans become `TRUE` / `FALSE`.
   - Strings are trimmed, and any tab or newline inside a cell becomes one space.
   - Trailing empty columns are trimmed (across the whole sheet, not per row).
   - Trailing fully-empty rows are dropped. Interior blank rows stay, because
     they can be meaningful (day breaks).
2. File tab:
   - The accept list adds `.xlsx`
     (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
   - The helper copy names it: "Choose a .xlsx, .csv, .tsv, .txt or .json file".
   - `.xlsx` files load `read-excel-file/browser` with a DYNAMIC `import()`, so
     the library is a separate chunk and only loads on use.
   - Read the sheet names first. With more than one sheet, show a compact sheet
     picker whose default is the first sheet named like
     `/program|plan|block|training/i`, else the first non-empty sheet.
   - With exactly one sheet there is no picker.
   - The chosen sheet then goes `read-excel-file` -> `xlsxRowsToTsv` -> the same
     handler a pasted/loaded TSV uses today (kind auto/delimited).
   - Changing the sheet re-runs the preview.
   - Excel files may be up to 5 MB; the other types keep the 2 MB limit.
   - Errors go through the existing `onFileError` copy pattern:
     - a legacy `.xls` gets "Save it as .xlsx or CSV first"
     - a password-protected or corrupt file gets "Couldn't open that spreadsheet.
       Save it again as .xlsx or CSV."
     - an empty sheet gets "That sheet is empty - pick another."
   - Show one loading state while the file reads, with no layout jump.
3. Style the picker in the BK language: tokens via `--bk-*` only, 44px
   targets, no horizontal scroll at 390px.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` compiles with no errors. The build output lists a
  SEPARATE chunk containing read-excel-file, and the main `index-*.js` chunk
  grows by no more than 3 KB vs the pre-change build (paste both sizes).
- `node scripts/check-hex.mjs` passes. `npm run test:unit` from `server/` is
  still green.
- Pure check: run from `client/` with plain Node and paste the output:
  `node --input-type=module -e "import {xlsxRowsToTsv} from
  './src/components/blocks/import/xlsxToTsv.js'; console.log(JSON.stringify(xlsxRowsToTsv([['Week','Exercise','Sets',null],[1,'Bench\tPress',3,null],[new
  Date(Date.UTC(2026,8,14)),null,true,null],[null,null,null,null]])))"`.
  It prints
  `"Week\tExercise\tSets\n1\tBench Press\t3\n2026-09-14\t\tTRUE"`. Use UTC date
  getters so the date does not shift with the machine's timezone.
- Real-file check (a one-off script, NOT committed):
  - Read `C:\Users\Sethy\OneDrive\Desktop\RecoveryProgram\workout-program\Phase-1-Program.xlsx`,
    sheet `Program`, with `read-excel-file/node`, then pass it through
    `xlsxRowsToTsv`. The result has 1 header line + 216 data lines.
  - Passing that TSV to `buildImportPreview` from
    `server/src/blocks/importPreview.js` (with `options.unit` "lb" and a resolver
    stub returning unresolved) gives stats of 6 weeks, 30 days, 216 exercises,
    602 sets and 84 timed sets.
  - Paste both outputs verbatim. Open the file read-only; never modify or copy
    it into the repo.
- DELIVERY.md shows the sheet-default rule's code and the three error strings
  with file:line.

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
