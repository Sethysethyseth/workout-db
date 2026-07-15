# HANDOFF — current state

**Updated:** July 15, 2026, twentieth session (Fable — **CW1 LANDED
`018a6ae`: the cursor-watch dashboard**; CW2 authored + dispatched).
Seth asked for a live visual of Cursor working, token cost weighed.
Shipped as dev tooling: `scripts/cursor-watch.mjs` — zero-dependency
(Node built-ins only), binds 127.0.0.1 only; run
`node scripts/cursor-watch.mjs`, open `http://127.0.0.1:4646`.
Recursive fs.watch + 3s git poll of the lane worktree, SSE to an
embedded dark mission-control page: live activity feed, per-file +/-
diff bars, typing-reveal pane on the newest diff, WAITING -> CURSOR IS
WORKING -> DELIVERY READY keyed off `DELIVERY.md`, optional
`cursor-run.log` tail. **Zero tokens to watch** — no LLM in the loop;
built by Cursor on the free B-auto rung (the tool that visualizes
Cursor was itself an autonomous dispatch). Audited per `land-unit`:
lanes re-run fresh in the lane (unit 170/170 in 14 suites, Vite build
128 modules); live contract spot-checked against a scratch dir (200
text/html; file write -> WORKING event; DELIVERY.md -> DELIVERY READY;
missing lane exits 1); imports all `node:` built-ins; no external URLs
in the page; no deviations. **CW2 dispatched same session** (auto-open:
`--open`, `--open-on-activity` with once-per-run re-arm on DELIVERY.md
removal/branch change, `--open-cmd` test override) so the dashboard
POPS the moment Cursor starts working; `dispatch-unit` amended with
the pop-the-visual step (ensure watcher serving + open browser at
dispatch; skip gracefully where the script doesn't exist). Two-agents
note, a precedent that WORKED: this session interleaved with the
nineteenth (gate/merge) in the SAME tree — the gate session
deliberately carried this session's uncommitted CW2 QUEUE entry in
`2318a87` and left its in-flight skill edit unstaged; this session
committed those in `1b9174b`; status checks before every commit, zero
collisions. No staging smoke owed — dev tooling, never in the client
build; Seth verifies by watching the dashboard during a live run.

Previous entry (July 15, nineteenth session, Opus — **PRE-MAIN GATE
PASSED + NT-WAVE MERGED TO MAIN `c473e21`**). The gate ran on the full
`main...not-tracked-ux-wave` diff with the archive in hand, then Seth
gave the trigger phrase and the merge went ff-only via a scratch
worktree outside OneDrive (`C:\dev\worktrees\main-merge`, removed
after — the `ui-palettes-v2` precedent; never stash+checkout on this
repo). **`origin/main` CONFIRMED at `c473e21`**, fast-forwarded
`57b1fc8..c473e21`, 28 commits, no merge commit, history still linear.
Product units in it: NT1 `f4baee3`, NT2 `f26e783`, NTFIX1 `e0ba383`,
NT3 `98963f6`, NTFIX2 `888e44d`; the rest are docs/blocks/skills/relay
v5+v5.1 doctrine + `check-hex.mjs`. **No schema, no migration anywhere
in the wave** (server surface = `searchCatalog.js` + its test, both
analytics-pure), so this was a code-only deploy with no DB track.

**GATE RESULTS — read before acting on any of these.** Passed: both
lanes re-run fresh on the merge candidate (unit 170/170 in 14 suites;
Vite build 128 modules); tokens-only holds COMPLETELY (zero raw colors
added anywhere in `client/src` across the wave, `index.css` included —
all 274 new CSS lines are `var()`/`color-mix`); motion is 180ms on
`--ease-standard`, inside the 150-250ms bar, gated behind
`prefers-reduced-motion: no-preference`; cross-user isolation sound
(`validateOptionalExerciseIdentity` scopes `userExerciseId` by
`findFirst({ id, userId })`, session ownership separately 403s — note
NTFIX2 makes that path reachable for the FIRST time and it is correctly
guarded); NT2's runtime-invisible criteria all verified (`CHIP_CYCLE`/
`nextChipRole` gone, retroactivity line in the CREATE done-state only,
LINK variant correctly omits it, link paths use the
`buildSessionExerciseNamePatch` idiom); permissions additive with no
destructive allowlisting.

