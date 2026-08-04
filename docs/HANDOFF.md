# HANDOFF — current state

**Next action (human):** **Rule on how AI1 gets executed** - it is
migration-carrying, so `dispatch-unit` refuses it and the whole (strictly
serial) AI-wave is stalled behind that one call; detail in "The AI-wave" below.
**The WorkOS staging dashboard is now DONE** (August 4, driven in-browser) -
only the Render env vars remain, and only `WORKOS_API_KEY` is Seth's to paste;
see "AI4 / WorkOS" below. Still open behind those, blocking nothing: the prod smoke of `main` `59e27dc` (covers the F-wave AND the leftover
E-wave pass), and the `docs/parked/*` ruling.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 4, 2026, forty-first session (Opus frontier seat — **the
AI connector wave AUTHORED, AI1-AI5, from three parallel recon lanes**). Prior
entry: August 4, fortieth session (Opus — F-wave gated, fixed, and merged to
`main` `59e27dc`). Full session logs are verbatim in
`docs/HANDOFF-ARCHIVE.md`.

---

## The F-wave (effort MANDATORY) — GATED and MERGED to `main`

**Merged August 4 as a clean fast-forward, `8541bca..59e27dc`** (14 commits).
Smoked by Seth on staging, then gated. **No schema change or migration anywhere
in it**; F1/F2/F3 are client-only, but F0 IS a `server/` change and is the first
server code to reach prod in a while — prod smoke is open.

- **F0** `00e06d9` — a template's stored effort signal now reaches the live
  session (six server selects + a one-time client seed).
- **F1** `3da8bf5` — either-or signal control (`rir | rpe | null`) plus
  `effortSignalPref.js`, wired to all five call sites.
- **F2** `bfa010a` — legacy both-false templates get a REQUIRED CHOICE on open;
  Save blocked until the user picks; loading one writes nothing.
- **F3** `0ee258b` — live session either-or control, signal locks after the
  first effort value, Finish blocked while a core-logged set is missing it.

- **Gate fix** `59e27dc` — the one finding, authored in-seat.

**What the gate caught, and why per-unit review could not.** F1 made the
device effort-signal pref writable from four template screens; F3's lock is
signal-AGNOSTIC (any non-blank `rir` OR `rpe` locks the control) while its
mandate counts only the ACTIVE signal. The live signal is re-seeded on every
remount from OUTSIDE the session — device pref for quick logs, template
booleans for template sessions. So changing the pref or the template mid-workout
re-seeded an in-progress session onto a signal its sets had no values for: the
control locked (a set carried effort), Finish blocked demanding the other
signal, and no way back, since the locked control is `pointer-events: none`.
Exactly the mid-workout dead end F3's own enforcement boundary forbids. **Each
unit met its contract exactly — the defect existed only where two units met.**
Both seed branches now prefer the currency already logged on the session's sets.
**Invariant: a session is never seeded onto a signal it has no values for.**

**Residual, accepted not fixed:** a legacy in-progress session holding MIXED
`rir` and `rpe` on different sets seeds to RIR, so its rpe-only sets ask for a
RIR value before Finish. Actionable (the field is visible on every set) and the
honest reading of the one-currency mandate. Do not "fix" it into a per-set
exception.

**Merged WITHOUT a re-smoke of the gate fix, by Seth's August 4 ruling** — the
change is state-seeding only, no markup or CSS, so there is no visual surface
smoke could have checked. All eight seed cases were walked by reading. If a
mid-workout Finish-block report ever arrives, start here.

**The durable lesson of this wave: the recurring failure was AUTHORING, not
execution — three times, in the same shape.** F0's block named
`FULL_SESSION_RELATIONS`, one of the TWO locations recon had found, so the fix
landed where it could never fire. F2's block named the required-choice prompt
but not `RirRpeToggleRow`'s built-in null-state nudge — one of the TWO things
that render that state — so the same sentence shipped twice on one screen. The
gate finding is the third: F3's block specified the lock without enumerating
what could re-seed the signal underneath it. **Generalized rule: when a contract
touches a state, it must enumerate everything already acting on that state, or
say why not** — and at wave scale, everything that can WRITE that state from
another screen.

### PROD smoke — Seth, on production, one combined pass

Covers the F-wave AND the still-open E-wave prod smoke. Staging smoke already
passed on August 4; this is the prod confirmation, and F0 makes it a real one.

- **Login still works.** F0 added six selects to `sessionController`; a broken
  session read shows up here first.
- Start a workout from a template with RIR on → the RIR field appears without
  touching anything (F0, the server change).
