# HANDOFF — current state

**Updated:** July 15, 2026, seventeenth session (Opus — orphaned
findings-fix work traced, audited, LANDED as **NTFIX2 `888e44d`**;
wave now at `888e44d` on origin).
A pre-gate tree check found `AddExerciseToLibrarySheet.jsx` +
`SessionDetailPage.jsx` modified and uncommitted, mtimes July 14 15:09,
unstaged by a bare `git reset` at reflog `HEAD@{0}`. Seth did not write
them and no `DELIVERY.md` or QUEUE entry claims them. **PROVENANCE NOW
TRACED (do not re-litigate):** Claude Code session
`ee60a330-d305-49c3-b2dc-0ec82b2fe35f`, July 14 **14:47-15:10 local**
(18:47-19:10Z — the window brackets the 15:09 mtimes), prompt **"fix all
findings and test to see if everything works"**. It fixed FOUR findings,
ran the lanes green, reported in full, ended by asking *"I haven't
committed - want me to land this?"* — **and never got an answer.** The
session closed and the work sat in the tree. Not a rogue writer, not a
lane-isolation breach; Cursor is exonerated (every recorded cursor-agent
session that day ended by 10:11, and all NT3 relay activity clusters
10:00-10:53). **Its self-reported four fixes:** (1) **finding G / HIGH** —
stamp PATCH sent id-only, server 400s, and because `http()` throws the
throw ALSO skipped the cache invalidate/refresh, so the pill stayed stale
after a mid-session create; now sends name+id in a `try/catch` so
resolution always runs; (2) **MEDIUM** — `seedSearchLoading` stuck on
"Searching..." because the `<2 chars` early-return skipped clearing the
flag; (3) **MEDIUM** — pill went interactive on a stale committed name
mid-edit (visual keys off the draft, click now keys off the committed
name; NT3's completed-session interactivity preserved); (4) **LOW** —
duplicate search on the suggest->seed hop, deduped via
`seedFetchedTermRef`. **AUDITED AND LANDED as NTFIX2 `888e44d`**, pushed to
staging. Sequence: parked verbatim on `parked/unattributed-g-fix`
(`532125d`) -> wave restored to the audited `98963f6` tree -> full
`land-unit` audit -> landed as one unit with an accurate message.
**Audit evidence (lanes re-run FRESH in the lane worktree, never trusted
from the report):** server unit 170/170 in 14 suites, client Vite build
green 128 modules, `check-hex` clean, scope exactly the 2 claimed files
with nothing unexpected, all four criteria verified by direct read, and
G's mechanism confirmed independently against source (issue 8).
**Deviations stated, not hidden:** Claude Code authored product code
(covered by the AGENTS.md direct-fix exception + Seth's explicit ask, but
a deviation); fix 4 is an optimization beyond the findings; no block file
or `DELIVERY.md` exists, so the session's final report stood in for one
and QUEUE.md carries the record instead. **NOTE: `532125d`'s own commit
message is superseded** — written before the trace, it calls the work
unattributed, unaudited and partly scope creep; all three are wrong.
**BEHAVIOR NOTE FOR THE GATE:** the stamp PATCH now carries
`exerciseName`, so the session-exercise row **renames** to the sheet's
name on create. NT2's handler always anticipated this (its pre-existing
`oldName !== name` invalidation) but the rename never fired while the
PATCH 400'd — newly LIVE behavior, not new code. Worth an explicit ruling
at the gate.

Previous entry (July 14, sixteenth session, Sonnet — smoke sign-off).
Seth smoked NTFIX1 + NT3 on the staging preview against the four-item list
from the prior entry (completed-session pill interactive/create-only
context, live-session NT2 flow unchanged, Main/Assists toggle pressed-state,
mid-flow close with no nag) — **PASSED, all four.** No code changes.
**NEXT UP is now solely the pre-main Fable/Opus full-branch-diff review**
(open items: finding F cold-start confirmation, finding G stamp-contract
reconciliation, DOM-nesting warning) — the dispatch queue is empty (NT3 was
the last unit, no other block is QUEUED per `docs/tasks/QUEUE.md`).

