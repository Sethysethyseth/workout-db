# PARKED — logging/reward brainstorm (July 10, 2026)

> **DO NOT READ, ACTION, REFERENCE, OR FOLD INTO ANY WAVE unless Seth
> explicitly points an agent at this file.** Not part of HANDOFF, not part
> of any queue, not review fuel. It exists only so the ideas aren't lost.

Raw output of a Fable brainstorm session. Nothing here is decided,
specced, or greenlit.

---

## Seth's original ask (as clarified)

The real target was the **add-exercise function when the exercise isn't
tracked** — the experience around `ExerciseTrackedIndicator` ->
`AddExerciseToLibrarySheet` when a typed name doesn't resolve. Deferred by
Seth ("pocket this for another day"). Everything below is brainstorm
material generated around and beyond that ask.

## Seth's reactions during the session

- Liked: C (set-row layer), D (finish recap), E (My Exercises page).
- Added: a **drop set** function — "continue with the exact same logic
  but now with a new target."
- Pocketed: the untracked add-exercise flow revamp (the original ask),
  the start-picker upgrade (A), picker-first exercise adding (B).

---

## Diagnosis of the current live-logging flow

Typing-first, not picking-first. "Empty workout" creates one blank
exercise block; "+ Add exercise" appends another blank; naming happens via
free-text typeahead. Problems: recall burden mid-workout; Builder/Table
mode asymmetry (Table can't add exercises); display prefs (RIR/RPE/notes/
units) clutter the logging surface; zero reward on "Finish workout"
despite a full analytics engine one tab away.

Organizing thesis: **"rewarding" = the analytics engine pays you at the
moments you earned it** — not confetti, streaks, badges, or gamification.
Keeps the redesign on-brand (analytics-first, don't out-Hevy Hevy,
motion restraint ~150-250ms ease-out).

## A. Start-workout picker (POCKETED)

- "Repeat last workout" as a first-class one-tap option.
- Template rows carry memory: "Upper A - 6 ex - last done 4 days ago."
- Deterministic "up next" nudge on the least-recently-done template
  (rotation hint, not AI coach).
- Demote "Empty workout" from primary button to equal option.

## B. Picker-first exercise adding (POCKETED)

Replace append-blank-then-type with a full exercise picker sheet:
- Sections: Recents (last ~10 distinct), Your exercises (customs),
  Browse by muscle group (the 17-muscle vocabulary already grouped in
  `AddExerciseToLibrarySheet`), search on top.
- Selecting adds a *named, resolved* exercise — exerciseId/userExerciseId
  stamped at creation (upstream fix for name-resolution robustness).
- Multi-select for building a session in one sheet-open.
- Inline typeahead survives as the rename path, not the add path.
- Free text stays as escape hatch into the add-to-library sheet.

## C. Set-row layer (Seth liked)

- **Ghost "last time" targets**: one server tail — a prior-performance
  payload per exercise identity (last completed session's sets +
  all-time bests), resolved exerciseId/userExerciseId first, normalized
  name as historical fallback. Template-linked sessions: planned target
  stays primary prefill, ghost as secondary microcopy ("Last: 185 x 8").
  Ad-hoc: ghost in input placeholders. Delta chips when you beat it.
  No history -> no ghost, silently. Unit conversion + per-side handling
  are spec details.
- **Live PR chip**: client compares committed sets vs server-provided
  bests (weight PR + e1RM PR in v1), updates local bests after each
  commit so a second same-session PR fires. The recap must recompute PRs
  through the SAME engine function so live chip and recap never disagree.
  Restrained: small accent "PR" chip, ~200ms ease-out, no trophy.
- **RIR as tap chips** (0/1/2/3/4+) instead of numeric input — groundwork
  for the mandatory-effort wave.
- Display prefs relocated behind a single "..." affordance.
- Open question: does live Table view survive, or collapse to a read-only
  overview drawer (one spine, not two modes)?

## Drop sets (Seth added)

"Same logic, new target": a drop row IS a set row — same autosave/draft
machinery — grouped under its parent.

- **Data model**: nullable self-reference `dropOfSetId Int?` on
  `WorkoutSet` (+ index). One-column A4-style migration. Robust to
  reorders/edits vs adjacency inference. `side` is precedent for a
  lightweight discriminator; `groupSetsIntoRenderUnits` is precedent for
  cluster rendering.
