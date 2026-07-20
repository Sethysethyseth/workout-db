# HANDOFF — current state

**Updated:** July 19, 2026, twenty-eighth session (Sonnet resident —
**FP5 BOUNCE 1 FIX LANDED `9eb7e8d`**). Continued from the twenty-
seventh session's bounce; picked up the SAME lane
(`C:\dev\worktrees\cursor-lane`, branch `cursor/fp5-pr-detection`)
exactly as the handover specified.

**Wave state: 5 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf`, FP5 `9eb7e8d` (plus the FP0
report `137e0ea`). Branch `frontier-parity-wave`, all pushed to
origin, deploys nowhere (staging Render tracks `main`). Only FP6
(gated, now unblocked) and FP8 (DRAFT, waiting on Seth's icon PNGs)
remain.

**FP5 re-dispatched on the bounce channel (named rung, `--model
opus`, same lane), then landed after a reviewer-driven live audit.**
Cursor's bounce-fix delivery threaded `setHasPR` through as a real
prop (F1) and re-keyed the chip match to include `exerciseName` (F2
partial); lanes came back fresh and green (195/195 in 15 suites, build
green, check-hex clean). But its OWN evidence for F1 repeated exactly
the mistake the bounce warned against — it claimed "Vite/esbuild catch
undefined variable references at bundle time" (false for plain JS
runtime errors) and punted the actual browser-drive/render-test proof
to Seth as "manual verification steps." Given this is a second
engagement on the same unit, the reviewer did not trust the writeup
and drove the completed view live instead of accepting it or bouncing
a third time: copied the main tree's staging `.env` into the lane's
`server/`, started server + client dev instances there
(`VITE_API_URL` pointed at the local server, not prod), registered a
throwaway test account, and built a two-session fixture via direct API
calls designed to hit exactly the F2 scenario (session A baseline —
Bench 135x5, Curl 200x5, completed; session B — Bench 145x5, a real
weight+e1RM PR, Curl 145x5 sharing that exact weight/reps but NOT a PR
for curl) and loaded session B's completed view in a real browser.
Found the delivery's F2 fix was still built on `exerciseName` alone,
not identity as the block explicitly asked — fixed directly (trivia
tier, not a third bounce): added a `prMatchKey(exerciseId,
userExerciseId, exerciseName)` helper keyed on `se.exerciseId`/
`se.userExerciseId` (confirmed present on the full session-exercise
row) matching `pr.identity` from `summary.js`'s `identityFromKey`, with
a name fallback. Then found a SECOND, undeclared defect only visible by
actually loading the page: the chip could never render at all, because
`setHasPR`'s date-scoping compared `session.performedAt` to each PR's
`performedAt` for EXACT millisecond equality — but `session.performedAt`
reflects the most recently written SET's timestamp, not any specific
PR set's, so the check was always false. Fixed by dropping it (also
trivia tier): the summary fetch's own `from`/`to` window already scopes
PRs to the session's calendar day, so no extra date check was needed.
Re-verified live after both fixes: exactly one PR chip rendered,
correctly attributed to Bench Press and NOT Bicep Curl, zero console
errors. Lanes re-run fresh once more post-fix (195/195, build green,
check-hex clean). Verification servers torn down, the copied `.env`
deleted from the lane afterward; only staging Neon
(`ep-bitter-breeze-am81izlh`) touched, never prod. Lane rebased onto
`d1cd3fb` then ff-merged `9eb7e8d`, pushed, origin HEAD confirmed. Full
narrative (including the kept engine-half audit from bounce 1) in
QUEUE.md's FP5 entry.

**Standing question Seth raised, still NOT actioned (his call to take
to a Fable agent):** whether big/complicated waves should route Cursor
to frontier models. This session adds a second data point for that
conversation — FP5's bounce-fix delivery itself needed two more
reviewer-caught fixes even after landing on the named rung, both of
the "the block already said what to do, the delivery just didn't do
it or verify it" shape, same as the ambiguity pattern noted last
session. Facts already gathered (last session): `cursor-agent
--list-models` carries `claude-opus-4-8-thinking-high` and
`claude-fable-5-thinking-high` (both 1M, flagged **NO ZDR** on the
Fable variant); `dispatch-unit` passes bare aliases (`--model opus`)
rather than exact ids. Seth owns raising this; no docs changed for it.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 19 **twenty-seventh** session (Opus resident —
FP4 landed `d6180cf`, FP5 dispatched on the named rung and BOUNCED with
the F1/F2 findings recorded above) and everything older, unchanged from
prior rewrites. Grep the archive by session number or SHA when a
decision's provenance matters; the still-live conclusions are all
carried in QUEUE.md's per-unit records, the `-FINDINGS.md` files, and
the sections below.

- **N-wave follow-ups — folded into "Next up" 0a (July 16):** all three
  items run against `c473e21`, with the staging repoint target now
  `maintenance-wave` (amended twice: analytics-rebalance-wave ->
  not-tracked-ux-wave -> maintenance-wave; only the last is current).

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

- **`frontier-parity-wave` is the ACTIVE wave branch (July 19)** — off
  maintenance-wave HEAD `0206d30`. Now carries real code: FP0 report
  `137e0ea`, FP1 `8dc799f`, FP2 `056be0c`, FP3 `3de1749`, FP4
  `d6180cf`, FP5 `9eb7e8d`, all pushed. **Smoke-surface caveat, verify
  before the wave smoke:** staging Render (the API) has tracked `main`
  since July 17, so the SERVER halves of this wave are not deployed
  anywhere. FP2's `buildSummary.workoutCount` and FP5's PR-detection
  engine are both server changes riding this. The client halves ride
  Vercel's per-branch deploy as usual. Seth either repoints staging
  Render at `frontier-parity-wave` for the smoke or accepts that
  server-derived numbers are stale — settle this BEFORE running the
  checklist below, or the affected surfaces will look unfixed.
- **MW-WAVE MERGED to `main` (`3b325db`), July 17** — ff-only
  `c473e21..3b325db`, 35 commits, no merge commit, no migration. All 8
  MW units + the CW dev-tooling arc + the `a5294e3` pair-delete-confirm
  fix are fully contained in `main`. Gate PASSED (top entry); Seth's
  smoke PASSED in full (MW1/2/3/7 July 16, MW6+MW8 confirmed July 17).
  Staging Render REPOINTED to `main` July 17 (Seth) — the branch is a
  deletion candidate (gated).
- **NT-WAVE MERGED to `main` (`c473e21`), July 15** — NT1 `f4baee3` +
  NT2 `f26e783` + NTFIX1 `e0ba383` + NT3 `98963f6` + NTFIX2 `888e44d` +
  the relay v5/v5.1 docs are all fully contained in `main`, ff-only
  (`57b1fc8..c473e21`, 28 commits, no merge commit). Gate DONE (results
  in the top entry). No migration — code-only deploy.
  **`not-tracked-ux-wave` LIVES ON as the CW1 landing branch** (a
  concurrent July 15 session authored CW1 `38119e3` and flipped it
  DISPATCHED `2a34b16` on top of the merge point) — so it is NOT a
  deletion candidate yet, unlike the usual post-merge wave branch.
  Branched off `analytics-rebalance-wave` HEAD `e960645`.
- **A-wave MERGED to `main` (`13a1e59`), July 8.** `catalog-fk-wave`
  (`13a1e59`) — A1 + A4 + A5 + A6b + the `0e6f32a` db-host-guard split — is now
  fully contained in `main`; prod DB migrated + seeded + smoked. Branch is a
  deletion candidate (gated). Pre-main review was DONE and clean.
  **Both catalog/linkage migrations are APPLIED ON STAGING**
  (`ep-bitter-breeze-am81izlh` / noisy-surf) as of July 7; columns + CHECK
  constraints verified by direct SQL. **Prod HAS both as of July 8** (applied
  by hand pre-merge, 873 rows seeded, 16-row ledger drift-free).
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
  July 4). T4 (motion) not started; needs a Fable design pass first.
- Full T2 fix-by-fix history: the July 1 morning HANDOFF in git history
  (`ec3d85a`).

## Next up (the active task)

00. **FP-WAVE, NEXT SESSION'S FIRST JOB: dispatch FP6.**
   (`fp6-weekly-digest.md`, MODEL opus, QUEUED) — the last code unit of
   the wave. Its gate was FP2 + FP5 both LANDED, which is now satisfied
   (FP5 landed `9eb7e8d` this session). After FP6 lands the wave is
   code-complete except FP8, and the next gate is the pre-main review
   (Opus, per the standing fallback) + Seth's smoke.
00c. **Wave smoke checklist (FP1-FP5, hand to Seth when he asks or at
   wave end)** — read the deploy caveat in "Repo / deploy state"
   first; the server halves may not be deployed:
   - Completed session with a genuine PR: the set gets a small muted
     "PR" chip; a different exercise sharing that weight/reps in the
     same session does NOT get chipped; the Exercises detail view
     shows a Personal records card; completed session pages load
     without console errors
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
   taking to a Fable agent (facts gathered in the top entry — do not
   pre-empt it with doc edits).
   Reference: `docs/tasks/fp0-frontier-parity-report-FINDINGS.md`
   (landed `137e0ea`) is still the evidence base for every FP unit.
   R9 (Strength Score) + per-side design is DONE in
   `docs/specs/strength-score-per-side.md` — Opus authors SS1-SS3 from
   it after the FP core lands; gym context likewise in
   `docs/specs/gym-context.md` (G1 is migration-carrying = Seth's
   manual track).
0z. **MW-WAVE: FULLY CLOSED July 17.** Merged to main `3b325db`
   (ff-only, details + SHAs in the top entry) and Seth completed all
   three post-merge steps same day: staging Render REPOINTED to
   `main`, prod deploy SHA VERIFIED == `3b325db`, prod smoke PASSED
   (MW pass + the previously-owed NT items, incl. the What's New
   modal — this also retires the NT-wave verification trio). With
   staging repointed, `maintenance-wave` is now a deletion candidate
   (gated).
0a. **Loose ends carried forward:** the CW3 visual sign-off on the
   next live watcher run. Finding **F** stays open independently
   ("Failed to fetch" = Render cold-start ranked cause; needs a live
   Network-tab repro, not code). The untracked
   `docs/specs/cursor-token-savings-*` + `docs/parked/*` files await
   Seth's ruling: commit here, or move to the workflow repo.
0b. **A-wave follow-up (non-urgent):** optional Step-7 historical backfill:
   `node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply`
   against prod for pre-A4 historical rows (Seth runs the write).
   Idempotent; safe to defer.
1. **T3C sprite loader upgrade** unblocks whenever Seth drops the Gemini
   frames in `claudefiledrop/` (currently holds two `.url` Discord-CDN
   shortcuts, not the expected transparent PNGs).
2. T4 motion (last unstarted U5 unit) — needs a Fable design pass first.

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
8. **NEW (July 14, from finding G); ROOT CAUSE CONFIRMED July 15:**
   client/server contract reconciliation for the id-only `userExerciseId`
   stamp PATCH (server accepts id-only identity PATCH, OR client sends
   name+id together) — needs a task block after the pre-main gate weighs
   in. **Mechanism, read directly from `server/src/controllers/
   sessionController.js`:** the empty-patch guard at **:531** counts only
   `exerciseName` and `notes`, so an id-only body yields
   `400 "No fields to update"`; and identity stamping at **:575** is
   nested inside `if (data.exerciseName !== undefined)`, so the id never
   applies without a name alongside it — meaning the server-side option
   must fix BOTH, not just the guard. Note **:570** rejects completed
   sessions outright, so the live path is the only one in scope (NT3
   already skips the stamp on completed rows by passing no
   `userExerciseId`). **FIXED client-side and LANDED in NTFIX2
   (`888e44d`)** — the client now sends name+id together, and the PATCH is
   wrapped in `try/catch` so the cache invalidate/refresh always runs
   (`http()` throwing on the 400 was skipping it, which is what actually
   left the pill stale — the 400 alone was only half the bug). **RULED
   July 16 (gate tier) + block authored:** the server WILL accept an
   id-only identity PATCH — MW2 fixes BOTH :531 and :575 (validation
   helpers untouched), paired with issue 9's resolve fix in one unit.
9. **NEW (July 15, from the pre-main gate):** "Use that name" can never
   stamp structural identity for CUSTOM exercises. The resolve endpoint
   returns `canonicalName` + `catalogId` but NO `userExerciseId` for
   `source: "userExercise"` (`exerciseController.js:77-82`), so
   `handleUseThatName` correctly guards on `source === "catalog"` and
   links by name alone otherwise — the sheet is doing the best the
   payload allows, so any fix starts SERVER-side. Name-based resolution
   (A4/A6) covers the behavior; only the structural id-link is missing.
   Pairs naturally with issue 8 — same contract surface, do them
   together. **MW2 (authored July 16) does exactly that:** resolve rows
   gain `userExerciseId`, and "Use that name" stamps it.

**Maintenance-wave candidates (Seth, July 16) — SCOPED AND AUTHORED same
day as the MW-wave** (top entry + QUEUE.md; Seth's raw wording preserved
in this file's git history at `5e3d981`). Mapping: 10+11 -> MW3
(un-finish IS the edit path, settled with Seth), 12 -> MW7 (custom
EXERCISES — Seth disambiguated; templates already have MyTemplatesPage),
13 -> MW4 (audit), 14 -> MW5 (audit), 15 -> MW6 (DRAFT, gated on MW4's
verdict), 16 -> NOT authored, stays a candidate: catalog + `searchCatalog`
review pass, pairs with A3's 29 secondary-less compounds in QUEUE.md.

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
