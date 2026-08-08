# HANDOFF — current state

> **WHERE WE ARE (Aug 8):** AI-wave **7/7 landed**, `ai-connector-wave` at
> `cac1363`, staging deployed. Waiting on ONE thing: Seth's smoke, Part B —
> the connector handshake in Claude, which AI7 just unblocked. Gate is
> blocked behind that sign-off. Nothing is in flight; no agent action is
> pending.

**Next action (human):** **Re-try the connector handshake in Claude against
staging, then sign off on the wave.** AI7 removed the `training:read` scope that
killed your August 6 attempt at `error=invalid_scope`, and it is deployed —
`origin/ai-connector-wave` is at `d925bd2`. Part B of "CONSOLIDATED WAVE SMOKE"
below is the pass that matters; Part A is quick regression. The four Render env
vars are already set, so nothing blocks you this time. Nothing goes to the
pre-main gate until you sign off. Open behind that, blocking nothing: the prod
smoke of `main` `59e27dc` (covers the F-wave AND the leftover E-wave pass), the
`docs/parked/*` ruling, and the gate-item-5 call on declaring `zod` / pinning
Node.

> **Standing rule:** the line above is filled on EVERY rewrite and is
> never empty or deferred — one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** August 8, 2026, forty-fifth session (Opus, resident relay — **the
AI7 SALVAGE; the wave is now 7/7**). This session opened cold, found HANDOFF
three days stale and wrong about reality, swept ground truth, discovered the
August 6 AI7 run had died mid-flight with its code complete and its evidence
missing, salvaged it by re-dispatching into the same dirty lane under a
verify-not-redo contract, and landed `d925bd2`. Full session log verbatim at the
top of `docs/HANDOFF-ARCHIVE.md`. Prior: August 5, forty-fourth session (AI-wave
6/6, AI5+AI6 landed, the live 26/26 run); August 5, forty-third (workflow — gate
item 3 split, `cursor-watch` rebuilt); August 4, forty-second (AI1–AI3 + the
prod-deploy incident); August 4, forty-first (the AI wave authored); August 4,
fortieth (F-wave gated and merged to `main` `59e27dc`). All archived.

**THE WAVE IS AT ITS HARD STOP.** Seven units landed, nothing queued, nothing in
flight. Per `land-unit` section 6 the relay session ends here: Seth smokes
FIRST, then a frontier seat runs `pre-main-review`. Do not start the gate, do
not run `/code-review`, do not read the branch diff for review purposes until
he signs off — his findings are review input, and a gate run before smoke gets
partly re-run after it.

---

## The AI-wave — **7/7 LANDED. AWAITING SETH'S SMOKE.**

Branch `ai-connector-wave` off `main` `59e27dc`; `origin` HEAD `d925bd2`.
**Staging Render tracks THIS BRANCH**, so every push here deploys to
`workout-db-staging`. **RUNBOOK step 7 is NOT a no-op for this wave** — staging
must be repointed back to `main` after the merge.

| Unit | SHA | What landed |
|---|---|---|
| AI1 | `83d82c8` | consent record + entitlement flag + `/profile/ai` page |
| AI2 | `5c051bc` | discovery doc, Bearer guard, scope+consent enforcement, rate limit |
| AI3 | `eecd2e9` | MCP server on `/mcp`, four read-only tools, shared analytics path |
| AI4 | `c89570e` | WorkOS JWKS verification + Login URI |
| AI5 | `9a2f63a` | the connect surface: copyable address, four steps, tier note |
| AI6 | `c1398a8` | rate-limit the connector by identity, not IP (fixes finding 1) |
| AI7 | `d925bd2` | drop `training:read` — the scope AuthKit cannot issue |

**N went 5 -> 6 on August 5** (Seth asked for the rate-limiter finding to be its
own unit) and **6 -> 7 on August 6** (the live handshake failure). ZERO bounces
across all seven units; two reviewer fixes in the whole wave, both in early
units. **Full per-unit audit reasoning lives in `docs/tasks/QUEUE.md`** — long
by design this wave, because the lanes cover almost nothing here.

Implements `docs/specs/ai-layer.md` Lane A end to end. Blocks are AI1–AI7 under
`docs/tasks/`.

### AI7 and the August 6 live failure — read this before smoking Part B

