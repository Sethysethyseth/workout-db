# Strength Score + per-side L/R comparison - DESIGN (Fable pass, July 18 2026)

Status: DESIGN COMPLETE - ready for Opus to author blocks. This
discharges the "needs Fable design pass" flag on the R9 candidate and
the QUEUE per-side candidate; they are ONE design, built in phases.
Fable is unavailable after July 18 - do not wait on another Fable pass;
escalations go to Opus judgment against this spec.

## Decisions (do not re-litigate)

- Strength Score is SELF-REFERENCED, never population-normed. No
  "you lift more than 73% of users", no absolute composite total.
  Anti-goal: out-featuring on gamification; the wedge is honest insight.
- Per-side comparison and Strength Score ship as one design family;
  the imbalance headline consumes per-side data.
- Ruling carry-overs (July 16, ratified): pair = 2 sets everywhere in
  volume/set counts; plan-adherence uses PAIRS as the denominator in
  per-side mode (ruling 2 rides Phase 1).
- Annotate, never adjust: no statistical corrections anywhere.

## Phase 1 - per-side plumbing + comparison UI

Server:
- Analytics controllers pass `set.side` through into the enriched-set
  shape (engine aggregates stay side-blind: L+R = 2 sets stands).
- `exerciseDetail` gains a `perSide` block, present ONLY when the
  exercise has sided sets in history: per-side `topSet`, best e1RM,
  last-session per-side top set, per-side session count. Pure,
  fixture-tested, same module style as the existing detail fields.

Client (Exercises tab detail):
- Two-column L | R panel: top set, best e1RM, latest session numbers.
- Verdict line, deterministic thresholds on best e1RM over the trailing
  8 weeks: delta < 5% -> "Balanced"; 5-10% -> "Slightly stronger
  <side>"; > 10% -> "<side> leads by N%". Fewer than 3 paired sessions
  in the window -> verdict withheld with an honesty line ("Not enough
  paired sessions to compare sides yet").
- Plan-adherence pairs/planned lands here (ruling 2).

## Phase 2 - Strength Score + imbalance headline

Engine (`server/src/analytics/strengthScore.js`, pure, fixtures):
- Qualifying exercise: >= 3 sessions with effort-matched data in the
  trailing 8 weeks AND >= 1 in the prior 8 weeks.
- Per-exercise ratio = (best matched-effort e1RM, trailing 8w) /
  (best matched-effort e1RM, prior 8w).
- Score = volume-weighted mean of ratios (weight = exercise share of
  effective sets in the trailing 8w), expressed as a signed percent.
- Insufficient data: < 2 qualifying exercises -> null + reason enum
  (the UI honesty state names what unlocks it).

Display:
- One headline on the Strength tab (and later the weekly digest):
  "Strength +3.2% - 8 weeks - 6 lifts measured". Muted, not celebratory.
- Imbalance headline, one muted line under it, worst-offender rule:
  if >= 2 single-side exercises have a >= 5% side delta in the same
  direction -> "Right side leads on 3 of 4 single-arm lifts (avg 8%)";
  else fall back to the existing push/pull or quad/ham ratio if outside
  its zone band; else render nothing. Links to the Exercises detail.

## Block plan (Opus authors from this spec)

- SS1: server per-side plumbing + exerciseDetail.perSide + fixtures.
- SS2: comparison UI + pairs-denominator adherence (after SS1).
- SS3: strengthScore engine + Strength-tab headline + imbalance line
  (after SS1; UI collides with strength-view units - serialize per
  QUEUE notes at authoring time).
- Gym-context annotations (docs/specs/gym-context.md) touch the same
  strength UI - sequence the two waves' UI units explicitly.
