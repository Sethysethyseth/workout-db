# HANDOFF — current state

**Next action (human):** Smoke the E-wave on the staging Vercel deploy
against the checklist below (branch `effort-wave`, `origin` HEAD
`3eadc64`) and give a sign-off — the pre-main gate is blocked behind it.
Two decisions remain yours whenever you want them, neither urgent:
**AI0** (`ai-layer.md` section 4.2 — build an OAuth 2.1 authorization
server vs delegate to a managed provider; recommendation is delegate)
blocks the AI connector lane, and the untracked `docs/parked/*` files
still need a ruling (commit here, or move to the workflow repo).

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** July 29, 2026, thirty-fifth session (resident relay —
**E-wave CODE-COMPLETE 2/2, awaiting Seth's smoke sign-off**). Prior
entry: July 29, thirty-fourth session (Opus frontier seat — AI-layer
planning pass, E-wave opened). Full session logs, including the research
that ruled out `.mil` credentials and the scope finding that halved this
wave, are verbatim in `docs/HANDOFF-ARCHIVE.md`.

---

## The E-wave (effort logging) — 2 units, 2/2 LANDED

Branch **`effort-wave`** at **`3eadc64`**, pushed (`origin/effort-wave`
confirmed). Branched off `main` `90248f9`. Client-only; no server code,
no schema change, no migration.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.

Both dispatched CONCURRENTLY (lanes 1 and 2, Channel B auto rung) and
landed serially through one reviewer. The frontier seat's "preferred E1
then E2" turned out to be a readability preference, not a dependency:
E2's acceptance criteria are all prop-driven on `RirRpeToggleRow` and
never read E1's defaults. Cost of the parallelism was one extra rebase.

**Session log — what the audit found beyond the reports:**

- **E1 carried one real gap, declared but unfixed.** `resetFlow()` — the
  **Back** button on both create forms (`CreateTemplatePage.jsx:299`,
  `:420`) — still reset `useRIR`/`blockUseRIR` to `false`, so the next
  "first render" would have contradicted the new default. Cursor flagged
  it as a residual and left it, reading the block's named line numbers as
  the scope boundary. Fixed directly (trivia tier, diagnosis was the
  whole job): both flipped to `true`, lanes re-run green after.
- **E2 was clean** — no deviations declared, none found. Copy verified
  character-by-character against the block's verbatim spec.
- Two build-invisible risks checked by hand on E2, both clear: the new
  `var(--color-muted)` genuinely resolves (`index.css:63`, an alias of
  `--color-text-secondary`, so all 8 palette/mode combos inherit it), and
  all five `RirRpeToggleRow` call sites pass BOTH `useRIR` and `useRPE`
  explicitly — the nudge keys on absence, so an omitted prop would have
  rendered it spuriously.
- E2's lanes were re-run after rebasing onto E1, i.e. against the
  combined wave state rather than the delivered state.
- **Lane hygiene:** all three lanes were stale on FP-wave branches as
  warned. Lane 1 also carried a zero-byte `index.lock` about five hours
  old with no git process behind it (OneDrive lag) — cleared before
  checkout. Stale FP `DELIVERY.md` files were deleted from both lanes
  first, per the gitignored-report staleness trap.

### Smoke checklist — the whole wave (staging Vercel, `3eadc64`)

1. **New workout template** (Create template → workout): the RIR toggle
   is ON and RPE OFF before you touch anything, and set rows show a RIR
   column.
2. **New block template** (Create template → block): same — block RIR ON,
   RPE OFF on first render.
3. **Back, then re-enter either form:** RIR is still ON (this is the
   reviewer fix; before it, Back silently turned RIR back off).
4. **Quick log on a fresh device/profile** (no stored prefs): RIR toggle
   ON, RPE OFF, and the set row exposes a RIR input.
5. **Quick log where you previously turned RIR OFF:** it stays OFF. Your
   stored choice beats the new default — this is the one that proves
   nothing was silently rewritten.
6. **An existing saved template with RIR off** → open it for editing: it
   still shows RIR OFF, and now also shows the two-line nudge
   ("Effort logging off - volume still tracks…" / "Two sets of 10 can be
   worlds apart…"). Toggling RIR on makes the nudge vanish with no
   reload.
7. **RPE-only** (RIR off, RPE on): the nudge does NOT appear — RPE alone
   is a valid effort signal.
8. **Nudge reads as a quiet hint**, not a warning: no color alarm, no
   icon, no banner, nothing dismissible, no layout shift pushing the
   toggles off screen. Check it in a couple of palettes and in dark mode.
9. The pre-existing "RIR — Reps in Reserve" / "RPE — Rating of Perceived
   Exertion" definition lines still render, nudge showing or not.

**Hard constraints held:** no schema change, no migration, no backfill.
The Prisma `useRIR Boolean @default(false)` is untouched; existing
templates keep their stored values and are nudged, never silently
rewritten. Verified in the audit, not just asserted.

**Why this wave is only 2 units.** The effort stack is ALREADY BUILT end
to end: `rir`/`rpe` on `WorkoutSet`, `deriveEffortRir()`
(`server/src/analytics/effort.js`), `meta.effortCoverage`
(`summary.js:143`), the coverage meter (`AnalyticsPage.jsx:600-607`), the
sub-60% note (`WeeklyReport.jsx:164`), and the adaptive volume headline
via `EFFORT_COVERAGE_HEADLINE_THRESHOLD` (`StatTiles.jsx:16`). A planned
third unit (coverage honesty surface) and most of a fourth (education
copy) were DROPPED as already implemented. **Do not re-author them.**
The only real gap was that capture defaults OFF
(`SessionDetailPage.jsx:2205`, `CreateTemplatePage.jsx:46-47`, `:493-494`).

### Lane worktree state (post-wave)

`cursor-lane` is on `cursor/e1` (`876bd58`), `cursor-lane-2` on
`cursor/e2` (`3eadc64`) — both landed and ff-merged, so both lanes are
free. `cursor-lane-3` is untouched on `recon/e1rm-blast` (`4078c0b`).
Repoint any lane to a branch off the target wave before dispatching, or
the delivery lands on the wrong base. Check lane cleanliness by
DELIVERY.md TIMESTAMP, not `git status` (it is gitignored, so a stale
report reads as "clean") — and delete the stale report before the run so
the incoming one cannot be mistaken for landed work.

## The AI layer — spec'd, nothing authored

- **`docs/specs/ai-layer.md`** is the AI design of record. Two surfaces,
  **connector first**: Lane A a remote MCP server the user adds inside
  the AI app they already pay for (their subscription funds inference, we
  pay zero tokens); Lane B the in-app coach proxy where BYO-key and
  hosted are ONE code path with a different key source. Phasing AI0-AI6.
- **`docs/specs/ai-theming.md`** — AI-generated palettes. The model emits
  a ~20-hex token object, **never CSS**. Spec only, by Seth's decision.
- `analytics-engine.md` section 8 is AMENDED, not contradicted; Track C
  now means `ai-layer.md`. Do not phase AI work from the old section.

**AI0 blocks the whole connector lane** and is Seth's call: the server has
no OAuth today (cookie sessions + `server/src/lib/jwt.js` only) and remote
connectors need OAuth 2.1 with dynamic client registration. Build vs
delegate — recommendation is delegate, since hand-rolling it turns the
cheapest lane into the most security-sensitive code in the repo.

**Two premises settled this session, so nobody re-litigates them:**
`.mil`/DoD credentials are permanently out (5 CFR 2635.704 — government
property, authorized purposes only), and consumer-subscription OAuth in
third-party apps is a ToS violation, not merely unavailable. Detail in
`ai-layer.md` section 3 and the archive.

**Correction on record** (`ai-theming.md` section 4): `check-hex.mjs`
CANNOT gate AI-generated palettes — it scans a git diff
(`check-hex.mjs:23`), so runtime-generated output never reaches it. It
stays the right tripwire for authored code. A separate pure validator is
specified.

## Repo / deploy state

- **`main` is at `90248f9` (July 21)** — the frontier-parity-wave merge,
  deployed and prod-smoked clean (Seth, July 28). Prod Vercel/Render
  track `main`. **Because prod tracks main, any push to main is a
  prod-bound push (gate item 2)** — this session's docs went to
  `effort-wave` for exactly that reason.
- **Staging Render tracks `main`** (Seth repointed it July 28). The
  E-wave shipped ZERO server changes, so smoking it against a `main`
  Render backend is correct — no repoint needed.
- **`effort-wave` at `3eadc64`** — E1 + E2 + 2 docs commits.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed; their branches
  plus the lane branches are deletion candidates (gated).
- FP8 (PWA icons) is the only open FP unit — DRAFT, blocked on Seth
  dropping icon PNGs into `claudefiledrop/` (as of July 29 it holds only
  an analytics screenshot). Icons LAST by his rider.

## Other open items (unchanged)

**Seth items:** the R6 tagline pick (one-line `AuthLayout.jsx` swap); FP8
icon PNGs; the Cursor model-routing question; the `docs/parked/*` ruling.

**PARKED by Seth — the block builder.** "don't do anything with the block
builder for now, that's for another wave." Evidence in
`docs/specs/block-execution-gap.md` (`267271c`): the multi-week layer is
fully authored in schema + API + builder UI but CANNOT BE TRAINED. **Do
NOT author against it, and do NOT ask him about it again** — he already
ruled. It also records that Execution reads planned values LIVE from
`TemplateSet` rather than snapshotting, so editing a template
retroactively changes what past sessions are judged against.

**Spec'd, unauthored:** R9/per-side in
`docs/specs/strength-score-per-side.md` (SS1-SS3); gym context in
`docs/specs/gym-context.md` (G1 is migration-carrying = Seth's manual
track). Evidence base for FP units stays
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`).

**Loose ends:** CW3 visual sign-off on the next live watcher run. Finding
**F** stays open ("Failed to fetch" = Render cold-start ranked cause;
needs a live Network-tab repro). A-wave optional Step-7 backfill:
`node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply`
against prod — idempotent, safe to defer. T3C sprite loader unblocks when
Seth drops the Gemini frames in `claudefiledrop/`. T4 motion (last
unstarted U5 unit) needs a frontier-seat design pass.

**Analytics/catalog track.** Track B v1 (B1-B9) MERGED (`e9ce82c`), Track
A MERGED (`13a1e59`), prod migrated + seeded. Residual: (1) validator
surfaced 29 secondary-less compounds in the 675-exercise lifting subset —
curation-skim candidate (A3), pairs with the catalog/`searchCatalog`
review pass (maintenance item 16); (2) integration test step-6 output
(malformed-key seed behavior) still UNVIEWED.

**Issues to open:** connect-pg-simple `session` table drift (proposed
`@@ignore`); integration-suite isolation on shared staging (Neon
copy-on-write branches would kill the FK-pollution flake); user-defined
exercise support; favicon/PWA icon swap; migration automation vs manual
discipline; schema sentinel (`docs/specs/schema-sentinel.md`); **repo
lives inside OneDrive** (already caused a `git stash` hang — decision for
Seth: move to `C:\dev\workout-db` or exclude from sync; everything is
pushed, so the move is low-risk).

**Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
`SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
deprecation. Also parked: `round-7-unify-set-row` (`f6c2a6f`), decision
pending.

**Dispatch-mechanism lessons** from the thirtieth/thirty-first sessions
(detached-launch fix for the background-task reap bug, the
DELIVERY.md-is-gitignored staleness trap, killed-run salvage) are verbatim
in `docs/HANDOFF-ARCHIVE.md` — still load-bearing for future dispatches.

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
