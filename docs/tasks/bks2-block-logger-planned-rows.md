# TASK bks2: Block-day logger - planned set rows, every field greyed, recovery-logbook look, notes without switches

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
From Seth's BK smoke (Sept 30, `docs/tasks/bk-smoke-FINDINGS.md` CR2 + CR3). When
someone logs a day of a block, the block already says what to do. Today they still
add each planned set by hand, only the first draft row shows ghost values, and the
top of the workout has a "Workout description / Exercise notes / Set notes"
checkbox bar that Seth calls unappealing.

He prefers the logging screen of his recovery logbook artifact, with more
flexibility. The artifact is described in
`docs/design/recovery-logbook-logger-reference.md` (read it first); its
stylesheet is `docs/design/recovery-logbook-reference.css`. This is a
judgment-heavy visual unit, so the look below IS the spec.

Scope is **block-day sessions only** (`isFromBlock` in `SessionDetailPage.jsx`).
Quick-log and saved-workout (template) sessions must render and behave exactly as
before. Earlier contracts that stay in force (`docs/specs/blocks-v2.md`, bk9):
- "As planned" never fills effort.
- Timed sets log seconds.
- RPE over the cap shows "over cap".
- Setup and Lead side stay visible mid-session without a tap.

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx (block-day branch only)
- client/src/components/blocks/log/* (new components welcome here, e.g. a
  planned-set grid / exercise card / session header / set-note row)
- client/src/styles/blocks/bk-log.css
Do NOT modify anything outside these files. In particular: NOT
`client/src/index.css`, NOT `styles/blocks/bk-ui.css` or `components/blocks/ui/*`
(import and reuse them freely - Card, Chip, the `--bk-*` aliases - but do not edit
them), NOT any `client/src/api/*` file, NOT `MyTemplatesPage.jsx`, NOT the import
page (two other units are editing those in parallel). No server changes.

CHANGE (block-day sessions):
1. **Session header card** (reference: `section.card.session`):
   - Eyebrow: `Week N · Day name`.
   - The day name large, in the display face.
   - Chips, including the week label when present (e.g. "Deload").
   - A 6px progress bar and `"<logged> / <total> sets logged"`, where total is
     planned rows plus added rows minus removed rows.
   - It replaces the notes checkbox bar. The bar must not render in block-day
     sessions.
2. **Exercise card** (reference: `article.card.ex`):
   - Top row: `logged/total` count, right-aligned, turning the good colour when
     complete.
   - The exercise name large, display face, uppercase.
   - The prescription line, each part only when planned:
     - `sets × reps`, or the range `8–10`, or `45s` for timed sets
     - `@ weight unit`
     - `RPE ≤ cap` or `RIR ≥ cap`
     - `Rest m:ss`
   - The author's short cue, always visible. This keeps the existing Setup /
     Lead side visibility; reuse `PlanLine` / `planHelpers.js` data by name
     rather than re-deriving it.
   - The set grid (step 3).
   - Longer author notes go in a collapsible "Coach note" at the bottom of the
     card.
3. **Planned set rows** (reference: `.grid`, `button.chk`, `input.f`, `button.nb`):
   - Every planned set of the exercise renders as its own row the moment the
     page opens. Nobody taps "Add set" to get the planned sets.
   - Grid: a set-number column, field columns, then a note column. The header
     labels match the block: Reps or Sec, Weight, and RPE or RIR per the block's
     effort scale (the RPE/RIR choice follows the existing effort toggle).
   - EVERY field shows the plan as a greyed ghost (placeholder in muted colour at
     reduced opacity). That includes weight:
     - reps, or seconds, from the plan
     - weight = the planned weight; when none is planned, the unit hint (`lb` / `kg`)
     - effort = `≤ cap` / `≥ cap`, or the target, or `—`
   - The ghost is only a placeholder: never a saved value.
   - Tapping the set-number button logs that set: typed values, with each empty
     field filled from the plan EXCEPT effort (never auto-filled). The row then
     turns "done": inverted, with a check mark.
   - Typing into a row and leaving the field also logs it, via the existing
     draft-to-set promotion path (`tryPromote` / `onPromoteDraft` by name).
   - Logged rows stay editable exactly as today. Set order stays correct:
     set `order` is session-wide unique, so use the existing ordering helpers,
     not new math.
4. **Add / remove sets**:
   - "+ Add set" under each grid appends a row ghosted from the last planned set.
   - Any row can be removed in at most 2 taps without putting a visible delete
     button on every row by default. One option is an "Edit sets" toggle per card
     that reveals removal; the design choice is yours.
   - Removing a logged row uses the existing delete path.
   - Removing a not-yet-logged planned row hides it and survives a reload on the
     same device: `localStorage` keyed by session id + session exercise id, every
     access in try/catch, and the page must still work if storage throws.
5. **Notes without switches** (this replaces the checkbox bar - CR3):
   - The pencil button at the end of each row opens an inline one-line note
     under that row, using the existing set `notes` field.
   - A saved note shows as short italic text. The pencil is accent-tinted when a
     note exists.
   - The lifter's own exercise note is a small "+ Note" link on the card, using
     the existing session-exercise notes field.
   - The workout note is one "How the session went" textarea at the BOTTOM of
     the page, using the existing session description/notes field.
   - None of these need a toggle. The effort-scale toggle stays wherever it
     reads best, but not in a checkbox bar.
6. **Phone keyboard**:
   - Numeric fields use `inputmode="decimal"`; reps and seconds use
     `inputmode="numeric"`.
   - While any input on a block-day session has focus, fixed bottom overlays
     (the app's bottom nav and the "In progress / Resume" bar) are hidden so the
     on-screen keypad does not stack them over the row being typed. Do this with
     a class toggled on `document.documentElement` from the session page, with
     the CSS in `bk-log.css`. They come back on blur.
   - The focused row scrolls into view if needed.
7. **Look**:
   - Follow the reference dimensions: a 40px set column, 44px row height, 6px
     gaps, a 34px note column, display-face numerals in the fields, 44px
     minimum targets.
   - Tokens only, through the existing `--bk-*` aliases. No hex, no new colour
     tokens.
   - Must read correctly in all 5 palettes x light/dark.
   - No horizontal scroll at 390px.
   - Motion 150-250ms ease-out, and respect `prefers-reduced-motion`.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` compiles with no errors. `npm run test:unit` from
  `server/` is still green (no server changes).
- `node scripts/check-hex.mjs` passes. No new hex values in any touched file.
- `grep` shows the three checkbox labels "Workout description", "Exercise
  notes" and "Set notes" rendered only on the NON-block branch of
  `SessionDetailPage.jsx`, and the template branch is unchanged. Show the
  before/after of that branch in DELIVERY.md.
- These criteria are verified by reading the code, stated with file:line in
  DELIVERY.md, against the staging account `test123` (block "Upper/Lower
  Strength - 4wk", week 3 Upper A). Its plan for Barbell Bench Press is
  4 sets x 6 @ 195 lb, RPE cap 8, rest 180s.
  - The card renders 4 rows before any interaction.
  - Each row's ghosts read `6`, `195`, `≤8`.
  - The Rx line reads `4 × 6 @ 195 lb · RPE ≤ 8 · Rest 3:00`, or equivalent parts.
  - Tapping set 1's number button sends a set create with reps 6 and weight 195,
    and with NO rpe/rir key.
  - "+ Add set" makes 5 rows.
  - Removing planned row 4 before logging it leaves 4 rows after a reload.
  - Plank (3 x 45s, no weight) rows ghost `45` and `lb`, and a tap logs
    durationSec 45.
- The per-set note round-trips through the existing set update call (show the
  call site).
- DELIVERY.md includes a short table: each numbered CHANGE item mapped to the
  file:line that implements it.

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
