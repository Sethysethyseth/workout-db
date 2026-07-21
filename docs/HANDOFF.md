# HANDOFF — current state

**Updated:** July 20, 2026, thirtieth session (Opus, FRONTIER SEAT —
**Seth's smoke came back with findings; the wave is NOT merging yet.
FP9-FP11 authored from three recon lanes; FP9 + FP10 DELIVERED and
AWAITING REVIEW; FP11 queued behind them**). Branch tip `267271c`,
pushed.

**SETH'S RULING, July 20 — the wave does NOT go to main yet:** "this is
not getting pushed to main, we will edit and improve upon this wave
before pushing to main." His smoke passed functionally ("things looked
good") but surfaced one real engine defect and a presentation critique.
So: **the July 20 pre-main gate verdict is now STALE** — it read a diff
that predates FPFIX1's final form and all of FP9-FP11. The gate MUST be
re-run after the new units land and Seth re-smokes. Do not treat the
earlier PASS WITH FIXES as live.

---

# ASK SETH THESE QUESTIONS FIRST — DO NOT GUESS, DO NOT PROCEED PAST THEM

**Seth's explicit instruction closing the thirtieth session: "make sure
the next agent knows this and asks me the right questions."** Five
decisions below are HIS, not yours. Several were made unilaterally by the
frontier seat this session to keep the wave moving; they are all still
cheap to reverse RIGHT NOW and expensive to reverse after FP11 lands.
Ask them as a batch at session start (AskUserQuestion is the right
vehicle), give a recommendation with each — he invites tested pushback
and wants a named criterion, not a menu — and then act.

**Q1. Repoint staging Render to `frontier-parity-wave`, or accept stale
server numbers?** BLOCKING — settle before ANY smoke.
Staging Render has tracked `main` since July 17, so every server-side
change in this wave deploys nowhere, INCLUDING FP9's engine fix, which is
the entire point of the arc. The client degrades quietly rather than
erroring, so a stale server reads to a smoker as "the fix didn't work."
*Recommendation: repoint.* Smoking FP9 against a `main` server cannot
validate it, and a false failure costs a whole diagnosis cycle.

**Q2. Is the 12-rep Epley window right?** This is a DOMAIN call about his
sport, and the frontier seat picked it alone.
FP9 nulls `epley` above 12 reps. Consequence he should hear plainly: an
exercise he has ONLY ever trained above 12 reps will show no e1RM, no
rep targets, and no e1RM PRs at all — by design, routed to the existing
unlock copy. 10 would be more conservative and would churn three more
fixtures; 15 would match the rep-target ladder's emit ceiling.
*Recommendation: keep 12* — conventional edge of Epley credibility, and
it keeps the existing 10- and 12-rep fixtures honest. But if he lifts
high-rep often, he is the one who knows whether losing e1RM there hurts.

**Q3. Does he want to EYEBALL FP10 before it lands, or land-then-smoke?**
FP10 is delivered but encodes two unreviewed frontier-seat choices: it
reuses `.session-set-pr-chip` (the badge from completed set rows) on
Home, and it groups PRs by exercise so the name appears once. He asked
for "between too much and too simple" and never saw the interpretation.
*Recommendation: land it and let him judge it in the re-smoke* — it is
reversible, and a screenshot out of context is worse evidence than the
real surface. But offer the bounce.

**Q4. FP11 design direction — last cheap moment.** FP11 is QUEUED and NOT
dispatched. Same aesthetic brief, three cards (Working weight targets,
Top sets, Personal records). Its one non-obvious contract call: Top sets
dedupes by `(weight, reps)` keeping the EARLIEST date, on the theory that
a top set is an achievement and the first time you hit it is the record —
matching the vocabulary `computeStandingPRs` already uses. If he'd rather
see the most RECENT occurrence, that is a one-line change now and a
bounce later.

**Q5. The standing reps-record rule (carried from the 29th session,
never answered).** FPFIX1 picks the standing reps record by HEAVIEST
weight, so a lifter who has done both `100x8` and `200x5` sees
"Reps - 200 lb x 5". Real record under the contract; he may prefer
most-reps-wins. One small block either way.