- Log a set with effort → the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** — the highest-value case in the vocabulary.
- Open an OLD completed session → nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders and the legacy
  nudge reads correctly.

---

## The E-wave — CLOSED and MERGED. Detail archived August 3.

**Merged August 2 as a clean fast-forward, `7d1c9ba..d272930`** (E1 `876bd58`
RIR-defaults-on, E2 `3eadc64` legacy nudge, E3 `19c2c20` + E4 `965b2c8` the
Analytics effort rationale). Client-only, no schema, no migration. Smoked and
gated in two passes (Aug 1 through `1a585ed`, Aug 2 scoped to the E3/E4 delta).
**The full section moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (top) when this
file exceeded its cap** — go there for the gate reasoning, the E3/E4 split, and
the cross-unit seam check.

**The one E-wave note still live for the F-wave gate:** the "two sets of 10"
sentence now ships in FOUR hand-varied forms (E2's nudge, E3's
`HOW_EFFORT_MATTERS`, E4's `EFFORT_RATIONALE_SHORT`, and now F2's
`EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`). None is a defect alone and this did not
block the August 2 gate. Consolidating them into one shared module is a known
follow-up — it should absorb F2's page-to-page import at the same time.


## The AI-wave — AUTHORED August 4, 5 units, 0/5 dispatched

Branch `ai-connector-wave` off `main` `59e27dc`; blocks at `a1689e0`, pushed.
Implements `docs/specs/ai-layer.md` Lane A end to end. Per-unit scope and the
serialization notes are in `docs/tasks/QUEUE.md`; the blocks are AI1-AI5 under
`docs/tasks/`.

**Seth's August 4 rulings, all three taken as asked:** full connector end to
end (not a foundation-only wave); **WorkOS** as the vendor and he creates the
account; and **yes to one migration** this wave. He also approved three npm
installs (gate item 5): `express-rate-limit` + `jose` in AI2,
`@modelcontextprotocol/sdk` in AI3. AI4 and AI5 carry no install approval.

