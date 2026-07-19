## FP0 - frontier-parity report

### Files touched
- (none — report-only; this file `DELIVERY.md` at repo root is the only write)

### Test evidence
Lane allowed: `npm run test:unit` from `server/` (tripwire that the tree is untouched).

```
> server@1.0.0 test:unit
> cross-env NODE_ENV=test jest --selectProjects unit

Running one project: unit

Test Suites: 14 passed, 14 total
Tests:       170 passed, 170 total
Snapshots:   0 total
Time:        7.339 s
Ran all test suites.
```

Exit code: 0.

### Acceptance criteria
- **ZERO source modifications:** `git status --porcelain` is empty. `DELIVERY.md` is gitignored, so it does not appear; no tracked or untracked source files were created or modified.
- **Every "Now" claim carries file:line:** see R1–R10 and Tier 2 below.
- **R3 names a concrete mechanism:** dual data sources + dual timestamps (`completedAt` session list vs `performedAt` analytics summary) — evidence under R3.
- **R1 WorkoutDB sweep with in/out-of-scope verdicts:** listed under R1.
- **All Tier-0 (R1–R6), Tier-1 (R7–R10), Tier-2 present** in the stated format.
- **`npm run test:unit` green:** 170/170 (output above).

### Deviations
None. Report-only unit; no code changes.

---

## Frontier-parity verdict

LogChamp already beats the frontier pack on the insight layer that Strong and Hevy treat as secondary: muscle volume with honesty notes, top-set / matched-effort strength trends, plan-vs-actual execution fidelity, an all-time exercise index with no history wall, and Balance ratios. Logging and Library (templates + multi-week blocks) are solid. The real gaps are product polish and a few missing “intermediate killer” surfaces: empty PWA icons and a title still saying WorkoutDB, a This-week strip that can show workouts without sets because it mixes two clocks, a mobile recent-workouts carousel that truncates titles, empty analytics that leave scene dead space instead of teasing the wedge, and no PR detection even though the engine already computes the series PRs would ride — while Strength Score / imbalance remains design-blocked with the queued L/R unit.

---

## R1 - Rebrand title leak

**Now:** The browser tab still says “WorkoutDB beta,” while the PWA manifest already brands LogChamp. Two Hello-page strings still say WorkoutDB to users; storage keys and hostnames that contain `workoutdb` are rename-boundary OUT and are not product leaks.

Evidence:
- `client/index.html:7` — `<title>WorkoutDB beta</title>`
- `client/public/manifest.webmanifest:2-3` — `"name": "LogChamp"`, `"short_name": "LogChamp"`
- Rendered UI JSX hits (IN SCOPE — display text):
  - `client/src/pages/HelloPage.jsx:17` — `Welcome to WorkoutDB Beta` → **in scope**
  - `client/src/pages/HelloPage.jsx:49` — `save WorkoutDB to your phone's home screen` → **in scope**
- Out of scope (internal / rename boundary — not listed as problems to fix in this unit’s CALL, documented so the sweep is complete):
  - localStorage / pref keys: `quickWorkoutLogPrefs.js:1`, `weightUnitPref.js:1`, `whatsNewStorage.js:1`, `adHocSessionTitle.js:1`, `analyticsRangePref.js:1`, `currentProgramStorage.js:1`, `ThemeContext.jsx:11-12`
  - prod API host string `workout-db-l3gc` in `appEnv.js:13` and `http.js:8`
  - comment-only `workoutdb-` note in `whatsNew.js:11`

**Change:** Set `<title>LogChamp</title>` (drop “beta” or keep a separate Beta pill elsewhere — CALL is retitle to LogChamp). Replace the two HelloPage strings with LogChamp. No renames of cookies, storage keys, routes, or service names.

**Size:** S — `client/index.html`, `client/src/pages/HelloPage.jsx` (2 string sites).

---

## R2 - PWA install icons

**Now:** The manifest ships an empty icons array, so install prompts on Android/Chrome have no app icon to show (generic/broken tile). There is also no `<link rel="manifest">` in `index.html` and no Vite PWA plugin — `client/public/manifest.webmanifest` is served as a static file only if something links it; today nothing does. Favicon is a purple Vite-style “V”/lightning SVG (stock Vite branding: purple `#863bff` geometric mark with soft ellipses), not LogChamp.