**DO NOT ask about the block builder.** He ruled it PARKED for another
wave (item 00c). Raising it again is re-litigating a closed decision.

---

**Session resumed July 21 — Seth answered all five questions (Render
already repointed to `frontier-parity-wave`; keep 12-rep window; land
FP10 then smoke; FP11 dedupe stays earliest-date; reps-record rule stays
heaviest-weight, no change).** Landing FP9 and FP10 now.

- **FP9 LANDED `a356e4a`.** Audited per `land-unit`: lanes re-run fresh
  in the lane worktree (202/202 unit, client build clean, check-hex
  clean), diffs hand-verified against every acceptance criterion, no
  deviations. Full detail in QUEUE.md's FP9 entry.
- **FP10** in `C:\dev\worktrees\cursor-lane-2` (branch `cursor/fp10`),
  exit 0, DELIVERY.md written. Self-reports 198 unit tests, build clean,
  check-hex clean. Its log mentions an npm install in the lane — VERIFIED
  no package.json/lockfile mutation (porcelain shows only WeeklyReport.jsx
  + index.css), so gate item 5 was not tripped, but re-verify at audit.
  **NOT YET AUDITED** — up next.

## THE SMOKE FINDINGS (what this wave now exists to fix)

**1. e1RM was fabricating numbers — the serious one.** Seth logged one
set of `160 lbs x 20` on bench. `estimateOneRepMax`
(`server/src/analytics/setMetrics.js:7-16`) computes Epley
`weight * (1 + reps/30)` with NO rep bound (only Brzycki is guarded, at
its reps>=37 singularity), so that set produced e1RM 266.7 and became
the all-time best. It cascaded to FIVE surfaces: the Personal-records
e1RM row, the Home weekly PR line, the Home "TOP GAIN +32 lbs
estimated 1RM" tile, the e1RM history sparkline, and — worst — the
**"Working weight targets" card, which INVERTS bestE1rm to PRESCRIBE
working loads.** Arithmetic verified against his screenshot: with
bestE1rm 266.7 the card told him 227.5x5 when his real best five was
220x5, ~3.5% inflated. A prescriptive surface silently inflated by a
warmup-grade set is a trust defect, not a cosmetic one.
**Seth wondered about a lbs/kg bug — RULED OUT conclusively.** Stored
weights are unit-agnostic and never converted
(`client/src/lib/weightUnitPref.js:3-7`); display helpers only append a
label. It is pure uncapped Epley arithmetic.
**Separately**, the Personal-records card rendered the estimate AS A
PERFORMED SET ("266.7 lbs x 20") because `formatPRValue`
(`ExercisesView.jsx:246-254`) routed `e1rmPR` through the same
`weight x reps` branch as `weightPR`. Home's PR line already did this
correctly — it was one formatter, not a systemic pattern.

**2. "The UX isn't very pleasing and it's quite plain."** Seth's words,
about the Home PR line, Working weight targets, and Top sets. His brief:
"find something in between too much and too simple." Root cause is
uniform: the server ships fully STRUCTURED data and the client flattens
it into run-on sentences and undifferentiated lists. All four Home
digest lines render as identical `muted small` paragraphs; the PR line
repeats the full exercise name per PR.

**3. Top sets has a real defect, not just plainness.** No dedupe at
`exerciseDetail.js:213-223` — three working sets of 220x5 take three of
the five slots — AND the React key `${performedAt}-${weight}`
(`ExercisesView.jsx:422`) omits reps, so those rows DUPLICATE React keys.

## Repo / deploy state

- **`frontier-parity-wave` is the ACTIVE wave branch, tip `267271c`**,
  pushed (`origin` confirmed). Carries FP0 `137e0ea`, FP1 `8dc799f`,
  FP2 `056be0c`, FP3 `3de1749`, FP4 `d6180cf`, FP5 `9eb7e8d`, FP6
  `0805064`, FPFIX1 `f144fee`, plus this session's two docs commits:
  `65092f5` (FP9-FP11 blocks) and `267271c` (block-execution-gap spec).