With the four Render env vars finally set, adding the custom connector in Claude
died at `https://claude.ai/api/mcp/auth_callback?error=invalid_scope`, surfaced
to the user as the misleading `state: Field required` (Claude's callback
validating `state` on an ERROR redirect, which by definition carries none).
**Cause: WorkOS AuthKit advertises a FIXED scope vocabulary** —
`["email","offline_access","openid","profile"]` — with no dashboard affordance
for a custom one, while our protected-resource metadata advertised
`scopes_supported: ["training:read"]`. Claude dutifully requested it; AuthKit
refused. AI7 removes the scope as a protocol assertion and as an access control.

**Not a security relaxation.** Audience validation
(`tokenVerifier.js:49-52`), the `sub`-to-user mapping, the consent kill switch,
the entitlement flag, and four read-only tools that accept no user identifier
are all untouched. `CONNECTOR_SCOPE` survives as a local descriptor on the
`AiConsent` audit row. The scope was a fourth belt the authorization server has
no buckle for.

**The durable lesson, worth more than the fix.** `ai-layer.md:285` asserted "the
scopes are ours" — TRUE under Path 2 (in-house authorization server), FALSE
under Path 1 (the vendor), and it was carried across the pivot as though it
survived. AI1 hardcoded it, AI2 enforced it, nothing re-derived it against what
WorkOS can actually issue. **And no evidence in this wave could have caught it:**
the lanes never load a route, and the wave's strongest evidence — the live 26/26
run — went through AI2's swappable verifier seam with ordinary LogChamp tokens,
which never consults AuthKit's scope vocabulary at all. **A verification seam
that stands in for the vendor cannot test the vendor's constraints.**

**AI7 proves the cause is removed; it does NOT prove the handshake completes.**
Every lane is pure-function. Treat a successful Part B smoke as the first real
evidence, not a confirmation.

### The three AI2/AI3 findings — one FIXED, two still open

1. **~~Connector rate limiter cannot key on connector identity~~ — FIXED by AI6
   `c1398a8`.** Three limiters now: pre-auth failure ceiling (IP-keyed,
   `skipSuccessfulRequests`), per-identity budget mounted AFTER `connectorAuth`,
   separate instance for `/ai`. **Residual for the gate:** no lane can prove the
   wiring, only the key functions — closing it needs a live two-identity check
   of the `RateLimit-*` headers.
2. **`zod` and `jose` are ESM-only on an UNPINNED Node.** `zod` 4.4.3 is
   `"type": "module"` and is **completely undeclared in `package.json`** — a
   phantom transitive of the MCP SDK that `mcpServer.js` requires at boot. AI3
   deploying PROVES Render's Node is >= 22.12, so this is not currently broken.
   But there is no `engines` field, `.nvmrc`, or `.node-version` anywhere, so a
   Render default change silently reintroduces a total-outage boot failure. Two
   cheap fixes, both Seth's call (gate item 5, touches `package.json`): pin Node,
   declare `zod`.
3. **`sub`-to-user mapping is still the highest-severity unverified line in the
   wave** and needs a real WorkOS token. See `workos-staging-handoff.md` section
   7. It FAILS CLOSED (LogChamp ids are `cuid()`, WorkOS ids are `user_`-
   prefixed, so no collision; a miss yields a dead connector, not cross-user
   data), but must be confirmed. No test that mocks WorkOS into agreeing with
   you counts as verification.

**The design decision most easily re-broken later: the MCP spec moved to
`2026-07-28` and we are deliberately NOT targeting it.** That revision changes
the transport incompatibly, and Anthropic's connector docs still list support
only through `2025-11-25` — building to the newest spec yields a server today's
Claude cannot talk to. Dated decision, not oversight. `ai-layer.md` **section
4.0 "CORRECTIONS"** holds the six recon findings authoritatively; where it and
the older prose disagree, 4.0 wins.

**Two units are cross-user isolation surfaces** — AI2's Bearer guard and AI4's
token verification — and are standing frontier-seat escalations regardless of
who writes them.

**DO NOT READ A GREEN LANE AS COVERAGE OF AN ENDPOINT THIS WAVE.**
`npm run test:unit` matches only `test/analytics/**` and `test/lib/**` and never
loads a route, controller, or middleware; the integration lane needs
`server/.env`, which no lane worktree has.

