# TASK E1: default effort capture (RIR) ON for new templates and quick logs

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
First unit of the E-wave (effort logging). LogChamp's analytics wedge is
RIR-central - stimulating sets, matched-effort progression, and effort drift all
run on the pooled effort signal derived in `server/src/analytics/effort.js`. The
entire capture and honesty stack is ALREADY BUILT (schema fields on
`WorkoutSet`, `deriveEffortRir()`, `meta.effortCoverage` in
`server/src/analytics/summary.js`, the coverage meter and adaptive volume
headline on the client). The one thing missing is that capture defaults OFF, so
most logged sets carry no effort signal and the effort-based analytics sit
locked. This unit flips the DEFAULT only. Direction: `docs/specs/ai-layer.md`
section 7 (the E-wave precedes the AI layer so the coach reasons over real
effort data).

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx   (quick-log pref default for RIR)
- client/src/pages/CreateTemplatePage.jsx  (new template + new block template
                                            initial toggle state)
Do NOT modify anything outside these files.

CHANGE:

Make **RIR** default ON where effort capture is initialized, leaving **RPE**
default OFF. RIR and RPE are alternate units for one signal (`effort.js`:
`RIR = 10 - RPE`, and explicit RIR always wins), so defaulting both on would
show two columns for the same thing. RIR is the canonical unit - default that.

1. **Quick log** - `SessionDetailPage.jsx:2205` currently reads
   `setLiveUseRIR(typeof p.useRIR === "boolean" ? p.useRIR : false)`. Change the
   absent-value fallback to `true`, following the idiom ALREADY used two lines
   above for `useExerciseNotes` (`SessionDetailPage.jsx:2202-2204`), which
   defaults to `true` in exactly this way. Leave the `useRPE` line
   (`:2206`) at `false`.
   **A stored boolean must always win** - a user who explicitly turned RIR off
   keeps it off. Only the absent case changes.

2. **New workout template** - `CreateTemplatePage.jsx:46-47`: initialize
   `useRIR` to `true`, leave `useRPE` `false`.

3. **New block template** - the block-side counterparts of the same pair
   (`blockUseRIR` / `blockUseRPE`, used at `CreateTemplatePage.jsx:493-494`):
   same treatment, `blockUseRIR` true, `blockUseRPE` false.

Explicitly OUT of scope, do not do these:
- **Do NOT touch `server/prisma/schema.prisma`.** The Prisma column defaults
  (`useRIR Boolean @default(false)`) stay as they are. Changing a column default
  is a migration, and migrations are a separate manual track that this block is
  not allowed to enter.
- **Do NOT backfill or mutate any existing template.** Templates already saved
  keep their stored `useRIR`/`useRPE` values. Editing existing templates is E2's
  job and is a nudge, never a silent write.
- Do not add a settings screen, and do not touch `client/src/lib/
  quickWorkoutLogPrefs.js` - the load/save helpers are correct as written; only
  the consumer's fallback changes.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (no server code changes expected -
  this proves nothing regressed).
- `npm run build` from `client/` compiles with no errors.
- `git diff --stat` shows exactly two files changed, both listed above, and
  `server/prisma/schema.prisma` is NOT among them.
- Quick log, no stored prefs (localStorage key
  `workoutdb_quick_log_display_prefs_v1` absent): the RIR toggle renders ON and
  the RPE toggle renders OFF, and a set row exposes a RIR input.
- Quick log, stored `{"useRIR": false}`: the RIR toggle renders OFF. Stored
  value wins over the new default.
- Quick log, stored `{"useRIR": true}`: renders ON (unchanged behavior).
- New workout template form: the RIR toggle is ON and RPE OFF on first render,
  before any interaction.
- New block template form: same - block RIR ON, block RPE OFF on first render.
- An EXISTING saved template with `useRIR: false` opened for editing still
  renders its RIR toggle OFF (proves no default leaked into stored templates).

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
