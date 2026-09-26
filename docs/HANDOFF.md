# HANDOFF — current state

> **WHERE WE ARE (Sept 26):** the AI wave is **COMPLETE and at its hard stop -
> Seth smokes next.** Lane A (the connector, AI1-AI9) landed in August; Lane B
> (the in-app coach + palette studio) landed September 9 and was audited
> September 12; the three follow-up units are ALL LANDED - AI10 `ce51242`
> (budgets + truncation), ID1 `ebf7b80` (the wrong-identity bind, frontier
> audit) and CP1 `8ab7dcf` (the hosted coach on a Cursor key, proven live
> in-seat). `ai-connector-wave` is pushed and staging Render deploys it.
> Nothing is in flight; all three lanes are clean.

**Next action (human):** put your NEW Cursor key on staging Render
(`workout-db-staging` -> Environment: `COACH_PROVIDER=cursor` and
`COACH_API_KEY=<the new key>`, leave `COACH_MODEL` unset), check that deploy's
log shows Node >= 22.13, then run the consolidated smoke below.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** September 26, 2026, fiftieth session (Opus, frontier - **the wave
closed out**). Found the Sept 25 session had stopped mid-relay: ID1 had
delivered clean, but CP1's run had DIED - connection lost, then an
`ActionRequiredError` auth error, after hanging ~13 hours with no timeout
around it and leaving no `DELIVERY.md`. `cursor-agent status` showed the relay
key still logged in. Backed CP1's lane up and re-dispatched it as a SALVAGE
into the same lane under a 45-minute hard kill (the AI7 precedent), and
audited ID1 in parallel. **ID1 LANDED `ebf7b80`** (frontier audit, no fix).
CP1's salvage run found the live smoke FAILING - SDK 1.0.32 reports the
account-gated `systemPrompt` error from `wait()`, not as a `send()` throw -
fixed the retry, and stopped as its block orders. The reviewer re-ran the live
smoke (PASS: stream via the inline fallback, palette validated), verified the
salvage byte-for-byte against the backup, and applied one fix: BYO keys must
never inherit a cursor `COACH_MODEL`. **CP1 LANDED `8ab7dcf`.** Combined tree:
unit 324/324 in 30 suites. **Wave 3/3.** Seven stale sections moved VERBATIM
to the archive; this file is still over its ~300-line cap - the ROAD TO MAIN
section and most of the AI-wave section go wholesale in the post-merge
rewrite. Prior: September 25 (Opus - Seth's
road-to-main answers; AI10 landed `ce51242`; CP1 + ID1 authored and dispatched
in parallel; the session ended before either returned, without a HANDOFF
session line). Older sessions archived.

**THE WAVE IS AT ITS HARD STOP.** Per `land-unit` section 6: Seth smokes FIRST,
then a frontier seat runs `pre-main-review`. Do not start the gate, do not run
`/code-review`, do not read the branch diff for review purposes until he signs
off. The in-seat probes (the Aug 14 connector handshake, the Sept 26
`smoke-cursor-coach.mjs` run) are evidence that narrows what he checks - they
are NOT that sign-off.

---

## ROAD TO MAIN - the ordered work order (TRANSIENT: delete this section once the merge lands)

Compiled September 17, 2026 (Opus) from a ground-truth readiness pass over the
branch, NOT from prose. **This section is scratch, not permanent state** - the
agent that finishes the merge deletes it wholesale in the post-merge HANDOFF
rewrite. Keep it ordered; items 1-2 can veto everything below them.

**Already verified, do NOT re-derive:** the branch is 55 commits ahead of
`main` (recounted Sept 26) with **zero** commits on `main` that it lacks
(clean ff merge, no conflict risk); the wave's one migration
`20260804180000_add_ai_consent` is **additive** (new table +
`User.aiConnectorEnabled BOOLEAN NOT NULL DEFAULT true`), applied on staging,
NOT on prod; all four new runtime deps are declared
(`@modelcontextprotocol/sdk`, `express-rate-limit`, `jose`, and CP1's
`@cursor/sdk`, which loads LAZILY - requiring `src/app.js` leaves it out of
`require.cache`, so boot never depends on it); missing coach config **degrades
honestly** rather than crashing (`keyResolver` -> `no_key`, `askCoach` ->
`coach_unavailable`, `/coach/status` -> `available:false`); and the unit lane
is **324/324 in 30 suites** on the combined AI10 + ID1 + CP1 tree (Sept 26).