### CONSOLIDATED WAVE SMOKE — Seth, on the staging Vercel deploy

`origin/ai-connector-wave` is at `d925bd2`; confirm the Vercel staging deploy
has built that SHA before starting. Both parts are live — the four Render env
vars are set.

**Part A — the user-facing surface (AI1 + AI5), quick regression:**

- **Profile -> AI access exists and is reachable** (not gated behind
  `isProdEnv()`, so it is on staging).
- **Before consent, only the consent statement and the toggle show** — no
  connector address, no setup steps. That gating is the AI5 contract.
- **Turn AI access ON** → the connection section appears: "Connect your AI
  assistant", the address, four Claude steps, the tier note.
- **The address reads `https://workout-db-staging.onrender.com/mcp`** — staging,
  not prod, not `localhost`, not a bare `/mcp`. Wrong ⇒ `VITE_API_URL` on Vercel
  is wrong.
- **Copy address works.** Known cosmetic residual: "Copied" appears TWICE (button
  label flips AND a success line renders), and the button keeps reading "Copied"
  until re-render. Both block-specified — say if you want one dropped.
- **Read the copy as a user, not a reviewer** (the E3 lesson): does the tier note
  read honest rather than discouraging? Is four steps enough to actually do it?
- **Turn AI access OFF** → the connection section disappears.
- **Regression check, because AI6 touched `app.js`:** log out and back in, load
  Analytics, start and finish a workout.
- **What's New does NOT appear on staging** — prod-gated by design.

**Part B — the real connector. THIS IS THE PASS THAT MATTERS:**

- Add the address in Claude -> Settings -> Connectors -> Add custom connector.
- **You should get past `invalid_scope` this time** — that is what AI7 fixed. You
  should be redirected to LogChamp to sign in, then come straight back.
- **If it fails again, capture the exact callback URL and its `error=` value
  before anything else.** August 6's real error was only visible there; Claude's
  surfaced message (`state: Field required`) was misleading and would have sent
  a debugger down the wrong path entirely.
- Ask Claude "how has my bench press moved this month?" and confirm the numbers
  match the Analytics page — the deterministic engine computes them, the model
  only narrates.
- **Turn AI access OFF in LogChamp, then ask Claude again — it must fail.** The
  consent kill-switch, verified live rather than by curl.

**What smoke CANNOT settle, and stays open into the gate:** the `sub`-to-user
mapping (finding 3) and AI6's two-identity `RateLimit-*` header check. Both need
a real WorkOS token in flight; a successful Part B is what makes them checkable.

### The wave's other strongest evidence — the live 26/26 run, August 5

Before AI4 closed the window, the whole chain was driven against staging with
real HTTP using two throwaway accounts. **26 checks, 26 passed** — consent
grant/revoke, 403-not-401 for unconsented, `WWW-Authenticate` carrying
`resource_metadata`, revocation closing `/mcp` on the next request, `initialize`
negotiating `2025-11-25`, exactly four tools none taking a user id, a second
account seeing only its own world, and statelessness holding across separate
HTTP requests. Detail in QUEUE.md. That window is closed (AI4's verifier rejects
ordinary LogChamp tokens); Part B is its successor.

---

## Prior waves — CLOSED, detail archived

- **F-wave** (effort MANDATORY) — merged `8541bca..59e27dc`. The gate finding,
  seed-invariant, and authoring lesson are in the archive; read before touching
  effort seeding.
- **E-wave** — merged `7d1c9ba..d272930`. One note still live: the "two sets of
  10" sentence ships in FOUR hand-varied forms (E2's nudge, E3's
  `HOW_EFFORT_MATTERS`, E4's `EFFORT_RATIONALE_SHORT`, F2's
  `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`). Not a defect alone; consolidating them
  into one shared module is a known follow-up that should absorb F2's
  page-to-page import at the same time.
- MW-wave, NT-wave, A-wave, FP-wave all merged and closed.

### PROD smoke — Seth, on production, one combined pass (still open)

Covers the F-wave AND the still-open E-wave prod smoke. Staging passed August 4.

- **Login still works.** F0 added six selects to `sessionController`.
- Start a workout from a template with RIR on → the RIR field appears untouched.
- Log a set with effort → the signal control locks and says why; Finish enables
  once every core-logged set has a value. **Enter RIR 0 and confirm it counts as
  filled** — the highest-value case in the vocabulary.
