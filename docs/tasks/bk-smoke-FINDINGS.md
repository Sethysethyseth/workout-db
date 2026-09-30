# BK wave smoke - FINDINGS (Seth, staging Vercel, started Sept 30 2026)

Checklist: `docs/HANDOFF.md` -> "Wave smoke checklist - BK". Severity: P0 broken/data
loss, P1 blocks him, P2 friction, P3 polish. CR = change request (new scope, not a
defect against the BK contract).

## Results

1. Import - result pending (Seth went straight to change requests CR1-CR4 below).

## Change requests raised during the smoke (Sept 30)

- **CR1 - Import any format.** The importer only understands our column
  headers. Seth wants people's own spreadsheet layouts to import. His idea:
  an algorithm sifts the file, and if that is too inconsistent an AI does
  it. AI import should later be a paid benefit; for now it costs 3 of the
  7 weekly coach uses.
  Recon: `server/src/blocks/tableToBlock.js` maps headers through fixed
  alias sets (one row per exercise). The AI path already exists as
  "Let the coach convert it" (`POST /coach/block-draft` mode=convert). That
  path accepts up to 20k chars of input and returns at most 8000 output tokens,
  and it costs 1 use. A full 6-week sheet (~600 sets) regenerated as JSON does
  not fit in 8k tokens, so it would truncate.
- **CR2 - Block logging looks like the old logger.** A planned 4 sets still
  has to be added by hand. Seth prefers the look of the Claude artifact
  tracker (screenshot requested). Wanted:
  - one row per planned set, pre-made
  - every field greyed out as a ghost value, weight included; today only
    reps/RPE ghost, and weight falls back to "e.g. 185" when the plan has none
  - sets can still be added and removed; the artifact cannot do this
  Recon: `SessionDetailPage.jsx` ~1320 (plan placeholders),
  `AsPlannedControl.jsx`.
- **CR3 - Notes toggles on block workouts.** The top of a block workout shows
  the "Workout description / Exercise notes / Set notes" checkboxes
  (`SessionDetailPage.jsx` ~3305). It looks unappealing. Decide whether it
  belongs there, needs a better look, or becomes a setting the block author
  picks so the lifter never sees it.
- **CR4 - Library tab.** The UI/UX is stale and has barely changed since
  launch; it needs an upgrade. Remove "Create workout".

## Decisions (Seth, Sept 30)

- **All four CRs belong to THIS wave.** They are Seth's smoke notes, and he wants
  them usable when the wave reaches prod. Smoke sign-off resets; re-smoke once they land.
- CR1: **AI maps the layout, the parser fills the rows.** The AI sees the headers
  plus about 40 sample rows and returns a mapping recipe. The deterministic
  parser applies it to every row, then the usual preview runs. It costs 3 of
  the 7 weekly uses and is meant to become a paid benefit later.
- CR3: open. Seth wants the notes to move into the block builder somehow
  (the goal is the lifter's experience) and will discuss after the proposal.
- CR4: Keep "Create workout" visible but greyed out as parked, so it isn't
  forgotten ("nobody uses this").

## Test data

- Staging account **test123** / `password` (email `test123@example.com`), created
  Sept 30. Block "Upper/Lower Strength - 4wk" (id 126): 4 weeks x 4 days, RPE caps
  on the main lifts, a timed plank, week 4 labeled Deload. Active run 5; weeks 1-2
  logged (sessions 455-462, Sep 14-25). Week 3 is next.
