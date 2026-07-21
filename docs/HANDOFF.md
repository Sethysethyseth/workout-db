# HANDOFF — current state

**Updated:** July 21, 2026, thirty-second session (Opus frontier seat —
**PRE-MAIN GATE PASSED AND THE FRONTIER-PARITY WAVE IS MERGED TO
`main`**). The gate ran the full accumulated branch diff
(`3b325db..90248f9`, 53 files, +5936/-673) against the specs and
task-block contracts: verdict **PASS**, no fix blocks. Seth then gave
the verbatim "push to main" trigger and the merge ran one command at a
time (RUNBOOK section 2, code-only, NO migration): ff-only
`3b325db..90248f9`, pushed, `origin/main` confirmed at `90248f9`.

**IMMEDIATE OPEN ITEMS (manual, none gated):**
1. **Verify the prod deploy SHA is `90248f9`** — Render
   `workout-db-l3gc` (prod) -> Events, and Vercel prod. The push
   triggered the deploy; a redeploy rebuilds the OLD HEAD until it
   picks up the push, so confirm the SHA before trusting it.
2. **Repoint staging Render back to `main`** — it is still on
   `frontier-parity-wave` from the wave smoke.
3. **Prod smoke** the changed surfaces once the deploy is live (PR
   chips, exercise-detail cards, weekly digest, e1RM validity window).

**Gate findings worth carrying:** one NON-BLOCKING observation, no fix
authored — the SessionDetailPage PR-chip window is the session's full
UTC calendar day, so two sessions on the SAME day could cross-chip only
if exercise identity + weight + reps coincide exactly (vanishingly
unlikely, and the set genuinely tied a record that day). Revisit only
if it ever surfaces in real use.

---

## WAVE SMOKE — SETH SIGNED OFF July 21 ("smoke test is passed, this
## looks much better")

No open smoke findings. The checklist below is preserved as the record
of what was verified, and as gate-fuel reference for the frontier seat.

Tested against the **staging Vercel deploy** (never local dev) on branch
`frontier-parity-wave`. Staging Render tracks this branch too (Seth
repointed it before smoking), so server-side fixes (FP9) were live
there for the first time this wave.

**New this round (FP9-FP11, the fixes for your July 20 smoke findings):**
- Exercises detail -> Personal records: the e1RM row reads as an
  estimate with its source set shown as provenance (e.g.
  "~267 lbs (from 160 lbs x 20)"), never as a performed set.
- Log a high-rep set (13+ reps) on an exercise whose real best is a
  lower-rep set: Working weight targets and the e1RM-derived numbers
  should NOT be inflated by the high-rep set.
- An exercise trained ONLY above 12 reps: e1RM / rep targets should show
  the existing "not enough data" unlock copy, not an error or a blank.
- Home weekly report band: a week with 2+ PRs on the SAME exercise
  names it once, with achievements grouped under it (reusing the PR
  chip from completed-set rows). 5+ PRs in a week shows 3 plus a quiet
  "+N more". The four digest lines (PRs/Movers/Execution/Note) should
  read as a ranked list, not four identical grey paragraphs.
- Exercises detail -> Top sets: five DISTINCT sets, no repeats (a set
  you hit 3 times should occupy one slot, not three) — open the browser
  console and confirm no duplicate-key warning.
- Exercises detail -> Working weight targets: should read as one curve
  (a ladder/bar visualization), not a bare two-column table. Muted
  out-of-range rows + footnote should still be there.
- Exercises detail -> Personal records: Weight/e1RM/Reps rows should
  each be visually distinguishable by kind (badges), with the e1RM row
  staying visually distinct as an estimate.

**Carried forward from earlier in the wave (worth a quick re-check,
should be unchanged):**
- Tab title and HelloPage read "LogChamp"; save-to-home-screen line
  correct; never-gate-history guarantee line renders.
- Home's This-week strip: Workouts tile agrees with the Sets/Top-set
  windows; recent workouts render as 3 vertical full-width rows.
- Analytics > Strength: chart and table both sort noteworthy-first, a
  muted "N exercises with a single session" toggle exists; Exercises
  roster defaults to Active with All one tap away.