- Open an OLD completed session → nothing demanded retroactively.
- E-wave leftovers: the Analytics effort rationale line renders, legacy nudge
  reads correctly.

## Repo / deploy state

- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. One command
  settles it: `curl -s -o /dev/null -w "%{http_code}" https://<host>/ai/consent`
  returns **401** if the host serves the wave branch and **404** if it serves
  `main`.
- **A staging Render DEPLOY is also a staging MIGRATION.** `server/package.json`'s
  `render-build` is `prisma generate && prisma migrate deploy` — that is how the
  `AiConsent` migration got applied on August 4 without anyone running it. Check
  prod Render's build command before assuming prod behaves differently.
- **`main` is at `59e27dc`** — the F-wave merge, August 4. **Prod Render
  `workout-db-l3gc` is back on `main`**; prod Vercel tracks `main`. Any push to
  `main` is a prod-bound push (gate 2). **Prod smoke still open.**
- **Staging Render `workout-db-staging` tracks `ai-connector-wave`**, so pushes
  auto-deploy the connector surface. **RUNBOOK step 7 is NOT a no-op:** repoint
  staging back to `main` after the merge.
- **`ai-connector-wave` is at `d925bd2`** — seven units plus audit records, all
  pushed.
- **`effort-mandatory-wave` and `effort-wave` are MERGED and closed** — all their
  CODE is on `main`, but each sits one or two DOCS-ONLY commits ahead (post-merge
  HANDOFF upkeep, written after the merge so it cannot be part of it).
  **Therefore NOT safe deletion candidates** — deleting them drops those commits.
  Prior waves resolved this by landing the post-merge HANDOFF commit on `main`
  (`f2be093`, `869c5f1`); that is a docs-only prod-bound push needing Seth's
  say-so. Until then, leave them alone.
- FP8 (PWA icons) is the only open FP unit — DRAFT, blocked on Seth dropping icon
  PNGs into `claudefiledrop/`. Icons LAST by his rider.

### Lane worktree state

**Lane 1 (`C:\dev\worktrees\cursor-lane`) is CLEAN** — on `cursor/ai7` at
`d925bd2`, AI7's landed `DELIVERY.md` deleted at landing. Lanes 2 and 3 are FREE
but still on `recon/air2` / `recon/air3` off `53235c7` — **repoint them off the
target wave branch before use or the delivery lands on the wrong base.** Check
lane cleanliness by DELIVERY.md TIMESTAMP, not `git status` (it is gitignored, so
a stale report reads as "clean").

## Other open items

**Seth items:** the R6 tagline pick (one-line `AuthLayout.jsx` swap); FP8 icon
PNGs; the Cursor model-routing question; the `docs/parked/*` ruling.

### Workflow modernisation backlog — OPEN, agreed August 5, none started

Do them one at a time between waves, never mid-wave:

1. **Rules -> tooling.** Fold `land-unit` section 2's three "things a green build
   cannot catch" into a runnable `scripts/audit-seams.mjs` (unresolved
   `var(--...)` names; identifiers removed but still referenced; server response
   shape vs client destructure). `check-hex.mjs` is the precedent — a check that
   RUNS beats a check the reviewer must remember. **AI7 just made the case
   again:** its dangling-`CONNECTOR_SCOPE` sweep was caught only because the
   reviewer remembered to widen a grep the acceptance criteria scoped too narrow.
2. **Structured `DELIVERY.md`.** Fixed schema per acceptance criterion (criterion
   -> command -> verbatim output) instead of free prose. Cheap Cursor rungs fill
   a schema more reliably than they write prose. Template in
   `docs/tasks/cursor-task-block-template.md`.
3. **Preferences -> auto-memory.** `land-unit` carries Seth's standing asks
   (smoke-on-Vercel, the n/N line, keep-the-report-brief) with dates. Those are
   user preference, not ritual; the repo contract stays in AGENTS.md because
   Cursor reads it.
4. **Trim provenance out of hot paths.** CLAUDE.md's seat history and the dated
   "backported here July 28" notes are archive material in files loaded every
   session. *A `/doctor` pass scoped this to EXACT line-level cuts (~750 est.
   tokens/session saved); that scoping is in `docs/HANDOFF-ARCHIVE.md` — read it
   before doing this item, it also records what must NOT be cut.*

