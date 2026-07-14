# HANDOFF — current state

**Updated:** July 14, 2026, fourteenth session (Fable — RELAY v5 ADOPTED:
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
**G** (id-only `userExerciseId` stamp PATCH 400s every time — needs a
client/server contract-reconciliation block), and the React DOM-nesting
warning (pill button inside heading button). Merge stays behind Seth's
"push to main" trigger phrase.

Previous entry (July 14, thirteenth session, Sonnet — MANUAL SETUP FOR
RELAY v5 COMPLETE, no product code). Walked Seth through the four-item
one-time setup checklist from `docs/specs/autonomous-cursor-dispatch.md`
("One-time setup" section) in chat: (1) **`CURSOR_API_KEY` minted +
set as a User env var** — confirmed present in the registry
(`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')` ->
truthy); (2) **Cursor CLI installed** via `irm
'https://cursor.com/install?win32=true' | iex` (Windows installer, not
the Unix curl form the spec's prose implied — worth a spec correction
whenever Fable next touches that doc) — **`agent login` completion is
UNCONFIRMED**, Seth moved to step 4 before answering; not necessarily
blocking since the spec allows relying on `CURSOR_API_KEY` alone in CI
mode, but verify explicitly before the first dispatch; (3) worktree
root `C:\dev\worktrees\` already existed (n5 precedent), nothing to do;
(4) **overage toggle confirmed OFF** — dashboard screenshot showed
"On-Demand Spending: Disabled" and "Monthly Limit: Disabled" under Pro
($20/mo, 33% of included usage consumed, resets Jul 17) — matches the
billing precondition exactly (exhaustion means refusals, never a
surprise charge). **Known environment gotcha hit twice this session:**
neither the env var nor the newly-installed CLI (`agent` / `cursor-agent`
on PATH) were visible to this Claude Code session's own shell after
Seth set/installed them in a separate terminal window — Windows only
hands updated env/PATH to processes spawned after the change reaches
whatever launched the session, not to an already-running one. **Session
was restarted specifically to pick these up; next session should verify
first** (`Get-Command agent`, `$env:CURSOR_API_KEY` truthy) before
attempting anything else. **Next up per the resume sequence: skip
straight to step (2)** — run the spec's pricing probe (read-only cloud
agent -> `GET /v1/agents/{id}/usage`, plus the CLI-auto rung), record
the numbers in the spec, then confirm/flip routing defaults, then the
NT3 live dispatch trial. Status still PROPOSED — nothing adopted into
AGENTS.md/CLAUDE.md until the probe validates and NT3 lands clean via
the new channels.

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 13 twelfth session (Fable — relay v5 proposal),
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
   audited + pushed to `not-tracked-ux-wave`. Sequence: staging repoint
   (RUNBOOK step 6) -> Seth smokes NTFIX1 + NT3 on the Vercel preview
   (list in the top entry) -> Fable/Opus full-branch-diff review (open
   findings F, G, DOM-nesting — see top entry) -> Seth's "push to main"
   trigger. Design source: `docs/design/not-tracked-add-flow-brainstorm.md`.
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
8. **NEW (July 14, from finding G):** client/server contract
   reconciliation for the id-only `userExerciseId` stamp PATCH (server
   accepts id-only identity PATCH, OR client sends name+id together) —
   needs a task block after the pre-main gate weighs in.

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
