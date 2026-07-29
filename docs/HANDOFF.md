# HANDOFF — current state

**Next action (human):** Nothing blocks the E-wave — say "dispatch E1" and
the relay runs. Two decisions are yours whenever you want them, neither
urgent: **AI0** (`ai-layer.md` section 4.2 — build an OAuth 2.1
authorization server vs delegate to a managed provider; recommendation is
delegate) blocks the AI connector lane but NOT the E-wave, and the
untracked `docs/parked/*` files still need a ruling (commit here, or move
to the workflow repo).

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** July 29, 2026, thirty-fourth session (Opus frontier seat —
**AI-layer planning pass; the E-wave is OPEN with E1/E2 QUEUED and
pushed, nothing dispatched**). Prior entry: July 28, thirty-third session
(Opus frontier seat — FP wave confirmed shipped in prod). Full session
logs for both, including the research that ruled out `.mil` credentials
and the scope finding that halved this wave, are verbatim in
`docs/HANDOFF-ARCHIVE.md`.

---

## The E-wave (effort logging) — 2 units, 0/2 dispatched

Branch **`effort-wave`** at **`b214247`**, pushed (`origin/effort-wave`
confirmed). Branched off `main` `90248f9`; code is identical to main, the
commit is docs-only.

- **E1** `docs/tasks/e1-effort-capture-default-on.md` — QUEUED. RIR
  defaults ON for new templates, new block templates, and quick logs;
  RPE stays off; a stored boolean always wins. MODEL auto.
- **E2** `docs/tasks/e2-effort-legacy-nudge.md` — QUEUED. Point-of-edit
  nudge + why-RIR education when both toggles are off. Copy authored
  verbatim in the block. MODEL auto.

FILES TO TOUCH are fully disjoint (E1: `SessionDetailPage.jsx`,
`CreateTemplatePage.jsx`; E2: `RirRpeToggleRow.jsx`, `index.css`), so they
MAY run concurrently in separate lanes. Preferred order is still E1 then
E2 — E2's acceptance criteria read more cleanly once the new default
exists.

**Hard constraints repeated in both blocks:** no schema change, no
migration, no backfill. The Prisma `useRIR Boolean @default(false)` stays
as-is; existing templates keep their stored values and are nudged, never
silently rewritten.

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

### Before dispatch: the lane worktrees are stale

All three still sit on FP-wave branches — `cursor-lane` on `cursor/fp11`
(`5ca24f4`), `cursor-lane-2` on `cursor/fp10` (`6ddda4b`), `cursor-lane-3`
on `recon/e1rm-blast` (`4078c0b`). Repoint the lane to a branch off
`effort-wave` before dispatching, or the delivery lands on the wrong base.
Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status` (it is
gitignored, so a stale report reads as "clean").

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
- **Staging Render tracks `main`** (Seth repointed it July 28). If the
  E-wave needs server-side smoking, it must be repointed to `effort-wave`
  first — E1/E2 are client-only, so probably not.
- **`effort-wave` at `b214247`** — docs only so far.
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