- **UX**: quiet "+ Drop" affordance on a logged row; appends an indented
  sub-row (thin connector, D1/D2 labels), chainable. Prefill blank, or
  ghosted from last time's drop pattern — no magic percentages.
- **Analytics doctrine (must be DECIDED, written into the analytics
  spec, not just coded)**:
  - Tonnage: drops count fully.
  - Set counts / Stimulating Sets: the cluster counts ONCE (drops are
    RIR~0; per-drop counting inflates hard-set counts vs straight-set
    users and corrupts cross-user muscle-volume comparisons).
  - e1RM / top-set trend / PR detection: drops EXCLUDED; only the
    cluster's parent set is eligible (fatigued back-off reps distort
    e1RM formulas; rep-PR false-fires cheapen the PR moment).
  - Rules live as pure functions in `server/src/analytics/` with
    fixtures — drop sets ship WITH their analytics semantics or not
    at all.
- v1 cut: no drop sets on per-side exercises (two grouping dimensions at
  once; hide "+ Drop" in per-side mode).
- Open call: RIR on drops — auto-0 (post-failure by definition) or blank.

## D. Finish recap (Seth liked)

- Finish workout -> recap sheet; also a durable artifact reachable from
  the session's row in history (`GET /api/sessions/:id/recap`, pure
  engine function over enriched sets).
- Tiles: volume + comparison; top set + PRs earned (tap-through via the
  N6 `?view=exercises&exercise=...` link pattern); muscle mini-heat
  (N7's binned ramp); duration/sets as small print.
- Every tile carries the insufficient-data warm-copy path (standing
  product ask) — a first recap should welcome, not show four empty
  comparisons.
- Comparison-baseline fork: template-linked sessions compare vs your
  last few runs of the SAME template ("vs your last Upper A") — strong
  lean — vs simpler 8-week all-session average (ad-hoc fallback either
  way).
- Firing fork: every finish (lean — consistency builds the habit loop)
  vs only-when-notable.
- Doubles as an analytics-discovery funnel at the moment of highest
  motivation. Natural future share surface; sharing itself parked.

## E. My Exercises page (Seth liked)

Management view, distinct from the analytics Exercises tab (performance
view); cross-linked both ways.

- Home: Profile-anchored (`/profile` already hosts Appearance/Security/
  What's New), e.g. a "My exercises" page.
- Per custom exercise: name, muscle-role chips (main/assist), times
  logged, last used, "View analytics ->" when data exists.
- Edit muscle mapping with explicit disclosure: attribution recomputes,
  so edits apply to ALL past sessions.
- **Archive, not delete**, once history references the identity (FKs).
- Stretch: merge-to-catalog tool — re-point a custom's history at a
  catalog exercise when a duplicate/upstream addition exists (closes
  open issue #4; conceptually the A6 backfill machinery).
- Also an "add new custom exercise" entry point reusing the existing
  sheet.

## F. Considered and rejected (with criteria)

- Rest timers, plate calculators, supersets-as-a-feature: fails the
  anti-goal (out-featuring Strong/Hevy on logging UX).
- Streaks/badges/XP: reads amateur next to the analytics-first identity;
  the recap's real numbers are the reward.
- AI-suggested next exercise: Track C, dead-last by standing decision;
  the deterministic least-recently-done nudge captures most value.
- Confetti/celebration animation on PR: violates the motion doctrine.

## Sketched wave shape (NOT greenlit, NOT a skeleton)

Dependency order: (1) drop-set migration (`dropOfSetId`) — gated, lands
first per the schema-deploy ritual; (2) drop-set engine doctrine +
fixtures; (3) prior-performance endpoint (feeds 4/5/6); (4) set-row unit
(drop UI + RIR chips + prefs relocation); (5) ghosts + delta chips +
live PR chip; (6) recap endpoint + sheet + history entry; (7) My
Exercises. One migration total. Roughly N-wave sized.

Open forks recorded, unanswered: (a) drop-set analytics doctrine
sign-off; (b) recap baseline (template-aware vs global); (c) recap
firing (every finish vs notable-only); (d) RIR on drops (auto-0 vs
blank).
