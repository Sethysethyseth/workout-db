# HANDOFF — current state

**Updated:** July 16, 2026, twenty-second session (Opus resident —
**MW-WAVE DISPATCH RAN THE WHOLE QUEUE: 6 of 7 units dispatched +
LANDED in ONE session** — MW4 `c005c2a`, MW5 `87d6b37`, MW1 `f9a6dfd`,
MW2 `859f3d3`, MW3 `9511e8f`, MW7 `b6c885f`; only MW6 remains, DRAFT,
gated on rulings + Fable). All six went over Channel B; the four
opus-tier units ran on the AUTO rung as a **DELIBERATE ladder descent —
Seth's call mid-session** ("run them on auto and you will review them
as opus") instead of waiting for the 7/17 named-rung reset, with the
Opus audit as the compensating control. Every audit ran per
`land-unit`: lanes fresh in the lane each time (unit 170/170, Vite
build, check-hex on UI units), full diffs read, claims spot-checked by
direct read/grep, and the written-not-run integration tests RUN at
land time in the main tree (MW2: 17/17 incl. the 5-row id-only PATCH
matrix; MW3: 11/11 incl. the reopen round trip). Per-unit audit
records + accepted deviations live in QUEUE.md. **Also this session:**
wave-progress messaging (n/N at dispatch, n/N summary per landing,
N/N complete) added to `dispatch-unit` 2b + `land-unit` 5 as Seth's
standing ask (`627c520`); one transient OneDrive index.lock hiccup
(self-cleared, no damage). **The diagnosis findings** (full reports in
`docs/tasks/mw4-*-FINDINGS.md` / `mw5-*-FINDINGS.md`): MW4 — per-side
storage CORRECT, engine side-blind; volume/counts/e1RM AMBIGUOUS (L+R
pair = 2 full sets everywhere; 5 product-ruling questions for
Seth/Fable); display BROKEN (heading "2 sets" vs toolbar 1 pair);
detection BROKEN (regex misses all ~50 One-Arm names). MW5 — reps 8.5
fine except 5 analytics surfaces Math.round it to 9 (fix-block
candidate: shared reps formatter); RPE 8.5 correct end-to-end; RIR 1.5
cleanly 400-rejected by design — recommendation: REJECT, don't widen. MW4 (per-side end-to-end audit,
DIAGNOSIS, no code) audited per `land-unit`: lane 170/170 fresh, zero
source edits, every spot-checked claim confirmed by direct read/grep/
count. **Verdicts:** storage + manual L/R logging CORRECT (side
persists; engine side-blind by construction — zero `side` refs in
`server/src/analytics/`); volume / set counts / e1RM AMBIGUOUS (an L+R
pair counts as 2 full sets on every counting surface; series bucketing
does NOT double-count sessions; planned-vs-actual adherence reads 2.0
on paired work); display BROKEN (heading `:1359` says "2 sets" while
the per-side toolbar `:1318` says 1 pair); detection BROKEN (regex is
exactly `\bsingle\b` — misses all ~50 One-Arm catalog names of 873,
false-positives on "single response"). Overall: trustworthy WITH
CAVEATS; **MW6 must not ship on the current detector** — its DRAFT
note now points at the findings. Full report preserved verbatim in
`docs/tasks/mw4-per-side-analytics-audit-FINDINGS.md` (DELIVERY.md is
gitignored); it ends with **5 product-ruling questions for Seth/Fable**
(pair = 1 or 2 sets? adherence? per-side e1RM footing? sessions-list
count? last-logged side cue?) — rulings needed before any AMBIGUOUS
surface gets a fix block; the two BROKEN fixes (detector broadening,
heading pair count) are block-ready without rulings.

