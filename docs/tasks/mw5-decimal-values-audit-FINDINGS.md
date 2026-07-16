# MW5 findings - preserved verbatim from the lane DELIVERY.md at land time
# (July 16, 2026; audit passed per land-unit - lane re-run 170/170 fresh,
# zero source edits, spot-checks confirmed: parseNullableInt quote exact,
# rir 400 on both create :822 and update :1037, Math.round(reps) on exactly
# the 5 claimed surfaces, live reps step=1 confirmed. DELIVERY.md is
# gitignored so this copy is the durable record.)

# DELIVERY — MW5: decimal reps / RPE / RIR end-to-end audit (DIAGNOSIS)

**Unit:** MW5  
**Mode:** DIAGNOSIS — zero source edits  
**Date:** 2026-07-16  
**Branch:** `cursor/mw5-decimal-values-audit`

## Files touched

- `DELIVERY.md` only (this report). No source, test, schema, or docs edits.

## Lanes run

```
> server@1.0.0 test:unit
> cross-env NODE_ENV=test jest --selectProjects unit

Running one project: unit

Test Suites: 14 passed, 14 total
Tests:       170 passed, 170 total
Snapshots:   0 total
Time:        2.654 s
Ran all test suites.
```

Targeted subset (effort / matchedEffort / setMetrics): 3 suites, 37 tests, all passed.

`git status` before this report: clean tree (no source edits). `DELIVERY.md` is gitignored (`/.gitignore` `/DELIVERY.md`), so after writing this file status remains clean with zero source edits — acceptance intent met.

---

## Component note (shared path)

There is **no** separate `DraftSessionSetRow` file. Live + draft rows are one component: `SessionSetRow` in `client/src/pages/SessionDetailPage.jsx` (`isDraft` prop). Template builder uses `client/src/components/templates/SetRow.jsx` (different surface; noted where it differs). Stages below focus on the live session path the block names; template differences called out under Input.

---

## Stage 1 — Input

### Shared observations

- On change: draft fields store **raw strings** (`e.target.value`) — no parse/clamp for reps / RPE / RIR.
- On blur / debounce: `Number(d.field)` (or `""`) is sent to create/update — still no integer rounding for RIR.

### Reps 8.5

Evidence (`SessionDetailPage.jsx`):

```1147:1161:client/src/pages/SessionDetailPage.jsx
              <input
                id={fieldIds.reps}
                type="number"
                value={draft.reps}
                onChange={(e) => setDraft((d) => ({ ...d, reps: e.target.value }))}
                ...
                inputMode="decimal"
                min="0"
                step="1"
```

- `inputMode="decimal"`, `type="number"`, **`step="1"`** (not `0.01`).
- Payload: `payload.reps = d.reps === "" ? "" : Number(d.reps)` (`:831`) — `Number("8.5") === 8.5`.
- Contrast: template `SetRow.jsx:43` uses `step="0.01"` for reps. Task context’s “reps inputs carry `step=\"0.01\"`” is true for **templates only**, not live session.

**Verdict (reps Input): AMBIGUOUS** — decimals are typeable and not clamped, but live `step="1"` conflicts with decimal intent (spinner / native step semantics) and with the template row.

### RPE 8.5

Evidence:

```1198:1209:client/src/pages/SessionDetailPage.jsx
                  <input
                    id={fieldIds.rpe}
                    value={draft.rpe}
                    onChange={(e) => setDraft((d) => ({ ...d, rpe: e.target.value }))}
                    ...
                    inputMode="decimal"
```

- Text-like input (no `type="number"`), `inputMode="decimal"`, no min/step, no clamp.
- Payload: `Number(d.rpe)` (`:833`).

**Verdict (RPE Input): CORRECT** — fractional RPE can be entered and is sent unmangled.

### RIR 1.5

Evidence:

```1176:1187:client/src/pages/SessionDetailPage.jsx
                  <input
                    id={fieldIds.rir}
                    value={draft.rir}
                    onChange={(e) => setDraft((d) => ({ ...d, rir: e.target.value }))}
                    ...
                    inputMode="numeric"
```

- No `type="number"`, **`inputMode="numeric"`** (often integer-only mobile keypad — no decimal key), no client integer enforcement.
- Payload still does `Number(d.rir)` (`:834`) → `1.5` if typed on a keyboard that allows it.

**Verdict (RIR Input): AMBIGUOUS** — desktop can type `1.5` and it is sent as a float; mobile numeric keypad may block decimals; neither path prevents a bad value before the network.

---

