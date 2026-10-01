# TASK bksf1b: Block builder + exercise search - critic round 1 fixes (roominess, search, keypad, unsaved edits)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The separate feel critic scored the bks work 5/10 in round 1
(`docs/tasks/bks-critic-round-1-FINDINGS.md`; finding IDs refer to it). Seth's own
words on the builder: it "feels a little squished", and he asked whether
searched exercises are hard to scroll through. Both were confirmed with
measurements:
- The picker shows 12 A-Z hits at most and misses exercises that are in the
  block itself.
- The builder chrome takes 33% of the phone screen.
This block fixes the builder and the exercise search. The design language is
`docs/specs/blocks-v2.md` section 10 and the `--bk-*` aliases.

FILES TO TOUCH:
- client/src/components/blocks/builder/* (BlockBuilder, ExerciseCard,
  ExercisePicker, BuilderSheet, etc.)
- client/src/pages/EditBlockTemplatePage.jsx and the create-block page/route
  component, if the builder's page shell lives there
- client/src/styles/blocks/bk-builder.css
- client/src/api/exerciseApi.js (only if the search call needs new params)
- server/src/analytics/searchCatalog.js, server/src/controllers/exerciseController.js
  (the search route's limit and response shape only)
- server/test/analytics/searchCatalog.test.js
Do NOT modify anything outside these files. NOT `index.css`, NOT `bk-ui.css`,
NOT `bk-import.css`, NOT `components/Layout.jsx`. Hide global bars with an
`<html>` class plus CSS in `bk-builder.css`, the pattern `html.bk-log-kbd` uses in
`bk-log.css`. Also NOT the logger, import, library or Home files (parallel units).

CHANGE:
1. **Search ranking and reach (P1-1):**
   - `searchCatalog` ranks by relevance instead of A-Z: exact name, then
     whole-word match, then name prefix, then word prefix, then substring,
     then alias hits. Ties go to the user's own exercises and usage, then A-Z.
     Multi-word queries match all words in any order.
   - The route's max limit rises to 50, and the response says whether more
     matches exist (`hasMore` / `total`).
   - The builder picker requests 40 and, when more exist, ends the list with
     "N more - keep typing to narrow".
   - The other callers (`AddExerciseToLibrarySheet`, the session page's quick
     search) keep their requested limits and must not break. Additive response
     fields only.
2. **Picker scroll (P2-6):**
   - The search field stays pinned at the top of the picker sheet while results
     scroll.
   - The results list contains its own scroll (`overscroll-behavior: contain`)
     and is at least 60% of the sheet height at 390x844.
   - The search field auto-focuses when the picker opens.
   - Every result row is at least 44px.
3. **Keypad (P1-2, builder part):**
   - While any builder input has focus, the global bottom nav and the
     In-progress bar are hidden.
   - The builder's sticky header collapses to its compact single row.
   - The focused field scrolls clear (scroll-padding).
4. **Roominess (P2-1):**
   - At 390x844 the builder's sticky header is ONE row, 56px or less (name +
     save state + overflow).
   - The In-progress bar is hidden on builder routes.
   - The block-name field is full width and at least 16px.
   - Per-exercise secondary actions (move, duplicate, remove, rest/cap
     settings...) go behind a "..." menu on the card. The visible card keeps
     name, set rows and add-set.
   - Rep-range rows use at most 4 visible controls per line. Wrap or tuck the
     rest.
   - Target: fixed + sticky chrome is 120px or less at 390x844, and a 4-set
     expanded exercise card is 520px or less. Measure both in DELIVERY.md
     against the round-1 numbers (278px, 710px).
5. **Unsaved edits (P1-5):**
   - Builder changes never vanish silently. If the app's router supports
     blocking (a data router), use a blocker with an inline confirm while the
     draft is dirty.
   - If it doesn't (check `App.jsx` / `main.jsx`; `<BrowserRouter>` cannot
     block), keep a local draft per block id in `localStorage` (try/catch, as
     elsewhere). On return to the builder, offer "Restore unsaved changes" /
     "Discard".
   - Either way, `beforeunload` guards a hard reload while dirty.
6. **Desktop (P2-9, builder part):** at 1280x800 the builder's sticky header
   neither overlaps nor is overlapped by any other fixed bar.
7. **Small fixes:**
   - Every builder input is at least 16px (P2-2: name, coach-draft textarea,
     search).
   - Reps inputs use `inputmode="numeric"`; weight and effort use `decimal`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` from `server/` green, with new `searchCatalog` tests:
  - "press" ranks every catalog name containing the WORD "press" ahead of
    names where "press" is only a substring of a longer word, and returns
    "Leg Press", "Seated Dumbbell Press" and "Dumbbell Bench Press" within the
    first 40.
  - "curl" returns "Dumbbell Bicep Curl" and "Alternate Hammer Curl" within the
    first 40. "dumbbell curl" returns "Dumbbell Bicep Curl" first (the alias
    exists in `exercise-aliases.json`).
  - "seated row" returns "Seated Cable Rows" in the top 5 (all-words, any
    order).
  - limit 50 is honoured, and `hasMore` is true when more matches exist.
  - Use the real catalog in `server/data/exercises.json`, or a fixture copied
    from it, for the names.
- Client `npm run build` green. `node scripts/check-hex.mjs` clean.
- **Hook rule:** no hook is called after an early return in any component you
  touch. State it in DELIVERY.md; the last landing crashed exactly this way and
  the build cannot see it.
- DELIVERY.md:
  - maps CHANGE items 1-7 to file:line
  - gives the item-4 measurements (method: `getBoundingClientRect` reasoning
    from the CSS, or real numbers if you can run the client)
  - names which unsaved-edits route it took, and why

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
