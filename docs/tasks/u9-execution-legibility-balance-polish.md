# TASK U9: execution legibility rework + balance card polish

STATUS: QUEUED
MODEL: fable
MODE: 1-relay (AnalyticsPage + index.css overlap with U7/U8 - never parallel)

CONTEXT:
Seth's July 3 critique: users will struggle to understand the Execution
card (three derived percentages with jargon), and Balance should look
better. Root cause for Execution: we show Load 95% / Volume 67% / drift +1
without ever showing what they came from. B9 (landed `c7acb43`) added the
missing data: every execution row now carries `planned` and `actual`
objects (`{ setsPerSession, reps, weight, effortRir }`, each field
independently null). Client-only unit; Seth critiques visuals after it
ships.

FILES TO TOUCH:
- client/src/pages/AnalyticsPage.jsx                  (ExecutionSection + BalanceSection rework)
- client/src/lib/executionVerdict.js                  (new - pure verdict/comparison formatters)
- client/src/components/analytics/BalanceScale.jsx    (zone band + ghost track)
- client/src/index.css                                (new classes, tokens only)
Do NOT modify anything outside these files.

CHANGE:

### 1. Execution rows lead with the concrete comparison
Rework the chart view of `ExecutionSection` (Table view stays as-is,
plus two added columns: Planned, Did - formatted via the same helpers).
Each exercise row becomes, top to bottom:

1. **Name + verdict sentence.** A deterministic plain-language verdict
   from `client/src/lib/executionVerdict.js`:
   `buildExecutionVerdict({ loadAdherence, volumeAdherence, effortDrift })`
   composes up to two clauses from these bands (null inputs contribute no
   clause; all three null -> "not enough paired data"):
   - load < 0.97 "lifted lighter than planned" / > 1.03 "lifted heavier
     than planned" / else "on-plan loads"
   - volume < 1 "did fewer sets than planned" / > 1 "did extra sets"
     / === 1 "hit every planned set"
   - effortDrift >= 1 "stopped about N reps short of planned effort"
     (N = rounded drift) / <= -1 "pushed about N reps past planned effort"
     / else nothing (on-target effort is not worth a clause when the other
     two carry news; if load AND volume are both on-plan, the verdict is
     "executed right on plan").
   Priority when trimming to two clauses: volume, load, effort.
   Sentence case, joined with "and"/"—" naturally; keep it human, no
   percentages inside the sentence.
2. **The concrete line** (the star of the rework), via
   `formatPlanActual(planned, actual, unit)`:
   `Planned 3×8 @ 100 lbs @ 2 RIR → Did 2×8 @ 95 lbs @ 3 RIR`
   - `setsPerSession` printed rounded to at most 1 decimal (print "3"
     not "3.0"); reps likewise; weight via the existing
     `formatWeight`/`loadWeightUnit` pattern; "@ N RIR" only when
     `effortRir` non-null; omit any null piece and its separator
     gracefully (e.g. bodyweight plans show "Planned 3×10 → Did 3×10").
   - This line is visually primary: normal text color, the verdict and
     meters around it are the quieter layers.
3. **Demoted metrics row.** The existing Load/Volume meters + printed %
   stay but drop to a compact secondary row (smaller, muted labels).
   Effort drift keeps its value but the primary wording becomes the plain
   form ("stopped ~1 rep early"); "sandbagging"/"overreaching" survive
   only as muted small flavor tags next to it, never the lead word.
   All existing null/unlock states keep their current copy.

Update `HOW_EXECUTION` copy to describe the new presentation (planned vs
did line, what the two percentages and drift mean, template-only + block
plans honest-gap sentence stays).

### 2. Balance card polish
`BalanceScale` (log2 marker + deviation fill already exist - keep them):
- **Balanced-zone band:** a subtle shaded band on the track spanning
  ratios 0.8..1.25 (log2 = ±0.32 -> left 34%, width 32% of the track),
  rendered under the fill. Marker and printed value get an
  `is-outside-zone` class when the ratio leaves the band - style the
  value with the existing warn-ish emphasis derived from tokens (use
  `color-mix` off an existing token; NO new hardcoded color, and never
  color alone: outside-zone also renders a muted small caption under the
  value, "outside the balanced zone").
- **Ghost tracks for degraded rows:** `unavailable` / `value === null`
  rows keep their message but render the empty track + center hairline at
  reduced opacity behind it, so the card keeps its visual rhythm instead
  of collapsing to bare text lines.
- **Card head:** BalanceSection gains the standard sub-line + a
  HowCalculated button (new copy constant `HOW_BALANCE`, same 1-2
  sentence voice): which muscles count as push vs pull and quad vs ham
  (they mirror the engine's PUSH_MUSCLES/PULL_MUSCLES/QUAD_MUSCLES/
  HAM_MUSCLES groups over effective sets), and that the shaded zone is a
  rough guide, not a prescription.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- No new dependencies; no hex colors in new CSS (tokens/color-mix only).
- `buildExecutionVerdict({ loadAdherence: 0.95, volumeAdherence: 0.67,
  effortDrift: 1 })` mentions fewer sets AND lighter loads (volume + load
  win the two-clause cap; effort dropped).
- `buildExecutionVerdict({ loadAdherence: 1, volumeAdherence: 1,
  effortDrift: 0 })` -> the on-plan sentence; all-null -> the
  not-enough-paired-data sentence.
- `formatPlanActual({ setsPerSession: 3, reps: 8, weight: 100, effortRir:
  2 }, { setsPerSession: 2, reps: 8, weight: 95, effortRir: 3 }, "lbs")`
  -> "Planned 3×8 @ 100 lbs @ 2 RIR → Did 2×8 @ 95 lbs @ 3 RIR"; with
  both weights null the "@ ... lbs" pieces vanish cleanly.
- BalanceScale with value 4.0 marks the value as outside-zone (with the
  caption); value 1.1 does not; null/unavailable rows render the ghost
  track element.
- Execution unlock/empty states render the exact same copy as before.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