- **DEPLOY CAVEAT, unchanged and still load-bearing:** staging Render
  (the API) has tracked `main` since July 17, so the SERVER halves of
  this wave deploy NOWHERE — including FP9's engine change, which is the
  whole point of the fix. The CLIENT halves DO deploy via Vercel's
  per-branch build. Half-deployed is the dangerous state: the client
  degrades quietly rather than erroring, so a stale server reads as "the
  fix didn't work." **Settle the Render repoint with Seth BEFORE any
  re-smoke.**
- **`main` is at `3b325db` (July 17)** — the MW-wave merge. Prod
  Vercel/Render track `main`, deploy SHA verified, prod smoke passed. No
  open deploy-verification debt.
- MW-wave, NT-wave, A-wave all merged and closed; their branches are
  deletion candidates (gated). Details in the archive.

## Next up (the active task)

**HOW TO RESUME (read first if you are a fresh session).** Seth said
"stand clear for now" at the end of this session — he has NOT asked for
the next step to run. Do not dispatch or land anything until he says go.

0. **ASK THE FIVE QUESTIONS** in the block at the top of this file
   FIRST, as a batch, before touching anything. Q1 (Render repoint) and
   Q2 (the 12-rep window) gate real work; Q3/Q4 are cheap now and
   expensive after FP11. This is Seth's explicit standing instruction
   from the thirtieth session, not a suggestion.
1. Confirm ground truth: `git log origin/frontier-parity-wave -1` should
   read `aab6083` or later.
2. **Audit and land FP9 and FP10** via the `land-unit` skill — they are
   sitting in `cursor-lane` and `cursor-lane-2`, unaudited. Land them
   SERIALLY (one commit per unit) even though they ran in parallel.
   Re-run lanes fresh; do not trust the DELIVERY reports.
3. **Then dispatch FP11** (`docs/tasks/fp11-exercise-detail-cards.md`).
   It is SERIALIZED behind both — it shares `ExercisesView.jsx` with FP9
   and `index.css` with FP10.
4. **Then Seth re-smokes** the whole wave (old checklist in the archive's
   29th-session entry at item 00c, PLUS the three new units). Settle the
   Render repoint first.
5. **Then re-run the pre-main gate** (`pre-main-review`). The July 20
   verdict is stale — this is not optional.
6. Merge stays behind Seth's verbatim "push to main", one command at a
   time. Code-only, NO migration.

**FP9-FP11, the smoke-findings arc (authored this session, in QUEUE.md):**
- `fp9-e1rm-validity-window.md` — 1-12 rep window on Epley applied at the
  SINGLE PRODUCER (not per-consumer: ~10 consumers all already null-check,
  and per-consumer filters would recreate FPFIX1's two-implementations
  bug), plus `e1rmPR` rendering as an estimate with provenance. The window
  bound is 12 by contract; the rep-target ladder already refuses to EMIT
  above 15 for the same reason, and 12 keeps existing 10/12-rep fixtures
  honest. Expected fixture changes were called out in the block:
  `setMetrics.test.js:28-32` currently ASSERTS uncapped epley at 37 reps
  (it pins the bug) and `prs.test.js:330-354` uses a 45x20 warmup.
- `fp10-weekly-digest-hierarchy.md` — structured PR rows grouped by
  exercise reusing `.session-set-pr-chip`, 3 + "+N more", rank across the
  four digest lines. Presentation only.
- `fp11-exercise-detail-cards.md` — Top sets dedupe by `(weight,reps)`
  keeping the EARLIEST date (matches the record vocabulary
  `computeStandingPRs` established), React key fix, visual pass on the
  three cards. QUEUED, not yet dispatched.

**OPEN — Seth has not weighed in on FP10/FP11 design direction.** They
were dispatched to avoid stalling the wave, but the contracts encode two
frontier-seat choices: reusing the session-page PR chip on Home, and
grouping PRs by exercise. If he dislikes either, bounce cheap.