**RULED — do not re-litigate: the NTFIX2 rename is CONTRACT-SANCTIONED,
not a deviation.** NT2's block (`docs/tasks/nt2-add-exercise-stepped-
sheet.md`, lines 101-104) specifies the create path commits
`userExerciseId` "via the same updateSessionExercise path (**name
unchanged if it already matches**)" — a parenthetical that only parses
if the name is SENT alongside the id. NTFIX2 restored the specified
behavior; the id-only version was the deviation that made the path
silently no-op. The design treats row renames as routine (the LINK
done-copy refuses the retroactivity claim precisely BECAUSE "a rename
affects only this session's row"). Seth's smoke passed it. Closed.
Also accepted on the record: NTFIX2's relay deviations (Claude Code
authored the product code — direct-fix exception + Seth's explicit ask;
audited per `land-unit` before landing).

**SHIPPED KNOWINGLY — the gate's one real finding, now the top
follow-up (see "Next up" 0a).** Nested `<button>` on the LIVE-session
path: `SessionDetailPage.jsx:1468` renders
`<button className="session-exercise-heading-toggle">{headingInner}</button>`
and `headingInner` contains `ExerciseTrackedIndicator`, which renders a
`<button>` when interactive (`:127`). Completed sessions use a `<div>`
wrapper (`:1479`) and are FINE — this is live-only, i.e. exactly the
path NT2 made interactive. Invalid HTML + React nesting warning +
nested interactive controls are an AT problem (the inner control's
accessible name can be swallowed). Functions today only because the
inner `onClick` calls `stopPropagation`. NOT pre-existing relative to
main — this wave introduced it when NT2 turned the pill into a button.
Fix: lift the pill out of `headingInner` so it renders as a SIBLING of
the toggle. Seth chose to ship and follow up.

**NEXT UP — post-merge verification (Seth's, all three).** The NT-wave
is DONE: gate passed, NTFIX2 smoke passed (all five items incl. the
rename), merged to main `c473e21`. Owed now, none of which an agent can
do from here: **(1) verify the prod deploy SHA == `c473e21`** in Render
AND Vercel Events — push is NOT proof of deploy, a redeploy rebuilds the
OLD HEAD until it catches up; **(2) RUNBOOK step 6** — repoint staging
Render off `not-tracked-ux-wave` back to `main`, verify that redeploy's
SHA too; **(3) prod smoke** — the NT flow on prod, folding in the
carried N-wave item: the "Every exercise, in one place" What's New modal
fires for a logged-in user (prod is the ONLY place it renders).
Open findings that SURVIVED the gate, in priority order: the nested
`<button>` (top entry — "Next up" 0a), **F** ("Failed to fetch" = Render
cold-start, no client defect; needs a live Network-tab repro, not code),
the **G server-side question** (issue 8 — client fix already shipped), and
"Use that name" being unable to stamp identity for custom exercises
(issue 9).

Aged out this rewrite, moved verbatim to `docs/HANDOFF-ARCHIVE.md`
(newest first): the July 15 **eighteenth** session (Fable — relay v5.1
resident-session amendment: batch Seth's touchpoints, never the machine
checkpoints). The prior rewrite aged the July 15 **seventeenth** session
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

- **N-wave follow-ups — SUPERSEDED July 15 by the NT-wave merge; do all
  three against `c473e21`, not `57b1fc8`, and see NEXT UP:** (1) verify
  prod deploy SHA (was `57b1fc8`, now `c473e21`) in Render/Vercel
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

00. **NT-WAVE DONE — merged to main `c473e21`, July 15.** Gate passed,
   smoke passed, all five units in main. What remains is Seth's
   post-merge verification (prod deploy SHA, RUNBOOK step 6 staging
   repoint, prod smoke) — see the NEXT UP paragraph. Design source:
   `docs/design/not-tracked-add-flow-brainstorm.md`.
0a. **TOP FOLLOW-UP — nested `<button>` on the live-session path
   (SHIPPED KNOWINGLY, gate's one real finding).** Full diagnosis with
   file:line in the top entry. Wants a small Cursor block, NOT a direct
   fix: the diagnosis is done but the restructure (lift the pill out of
   `headingInner` to render as a SIBLING of the heading toggle, without
   breaking the sticky-heading layout or NT3's completed-session path)
   is implementation-heavy, which per AGENTS.md sends it to Cursor
   however small. Watch for: the `stopPropagation` in the pill's
   `onClick` (`:132-136`) exists to stop the toggle firing — once the
   pill is no longer a descendant, re-check whether it is still needed.
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
9. **NEW (July 15, from the pre-main gate):** "Use that name" can never
   stamp structural identity for CUSTOM exercises. The resolve endpoint
   returns `canonicalName` + `catalogId` but NO `userExerciseId` for
   `source: "userExercise"` (`exerciseController.js:77-82`), so
   `handleUseThatName` correctly guards on `source === "catalog"` and
   links by name alone otherwise — the sheet is doing the best the
   payload allows, so any fix starts SERVER-side. Name-based resolution
   (A4/A6) covers the behavior; only the structural id-link is missing.
   Pairs naturally with issue 8 — same contract surface, do them
   together.

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