**Naming, restated so nobody builds the wrong thing.** Seth calls this "the
server migration." It is NOT a user migration and must never become one. What
changes is that LogChamp gains the ability to ISSUE scoped OAuth tokens to
third-party clients, layered OVER the cookie/JWT auth that already exists.
Existing users, the user table, and the login flow are untouched. A block
description containing "migrate users" has misread this. (The one migration in
the wave is AI1's new `AiConsent` table — unrelated to identity.)

**THE WAVE IS STALLED ON ONE CALL, and it is Seth's.** All five units are
strictly serial and **AI1 is migration-carrying**, which `dispatch-unit`
section 4 refuses outright. So nothing can start until he either hand-relays
AI1 or explicitly clears it for dispatch. Worth him knowing when he decides:
**the block forbids running any migration command** — Cursor writes the `.sql`
file and stops, so the risk the rule exists to prevent (a bad migration hitting
live data) is not present in the execution, only in the later manual apply,
which stays his. That is a genuine argument for clearing it; it is still his
call, not the agent's.

**AI4 is the second blocker and it is worth starting NOW, in parallel** — its
code is authorable and lane-checkable without the vendor, but unsmokeable until
the WorkOS staging account, dashboard config, and secrets exist. The ten-step
checklist is at the bottom of `docs/tasks/ai4-workos-connector-auth.md`.

### AI4 / WorkOS — staging dashboard RESOLVED August 4

Driven in-browser this session. Staging environment of project "Cool's
Project". **Checklist steps 1, 2, 3, 5, 6, 7, 8 are DONE** — CIMD and DCR both
Enabled, resource indicator added and marked Default, sign-in URI set.

- `WORKOS_CLIENT_ID=client_01KZ7E8C99MTQQQ4RC6GEH4DQ2`
- `MCP_AUTHORIZATION_SERVER=https://scientific-mist-64-staging.authkit.app`
- `MCP_RESOURCE_URL=https://workout-db-staging.onrender.com/mcp`
- sign-in URI `https://workout-db-staging.onrender.com/ai/connector/login`
- `WORKOS_API_KEY` — `sk_test_...1eFc`, NOT retrieved by any agent; Seth
  reveals and pastes it himself.

**Only step 9 remains** — the four vars on the `workout-db-staging` Render
service. Step 10 (production) is untouched and deliberate; nothing copies
across environments.

**Two corrections the block itself does NOT yet carry.** (1) Step 4, "create an
OAuth application", is UNNECESSARY — with DCR/CIMD enabled, MCP clients register
themselves; the Applications list is for clients you manage, which Claude is
not. The create dialog forces a consent-model and a PKCE choice, so it was
backed out of rather than guessed at. (2) The dashboard calls the Login URI
**"External Sign-in URI"** — Connect -> Configuration. Full hand-off detail for
whoever finishes this: `workosinstructions.md` (scratchpad, August 4).

**Six recon findings that changed the design** (three parallel report lanes,
August 4 — AIR1 server now-state, AIR2 client/consent now-state, AIR3 MCP +
WorkOS research; all three returned clean, no-edits contract held). Full detail
in the QUEUE entry; the two that would most easily be re-broken later:

- **The MCP spec moved to `2026-07-28` and we are deliberately NOT targeting
  it.** That revision changes the transport incompatibly, and Anthropic's
  connector docs still list support only through `2025-11-25`. Building to the
  newest spec yields a server today's Claude cannot talk to. Revisit when
  Anthropic's docs move — this is a dated decision, not an oversight.
- **`ai-layer.md` said `/api/analytics/summary`; there is no `/api` prefix.**
  Routers mount at the host root (`app.js:126`). Corrected in the spec.

`ai-layer.md` now carries a **section 4.0 "CORRECTIONS"** block holding all of
these; where it and the older prose below it disagree, 4.0 wins.

**Two units are cross-user isolation surfaces** — AI2's Bearer guard and AI4's
token verification — and are standing frontier-seat escalations under CLAUDE.md
regardless of who writes them. The `sub`-to-user mapping in AI4 is the single
highest-severity line in the wave: get it wrong and one user's training data
reaches another user's assistant.

**Lane coverage is much worse this wave than in E or F, and the blocks say so
individually.** `npm run test:unit` matches only `test/analytics/**` and
`test/lib/**` and never loads a route, controller, or middleware; the
integration lane needs `server/.env`, which no lane worktree has. Every block
therefore mandates its pure logic into `server/test/lib/` and declares its lane
gap in writing. **Do not read a green lane as coverage of an endpoint this
wave.** AI2's verifier seam exists partly so `/mcp` can be driven with `curl`
using an ordinary LogChamp token before the vendor exists — that curl evidence
is worth more at review than any assertion in the criteria lists.

**Lane B (the in-app coach) is still unauthored and still second** — BYO-key
and hosted over one code path. The hard boundary holds on both lanes: the
deterministic engine computes every number, the model only narrates.

## The F-wave rulings — ARCHIVED August 4

Seth's August 1 either-or / mandatory / remembered-pref rulings, the legacy
both-false resolution, and the verified pref-gap findings moved VERBATIM to the
TOP of `docs/HANDOFF-ARCHIVE.md` when this file exceeded its cap after the
merge. Nothing in them is outstanding — all four units shipped. Go there if
future effort work needs the WHY rather than the diff.

### Lane worktree state

All three lanes are FREE as of August 4 (forty-first session). They were
repointed for the AI-wave recon and now sit on `recon/air1`, `recon/air2`, and
`recon/air3`, all off `origin/ai-connector-wave` `53235c7`, trees clean. Their
AIR1-AIR3 DELIVERY.md reports are session-scoped and were NOT preserved as
findings docs — the six findings that mattered are written into the blocks, the
QUEUE entry, and `ai-layer.md` section 4.0 instead, so the reports are
disposable.
Repoint any lane to a branch off the target wave before dispatching, or
the delivery lands on the wrong base. Check lane cleanliness by
DELIVERY.md TIMESTAMP, not `git status` (it is gitignored, so a stale
report reads as "clean") — and delete the stale report before the run so
the incoming one cannot be mistaken for landed work.

## The AI layer — specs, and what is already settled

Forward plan and the AI0 ruling live in "NEXT AFTER THE MERGE" above; this
section holds only the standing spec pointers and the things already decided,
so they are not re-litigated.

- **`docs/specs/ai-layer.md`** is the AI design of record. Two surfaces,
  **connector first**: Lane A a remote MCP server the user adds inside the AI
  app they already pay for; Lane B the in-app coach proxy where BYO-key and
  hosted are ONE code path with a different key source. Phasing AI0-AI6.
  Section 4.2 carries the Aug 2 AI0 ruling plus both Aug 2 corrections (DCR is
  no longer a hard MCP requirement - CIMD is SHOULD, DCR is MAY; and the
  in-house fallback is multi-day/multi-week, not "a few hundred lines").
- **`docs/specs/ai-theming.md`** — AI-generated palettes. The model emits a
  ~20-hex token object, **never CSS**. Spec only, by Seth's decision.
- `analytics-engine.md` section 8 is AMENDED, not contradicted; Track C now
  means `ai-layer.md`. Do not phase AI work from the old section.
- Recon findings: `docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`.

**Two premises settled, so nobody re-litigates them:** `.mil`/DoD credentials
are permanently out (5 CFR 2635.704 — government property, authorized purposes
only), and consumer-subscription OAuth in third-party apps is a ToS violation,
not merely unavailable. Detail in `ai-layer.md` section 3 and the archive.

**Correction on record** (`ai-theming.md` section 4): `check-hex.mjs` CANNOT
gate AI-generated palettes — it scans a git diff (`check-hex.mjs:23`), so
runtime-generated output never reaches it. It stays the right tripwire for
authored code. A separate pure validator is specified.

## Repo / deploy state

- **`main` is at `59e27dc`** — the F-wave merge, August 4, a clean fast-forward
  from `8541bca` (14 commits). Prod Vercel/Render track `main`, so this push is
  deploying to production now — **prod smoke is open and unverified**, and this
  one matters more than the last: F0 is the first `server/` change to reach prod
  since the frontier-parity merge. Because prod tracks main, any push to main is
  a prod-bound push (gate item 2).
- **Staging Render tracks `main`** (Seth repointed it July 28), so it now picks
  up F0's server change automatically — no repoint needed, and RUNBOOK step 7 is
  a no-op for this wave.
- **`effort-mandatory-wave` is MERGED and closed** — same shape as `effort-wave`
  below: all its CODE is on `main`, and it now sits one DOCS-ONLY commit ahead
  (this post-merge upkeep). NOT a safe deletion candidate until that commit is
  on `main`. Do not delete it to tidy up.
- **`effort-wave` is MERGED and closed** — all its CODE is on `main`. It now
  sits one or two DOCS-ONLY commits ahead (this post-merge HANDOFF upkeep,
  which is written after the merge and so cannot be part of it). **Therefore
  it is NOT yet a safe deletion candidate** — deleting it would drop those
  commits, since `main`'s copy of this file still reads "awaiting the merge
  trigger". Prior waves resolved this by landing the post-merge HANDOFF commit
  on `main` (`f2be093`, `869c5f1` are exactly that). Doing so is a docs-only
  prod-bound push and needs Seth's say-so; until then, leave the branch alone.
- **Staging Render needed no repoint** (RUNBOOK step 7): it already tracks
  `main`, and the E-wave shipped zero server changes either way.
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
- **Acceptance criteria cannot express "discoverable."** E3 met every
  criterion in its block and still failed its purpose — Seth looked at the
  page and saw nothing, because a 7th `(?)` on a page with six others is
  invisible. Criteria assert an element EXISTS; only smoke asserts a human
  NOTICES it. The fix is not vaguer criteria; it is remembering that
  discoverability is a smoke question. (E4 `965b2c8` is the repair.)
- **Adding a child to a CSS grid silently reflows it.** E4's line had to be a
  SIBLING of `.coverage-row` (a `1fr 120px` grid, `index.css:6535`) — as a
  child it becomes a third grid item squeezed into the narrow first column,
  with a green build and a wrong layout.
- **A component keying off prop ABSENCE is a seam risk** — the E2 nudge
  (`!useRIR && !useRPE`) renders spuriously if any call site omits a
  prop. Build passes either way. Check every call site, not just the
  ones the block named.
- **A component that renders its OWN copy for a state will collide with
  any copy you add for that state.** F2 shipped the same sentence twice
  on one screen because the block named the new prompt but not
  `RirRpeToggleRow`'s built-in null-state nudge. Fixed with a `showNudge`
  prop (default true). Before adding copy for a state, grep what already
  renders in it — a green build and a truthful "no deviations" report are
  both fully compatible with a duplicated paragraph.
- **Effort presence must be a BLANK test, never a truthiness test.**
  `rir = 0` means taken to failure — the most important value in the
  vocabulary — and `!set.rir` treats it as missing. F3 uses
  `String(v).trim() !== ""` throughout. A truthiness check would have
  blocked Finish on exactly the sets that matter most, invisibly to both
  lanes.
- **`startSession` creates ZERO `WorkoutSet` rows** (`sessionController.js:148`)
  — only the session and its `sessionExercise` rows. Worth knowing before
  designing anything that enforces per-set rules: a fresh template session
  has no sets to enforce against, so there are no pre-filled scaffold rows
  to accidentally block on.
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
