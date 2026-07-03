# Spec: Analytics Engine + AI Coach (experimental)

**Status:** architecture, pre-implementation. Structural decisions baked here (Opus
session, 2026-07-01) so execution is Sonnet/Cursor task-block work.
**Owns:** the "insight layer" wedge. See `WORKOUTDB_MASTER_PROMPT_17.md` -> Analytics
engine, and the `analytics-engine-direction` memory for product-direction rationale.

---

## 1. Purpose

Turn a pile of logged sets into honest answers to three questions serious
intermediate lifters ask and current apps answer badly:

1. Am I doing the right amount, for the right muscles? (volume + balance)
2. Is it actually working? (progression, measured honestly - they rarely PR)
3. Am I executing my plan, or drifting? (adherence / autoregulation)

## 2. Principles (load-bearing)

- **Compute on read, not write.** No denormalized aggregate tables. Add a cache
  later only if a real perf problem appears.
- **Backend-only computation**, surfaced on a dedicated analytics screen (the
  reserved top-level tab), not live during logging.
- **The deterministic engine computes EVERY number. The AI never computes a stat**
  - it only interprets numbers the engine already produced. (Honesty +
  reproducibility. See section 8.)
- **Differentiators flow only from data competitors lack:** fractional muscle
  attribution, per-set RIR/RPE, and the first-class plan snapshot. Anything not
  built on one of those is table stakes.
- **Honesty:** every derived number is surfaced as an estimate with a "how is this
  calculated?" affordance. No single blended composite score in v1; if a composite
  is ever added, its inputs are shown.
- **Graceful degradation:** an always-on tier (needs only reps+weight+attribution)
  and an RIR-unlocked tier. RIR is near-mandatory (onboarding nudge) but nullable,
  so the RIR-dependent metrics degrade to a "turn on RIR to unlock" state.

## 3. Data inputs (all already in schema unless noted)

- `WorkoutSession` - performedAt, startedAt, completedAt (session duration), userId
- `WorkoutSet` - reps (Float), weight (Float, kg), rpe (Float?), rir (Int?), order
- `SessionExercise` / `TemplateExercise` / `BlockWorkoutExercise` - exerciseName,
  and (after FK linkage, Track A) `exerciseId` -> catalog
- `Exercise` catalog - primaryMuscles, secondaryMuscles, `muscleWeights` (Json?),
  category, mechanic  (Track A merges this to main)
- Plan side - `TemplateSet`, `BlockWorkoutSet`: planned reps/weight/rir

## 4. Pipeline (pure, composable, unit-testable functions)

Each stage is a pure function; the whole engine is testable against fixtures with
no DB. This testability is itself a selling point of the design.

- **Stage 1 - Resolution.** WorkoutSet -> catalog entry (via `exerciseId` FK;
  fallback: normalized `exerciseName` match). Output: set enriched with catalog
  metadata (attribution source, category, mechanic).
- **Stage 2 - Attribution.** Resolved set -> `{muscle: fraction}` using
  `muscleWeights` if present, else `{primary:1.0, secondary:0.5}` normalized to
  sum 1.0. This is L0, the base everything reads from.
- **Stage 3 - Set-level metrics.** Per set: e1RM (Epley + Brzycki, keep both),
  tonnage (weight x reps), **stimulus factor** from RIR (section 5), and
  **stimulating-set contribution** = attribution x stimulus factor.
- **Stage 4 - Aggregation.** Group by (muscle, week), (exercise, time), (session):
  weekly stimulating sets/muscle w/ volume landmarks, e1RM trend, tracked-vs-
  estimated PRs, tonnage, balance ratios (push:pull, quad:ham, front:rear delt),
  frequency & staleness per muscle.
- **Stage 5 - Plan-vs-actual (execution fidelity).** Join actual WorkoutSet to its
  plan source (`templateExerciseId`/`sessionExerciseId` -> TemplateSet/
  BlockWorkoutSet). Compute load adherence, volume adherence, and **effort drift**
  = actual RIR - planned RIR (positive = sandbagging, negative = overreaching).
- **Stage 6 - Summary emission.** Produce ONE serializable summary object
  (section 6). This is both what the UI renders AND what the AI layer consumes.
  The engine never renders directly.

## 5. Stimulus curve (RIR -> stimulus multiplier)

The headline metric **Stimulating Sets** weights each set by BOTH attribution and
proximity to failure. The RIR->multiplier mapping is a tunable model parameter,
NOT ground truth. Treat it exactly like `muscle-weights.json`:

- Lives in a named config (`server/src/analytics/stimulusCurve.js`).
- Gets a rationale doc (`server/data/stimulus-curve-rationale.md`) updated in the
  same commit as any value change. Numbers without rationale are numbers we can't
  defend.
- Surfaced in-UI via "how is this calculated?".

Proposed STARTING shape (tune later, not gospel): RIR 0-1 -> 1.0, RIR 2 -> ~0.95,
RIR 3 -> ~0.85, RIR 4 -> ~0.6, RIR 5+ -> taper toward ~0.3. Sets with null RIR fall
back to the always-on tier (counted as raw effective sets, flagged as un-weighted).

## 6. Output: the summary object

A single JSON document per (user, time range), the engine's public contract:

