# HANDOFF — current state

**Next action (human):** **Smoke E3 on the staging Vercel deploy** (the one
new item: Analytics -> Data quality -> the `(?)` next to the effort-coverage
line). E1/E2 were already signed off August 1 and are NOT re-smoked. Once you
sign off, the pre-main gate re-runs SCOPED TO THE DELTA and then the merge
waits on your "push to main". Two decisions still yours, neither urgent nor
blocking the merge: the untracked `docs/parked/*` ruling (commit here, or move
to the workflow repo), and the F-wave shape confirmation before it is authored.
AI0 is now RESOLVED and no longer needs you.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 2, 2026, thirty-seventh session (Opus frontier seat —
**E3 authored + landed; AI0 RULED and its recon landed; gate now stale for
the delta**). Prior entry: August 1, thirty-sixth session (Opus — E-wave
smoke sign-off + pre-main gate PASS; F-wave ruled). Full session logs are
verbatim in `docs/HANDOFF-ARCHIVE.md`.

---

## The E-wave — 3/3 LANDED, E3 awaiting smoke, gate STALE for the delta

Branch **`effort-wave`** at **`19c2c20`**, pushed. Branched off `main`
`90248f9`. Client-only throughout; no server code, no schema change, no
migration.

- **E1** `876bd58` — RIR defaults ON for new templates, new block
  templates, and quick logs; RPE stays off; a stored boolean always wins.
- **E2** `3eadc64` — point-of-edit nudge + why-RIR education when both
  toggles are off, both variants, tokens-only.
- **E3** `19c2c20` (August 2) — the "why we ask for effort" rationale as a
  `HowCalculatedButton` on the Analytics Data-quality coverage row.

**Smoke sign-off: Seth, August 1 — covers E1/E2 ONLY.** He raised three
findings; all three were classified as next-wave scope, none an E1/E2
contract failure (see the F-wave section). He then explicitly chose to gate
and merge the wave as-is rather than hold or revert E2. **E3 postdates that
sign-off and is NOT covered by it.**

**Pre-main gate: PASSED August 1, but only through `1a585ed`.** Lanes were
re-run fresh on the branch — 204 unit tests / 15 suites green, client build
clean, `check-hex.mjs` exit 0. Each commit touched exactly the files its
block named (E1 two, E2 two); `schema.prisma` absent from the diff as
contracted; no scope leakage; no security/auth/cross-user surface.

**That PASS is now STALE FOR THE DELTA.** Three commits landed after it:
`ad0f313` (specs + blocks), `b043d68` (queue), `19c2c20` (E3 code). The gate
must re-run SCOPED TO THOSE COMMITS before the merge. E1/E2 do not need
re-gating — nothing in the delta re-touches their files. Order is unchanged
and non-negotiable: Seth smokes E3 -> scoped gate -> "push to main".

### E3 — what landed and why it is where it is

One file (`client/src/pages/AnalyticsPage.jsx`), 4 insertions. Adds a
`HOW_EFFORT_MATTERS` copy constant beside the existing `HOW_*` constants and
renders the already-imported `HowCalculatedButton` on the coverage row in
`DataQualitySection`.

Placement rationale, so it is not "improved" later by accident: the page
already explained what each metric COSTS without effort
(`HOW_STIMULATING_SETS`) and `MetricInfoButton` already DEFINES RIR/RPE at
logging time. The missing layer was the conceptual why, and it belongs where
the user reads their own coverage number — not mid-workout, where an
explainer on a mandatory field signals that the field is an imposition.
Deliberately scoped to the `effortCoverage !== null` branch: a user at 0%
coverage still renders that row and IS the intended reader, while `null`
means no attributed sets at all and has nothing to explain.

The copy reuses E2's smoke-approved line. That is load-bearing for the
F-wave: E2's nudge fires on `!useRIR && !useRPE`, which becomes impossible
once the F-wave makes one signal always selected, so the copy would
otherwise have become dead code.


## The F-wave (effort mandatory) — RULED by Seth, NOT YET AUTHORED

Seth's August 1 rulings, from the E-wave smoke. These supersede the
"someday" framing of the mandate:

1. **RIR and RPE are EITHER-OR, never both.** Two independent toggles is
   the wrong model — one effort signal per template/session, RIR default.
2. **Mandatory lands in the SAME wave as either-or.** He was offered a
   3-state `RIR | RPE | Off` interim and explicitly chose `RIR | RPE`
   with no Off state.
3. **Capture preference must be REMEMBERED, device-local.** Extend the
   existing `quickWorkoutLogPrefs.js` localStorage pattern (same
   precedent as `weightUnitPref.js`) to template creation and block
   templates. Explicitly NOT an account-level column — no schema change,
   no migration.