Also agreed in principle, not decided: relaxing gate item 5 so `devDependencies`
installs are hands-off while new RUNTIME deps still ask. Seth's call.

**PARKED by Seth — the block builder.** "don't do anything with the block builder
for now, that's for another wave." Evidence in
`docs/specs/block-execution-gap.md` (`267271c`): the multi-week layer is fully
authored in schema + API + builder UI but CANNOT BE TRAINED. **Do NOT author
against it, and do NOT ask him about it again** — he already ruled. It also
records that Execution reads planned values LIVE from `TemplateSet` rather than
snapshotting, so editing a template retroactively changes what past sessions are
judged against.

**Spec'd, unauthored:** R9/per-side in `docs/specs/strength-score-per-side.md`
(SS1-SS3); gym context in `docs/specs/gym-context.md` (G1 is migration-carrying =
Seth's manual track). Evidence base for FP units stays
`docs/tasks/fp0-frontier-parity-report-FINDINGS.md` (`137e0ea`).

**The AI layer — settled, not to be re-litigated.** `docs/specs/ai-layer.md` is
the design of record (Lane A connector first; Lane B the in-app coach, still
unauthored, BYO-key and hosted over ONE code path). `docs/specs/ai-theming.md` —
AI-generated palettes emit a ~20-hex token object, **never CSS**; spec only.
`analytics-engine.md` section 8 is AMENDED, not contradicted; Track C now means
`ai-layer.md`. Two premises permanently closed: `.mil`/DoD credentials are out
(5 CFR 2635.704) and consumer-subscription OAuth in third-party apps is a ToS
violation, not merely unavailable. **Correction on record** (`ai-theming.md`
section 4): `check-hex.mjs` CANNOT gate AI-generated palettes — it scans a git
diff (`check-hex.mjs:23`), so runtime output never reaches it; a separate pure
validator is specified.

**Loose ends:** CW3 visual sign-off on the next live watcher run. Finding **F**
stays open ("Failed to fetch" = Render cold-start ranked cause; needs a live
Network-tab repro). A-wave optional Step-7 backfill:
`node scripts/backfill-exercise-ids.mjs` (DRY-RUN first) then `--apply` against
prod — idempotent, safe to defer. T3C sprite loader unblocks when Seth drops the
Gemini frames in `claudefiledrop/`. T4 motion (last unstarted U5 unit) needs a
frontier-seat design pass.

**Analytics/catalog track.** Track B v1 (B1-B9) MERGED (`e9ce82c`), Track A
MERGED (`13a1e59`), prod migrated + seeded. Residual: (1) validator surfaced 29
secondary-less compounds in the 675-exercise lifting subset — curation-skim
candidate (A3), pairs with the catalog/`searchCatalog` review pass; (2)
integration test step-6 output (malformed-key seed behavior) still UNVIEWED.

**Issues to open:** connect-pg-simple `session` table drift (proposed `@@ignore`);
integration-suite isolation on shared staging (Neon copy-on-write branches would
kill the FK-pollution flake); user-defined exercise support; favicon/PWA icon
swap; migration automation vs manual discipline; schema sentinel
(`docs/specs/schema-sentinel.md`); **repo lives inside OneDrive** (already caused
a `git stash` hang — decision for Seth: move to `C:\dev\workout-db` or exclude
from sync; everything is pushed, so the move is low-risk).

**Known tech debt (queued, not blocking):** `DraftSessionSetRow` /
`SessionSetRow` unification; Prisma 6->7 bump; Jest open handle; pg SSL
deprecation. Also parked: `round-7-unify-set-row` (`f6c2a6f`), decision pending.

## Durable gotchas

- **A killed run can leave COMPLETE work with ZERO evidence — check the lane
  before re-running from scratch.** August 6's AI7 run wrote every line of the
  implementation and died before running a lane or writing `DELIVERY.md`. The
  salvage cost one cheap re-dispatch instead of a full re-run.
- **Back the lane up BEFORE a salvage re-dispatch.** Copy the diff out
  (`git diff > <scratchpad>/<unit>-backup.patch`) before pointing any agent at a
  dirty tree. It makes the agent's "I changed nothing" a checkable claim
  (`Get-FileHash` both diffs) instead of a trust exercise, and it means a run
  that ignores instructions cannot destroy the work.
- **A salvage delivery needs a HARDER audit, not a softer one.** A second run
  inheriting a diff has every incentive to bless what it finds — its cheapest
  path to a green report is declaring the tree good. Treat its report as evidence
  of the LANES only; read correctness in-seat.
- **If HANDOFF looks stale, QUEUE.md is the file that is current.** `land-unit`
  writes QUEUE per unit; HANDOFF is rewritten per session — and a session that
  ends by dying writes neither, so the gap is exactly where the surprise lives.
- **A verification seam that stands in for a vendor cannot test the vendor's
  constraints.** AI2's swappable verifier made early verification possible AND
  made the `invalid_scope` class of defect invisible for three units.
- **Acceptance criteria can scope a grep too narrowly.** AI7's criterion swept
  `server/src` while the deleted export was imported from `server/test`. Sweep
  the whole worktree for a removed identifier.
- **Two agents, one working tree:** check `git status --untracked-files=all`
  immediately before every commit (untracked DIRECTORIES collapse to one line),
  let writes settle, one agent commits at a time. Lane worktrees sidestep this.
- **Windows env/PATH staleness:** a session may not see User env-var/PATH changes
  even after a restart — read from the registry inline
  (`[Environment]::GetEnvironmentVariable('CURSOR_API_KEY','User')`) and invoke
  new CLIs by full path.
- **Cursor CLI remembers the last-used `--model`** — always pass it explicitly.
- Cursor's agent binaries run as `node.exe` under `cursor-agent\versions\` — a
  `ProcessName -like "*cursor*"` filter returns 0 and looks like "the run died."
  Match on the PATH instead.
- **`DELIVERY.md` is gitignored** — check lane cleanliness by TIMESTAMP, not by
  `git status`.
- **A deployed service's branch is a CLAIM until you probe it.** August 4: three
  pushes went to prod believing a stale topology note. A 401-vs-404 diff on one
  route across two hosts costs one command.
- **An ESM-only package in a CommonJS server is a BOOT risk, not a feature risk.**
  `zod` and `jose` are both `"type": "module"`; `require()` works only on Node >=
  22.12, and nothing pins Node. If it breaks, the API does not start at all. Also
  watch for PHANTOM dependencies — `zod` is `require`d by `mcpServer.js` but
  appears nowhere in `package.json`.
- **A green lane proves nothing about a server route this wave.** Run
  `node -e "require('./src/app.js')"` to at least prove the module graph loads,
  and prefer a live `curl` against staging over any assertion.
- **E-wave and F-wave gotchas** (discoverability vs acceptance criteria, the
  CSS-grid child reflow, prop-ABSENCE seams, duplicate state copy, the `rir = 0`
  blank-vs-truthiness trap, `startSession` creating zero `WorkoutSet` rows) are
  in `docs/HANDOFF-ARCHIVE.md`. Read before touching effort or template seeding —
  the `rir = 0` one is still live in the code.
- Scene mock PNGs are design references — `docs/design/mocks/`, never ship from
  `client/src/`.
- A commit can land locally while a redeploy rebuilds the OLD HEAD until the push
  lands. Push, confirm origin HEAD, THEN smoke.
- Build-passing + diff-looking-right do NOT prove the visual — smoke on device.
- When bumping a value produces near-zero visible change, something is
  suppressing it. Diagnose, don't tune.
- Migrations are a separate manual track — pushing code does not migrate any DB,
  EXCEPT where a Render build command runs `migrate deploy` (see above).
- `server/.env` only ever points at staging or localhost, never prod.
  `dbHostGuard` enforces it at boot (`assertSafeForBoot()`) and on the test/reset
  path (`assertSafeForReset()`, called explicitly by any new DB-connecting script
  at the top of `main()`).
- `npm run test:unit` is DB-free; `npm test` requires (and resets) the staging DB.

**Rule:** rewritten in place at the end of every working session; kept CAPPED
(~300 lines). Aged session logs move VERBATIM — never summarized — to
`docs/HANDOFF-ARCHIVE.md`, newest first, in the same rewrite. Dated, never
versioned. If this file looks stale (date > ~2 weeks old), verify branch/deploy
state from ground truth before trusting it.
