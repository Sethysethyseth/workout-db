# HANDOFF — current state

**Next action (human):** **Say "migrate staging" to unblock the `AiConsent`
migration, then set the four WorkOS env vars on the `workout-db-staging` Render
service.** The migration is no longer his to run - gate item 3 was split on
August 5 and staging migrations are now agent-run behind that trigger phrase
(prod is still his, always). The Render dashboard stays his. AI1's migration is
written but unapplied anywhere, and `MCP_RESOURCE_URL` being unset is now PROVEN
to matter (staging's live discovery document advertises
`http://localhost:3000/mcp`). Both block any real connector smoke. Values and
click-path: `docs/specs/workos-staging-handoff.md` section 4. Still open behind
those, blocking nothing: the prod smoke of `main` `59e27dc` (covers the F-wave
AND the leftover E-wave pass), and the `docs/parked/*` ruling.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 5, 2026, forty-third session (Opus, workflow — gate item 3
split staging/prod, and `cursor-watch` rebuilt as a single multi-lane wave
dashboard; see "Relay tooling" below. No product code touched, wave state
untouched at 3/5). Prior: August 4, forty-second session (resident relay — **AI-wave
dispatched and landed 3/5: AI1 `83d82c8`, AI2 `5c051bc`, AI3 `eecd2e9`**, no
bounces; plus a prod-deploy incident found and closed, see below). A CONCURRENT
session the same evening drove the WorkOS dashboard to done (`4a8a98c`) — its
work is folded in under "AI4 / WorkOS" and preserved at
`docs/specs/workos-staging-handoff.md`. Prior entries: August 4, forty-first
session (Opus — the AI wave AUTHORED from three recon lanes); August 4, fortieth
(Opus — F-wave gated and merged to `main` `59e27dc`). Full session logs are
verbatim in `docs/HANDOFF-ARCHIVE.md`.

### INCIDENT, August 4 — prod Render was building from the wave branch

**Closed, no data impact, but the mechanism is worth remembering.** Prod Render
`workout-db-l3gc` was pointed at `ai-connector-wave` instead of `main`, so the
AI1 push auto-deployed unreviewed, ungated server code straight to production.
Caught by probing both services rather than by reading docs: prod answered
`GET /ai/consent` with **401** (route mounted) while 404ing `/ai/nonsense`, and
`git branch -r --contains 83d82c8` returned only `origin/ai-connector-wave` —
`main` had no `/ai` mount at all. Seth repointed prod back to `main` and moved
staging onto the wave branch; both re-verified from ground truth afterwards
(prod `/ai/consent` -> 404, staging -> 401, both `/health` 200).

**No data was at risk** — the migration had not run anywhere, AI1 added no code
to any existing route, and prod's client had no link to the page. **The durable
lesson: HANDOFF's deploy topology is a CLAIM, not ground truth.** The relay
pushed three times on the assumption "this branch is staging-side" because the
doc said so. Probe the actual services before the first push of any wave that
carries server code — a 401-vs-404 diff across two hosts costs one command and
settles it.

---

## The F-wave (effort MANDATORY) — CLOSED. Merge record archived August 4.

**Merged August 4 as a clean fast-forward, `8541bca..59e27dc`** (14 commits):
F0 `00e06d9`, F1 `3da8bf5`, F2 `bfa010a`, F3 `0ee258b`, gate fix `59e27dc`.
**The full section — the gate finding, the seed-invariant, the accepted mixed-
signal residual, and the wave's authoring lesson — moved VERBATIM to the TOP of
`docs/HANDOFF-ARCHIVE.md`** when this file exceeded its cap during the AI-wave.
Go there before touching effort seeding. The one item still LIVE is below.

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


## The AI-wave — **3/5 LANDED August 4**, AI4 and AI5 remain

Branch `ai-connector-wave` off `main` `59e27dc`; `origin` HEAD `eecd2e9`.
**Staging Render now tracks THIS BRANCH** (Seth repointed it mid-session, RUNBOOK
pre-merge step 2), so pushes here deploy to `workout-db-staging` and the
connector surface is live and probeable there right now.