**The conflict this creates, and the agreed resolution.** With no Off
state, an existing template storing both toggles `false` (no backfill
ever ran, so these exist) renders a control with nothing selected. The
two naive exits are both wrong: auto-selecting RIR silently rewrites a
stored user choice — exactly what E-wave smoke item 5 existed to catch —
and keeping an implicit off-state is the 3-state option in disguise.
Resolution put to Seth and not contested:

- **New templates, block templates, quick logs:** hard 2-state, one
  signal always selected, RIR default, remembered from prefs. No Off.
- **Legacy templates with both off:** a one-time REQUIRED CHOICE on open.
  Nothing is written until the user picks. E2's copy is not deleted — it
  is repurposed from a quiet hint into that prompt, which also satisfies
  the standing "the mandate ships WITH user education" requirement.
- **Enforcement:** block session completion when a captured-effort set
  has no value. Already-completed historical sessions untouched.

**Where the pref gap actually is** (verified August 1, not assumed):
preference memory exists for QUICK LOGS ONLY. `quickWorkoutLogPrefs.js`
persists `useRIR`/`useRPE`/`useExerciseNotes`, restored at
`SessionDetailPage.jsx:2199-2206`. Template creation ignores it entirely
(`CreateTemplatePage.jsx:46-47` hardcodes `useState(true)`/
`useState(false)`; block equivalents the same), and template-driven live
sessions take the template's stored booleans via the
`session.workoutTemplate` branch at `SessionDetailPage.jsx:2190-2196` and
never consult prefs. Net effect: an RPE user is handed RIR-on/RPE-off on
every new template, forever. Weight unit DOES already persist
device-local (`weightUnitPref.js`, defaults lbs) — if it appears to
forget, that is a SEPARATE bug and needs a repro.

**Not yet authored.** Blocks go through `author-task-block` once Seth
confirms the shape above. Expect ~3 units: toggle model + pref memory,
legacy required-choice prompt, completion enforcement.

### Lane worktree state

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

**AI0 is RESOLVED (Seth, August 2) — the connector lane is unblocked.** The
old build-vs-delegate binary was FALSE: it conflated app login with connector
auth and costed delegation as including a user migration. **Ruling: OAuth
layers OVER the existing cookie/JWT auth, connector-only, zero user
migration.** Deciding argument is blast radius, not cost — an IdP in the
app-login path is a single point of failure for the whole product; scoped to
the connector, an outage costs only the connector. Written into
`ai-layer.md` section 4.2.

**Recon landed** (`docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`): the
shape IS purchasable and free at our scale. Ranked WorkOS Standalone Connect
1 (1M MAU free, exact pattern fit), Scalekit 2, Stytch 3. Clerk, Auth0,
Logto and Keycloak disqualified with reasons recorded.

**Two corrections that came out of it, both already in the spec:**

- **DCR is NOT a hard MCP requirement any more.** Verified in-seat against
  the 2025-11-25 authorization spec, not taken from the report: CIMD is
  SHOULD, DCR is MAY and explicitly back-compat, protected-resource metadata
  (RFC 9728) is MUST on the server, and audience binding via RFC 8707 is
  MUST. Prefer a vendor with both CIMD and DCR. This widens the field.
- **The in-house fallback was under-costed in-seat** as "a few hundred
  lines." Honest sizing is multi-day to multi-week security-sensitive work
  plus ongoing spec-churn maintenance. Build on `oidc-provider` if ever
  taken; `oauth2orize` is stale. This makes delegation more clearly right.

**Two premises settled, so nobody re-litigates them:** `.mil`/DoD
credentials are permanently out (5 CFR 2635.704 — government property,
authorized purposes only), and consumer-subscription OAuth in third-party
apps is a ToS violation, not merely unavailable. Detail in
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
  prod-bound push (gate item 2).**
- **Staging Render tracks `main`** (Seth repointed it July 28). The
  E-wave shipped ZERO server changes, so smoking it against a `main`
  Render backend was correct — no repoint needed. The F-wave is also
  expected client-only; re-check that assumption if enforcement needs
  server validation.
- **`effort-wave` at `19c2c20`** - E1 + E2 + E3 + docs commits. E1/E2 gate-
  passed Aug 1; the delta (ad0f313, b043d68, 19c2c20) is NOT yet gated.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed; their branches
  plus the lane branches are deletion candidates (gated).
- FP8 (PWA icons) is the only open FP unit — DRAFT, blocked on Seth
  dropping icon PNGs into `claudefiledrop/` (as of Aug 1 it holds only an
  analytics screenshot). Icons LAST by his rider.

## Other open items (unchanged)

**Seth items:** the R6 tagline pick (one-line `AuthLayout.jsx` swap); FP8
icon PNGs; the Cursor model-routing question; the `docs/parked/*` ruling;
the F-wave shape confirmation.

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
- **A component keying off prop ABSENCE is a seam risk** — the E2 nudge
  (`!useRIR && !useRPE`) renders spuriously if any call site omits a
  prop. Build passes either way. Check every call site, not just the
  ones the block named.
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