```
{
  range: { from, to, weeks },
  perMuscle: [ { muscle, stimulatingSets, effectiveSets, landmarkBand,
                 frequency, daysSinceLast } ],
  perExercise: [ { exerciseId, name, e1rmTrend, bestSet, matchedEffortTrend } ],
  prs: [ { exerciseId, type: 'tracked'|'estimated', ... } ],
  balance: { pushPull, quadHam, frontRearDelt },
  execution: [ { exerciseId, loadAdherence, volumeAdherence, effortDrift } ],
  meta: { effortCoverage, honestyNotes }
}
```

Keeping this decoupled from rendering is the one thing we do NOW that makes the AI
layer (section 8) cheap later - zero extra work today, no corner painted.

## 7. Deterministic API surface

- `GET /api/analytics/summary?from=&to=` -> the summary object (compute-on-read).
- Auth: existing cookie session.
- Route file: `server/src/routes/analyticsRoutes.js` (matches `*Routes.js`
  convention). Engine code: `server/src/analytics/` (resolve, attribution,
  setMetrics, aggregate, planVsActual, summary, stimulusCurve).

## 8. AI coach layer (EXPERIMENTAL - Seth-only first, v2+, off the critical path)

Goal: prove the "personalized AI help" idea works before charging anyone, using
Seth's own key. Deliberately NOT blocking the deterministic base.

**Hard boundary:** the AI receives the computed summary object + a user question
and returns narrative/answers. It never computes a stat. Prompts feed the summary
(section 6), not a raw set dump - better answers, fewer tokens, less data exposure,
and it forces the model to cite our honest numbers.

**Important factual correction on "hook up your Pro account":** a Claude Pro (chat)
subscription is NOT programmatic API access. To have the app call Claude, you need
an **Anthropic API key** from console.anthropic.com (separate, pay-per-token
billing) - or the OpenAI equivalent. The vision works; the mechanism is an API key,
not the Pro login. (Note: the CLAUDE.md "never set ANTHROPIC_API_KEY" rule is about
THIS Claude Code environment's subscription auth - it does not forbid the app from
using its own API key, which is a separate, deliberate app-billing choice.)

**Experiment architecture (cheapest real thing):** server-side proxy using Seth's
own API key in **staging** env (never committed), behind a Seth-only feature flag.
`POST /api/coach/ask { question }` -> server builds prompt from the computed summary
+ question -> calls Claude (default **Sonnet** for cost) -> returns answer.
Route: `server/src/routes/coachRoutes.js`, module `server/src/coach/`.

Chosen server-side (not browser-direct) because it mirrors the eventual product:
the per-user BYO-key version later just swaps the env key for a per-user stored key,
and the hosted/paid bot swaps it for our key + billing. Same shape throughout.

**Deferred to productization (escalate to Opus when we get there):** per-user key
storage (encrypted at rest, never plaintext), explicit opt-in data-sharing consent
(workout data leaving the app is a privacy event), rate limiting, abuse handling.

## 9. Unified phased roadmap

**Track A - deterministic foundation (data plumbing):**
- A1. Catalog merge to main + prod migration (RED - Opus + manual gate).
- A2. Curation clean + validator. DONE (2026-07-01).
- A3. Lifting-subset flag (`trackable` from category) + resolve the 29 secondary-
      less compounds surfaced by the validator (green/content).
- A4. FK linkage - nullable `exerciseId` on the 3 log models, Path B Stage 2
      (YELLOW schema - Opus for the migration design).
- A5. Exercise picker writes catalog IDs, Stage 4 (yellow UI).
- A6. Backfill legacy `exerciseName` -> catalog, Stage 3 (yellow data; the
      `exercise-alias-search` branch is prior art).

**Track B - analytics engine (compute; B1-B2 can start NOW on fixtures, no DB):**
- B1. Engine scaffold + attribution resolver (Stages 1-2), pure functions + tests.
- B2. Set-level metrics: e1RM + stimulus curve + stimulating-set contribution
      (Stage 3) + `stimulus-curve-rationale.md`.
- B3. Aggregation (Stage 4) + summary object (Stage 6).
- B4. `GET /api/analytics/summary` endpoint (compute-on-read).
- B5. Analytics screen UI (reserved tab) - renders summary, honesty affordances.
- B6. Matched-effort progression (L2).
- B7. Execution fidelity Mechanism A - plan-vs-actual join (L2).

**Track C - AI coach experiment (optional, parallel, Seth-only):**
- C1. Confirm engine emits a clean serializable summary (falls out of B3/B6).
- C2. Coach proxy `POST /api/coach/ask` behind Seth-only flag, staging API key.
- C3. Coach UI (chat panel on analytics screen), flag-gated.

**Deferred (need months of user history):** personalized volume landmarks
(adaptive MEV/MAV/MRV), fatigue/deload signalling (observation, never prescription),
execution-fidelity Mechanism B (inferred expectation via matched-effort regression
for non-block users).

## 10. Model / escalation

Structure is decided here, so most of the above is Sonnet + Cursor task blocks.
**Escalate back to Opus for:** A1 (prod migration), A4 (FK schema design), and the
Track C productization security work (section 8 deferred items). Everything else -
pure-function engine code, aggregation, endpoint, UI wiring, task-block emission and
diff review - is Sonnet's lane.
```