## Stage 2 — Validation / parse

Source: `server/src/controllers/sessionController.js` create (`:797–827`) and update (`:989–1044`). Same helpers for both.

### Quoted helpers

```40:52:server/src/controllers/sessionController.js
function parseNullableInt(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

function parseNullableFloat(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed;
}
```

Reps use `validateOptionalNonNegDecimal` (`maxDecimals: 2`) from `server/src/lib/numericValidators.js` — rejects >2 fractional digits; **does not round**.

RPE: `parseNullableFloat` + reject if `NaN` or `< 0` → **400** `"rpe must be a non-negative number when provided"`.

RIR: `parseNullableInt` + reject if `NaN` or `< 0` → **400** `"rir must be a non-negative integer when provided"`.

### Node eval (demonstrated, not inferred)

```
=== reps 8.5 ===
{"ok":true,"value":8.5}   // number and string "8.5"

=== rpe 8.5 ===
{ rpe: 8.5, reject: false }

=== rir 1.5 (number) ===
{ rir: NaN, isNaN: true, would400: true }

=== rir 1.5 (string) ===
{ rir: NaN, isNaN: true, would400: true }

=== rir 2 (ok) ===
{ rir: 2, would400: false }
```

**Exact `rir: 1.5` behavior:** `Number.isInteger(1.5)` is false → `parseNullableInt` returns `NaN` → controller returns **HTTP 400** with `"rir must be a non-negative integer when provided"`. **Not** truncated, **not** Prisma-thrown. Client `applyUpdateSet` (`:2296–2325`) catches, `setError(err)`, and `load()` — typed draft is discarded on reload.

| Value | Verdict |
|-------|---------|
| reps 8.5 | **CORRECT** — accepted at 2 dp |
| RPE 8.5 | **CORRECT** — accepted as float |
| RIR 1.5 | **CORRECT** — clean 400 reject (no silent truncate) |

*(Stage answered once for create+update; same code path.)*

---

## Stage 3 — Storage

Schema (`server/prisma/schema.prisma` `WorkoutSet`):

- `reps Float?` (`:121`)
- `rpe Float?` (`:123`)
- `rir Int?` (`:124`)

Same pattern on `TemplateSet` (`:86–89`) and `BlockWorkoutSet` (`:274–277`).

No rounding on write in the session controller beyond the validators above (reps reject excess decimals; RPE/RIR pass through parsed values). Decimal RIR never reaches Prisma.

| Value | Verdict |
|-------|---------|
| reps / RPE | **CORRECT** — Float columns match decimal values |
| RIR | **CORRECT** — Int column; 1.5 never stored (blocked at validation) |

---

## Stage 4 — Analytics

### Effort pooling (`effort.js`)

```11:14:server/src/analytics/effort.js
function deriveEffortRir({ rir, rpe }) {
  if (rir != null) return rir;
  if (rpe != null) return Math.max(0, 10 - rpe);
  return null;
}
```

Comments + unit test: `rpe: 8.5 → 1.5` (not rounded). Eval: `deriveEffortRir({ rir: null, rpe: 8.5 }) === 1.5`.

### e1RM / tonnage (`setMetrics.js`)

Epley/Brzycki use `reps` as a real number — **no integer assumption**:

```12:14:server/src/analytics/setMetrics.js
  const epley = weight * (1 + reps / 30);
  const brzycki =
    reps >= BRZYCKI_SINGULARITY_REPS ? null : (weight * 36) / (37 - reps);
```

Eval: `estimateOneRepMax(100, 8.5)` → `{ epley: 128.333…, brzycki: 126.315… }`; `computeTonnage(100, 8.5) === 850`.

### matchedEffort

Buckets on exact `effortRir` (fractional OK). Unit test: `"fractional RPE forms its own bucket: 8.5 (-> 1.5) does not match RIR 2"` — passed in lane.

### stimulusCurve

`rir <= band.maxRir` — fractional RIR works (`getStimulusMultiplier(1.5) === 0.95`).

| Value | Verdict |
|-------|---------|
| decimal reps | **CORRECT** — flow unmangled through e1RM/tonnage |
| decimal RPE | **CORRECT** — derives fractional RIR; matched-effort aware |
| decimal RIR (if present) | **CORRECT** — math would handle; unreachable via session write today |

---

## Stage 5 — Display

### Shared formatters (N1)

`formatEffortValue` / `formatEffort` (`client/src/lib/effortDisplay.js`): integer stays integer; fractional → one decimal (`toFixed(1)`).

Eval:

