# MW4 findings - preserved verbatim from the lane DELIVERY.md at land time
# (July 16, 2026; audit passed per land-unit - lane re-run 170/170 fresh,
# zero source edits, spot-checks confirmed; DELIVERY.md is gitignored so
# this copy is the durable record. MW6's contract finalizes against this.)

## MW4 — per-side (unilateral) tracking end-to-end audit (DIAGNOSIS)

### Files touched
- `DELIVERY.md` only (this report). Zero source edits.

### Test evidence
`npm run test:unit` from `server/` (allowed; not used as proof of per-side behavior — that came from node eval + code read):

```
> server@1.0.0 test:unit
> cross-env NODE_ENV=test jest --selectProjects unit

Running one project: unit

Test Suites: 14 passed, 14 total
Tests:       170 passed, 170 total
Snapshots:   0 total
Time:        8.341 s
Ran all test suites.
```

Node eval (pure engine, fixture = one L/R pair of `One-Arm_Dumbbell_Row` at 60×10 RIR 2, then 3 pairs vs 3 rows). Key outputs:

```
enrichSet input keys: weight, reps, rir, rpe, effortRir, order, templateExerciseId
  (side dropped even if passed on rawSet)

L+R pair → sum of perMuscle.effectiveSets = 2
3 pairs (6 rows) lats effectiveSets / 3 rows = exactly 2×

e1rmSeries length for one session with L+R: 1 (not 2)
topSetSeries length: 1
exerciseDetail totals: { sessions: 1, sets: 2, effectiveSets: 2, stimulatingSets: 1.9 }
e1rmHistory length: 1; topSets list length: 2 (both sides listed)

Detection regex:
  "One-Arm Dumbbell Row" => false
  "Single-Arm Cable Crossover" => true
  "Chest Push (single response)" => true
Catalog: ~50 names with one-arm / one arm; 16 with \bsingle\b; 0 with unilateral
```

### Surface verdicts

#### 1. Storage + enrichment — CORRECT

**Storage:** `WorkoutSet.side` is `String?` in Prisma (`server/prisma/schema.prisma:126`). Create/PATCH validate `"L"` / `"R"` / null (`sessionController.js` `validateOptionalSide` ~:54–64; create ~:836–901; PATCH ~:1053–1057). Integration test covers round-trip (`server/test/sessions.lifecycle.test.js` "WorkoutSet side field").

**Enrichment:** No file under `server/src/analytics/` references `side` (ripgrep: zero matches). `enrichSet` (`enrichSet.js:5–57`) never reads `rawSet.side`; returned `input` is only weight/reps/rir/rpe/effortRir/order/templateExerciseId (`:45–53`).

**Controller drop:** Both analytics fetch paths build the enrich payload without `side`:

```46:66:server/src/controllers/analyticsController.js
        enrichSet(
          {
            performedAt: session.performedAt,
            // ... identity fields ...
            weight: set.weight,
            reps: set.reps,
            rir: set.rir,
            rpe: set.rpe,
            order: set.order,
          },
```

Same shape at `analyticsController.js:210–231` (summary). Even if `side` were passed, enrichSet would ignore it (node eval confirmed).

**Verdict:** Persistence is correct. The analytics engine is side-blind by construction. That is not a storage bug; later surfaces inherit the blindness.

#### 2. Volume (weekly / muscle attribution) — AMBIGUOUS

**What the code does:** Each DB row is one enriched set. `aggregateMuscleVolume` (`aggregate.js:103–130`) walks every in-range set and adds `metrics.effectiveContribution` / `stimulatingContribution` per muscle. No pairing, no halving, no side filter.

**Evidence:** One L + one R at identical load → StatTiles-style sum of `effectiveSets` across muscles = **2**. Three L/R pairs (6 rows) vs three rows → lats `effectiveSets` ratio **exactly 2**.

Attribution fractions are per row (`One-Arm_Dumbbell_Row` lats 0.45 etc. from muscle-weights); two sides = two full attributions.

**Defensibility:** Counting each side as its own set of stimulus is a coherent coaching position (each limb did a working set). It is also easy to over-count vs a lifter who thinks “3 pairs = 3 sets.” Flag, don’t rule.

**Verdict:** AMBIGUOUS (behavior is consistent and intentional-looking; product must say whether pair = 1 or 2 volume sets).

#### 3. Set counts / stimulating sets / effort pooling — AMBIGUOUS

Same side-blind row counting everywhere:

