# TASK bkr3: "Have AI fix this file" - one AI button on import, priced 1-4 uses by tokens

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (`docs/tasks/bk-smoke-FINDINGS.md`). Seth: "if there are
issues with the file, there should be an option... to have an AI look at the
file and see if it can solve the issue... for now have it take up to 4 of the
7 uses depending on how many tokens it uses". Seth ruled Oct 5 to MERGE it
with the existing AI actions. Today the import page has two AI buttons under
one label ("Let AI read this layout"): the Paste-tab button before Preview runs
`POST /coach/block-draft` mode "convert" (1 use), and the preview-step
`AiLayoutOffer` runs `POST /coach/import-map` (3 uses; the AI returns a column
recipe and the deterministic parser applies it). Seat smoke confirmed the
confusion. Builds on bkr2's ledger (`server/src/coach/usageLedger.js`:
`reserveUses` / `settleUses` / `refundUses`) and bkr1's `AiWait`
(`client/src/components/coach/AiWait.jsx`) - both landed; use them, don't
re-implement them.

FILES TO TOUCH:
- server/src/coach/importFix.js            (NEW, pure: route choice + cost tier)
- server/src/coach/weeklyCap.js            (IMPORT_FIX_MAX_COST = 4 + the tier
                                            thresholds as named constants)
- server/src/controllers/coachController.js (NEW `importFix` handler; reuse the
                                            importMap and draftBlock convert
                                            internals - extract shared helpers
                                            in this file if needed, keep both
                                            old endpoints working unchanged)
- server/src/routes/coachRoutes.js          (POST /coach/import-fix)
- server/test/lib/coachImportFix.test.js    (NEW)
- client/src/api/coachApi.js                (`coachImportFix`, signal-aware like
                                            the others)
- client/src/pages/ImportBlockPage.jsx
- client/src/components/blocks/import/ImportSourceStep.jsx
- client/src/components/blocks/import/ImportPreviewStep.jsx
- client/src/components/blocks/import/AiLayoutOffer.jsx (replace or delete; if
                                            deleted, update index.js)
- client/src/components/blocks/import/index.js
- client/src/styles/ai-wait.css             (busy-button rule below)
- client/src/components/blocks/builder/CoachDraftCard.jsx,
  client/src/pages/profile/AppearancePage.jsx (only `aria-busy` on their AI
                                            buttons)
Do NOT modify anything outside these files.

CHANGE:
1. **Server: `POST /coach/import-fix { text, unit?, problems? }`.**
   Same access, consent and provider resolution as `importMap`.
   - Route choice (pure, in importFix.js): if the text is a table (a header
     row plus tab/comma/semicolon-delimited rows - reuse the detection the
     standard reader already uses, don't invent a second one), run the
     import-map RECIPE path. Otherwise (prose, notes, a pasted program),
     run the CONVERT path. Response:
     `{ kind: "recipe", recipe }` or `{ kind: "block", block, stats }`,
     plus `cost` (uses charged) and `remaining`.
   - Pricing: when the cap applies, `reserveUses(..., IMPORT_FIX_MAX_COST)`
     BEFORE the model call (429 `weekly_limit` with `needed: 4` if fewer than
     4 remain). After success, `settleUses` at the tier for the provider's
     reported `usage.input_tokens + usage.output_tokens`:
     <= 4,000 -> 1; <= 8,000 -> 2; <= 14,000 -> 3; above -> 4. When the provider
     reports no usage (Cursor path), estimate with ceil(chars / 4) over the
     prompt plus the reply. Refund everything on any failure. Abort the
     provider call on client disconnect, like bkr2 did for draftBlock and
     importMap (`abortOnClientClose`).
   - `problems` (optional, max 20 short strings) is the preview's own error
     and skip list, passed into the prompt so the AI knows what to fix.
2. **Client: one button, shown only when there is a problem.**
   - Remove the Paste-tab pre-preview AI button and the preview-step
     `AiLayoutOffer`. Keep the "Any AI" tab exactly as is.
   - Show ONE "Have AI fix this file" button when the standard preview fails
     (errors / nothing readable) or reports anything skipped, ignored, or
     changed. A clean import ("Nothing skipped") shows no AI button.
   - Under the button, one line: "Uses 1-4 of your N coach uses left this
     week, depending on the file." With fewer than 4 left: the button is
     disabled and the line reads "Needs 4 coach uses - you have N left. More
     free up <weekday> at <time>." (reuse `formatNextQuestionTime`-style copy).
     Hidden when the coach is unavailable or AI consent is off.
   - Busy: bkr1's `AiWait` - inline crown + "Fixing your file..." on the
     button, status ladder under it, 120 s timeout + abort on unmount like
     bkr1's other call sites.
   - Result: `kind: "recipe"` applies the recipe through the existing bks1
     path (the AI-read notice, "AI read: ... (was ...)", "Use the original
     read" all stay). `kind: "block"` goes to the preview the way the old
     convert did. Either way the preview shows "AI fix used N coach uses."
3. **Busy is not disabled.** A busy AI button keeps full opacity: add
   `aria-busy="true"` while busy on every AiWait button (import, Draft with
   the coach, palette) and one rule in ai-wait.css:
   `[aria-busy="true"]:disabled` -> opacity 1, `cursor: progress`.
4. **Imported file name.** On the File tab, the block name defaults to the
   file name without its extension (e.g. `Phase-1-Program.xlsx` ->
   "Phase-1-Program"), not "Imported block". A name inside a LogChamp
   `.logchamp.json` export still wins.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Unit tests (`coachImportFix.test.js`, DI fakes like coachImportMap.test.js):
  - tier function: 3,999 -> 1; 4,001 -> 2; 8,000 -> 2; 13,999 -> 3; 20,000 -> 4;
  - remaining 3 -> 429 `weekly_limit`, `needed: 4`, model never called;
  - recipe success with usage 5,200 -> settle(ids, 2) and response `cost: 2`;
  - prose text -> convert path chosen (assert which fake was called);
  - provider failure -> refund all 4;
  - client disconnect -> provider signal aborted, refund all 4.
- Grep: no `AiLayoutOffer` import remains if the file was deleted; no
  client call to `coachImportMap(` or to `coachBlockDraft(` with mode
  "convert" remains in `client/src/components/blocks/import/` or
  `ImportBlockPage.jsx`.
- Grep: `aria-busy` is set on the import, CoachDraftCard and palette AI
  buttons; ai-wait.css has the `[aria-busy="true"]:disabled` rule.
- `POST /coach/import-map` and `POST /coach/block-draft` behave exactly as
  before (their existing tests pass unchanged).
- LANDING NOTE (reviewer): live staging - a messy sheet shows the button
  with the uses line, a clean export shows none, and the cost on the preview
  matches the `CoachUsage` rows kept.

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