**00b. Open judgment call, carried forward:** FPFIX1 selects the standing
reps record by HEAVIEST weight, so `100x8` + `200x5` shows "Reps - 200 lb
x 5". Real record under the contract; Seth may prefer most-reps-wins. One
small block if he wants it.

**00c. PARKED by Seth: the block builder.** "don't do anything with the
block builder for now, that's for another wave." Evidence preserved in
`docs/specs/block-execution-gap.md` (`267271c`) — the multi-week layer
(`BlockTemplate` -> `BlockWeek` -> `BlockWorkout` -> `BlockWorkoutSet`)
is fully authored in schema + API + builder UI but CANNOT BE TRAINED: no
start-session-from-block, `WorkoutSet.blockWorkoutSetId` never written
anywhere in `server/src/`, "set as current" is localStorage only, and
`planVsActual` has no `BlockWorkoutSet` branch. The doc states the fork
(finish it vs cut the dead-end UI) without picking. **Do NOT author
against it.** It also records a separate concern found on the way:
Execution reads planned values LIVE from `TemplateSet` rather than
snapshotting, so editing a template retroactively changes what past
sessions are judged against.

**00d. Open Seth items, unchanged:** the R6 tagline pick (one-line
`AuthLayout.jsx` swap); FP8 icon PNGs into `claudefiledrop/` to flip it
QUEUED (icons LAST by his rider); the Cursor model-routing question.
Reference: `docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`)
is still the evidence base for every FP unit. R9/per-side is spec'd in
`docs/specs/strength-score-per-side.md` (SS1-SS3 after FP core lands);
gym context in `docs/specs/gym-context.md` (G1 is migration-carrying =
Seth's manual track).

**0a. Loose ends:** CW3 visual sign-off on the next live watcher run.
Finding **F** stays open ("Failed to fetch" = Render cold-start ranked
cause; needs a live Network-tab repro). The untracked `docs/parked/*`
files still await Seth's ruling: commit here, or move to the workflow
repo.

**0b. A-wave follow-up (non-urgent):** optional Step-7 historical
backfill: `node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then
`--apply` against prod. Idempotent; safe to defer.

**1.** T3C sprite loader upgrade unblocks whenever Seth drops the Gemini
frames in `claudefiledrop/`. **2.** T4 motion (last unstarted U5 unit) —
needs a frontier-seat design pass. U5 T1/T2/T3 are DONE and merged to
main (`ccd0829`, `750c42b`).

## OPERATIONAL LESSONS FROM THIS SESSION (read before dispatching)

**1. Background-task dispatch gets REAPED — launch detached instead.**
Three consecutive dispatches were KILLED mid-run. Diagnosis, with
evidence: the named `opus` rung answered a PONG probe in 10s (healthy —
NOT quota, NOT auth, so the fallback ladder was the wrong response);
short runs survived (recon lanes 2-3 min); and FP9 + FP10 both died at
~6 min **simultaneously despite a 30s stagger** — two independently
started tasks dying at one instant means an external reap of the
harness's background children, not per-task timeouts.
**The fix is mechanism, not rung:** launch via `Start-Process pwsh
-WindowStyle Hidden` running a small generated `.ps1` that sets
`CURSOR_API_KEY`, cds to the lane, and redirects `*>` to a log file.
Detached from the task tree, both units then completed exit 0. Scripts
and logs from this session are in the session scratchpad as
`run-fp9.ps1` / `fp9-run.log`. Fold this into `dispatch-unit` section 2.

**2. `DELIVERY.md` IS GITIGNORED (`.gitignore:48`) — so
`git status --untracked-files=all` reports a lane CLEAN while it still
holds a stale report.** This session read a two-day-old gate report as
if it were fresh recon and nearly fed it into contract authoring; caught
by mtime. **Check lane cleanliness by TIMESTAMP on DELIVERY.md, not by
git status.** This compounds the 29th session's lesson (a report lane
that invented line numbers) — that makes two near-misses in two sessions
from trusting report lanes without a cheap spot-check.

**3. Partial work from a killed run is worth preserving, not resuming.**
Both killed lanes held real, largely CORRECT work (FP9's core change was
already contract-perfect). Saved as `PARTIAL-fp9.patch` /
`PARTIAL-fp10.patch` in the scratchpad, then the lanes were RESET rather
than resumed — a half-finished run with no DELIVERY.md is unverified by
definition, and re-running from a dirty tree confuses the agent.

**4. Recon fan-out earned its keep.** Three Cursor report lanes
(exec-blocks / ux-surfaces / e1rm-blast, `--model auto`, session-scoped,
reports NOT committed) produced the file:line evidence behind every
contract in this arc — including the block-execution finding Seth had
asked about directly, and the Top-sets duplicate-React-key defect nobody
had noticed. Reports preserved in the scratchpad as `RECON-*.md`.

## Analytics/catalog track — state

*Spec: `docs/specs/analytics-engine.md`. Direction rationale:
`analytics-engine-direction` memory. Build history: archive + QUEUE.md.*

Track B v1 (B1-B9) MERGED (`e9ce82c`). Track A MERGED (`13a1e59`), prod
migrated + seeded. Track C (AI coach) stays dead-last. Residual: (1)
validator surfaced 29 secondary-less compounds in the 675-exercise
lifting subset — curation-skim candidate (A3), not urgent; (2)
integration test step-6 output (malformed-key seed behavior) still
UNVIEWED.

## Other branches / issues / debt

- `round-7-unify-set-row` (`f6c2a6f`) — parked, decision pending.
- `parked/unattributed-g-fix` (`532125d`) — content LANDED as NTFIX2
  (`888e44d`); deletion candidate (gated). Its commit message's
  "unattributed / scope creep" framing predates the provenance trace and
  is WRONG — QUEUE.md's NTFIX2 entry is the accurate record.
- Branch graveyard has grown (many merged-to-main branches + local lane
  branches); all deletion candidates whenever Seth asks for that gated op.
- **Issues to open:** connect-pg-simple `session` table drift (proposed:
  `@@ignore`); integration-suite isolation on shared staging (Neon
  copy-on-write branches would kill the FK-pollution flake); user-defined
  exercise support; favicon/PWA icon swap; migration automation vs manual
  discipline; schema sentinel (`docs/specs/schema-sentinel.md`); **repo
  lives inside OneDrive** (already caused a `git stash` hang — decision
  for Seth: move to `C:\dev\workout-db` or exclude from sync; everything
  is pushed, so the move is low-risk). Closed: issues 8 and 9 (id-only
  `userExerciseId` stamp, and "Use that name" structural identity) — both
  fixed and merged; detail in the archive.
- **Maintenance-wave candidates:** all landed as MW1-MW8 except item 16,
  a catalog + `searchCatalog` review pass, which pairs with A3.
- **Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
  `SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
  deprecation.

## Durable gotchas

- **Two agents, one working tree:** check `git status
  --untracked-files=all` immediately before every commit (untracked
  DIRECTORIES collapse to one line), let writes settle, one agent commits
  at a time. Relay v5's lane worktrees sidestep this for dispatched units.
- **Windows env/PATH staleness:** a session may not see User env-var/PATH
  changes even after a restart — read from the registry inline
  (`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')`) and
  invoke new CLIs by full path.
- **Cursor CLI remembers the last-used `--model`** — always pass it
  explicitly; a flagless run silently inherits the previous invocation's.
- Cursor's agent binaries run as `node.exe` under
  `cursor-agent\versions\` — a `ProcessName -like "*cursor*"` filter
  returns 0 and looks like "the run died." Match on the PATH instead.
- Scene mock PNGs are design references — `docs/design/mocks/`, never
  ship from `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until
  the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on
  device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate
  any DB.
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces it at boot (`assertSafeForBoot()`) and on the
  test/reset path (`assertSafeForReset()`, called explicitly by any new
  DB-connecting script at the top of `main()`).
- `npm run test:unit` is DB-free; `npm test` requires (and resets) the
  staging DB.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines). Aged session logs move VERBATIM — never summarized —
to `docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated,
never versioned. If this file looks stale (date > ~2 weeks old), verify
branch/deploy state from ground truth before trusting it.
