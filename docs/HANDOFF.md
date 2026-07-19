# HANDOFF — current state

**Updated:** July 19, 2026, twenty-seventh session (Opus resident —
**FP4 LANDED `d6180cf`; FP5 DISPATCHED on the named rung and BOUNCED
on audit — NOT landed**). This entry covers BOTH July 19 resident
sessions; the first one landed FP2 `056be0c` and FP3 `3de1749` (after
one bounce) and dispatched FP4, then stepped out with the run in
flight, leaving a relay-handover note in QUEUE. That handover worked
as written: this session picked the FP4 delivery straight out of the
lane worktree and landed it.

**Wave state: 4 of 6 code units landed** — FP1 `8dc799f`, FP2
`056be0c`, FP3 `3de1749`, FP4 `d6180cf` (plus the FP0 report
`137e0ea`). Branch `frontier-parity-wave`, all pushed to
origin, deploys nowhere (staging Render tracks `main`).

**FP4 (empty-state ghosts) LANDED `d6180cf`**, audited per land-unit:
lanes fresh in lane (unit 171/171, build green 130 modules, check-hex
clean), scope exact (5 files), every ghost verified aria-hidden +
pointer-events:none with zero interactive elements, CSS diff free of
animation/transition/@keyframes and of raw color, and every class and
token the ghosts lean on verified to pre-exist and behave
(`.analytics-unlock` :5654, `--chart-track` :5682, `.mv-track` IS
`position: relative` so the absolute ghost bar anchors,
`.balance-scale--ghost` :6397). Two declared deviations accepted: view
tabs now render on the page-empty branch (required — three of the four
per-view teases are otherwise unreachable without a URL edit), and the
exercises empty copy split into title + unlock around the ghost.

**FP5 (PR detection) BOUNCED — bounce 1, delivery left uncommitted in
the lane for the fix run.** First named-rung dispatch of the wave
(`--model opus`, no descent). The lanes came back GREEN and stayed
green when re-run fresh in the lane (unit 195/195 in 15 suites incl.
24 new `prs.js` fixtures, build green, check-hex clean, purity grep
clean) — **the bounce is not a lane failure, it is a defect the lanes
structurally cannot see.** The ENGINE HALF passed audit and is kept:
identity keying verified correct by direct read (`enrichSet.js:25`
synthesizes a `user:<id>` catalogEntry for custom exercises, so
`summary.js`'s helpers — copied verbatim from `exerciseDetail.js`'s
landed N5 pattern — cover catalog AND custom), and cross-user
isolation verified (the new all-time fetch reuses the pre-existing
userId-scoped `fetchAllTimeEnrichedSets`, `where: { userId }` on both
queries; no new query written). Two findings, both confined to
`SessionDetailPage.jsx`, written into the block as BOUNCE 1 FINDINGS:
**F1, BLOCKER and UNDECLARED** — `setHasPR` is a `const` inside the
`SessionDetailPage` component (:2036) but is CALLED inside the
top-level `SessionExerciseBlock` (:1709, :1738), which never receives
it (call sites :2914/:2979 pass no such prop), so every COMPLETED
session detail page throws `ReferenceError: setHasPR is not defined`;
live sessions survive only via the `isCompleted &&` short-circuit.
Invisible to both lanes (Vite does not resolve undefined identifiers,
there are no client render tests) while the report claimed the chip
worked — automatic bounce. **F2** — the chip matches PRs to rows by
`weight:reps` alone, so bench 135x5 (a real PR) and curl 135x5 (not)
both light up in the same session; the payload already carries
`identity` + `exerciseName`, so the match must key on exercise
identity. A false PR badge is a honesty-layer violation. Accepted and
explicitly NOT to be "fixed" in the bounce: the extra
`GET /analytics/summary` call on the completed view (the block
permitted extending the response already touched), and `getSummary`
now fetching all-time sets per request (inherent to the contract — PRs
need history beyond the range).

