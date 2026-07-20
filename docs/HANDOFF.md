# HANDOFF — current state

**Updated:** July 20, 2026, twenty-ninth session (Opus, FRONTIER SEAT —
**PRE-MAIN GATE RUN; verdict PASS WITH FIXES; the one required fix
FPFIX1 authored, dispatched, and LANDED `f144fee` same session**).
Branch tip `0392e85`, pushed. **Seth's smoke is STILL OWED and is the
only thing between this branch and the merge ritual.**

**ORDER EXCEPTION, one time only, recorded so it does not become a
pattern:** Seth explicitly overrode the wave-end order ("this is a one
time exception, run the review and i will smoke before pushing to main,
this will never happen again"). The gate therefore ran BEFORE smoke —
the inversion `pre-main-review` section 0 exists to prevent. The
standing order is unchanged for every future wave: N/N -> smoke -> gate
-> merge. The cost is live: FPFIX1 changed engine behavior AFTER the
gate read the diff, so the 00c checklist covers a wave the gate never
reviewed in its final form.

**Gate fuel fanned out to three CURSOR report lanes** (never Claude
subagents, per the standing rule); reports kept in the session
scratchpad, not committed. Verification lane (auto): 195/195, build
green, check-hex clean — trustworthy, real output. Doc/tokens sweep
(auto): high quality, tokens-only confirmed clean wave-wide, its doc
findings folded into this rewrite. **Coverage lane (sonnet): NOT
TRUSTWORTHY, do not cite it** — it returned 22/22 SATISFIED while citing
`EmptyStateGhosts.jsx:648-666` for a 91-line file and resting verdicts
on "no build-breaking changes detected in diff" instead of a run. Its
conclusions were discarded and the load-bearing criteria re-verified by
hand (they DO hold). **Lesson for future gates: a report lane's line
numbers are checkable cheaply — spot-check them before using its
verdicts.**

**The blocking finding (now FIXED, kept short here because the full
diagnosis lives in `docs/tasks/fpfix1-standing-pr-semantics.md` and
QUEUE.md).** FP5 had shipped TWO implementations of the same PR
vocabulary in `server/src/analytics/prs.js`: `detectPRs` (correct) and
`computeStandingPRs` (a parallel reimplementation that drifted — it
selected `repsAtWeightPR` by global max reps ignoring weight, and
dropped first-session suppression). Net user-visible effect, reproduced
by node-eval at the gate rather than inferred: the Exercises "Personal
records" card rendered **"Reps - 45 lb x 20"** — a warmup set, dated to
a first session. Per-unit review could not have caught it: 24 solid
`detectPRs` fixtures but ONE `computeStandingPRs` fixture that passes
under both the buggy and the correct logic. Green tests, false
confidence — exactly the second-implementation class the gate exists
for.

**FPFIX1 LANDED `f144fee`** (authored -> dispatched -> audited -> landed
same session; Channel B named rung `--model opus`, chosen over auto
because FP5's two prior deliveries both under-verified on this exact
file). The fix is STRUCTURAL: `computeStandingPRs` now folds
`repsAtWeightPR` down from `detectPRs`' event stream, so the two
surfaces cannot diverge again by construction and suppression is
inherited rather than half-tracked. `weightPR`/`e1rmPR` deliberately
keep all-time-best behavior including first-session sets.
`getPRsForSet` deleted (zero callers, a third definition).
**ONE REVIEWER FIX on top, undeclared by the delivery** (trivia tier,
direct-fix exception): removing the vestigial `isFirstSession` block
also removed the chronological sort, making `weightPR`/`e1rmPR` tie
resolution depend on caller input order — proved by node-eval (same sets
reversed gave Jan 15 / 4 reps vs Jan 22 / 6 reps). Sort restored,
determinism fixture added. Lanes after: **198/198, build green.**

**Gate findings folded in rather than left open:** the Repo/deploy
inventory had omitted FP6 and overstated "deploys nowhere" (the branch
is HALF-deployed) — both corrected below; HANDOFF was 414 lines against
its ~300 cap — this rewrite ages the twenty-eighth session out and
compresses closed issues 8/9 and the merged NT/A-wave bullets. It is
still OVER the cap (~390 vs ~300) even after that — the resume
instructions at the head of "Next up" cost lines deliberately. Trim it
properly next session; the U5, Analytics-track, and Issues sections are
the remaining fat.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 19 **twenty-eighth** session (Sonnet resident —
FP5 bounce-1 fix landed `9eb7e8d`, FP6 dispatched and landed `0805064`)
and everything older, unchanged. Grep the archive by session number or
SHA when provenance matters.

Previous entries (incl. the July 10 sixth session in full, the July 10
Fable N-wave skeleton session, the July 9 spec-complete session and the
July 8 A-wave prod rollout) archived verbatim in
`docs/HANDOFF-ARCHIVE.md`.

**Rule:** rewritten in place at the end of every working session; kept
CAPPED (~300 lines: current state, repo/deploy, latest 1-2 session entries,
Open TODOs / Next up, short reference sections). Aged session logs move
VERBATIM — never summarized — to `docs/HANDOFF-ARCHIVE.md`, newest first,
in the same rewrite. Dated, never versioned. If this file looks stale
(date > ~2 weeks old), verify branch/deploy state from ground truth before
trusting it.

---

## Repo / deploy state

- **`frontier-parity-wave` is the ACTIVE wave branch, tip `0392e85`
  (July 20)** — off maintenance-wave HEAD `0206d30`. Carries the FULL
  wave: FP0 report `137e0ea`, FP1 `8dc799f`, FP2 `056be0c`, FP3
  `3de1749`, FP4 `d6180cf`, FP5 `9eb7e8d`, FP6 `0805064`, and the gate
  fix FPFIX1 `f144fee`, all pushed (`origin` HEAD confirmed `0392e85`).
  **Smoke-surface caveat, settle BEFORE running the checklist:** staging
  Render (the API) has tracked `main` since July 17, so the SERVER halves
  of this wave are deployed NOWHERE — FP2's `buildSummary.workoutCount`,
  FP5's PR-detection engine, and FPFIX1's standing-record fix all ride
  the server. The CLIENT halves DO deploy, via Vercel's per-branch build,
  so the branch is not "deployed nowhere" — it is half-deployed, which is
  the more dangerous state: the client degrades quietly
  (`currentSummary?.workoutCount ?? 0`) rather than erroring, so a stale
  server reads as "the fix didn't work" instead of as a deploy gap. Seth
  either repoints staging Render at `frontier-parity-wave` for the smoke
  or accepts that every server-derived number below is stale.
- **MW-WAVE MERGED to `main` (`3b325db`), July 17** — ff-only
  `c473e21..3b325db`, 35 commits, no merge commit, no migration. All 8
  MW units + the CW dev-tooling arc + the `a5294e3` pair-delete-confirm
  fix are fully contained in `main`. Gate PASSED (top entry); Seth's
  smoke PASSED in full (MW1/2/3/7 July 16, MW6+MW8 confirmed July 17).
  Staging Render REPOINTED to `main` July 17 (Seth) — the branch is a
  deletion candidate (gated).
- **NT-WAVE MERGED to `main` (`c473e21`), July 15** — NT1/NT2/NTFIX1/
  NT3/NTFIX2 + the relay v5/v5.1 docs, ff-only, no migration. Note
  `not-tracked-ux-wave` LIVES ON as the CW1 landing branch, so it is NOT
  a deletion candidate. SHAs and gate results in the archive.
- **A-wave MERGED to `main` (`13a1e59`), July 8** — A1/A4/A5/A6b + the
  db-host-guard split; prod DB migrated + seeded + smoked, gate clean.
  **Both catalog/linkage migrations are applied on STAGING
  (`ep-bitter-breeze-am81izlh`) and on PROD** as of July 7-8, verified by
  direct SQL (873 rows seeded, ledger drift-free). Branch is a deletion
  candidate (gated).
- **`main` is at `3b325db` (July 17)** — the MW-wave merge (above), on
  top of the NT-wave (`c473e21`), the N-wave (`8068ffb`) and the What's
  New prod-gate follow-up (`57b1fc8`). Prod Vercel/Render track `main`
  and auto-deploy on push. Prod deploy SHA VERIFIED == `3b325db` in
  Events July 17 (Seth) and prod smoke PASSED — no open
  deploy-verification debt (this also retires the never-recorded
  `c473e21` check).
- Username feature LIVE and verified on both environments (unchanged).

## Open TODOs (do at next session start)

1. Confirm prod Render serving cleanly post-recovery.
2. Low-priority: redundant spare stash on `ui-palettes-v2` (`WIP unrelated
   to ui-palettes-v2 merge`, July 1) — `git stash drop` once confirmed
   unneeded.
3. Low-priority: branch graveyard has grown — `ui-palettes-v2`,
   `analytics-engine`, `ui-loading-screens`, `ui-nav-overhaul`,
   `analytics-rebalance-wave`, `catalog-fk-wave` (all merged to `main`),
   `exercise-catalog-seed` (superseded by `3a6bc25`),
   `origin/cursor/prod-migrate-l1-l3-prep-0b4a` (moot), and now the local
   lane branches `cursor/pricing-probe` + `cursor/nt3-entry-deferability-
   polish` — all deletion candidates whenever Seth wants to ask for that
   gated op.

## U5 — UI overhaul (T1/T2/T3 MERGED TO MAIN, T4 not started)

**Plan:** T1 tokens -> T2 palettes -> T3 dynamic loading screens -> T4 motion.

- **T1 DONE**, **T2 DONE and merged to main** (`ccd0829`, July 1): all 5
  palettes on real raster scenes. **T3 DONE and merged to main** (`750c42b`,
  July 4). T4 (motion) not started; needs a frontier-seat design pass first.
- Full T2 fix-by-fix history: the July 1 morning HANDOFF in git history
  (`ec3d85a`).

## Next up (the active task)

**HOW TO RESUME THIS (read first if you are a fresh session).** State as
of July 20: the FP wave is code-complete except FP8, the pre-main gate
has RUN and PASSED WITH FIXES, and the one required fix landed. There is
NOTHING to author, dispatch, review, or gate. Do not re-run the gate, do
not start reading the branch diff, do not dispatch a Cursor lane.
The single open item is **Seth's smoke sign-off** (checklist at 00c).
Sequence from here, in order, no steps skipped:
1. Confirm ground truth first: `git log origin/frontier-parity-wave -1`
   should read `0392e85` (or later if a smoke-fix landed since).
2. Settle the Render repoint question with Seth (see the deploy caveat
   in "Repo / deploy state") — this is not optional; smoking a
   half-deployed branch produces false failures on every server-derived
   surface.
3. Hand him 00c. Wait. His findings are the input to whatever comes next.
4. PASS -> the merge ritual (`docs/RUNBOOK.md`), gated on his verbatim
   "push to main", one command at a time with approval before each.
   Code-only, NO migration. Report what merged with SHAs afterward.
5. DEFECT -> diagnosis block for Cursor, fix through `land-unit`,
   sign-off resets. Anything on the PR-card surface: read
   `docs/tasks/fpfix1-standing-pr-semantics.md` first, that surface
   changed after the gate reviewed the diff.
Any seat can run steps 1-3 and 5; step 4 is Seth's hands only.

00. **THE GATE IS DONE. THE ONLY OPEN ITEM IS SETH'S SMOKE.** The wave
   is code-complete except FP8, the pre-main gate RAN (July 20, verdict
   PASS WITH FIXES, top entry), and its one required fix FPFIX1 LANDED
   `f144fee`. Nothing is queued, nothing is in flight, and NOTHING SHOULD
   BE DISPATCHED — the queue is empty of ready units.
   **NEXT SESSION'S FIRST AND ONLY JOB: get Seth's smoke sign-off** on
   the checklist at 00c, against the staging deploy, with the Render
   repoint settled first (see the caveat in "Repo / deploy state" — the
   branch is HALF-deployed, and a stale server reads as "the fix didn't
   work"). Then STOP.
   **On sign-off:** the merge ritual — `docs/RUNBOOK.md`, gated behind
   Seth's verbatim "push to main", one command at a time with manual
   approval before each. Do NOT re-run the gate; it is done and its
   verdict stands. Code-only merge, NO migration.
   **If smoke finds a defect:** it becomes a diagnosis block for Cursor
   (per AGENTS.md), the fix lands through `land-unit`, and the sign-off
   resets. A defect in the PR-card / standing-records surface
   specifically should be read against FPFIX1's contract first
   (`docs/tasks/fpfix1-standing-pr-semantics.md`) — that surface changed
   after the gate read the diff.
   FP8 stays DRAFT until Seth's PNGs land in `claudefiledrop/`; it can
   follow the merge as its own small unit — his call, icons LAST by his
   rider.
00b. **Open judgment call Seth may want to settle before or after the
   merge (preference, not a defect):** FPFIX1 selects the standing reps
   record by HEAVIEST weight, so a lifter who has done both `100x8` and
   `200x5` sees "Reps - 200 lb x 5". Real record under the contract's
   rule; he may prefer most-reps-wins. One small block if he wants it.
00c. **Wave smoke checklist (FP1-FP6 + FPFIX1) — the whole wave, ONCE.**
   Read the deploy caveat in "Repo / deploy state" FIRST; the server
   halves are not deployed unless Render is repointed:
   - Home weekly report band: a week with real data shows up to 3
     muscle movers, a PR line when the week had PRs, one execution
     sentence, and at most one nudge line; a week with nothing new
     shows none of the four lines (band looks unchanged); both-empty
     and nudge-only states are unaffected
   - Completed session with a genuine PR: the set gets a small muted
     "PR" chip; a different exercise sharing that weight/reps in the
     same session does NOT get chipped; completed session pages load
     without console errors
   - **Personal records card (FPFIX1 — the gate fix, smoke this
     deliberately):** open an exercise you have trained across several
     sessions AND warmed up on. The card shows Weight and e1RM rows,
     and a **Reps row ONLY when a genuine reps-at-weight record
     exists**. A light warmup set must NEVER appear as the Reps record,
     and no row may be dated to that exercise's very first session. An
     exercise with only one session, or with no rep record yet, simply
     shows fewer rows — that is correct, not a bug
   - Tab title reads **LogChamp**; HelloPage welcome + save-to-home
     lines say LogChamp; the never-gate-history guarantee line renders
   - Home This-week strip: the Workouts tile now agrees with the
     Sets/Top-set windows (a session with zero countable sets shows 0
     workouts — intended); recent workouts are 3 vertical full-width
     rows with wrapping titles; View all works
   - Analytics Strength (chart AND table): noteworthy-first order with
     a muted "N exercises with a single session" Show/Hide line;
     Exercises roster defaults to **Active** with All one tap away; a
     deep link to a dormant exercise still opens its detail
   - Empty analytics (use a range with no sets): Muscles shows 4
     stepped ghost bars + ghost balance track + "Log 3 workouts and
     this becomes your volume trend."; the tabs above it reach the
     Strength (sparkline silhouette) and Execution (plan-vs-actual
     row) teases without a URL edit; a new account's Exercises tab
     shows 3 ghost roster rows between "No exercises logged yet." and
     the unlock line, Log CTA intact; ghosts read as muted furniture
     in all 4 palettes x light/dark and nothing in them is tappable
00d. **Open Seth items, unchanged:** the R6 tagline pick (one-line
   `AuthLayout.jsx` swap, kept out of every block until he decides);
   the FP8 icon PNGs into `claudefiledrop/` to flip it QUEUED (icons
   LAST by his rider); and the Cursor model-routing question he is
   taking to the frontier seat (facts gathered in the top entry — do not
   pre-empt it with doc edits).
   Reference: `docs/tasks/fp0-frontier-parity-report-FINDINGS.md`
   (landed `137e0ea`) is still the evidence base for every FP unit.
   R9 (Strength Score) + per-side design is DONE in
   `docs/specs/strength-score-per-side.md` — Opus authors SS1-SS3 from
   it after the FP core lands; gym context likewise in
   `docs/specs/gym-context.md` (G1 is migration-carrying = Seth's
   manual track).
0z. **MW-WAVE: FULLY CLOSED July 17.** Merged to main `3b325db`
   (ff-only), all three post-merge steps done by Seth same day: staging
   Render repointed to `main` (the cause of THIS wave's deploy caveat),
   prod SHA verified, prod smoke passed. `maintenance-wave` is a
   deletion candidate (gated).
0a. **Loose ends carried forward:** the CW3 visual sign-off on the
   next live watcher run. Finding **F** stays open independently
   ("Failed to fetch" = Render cold-start ranked cause; needs a live
   Network-tab repro, not code).
   **RULED July 20 (Seth): `docs/specs/cursor-token-savings-*` belongs
   to the workflow repo, not here - both files DELETED from workout-db.**
   Nothing lost: they were snapshotted into
   `C:\dev\the-poor-mans-agentic-workflow\source-material\` on 2026-07-12
   (data.json byte-identical; stats.md verbatim plus a provenance header)
   and the data is already published there as `docs/receipts-data.json`
   on the `receipts-wave` branch. The untracked `docs/parked/*` files
   still await Seth's ruling: commit here, or move to the workflow repo.
0b. **A-wave follow-up (non-urgent):** optional Step-7 historical backfill:
   `node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply`
   against prod for pre-A4 historical rows (Seth runs the write).
   Idempotent; safe to defer.
1. **T3C sprite loader upgrade** unblocks whenever Seth drops the Gemini
   frames in `claudefiledrop/` (currently holds two `.url` Discord-CDN
   shortcuts, not the expected transparent PNGs).
2. T4 motion (last unstarted U5 unit) — needs a frontier-seat design pass first.

## Analytics/catalog track — state

*Full architecture spec: `docs/specs/analytics-engine.md`. Product-direction
rationale: `analytics-engine-direction` memory. Full B1-B9 and A-wave build
history: `docs/HANDOFF-ARCHIVE.md` and QUEUE.md's Landed section.*

**Track B v1 (B1-B9) MERGED TO MAIN (`e9ce82c`, July 4). Track A MERGED TO
MAIN (`13a1e59`, July 8), prod migrated + seeded.** Track C (AI coach)
stays dead-last. Residual open items:

1. Validator surfaced 29 secondary-less compounds in the 675-exercise
   lifting subset — curation-skim candidate (A3), not urgent.
2. Integration test step-6 output (malformed-key seed behavior) still
   UNVIEWED.

## Other branches floating around

- `round-7-unify-set-row` (`f6c2a6f`) — set-row unification, parked,
  decision pending.
- `parked/unattributed-g-fix` (`532125d`, July 15) — local-only holding
  branch for the orphaned July 14 findings-fix work. **Its content is now
  LANDED as NTFIX2 (`888e44d`), so this branch is a deletion candidate**
  (gated) — it is no longer the only copy. Its commit message's
  "unattributed / no lanes run / scope creep" framing predates the
  provenance trace and is wrong; the QUEUE.md NTFIX2 entry and the top
  HANDOFF entry are the accurate record.

## Issues to open

1. Resolve connect-pg-simple `session` table drift (proposed: option (b)
   `@@ignore` soon).
2. Integration-suite isolation on shared staging — Neon copy-on-write DB
   branches would kill the FK-pollution flake; worth a spike.
3. User-defined exercise support for movements absent upstream (Bulgarian
   split squat, Pendlay row).
4. Favicon/PWA icon swap for LogChamp (needs an asset).
5. Long-term call on migration automation vs manual discipline.
6. Schema sentinel — see spec (`docs/specs/schema-sentinel.md`).
7. **Repo lives inside OneDrive** — already caused a `git stash` hang
   (worktree workaround exists) plus file-lock/sync-lag risk. Decision for
   Seth: move the repo out of OneDrive (e.g. `C:\dev\workout-db`) or
   exclude it from sync. Everything is committed+pushed, so the move is
   low-risk whenever chosen.
8. **CLOSED** (was: id-only `userExerciseId` stamp PATCH, from finding G,
   July 14). Fixed client-side in NTFIX2 `888e44d`, then server-side in
   MW2 (`sessionController.js` :531 guard + :575 stamping) — both merged
   to `main`. Full mechanism write-up in `docs/HANDOFF-ARCHIVE.md`.
9. **CLOSED** (was: "Use that name" could not stamp structural identity
   for CUSTOM exercises, from the July 15 gate). MW2 gave resolve rows a
   `userExerciseId` and made "Use that name" stamp it. Merged to `main`;
   detail in the archive.

**Maintenance-wave candidates (Seth, July 16):** all authored and landed
as MW1-MW8 except item 16 — a catalog + `searchCatalog` review pass,
which stays an open candidate and pairs with A3's 29 secondary-less
compounds (QUEUE.md). Full mapping and Seth's raw wording: this file's
git history at `5e3d981`, and the archive.

## Known tech debt (queued, not blocking)

- `DraftSessionSetRow` / `SessionSetRow` unification.
- Prisma 6->7 bump.
- Jest open handle.
- pg SSL deprecation.

## Notes / gotchas discovered

- **Two agents, one working tree (July 1):** when Cursor and Claude Code
  share a checkout: check `git status --untracked-files=all` immediately
  before every commit (untracked DIRECTORIES collapse to one line), wait
  for writes to settle, one agent commits at a time. (Relay v5's lane
  worktree sidesteps this for dispatched units — Cursor works in
  `C:\dev\worktrees\cursor-lane`, never the main tree.)
- **Windows env/PATH staleness (July 14):** a Claude Code session may not
  see User env-var/PATH changes even after a restart — read values from
  the registry inline and invoke new CLIs by full path.
- **Cursor CLI remembers the last-used `--model` (July 14):** a flagless
  `agent -p` run inherits the previous invocation's model. Always pass
  `--model` explicitly.
- Scene mock PNGs are design references with fake UI ghosted in — they live
  in `docs/design/mocks/`; never ship from `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until
  the push lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on
  device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate
  any DB.
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces this two ways: `assertSafeForBoot()` at server
  boot; `assertSafeForReset()` on the test/reset path, called explicitly
  by any new DB-connecting script at the top of `main()`.
- `npm run test:unit` is DB-free by construction; `npm test` still
  requires (and resets) the staging DB.
