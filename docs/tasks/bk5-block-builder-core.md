# TASK BK5: the reworked block builder (core) - phone-first, recovery-site feel

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth wants "a nice looking reworked block builder, that is responsive and
feels nice", in the language of his recovery logbook site. Today's builder
(`BlockWeeksBuilder` + `WorkoutBuilder` + `ExerciseEditor` + `SetRow`,
mounted by `CreateTemplatePage.jsx` `?type=block` and
`EditBlockTemplatePage.jsx`) is a stack of form cards: no week labels, free
text exercise names from a static list, create/edit disagree on whether an
effort scale is required, and saving navigates away. Design of record:
`docs/specs/blocks-v2.md` sections 3.1 (field rules), 6 (fields), 10
(visual language - fully specified; follow it exactly). Needs BK1 (API
persists `label`, `restSec`, `effortCap`, `repsMax`, `durationSec`,
`isDraft`, `sourceUnit`; `POST /block-templates/:id/accept`) and BK4 (the
primitives in `client/src/components/blocks/ui/`, styles in
`client/src/styles/blocks/bk-ui.css`) - both LANDED; read them first.

This is a judgment-heavy visual unit: the layout and behavior below ARE the
contract. After the wave, a coach-persona critic scores the builder 0-10 on
a 390px phone (spec section 11) - build for that reader: a coach
programming a client between sessions.

FILES TO TOUCH:
- `client/src/components/blocks/builder/*`   (NEW - `BlockBuilder.jsx` and
                                              its parts)
- `client/src/components/blocks/builder/blockBuilderState.js` (NEW - pure
                                              state model: API tree <->
                                              state <-> payload, edit ops)
- `client/src/styles/blocks/bk-builder.css`  (NEW)
- `client/src/pages/CreateTemplatePage.jsx`  (block path mounts the new
                                              builder; the WORKOUT-template
                                              path is untouched)
- `client/src/pages/EditBlockTemplatePage.jsx` (mounts the new builder)
- `client/src/api/blockTemplateApi.js`       (`acceptBlockTemplate`)
- `client/src/components/templates/BlockWeeksBuilder.jsx`,
  `BlockTemplateTableView.jsx`               (DELETE only if nothing else
                                              imports them - prove with rg)
Do NOT modify anything outside these files. Do NOT touch `index.css`
(dead `block-*` rules there are a later cleanup).

CHANGE - the builder's observable contract (390px first; content column
max-width 720px centered on wider screens; root element has class `bk`):

1. **Header** (`StickyHeader`): eyebrow = the block name (tap -> the
   settings sheet); on a NEW block the eyebrow slot is an inline name input,
   placeholder "Name this block", and is the first focused control. Title =
   `WEEK <n>` with the week's label as the accent sub-label. Right slot:
   save state - "Unsaved" (warn dot) / "Saving" / "Saved" (good dot) - and
   a primary Save button. Under the title: `WeekStrip` (W1..Wn; `current`
   unused here) with a trailing "+" tile.
