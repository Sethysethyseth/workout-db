# HANDOFF — current state

**Updated:** July 18, 2026, twenty-sixth session (Fable — **FP-WAVE
OPENED: FP0 frontier-parity report authored, dispatched, and LANDED
`137e0ea` in one session; NO implementation blocks yet by design**).
Seth's ask: make the direction calls on the July 17 product-review
findings and have Cursor produce a NOW/CHANGE report he can read
before anything ships. New branch `frontier-parity-wave` off
maintenance-wave HEAD `0206d30` (= main `3b325db` + two post-merge
docs commits). Fable made the calls (baked into
`docs/tasks/fp0-frontier-parity-report.md`, block `a5444b7`): retitle
to LogChamp; interim "LC" monogram PWA icons; ONE window + ONE data
source for the This-week strip; recent workouts go VERTICAL (3 rows,
full titles); empty analytics tease the wedge with static ghost
previews + honesty-voice unlock lines; tagline stays Seth's call
(3 alternatives presented); PR detection as a pure engine module with
quiet chips (no confetti); weekly digest extends the existing
WeeklyReport band; Strength Score flagged NEEDS FABLE DESIGN PASS
jointly with the queued per-side unit; never-gate-history verified
true and becomes product copy. FP0 dispatched Channel B auto rung,
landed same session per land-unit: lane porcelain-EMPTY (report-only
contract held), unit lane fresh 170/170, spot-checks by direct read —
the R3 diagnosis is REAL (Workouts tile counts by `completedAt` in
LOCAL bounds at WeeklyReport.jsx:31-44 while Sets/Top-set ride
/analytics/summary filtered by `performedAt` in UTC bounds — two
clocks, two sources in one strip). Full report preserved verbatim in
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md`; audit record in
QUEUE.md.

**Same session, phase 2 (after Seth's read):** Seth APPROVED the
critiques with riders — icons LAST (needs his intervention), and
everything Fable-gated must be set up for OPUS because **Fable is
unavailable after July 18**. He brought two new insights, both
designed same session: (1) his strength-view screenshot (in
claudefiledrop/) shows single-session/dormant exercises burying the
real trends — became FP3 (active-exercise lens: noteworthy-first sort,
single-session rows collapsed, Active|All roster lens, history never
hidden); (2) different-gym machine variance skews analytics (his
screenshot's "Single arm lat pulldown -52.5 lbs" is the live example)
— his location idea designed into `docs/specs/gym-context.md`
(one-shot opt-in location at session start, Gym entity + session tag,
ANNOTATE-never-adjust analytics + home-only filter; continuous
tracking rejected on PWA/privacy/battery grounds, criteria named in
the spec). The R9 design pass is DONE too:
`docs/specs/strength-score-per-side.md` (self-referenced score,
per-side comparison verdicts, imbalance headline; SS1-SS3 block plan).
**FP-WAVE SKELETON AUTHORED `4e09379`: FP1-FP6 QUEUED, FP8 DRAFT**
(order + serialization + the full Opus handover in QUEUE.md's FABLE
HANDOVER section). FP1 DISPATCHED same session (Channel B auto rung).
Open Seth items: R6 tagline pick; icon PNGs into claudefiledrop/ to
un-DRAFT FP8; G1's migration when the G-wave starts.

Previous entry (July 17, twenty-fifth session, Fable — **PRE-MAIN
GATE PASSED + MW-WAVE MERGED TO MAIN `3b325db`**). Seth confirmed the
MW6+MW8 smoke PASSED and gave the trigger phrase; merge ran per the
RUNBOOK ritual one command at a time in a scratch worktree
(`C:\dev\worktrees\merge-main`, per the OneDrive lesson): ff-only
`c473e21..3b325db`, 35 commits, no merge commit, `origin/main` HEAD
verified `3b325db` post-push, worktree removed. NO migration —
code-only deploy. **Seth completed all three post-merge steps same
day: staging Render repointed to `main`, prod deploy SHA verified ==
`3b325db`, prod smoke PASSED (MW pass + the previously-owed NT items
incl. the What's New modal — the NT-wave verification trio is
retired).** `maintenance-wave` is now fully contained in `main` and
staging no longer points at it — a deletion candidate (gated). The wave that just shipped, for the record below: MW1-MW8 +
the CW dev-tooling arc + `a5294e3`. Gate details in the review record
that follows.

Gate record (same session, pre-merge):
Reviewed the full accumulated diff `c473e21..a5294e3` (34 commits:
MW1-MW8 + the CW dev-tooling arc + one post-wave direct fix) against
the blocks, QUEUE's per-unit audit records, and the archived session
logs per the gate ritual. Lanes re-run fresh AT THE GATE: unit 170/170
(14 suites), Vite build green, check-hex clean. Verified by direct
diff read: MW2's guard/identity un-nesting matches the July 16 ruling
exactly (`:531` guard counts `identityParse.provided`, identity arm
wins over name-derivation when both arrive — so the NTFIX2 client's
name+id PATCH is id-authoritative), MW3's reopen ladder is
ownership-correct (userId in the findFirst) with a completedAt-only
flip and completeSession's include shape, MW1's un-nest is
structurally sound (pill/summary are SIBLINGS of the toggle, the
stopPropagation removal is safe because no ancestor handler remains),
MW6's detector table + auto-pair guards (busyRef, sets.length,
setCountBusy, commit-vs-draft, override-false-wins) all hold and the
RIR keystroke gate makes the flush-path integer guards
belt-and-suspenders, MW7/MW8 are surgical, watcher script confirmed
NEVER imported by client or server (dev tooling stays out of runtime).
**`a5294e3` recorded:** an off-flow July 16 evening direct fix (ONE
confirm when deleting a filled L/R pair, no confirm on a blank pair,
singles keep the per-set confirm) — committed outside land-unit during
what was evidently Seth's MW6 smoke; now gate-reviewed directly,
clean, on origin. NO fix blocks needed, nothing bounced, no Cursor
busywork identified. (Both pre-merge conditions were then met same
session: Seth confirmed the MW6+MW8 smoke PASSED and said "push to
main" — see the merge record above.)
Flagged, not blocking: `docs/specs/cursor-token-savings-{stats.md,
data.json}` and `docs/parked/*` sit UNTRACKED since ~July 11-13
(side-project artifacts for the poor-man's-agentic-workflow repo) —
Seth to rule whether they belong in this repo's history or move out.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 16 **twenty-fourth** session (Opus resident —
MW-wave code-complete, MW6 `bfbbe56` + MW8 `52e84cf` dispatched and
landed, all 8 units in; the MW6 detector-narrowing judged note and the
MW8 formatter verification live there verbatim — the still-live pieces
are carried in QUEUE.md's per-unit records and the top-entry gate
record). Before that: the July 16 **twenty-third** session (Fable — rulings
interpreted + MW6 finalized/QUEUED + MW8 authored; the five ruling
dispositions, the "stepper alone speaks Pairs" vocabulary choice, and
the RIR-gate rider live there verbatim — the still-live pieces are
baked into the landed MW6/MW8 QUEUE records and
`mw6-seth-rulings.md`'s interpretation section). Before that: the
July 16 **twenty-second** session (Opus resident —
MW-wave dispatch ran the whole queue, 6 of 7 units dispatched + landed
in one session; the deliberate auto-rung descent precedent, the
wave-progress-messaging skill amendment `627c520`, and the MW4/MW5
diagnosis verdicts live there verbatim — the still-live pieces are
carried in QUEUE.md's per-unit records and the FINDINGS files). Before
that: the July 16 **twenty-first** session (Fable — MW-wave
skeleton authored, 7 blocks on new branch `maintenance-wave` off
`5e3d981`; the scope settlements with Seth — item 12 = custom
EXERCISES, un-finish IS the edit path, item 16 not authored — and the
original dispatch matrix live there verbatim; the still-live pieces are
carried in QUEUE.md and the entries above). Before that: the July 15
**twentieth** session (Fable — the
cursor-watch arc, CW1 `018a6ae` + CW2 `a26a2c8` + CW3 `6907d4a` all
landed; the persistent-watcher Startup setup, the non-git-dir papercut,
and the owed CW3 visual sign-off live there verbatim — the sign-off
stays carried in "Next up" 0a). Before that: the July 15 **nineteenth** session (Opus — PRE-MAIN GATE
PASSED + NT-WAVE MERGED TO MAIN `c473e21`; the full GATE RESULTS, the
NTFIX2-rename ruling, the nested-`<button>` diagnosis, and the
post-merge NEXT UP trio live there verbatim — the still-live pieces are
carried in the top entry, "Next up", and the MW blocks). The prior
rewrite aged the July 15 **eighteenth** session (Fable — relay v5.1
resident-session amendment: batch Seth's touchpoints, never the machine
checkpoints), and the one before that the July 15 **seventeenth** session
(Opus — the orphaned
July 14 findings-fix work traced, audited and landed as NTFIX2
`888e44d`; full provenance trace of session `ee60a330` lives there).
The prior rewrite aged the July 14 **sixteenth** session (Sonnet —
NTFIX1 + NT3 smoke sign-off, all four items PASSED), and the one before
aged the
July 14 **fifteenth** session (Fable — relay v5 doc alignment pass) and
the July 14 **fourteenth** session (Fable — RELAY v5 ADOPTED: pricing
probe + NT3 as the first autonomous dispatch; the env/PATH and
`--model` gotchas from it are preserved in the "Notes / gotchas"
section below). Before that: the July 14 thirteenth
session (Sonnet — relay v5 one-time manual setup complete; env/PATH
staleness gotcha),
the July 13 twelfth session (Fable — relay v5 proposal),
the July 12 eleventh session (Sonnet — NTFIX1 landed `e0ba383` + the
live browser test of F that produced finding G), the July 11 ninth
session (Opus — NT1 + NT2 landed), the July 11 eighth session (Fable —
NT-wave skeleton authored), and the July 10 seventh session (Fable —
not-tracked flow brainstorm).

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

- **`frontier-parity-wave` is the ACTIVE wave branch (July 18)** — off
  maintenance-wave HEAD `0206d30`, docs-only so far (FP0 block + the
  landed report `137e0ea`). Deploys nowhere: staging Render tracks
  `main` since July 17.
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

00. **FP-WAVE: SETH READS THE FP0 REPORT** —
   `docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (landed
   `137e0ea` on `frontier-parity-wave`). It gives NOW/CHANGE/SIZE for
   every review finding + frontier-parity feature. Seth rules on: R6
   tagline (keep / one of three alternatives), whether the suggested
   block grouping stands, and which tiers ship this wave. Then
   implementation blocks get authored. R9 (Strength Score) folds the
   already-queued per-side L/R comparison candidate into ONE Fable
   design pass — that supersedes the standalone "per-side next" note
   below.
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