**NEXT UP — the pre-main gate.** NTFIX2 was the last unit: the NT-wave is
code-complete on `not-tracked-ux-wave` (`888e44d`). Seth's NTFIX1 + NT3
smoke already PASSED (all four items) — but that smoke predates NTFIX2,
so (a) **NTFIX2 needs its own smoke** on the staging Vercel preview
(RUNBOOK step 6 staging repoint to this branch may still be owed first):
[1] **live session, the headline fix** — add an exercise with an
off-catalog name, tap the "not tracked" pill, create it -> pill flips to
Tracked immediately (this was BROKEN before NTFIX2; it is the whole point
of the unit); [2] **live session, edited name** — change the name in the
sheet before saving -> the set row renames to the new name AND shows
Tracked (**newly live behavior — if the rename is unwanted, say so, it is
a deliberate open question for the gate**); [3] **completed session** —
NT3's create-only flow still adds to library and flips the pill
(regression check on the path NTFIX2 did not intend to touch); [4] **seed
step** — clear the search to 1 char -> "Searching..." disappears, no
stuck spinner; "None of these" -> seed hop shows results with no visible
second fetch; [5] **mid-edit pill** — start editing an exercise name in a
live session -> the pill must not be tappable while the draft is
uncommitted. Then (b) Fable/Opus full-branch-diff review with the archive
in hand — open items for it: **F** ("Failed to fetch" = Render cold-start
candidate, needs a live Network-tab repro), **G** (client-side fix LANDED
in NTFIX2; the open question is whether the SERVER should also accept an
id-only identity PATCH — see issue 8), **the NTFIX2 rename behavior**
(above), the React DOM-nesting warning (pill button inside heading
button), and **NTFIX2's own relay deviations** (Claude Code authored the
product code, no block file exists — QUEUE.md carries the full record).
Merge stays behind Seth's "push to main" trigger phrase.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 14 **fifteenth** session (Fable — relay v5 doc
alignment pass) and the July 14 **fourteenth** session (Fable — RELAY v5
ADOPTED: pricing probe + NT3 as the first autonomous dispatch; the
env/PATH and `--model` gotchas from it are preserved in the "Notes /
gotchas" section below). The prior rewrite aged the July 14 thirteenth
session (Sonnet — relay v5 one-time manual setup complete; env/PATH
staleness gotcha), and the one before that aged
the July 13 twelfth session (Fable — relay v5 proposal),
the July 12 eleventh session (Sonnet — NTFIX1 landed `e0ba383` + the
live browser test of F that produced finding G), the July 11 ninth
session (Opus — NT1 + NT2 landed), the July 11 eighth session (Fable —
NT-wave skeleton authored), and the July 10 seventh session (Fable —
not-tracked flow brainstorm).

- **N-wave follow-ups still open (carried from the archived sixth
  session):** (1) verify prod deploy SHA == `57b1fc8` in Render/Vercel
  Events (push != live); (2) prod smoke — exercises tab, weekly-volume
  graph, and the "Every exercise, in one place" What's New modal firing
  for a logged-in user (prod is the ONLY place it renders); (3) RUNBOOK
  step 6 — repoint staging Render off `analytics-rebalance-wave`; point
  it at `not-tracked-ux-wave` NOW that the NT wave is code-complete,
  verify redeploy SHA in Events.

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

- **`not-tracked-ux-wave` is at `888e44d` (July 15)** — NT1 + NT2 +
  NTFIX1 + NT3 + **NTFIX2** + the relay v5 docs (spec, skills, QUEUE,
  doctrine amendment) all on `origin/not-tracked-ux-wave`. Wave
  code-complete; pre-main gate pending. Branched off
  `analytics-rebalance-wave` HEAD `e960645` (= `main` `57b1fc8` + one
  docs bookkeeping commit).
- **A-wave MERGED to `main` (`13a1e59`), July 8.** `catalog-fk-wave`
  (`13a1e59`) — A1 + A4 + A5 + A6b + the `0e6f32a` db-host-guard split — is now
  fully contained in `main`; prod DB migrated + seeded + smoked. Branch is a
  deletion candidate (gated). Pre-main review was DONE and clean.
  **Both catalog/linkage migrations are APPLIED ON STAGING**
  (`ep-bitter-breeze-am81izlh` / noisy-surf) as of July 7; columns + CHECK
  constraints verified by direct SQL. **Prod HAS both as of July 8** (applied
  by hand pre-merge, 873 rows seeded, 16-row ledger drift-free).
- **`main` is at `57b1fc8` (July 10)** — N-wave (`8068ffb`) + What's New
  prod-gate follow-up. Prod Vercel/Render track `main` and auto-deploy on
  push; the deploy-SHA verification is still an open follow-up (above).
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

00. **NT-WAVE CODE-COMPLETE — pre-main gate is the active task.** NT1
   (`f4baee3`), NT2 (`f26e783`), NTFIX1 (`e0ba383`), NT3 (`98963f6`),
   NTFIX2 (`888e44d`) all audited + pushed to `not-tracked-ux-wave`.
   Seth's NTFIX1 + NT3 smoke PASSED (all four items) but PREDATES NTFIX2.
   Remaining sequence: **Seth smokes NTFIX2 (5-item list in the top
   entry)** -> Fable/Opus full-branch-diff review (open items F, G's
   server-side question, the NTFIX2 rename behavior, DOM-nesting, and
   NTFIX2's relay deviations — see top entry) -> Seth's "push to main"
   trigger. Design source:
   `docs/design/not-tracked-add-flow-brainstorm.md`.
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
   left the pill stale — the 400 alone was only half the bug). **Still
   open for the gate to rule on:** whether the SERVER should also accept
   an id-only identity PATCH. If yes, it must fix BOTH :531 and :575, not
   just the guard. Not blocking — the client path works without it.

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
