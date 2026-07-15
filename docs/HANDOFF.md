# HANDOFF — current state

**Updated:** July 15, 2026, seventeenth session (Opus — orphaned
findings-fix work traced, parked pending audit; no product code landed).
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
`seedFetchedTermRef`. Self-reported evidence: unit 170/170, ESLint no new
issues, Vite build 128 modules. **Parked verbatim on
`parked/unattributed-g-fix` (`532125d`)**; `not-tracked-ux-wave` restored
to exactly the audited `98963f6` tree. **Status: a DELIVERY AWAITING
AUDIT, not junk and not landed.** It is legitimate, tested, on-request
work whose only real gap is that green is still SELF-reported (AGENTS.md:
the report is never trusted for green tests) and it was authored in the
main tree outside a block. Next actor should run it through `land-unit`
(re-run lanes fresh, audit tree vs report) rather than either
cherry-picking it or leaving it to rot. **NOTE: the parked commit
message's own framing is superseded by this entry** — it was written
before the provenance was traced and calls the work unattributed,
unaudited and partly scope creep. **Finding G root cause CONFIRMED
independently** by direct source read (issue 8 below).

Previous entry (July 14, sixteenth session, Sonnet — smoke sign-off).
Seth smoked NTFIX1 + NT3 on the staging preview against the four-item list
from the prior entry (completed-session pill interactive/create-only
context, live-session NT2 flow unchanged, Main/Assists toggle pressed-state,
mid-flow close with no nag) — **PASSED, all four.** No code changes.
**NEXT UP is now solely the pre-main Fable/Opus full-branch-diff review**
(open items: finding F cold-start confirmation, finding G stamp-contract
reconciliation, DOM-nesting warning) — the dispatch queue is empty (NT3 was
the last unit, no other block is QUEUED per `docs/tasks/QUEUE.md`).

Previous entry (July 14, fifteenth session, Fable — relay v5 DOC
ALIGNMENT: skills + task-queue protocol swept for the v4 remnants the
adoption left behind; no product code). Four files. **`author-task-block`**
now frames the dispatch line as channel-agnostic, marks the contract-first
rules carried unchanged into v5, notes MODEL doubles as the
dispatch-routing lever (`auto` -> free CLI rung), pins that MODE governs
only the hand-relay fallback (autonomous dispatch always uses the lane
worktree), adds the DB-free-lanes-only constraint on dispatched blocks
(no `server/.env` in the lane worktree or the cloud — a block needing
the integration lane is a hand-relay flag), and ends by invoking
`dispatch-unit` instead of "hand Seth the dispatch line" (the line
survives as the documented fallback). **`land-unit`** now names the lane
worktree as the primary of THREE delivery modes (audit + lanes run in
`C:\dev\worktrees\cursor-lane`; commit in the lane on `cursor/<unit>`,
ff-merge onto the wave branch, push — the NT3 precedent), scopes the
OneDrive sync-lag caveat to the main tree, and closes with the
relay-loop continuation (idle + QUEUED unit -> `dispatch-unit`; wave
complete -> stop, the gate is Fable + Seth). **`dispatch-unit`** gains
its one missing beat: Channel B flips DISPATCHED in QUEUE.md before the
run (bookkeeping parity with Channel A). **`docs/tasks/README.md`**
rewritten from the v4 "Seth dispatches" loop to v5 (dispatch step =
`dispatch-unit` with the hand-relay line kept as fallback, DELIVERY.md
lands at the root of whichever tree the block runs in, DISPATCHED
flipped by the dispatcher, "Two modes" demoted to hand-relay paths,
Seth's job = go-aheads / bug reports / smoke sign-off / gate items,
MODEL guidance aligned with the Fable-withheld rule). `_TEMPLATE.md`
untouched DELIBERATELY — the standing footer is verbatim-standing and
"repo root" already reads correctly in whichever tree the block runs.
Next up unchanged: the pre-main gate (NEXT UP paragraph below).