- `formatEffort({ rpe: 8.5 })` → `"8.5 RPE"`
- `formatEffort({ rir: 1.5 })` → `"1.5 RIR"`
- matched RPE-only display `formatEffort({ rir: 1.5, effortUnit: "rpe" })` → `"8.5 RPE"`

`formatWeight` keeps meaningful halves (`102.5`). Plan/actual `formatDecimalCount` in `executionVerdict.js` also keeps one decimal.

### Set-row rendering (live session)

Draft seeded with `set.reps ?? ""` / `set.rpe` / `set.rir` (`:843–846`). Collapsed summary `` `${w} × ${r}` `` uses string forms of stored values (`:355–357`) — **8.5 displays as 8.5**.

### Analytics surfaces — reps rounding

Several analytics UIs **`Math.round` reps** for top-set copy:

- `AnalyticsPage.jsx:73` — `` `${formatWeight(topSet.weight)} × ${Math.round(topSet.reps)}` ``
- `WeeklyReport.jsx:228`, `StatTiles.jsx:126`, `ExercisesView.jsx:352`, `StrengthTrendChart.jsx:22` — same pattern

`Math.round(8.5) === 9` — **half-rep logs display wrong on those surfaces**.

| Value | Verdict |
|-------|---------|
| reps set-row / summary | **CORRECT** |
| reps analytics top-set strings | **BROKEN** (`Math.round`) |
| RPE / RIR via `formatEffort` | **CORRECT** for fractional values |

---

## Acceptance criteria checklist

| Criterion | Evidence |
|-----------|----------|
| Clean tree except DELIVERY.md (zero source edits) | Pre-write `git status` clean; only this gitignored report written |
| 5 stages × 3 values with file:line + verdicts | Sections above; shared paths called out |
| `rir: 1.5` demonstrated | Quoted `parseNullableInt` + node eval proving NaN → would400; not truncate / not Prisma |
| Engine claims via unit lane / eval | 170/170 unit; targeted 37; e1RM/effort/stimulus evals above |

## Deviations

- None from DIAGNOSIS scope. Noted factual correction: live session reps use `step="1"`, not `step="0.01"` (templates only).
- No separate `DraftSessionSetRow` file — covered via `SessionSetRow` `isDraft`.

---

## (a) Overall verdict per value

| Value | Overall | Summary |
|-------|---------|---------|
| **reps 8.5** | **Trustworthy with one display bug** | Input slightly inconsistent (`step="1"`); validate+store+analytics CORRECT; analytics **display** rounds to integer |
| **RPE 8.5** | **CORRECT end-to-end** | Input → Float storage → effort/matchedEffort → `formatEffort` all preserve fractions |
| **RIR 1.5** | **Not supported (clean reject)** | Schema `Int?`; server **400**s; never stored. If a fractional RIR existed, analytics/display would handle it — but the write path forbids it |

---

## (b) Smallest-correct proposed fixes (BROKEN only; no code)

1. **Analytics reps display** (`AnalyticsPage.jsx:73`, `WeeklyReport.jsx:228`, `StatTiles.jsx:126`, `ExercisesView.jsx:352`, `StrengthTrendChart.jsx:22`)  
   Stop `Math.round(topSet.reps)`. Use a small shared formatter (mirror `formatEffortValue` / `formatDecimalCount`: strip trailing `.0`, keep one decimal for halves) so `8.5` stays `8.5` and `8` stays `8`.

*(Input `step="1"` on live reps is AMBIGUOUS, not BROKEN — optional follow-on: align live session `step` with templates’ `0.01` if product wants half-reps as first-class.)*

---

## (c) Recommendation on decimal RIR

**Recommend: REJECT decimal RIR cleanly at input + validation (do not widen the column).**

Reasoning:

1. Schema already says `Int?` — RIR is conventionally whole-rep “reps left in the tank”; half-RIR is the same information as half-RPE via `RIR = 10 − RPE`, and **decimal RPE already works end-to-end**.
2. Server already rejects cleanly (400 + message). Widening to `Float` would be a migration for little gain when users who want half-steps can log RPE 8.5 → derived effort 1.5 (already tested).
3. Smallest UX fix if desired: client-side integer gate (and/or `inputMode`/`type` that matches integers) **before** PATCH, so users never see a flash error + reload for `1.5`. Keep the server `parseNullableInt` check.

Ruling stays with the reviewer tier; this is the diagnosis recommendation only.

---

## STOP CONDITION

Acceptance criteria met. No commits, no git ops, no HANDOFF/task-queue edits. End of turn.
