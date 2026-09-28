# TASK BK4: block-surface UI primitives in the recovery-site visual language (tokens-only)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth wants the block builder, import and current-block screens to look and
feel like his recovery "Pain-Free Logbook" site - condensed uppercase
display type, a week strip with progress bars, a day picker with progress
rings, chips, steppers, segmented controls, a dense 44px set grid - while
keeping LogChamp's 5 palettes x 2 modes. This unit builds the shared
primitives ONLY; BK5 (builder), BK6 (import), BK8 (run view) and BK9
(logger) consume them. Design of record: `docs/specs/blocks-v2.md` section
10 - it is fully specified on purpose (judgment-heavy visual work: the
detail IS the spec). The original stylesheet is preserved at
`docs/design/recovery-logbook-reference.css` - read it for feel and exact
proportions; NEVER copy a hex value from it and never import it.

Existing ground truth (recon, Sept 28): `client/index.html` loads Chakra
Petch from Google Fonts (lines ~13-18); `client/src/index.css` holds every
token (`:root` ~1-88, dark ~90-139, palettes ~141-277: `--color-bg`,
`--color-surface-1/2`, `--color-text`, `--color-text-secondary`,
`--color-muted`, `--color-border`, `--color-interactive`,
`--color-btn-primary-fg`, `--color-success-accent/bg`,
`--color-warn-accent`, `--color-error-text/bg`, `--shadow-card`,
`--font-display`, `--font-sans`, `--motion-*`, `--ease-standard`). There is
no stepper primitive and segmented controls exist four different ways.

FILES TO TOUCH:
- `client/index.html`                 (add Barlow Condensed 500;600;700 to
                                       the existing Google Fonts link)
- `client/src/index.css`              (ONE addition: the `--font-block`
                                       token in `:root`, spec 10.1)
- `client/src/styles/blocks/bk-ui.css` (NEW - the `.bk` alias scope + every
                                       primitive's styles)
- `client/src/components/blocks/ui/*` (NEW - the components + `rxFormat.js`)
Do NOT modify anything outside these files.

CHANGE:
1. Fonts + token per spec 10.1. Chakra Petch stays as it is for the rest of
   the app.
2. `bk-ui.css`: the `.bk` root class defines every alias in spec 10.1's
   table (exact token mappings, including the `color-mix` expressions) and
   sets `font-variant-numeric: tabular-nums` on numeric UI. Then the styles
   for every primitive in spec 10.2's table, at the spec's dimensions, using
   ONLY the `--bk-*` aliases (plus `--motion-*` / `--ease-standard`). Class
   prefix `bk-` (BEM-style modifiers like the rest of the app, e.g.
   `bk-week--selected`). Inverted (`--bk-ink` bg, `--bk-bg` text) marks
   SELECTED state only; primary actions keep the app's `.btn` classes.
   `prefers-reduced-motion` removes every transition.
3. React components in `client/src/components/blocks/ui/`, each importing
   `bk-ui.css` (a side-effect import is fine; Vite dedupes), named exports,
   one component per file plus an `index.js` barrel:
   - `Eyebrow`, `DisplayTitle` (`sub` renders the accent inline sub-label),
     `SectionRule` (`label`, optional `chip` node), `Chip` (`tone`:
     `neutral | accent | good | warn | bad`), `Card`.
   - `WeekStrip` - props `weeks: [{ key, short, progress (0-1),
     current (bool), ariaLabel }]`, `selectedKey`, `onSelect(key)`,
     optional `trailing` node (e.g. an add-week button). Horizontally
     scrollable; scrolls the selected tile into view on change; each tile a
     `button` with `aria-pressed` and the `ariaLabel`.
   - `DayPicker` - props `days: [{ key, top, name, progress, tag }]`,
     `selectedKey`, `onSelect(key)`, optional `trailing` node (an add-day
     tile); tiles are buttons with `aria-pressed`; the ring is
     `ProgressRing` and is NOT rendered when `progress` is null/undefined
     (the builder has no progress); `tag` is an optional short string
     rendered as the spec's bottom-edge tag (the run view passes `"NEXT"`;
     the recovery site's `TODAY` styling).
   - `ProgressBar` (`value`, `label` for `aria-label`), `ProgressRing`
     (`value`, decorative, 14px SVG, spec colors).
   - `Stepper` - `value`, `onChange`, `min`, `max`, `step`, optional
     `format(value) -> string`, `label`; minus/plus disable at the bounds;
     the value is an `<output>`; holding a button is NOT required.
   - `Segmented` - `options: [{ value, label }]`, `value`, `onChange`,
     `label`; rendered as a `role="radiogroup"` of buttons with
     `aria-checked`; arrow keys move the selection.
   - `NumField` - a numeric `<input inputMode="decimal">` in the set-grid
     style; `placeholder` shows the planned target; forwards ref and all
     input props.
   - `Disclosure` - `<details>`/`<summary>` with the `+` / `–` glyph.
   - `StickyHeader` - `eyebrow`, `title`, `sub`, `right` (status slot),
     `children` (rendered under the title row - the week strip goes here).
   - `rxFormat.js` - pure helpers: `formatRest(sec)` (`90 -> "1:30"`,
     `45 -> "45s"`, `120 -> "2:00"`, `null -> null`), `formatDuration(sec)`
     (`45 -> "45s"`, `300 -> "5 min"`, `90 -> "1:30"`), and
     `formatRx({ sets, reps, repsMax, durationSec, weight, unit, effort,
     effortValue, effortCap, restSec })` -> an array of
     `{ key, label, value }` parts in the spec 10.2 rx order, e.g.
     `{ sets: 3, reps: 8, repsMax: 10, weight: 185, unit: "lb", effort:
     "rpe", effortValue: 7, effortCap: true, restSec: 120 }` -> values
     `"3 × 8-10"`, `"185 lb"`, `"RPE ≤ 7"`, `"2:00"`; a timed set ->
     `"3 × 45s"`; a RIR cap -> `"RIR ≥ 2"`; missing pieces are omitted, never
     rendered as "undefined" or "null".
   - `ExerciseRx` - renders `formatRx` parts as the spec's rx line (label in
     body type, value in display type).
4. No page imports these yet - BK5 onward do. Keep them dependency-free
   (React only) and free of data fetching.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors (paste the tail).
- `node scripts/check-hex.mjs` from the repo root reports no raw colors in
  the diff (paste its output).
- `npx eslint src/components/blocks` from `client/` reports 0 errors.
- `grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(" client/src/styles/blocks/bk-ui.css`
  prints nothing.
- Every alias in spec 10.1's table appears in `bk-ui.css` under `.bk` with
  the spec's mapping (list them in DELIVERY.md with line numbers).
- `index.css` diff is exactly the one `--font-block` line (plus nothing
  else); `index.html` diff only extends the existing fonts link.
- `rxFormat.js` examples above hold: include a tiny runnable check in
  DELIVERY.md (e.g. a `node --input-type=module -e` snippet importing the
  file and printing the example outputs) with its verbatim output.
- Every interactive primitive is a real `button` / `input` / `details`
  (no clickable `div`), with the ARIA listed above; min touch height 44px
  for WeekStrip tiles, Stepper, Segmented and NumField (cite the CSS lines).

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