| Surface | Mechanism | Per-side effect |
|---|---|---|
| StatTiles / WeeklyReport “Sets” | Sum `perMuscle.effectiveSets` (`StatTiles.jsx:65`, `WeeklyReport.jsx:51–52`) | L+R = 2 |
| Muscle volume / heatmap | From `aggregateMuscleVolume` | L+R = 2 |
| Stimulating sets | `stimulusMultiplier` × attribution per row (`setMetrics.js:34–39`; aggregate adds stim per row) | L+R ≈ 2× stim |
| Exercise detail totals | `sets.length`, `effectiveSets` = attributed count (`exerciseDetail.js:185–242`) | `sets: 2`, `effectiveSets: 2` for one pair |
| Detail weeklyVolume | `bucket.effectiveSetsTotal += 1` per attributed set (`exerciseDetail.js:133`) | +2 for one pair |
| Matched-effort | Session-keyed best epley per effort bucket (`matchedEffort.js:35–39`) | L+R same session → one session point (no double trend point) |
| Plan vs actual volumeAdherence | `actualSetCount / plannedSetCount` (`planVsActual.js:92–148`) | 3 planned bilateral-style sets + 3 L/R pairs (6 rows) → adherence **2.0** |

**Verdict:** AMBIGUOUS — same product question as volume. Effort-trend session bucketing does not double-count sessions; raw set/volume counts do double vs pair intuition.

#### 4. e1RM / top set / strength series — AMBIGUOUS

**Equal footing:** `computeSetMetrics` / `estimateOneRepMax` use weight×reps only (`setMetrics.js:7–16, 24–28`). A 60 lb single-arm row gets the same epley as a 60 lb bilateral set. No unilateral adjustment.

**Session bucketing (no series double-count):** `aggregateExerciseMetrics` keeps one best epley / one top weight per `performedAt` ms (`aggregate.js:204–266`). Node eval: one session L+R → `e1rmSeries.length === 1`, `topSetSeries.length === 1`. Detail `e1rmHistory` same (`exerciseDetail.js:201–208`).

**topSets list:** Detail sorts all weight-carrying sets and takes top 5 (`exerciseDetail.js:212–222`) — both L and R can appear as separate entries when weights match (eval: `topSets.length === 2` for one equal pair).

**Verdict:** AMBIGUOUS — series/history correctly de-dupe per session; treating unilateral load as bilateral-equivalent e1RM is a product/semantics call, not a crash bug. Not a pair double-count in series points.

#### 5. Display / formatters — BROKEN (one clear inconsistency) + milder caveats

**BROKEN — heading vs Sets control:**

- Sets toolbar in per-side mode uses **pair** count: `pairCount = ceil(sortedSets.length / 2)` (`SessionDetailPage.jsx:1318`, control `value={pairCount}` `:1516`).
- Heading meta uses **raw row** count: `setCountLabel = \`${sets.length} … sets\`` (`:1359–1400`).

So one L/R pair shows toolbar “1” and heading “· 2 sets”. That matches the block’s example of a confusing pair render.

**Caveats (not separately BROKEN):**

- `sessionExerciseLastLoggedSummary` (`:350–360`) returns `"weight × reps"` from the last core-logged set with **no L/R**. Collapsed line becomes `Last 60 × 10` with no side cue (`:1362–1368`, `:2733`).
- Sessions list: `Sets: {s._count?.sets}` (`SessionsPage.jsx:90`) = DB rows (pairs count ×2).
- Live logging UI otherwise: L/R badges, pair labels (`perSideSetLabel`), pair delete confirm, partner weight autofill from L→R (`:924–934`, `:1320–1328`) — those read correctly when mode is on.
- `groupSetsIntoRenderUnits` (`:240–272`) pairs by **order adjacency**, not by verifying L then R. Normal create path writes L then R (`createSetPairForExercise` `:281–292`), so happy path is fine; odd-length / deleted-half / reordered sides can render mismatched “pairs.”

**Verdict:** BROKEN for heading/toolbar set-count mismatch under per-side mode. Last-logged omission of side is a lesser UX caveat.

#### 6. Detection edge — BROKEN

**Mechanism** (`SessionDetailPage.jsx:207–220`):

```js
/\bsingle\b/i.test(name)   // exerciseNameImpliesPerSide
|| anySetHasSide(sets)     // side === "L"|"R"
|| manualOverride
```