| Unit | SHA | What landed |
|---|---|---|
| AI1 | `83d82c8` | consent record + entitlement flag + `/profile/ai` page; migration WRITTEN not applied |
| AI2 | `5c051bc` | discovery doc, Bearer guard, scope+consent enforcement, connector rate limit |
| AI3 | `eecd2e9` | MCP server on `/mcp`, four read-only tools, shared analytics data path |
| AI4 | — | QUEUED. Human-blocked on Render env vars only (dashboard is done) |
| AI5 | — | QUEUED, serial behind AI4 |

None of the three bounced. AI1 and AI3 needed no reviewer fix; AI2's one
deviation was the block being wrong, not the delivery (detail in QUEUE.md).
**Full per-unit audit reasoning lives in `docs/tasks/QUEUE.md`** — it is long by
design this wave, because the lanes cover almost nothing here.

**Live staging evidence, August 4, after AI3 deployed** — worth more than any
lane result this wave: `/health` 200; `/.well-known/oauth-protected-resource`
200; `GET /mcp` -> 401 carrying
`WWW-Authenticate: Bearer ..., resource_metadata="...", scope="training:read"`.
A 401 that omits `resource_metadata` is the top real-world connector failure, so
that header being present on a real deployment is the single most valuable
verification in the wave so far.

Blocks at `a1689e0`, pushed.
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

**The AI1 stall is RESOLVED — Seth cleared it for autonomous dispatch on August
4.** The reasoning, so it is not re-litigated: `dispatch-unit` section 4 refuses
migration-carrying blocks because RUNNING a migration is his manual track, but
AI1's block forbids Cursor from running any migration command — it hand-writes
the `.sql` and stops. The apply stays his, unchanged. Cursor honoured that: only
`prisma generate` was run.

### THE TWO BLOCKERS — one is now AGENT-RUN behind a phrase (August 5)

Blocker 1 stopped being a human task when gate item 3 was split: a staging
migration is agent-run once Seth says **"migrate staging"** verbatim, one
command at a time with approval before each. Prod migrations are unchanged and
remain his. Blocker 2 is still entirely his (Render dashboard).

1. **The `AiConsent` migration is written and applied NOWHERE.**
   `server/prisma/migrations/20260804180000_add_ai_consent/migration.sql` —
   additive only (`CREATE TABLE "AiConsent"`, its unique index and cascade FK,
   `ALTER TABLE "User" ADD COLUMN "aiConnectorEnabled" BOOLEAN NOT NULL DEFAULT
   true`), zero `DROP`. Until it is applied to staging Neon, `/profile/ai` and
   `/ai/consent` error, and the connector guard's consent lookup cannot succeed.
   The server still BOOTS fine without it (Prisma does not validate against the
   DB at connect time) and no pre-existing route regressed — verified live.
2. **Checklist step 9: four env vars on `workout-db-staging` Render.** The
   dashboard half is DONE (below). This is now demonstrably load-bearing, not
   bookkeeping: with `MCP_RESOURCE_URL` unset, staging's live discovery document
   returns `"resource":"http://localhost:3000/mcp"` and the 401's
   `resource_metadata` points at localhost — **no external client could ever
   authenticate against that.** Values and the exact click-path (including how
   Seth reveals `WORKOS_API_KEY` himself, which no agent touches):
   `docs/specs/workos-staging-handoff.md` section 4.

**AI4 is otherwise unblocked and its code is authorable now** — but read "Three
findings AI4 must address" below FIRST; two of them are in files AI4 will touch.

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
whoever finishes this: **`docs/specs/workos-staging-handoff.md`** (`d814cec`) —
preserved VERBATIM into the repo from a session scratchpad, because the original
reference was to a temp directory that would not have survived. Read its section
0 before touching anything: `WORKOS_API_KEY` is never handled by an agent.

### Three findings AI4 must address — none is an AI3 or AI2 defect

Found during the AI2/AI3 audits. All three are live on the branch now.

1. **The connector rate limiter cannot key on connector identity, by
   construction.** `app.js` mounts it at `:169-170`; `connectorAuth` does not run
   until `app.use("/", routes)`, so `req.connectorUserId` is ALWAYS undefined
   when `keyGenerator` runs. Harmless today — the v1 verifier accepts an ordinary
   LogChamp token and `attachAuthUser` sets `req.authUserId` from that same
   token. **After AI4 it silently degrades:** a WorkOS-signed token is not our
   JWT, so `authUserId` stays unset and every connector request keys by IP. All
   Claude traffic egresses from a few Anthropic IPs, so every user would share
   one 300-per-15-min bucket — exactly what the block's keying was written to
   prevent. Same "defect only where two units meet" shape as the F-wave gate
   finding. Not fixed in-seat: design change on a security surface.
