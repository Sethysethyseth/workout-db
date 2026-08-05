# HANDOFF — current state

**Next action (human):** **Smoke the AI-wave on staging and sign off** — all six
units are landed and the wave is at a HARD STOP waiting on you; the consolidated
checklist is in "CONSOLIDATED WAVE SMOKE" below. Part A works right now; Part B
(the real Claude connector) needs you to set the four WorkOS env vars on the
`workout-db-staging` Render service first — values and click-path in
`docs/specs/workos-staging-handoff.md` section 4. The migration blocker is
CLOSED (it was already applied on August 4 by Render's own build). Nothing goes
to the pre-main gate until you sign off. Still open behind that, blocking
nothing: the prod smoke of `main` `59e27dc` (covers the F-wave AND the leftover
E-wave pass), the `docs/parked/*` ruling, and the gate-item-5 call on declaring
`zod` / pinning Node.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 5, 2026, forty-fourth session (Opus, resident relay — **the
AI-wave COMPLETED 6/6**). What this session did, in order: found the `AiConsent`
migration already applied and corrected the record; drove AI1+AI2+AI3 live
against staging with an ordinary Bearer token (26/26) before that window closed;
released the held AI4 push; dispatched and landed AI5 `9a2f63a`; **authored AI6
at Seth's request** for the rate-limiter finding, taking N from 5 to 6; landed
AI6 `c1398a8`. No bounces, no reviewer fixes in either unit. Prior: August 5,
forty-third session (Opus, workflow — gate item 3 split, `cursor-watch` rebuilt;
both archived); August 4, forty-second (resident relay — AI1-AI3 landed, plus the
prod-deploy incident, archived); August 4, forty-first (Opus — the AI wave
AUTHORED from three recon lanes); August 4, fortieth (Opus — F-wave gated and
merged to `main` `59e27dc`). Full session logs are verbatim in
`docs/HANDOFF-ARCHIVE.md`.

**THE WAVE IS AT ITS HARD STOP.** Six units landed, nothing queued, nothing in
flight. Per `land-unit` section 6 the relay session ends here: Seth smokes
FIRST, then a frontier seat runs `pre-main-review`. Do not start the gate, do
not run `/code-review`, do not read the branch diff for review purposes until
he signs off — his findings are review input, and a gate run before smoke gets
partly re-run after it.

The August 4 prod-deploy INCIDENT (prod Render building from the wave branch),
the WorkOS staging-dashboard record, and the August 5 relay-tooling changes all
moved VERBATIM to the TOP of `docs/HANDOFF-ARCHIVE.md` in this rewrite. All
three are closed. Their durable lessons survive in "Durable gotchas" below.

---

## The F-wave (effort MANDATORY) — CLOSED, merged `8541bca..59e27dc`. Detail archived.

Go to `docs/HANDOFF-ARCHIVE.md` before touching effort seeding — the gate
finding, the seed-invariant, and the wave's authoring lesson are there. The one
item still LIVE is below.

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

## The E-wave — CLOSED and MERGED (`7d1c9ba..d272930`, August 2). Detail archived.

**The one E-wave note still live:** the "two sets of 10" sentence ships in FOUR
hand-varied forms (E2's nudge, E3's `HOW_EFFORT_MATTERS`, E4's
`EFFORT_RATIONALE_SHORT`, F2's `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`). None is a
defect alone. Consolidating them into one shared module is a known follow-up —
it should absorb F2's page-to-page import at the same time.


## The AI-wave — **6/6 LANDED, August 5. AWAITING SETH'S SMOKE.**

Branch `ai-connector-wave` off `main` `59e27dc`; `origin` HEAD `c1398a8`.
**Staging Render tracks THIS BRANCH**, so every push here deploys to
`workout-db-staging`. **RUNBOOK step 7 is NOT a no-op for this wave** — staging
must be repointed back to `main` after the merge.

| Unit | SHA | What landed |
|---|---|---|
| AI1 | `83d82c8` | consent record + entitlement flag + `/profile/ai` page |
| AI2 | `5c051bc` | discovery doc, Bearer guard, scope+consent enforcement, connector rate limit |
| AI3 | `eecd2e9` | MCP server on `/mcp`, four read-only tools, shared analytics data path |
| AI4 | `c89570e` | WorkOS JWKS verification + Login URI |
| AI5 | `9a2f63a` | the connect surface: copyable address, four steps, tier note, What's New |
| AI6 | `c1398a8` | rate-limit the connector by identity, not IP (fixes finding 1) |

**N went 5 -> 6 on August 5** when Seth asked for the rate-limiter finding to be
its own unit rather than a known defect carried into the gate.

**ZERO bounces across all six units, and only two reviewer fixes in the whole
wave** (both in earlier units, both recorded in QUEUE). **Full per-unit audit
reasoning lives in `docs/tasks/QUEUE.md`** — it is long by design this wave,
because the lanes cover almost nothing here.

Implements `docs/specs/ai-layer.md` Lane A end to end. The blocks are AI1-AI6
under `docs/tasks/`.

### The wave's strongest evidence — a live end-to-end run, August 5

Before AI4 closed the window (its verifier rejects ordinary LogChamp tokens),
the whole chain was driven against staging with real HTTP using two throwaway
accounts registered via `POST /auth/register`. **26 checks, 26 passed.** This is
worth more than every lane result in the wave combined, because no lane here
loads a route:

- **AI1** — `/ai/consent` returns `{granted:false, connectorEnabled:true}` for a
  fresh user; grant sets `grantedAt`; revoke clears it.
- **AI2** — authenticated-but-unconsented -> **403 `{"error":"forbidden",
  "reason":"no_consent"}`**, NOT a 401, so a good caller is never sent into a
  re-auth loop; garbage token -> 401 with `WWW-Authenticate` carrying
  `resource_metadata` and `scope="training:read"`; **revoking consent closes
  `/mcp` on the very next request.**
- **AI3** — `initialize` negotiates **`2025-11-25`** (the deliberately targeted
  revision); exactly four read-only tools, none accepting a user id/account/email
  input; `get_training_summary` returns the real analytics shape with
  `meta.honestyNotes` intact and no raw set array; a second account sees only its
  own empty world. **Statelessness held across separate HTTP requests** — the
  property AI3 was designed for, never before exercised over the wire.

**That window is now CLOSED** and stays closed until the env vars are set: AI4's
verifier rejects ordinary LogChamp tokens, so `/mcp` currently 401s everything on
staging. Expected, not a regression.

**Naming, restated so nobody builds the wrong thing.** Seth calls this "the
server migration." It is NOT a user migration and must never become one. What
changes is that LogChamp gains the ability to ISSUE scoped OAuth tokens to
third-party clients, layered OVER the cookie/JWT auth that already exists.
Existing users, the user table, and the login flow are untouched. (The one
migration in the wave is AI1's new `AiConsent` table — unrelated to identity.)
Seth's August 4 rulings — full connector end to end, WorkOS as vendor, one
migration, and three approved npm installs — are all discharged; detail in
QUEUE.md.

### THE ONE REMAINING BLOCKER — the migration blocker is CLOSED

**Blocker 1 (`AiConsent` migration) closed August 5.** It had been applied since
August 4 and the "applied NOWHERE" claim was wrong against the database:
`_prisma_migrations` shows `20260804180000_add_ai_consent` finished at
`2026-08-04T22:51:48.737Z`, the table exists with all three indexes, and
`User.aiConnectorEnabled` is `boolean NOT NULL DEFAULT true`. **Cause: a staging
Render deploy runs `migrate deploy` as its build command** — see "Repo / deploy
state" below, where that now lives as a standing warning. Seth's "migrate
staging" authorization went unspent.

1. **Checklist step 9: four env vars on `workout-db-staging` Render.** The
   dashboard half is DONE. This is demonstrably load-bearing, not
   bookkeeping: with `MCP_RESOURCE_URL` unset, staging's live discovery document
   returns `"resource":"http://localhost:3000/mcp"` and the 401's
   `resource_metadata` points at localhost — **no external client could ever
   authenticate against that.** Values and the exact click-path (including how
   Seth reveals `WORKOS_API_KEY` himself, which no agent touches):
   `docs/specs/workos-staging-handoff.md` section 4.

**AI4 is otherwise unblocked and its code is authorable now** — but read "Three
findings AI4 must address" below FIRST; two of them are in files AI4 will touch.

The WorkOS staging-dashboard record moved VERBATIM to `docs/HANDOFF-ARCHIVE.md`
in this rewrite; the values Seth needs for step 9 are in
`docs/specs/workos-staging-handoff.md` section 4, which is the durable copy.

### The three AI2/AI3 findings — ONE IS FIXED, two still open

1. **~~The connector rate limiter cannot key on connector identity~~ — FIXED by
   AI6 `c1398a8`, August 5.** It keyed every `/mcp` request by IP once AI4
   stopped setting `req.authUserId`, so all users would have shared one bucket
   behind Anthropic's egress IPs. Now three limiters: a pre-auth failure ceiling
   (IP-keyed, `skipSuccessfulRequests` so legitimate traffic consumes nothing), a
   per-identity budget mounted AFTER `connectorAuth`, and a separate instance for
   `/ai`. Detail in QUEUE.md. **Residual for the gate:** no lane can prove the
   wiring, only the key functions — closing it needs a live two-identity check of
   the `RateLimit-*` headers, which requires the WorkOS env vars.
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

**The design decision most easily re-broken later: the MCP spec moved to
`2026-07-28` and we are deliberately NOT targeting it.** That revision changes
the transport incompatibly, and Anthropic's connector docs still list support
only through `2025-11-25` — building to the newest spec yields a server today's
Claude cannot talk to. A dated decision, not an oversight; revisit when
Anthropic's docs move. All six August 4 recon findings are in the QUEUE entry,
and `ai-layer.md` **section 4.0 "CORRECTIONS"** holds them authoritatively —
where it and the older prose below it disagree, 4.0 wins.

**Two units are cross-user isolation surfaces** — AI2's Bearer guard and AI4's
token verification — and are standing frontier-seat escalations regardless of
who writes them. The `sub`-to-user mapping in AI4 is the single highest-severity
line in the wave.

**DO NOT READ A GREEN LANE AS COVERAGE OF AN ENDPOINT THIS WAVE.**
`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware; the integration lane needs
`server/.env`, which no lane worktree has. Every block mandates its pure logic
into `server/test/lib/` and declares its lane gap in writing. This is why the
live 26/26 run above is the wave's real evidence.

**Lane B (the in-app coach) is still unauthored and still second** — BYO-key
and hosted over one code path. The hard boundary holds on both lanes: the
deterministic engine computes every number, the model only narrates.

### CONSOLIDATED WAVE SMOKE — Seth, on the staging Vercel deploy

`origin/ai-connector-wave` is at `c1398a8`; confirm the Vercel staging deploy
has built that SHA before starting. **Part A needs nothing from Render. Part B
needs the four env vars set first.**

**Part A — works right now (AI1 + AI5, the whole user-facing surface):**

- **Profile -> AI access exists and is reachable.** Not gated behind
  `isProdEnv()`, so it is on staging.
- **Before consent, the page shows only the consent statement and the toggle** —
  no connector address, no setup steps. That gating is the AI5 contract.
- **Turn AI access ON.** The connection section appears: heading "Connect your
  AI assistant", the address, four Claude steps, and the tier note.
- **The address reads `https://workout-db-staging.onrender.com/mcp`** — the
  staging API, not prod, not `localhost`, not a bare `/mcp`. If it is wrong,
  `VITE_API_URL` on Vercel is wrong.
- **Copy address works** and shows the inline success confirmation. **Known
  cosmetic residual: the word "Copied" appears TWICE** (the button label flips
  AND a success line renders), and the button keeps reading "Copied" until the
  section re-renders. Both are block-specified — tell me if you want one dropped.
- **Read the copy as a user, not as a reviewer.** This is the E3 lesson: the
  acceptance criteria proved the strings are present, and cannot prove anyone
  notices or understands them. Does the tier note read as honest rather than
  discouraging? Is four steps enough to actually do it?
- **Turn AI access OFF** — the connection section disappears again.
- **Regression check, because AI6 touched `app.js`:** log out and back in, load
  Analytics, start and finish a workout. Nothing in this wave should have
  touched any of that, and `app.js` is the one file where a mistake would show
  up everywhere at once.
- **What's New does NOT appear on staging** — it is prod-gated by design. The
  entry ships and fires on the next prod release.

**Part B — only after the four Render env vars are set (the real connector):**

- Add the address in Claude -> Settings -> Connectors -> Add custom connector.
- You should be redirected to LogChamp to sign in, then **come straight back**.
- Ask Claude "how has my bench press moved this month?" and confirm the numbers
  match what the Analytics page shows — the deterministic engine computes them,
  the model only narrates.
- **Turn AI access OFF in LogChamp, then ask Claude again — it must fail.** That
  is the consent kill-switch, verified live rather than by curl.

**What smoke CANNOT settle, and stays open into the gate:** the `sub`-to-user
mapping (finding 3) needs a real WorkOS token, and AI6's wiring needs a
two-identity `RateLimit-*` header check. Both are Part B work.

## The F-wave rulings — ARCHIVED August 4

Seth's August 1 either-or / mandatory / remembered-pref rulings, the legacy
both-false resolution, and the verified pref-gap findings moved VERBATIM to the
TOP of `docs/HANDOFF-ARCHIVE.md` when this file exceeded its cap after the
merge. Nothing in them is outstanding — all four units shipped. Go there if
future effort work needs the WHY rather than the diff.

### Lane worktree state

**Lane 1 (`C:\dev\worktrees\cursor-lane`) holds AI6's LANDED delivery** — it sits
on `cursor/ai6` at `c1398a8`, tree clean, with AI6's `DELIVERY.md` still present.
That report is LANDED work, not pending: delete it before the next dispatch so it
cannot read as a fresh delivery. Lanes 2 and 3 are FREE, still on `recon/air2` /
`recon/air3` off `53235c7` — repoint them off the target wave branch before
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

The August 5 relay-tooling section (the gate item 3 split, and `cursor-watch`
rebuilt as a single multi-lane wave dashboard) moved VERBATIM to
`docs/HANDOFF-ARCHIVE.md` in this rewrite. Both shipped; the live rules are in
`AGENTS.md` gate item 3 and the `dispatch-unit` skill.

## Repo / deploy state

- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. One command
  settles it: `curl -s -o /dev/null -w "%{http_code}" https://<host>/ai/consent`
  returns **401** if the host serves the wave branch and **404** if it serves
  `main`.
- **A staging Render DEPLOY is also a staging MIGRATION.** `server/package.json`'s
  `render-build` is `prisma generate && prisma migrate deploy`, which is how the
  `AiConsent` migration got applied on August 4 without anyone running it. Do not
  assume a written-but-unapplied migration stays unapplied once its branch is the
  one a Render service builds. Check prod Render's build command before assuming
  prod behaves differently.
- **`main` is at `59e27dc`** — the F-wave merge, August 4, a clean fast-forward
  from `8541bca` (14 commits). **Prod Render `workout-db-l3gc` is back on
  `main`** as of August 4 (re-verified: `/ai/consent` -> 404, `/health` 200).
  Prod Vercel tracks `main`. Any push to `main` is a prod-bound push (gate 2).
  **Prod smoke is still open and unverified** — F0 is the first `server/` change
  to reach prod since the frontier-parity merge.
- **Staging Render `workout-db-staging` tracks `ai-connector-wave`** (Seth
  repointed it August 4, RUNBOOK pre-merge step 2). So pushes to the wave branch
  auto-deploy the connector surface to staging — re-verified live August 5
  (`/ai/consent` -> 401, `/mcp` -> 401, `/health` 200, discovery doc 200).
  **RUNBOOK step 7 is NOT a no-op for this wave:** staging must be repointed back
  to `main` after the merge.
- **`ai-connector-wave` is at `c1398a8`** — six units plus their audit records,
  all pushed. Awaiting smoke, then the gate.
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

   *A `/doctor` pass on August 5 scoped this to EXACT line-level cuts in
   CLAUDE.md and AGENTS.md (~750 est. tokens/session saved). That scoping
   moved VERBATIM to the top of `docs/HANDOFF-ARCHIVE.md` — read it before
   doing this item; it also records what must NOT be cut.*

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