**Misses (obvious unilateral names):** Catalog has ~50 `One-Arm` / `One Arm` names; detection returns **false** for `One-Arm Dumbbell Row`, `Dumbbell One-Arm Shoulder Press`, `Cable One Arm Tricep Extension`, alias `dumbbell row`, and one-leg names without “single” (e.g. `Dumbbell Seated One-Leg Calf Raise`). User must tap L/R chip (or already have sided sets).

**False positive:** `Chest Push (single response)` matches `\bsingle\b`.

**Hits that work:** `Single-Arm …`, `Single Leg …`, `Single Dumbbell Raise`, etc. (16 catalog names with `\bsingle\b`).

**Mode flip traps (list, don’t fix):**

1. Rename away from a `\bsingle\b` name **before** any L/R sets exist → auto mode turns off mid-session.
2. Rename onto a `\bsingle\b` name (or false-positive name) with no sides yet → auto mode turns **on** and next “+ set” creates a pair.
3. Manual override `false` forces bilateral UI even when rows still have `side` stored (badges gated on `perSideMode`); override `true` forces pairs for bilateral names.
4. Override resets only on `se.id` change (`:1284–1287`), not on name change — sticky manual state across renames until remount.
5. `anySetHasSide` keeps mode on after first L/R row even if name no longer implies per-side — good for continuity; means clearing sides (PATCH null) + non-single name is required to auto-drop.

**Verdict:** BROKEN — primary catalog unilateral naming (`One-Arm` / `One Arm`) is invisible to auto-detect; false positive on “single response.”

---

### Overall verdict

**With caveats — not fully trustworthy as an automatic unilateral system today.**

- **Logging storage + manual L/R mode:** trustworthy (side persists; pair UX works when mode is on).
- **Analytics:** side-blind; each side = one full set of volume/stim/counts. Coherent if product accepts that; misleading if lifters expect pair = 1 set. e1RM treats per-side load like bilateral load (series points do not double per session).
- **Auto-detect:** not trustworthy for the common `One-Arm` catalog names; MW6 (auto-first-pair) should not ship on the current `\bsingle\b` detector alone.

---

### Smallest-correct proposed fixes (BROKEN only; no code)

1. **Detection (`SessionDetailPage.jsx:207–210`)**  
   Expand name implication beyond `\bsingle\b` to cover `one-arm` / `one arm` / `one-leg` / `one leg` (and optionally `unilateral`), and exclude false positives like `single response` (negative lookahead or denylist). Prefer matching catalog id patterns (`One-Arm_`, `_One_Arm_`) when `exerciseId` is resolved. Mechanism: same `exerciseNameImpliesPerSide` gate; broader true positives, fewer false ones.

2. **Heading set count (`SessionDetailPage.jsx:1359`)**  
   When `perSideMode`, derive `setCountLabel` from `pairCount` (or `renderUnits` length), not `sets.length`, so heading and Sets control agree (“1 set” = one L/R pair). Optional follow-on: sessions list `_count.sets` copy could say “set rows” or divide when all sets for a session are sided — larger product choice; heading fix is the smallest confusing-pair fix.

*(AMBIGUOUS surfaces need rulings below before code.)*

---

### Semantics questions (product rulings — not decisions)

1. **Volume / stimulating / StatTiles / weekly report:** For unilateral work, should one L/R pair count as **1** effective set or **2** toward muscle volume?
2. **Plan adherence:** If a template plans N sets and the lifter logs N L/R pairs (2N rows), should `volumeAdherence` stay `actualRows/planned` or become `pairs/planned`?
3. **e1RM / top set / rep targets:** Should a per-side load enter strength series and “working weight” tables on equal footing with bilateral loads, or be tagged / scaled / separated?
4. **Sessions list “Sets: N”:** Raw DB rows, or pair-aware count when sided?
5. **Collapsed “Last W × R”:** Should it show side (e.g. `R 60 × 10`) or a combined L/R summary when both sides logged?

---

### Acceptance criteria

| Criterion | Evidence |
|---|---|
| `git status` clean except `DELIVERY.md` | Before write: `nothing to commit, working tree clean`. After this file: only untracked/ignored `DELIVERY.md` (gitignored delivery report); zero source edits. |
| All six surfaces have file:line + explicit verdict | Sections 1–6 above. |
| Engine claims backed by quote or eval, not inference alone | Controller/enrichSet quotes; node eval outputs; `test:unit` 170/170 included. |

### Deviations
None. Diagnosis only; no code changes; no git write operations (status/diff used only for the clean-tree criterion).