2. **`zod` and `jose` are ESM-only on an UNPINNED Node.** `zod` 4.4.3 is
   `"type": "module"` and is **completely undeclared in `package.json`** — a
   phantom transitive of the MCP SDK that `mcpServer.js` requires at boot.
   AI3 deploying successfully PROVES Render's Node is >= 22.12 (below that,
   `require(esm)` throws and the API would not start at all), so this is not
   currently broken and `require("jose")` in AI4 will work too. But there is no
   `engines` field, `.nvmrc`, or `.node-version` anywhere, so a Render default
   change silently reintroduces a total-outage boot failure. Two cheap fixes,
   both Seth's call because they touch `package.json` (gate item 5): pin Node,
   and declare `zod` properly.
3. **`sub`-to-user mapping is still the highest-severity unverified line in the
   wave** and cannot be verified until a real WorkOS token flows. See
   `workos-staging-handoff.md` section 7. No test that mocks WorkOS into
   agreeing with you counts as verification.

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

**That curl path is now OPEN and is the next agent's highest-value move.** `/mcp`
is live on staging behind the guard, and the v1 verifier accepts an ordinary
LogChamp Bearer token. Once the migration is applied and consent is granted for
a test account, `tools/list` and `get_training_summary` can be driven end to end
with `curl` — no WorkOS, no Claude, no vendor account. That exercises AI1+AI2+AI3
together and is the only way to catch a seam none of the three lanes touch.
Registering a throwaway staging account via the API is the established pattern
(FP5 precedent, HANDOFF-ARCHIVE).

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

**Lane 1 (`C:\dev\worktrees\cursor-lane`) holds AI3's LANDED delivery** — it sits
on `cursor/ai3` at `eecd2e9`, tree clean, with AI3's `DELIVERY.md` still present.
That report is LANDED work, not pending: delete it before the next dispatch so it
cannot read as a fresh delivery. Lanes 2 and 3 are FREE, still on `recon/air2` /
`recon/air3` off `53235c7` — repoint them off `origin/ai-connector-wave` before
use or the delivery lands on the wrong base. The AIR1-AIR3 recon reports were
session-scoped and deliberately not preserved; their six findings live in the
blocks, the QUEUE entry, and `ai-layer.md` section 4.0.
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

## Relay tooling — August 5 (workflow session, no product code)

Two changes, both mid-wave-safe. AI4/AI5 stay QUEUED and nothing about how a
block is authored, dispatched, or landed moved.

1. **Gate item 3 split** (`AGENTS.md`). Staging migrations are agent-run behind
   the verbatim trigger phrase **"migrate staging"**, one command at a time with
   approval before each, `prisma migrate status` reported after. Prod migrations
   are unchanged: Seth runs them, item 2 stacks on top, an agent may only print
   the sequence. The ordering invariant (DB before dependent code deploys) is
   now stated once, in item 3, and the duplicate paragraph lower in AGENTS.md
   points at it. `dispatch-unit` section 4 was corrected to match — a
   migration-carrying block IS dispatchable, because the block only ever has
   Cursor WRITE the migration; a lane still never runs `prisma migrate`.
   Rationale: the original any-environment rule was written defensively around a
   weaker non-Anthropic model, and `dbHostGuard.assertSafeForBoot()` already
   makes staging's blast radius mechanical rather than procedural.

2. **`scripts/cursor-watch.mjs` is now the whole relay's dashboard**, not one
   lane's. It watches every existing lane in the v5.2 pool (`cursor-lane`, `-2`,
   `-3`) from ONE server on one port, so fan-out no longer means three tabs —
   the auto-open and notify controllers moved onto a shared hub and are consumed
   once, by whichever lane stirs first. It also parses `docs/tasks/QUEUE.md` for
   the live wave rail (the contiguous leading run of same-prefix units in
   `## Active`, which is what keeps the AI-wave at five instead of swallowing
   the F-wave below it) and renders n/N. `--lane` now repeats to pin an explicit
   set; omitted, it auto-discovers. The Startup shortcut needs no change — it
   already passes `--open-on-activity --notify` and now covers all three lanes.
   Verified live: three lanes discovered, wave parsed `AI-wave 3/5`,
   `AI1..AI3 LANDED / AI4 AI5 QUEUED`.