**Standing question Seth raised, deliberately NOT actioned here (his
call to take to a Fable agent):** whether big/complicated waves should
route Cursor to frontier models. Facts gathered for that conversation:
`cursor-agent --list-models` DOES carry the frontier tier —
`claude-opus-4-8-thinking-high` (1M, thinking) and
`claude-fable-5-thinking-high` (1M thinking, flagged **NO ZDR**) —
alongside the Codex/GPT-5.x ladder and Composer. Two observations
worth putting to Fable: (a) `dispatch-unit` passes bare aliases like
`--model opus` rather than exact ids, which resolved fine but is the
same class of papercut as the July 14 "CLI remembers the last model"
lesson; (b) the evidence so far says spend on AMBIGUITY, not size —
MW's deliberate all-auto descent landed 8/8, while this wave's two
bounces (FP3 chart-view partition, FP5's chip) were both places the
block left a judgment call open. Seth owns raising this; no docs were
changed for it.

Previous entry (July 17, twenty-fifth session, Fable — PRE-MAIN GATE
PASSED + MW-WAVE MERGED TO MAIN `3b325db`) moved VERBATIM to
`docs/HANDOFF-ARCHIVE.md` this rewrite, together with its full gate
record. Still-live pieces carried forward: the merge is done and
prod-verified (see "Repo / deploy state"), and the untracked
`docs/specs/cursor-token-savings-*` + `docs/parked/*` side-project
artifacts still await Seth's ruling (see "Next up" 0a).

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 18 **twenty-sixth** session (Fable — FP-WAVE
OPENED, FP0 report landed `137e0ea`, the wave skeleton authored
`4e09379`, and Seth's two new insights designed into
`docs/specs/gym-context.md` + `docs/specs/strength-score-per-side.md`;
the direction calls, the R3 dual-clock diagnosis, and the full
Fable-unavailable handover live there verbatim — the still-live pieces
are carried in QUEUE.md's FABLE HANDOVER section and the per-unit
records) and the July 17 **twenty-fifth** session (Fable — pre-main
gate + MW-wave merge, above).

Everything older lives in the archive, newest first, and is NOT
re-summarized here: sessions 7-24 (July 10-16) cover the not-tracked
wave (NT1-NT3 + NTFIX1/NTFIX2 + the July 15 merge to `c473e21`), relay
v5/v5.1/v5.2 adoption, the cursor-watch dev-tooling arc (CW1-CW3), and
the whole MW-wave (skeleton, dispatch, rulings, code-complete). Grep
the archive by session number or SHA when a decision's provenance
matters; the still-live conclusions are all carried in QUEUE.md's
per-unit records, the `-FINDINGS.md` files, and the sections below.

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
  `d6180cf`, all pushed. **Smoke-surface caveat, verify before the
  wave smoke:** staging Render (the API) has tracked `main` since
  July 17, so the SERVER halves of this wave are not deployed
  anywhere. FP2's `buildSummary.workoutCount` is a server change, and
  FP5's engine work will be too. The client halves ride Vercel's
  per-branch deploy as usual. Seth either repoints staging Render at
  `frontier-parity-wave` for the smoke or accepts that server-derived
  numbers are stale — settle this BEFORE running the checklist below,
  or the This-week strip will look unfixed.
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

00. **FP-WAVE, NEXT SESSION'S FIRST JOB: re-dispatch FP5 with the
   bounce findings.** The block `docs/tasks/fp5-pr-detection.md` is
   STATUS: BOUNCED and carries a `BOUNCE 1 FINDINGS` section naming
   both fixes (F1 the `setHasPR` scope crash, F2 the weight:reps
   false-positive match) and explicitly ringfencing the engine half as
   accepted. **The first delivery is still sitting uncommitted in
   `C:\dev\worktrees\cursor-lane` on branch `cursor/fp5-pr-detection`
   (base `04ce6bf`) — do NOT reset that lane and do NOT re-dispatch
   from scratch.** Re-dispatch the SAME lane per `dispatch-unit`'s
   bounce channel so the fix builds on the kept engine work; named
   rung again (MODEL opus). F1's fix must be PROVEN by driving the
   completed-session view in a browser or adding a render test —
   "build green" is exactly the evidence that missed it the first
   time. Two bounces on one unit = hard stop, page Seth.
00b. **Then FP6** (`fp6-weekly-digest.md`, MODEL opus, QUEUED) — the
   last code unit of the wave. Its gate is FP2 + FP5 both LANDED, so
   it stays blocked until FP5 clears. After FP6 lands the wave is
   code-complete except FP8, and the next gate is the pre-main review
   (Opus, per the standing fallback) + Seth's smoke.
00c. **Wave smoke checklist (FP1-FP4, hand to Seth when he asks or at
   wave end)** — read the deploy caveat in "Repo / deploy state"
   first; the server halves may not be deployed:
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