Evidence:
- `client/public/manifest.webmanifest:6` — `"icons": []`
- `client/index.html:5` — `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
- `client/public/favicon.svg` — Vite default purple mark (48×46 viewBox)
- No `apple-touch-icon` link anywhere under `client/`
- No `rel="manifest"` under `client/` (grep clean); `client/vite.config.js` is React-only, no PWA plugin

**Change (interim typographic monogram):** Flat “LC” on champ dark surface (`#060913` — dark-theme `--color-bg` at `client/src/index.css:85`, champ default), no gradients. Ship:

| Asset | Size | Role |
|---|---|---|
| `client/public/icons/icon-192.png` | 192×192 | standard |
| `client/public/icons/icon-512.png` | 512×512 | standard |
| `client/public/icons/icon-maskable-512.png` | 512×512 | maskable (safe zone) |
| `client/public/apple-touch-icon.png` | 180×180 | iOS home screen |
| Optional: replace `favicon.svg` / add `favicon.ico` | small | tab icon |

Manifest entries (populate `icons` + keep name LogChamp):

```json
"icons": [
  { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
  { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

Also wire `<link rel="manifest" href="/manifest.webmanifest" />` and `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` in `client/index.html`. Real art replaces the monogram later.

**Size:** S — new PNGs under `client/public/`, `manifest.webmanifest`, `index.html` link tags; optional favicon swap.

---

## R3 - "This week" strip incoherence

**Now:** Home’s This-week band can show a large Workouts count beside 0 Sets and “not enough data” for Top set / Top gain. Same UI strip, not the same ledger.

Evidence — component + wiring:
- `client/src/pages/DashboardPage.jsx:189` — renders `<WeeklyReport />`
- `client/src/components/analytics/WeeklyReport.jsx:17-28` — shared rolling windows (today−6 … today, and prior week)
- **Workouts tile** (`WeeklyReport.jsx:161-165`, `38-44`, `212-216`): counts from `useActiveSession().sessions` filtered by **`completedAt`** in a **local** midnight window (`windowBounds` at `:31-35`)
- **Sets / Top set / Top gain** (`:192-195`, `:218-247`): from `analyticsApi.getSummary(windows.current)` (`:133-135`) — Sets = sum of `perMuscle.effectiveSets` (`:52-54`); Top set / Top gain from `perExercise`
- **Summary server path** (`server/src/controllers/analyticsController.js:147-153`): sessions filtered by **`performedAt`** in `[from, to]`; date-only `to` parsed as **UTC** end-of-day (`:128-129`); `from` via `new Date(rawFrom)` (UTC midnight for date-only strings). Sets are then enriched and aggregated — empty sessions contribute nothing to Sets/Top set/Top gain

**Mechanism (concrete):** The strip mixes two data sources and two timestamps. Workouts = client session list × `completedAt` × local calendar bounds. Sets / Top set / Top gain = `/analytics/summary` × session `performedAt` × UTC-parsed bounds × set aggregation. A completed session with no (resolvable) sets, or whose `performedAt` falls outside the summary window while `completedAt` falls inside, increments Workouts and leaves Sets at 0 with Top set/Top gain “not enough data.” Same window labels; different clocks and sources — that is the incoherence, not a display bug.

**Change:** One shared week window and one data source for the whole strip. Concretely: derive Workouts from the same summary payload (e.g. unique sessions that contributed sets in range, or an explicit `workoutCount` on `buildSummary`), using the same `performedAt` bounds the engine already uses — or stop counting client `completedAt` sessions that have zero sets in that summary. Client `weeklyReportWindows()` stays; delete the parallel `countWorkoutsInWindow(sessions, …)` path for the tile value.

**Size:** S–M — primarily `WeeklyReport.jsx`; optionally `server/src/analytics/summary.js` + controller if `workoutCount` is added server-side; small unit fixtures if the engine gains the field.

---

## R4 - Recent-workouts row friction

**Now:** Home recent workouts are a horizontal snap-scroll strip of fixed-width cards; titles clamp to two lines and clip mid-name on mobile (“Upper A (…”).

Evidence:
- `client/src/pages/DashboardPage.jsx:191-223` — section; maps up to 5 completed sessions (`:57-61`) into `<ul className="workout-tab-recent__scroll">` cards
- `client/src/index.css:4254-4297` — `overflow-x: auto`, `scroll-snap-type: x mandatory`, card `width: 150px`, title `-webkit-line-clamp: 2` + `overflow: hidden`
- View-all already exists: `DashboardPage.jsx:196-198` → `/sessions` (History)

**Change:** Vertical stack of the **3** most recent workouts, full-width rows, titles wrap (no clamp). Keep “View all → History.”

Reuse existing idioms:
- List container: `card sub-card-list` + row `sub-card` (`SessionsPage.jsx:71-75`, styles `index.css:5084-5094`) — full-width stacked rows, titles as links (History already does this)
- Or restyle `workout-tab-recent` to a column flex list of `card card--notched` rows (`DashboardPage.jsx:215` already uses notched cards) without the 150px width / line-clamp
- Slice `completedRecent` to `.slice(0, 3)` instead of 5

ASCII sketch:

```
Recent workouts                    View all → History
┌─────────────────────────────────────────────────┐
│ Upper A (Week 3)                                │
│ Jul 17, 6:42 PM                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Lower B                                         │
│ Jul 15, 7:10 PM                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Upper A (Week 2)                                │
│ Jul 13, 6:55 PM                                 │
└─────────────────────────────────────────────────┘
```

**Size:** S — `DashboardPage.jsx` (slice + markup), `client/src/index.css` (replace horizontal scroll rules for `.workout-tab-recent__*`).

---

## R5 - Empty-state dead space

**Now:** N6 two-variant empty analytics is landed. On data-light accounts, dark Home still paints a ~220px scene band under sparse content (`align-content: start` parks leftover height at the bottom), so the scene reads as empty real estate rather than product.

Evidence — analytics empty (N6):
- `client/src/pages/AnalyticsPage.jsx:584-641` — `isEmpty` when `perMuscle` and `perExercise` are both empty; **new user** (`exerciseIndex` length 0): “haven’t logged any sets yet…” + Log CTA; **has history, empty range:** “No sets in the last N weeks — try a longer range…”
- Exercises tab empty roster: `ExercisesView.jsx:492-501` — “No exercises logged yet…” + Log CTA
- Per-chart insufficient-data lines use muted “not enough data” / unlock copy (`BalanceScale.jsx:30-34` ghost track; Execution empty note `AnalyticsPage.jsx:399-403`)

Evidence — dashboard / scene dead space:
- `client/src/pages/DashboardPage.jsx:139-224` — masthead + hero + optional WeeklyReport (returns `null` when no week data, `WeeklyReport.jsx:170`) + recent empty copy only
- `client/src/index.css:3985-4019` — `.workout-tab` `align-content: start`; dark `::before` scene band `background-size: … auto 220px` at bottom

**Change:** Empty analytics surfaces tease the wedge — restrained **static** ghost previews (tokens-only, no new motion) plus one honesty-layer unlock line. Per surface:

| Surface | Ghost preview | Unlock line (voice) |
|---|---|---|
| Analytics muscles (new user / empty) | Faint horizontal volume bars + muted Balance scale track (reuse `balance-scale--ghost`) | “Log 3 workouts and this becomes your volume trend.” |
| Analytics strength | Faint sparkline silhouette / top-set row ghosts | “Log sets with weight and this becomes your strength trend.” |
| Analytics exercises roster | Ghost list of 3 placeholder exercise rows | “Log a workout to build your exercise history.” (tighten existing) |
| Analytics execution | Ghost plan-vs-actual row | Keep/extend: “Log workouts from a template with planned sets to unlock execution fidelity.” |
| Home (optional companion) | Do not invent a fake WeeklyReport; either keep hero-forward or a single static “This week” ghost stat row | “Finish a workout this week and your strip fills in here.” |

**Size:** M — `AnalyticsPage.jsx`, possibly small presentational ghosts in `client/src/components/analytics/*`, CSS tokens-only; Home optional S add-on.

---

## R6 - Login tagline

**Now:** Auth shell shows the wordmark then the tagline every new user reads first.

Evidence: `client/src/components/AuthLayout.jsx:11` — `Log your shit dog`

**Options for Seth (verbatim; no recommendation):**
- (a) keep it
- (b) “Know your numbers.”
- (c) “Every set, accounted for.”
- (d) “Log hard. Lift harder.”

Trade-off: brand personality vs first-impression risk on the auth surface.

**Change:** N/A until Seth picks — one-line string swap in `AuthLayout.jsx` when decided.

**Size:** S (when decided).

---

## R7 - PR detection

**Now:** The engine already computes the raw materials; the API even reserves an empty `prs` array; the UI openly says PR detection is coming.

Evidence — engine ride-ons:
- `server/src/analytics/aggregate.js:176-276` — per-exercise `e1rmSeries`, `topSet`, `topSetSeries`, `bestSet` (e1RM best)
- `server/src/analytics/exerciseDetail.js:10-12,151-158` — all-time `topSets`, `e1rmHistory`, totals; index via `buildExerciseIndex` (`:45-74`)
- `server/src/analytics/summary.js:113` — `prs: []` stub on every summary payload
- Controller all-time fetch: `analyticsController.js:32-72` (`fetchAllTimeEnrichedSets`, no date floor)

Evidence — UI PR-adjacent:
- `client/src/components/analytics/ExercisesView.jsx:384-387` — “Personal records” slot: “PR detection coming — milestones will show up here.”
- Strength / top-set surfaces elsewhere are trends, not PR flags (`StrengthTrendChart.jsx`, `StatTiles.jsx` Top set/Top gain)

**Change:** Pure module under `server/src/analytics/` (fixture-tested, no DB), detecting per exercise from history:
1. **Weight PR** — heaviest weight (existing topSet rule)
2. **Reps-at-weight PR** — most reps at a given weight
3. **e1RM PR** — best Epley (existing bestSet / e1rmTrend.best)

Surface:
- (a) Quiet flag chip on the set/session in History and exercise detail (e.g. small `pill` / muted “PR” next to the set — no confetti)
- (b) “PRs” section replacing the placeholder in Exercises detail (`ex-pr-slot`)

Wire `buildSummary.prs` for the week digest (R8) instead of leaving `[]`.

ASCII:

```
Exercise detail
┌ Personal records ─────────────────────────┐
│ Weight   225 × 5     Jul 12               │
│ e1RM     252         Jul 12               │
│ Reps@185 12          Jun 28               │
└───────────────────────────────────────────┘

History set row:  185 × 12  [PR]
```

**Size:** L — new `server/src/analytics/prs.js` (+ tests), `summary.js` / `exerciseDetail.js` wiring, `ExercisesView.jsx`, History/session set row chip, light CSS.

---

## R8 - Weekly insight digest

**Now:** Home WeeklyReport is a four-stat band (Workouts, Sets, Top set, Top gain) with vs-last-week deltas and a link to Analytics — not a narrative digest.

Evidence:
- `WeeklyReport.jsx:201-249` — stats grid; windows `:17-28`; summaries via `getSummary` `:133-135`
- Dashboard mount: `DashboardPage.jsx:189`
- Top gain helper: `client/src/lib/topGain.js` (imported `:6`)
- Empty-this-week nudge only: `:185-187`

**Change:** Extend into a Boostcamp-style in-app digest (no email):
- Volume by muscle vs prior week (from existing `perMuscle` on current + prior summaries)
- PRs this week (depends on R7)
- One execution-adherence line (from `summary.execution` / planVsActual — `server/src/analytics/planVsActual.js`)
- One nudge line from execution data (e.g. effort drift / volume adherence — same honesty voice as unlock copy)

Delta from today: keep the four headline stats (after R3 fix), add a short muscle volume delta list + PR line + execution/nudge prose under the stats; still “See analytics →”.

**Size:** M — mostly `WeeklyReport.jsx` + CSS; may need summary fields already present (`perMuscle`, `execution`) once R7 fills `prs`. Soft-depends on R7 for the PR line; muscle + execution lines can ship without it.

---

## R9 - Strength Score + imbalance headline

**NEEDS FABLE DESIGN PASS** — not build-ready. Scope only.

**Now:** Strength trends and Balance already exist; per-side L/R comparison is queued and must share the design pass.

Evidence:
- Strength: `aggregateExerciseMetrics` topSet/e1rm series (`aggregate.js`); UI `StrengthTrendChart.jsx`, Strength table on `AnalyticsPage.jsx`
- Balance: `computeBalanceRatios` → `pushPull`, `quadHam`, `frontRearDelt: null` (`aggregate.js:296-306`); UI `BalanceSection` / `BalanceScale` (`AnalyticsPage.jsx:283-309`, `BalanceScale.jsx`)
- Per-side: engine is side-blind today; QUEUE Candidates (`docs/tasks/QUEUE.md:581-588`) — “Per-side L/R comparison analytics … needs a Fable design pass first”; plumb `side` into enrichSet, splits in exerciseDetail, comparison UI

**Candidate shape (one sketch, not a contract):** A single relative Strength Score (e.g. composite of recent top-set / e1RM progress vs the user’s own baseline — not a CrossFit-style absolute) plus one Balance headline (“Push-biased this block” / “Balanced”) derived from existing ratios. L/R asymmetry, when designed, becomes a third headline or a drill-in — same unit family as the queued per-side work, not a solo ship.

**Change:** Design together with per-side L/R; no implementation block until Fable passes.

**Size:** L (when greenlit) — engine scoring module + Analytics/Home headline UI; file set TBD after design. **Blocked.**

---

## R10 - Never-gate-history guarantee

**Now:** Verified — nothing time-limits stored history or the all-time exercise index. Range chips only bound *views*, not retention.

Checked:
- `getMySessions` — `findMany({ where: { userId } })`, **no `take`**, no date floor (`sessionController.js:654-676`)
- `fetchAllTimeEnrichedSets` — all sessions for user, no date filter (`analyticsController.js:32-37`)
- `getExerciseIndex` — all-time enriched sets → `buildExerciseIndex` (`:246-254`; `exerciseDetail.js:45-74`)
- `getExerciseDetail` — all-time totals/topSets/e1rmHistory; `{ from, to }` bounds **only** `weeklyVolume` (`exerciseDetail.js:10-12,151-158`)
- `getSummary` — caller-supplied range only; no server-side max lookback (`analyticsController.js:93-153`)
- Client range presets max at 12 weeks for summary charts (`AnalyticsPage.jsx:24-28`) — UI window, not a history wall
- History page (`SessionsPage.jsx`) lists whatever `getMySessions` returns — full list

**Change:** Product copy stating the guarantee, honesty-layer voice. Candidate placements: auth surface (`AuthLayout` near tagline) and/or Profile/About (`HelloPage` or Profile). Proposed wording:

> “Your history stays yours — every set, no time limit.”

(Alternate: “We don’t wall off your past. All-time means all-time.”)

**Size:** S — copy in 1–2 JSX surfaces once placement is picked.

---

## Tier 2 - horizon

**Per-lift progressive-overload nudge.** Execution fidelity already compares planned vs actual load/volume/effort per exercise (`planVsActual.js`, Execution tab on `AnalyticsPage.jsx:384+`). A future nudge would read loadAdherence / top-set series and suggest the next session’s smallest honest bump — in-app, per lift, same restraint as PR chips.

**Mesocycle / block analytics.** Library already has multi-week **Blocks** (`MyTemplatesPage.jsx` blocks tab; `blockTemplateController.js`). Analytics today are session/set ranged, not block-scoped; the horizon shape is “this block vs last block” volume and adherence once sessions can be attributed to a block run.

**CSV export + year-end Wrapped.** No export path today. Horizon: downloadable set/session CSV from History or Profile, plus a seasonal Wrapped-style recap riding the same all-time index and (once built) PR module — shareable, not email-gated.

---

## Suggested wave order (advisory)

| Block | Items | Notes |
|---|---|---|
| **FP1 polish (file-disjoint UI)** | R1 + R6 (when decided) + R10 copy | `index.html`, `HelloPage`, `AuthLayout` / Profile — no server |
| **FP2 PWA icons** | R2 | `client/public/*`, manifest, `index.html` links — disjoint from FP1 if HelloPage not touched twice; else merge R1+R2 |
| **FP3 Home strip** | R3 + R4 | Same page (`DashboardPage` + `WeeklyReport` + recent CSS) — **serialize together**, not parallel |
| **FP4 empty ghosts** | R5 | Analytics components/CSS — disjoint from FP3 if Home ghost deferred |
| **FP5 PR engine + UI** | R7 | Server analytics + ExercisesView + set chips — judgment tier |
| **FP6 weekly digest** | R8 | After R3 (coherent strip) and ideally after R7 (PR line); can partial-ship muscle/execution without PRs |
| **Later / blocked** | R9 | After Fable design with per-side L/R candidate |
| **Horizon** | Tier 2 | Separate authoring when capacity exists |

File-disjoint pairs safe to batch: **(R1/R10)** with **R2**; **R5** with **R7** only if ExercisesView empty vs PR slot edits are carefully scoped (same file — prefer serialize). **R3+R4** collide on Home — one block.