| # | Do | Owner | Blocks because |
|---|---|---|---|
| 1 | ~~VETO CHECK: prod Render Node >= 22.12~~ **CLEARED Sept 25 (Seth checked the dashboard)** | Seth | was: `app.js:10` requires ESM `zod`/`jose` at boot. #14 is still the permanent fix |
| 2 | **VETO FIRED Sept 25, path chosen:** prod build is `npm install && npx prisma generate` - it does NOT migrate. Keep it (prod migrations stay Seth's). **Seth hand-applies the migration via the ready-to-paste SQL in RUNBOOK 10a (V2 RESULT), then runs RUNBOOK section 4, BEFORE the merge** | Seth | without it the new code selects `User.aiConnectorEnabled` against a missing column and login breaks. Safe to run any time - `main` never reads the new table and the column has a DEFAULT |
| 3 | ~~DECISION: hosted key or dark~~ **DONE: CP1 LANDED `8ab7dcf` Sept 26** - the hosted coach runs on a CURSOR API key (Seth, Sept 25: "im not using an anthropic one") via `@cursor/sdk`; its live smoke PASSED in-seat (stream + palette). BYO keys stay Anthropic | done | #13 must describe the coach. CP2 follow-ups (gate memo, log noise) are listed in the AI-wave section - not blockers |
| 4 | ~~AI10~~ **LANDED `ce51242` Sept 25** (8000/3000 caps, truncation handled, smoke scripts) | done | still applies to BYO Anthropic keys. Its smoke scripts are unrun live |
| 5 | ~~DECISION: ship or fix the wrong-identity bind~~ **FIX LANDED: ID1 `ebf7b80` Sept 26, frontier audit** (confirm step on `/connector/login`, "Sign out of connected assistants" revoking WorkOS sessions + apps, `boundAccount` on tool output). Residual Seth step: shorten the AuthKit session lifetime in the WorkOS dashboard (Applications -> Sessions), staging now and the prod env at #11 | Seth | a stale AuthKit session belonging to an account the user cannot sign in as is only covered by session expiry. ID1's `external_id` lookup is unproven until the Part B live check |
| 6 | **UNBLOCKED Sept 26 (CP1 landed; Seth has minted the separate key).** Put it on STAGING Render: `COACH_PROVIDER=cursor` + `COACH_API_KEY=<the new key>`, `COACH_MODEL` left UNSET (defaults to `auto`). Never reuse the relay's `CURSOR_API_KEY`, so revoking one never kills the other. CP1 added `engines` `>=22.13 <23`, so Render should pick Node 22.x itself - confirm the version in the deploy log (a `NODE_VERSION` env var on the service overrides `engines`) | Seth | only the in-seat smoke script has reached the real model; no deployed coach path has. Without it #7 cannot test the coach |
| 7 | **THE SMOKE: Part A surfaces + Part B connector from Seth's REAL account** (checklist below in this file) | Seth | the hard stop. The gate does not start until he signs off; a gate run before smoke gets partly re-run after it. A smoke defect re-enters as a diagnosis block and RESETS the sign-off |
| 8 | **DECISION (optional):** work CR2 to its 8+ bar, or ship at 7.5 | Seth | `docs/tasks/cr2-critic-round-2-FINDINGS.md` is the work order; a UI block must be authored FROM it, not from memory. Product polish only - does not block a merge |
| 9 | Pre-main gate review - the `pre-main-review` skill, frontier seat (Opus), gate fuel fanned out to **Cursor report lanes, never Claude subagents** | agent | nothing merges without a PASS. Grep `HANDOFF-ARCHIVE.md` for this wave's session history as review fuel. A BLOCKED verdict sends fixes back through the relay |
| 10 | `npm install` in main-tree `server/` (gate item 5 - ask first) | agent | `express-rate-limit` was never installed in the main tree (every unit was built in lane worktrees), so two suites fail to LOAD there - zero assertion failures, but it blocks the gate's fresh green run. CP1's `@cursor/sdk` is missing there too - the same install covers both |
| 11 | Create a **PROD** AuthKit environment; set its External Sign-in URI to `<prod client origin>/connector/login` (RUNBOOK 10c) | Seth | an AuthKit environment has exactly ONE External Sign-in URI, so **prod and staging cannot share one** - pointing it at prod breaks the staging connector and vice versa. Today it points at this branch's Vercel PREVIEW host |
| 12 | Set prod env vars on `workout-db-l3gc`: `MCP_RESOURCE_URL`, `MCP_AUTHORIZATION_SERVER`, `WORKOS_API_KEY` (+ `COACH_*` per #3) - RUNBOOK 10b | Seth | `MCP_RESOURCE_URL` unset **silently defaults to `http://localhost:3000/mcp`** (`routes/index.js:18`, `middleware/connectorAuth.js:21`) - discovery advertises localhost and every real token fails the audience check with no error anywhere. `MCP_AUTHORIZATION_SERVER` is read at MODULE LOAD (`ai/tokenVerifier.js:1-2`), so it needs a RESTART to take effect |
| 13 | **DECISION:** write a What's New entry for the September 9 wave, or hold the announcement | Seth | entry `2026-08-ai-assistant` (dated Aug 5) is prod-gated via `lib/appEnv.js` and **fires for every prod user on this deploy**. It describes the CONNECTOR ONLY - it predates the coach, the palette studio and the entire Sept 9 redesign - and advertises a feature that does nothing until #11 and #12 are complete |
| 14 | Gate-item-5 call: declare `zod` in `package.json` (the Node pin half is DONE - CP1's `engines` `>=22.13 <23`) | Seth | the permanent fix for #1. Touches `package.json`, so it asks first |
| 15 | Seth says **"push to main"** verbatim -> merge, ONE command at a time with approval before each | Seth | gate item 1. Report commits, SHAs and confirmed `origin/main` HEAD after the push |
| 16 | Post-merge: repoint staging Render to `main` (**RUNBOOK step 7 is NOT a no-op this wave**), run RUNBOOK 10d verification, then the prod smoke | Seth + agent | staging Render tracks THIS BRANCH today. 10d's most informative check is simply **logging in on prod** - the migration adds a NOT NULL column to `User`, so if login works the ordering held |

**Full cutover detail is `docs/RUNBOOK.md` section 10** (vetoes, env matrix,
AuthKit ruling, verification curls, known-at-cutover defects, rollback). Do not
re-write that content here. **Rollback is cheap:** the migration is additive
with a `DEFAULT`, so reverting `main` to `59e27dc` is safe and needs no
down-migration - leave the table and column in place.

---

## The AI-wave - COMPLETE: Lane A 9/9, Lane B swept, follow-ups 3/3

Branch `ai-connector-wave` off `main` `59e27dc`; code HEAD `8ab7dcf` (CP1),
docs-only after it.
**Staging Render tracks THIS BRANCH**, so every push here deploys to
`workout-db-staging`. **RUNBOOK step 7 is NOT a no-op for this wave** - staging
must be repointed back to `main` after the merge.

**Lane A - the connector (`docs/specs/ai-layer.md` Lane A, blocks AI1-AI9):**

| Unit | SHA | What landed |
|---|---|---|
| AI1 | `83d82c8` | consent record + entitlement flag + `/profile/ai` page |
| AI2 | `5c051bc` | discovery doc, Bearer guard, scope+consent enforcement, rate limit |
| AI3 | `eecd2e9` | MCP server on `/mcp`, four read-only tools, shared analytics path |
| AI4 | `c89570e` | WorkOS JWKS verification + Login URI |
| AI5 | `9a2f63a` | the connect surface: copyable address, four steps, tier note |
| AI6 | `c1398a8` | rate-limit the connector by identity, not IP (fixes finding 1) |
| AI7 | `d925bd2` | drop `training:read` - the scope AuthKit cannot issue |
| AI8 | `bca098b` | move the Login URI to the client origin (the Aug 8 smoke fix) |
| AI9 | `43a4ceb` | per-client setup instructions: Claude, ChatGPT, Grok, generic |

ZERO bounces across all nine; four reviewer fixes. Per-unit audit reasoning is
in `docs/tasks/QUEUE.md`.

**Lane B + the critic loop - landed September 9, NO per-unit audit at the time:**

| SHA | What landed |
|---|---|
| `8455059` | the in-app coach: `POST /coach/ask` SSE proxy over plain `fetch`, `GET /coach/status`, one code path for BYO / hosted / mock keys, identity-keyed 40-per-15min limiter, `CoachPanel` on Analytics + a one-tap session debrief, 28 unit tests |
| `4f364ee` | full-bleed scenes, the barbell loading motif + shape-matched skeletons, Chakra Petch as `--font-display`, month-grouped History, nav/theme-color polish |
| `d28989b` | palette studio (`docs/specs/ai-theming.md` v1): `POST /coach/palette` returns a VALIDATED token record (hex only, never CSS), applied as a sixth `data-palette` value `custom`, per device via localStorage |
| `2080128` | critic loop round 1 (baseline scored 5/10): finished workouts as a record, History rows, the phone 16px gutter restored, light-mode scene, chart fixes |
| `932fa25` | critic loop round 2 (round 1 scored 7/10): Exercises as real analytics, the AI-access rebuild, crisp pixel light mode, heatmap headers, Profile two-column |


**The Sept 12 audit's follow-up units - all LANDED:**

| Unit | SHA | What landed |
|---|---|---|
| AI10 | `ce51242` | coach/palette caps 8000/3000 (thinking STAYS ON - never lower them), `max_tokens` handled on both paths, the thinking pause given a face, `scripts/smoke-coach.mjs` + `smoke-connector.mjs` (still unrun live) |
| ID1 | `ebf7b80` | the wrong-identity bind: "Continue as <email>" / "Use a different account" on `/connector/login`, `POST /ai/connector/signout` (revokes the user's WorkOS sessions + authorized apps), the same cleanup best-effort on consent revoke, `boundAccount` on every tool result |
| CP1 | `8ab7dcf` | the HOSTED coach + palette studio on a Cursor key: `@cursor/sdk` local agent, `tools: []`, fresh tmp cwd, lazy-loaded; BYO keys stay Anthropic; `scripts/smoke-cursor-coach.mjs` passed live Sept 26 |

**Follow-ups surfaced at landing - candidates for a CP2, NOT merge blockers:**

- **This Cursor account is gated for `systemPrompt`,** so EVERY hosted request
  makes one failing attempt before the inline fallback runs - wasted latency on
  every question. Memoize the gate per process.
- **The SDK prints six "Ripgrep path not configured" stack traces per request**
  (it tries to read `.gitignore` / `.cursorignore` in the empty tmp cwd). Harmless,
  but it will flood Render logs. `configureRipgrepPath()` or a quieter option.
- **The persona now rides INSIDE the user message** (the inline fallback), not a
  true system prompt - weaker separation from user text. The agent has no
  tools, so the blast radius is the answer text only.
- ID1: `revokeConsent` now makes a LIVE WorkOS call wherever `WORKOS_API_KEY`
  is set - including the integration lane if `server/.env` carries it.

### Carry-forward that still governs (full evidence in the archive)

- **The connector's server side PASSED end to end live (Aug 14)** with a real
  WorkOS token; AI8 is confirmed live; the consent kill-switch passes on both
  `tools/call` and `tools/list`, with no cache lag.
- **`external_auth_id` TTL is 300 seconds** - a slow password screen can
  genuinely expire a handshake. ID1's confirm step now says so on the page.
- **The wrong-identity bind is closed as far as code can close it (ID1).**
  Residual: a stale AuthKit session for an account the user cannot sign in as
  is covered only by session expiry (WorkOS dashboard, Seth - road #5).
  **Unproven until smoke:** that WorkOS files our `User.id` as the WorkOS
  user's `external_id` - Part B's ID1 live check settles it.
- **Trap before prod:** the staging Login URI host is a Vercel PREVIEW deploy
  behind Deployment Protection - any cold context gets 302'd to
  `vercel.com/sso-api`. Staging-only; prod's domain is public.
- **OPEN: `zod` is an undeclared phantom dependency** - ESM-only, required at
  boot by `mcpServer.js`. CP1's `engines` field now pins Node 22.x; declaring
  `zod` is what remains of road #14.
- **MCP revision `2026-07-28` is deliberately NOT targeted** - it changes the
  transport incompatibly; `ai-layer.md` section 4.0 "CORRECTIONS" is
  authoritative. A dual-era server is a future unit.
- **Cross-user isolation surfaces** (AI2's Bearer guard, AI4's token
  verification, ID1's signout) are standing frontier-seat escalations
  regardless of who writes them.
- **DO NOT READ A GREEN UNIT LANE AS COVERAGE OF AN ENDPOINT.** It matches only
  `test/analytics/**` and `test/lib/**` and never loads a route, controller or
  middleware; the integration lane needs `server/.env`, which no lane has.

### CR2 - the critic loop's round-2 report, UNWORKED

`docs/tasks/cr2-critic-round-2-FINDINGS.md` (7.5/10, preserved verbatim on
Sept 12 from gitignored `.playwright-mcp/critic/round-2.md`). **Not a
dispatchable block** - its ten ranked fixes and twelve bugs are the outstanding
work order, and **a UI block should be authored FROM it rather than from
memory.** The reusable loop recipe is `docs/design/critic-brief.md` (also
rescued from gitignore). **Rounds 0 and 1 were rescued Sept 17** as
`cr0-critic-round-0-FINDINGS.md` (the 5/10 baseline) and
`cr1-critic-round-1-FINDINGS.md` (7/10) - both WORKED and superseded, kept for
the baseline itself and for CR1's "Round-0 fixes status", the only item-by-item
audit of what `2080128` delivered. **CR2 is the one live work order of the
three;** do not author against CR0 or CR1, their lists were re-ranked twice. What holds the product under 8 is no longer any single
broken screen but unfinished micro-detail: labels repeated per row instead of
set once as a column header, a "Tracked" badge that distinguishes nothing,
em-dash placeholders standing in for real empty states, four hero sparklines
that all draw the same straight line, and the iron/crimson scenes being nowhere
near champ's standard. One listed bug is already RULED OUT: the identical
`1h 2m` durations are uniform seed data - `client/src/lib/sessionFacts.js`
computes per session from `startedAt`/`completedAt`.

### CONSOLIDATED WAVE SMOKE - Seth, on the staging Vercel deploy

**REWRITTEN September 26** for ID1 + CP1 (the Sept 12 version is verbatim in
the archive). Confirm `origin/ai-connector-wave` is at `8ab7dcf` or a
docs-only commit after it, and that BOTH the Vercel and Render staging deploys
have built it. **Do road-to-main #6 first** (the Cursor key on staging
Render), then **probe `GET /coach/status` on staging while signed in** - it
should read `available: true`, `source: "hosted"`, `provider: "cursor"`,
`model: "auto"`. Anything else means the coach checks below are testing the
wrong path.

**Part A - the surfaces:**

- **Profile -> AI access**: switch row + state line, three facts, the coach
  status, and the mono address `https://workout-db-staging.onrender.com/mcp`
  with copy (wrong address = `VITE_API_URL` on Vercel is wrong). AI9's
  accordions: Claude open, ChatGPT / Grok / generic collapsed. Check on phone.
- **NEW (ID1): a "Connected assistants" section with "Sign out of connected
  assistants"** - present with AI access ON and with it OFF.
- **The coach panel on Analytics** - ask something and watch the answer stream
  AND END. It now runs on the Cursor key: expect a slower first word than
  before (one gated attempt + local-agent start-up). Note roughly how long.
- **The session debrief** - one tap on a finished workout.
- **Palette studio** on Profile -> Appearance: describe a look, live preview,
  keep / try another / discard. "The model did not return a palette" is now a
  Cursor-path finding - write down the description you used.
- **BYO key** (only if you have an Anthropic key): paste it on Profile -> AI
  access and ask the coach - it must still answer (the Anthropic path).
- **The Sept 9 UI pass**, read as a user: full-bleed scenes, crisp light mode,
  the barbell motif and skeletons, month-grouped History, the Home hero,
  Exercises as analytics. **Check iron and crimson** - the critic scored both
  well below champ.
- **Regression:** log out and back in, load Analytics, start and finish a
  workout. What's New does NOT appear on staging - prod-gated by design.

**Part B - the real connector. THIS IS THE PASS THAT MATTERS.**

- **From your REAL account**, add the connector inside Claude (Customize ->
  Connectors -> Add custom connector). The AuthKit browser session may still
  be on the `smoke-b8@example.com` throwaway - clear AuthKit cookies or use a
  fresh browser profile (that stuck session is exactly the residual ID1 cannot
  close from code).
- **NEW (ID1): `/connector/login` must STOP and ask "Continue as <your
  email>" or "Use a different account"** - it never completes on its own any
  more. Run it once signed out and once already signed in.
- **"Use a different account"** must log you out and, after you sign in, bring
  you back to the same connect page.
- **If the handshake fails, capture the callback URL and its `error=` value
  BEFORE anything else** - Aug 6's real error was only visible there.
- Ask Claude "how has my bench press moved this month?" - the numbers match
  Analytics, and **the tool result now names your email (`boundAccount`)**.
- **THE ID1 LIVE CHECK:** after a successful connect, press "Sign out of
  connected assistants". It must say **"Signed out of connected assistants."**
  **"Nothing to sign out" means WorkOS does NOT file our user id as
  `external_id` - Door A is still open; report it.** Then ask Claude again -
  it should have to re-authorize.
- **Consent-blocked path:** with AI access OFF, the connector flow lands on
  `/profile/ai`, and a question in Claude must fail.
- **A second LogChamp account** (register in a SEPARATE browser profile) closes
  AI6's two-identity rate-limit check AND is the real wrong-account test:
  connected as A, start a connect while signed in as B - the confirm step must
  name B.

## Prior waves - CLOSED, detail archived

- **F-wave** (effort MANDATORY) - merged `8541bca..59e27dc`. Gate finding,
  seed-invariant and authoring lesson are in the archive; read before touching
  effort seeding.
- **E-wave** - merged `7d1c9ba..d272930`. Live note: the "two sets of 10"
  sentence ships in FOUR hand-varied forms (E2's nudge, E3's
  `HOW_EFFORT_MATTERS`, E4's `EFFORT_RATIONALE_SHORT`, F2's
  `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`); consolidating them into one shared
  module is a known follow-up that should absorb F2's page-to-page import.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed.

### PROD smoke - Seth, on production, one combined pass (still open)

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed Aug 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on -> the RIR field appears untouched.
- Log a set with effort -> the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** - the highest-value case in the vocabulary.
- Open an OLD completed session -> nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Repo / deploy state

- **THE PROD CUTOVER IS WRITTEN DOWN NOW - `docs/RUNBOOK.md` section 10**,
  added Sept 17. Merging this wave does NOT give prod a working AI layer: it
  needs three env vars (`MCP_RESOURCE_URL` unset silently defaults to
  `localhost`, which rejects every real connector token), a PROD AuthKit
  environment whose External Sign-in URI is the prod client origin, and a
  ruling on whether prod shares staging's AuthKit - **it cannot; one
  environment has ONE sign-in URI, so sharing means prod and staging take
  turns being broken.** Section 10 carries the vetoes, the env matrix, the
  post-deploy verification curls, and the rollback note (the migration is
  additive, so reverting to `59e27dc` needs no down-migration).
- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. One command
  settles it: a GET of `/ai/consent` on a host returns **401** if that host
  serves the wave branch and **404** if it serves `main`.
- **A staging Render DEPLOY is also a staging MIGRATION.** The server's
  `render-build` script is `prisma generate && prisma migrate deploy` - that is
  how the `AiConsent` migration got applied on August 4 without anyone running
  it. Check prod Render's build command before assuming prod differs.
- **`ai-connector-wave` code HEAD is `8ab7dcf`** (CP1; docs-only commits after
  it), local == origin. **Staging Render
  `workout-db-staging` tracks it**, so pushes auto-deploy. **RUNBOOK step 7 is
  NOT a no-op:** repoint staging back to `main` after the merge.
- **`main` is at `59e27dc`** - the F-wave merge, August 4. **Prod Render
  `workout-db-l3gc` and prod Vercel are on `main`.** Any push to `main` is a
  prod-bound push (gate 2). **Prod smoke still open.**
- **`effort-mandatory-wave` and `effort-wave` are MERGED and closed** - all their
  CODE is on `main`, but each sits one or two DOCS-ONLY commits ahead (post-merge
  HANDOFF upkeep). **Therefore NOT safe deletion candidates.** Prior waves
  resolved this by landing the post-merge HANDOFF commit on `main` (`f2be093`,
  `869c5f1`) - a docs-only prod-bound push needing Seth's say-so.
- FP8 (PWA icons) is the only open FP unit - DRAFT, blocked on Seth dropping icon
  PNGs into `claudefiledrop/`. Icons LAST by his rider.
- **Main-tree `node_modules` is stale** - `express-rate-limit` (declared by AI2)
  and `@cursor/sdk` (CP1) were never installed there, because every unit of
  this wave was built in lane worktrees. Two suites fail to LOAD in the main tree as a result; zero assertion
  failures. An `npm install` in `server/` clears it - deliberately not run
  unasked (gate item 5).

### Lane worktree state

**All three lanes are CLEAN and FREE (Sept 26)** - lane 1 on `cursor/ai10` at
`ce51242`, lane 2 on `cursor/cp1` at `8ab7dcf`, lane 3 on `cursor/id1` at
`ebf7b80`, each holding a STALE gitignored `DELIVERY.md`. **Repoint any lane
off the target wave branch before use or the delivery lands on the wrong
base.** Installs differ: lane 3's `server` and `client` `node_modules` are
JUNCTIONS into lane 1 (which lacks `@cursor/sdk`); lane 2's `server` has its
own install WITH the SDK.

**Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status`** - it is
gitignored, so a stale report reads as "clean". The written warning was not
enough on its own on August 8; what caught it was mtime. Prefer a DISTINCT
report filename per lane run (`RECON-R1.md` / `RECON-R2.md`) so a stale file
cannot impersonate a fresh one at all.

**Lane `node_modules` drift is real.** When a lane's failures are
`Cannot find module`, suspect the environment before the code, and verify in a
lane known to be current.

## Other open items

**Seth items:** the road-to-main items marked Seth (top of this file); the R6 tagline pick
(one-line `AuthLayout.jsx` swap); FP8 icon PNGs; the Cursor model-routing
question; the `docs/parked/*` ruling.

### Workflow modernisation backlog - OPEN, agreed August 5, none started

Do them one at a time between waves, never mid-wave:

1. **Rules -> tooling.** Fold `land-unit` section 2's three "things a green build
   cannot catch" into a runnable `scripts/audit-seams.mjs` (unresolved
   `var(--...)` names; identifiers removed but still referenced; server response
   shape vs client destructure). `check-hex.mjs` is the precedent.
2. **Structured `DELIVERY.md`.** Fixed schema per acceptance criterion
   (criterion -> command -> verbatim output) instead of free prose. Template in
   `docs/tasks/cursor-task-block-template.md`.
3. **Preferences -> auto-memory.** `land-unit` carries Seth's standing asks with
   dates; those are user preference, not ritual. The repo contract stays in
   AGENTS.md because Cursor reads it.
4. **Trim provenance out of hot paths.** CLAUDE.md's seat history and the dated
   backport notes are archive material in files loaded every session. *A
   `/doctor` pass scoped this to EXACT line-level cuts (~750 est. tokens/session
   saved); that scoping is in the archive - read it first, it also records what
   must NOT be cut.*

5. **TODO: a workflow that works from ANY device, seamlessly.** Added
   September 17, 2026. Today the relay only runs from Seth's laptop. A Sept 17
   audit confirmed the repo itself is cloud-complete (439 files: all entry
   points, both lockfiles, all four `.claude/skills/`, `.claude/settings.json`,
   every spec/block/QUEUE/HANDOFF, and both `.env.example` files), so a cloud
   session can already clone, `npm ci`, run `test:unit` and build. **Four
   things are what actually pin the workflow to one machine:**
   (a) **agent auto-memory does not travel** - it lives under
   `C:\Users\Sethy\.claude\projects\...` and nothing memory-shaped is tracked,
   so a cloud agent starts without the standing preferences and rulings;
   (b) **no secrets** - `server/.env` / `client/.env` are correctly untracked,
   so no server boot, no integration lane, no DB inspection;
   (c) **the dispatch relay is path-bound** - `dispatch-unit` Channel B drives
   headless Cursor in `C:\dev\worktrees\cursor-lane`, which exists only here;
   (d) **`.claude/settings.local.json` is per-machine**, so every new device
   re-prompts for permissions this one already allows.
   Shape worth considering: export the durable half of memory into `docs/` as
   a committed file (the machine-specific half stays local), a documented
   secret-provisioning step for a fresh environment, and a dispatch channel
   that is not tied to a hardcoded Windows path. Do it BETWEEN waves like the
   other four.

Also agreed in principle, not decided: relaxing gate item 5 so `devDependencies`
installs are hands-off while new RUNTIME deps still ask. Seth's call.

**PARKED by Seth - the block builder.** "don't do anything with the block builder
for now, that's for another wave." Evidence in
`docs/specs/block-execution-gap.md` (`267271c`). **Do NOT author against it, and
do NOT ask him about it again** - he already ruled. It also records that
Execution reads planned values LIVE from `TemplateSet` rather than snapshotting,
so editing a template retroactively changes what past sessions are judged
against.

**Spec'd, unauthored:** R9/per-side in `docs/specs/strength-score-per-side.md`
(SS1-SS3); gym context in `docs/specs/gym-context.md` (G1 is migration-carrying =
Seth's manual track). Evidence base for FP units stays
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`).

**The AI layer - settled, not to be re-litigated.** `docs/specs/ai-layer.md` is
the design of record (Lane A the connector, Lane B the in-app coach - BYO-key
and hosted over ONE code path, now SHIPPED). `docs/specs/ai-theming.md` -
AI-generated palettes emit a ~20-hex token object, **never CSS** - shipped as of
`d28989b`. `analytics-engine.md` section 8 is AMENDED, not contradicted. Two
premises permanently closed: `.mil`/DoD credentials are out (5 CFR 2635.704) and
consumer-subscription OAuth in third-party apps is a ToS violation, not merely
unavailable. **Correction on record** (`ai-theming.md` section 4):
`check-hex.mjs` CANNOT gate AI-generated palettes - it scans a git diff
(`check-hex.mjs:23`), so runtime output never reaches it; the server-side
validator is the gate, and it rejects rather than repairs.

**Loose ends:** CW3 visual sign-off on the next live watcher run. Finding **F**
stays open ("Failed to fetch" = Render cold-start ranked cause; needs a live
Network-tab repro). A-wave optional Step-7 backfill:
`node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply` against
prod - idempotent, safe to defer. T3C sprite loader unblocks when Seth drops the
Gemini frames in `claudefiledrop/`. T4 motion (last unstarted U5 unit) needs a
frontier-seat design pass.

**Analytics/catalog track.** Track B v1 (B1-B9) MERGED (`e9ce82c`), Track A
MERGED (`13a1e59`), prod migrated + seeded. Residual: (1) validator surfaced 29
secondary-less compounds in the 675-exercise lifting subset - curation-skim
candidate (A3); (2) integration test step-6 output (malformed-key seed behavior)
still UNVIEWED.

**Issues to open:** connect-pg-simple `session` table drift (proposed `@@ignore`);
integration-suite isolation on shared staging (Neon copy-on-write branches would
kill the FK-pollution flake); user-defined exercise support; favicon/PWA icon
swap; migration automation vs manual discipline; schema sentinel
(`docs/specs/schema-sentinel.md`); **repo lives inside OneDrive** (already caused
a `git stash` hang - decision for Seth: move to `C:\dev\workout-db` or exclude
from sync; everything is pushed, so the move is low-risk).

**Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
`SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
deprecation. Also parked: `round-7-unify-set-row` (`f6c2a6f`), decision pending.

## Durable gotchas

- **A mock provider is not a proof of the vendor path.** Lane B shipped five
  commits, 28 unit tests and a full UI against `COACH_PROVIDER=mock`; the three
  defects AI10 fixes are all things ONLY a real call surfaces. Same class as
  AI2's swappable verifier hiding `invalid_scope` for three units: **a
  verification seam that stands in for a vendor cannot test the vendor's
  constraints.**
- **Recon about a vendor SDK's ERROR SHAPE is a guess until one live call.**
  CP1's recon said the gated `systemPrompt` error throws from `send()`; the
  installed SDK reports it from `wait()`. The fake SDK encoded the recon's
  belief, so the unit lane was green on a path that failed on first contact.
  Keep a live smoke criterion in every vendor-adapter block.
- **A background agent run needs its OWN hard kill.** Sept 25's CP1 run lost
  its connection and sat in the CLI's reconnect loop ~13 hours before dying.
  `run_in_background` is not a timeout: wrap the CLI in `Start-Process` +
  `WaitForExit(<ms>)` + `taskkill /T /F` (the Sept 26 salvage did - scratchpad
  `run.ps1` shape).
- **Work that skips `land-unit` leaves no audit trail anywhere.** The Sept 9
  commits were good work, but with no QUEUE entry and no HANDOFF record the
  next session opened blind and had to reconstruct them from the diff. If a
  session ships outside the relay, write the QUEUE entry anyway.
- **Anything an agent writes into a gitignored path is one `git clean` from
  gone.** All four critic-loop documents (rounds 0-2 plus the brief) lived only
  in `.playwright-mcp/`, and the rescue took TWO passes - Sept 12 took round 2
  and the brief, Sept 17 caught rounds 0 and 1 that the first pass walked past.
  Preserve report-shaped output as a `-FINDINGS.md` doc at landing (FP0
  precedent), and when rescuing, sweep the whole directory rather than the one
  file you came for. Round screenshots stay local-only by choice.
- **A killed run can leave COMPLETE work with ZERO evidence - check the lane
  before re-running from scratch.** August 6's AI7 run wrote every line and died
  before writing `DELIVERY.md`.
- **Back the lane up BEFORE a salvage re-dispatch** (copy the diff to the
  scratchpad), and **audit a salvage delivery HARDER, not softer** - a second
  run inheriting a diff has every incentive to bless what it finds.
- **If HANDOFF looks stale, QUEUE.md is the file that is current.** `land-unit`
  writes QUEUE per unit; HANDOFF is rewritten per session - and a session that
  ends by dying writes neither.
- **Acceptance criteria can scope a grep too narrowly.** AI7's criterion swept
  `server/src` while the deleted export was imported from `server/test`. Sweep
  the whole worktree for a removed identifier.
- **Two agents, one working tree:** check `git status --untracked-files=all`
  immediately before every commit (untracked DIRECTORIES collapse to one line),
  let writes settle, one agent commits at a time. Lane worktrees sidestep this.
- **Windows env/PATH staleness:** a session may not see User env-var/PATH changes
  even after a restart - read from the registry inline and invoke new CLIs by
  full path.
- **Cursor CLI remembers the last-used `--model`** - always pass it explicitly.
  Its agent binaries run as `node.exe` under `cursor-agent\versions\`, so a
  process-name filter on "cursor" returns 0 and looks like a dead run.
- **`DELIVERY.md` is gitignored** - check lane cleanliness by TIMESTAMP.
- **A deployed service's branch is a CLAIM until you probe it.** August 4: three
  pushes went to prod believing a stale topology note.
- **An ESM-only package in a CommonJS server is a BOOT risk, not a feature risk.**
  `zod` and `jose` are both `"type": "module"`; `require()` works only on Node >=
  22.12, and nothing pins Node. Watch for PHANTOM dependencies - `zod` is
  required by `mcpServer.js` but appears nowhere in `package.json`.
- **A green lane proves nothing about a server route this wave.** At minimum
  prove the module graph loads by requiring `src/app.js` in a one-liner, and
  prefer a live request against staging over any assertion.
- **E-wave and F-wave gotchas** (discoverability vs acceptance criteria, the
  CSS-grid child reflow, prop-ABSENCE seams, duplicate state copy, the `rir = 0`
  blank-vs-truthiness trap, `startSession` creating zero `WorkoutSet` rows) are
  in `docs/HANDOFF-ARCHIVE.md`. The `rir = 0` one is still live in the code.
- Scene mock PNGs are design references - `docs/design/mocks/`, never ship from
  `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push
  lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual - smoke on device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track - pushing code does not migrate any DB,
  EXCEPT where a Render build command runs `migrate deploy` (see above).
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces it at boot (`assertSafeForBoot()`) and on the test/reset
  path (`assertSafeForReset()`, called explicitly by any new DB-connecting script
  at the top of `main()`).
- `npm run test:unit` is DB-free; `npm test` requires (and resets) the staging DB.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM - never summarized - to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
