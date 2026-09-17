# HANDOFF — current state

> **WHERE WE ARE (Sept 17):** the AI wave has TWO lanes on one branch.
> **Lane A (the connector, AI1-AI9) is 9/9 landed** and parked at its hard
> stop awaiting Seth's smoke. **Lane B (the in-app coach + palette studio)
> landed on September 9 in FIVE commits that never passed through
> `land-unit`** - no per-unit audit, no QUEUE entry, no HANDOFF record.
> A September 12 frontier audit swept them: Lane A is untouched, the lanes
> are green, and nothing is in flight. `ai-connector-wave` is at `932fa25`,
> pushed, staging deployed. One unit (AI10) is QUEUED and NOT dispatched.
> A Sept 17 integrity check CONFIRMS that Sept 12 rewrite completed rather
> than died mid-flight, and closed the one gap it left: the critic loop's
> full round 0-2 ladder is now in-repo instead of in gitignore.

**Next action (human):** **run the two pre-flight vetoes in RUNBOOK section
10a** - prod Render's Node version (must be >= 22.12) and its build command
(must run `render-build`). Read-only dashboard checks, five minutes, and
EITHER ONE STOPS THE MERGE: an old Node is a total boot failure on deploy
(`app.js:10` requires `ai/mcpServer` unconditionally -> ESM `zod`/`jose`, and
nothing in this repo pins Node), and a build command that is not `render-build`
never applies this wave's `AiConsent` migration, so the deployed code selects a
column prod does not have and login breaks. Behind that: **decide how the coach
gets a REAL key on staging** -
set `COACH_API_KEY` on the staging Render service, or plan to smoke with your
own key pasted into the BYO field on Profile -> AI access. **Every Lane B path
in the repo has only ever run against `COACH_PROVIDER=mock`**, so not one line
of the coach or the palette studio has ever reached `api.anthropic.com`; until
a real call goes out, nothing about Lane B is proven and AI10's smoke scripts
have nothing to run against. Behind that, still yours and still open: the
connector handshake **from your real account** (Part B below), the prod smoke
of `main` `59e27dc`, the `docs/parked/*` ruling, and the gate-item-5 call on
declaring `zod` / pinning Node.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** September 17, 2026, forty-ninth session (Opus, frontier - **a
state-integrity check**). No code changed. Confirmed the Sept 12 rewrite
COMPLETED: HANDOFF, archive, QUEUE, AI10 and both rescues all present and
pushed; `932fa25..HEAD` is docs-only, so the September 9 work is untouched;
all three lanes clean, free, and carrying no `DELIVERY.md`. Closed the one gap
that pass left - critic rounds 0 and 1 rescued out of gitignore as
`cr0-`/`cr1-critic-round-*-FINDINGS.md`. Prior: September 12, forty-eighth
session (Opus, frontier - **the Lane-B audit**). No code changed. Swept the five unaudited September 9 commits
against Lane A and the specs, authored AI10 from the findings, and rescued two
files that were living only in gitignored paths (`docs/design/critic-brief.md`,
`docs/tasks/cr2-critic-round-2-FINDINGS.md`). Three HANDOFF sections moved
VERBATIM to the archive in this rewrite. Prior: August 14, forty-seventh
session (Opus - the live handshake probe: the connector's server side passes
end to end with a real WorkOS token; findings 1 and 3 closed, the AuthKit
identity-binding finding opened). Prior: August 8, forty-sixth (the Part B
smoke FAILED; AI8+AI9 authored, dispatched in parallel, landed - wave 9/9);
August 8, forty-fifth (the AI7 salvage); August 5, forty-fourth (AI5+AI6, the
live 26/26 run); August 5, forty-third (workflow - gate item 3 split); August
4, forty-second (AI1-AI3 + the prod-deploy incident); August 4, forty-first
(the AI wave authored); August 4, fortieth (F-wave gated and merged to `main`
`59e27dc`). All archived.

**THE WAVE IS STILL AT ITS HARD STOP.** Per `land-unit` section 6: Seth smokes
FIRST, then a frontier seat runs `pre-main-review`. Do not start the gate, do
not run `/code-review`, do not read the branch diff for review purposes until
he signs off. **Neither the Aug 14 in-seat probe nor the Sept 12 audit is that
sign-off** - both are evidence that narrows what he still has to check.

---

## ROAD TO MAIN - the ordered work order (TRANSIENT: delete this section once the merge lands)

Compiled September 17, 2026 (Opus) from a ground-truth readiness pass over the
branch, NOT from prose. **This section is scratch, not permanent state** - the
agent that finishes the merge deletes it wholesale in the post-merge HANDOFF
rewrite. Keep it ordered; items 1-2 can veto everything below them.