- Analytics > Muscles with an empty range: 4 stepped ghost bars + the
  "Log 3 workouts..." unlock line, nothing tappable.
- Complete a session with a genuine PR: the set gets a small muted "PR"
  chip; a different exercise sharing that weight/reps in the same
  session does NOT get chipped; completed session pages load without
  console errors.
- Exercises detail -> Personal records: a Reps row appears ONLY when a
  genuine reps-at-weight record exists — never a warmup set, never
  dated to the exercise's first session.

Should a NEW defect surface later (e.g. during the gate's own drive, or
a future session), it re-enters as a diagnosis block and resets
sign-off — same protocol as before.

---

## Repo / deploy state

- **`main` is at `90248f9` (July 21)** — the frontier-parity-wave
  merge (ff-only from `3b325db`), pushed, `origin/main` confirmed.
  Carries FP0 `137e0ea`, FP1 `8dc799f`, FP2 `056be0c`, FP3 `3de1749`,
  FP4 `d6180cf`, FP5 `9eb7e8d`, FP6 `0805064`, FPFIX1 `f144fee`, FP9
  `a356e4a`, FP10 `6ddda4b`, FP11 `5ca24f4`, plus docs commits. Prod
  Vercel/Render track `main`; **deploy SHA verification is OPEN** (see
  the immediate items at top) — confirm Events shows `90248f9` before
  treating prod as shipped.
- **`frontier-parity-wave` is now MERGED and a deletion candidate**
  (gated). Only FP8 (icons) remains outside the wave's code-complete
  set — DRAFT, blocked on Seth's PNGs.
- **STAGING REPOINT IS OPEN:** staging Render still tracks
  `frontier-parity-wave` from the wave smoke — repoint it back to
  `main`. Once repointed, confirm the Events tab shows the `main` HEAD.
- MW-wave, NT-wave, A-wave (and now the FP wave) all merged and closed;
  their branches are deletion candidates (gated). Details in the archive.

## Next up (the active task)

1. **Close out the three open manual items at the top** — prod deploy
   SHA verify (`90248f9`), staging Render repoint to `main`, prod
   smoke. None are gated; all are browser/dashboard steps for Seth (or
   read-only confirmation for the next agent).
2. **FP8 (PWA icons)** is the only open FP unit — DRAFT, blocked on
   Seth dropping icon PNGs into `claudefiledrop/`. Icons LAST by his
   rider. Flip to QUEUED once the PNGs land.
3. Wave is otherwise DONE. Next roadmap work is a fresh planning pass
   (frontier seat) against `fp0-frontier-parity-report-FINDINGS.md` and
   the parked specs — see the open Seth items below.

**00b. Open judgment call, now CLOSED:** the standing reps-record rule
(heaviest-weight vs most-reps) — Seth chose to keep heaviest-weight, no
change needed.

**00c. PARKED by Seth: the block builder.** "don't do anything with the
block builder for now, that's for another wave." Evidence preserved in
`docs/specs/block-execution-gap.md` (`267271c`) — the multi-week layer
(`BlockTemplate` -> `BlockWeek` -> `BlockWorkout` -> `BlockWorkoutSet`)
is fully authored in schema + API + builder UI but CANNOT BE TRAINED: no
start-session-from-block, `WorkoutSet.blockWorkoutSetId` never written
anywhere in `server/src/`, "set as current" is localStorage only, and
`planVsActual` has no `BlockWorkoutSet` branch. The doc states the fork
(finish it vs cut the dead-end UI) without picking. **Do NOT author
against it.** Do NOT ask Seth about it again either — he already ruled.
It also records a separate concern found on the way: Execution reads
planned values LIVE from `TemplateSet` rather than snapshotting, so
editing a template retroactively changes what past sessions are judged
against.

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

**Dispatch-mechanism lessons from the thirtieth/thirty-first sessions**
(detached-launch fix for the background-task reap bug, the
DELIVERY.md-is-gitignored staleness trap, killed-run salvage) are
preserved verbatim in `docs/HANDOFF-ARCHIVE.md` — still load-bearing for
future dispatches, just moved out of the capped file.

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
- **`DELIVERY.md` is gitignored** — check lane cleanliness by TIMESTAMP
  on the file, not by `git status` (a stale report reads as "clean").
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