Previous entry (July 14, fourteenth session, Fable — RELAY v5 ADOPTED:
pricing probe run + NT3 landed as the FIRST AUTONOMOUS DISPATCH; NT-WAVE
NOW CODE-COMPLETE). Resume sequence executed end-to-end this session:
**(1) Setup verified from ground truth** — the session restart still did
NOT propagate env/PATH to the Claude Code shell (parent process chain
holds the stale environment; durable workaround now in the spec + skill:
read `CURSOR_API_KEY` from the registry inline, invoke
`C:\Users\Sethy\AppData\Local\cursor-agent\cursor-agent.ps1` by full
path); CLI `2026.07.09-a3815c0` responds and `cursor-agent status` ->
logged in as Seth (the item last session couldn't confirm). **(2)
Pricing probe, all three rungs, $0 spent — verdict decisive:** Channel A
(cloud agents) requires usage-based pricing ON with >=$2 headroom and
NEVER draws the included Pro pool -> with Seth's overage toggle OFF it
refuses cleanly at dispatch (`400 usage_limit_exceeded`), so the
per-unit cost question is MOOT and **Channel B is the backbone for ALL
blocks**; B-named is exhausted this cycle ("saved $64 on API model
usage", resets 7/17 — the July 13 "33% consumed" dashboard reading was
evidently a different meter); B-auto works. Routing defaults flipped in
the spec + `dispatch-unit`. **(3) NT3 dispatched autonomously and LANDED
`98963f6`** — Channel B auto rung, lane worktree
`C:\dev\worktrees\cursor-lane` (created off wave HEAD, deps installed,
persists for future dispatches), 45-min hard-timeout wrapper. One
dispatch hiccup, lesson pinned in the skill: **the CLI remembers the
last-used `--model`** — the first flagless dispatch inherited the
exhausted haiku from a probe and quota-refused; ALWAYS pass `--model`
explicitly. Delivery audited per `land-unit`: lanes re-run fresh (unit
170/170, client build green), scope exact (3 files = FILES TO TOUCH),
all 7 criteria verified incl. by direct read (completed-context sheet
opens at seed with name prefilled + hadSuggestStep cleared; parent
create handler skips the stamp PATCH without `userExerciseId` — also
sidesteps bug G on this path — but still invalidates + refreshes name
resolution; live path is a no-op change; check-hex clean; slot-pill
fade-in targets a real class, `prefers-reduced-motion` gated,
tokens-only). Committed in the lane, rebased onto the wave branch,
ff-merged, pushed. **(4) Doctrine amended:** AGENTS.md + CLAUDE.md now
describe relay v5 (autonomous dispatch via `dispatch-unit`; Seth
hand-relaying still works), spec flipped ADOPTED. Also this session:
QUEUE.md had NTFIX1 stale-QUEUED — flipped to LANDED `e0ba383`; HANDOFF
aging pass done (five entries July 10-13 moved verbatim to the
archive). **Leftover (gated deletion candidates):** lane branches
`cursor/pricing-probe` and `cursor/nt3-entry-deferability-polish` (the
latter == wave HEAD; both get re-pointed by `checkout -B` on the next
dispatch anyway).

**NEXT UP — the pre-main gate.** NT3 was the last unit: the NT-wave is
code-complete on `not-tracked-ux-wave` (`98963f6`). Before any merge to
main: (a) Seth smokes NTFIX1 (B/C/D/E) + NT3 on the staging Vercel
preview — RUNBOOK step 6 staging repoint to this branch may still be
owed first; smoke list: [1] completed session with an unresolved
exercise -> pill is tappable, sheet opens straight at the muscle-seed
step, no "Use that name" anywhere, create succeeds, pill flips to
Tracked with a soft fade; [2] live session -> unchanged NT2 stepped
flow incl. suggest step and as-you-type pill; [3] Main/Assists toggle
reads pressed-state (D); [4] close the sheet mid-flow any way — no
confirm, no nag (deferability); (b) Fable/Opus full-branch-diff review
with the archive in hand — open findings for it: **F** ("Failed to
fetch" = Render cold-start candidate, needs a live Network-tab repro),
**G** (id-only `userExerciseId` stamp PATCH 400s every time — root cause
now CONFIRMED, see issue 8; still needs a client/server
contract-reconciliation block, and a candidate patch awaiting audit is
parked on `parked/unattributed-g-fix` that the gate may adopt or reject
in favour of the server-side option), and the React DOM-nesting warning
(pill button inside heading button). The branch tree is restored to the
audited `98963f6` — **the gate reviews only audited units; the parked
branch is deliberately NOT in that diff.** Merge stays behind Seth's
"push to main" trigger phrase.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 14 thirteenth session (Sonnet — relay v5
one-time manual setup complete; env/PATH staleness gotcha). The prior
rewrite aged the July 13 twelfth session (Fable — relay v5 proposal),
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

- **`not-tracked-ux-wave` is at `98963f6` (July 14)** — NT1 + NT2 +
  NTFIX1 + NT3 + the relay v5 docs (spec, skills, QUEUE, doctrine
  amendment) all on `origin/not-tracked-ux-wave`. Wave code-complete;
  pre-main gate pending. Branched off `analytics-rebalance-wave` HEAD
  `e960645` (= `main` `57b1fc8` + one docs bookkeeping commit).
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
   (`f4baee3`), NT2 (`f26e783`), NTFIX1 (`e0ba383`), NT3 (`98963f6`) all
   audited + pushed to `not-tracked-ux-wave`. Seth's smoke PASSED (all
   four items, see top entry). Remaining sequence: Fable/Opus
   full-branch-diff review (open findings F, G, DOM-nesting — see top
   entry) -> Seth's "push to main" trigger. Design source:
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
- **`parked/unattributed-g-fix` (`532125d`, July 15) — NOT a deletion
  candidate; it holds the ONLY copy of the parked work.** Local-only
  (unpushed: unaudited code should not reach origin until it clears
  `land-unit` or a block claims it). Four findings-fixes authored July 14
  by session `ee60a330`; see the top entry for traced provenance — the
  COMMIT MESSAGE's "unattributed / no lanes run / scope creep" framing
  predates the trace and is superseded. Feeds the finding-G block
  (issue 8).

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
   `userExerciseId`). A candidate client-side patch is parked on
   `parked/unattributed-g-fix` (`532125d`), authored July 14 by session
   `ee60a330` at Seth's "fix all findings" request and self-reported green
   (unit 170/170, ESLint, Vite build) — **but green is self-reported and
   the work never went through a block, so audit it via `land-unit`
   before adopting; do not cherry-pick blind.** It also found that
   `http()` throwing on the 400 skips the cache invalidate/refresh, which
   is the part that actually keeps the pill stale — the block must fix
   that too, not just the patch shape.

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