Previous entry (July 16, twenty-first session, Fable — **MW-WAVE
(maintenance wave) SKELETON AUTHORED: 7 blocks on new branch
`maintenance-wave`**, branched off not-tracked-ux-wave HEAD `5e3d981` =
main `c473e21` + the CW dev-tooling arc, which therefore rides this
wave's pre-main gate). Scope settled with Seth this session: item 12 =
custom EXERCISES (not templates); **un-finish IS the edit path** for
items 10+11 (one mechanism — reopen to live, edit with the existing live
UI, finish again; no second editing surface); item 16 (catalog/search
review) deliberately NOT authored, stays a candidate alongside A3.
Units: MW1 heading-pill un-nest (the gate's shipped-knowingly finding),
MW2 identity contract (issues 8+9 — and **issue 8 is now RULED: the
server accepts id-only identity PATCHes**, fixing BOTH
sessionController `:531` and `:575`), MW3 reopen-completed-session
(`POST /sessions/:id/reopen`, completedAt-only flip; reopened sessions
leaving history/analytics until re-finished is INTENDED), MW4 per-side
end-to-end audit (diagnosis, no code), MW5 decimals audit (diagnosis,
no code; `rir` is `Int?` in schema — the 1.5-RIR question), MW6
per-side auto-first-pair (**DRAFT, gated on MW4's verdict**), MW7
custom-exercise Library tab (client half only; L3 server routes exist).
Dispatch order + serialization matrix in QUEUE.md: MW1+MW2 batchable
(file-disjoint), MW3 after both, MW7 after MW3 (index.css overlap),
MW4/MW5 solo anytime between reviews, never back-to-back with anything.
Dispatch is the resident session's job next — NOTE the named rung is
exhausted until the 7/17 reset, so the economical order is MW4/MW5
(MODEL auto) today, the opus-tier units after the reset. **STAGING
REPOINT AMENDED:** when Seth does RUNBOOK step 6, point staging at
`maintenance-wave` (NOT back to `main`) — that is where this wave's
smokes happen. Seth's post-merge trio (prod SHA verify == `c473e21`,
the repoint, prod smoke incl. the What's New modal) and the CW3 visual
sign-off remain owed, unchanged by this session.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 15 **twentieth** session (Fable — the
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

- **MW-wave ACTIVE on `maintenance-wave` (July 16)** — branched off
  not-tracked-ux-wave HEAD `5e3d981` (= main `c473e21` + the CW arc, so
  the CW dev tooling rides this wave's pre-main gate). 7 task blocks
  authored (6 QUEUED, MW6 DRAFT), nothing dispatched yet. Staging should
  point HERE for the wave's smokes (the amended RUNBOOK step 6 target).
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
- **`main` is at `c473e21` (July 15)** — the NT-wave merge (above), on
  top of the N-wave (`8068ffb`) + What's New prod-gate follow-up
  (`57b1fc8`). Prod Vercel/Render track `main` and auto-deploy on push,
  so `c473e21` is DEPLOYING/DEPLOYED to prod — **the deploy-SHA
  verification in Events is OPEN and owed** (see NEXT UP). The older
  `57b1fc8` prod-SHA check is superseded by this one.
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

00. **MW-WAVE: 6 of 7 LANDED July 16 (one session).** Wave HEAD
   `b6c885f` on origin. **SETH'S CONSOLIDATED SMOKE CHECKLIST** (once,
   on the staging Vercel deploy, after the staging repoint in 0a —
   4 palettes x 2 modes where visual, 360px):
   - MW1: live workout heading — order chevron/name/"· N sets"/pill/
     "· summary"; pill tap opens the Add-to-library sheet WITHOUT
     toggling collapse; no layout shift when the pill flips
     Tracked/Not-tracked; completed view heading unchanged.
   - MW2: resolve a CUSTOM exercise in the sheet -> "Use that name" ->
     pill flips Tracked with NO rename side effect (id-only stamp).
   - MW3: finish a workout -> "Reopen workout" on the completed view ->
     confirm copy reads right -> live builder + finish dock take over
     in place -> dashboard resume hero reappears -> finish again and
     it returns to history/analytics.
   - MW7: Library -> "Custom exercises" tab — count + rows with
     Main/Assists, delete confirm carries the honest SET-NULL copy and
     removes the row without reload, empty state names the pill path,
     community area unchanged, 3-up tablist reads right at 360px.
   **Remaining wave work:** (1) Seth's rulings — MW4's 5 pair-semantics
   questions + MW5's reject-vs-widen RIR call (findings docs in
   docs/tasks/); (2) Fable finalizes MW6's contract against MW4's
   findings (detector MUST cover One-Arm names, dodge "single
   response") and authors the surfaced fix-block candidates (per-side
   heading pair count; shared reps formatter for the 5 Math.round
   sites — both block-ready without rulings); (3) the pre-main gate
   (Fable + Seth) once MW6 resolves either way.
0a. **Seth's post-merge verification trio (NT-wave merge, still owed):**
   (1) prod deploy SHA == `c473e21` in Render AND Vercel Events (push is
   not proof of deploy); (2) RUNBOOK step 6 — repoint staging at
   `maintenance-wave` (amended July 16; NOT back to `main`), verify the
   redeploy SHA in Events; (3) prod smoke — the NT flow + the "Every
   exercise, in one place" What's New modal firing for a logged-in user
   (prod is the ONLY place it renders). Plus the CW3 visual sign-off on
   the next live watcher run. Finding **F** stays open independently
   ("Failed to fetch" = Render cold-start ranked cause; needs a live
   Network-tab repro, not code).
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