**Already verified, do NOT re-derive:** the branch is 43 commits ahead of
`main` with **zero** commits on `main` that it lacks (clean ff merge, no
conflict risk); the wave's one migration `20260804180000_add_ai_consent` is
**additive** (new table + `User.aiConnectorEnabled BOOLEAN NOT NULL DEFAULT
true`), applied on staging, NOT on prod; all three new runtime deps are
declared (`@modelcontextprotocol/sdk`, `express-rate-limit`, `jose`); missing
coach config **degrades honestly** rather than crashing (`keyResolver` ->
`no_key`, `askCoach` -> `coach_unavailable`, `/coach/status` ->
`available:false`); and Sept 12's 295/295 unit lane still binds because
`932fa25..HEAD` is docs-only.

| # | Do | Owner | Blocks because |
|---|---|---|---|
| 1 | **VETO CHECK:** prod Render Node >= 22.12 (`workout-db-l3gc` -> Settings, and the `NODE_VERSION` env var, which wins) | Seth | `app.js:10` requires `ai/mcpServer` unconditionally at boot -> ESM-only `zod` (undeclared phantom) + `jose`; `require()` of ESM needs Node >= 22.12 and NOTHING in the repo pins it. Old Node = **total boot failure**, not a dead feature. Fix = set `NODE_VERSION` on the service (no repo change) |
| 2 | **VETO CHECK:** prod Render build command runs `npm run render-build` | Seth | `render-build` = `prisma generate && prisma migrate deploy`, which applies the migration at BUILD time, before the new code starts - that is what satisfies the ordering invariant automatically. A different command = migration never applies, Prisma selects `User.aiConnectorEnabled` against a missing column, **every default-selection User query fails, login included** |
| 3 | **DECISION:** hosted coach key on prod, or ship Lane B dark (BYO-only)? | Seth | decides whether #4 is a blocker or a follow-up. Dark is cheaper and makes AI10 non-blocking - but then #13 must not promise a coach |
| 4 | Dispatch + land **AI10** (`docs/tasks/ai10-ai-layer-live-proof.md`, QUEUED, MODEL auto) - ONLY if #3 says a hosted key ships | agent -> Cursor | `MAX_TOKENS=1500` / `PALETTE_MAX_TOKENS=800` are shared with adaptive thinking on Sonnet 5 -> truncated coach answers and `502 palette_invalid`. Ruling baked into the block: **thinking stays ON, the caps go up (8000/3000)** - do not let a later unit optimize them back down |
| 5 | **DECISION:** ship or fix the stale-AuthKit **wrong-identity bind** | Seth | `prompt=login` is IGNORED; AuthKit reuses its cached session, so a user bound to the wrong LogChamp account stays bound and the connector answers confidently **with another account's data**. Cross-user isolation surface = standing frontier escalation. **Recommendation on record: fix first, as its own unit** |
| 6 | Put a REAL key on staging (`COACH_API_KEY` on staging Render, or smoke via the BYO field on Profile -> AI access) | Seth | **no Lane B path has ever reached `api.anthropic.com`** - five commits, 48 tests and a full UI, all against `COACH_PROVIDER=mock`. Without a key #7 cannot test the coach at all, and AI10's smoke scripts have nothing to run against |
| 7 | **THE SMOKE: Part A surfaces + Part B connector from Seth's REAL account** (checklist below in this file) | Seth | the hard stop. The gate does not start until he signs off; a gate run before smoke gets partly re-run after it. A smoke defect re-enters as a diagnosis block and RESETS the sign-off |
| 8 | **DECISION (optional):** work CR2 to its 8+ bar, or ship at 7.5 | Seth | `docs/tasks/cr2-critic-round-2-FINDINGS.md` is the work order; a UI block must be authored FROM it, not from memory. Product polish only - does not block a merge |
| 9 | Pre-main gate review - the `pre-main-review` skill, frontier seat (Opus), gate fuel fanned out to **Cursor report lanes, never Claude subagents** | agent | nothing merges without a PASS. Grep `HANDOFF-ARCHIVE.md` for this wave's session history as review fuel. A BLOCKED verdict sends fixes back through the relay |
| 10 | `npm install` in main-tree `server/` (gate item 5 - ask first) | agent | `express-rate-limit` was never installed in the main tree (every unit was built in lane worktrees), so two suites fail to LOAD there - zero assertion failures, but it blocks the gate's fresh green run |
| 11 | Create a **PROD** AuthKit environment; set its External Sign-in URI to `<prod client origin>/connector/login` (RUNBOOK 10c) | Seth | an AuthKit environment has exactly ONE External Sign-in URI, so **prod and staging cannot share one** - pointing it at prod breaks the staging connector and vice versa. Today it points at this branch's Vercel PREVIEW host |
| 12 | Set prod env vars on `workout-db-l3gc`: `MCP_RESOURCE_URL`, `MCP_AUTHORIZATION_SERVER`, `WORKOS_API_KEY` (+ `COACH_*` per #3) - RUNBOOK 10b | Seth | `MCP_RESOURCE_URL` unset **silently defaults to `http://localhost:3000/mcp`** (`routes/index.js:18`, `middleware/connectorAuth.js:21`) - discovery advertises localhost and every real token fails the audience check with no error anywhere. `MCP_AUTHORIZATION_SERVER` is read at MODULE LOAD (`ai/tokenVerifier.js:1-2`), so it needs a RESTART to take effect |
| 13 | **DECISION:** write a What's New entry for the September 9 wave, or hold the announcement | Seth | entry `2026-08-ai-assistant` (dated Aug 5) is prod-gated via `lib/appEnv.js` and **fires for every prod user on this deploy**. It describes the CONNECTOR ONLY - it predates the coach, the palette studio and the entire Sept 9 redesign - and advertises a feature that does nothing until #11 and #12 are complete |
| 14 | Gate-item-5 call: declare `zod` in `package.json` and pin Node in-repo | Seth | the permanent fix for #1. Touches `package.json`, so it asks first |
| 15 | Seth says **"push to main"** verbatim -> merge, ONE command at a time with approval before each | Seth | gate item 1. Report commits, SHAs and confirmed `origin/main` HEAD after the push |
| 16 | Post-merge: repoint staging Render to `main` (**RUNBOOK step 7 is NOT a no-op this wave**), run RUNBOOK 10d verification, then the prod smoke | Seth + agent | staging Render tracks THIS BRANCH today. 10d's most informative check is simply **logging in on prod** - the migration adds a NOT NULL column to `User`, so if login works the ordering held |

**Full cutover detail is `docs/RUNBOOK.md` section 10** (vetoes, env matrix,
AuthKit ruling, verification curls, known-at-cutover defects, rollback). Do not
re-write that content here. **Rollback is cheap:** the migration is additive
with a `DEFAULT`, so reverting `main` to `59e27dc` is safe and needs no
down-migration - leave the table and column in place.

---

## The AI-wave - Lane A 9/9 LANDED, Lane B landed UNAUDITED and now swept

Branch `ai-connector-wave` off `main` `59e27dc`; `origin` HEAD `932fa25`.
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

### The September 12 audit - what it cleared, and what it did not

**Clean:**

- **ZERO Lane A regression.** `ai/mcpServer.js`, `connectorAuth.js`,
  `connectorAuthorize.js` and `connectorAuthController.js` are BYTE-IDENTICAL
  to `43a4ceb`; `aiApi.js` untouched; AI9's per-client accordions survive the
  AI-access rebuild intact.
- `npm run test:unit` **295/295 in 27 suites** (the +28 coach tests are real).
- Client build clean; `node scripts/check-hex.mjs` clean across the whole
  range despite **+3485 lines** of `index.css`.
- **No schema change, so no migration is owed** by this lane.

**Not clean - the two findings that produced the follow-up work:**

1. **Lane B has never made a real API call.** `server/.env` carries no
   `COACH_*` keys at all and the unit lane injects `fetchImpl`, so every coach
   and palette path has only ever run against `COACH_PROVIDER=mock`. Three
   budget-shaped defects follow from that and are AI10's contract: adaptive
   thinking on `claude-sonnet-5` shares `max_tokens` with the answer (the code
   deliberately sends no `thinking` parameter, pinned by
   `coachProvider.test.js:113`), so `MAX_TOKENS = 1500` invites a truncated
   answer; `PALETTE_MAX_TOKENS = 800` is the same bug with a harder failure
   (`JSON.parse` throws -> `502 palette_invalid`, and the controller branches
   on `stop_reason: "refusal"` but not `"max_tokens"`); and `CoachPanel.jsx:322`
   renders a bare caret while the model thinks, which reads as hung.
2. **The critic loop stopped one pass short of its own exit bar.** Round 0
   5/10 -> `2080128` -> round 1 7/10 -> `932fa25` -> **round 2 7.5/10, written
   11 minutes after the last commit and never acted on.** The brief sets the
   exit bar at 8+.

### AI10 - QUEUED, authored Sept 12, NOT dispatched

`docs/tasks/ai10-ai-layer-live-proof.md`, MODEL auto, MODE 1-relay. Raises both
ceilings (1500 -> 8000, 800 -> 3000), branches on `stop_reason: "max_tokens"` on
both paths so a truncated answer never reads as complete, gives the thinking
pause a face in `CoachPanel`, and leaves behind `scripts/smoke-coach.mjs` +
`scripts/smoke-connector.mjs`. **Ruling baked into the block: thinking STAYS
ON, the caps go up** - an unused ceiling costs nothing, because billing follows
emitted tokens. Do not let a later unit "optimize" 8000/3000 back down.
The scripts are WRITTEN but NOT RUN by Cursor (no key, no `server/.env` in the
lane); running them is the reviewer's or Seth's step, and `smoke-connector.mjs`
makes the August 14 in-seat connector probe repeatable for the first time.

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

### Lane A carry-forward - what the Aug 14 live probe settled

Full detail moved VERBATIM to `docs/HANDOFF-ARCHIVE.md` (forty-eighth session
header). The conclusions that still govern:

- **The server side PASSES end to end** with a real WorkOS token: discovery,
  authorize, PKCE exchange, `initialize`, `tools/list`, all four `tools/call`,
  and refresh. Protocol `2025-11-25`, `serverInfo: logchamp 1.0.0`.
- **AI8 is confirmed live** - the External Sign-in URI is the client origin and
  the `external_auth_id` survives the login detour. No Vercel 404.
- **Consent kill-switch PASSES live**, on both `tools/call` and `tools/list`,
  with no cache lag.
- **`external_auth_id` TTL is 300 seconds** (AuthKit sets `Max-Age=300`). AI8's
  "assume no window and degrade gracefully" stance holds, but a slow password
  screen can genuinely expire a handshake.
- **OPEN FINDING, probably its own unit: a stale AuthKit session silently binds
  the WRONG identity, with no escape hatch.** `prompt=login` is IGNORED; AuthKit
  reuses its cached session, so a user who lands on the wrong LogChamp account
  once stays bound to it and the connector answers confidently with the wrong
  account's data. Most likely mechanism behind "I added it and it still didn't
  work." Not config-fixable from the client side.
- **Trap before prod:** the staging Login URI host is a Vercel PREVIEW deploy
  behind Deployment Protection - any cold context (curl, no cookies) gets 302'd
  to `vercel.com/sso-api`. Staging-only (prod's domain is public), but nothing
  except Seth's own browser can reach that URL today.

### The three AI2/AI3 findings - two closed, one open

1. **~~Rate limiter cannot key on connector identity~~ - FIXED by AI6
   `c1398a8`, and the wiring is now proven live** (two distinct buckets; the
   identity counter continued across a DIFFERENT token for the same `sub`
   without resetting). Only a literal two-identity check remains; it needs a
   second LogChamp account, Seth's to create.
2. **OPEN: `zod` and `jose` are ESM-only on an UNPINNED Node.** `zod` 4.4.3 is
   `"type": "module"` and is **completely undeclared in `package.json`** - a
   phantom transitive of the MCP SDK that `mcpServer.js` requires at boot. AI3
   deploying PROVES Render's Node is >= 22.12, so nothing is broken today, but
   a Render default change silently reintroduces a total-outage boot failure.
   Two cheap fixes, both Seth's call (gate item 5, touches `package.json`):
   pin Node, declare `zod`.
3. **~~`sub`-to-user mapping unverified~~ - CLOSED Aug 14, it PASSES.** `sub`
   comes back as a LogChamp `cuid()`, not a `user_`-prefixed WorkOS id, because
   WorkOS echoes the id `completeConnectorAuthorization` sent it.

**The design decision most easily re-broken later: MCP's current revision is
`2026-07-28` and we are deliberately NOT targeting it.** That revision changes
the transport incompatibly and drops `initialize`/`Mcp-Session-Id`; Anthropic's
connector docs still list support only through `2025-11-25`. Dated decision,
not oversight - `ai-layer.md` **section 4.0 "CORRECTIONS"** is authoritative
where it and older prose disagree. A dual-era server is a future unit.

**Two units are cross-user isolation surfaces** - AI2's Bearer guard and AI4's
token verification - and are standing frontier-seat escalations regardless of
who writes them.

**DO NOT READ A GREEN LANE AS COVERAGE OF AN ENDPOINT THIS WAVE.**
`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware; the integration lane needs
`server/.env`, which no lane worktree has.

### CONSOLIDATED WAVE SMOKE - Seth, on the staging Vercel deploy

**REWRITTEN September 12** - the August version's Part A is superseded (the
Sept 9 rebuild changed the AI-access page and killed the double-"Copied"
residual it described); the old text is verbatim in the archive. Confirm the
Vercel staging deploy has built `932fa25` before starting.

**Part 0 is DONE** (the External Sign-in URI points at the client origin) and
the four Render env vars are set. **Probe `GET /coach/status` on staging FIRST**
- it tells you whether the coach is running on a hosted key, on mock, or is
unavailable, and every coach check below depends on that answer.

**Part A - the surfaces, including everything Sept 9 changed:**

- **Profile -> AI access**: switch row + state line, three facts, the quiet
  coach status, and the mono address with copy. Before consent, only the
  consent statement and the toggle show; turning AI access ON reveals the
  connection section. **The address reads
  `https://workout-db-staging.onrender.com/mcp`** - wrong means `VITE_API_URL`
  on Vercel is wrong.
- **AI9's per-client accordion survived the rebuild** (audited): Claude open by
  default, ChatGPT / Grok / generic collapsed, each independent. Check on phone.
- **The coach panel on Analytics** - opens in place, range/view-aware, the
  suggested questions derive from the summary. **Ask it something and watch the
  answer END** - if it stops mid-sentence you have just reproduced AI10's
  truncation finding on a live key.
- **The session debrief** - one tap on a finished workout.
- **BYO key** on Profile -> AI access (sessionStorage only, never stored).
- **Palette studio** on Profile -> Appearance: describe a look, live preview,
  keep / try another / discard / forget. Kept palettes are **per device**.
  A failure reading "The model did not return a palette" is AI10's finding 2.
- **The Sept 9 UI pass**, read as a user: full-bleed scenes in dark mode, light
  mode as crisp pixel art rather than fog, the barbell loading motif and
  shape-matched skeletons, month-grouped History rows with top set / tonnage /
  duration, the Home date + greeting hero, Exercises as real analytics.
  **Check iron and crimson** - the critic scored both scenes well below champ.
- **Regression:** log out and back in, load Analytics, start and finish a
  workout. **What's New does NOT appear on staging** - prod-gated by design.

**Part B - the real connector. THIS IS THE PASS THAT MATTERS.**
Everything a token can reach already passed in-seat on Aug 14. Two items still
need YOU:

- **The handshake from your REAL account.** The AuthKit session is stuck on the
  `smoke-b8@example.com` throwaway and `prompt=login` will not shake it - clear
  AuthKit cookies or use a fresh browser profile.
- **Adding the connector inside Claude itself**: Customize -> Connectors -> Add
  custom connector. Run it SIGNED OUT at least once (the path AI8 changed most
  and no lane can reach), and once already signed in (should be near-instant).
- **If it fails, capture the exact callback URL and its `error=` value BEFORE
  anything else.** August 6's real error was only visible there; the
  client-surfaced message was actively misleading.
- **Consent-blocked path:** with AI access OFF, the connector flow should land
  on `/profile/ai`, not an error page.
- Ask Claude "how has my bench press moved this month?" and confirm the numbers
  match the Analytics page. Then turn AI access OFF and ask again - **it must
  fail.**
- **A second LogChamp account** (register in a SEPARATE browser profile so the
  existing session survives) is the one thing that closes AI6's two-identity
  `RateLimit-*` check.

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
- **`ai-connector-wave` is at `932fa25`**, local == origin. **Staging Render
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
  was never installed there, because every unit of this wave was built in lane
  worktrees. Two suites fail to LOAD in the main tree as a result; zero assertion
  failures. An `npm install` in `server/` clears it - deliberately not run
  unasked (gate item 5).

### Lane worktree state

**All three lanes are CLEAN and FREE.** Lane 1 on `cursor/ai8` and lane 2 on
`cursor/ai9`, both at `43a4ceb`; lane 3 on `recon/ai9-r2` at `892d610` -
**repoint any lane off the target wave branch before use or the delivery lands
on the wrong base.**

**Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status`** - it is
gitignored, so a stale report reads as "clean". The written warning was not
enough on its own on August 8; what caught it was mtime. Prefer a DISTINCT
report filename per lane run (`RECON-R1.md` / `RECON-R2.md`) so a stale file
cannot impersonate a fresh one at all.

**Lane `node_modules` drift is real.** When a lane's failures are
`Cannot find module`, suspect the environment before the code, and verify in a
lane known to be current.

## Other open items

**Seth items:** the coach key decision (top of this file); the R6 tagline pick
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