2. **Weeks.** "+" appends a COPY of the last week (days, exercises, sets)
   and selects it, with an undo toast ("Week 5 added as a copy of week 4 ·
   Undo"). Tapping the selected week tile again opens week actions: Label
   (text, max 40, e.g. Deload), Duplicate (inserted after), Move earlier /
   later, Clear, Delete (confirm when the week has exercises; the last
   remaining week cannot be deleted).
3. **Days.** `DayPicker` for the selected week (`top` = `DAY n`, `name` =
   the day name, no progress) with a trailing "+ Day" tile (adds `Day n`,
   empty, selected). Tapping the selected day opens day actions: Rename,
   Duplicate, Move left / right, Delete (confirm when non-empty).
4. **Day panel.** `SectionRule` with the day name and chips (`n exercises`,
   `m sets`). A list of exercise cards, then a full-width "+ Add exercise".
5. **Exercise card - collapsed:** slot badge (`A`, `B`, `C`... by order),
   the name in display type, an `ExerciseRx` line computed from the sets
   (uniform sets -> `3 × 8-10 @ 185 lb · RPE ≤ 7 · Rest 2:00`; non-uniform
   -> set count plus the reps and load spread, e.g. `4 sets · 5 → 8 · 225 →
   185 lb`), the first notes line, a chevron. Tap to expand; on screens
   under 720px expanding one card collapses the others. The card component
   takes a `readOnly` prop (no edit affordances, never expands into
   editors) - BK6's import preview renders it.
6. **Exercise card - expanded:** the set grid (spec 10.2): columns SET |
   REPS or SEC | LOAD | RPE or RIR (per the block's effort scale; absent for
   "none") | remove; a "to" column appears when Range is on (reps and
   repsMax). `NumField`s with the unit from `loadWeightUnit()`
   (`client/src/lib/weightUnitPref.js`). Controls under the grid: "+ Set"
   (copies the last set), "Fill all from set 1", `Segmented` Reps / Time,
   a Range toggle (reps mode only), a Rest `Stepper` (0-600 s, step 15,
   `formatRest`; 0 shows "No rest" and saves null), `Segmented` Target / Cap
   (hidden when effort is none), a notes textarea (placeholder "Setup,
   cues, tempo, lead side..."). Footer: move up / down, duplicate, replace
   exercise, delete (with an undo toast).
7. **Exercise picker** (a bottom sheet on phones, a dialog on wide
   screens): autofocused search over `searchExercises(q, { limit: 12 })`
   (`client/src/api/exerciseApi.js`) debounced ~150ms, plus a row "Use
   '<typed text>'" that adds a name-only exercise flagged with a "Not in
   library" chip. A new exercise starts as 3 sets x 8 reps, no load.
8. **Block settings sheet:** name, description, effort scale `Segmented`
   RPE / RIR / None - the SAME rule on create and edit (None is allowed on
   both; this removes today's asymmetry), public toggle (disabled with an
   explanation on drafts), and on edit a Delete block action (confirm).
9. **Save.** All edits are local and instant; nothing hits the network
   until Save. Client validation mirrors spec 3.1 (name required, every
   exercise named, numeric ranges, reps XOR time, `repsMax > reps`); an
   invalid Save scrolls to and marks the first problem instead of posting.
   Create -> `POST` then `navigate("/blocks/<id>/edit", { replace: true })`
   and show "Saved" (stay in the builder). Edit -> `PATCH`, stay. Unsaved
   changes are guarded on reload/close (`beforeunload`, the
   `SessionDetailPage.jsx` pattern) and on the builder's own exit actions
   with a confirm.
10. **Drafts** (`isDraft`): a banner under the header - a `FROM CLAUDE`
    accent chip, "Review this draft, then save it to your library.", Save to
    library (saves pending edits, then `acceptBlockTemplate`; the banner
    disappears; toast "Saved to your library") and Discard (confirm ->
    delete -> the library). When `sourceUnit` differs from
    `loadWeightUnit()`, the banner adds "Loads were written in <unit> -
    Convert to <device unit>" (converts every weight in the draft, rounded
    to the nearest 0.5, as a normal unsaved edit).
11. **Feel.** 44px minimum targets everywhere; selection changes animate
    150-200ms ease-out; no layout jump when a card expands; `Enter` in a
    set field moves to the next field (row-major); focus-visible rings;
    reduced motion honored. Tokens only (`--bk-*` aliases).

`blockBuilderState.js` is pure (no React, no fetch): hydrate from the API
tree, serialize to the `POST/PATCH` payload (every new field), and the edit
operations above (add/copy/move/delete week, day, exercise, set; fill all;
toggle timed; toggle range; convert units). BK5b adds copy-forward on top of
it - export the operations it will need to call.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` reports no raw colors in the diff.
- `npx eslint src/components/blocks src/pages/CreateTemplatePage.jsx src/pages/EditBlockTemplatePage.jsx`
  from `client/` reports 0 errors.
- The workout-template path of `CreateTemplatePage.jsx` is unchanged:
  `git diff` of that file touches only the block branch (show the hunks).
- `rg -n "BlockWeeksBuilder|BlockTemplateTableView" client/src` output is
  pasted; each is deleted only if that output is empty after the change.
- Round-trip proof for `blockBuilderState.js`: a `node --input-type=module`
  snippet in DELIVERY.md that hydrates a fixture API tree (2 weeks, a
  labeled week, a timed exercise, a ranged set, a capped exercise with
  rest) and serializes it back, printing a deep-equality check of the
  payload's planned fields against the tree - with its verbatim output.
- DELIVERY.md walks items 1-11 above one by one, naming the component and
  file that implements each; anything not implemented is listed as a
  deviation with the reason (do not silently skip).

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
