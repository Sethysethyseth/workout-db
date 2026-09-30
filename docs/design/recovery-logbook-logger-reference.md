# Recovery logbook - how its logging screen works (design reference)

Preserved Sept 30, 2026 for task bks2. Source: Seth's own "Pain-Free Logbook"
artifact (`https://claude.ai/artifact/QXnAbofUDjAFfom3UBBZme`). Its stylesheet
is kept next to this file as `recovery-logbook-reference.css`; the classes
named below are defined there. This is a DESIGN REFERENCE: never import it,
never copy a hex from it. LogChamp maps this vocabulary onto palette tokens
through the `--bk-*` aliases in `client/src/styles/blocks/bk-ui.css`.

Seth's verdict (smoke, Sept 30): he prefers this look to LogChamp's block logger,
but wants more flexibility. The artifact cannot add or remove sets; LogChamp
must be able to. The artifact greys out the planned reps and RPE; LogChamp must
grey out EVERY field, weight included.

## Session header - `section.card.session`

- Eyebrow line: `.eyebrow`, the day id plus the date.
- The day title: `h2`, display face, 26px, uppercase.
- A row of chips (`.meta` + `.chip`, with tinted variants `.chip.amber/.red/.blue`).
- A 6px progress bar (`.progress > span`, filled with the accent colour).
- A footer (`.session-foot`) reading `"<done> / <total> sets logged"` in
  tabular numbers.

## Exercise card - `article.card.ex`

Top to bottom:

1. `.ex-top`: the tier chip and slot tag on the left. On the right,
   `.ex-count` reads `done/total`; it gets the `.full` class, coloured
   `--good`, once every set is logged.
2. `h3`: the exercise name, display face, 23px, uppercase.
3. `.rx`, the prescription line. Its big numbers are display face, 18px:
   - `"4 × 6"` (`" per side"` when unilateral)
   - `"@ 185 lb"`, plus a `"from W1"` carry tag when the load came from last week
   - `"RPE ≤ 8"` when there is a cap
   - `"Rest 2:30"`
4. `.cue`: one short coaching cue with a 2px left border, always visible.
5. The set grid, one per side. Details below.
6. `details.coach` "Coach note": collapsible, a dashed top border, `+` / `–`
   marker. Holds the longer author notes (job, progression, extra notes).

## Set grid - `.grid`

Columns: `40px repeat(4, minmax(0,1fr)) 34px`, 6px gap. The artifact's four
field columns are reps, load, RPE and pain; LogChamp has no pain field, so it
uses its own field set.

- Header row (`.grid-h`): 10px uppercase labels in `--muted`. It reads
  `Set | Reps (or Sec/Min) | Load | RPE | Pain | (blank)`.
- ONE ROW PER PRESCRIBED SET, rendered up front. The lifter never adds the
  planned sets by hand.
  - `button.chk`: 40x44, shows the set number. Tapping it logs the set as
    prescribed and starts the rest timer. When logged it becomes `.done`:
    inverted ink background and a check mark.
  - `input.f` fields: 44px tall, display face 19px, centered. Each field's
    placeholder is the plan value in `--muted` at about 55% opacity; this is
    the "greyed out" look. The placeholders are:
    - reps: the target
    - load: the suggested load
    - RPE: `≤cap`, or `—` when there is no cap
  - `input.f.rpe-over` (warn colour) when the logged RPE is above the cap.
  - `button.nb` note icon, 34x44, a pencil. Tapping it opens an inline
    one-line note under the row (`.felt`, spanning columns 2 to the end).
    A saved note shows as italic quoted text (`.felt-text`). The icon turns
    accent-coloured (`.has`) when a note exists.
- Numeric fields use `inputmode="decimal"`.

## Session note - `section.card.session-note`

One textarea at the very bottom: "How the session went". This is the only
workout-level note field; there are no toggles for it.

## What the artifact deliberately does NOT have

- No switches deciding which notes to show. Notes are always one tap away
  (the pencil on each set, the textarea at the end) and invisible until used.
- No "add set" or "remove set". LogChamp adds these (Seth, Sept 30).