## Repo / deploy state

- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident above happened because these lines were trusted. One command settles
  it: `curl -s -o /dev/null -w "%{http_code}" https://<host>/ai/consent` returns
  **401** if the host serves the wave branch and **404** if it serves `main`.
- **`main` is at `59e27dc`** — the F-wave merge, August 4, a clean fast-forward
  from `8541bca` (14 commits). **Prod Render `workout-db-l3gc` is back on
  `main`** as of August 4 (re-verified: `/ai/consent` -> 404, `/health` 200).
  Prod Vercel tracks `main`. Any push to `main` is a prod-bound push (gate 2).
  **Prod smoke is still open and unverified** — F0 is the first `server/` change
  to reach prod since the frontier-parity merge.
- **Staging Render `workout-db-staging` now tracks `ai-connector-wave`** (Seth
  repointed it August 4, RUNBOOK pre-merge step 2). So pushes to the wave branch
  auto-deploy the connector surface to staging — re-verified live
  (`/ai/consent` -> 401, `/mcp` -> 401, `/health` 200). **RUNBOOK step 7 is NOT a
  no-op for this wave:** staging must be repointed back to `main` after the
  merge.
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

### Workflow modernisation backlog — OPEN, agreed August 5, none started

From Seth's August 5 brainstorm against the six Claude-5 guidance rules
(judgement over rules, interfaces over examples, progressive disclosure,
simple tool descriptions, auto-memory, rich references). Two items shipped
that session (gate split, wave dashboard — see "Relay tooling"); these four
did not. Do them one at a time between waves, never mid-wave:

1. **Rules -> tooling.** Fold `land-unit` section 2's three "things a green
   build cannot catch" into a runnable `scripts/audit-seams.mjs` (unresolved
   `var(--...)` names; identifiers removed but still referenced; server
   response shape vs client destructure). `check-hex.mjs` is the precedent —
   a check that RUNS beats a check the reviewer must remember.
2. **Structured `DELIVERY.md`.** Fixed schema per acceptance criterion
   (criterion -> command -> verbatim output) instead of free prose, so a
   report-vs-tree mismatch is mechanically visible. Cheap Cursor rungs fill
   a schema more reliably than they write prose. Template lives in
   `docs/tasks/cursor-task-block-template.md`.
3. **Preferences -> auto-memory.** `land-unit` carries Seth's standing asks
   (smoke-on-Vercel, the n/N line, keep-the-report-brief) with dates. Those
   are user preference, not ritual; the repo contract stays in AGENTS.md
   because Cursor reads it, but the preferences belong in Claude Code memory.
4. **Trim provenance out of hot paths.** CLAUDE.md's seat history (the Fable
   departure, three amendment layers) and the dated "backported here July 28"
   notes are archive material sitting in files loaded every session. Live
   instructions on top, history to a `docs/specs/` file.

Also agreed in principle, not decided: relaxing gate item 5 so `devDependencies`
installs are hands-off while new RUNTIME deps still ask. Seth's call.

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
- **A deployed service's branch is a CLAIM until you probe it.** August 4: three
  pushes went to prod believing this file's topology note. A 401-vs-404 diff on
  one route across two hosts costs one command. Probe before the first push of
  any wave carrying server code.
- **An ESM-only package in a CommonJS server is a BOOT risk, not a feature
  risk.** `zod` and `jose` are both `"type": "module"`; `require()` works only on
  Node >= 22.12, and nothing in this repo pins Node. If it breaks, the API does
  not start at all. Also watch for PHANTOM dependencies — `zod` is `require`d by
  `mcpServer.js` but appears nowhere in `package.json`.
- **A green lane proves nothing about a server route this wave.**
  `npm run test:unit` never loads a route, controller, or middleware. Run
  `node -e "require('./src/app.js')"` to at least prove the module graph loads,
  and prefer a live `curl` against staging over any assertion.
- **E-wave and F-wave gotchas** (discoverability vs acceptance criteria, the
  CSS-grid child reflow, prop-ABSENCE seams, duplicate state copy, the
  `rir = 0` blank-vs-truthiness trap, `startSession` creating zero
  `WorkoutSet` rows) moved with their wave sections to
  `docs/HANDOFF-ARCHIVE.md`. Read them before touching effort or template
  seeding — the `rir = 0` one in particular is still live in the code.
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
