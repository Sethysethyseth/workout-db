# HANDOFF — current state

> **WHERE WE ARE (Sept 27):** the AI wave is **MERGED and LIVE on prod** -
> `main` fast-forwarded `59e27dc..bdad1c1` (66 commits) on Sept 26, deploy
> confirmed live by Seth, RUNBOOK 10d checks 1-4 pass on prod. Seth found **two
> prod issues** right after the merge, so the next unit of work is a **quick
> PATCH to `main`**: **P-A** the Claude connector will not connect on prod -
> DIAGNOSED as a WorkOS CONFIG error, most likely no code at all; **P-B** the
> hosted coach works but is SLOW - known causes, a small code unit (CP2).
> **Patch wave, N = 3, landing on `ai-connector-wave` (Sept 27):** CP2 coach
> latency LANDED `b9dd0ae` (1/3); CQ1 weekly coach cap DISPATCHED, lane 1 (7 per
> rolling week, owner exempt via `COACH_UNCAPPED_EMAILS`); WD1 discard-a-workout
> X (with a `reopenedAt` marker so a reopened finished workout can never be
> discarded). CQ1 and WD1 each carry a MIGRATION - each landing push to
> `ai-connector-wave` migrates staging, so it waits for "migrate staging";
> prod needs both applied by Seth before the merge. Ledger: `docs/tasks/QUEUE.md`.

**Next action (human):** fix the prod WorkOS External Sign-in URI (P-A step 1)
and retry the connector from Claude with the PROD address, and check whether
prod Render's instance type spins down when idle (decides a CP3, see QUEUE CP2
notes).

## ▶ PICK UP HERE - the post-merge patch

> **Agent reading this:** research is DONE (Opus, Sept 27, read-only) - do not
> redo it. P-A is Seth's dashboard step first; only if it still fails after
> that does it become a diagnosis block. P-B = CP2, AUTHORED Sept 27 (Opus);
> the block supersedes the "CP2 block shape" notes below. Land it with
> `land-unit` from `cursor-lane-2`.

### Patch-wave smoke items (carried forward - handed over ONCE at wave end)

- **CP2 (`b9dd0ae`):** on staging, ask the coach two questions in a row - the
  second should answer in a few seconds (the first after a deploy still pays
  one slow probe, by design). Staging Render logs: one `[coach] cursor mode=
  inline agentRuns=... ttft_ms=... total_ms=...` line per question, and NO
  "Ripgrep path not configured" stack traces. Palette studio still generates
  a valid palette.

### P-A. The connector will not connect on prod (AI access ON) - CONFIG

**Evidence (read directly Sept 27, not delegated):**

- **WorkOS Production -> Connect -> Configuration:** DCR Enabled, CIMD Enabled,
  resource indicator `https://workout-db-l3gc.onrender.com/mcp` (Default) -
  all correct. **External Sign-in URI = `https://workout-db-psi.vercel.app/` -
  the site ROOT, missing `/connector/login`.** Staging's reads
  `<preview host>/connector/login` and works.
- **Mechanism:** AuthKit hands the user to the sign-in URI with
  `?external_auth_id=`. Only `client/src/pages/ConnectorLoginPage.jsx:14`
  reads that parameter; at `/` the Home page ignores it, the completion call
  never fires, the 300 s handshake expires and Claude reports it cannot
  connect. Same class as the Aug 8 AI8 failure (wrong sign-in URI).
- **Everything else on the path checked GREEN:** prod `/ai/consent` 401 (wave
  is deployed); discovery advertises `resource
  https://workout-db-l3gc.onrender.com/mcp` and `authorization_servers
  https://palatable-frog-16.authkit.app`; `/mcp` 401 + `WWW-Authenticate` with
  `resource_metadata`; prod AuthKit metadata serves `registration_endpoint`
  and `client_id_metadata_document_supported: true`; the prod client
  `https://workout-db-psi.vercel.app/connector/login` returns 200 (SPA route);
  prod API CORS allows that origin with credentials.

**Fix, in order:**

1. **Seth, WorkOS dashboard** (agents cannot - the auto-mode classifier
   refused agent writes to prod WorkOS auth config twice on Sept 26):
   Production -> Connect -> Configuration -> Edit external sign-in URI ->
   `https://workout-db-psi.vercel.app/connector/login` (no trailing slash).
2. **In Claude, use the PROD connector address**
   `https://workout-db-l3gc.onrender.com/mcp`. The custom connector Seth added
   for the Sept 26 STAGING smoke points at `workout-db-staging.onrender.com/mcp`
   - confirm which one he is retrying; add a separate prod one (remove and
   re-add if Claude cached a failed registration).
3. **Retry once, AI access ON.** If it still fails: capture the callback URL
   and its `error=` value BEFORE anything else (the Aug 6 lesson), then read
   prod Render logs around the completion call in `server/src/ai/workosClient.js`
   - a WorkOS 401 there means `WORKOS_API_KEY` on `workout-db-l3gc` is not the
   PRODUCTION-environment key (`logchamp_prod`, created Sept 26). Only then
   write a Cursor DIAGNOSIS block.
4. **Once it connects, the ID1 live checks on prod:** "Continue as <email>"
   stop on `/connector/login`; the tool result names the account
   (`boundAccount`); Profile -> AI access -> "Sign out of connected assistants"
   must say **"Signed out of connected assistants."** - "Nothing to sign out"
   means WorkOS does not file our `User.id` as `external_id` (Door A open;
   report it). This check has never passed live anywhere yet.
5. **Unverified:** the prod AuthKit session lifetime (Applications -> the app
   -> Sessions). Staging's was shortened Sept 26; prod's was on Seth's list.

### P-B. The hosted coach is slow on prod - CP2 (code)

Seth, Sept 27: "coach seems to work but its slow". Not yet MEASURED on prod.
Causes, by likely weight:

1. **Two agent runs per question.** `streamCursor`
   (`server/src/coach/cursorProvider.js:343-403`) always tries a run WITH
   `systemPrompt` first. This Cursor account is gated for it, so every request
   pays a full `Agent.create` + `send` + failing `wait()` (`:314-323`) before
   the inline retry (`:382-394`) does the real work. There is NO memo. Fix:
   remember the gate per process - after the first gate error, go straight to
   inline.
2. **Local-agent start-up per attempt:** `sdk.Agent.create` (`:269`) with a
   fresh `mkdtemp` store and cwd (`:99-106`) every time. Item 1 halves this.
3. **Six "Ripgrep path not configured" stack traces per request** - Render log
   flood, some time. The SDK exports `configureRipgrepPath()` (present in
   `@cursor/sdk/dist`). It needs a ripgrep binary path; if that means adding
   `@vscode/ripgrep`, that is **gate item 5 - ask Seth**. Prefer a quieter
   option that adds no package.
4. **Rule out the platform:** check the prod Render instance type (a
   spin-down tier adds a cold start to the first request after idle).

**CP2 block shape (for the author):** FILES TO TOUCH
`server/src/coach/cursorProvider.js` + its unit test; criteria: second and
later requests in a process make ONE agent run, persona still delivered
inline, BYO Anthropic path untouched, and a **mandatory LIVE smoke**
(`scripts/smoke-cursor-coach.mjs`) - the fake SDK encoded a wrong belief once
already (CP1). **Measure before and after:** time to first token and total
time of `POST /coach/ask` (browser Network tab or Render logs). MODEL: auto.
Known and NOT in scope unless Seth says so: the persona riding inside the
user message (weaker separation, no tools so blast radius is text only).

### How the patch reaches `main`

- **The patch lands ON `ai-connector-wave` itself (Opus, Sept 27)** - not a
  new branch. It is `main` plus docs-only HANDOFF commits, `main` stays an
  ancestor, so the merge is a clean fast-forward; and staging already tracks
  it, which saves Seth a Render repoint.
- **Staging Render `workout-db-staging` still tracks `ai-connector-wave`**
  unless Seth has repointed it (post-merge M2, not confirmed done) - confirm
  before the smoke. After the patch merges, point it at `main` (RUNBOOK
  step 7).
- The relay as usual: author -> dispatch -> `land-unit` -> Seth smokes on
  staging -> `pre-main-review` on the small delta -> Seth says "push to main"
  -> temp worktree, one command at a time with approval. No migration, no new
  env vars. P-A needs NO code if step 1 fixes it.
- **Staging connector caveat:** the STAGING External Sign-in URI is pinned to
  the `ai-connector-wave` Vercel PREVIEW host. A patch branch gets a different
  preview host - only matters if a patch touches the connector (CP2 does not).

### Post-merge leftovers

- **M2, Seth:** repoint staging Render back to `main` (after the patch).
- **Prod login: VERIFIED** - Seth logged in and used the coach after the
  merge, so the migration-before-code ordering held.
- **Do NOT check `/coach/status` by opening the API URL in a tab** - the prod
  session cookie is `partitioned` (`server/src/app.js:169-170`), so a
  top-level visit sends no cookie and returns 401 even when signed in. Check
  in-app (Profile -> AI access). RUNBOOK 10d item 4 is annotated.
- **The F/E-wave prod smoke is still open** (section "PROD smoke" below).
- A stale `.git/worktrees/merge-main` admin dir survived the merge cleanup
  (OneDrive lock on delete) - `git worktree prune` clears it.
- **Pre-wave migration drift** found in the Sept 26 prod-vs-staging diff, NOT
  from this wave and not blocking (prod's build never runs `migrate deploy`):
  checksums differ on `20260325143000_block_weeks` and
  `20260707130000_add_exercise_fk_linkage`; staging alone carries a stray
  `20260527120000_add_exercise_catalog` row and a DUPLICATE
  `20260707120000_add_exercise_catalog` row. Reconcile before anyone ever
  points `migrate deploy` at prod.

**Seth's merge calls, Sept 26 (settled):** privacy page + ToS
(`ai-layer.md` section 6) = the FIRST unit of the next wave; What's New
`2026-08-ai-assistant` shipped as is, connector only (it fired for every prod
user on the merge deploy); CR2 polish skipped (shipped at 7.5); `zod` declared
(`bdad1c1`, road #14 closed).

> **Standing rule:** the Next action line is filled on EVERY rewrite and is
> never empty or deferred - one sentence, the single thing SETH does
> next (not the agent). If nothing is blocked on him, it says so
> explicitly. Dogfoods the shell repo's decision-10 no-dangling-next-
> action requirement; `land-unit` section 5 keeps it maintained.

**Updated:** September 27, 2026, fifty-first session (Opus, frontier - **the
merge**). Across Sept 26-27: Seth made the four merge calls (C1-C4); `zod`
declared, unit lane 324/324, frontier check of that post-gate delta clean
(`bdad1c1`); Seth ran the prod migration by hand (checksum matches staging),
set the prod Render env, turned on Cursor Privacy Mode, shortened the staging
AuthKit session, and unlocked WorkOS Production (billing); the agent enabled
DCR + CIMD there and read the prod issuer; **"push to main" -> merged
`59e27dc..bdad1c1`**, five commands each approved, `origin/main` confirmed;
RUNBOOK 10d 1-4 passed on prod. Seth then reported P-A and P-B; both
researched read-only (above). The pre-merge sections - PICK UP HERE
checklist, gate verdict, ROAD TO MAIN, the AI-wave unit tables, carry-forward,
CR2 note, consolidated smoke, repo and lane state - moved VERBATIM to the
archive. Prior: September 26, fiftieth session (Opus - CP1 salvage + ID1
landed, smoke + SF1, the pre-main gate PASS WITH FIXES). Older sessions
archived.

### Still governing from the AI wave (full record in the archive)

- **Units on `main`:** AI1-AI9 (the connector, `83d82c8`..`43a4ceb`), Lane B
  (`8455059`..`932fa25` - coach, palette studio, Sept 9 redesign, critic
  rounds 1-2), AI10 `ce51242`, ID1 `ebf7b80`, CP1 `8ab7dcf`, SF1 `ab35aca`,
  gate fix `d49d253`, zod `bdad1c1`. Per-unit audits: `docs/tasks/QUEUE.md`.
- **CR2 is still the live UI work order** -
  `docs/tasks/cr2-critic-round-2-FINDINGS.md` (7.5/10). Author any UI polish
  block FROM it, never from memory; CR0/CR1 are superseded.
- **The in-app coach is not discoverable** (Seth, deferred): the panel sits
  under the Analytics stat tiles and on finished workouts; no obvious way to
  chat.
- **Gate follow-ups, not blockers:** show the requesting client's name on the
  connect confirm step if WorkOS exposes it; ID1's `revokeConsent` makes a
  LIVE WorkOS call wherever `WORKOS_API_KEY` is set - including the
  integration lane if `server/.env` carries it.
- **`external_auth_id` TTL is 300 seconds** - a slow password screen can
  expire a handshake; the confirm step says so on the page.
- **MCP revision `2026-07-28` is deliberately NOT targeted** (incompatible
  transport change); `ai-layer.md` section 4.0 "CORRECTIONS" is authoritative.
- **Cross-user isolation surfaces** (AI2's Bearer guard, AI4's token
  verification, ID1's signout) are standing frontier-seat escalations.
- **DO NOT READ A GREEN UNIT LANE AS COVERAGE OF AN ENDPOINT** - it matches
  only `test/analytics/**` and `test/lib/**`; prove a route live.

## Prior waves - CLOSED, detail archived

- **AI wave** (the connector, in-app coach, palette studio, Sept 9 redesign) -
  merged `59e27dc..bdad1c1` Sept 26. Gate verdict, road to main, smoke
  checklists and unit tables archived Sept 27.
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

- **`main` is at `bdad1c1`** - the AI-wave merge, Sept 26 (ff from
  `59e27dc`). **Prod Render `workout-db-l3gc`** and **prod Vercel
  `https://workout-db-psi.vercel.app`** are on `main`, deploy live. Any push to
  `main` is a prod-bound push (gate 2).
- **`ai-connector-wave` = `main` + docs-only HANDOFF commits.** Staging Render
  `workout-db-staging` still tracks it (repoint pending, see M2).
- **Prod DB:** `20260804180000_add_ai_consent` hand-applied by Seth Sept 26
  (RUNBOOK 10a V2 SQL), checksum identical to staging. Prod's build command is
  `npm install && npx prisma generate` - it never migrates.
- **Prod env on `workout-db-l3gc` (Seth, Sept 26):** `MCP_RESOURCE_URL`
  `https://workout-db-l3gc.onrender.com/mcp`, `MCP_AUTHORIZATION_SERVER`
  `https://palatable-frog-16.authkit.app`, `WORKOS_API_KEY` (the Production
  key `logchamp_prod`), `COACH_PROVIDER=cursor`, `COACH_API_KEY` (a Cursor key,
  Privacy Mode ON). `COACH_MODEL` and `NODE_VERSION` unset (`engines` pins
  Node 22.x).
- **WorkOS:** project "Cool's Project". **Production** unlocked Sept 26
  (billing on file; AuthKit free to 1M MAU), AuthKit domain
  `palatable-frog-16.authkit.app`, config per P-A above. **Staging** AuthKit
  `scientific-mist-64-staging.authkit.app`, External Sign-in URI on the
  `ai-connector-wave` PREVIEW host, session lifetime shortened Sept 26.
- **VERIFY DEPLOY TOPOLOGY FROM THE SERVICES, NOT FROM THIS LIST.** The August 4
  incident (archived) happened because these lines were trusted. A GET of
  `/ai/consent` returns **401** on a host serving the AI wave, **404** on one
  that predates it.
- **A staging Render DEPLOY is also a staging MIGRATION** (`render-build` runs
  `prisma migrate deploy`). Prod's build does not.
- **`effort-mandatory-wave` and `effort-wave` are MERGED and closed** - all their
  CODE is on `main`, but each sits one or two DOCS-ONLY commits ahead (post-merge
  HANDOFF upkeep). **Therefore NOT safe deletion candidates.** Prior waves
  resolved this by landing the post-merge HANDOFF commit on `main` (`f2be093`,
  `869c5f1`) - a docs-only prod-bound push needing Seth's say-so.
  `ai-connector-wave` is in the same state now.
- FP8 (PWA icons) is the only open FP unit - DRAFT, blocked on Seth dropping icon
  PNGs into `claudefiledrop/`. Icons LAST by his rider. `4255782` put ~1.7 MB of
  PNGs under `claudefiledrop/` onto the branch - they rode into `main`.
- **Main-tree `node_modules` is CURRENT** (Sept 26: the `zod` install also
  pulled in `express-rate-limit` and `@cursor/sdk`; unit lane 324/324 there).

### Lane worktree state

**All three lanes are FREE but NOT on a usable base (Sept 27):** `cursor-lane`
on `recon/gate-r3`, `cursor-lane-2` on `recon/gate-r1`, `cursor-lane-3` on
`recon/gate-r2`, all at `ecb672c`, each holding ONE untracked Sept 26 gate
report (`GATE-R3.md` / `GATE-R1.md` / `GATE-R2.md`) and no `DELIVERY.md`. **Repoint a lane
onto the patch branch before dispatch or the delivery lands on the wrong
base.** Installs differ: lane 2's `server` has its own full install WITH
`@cursor/sdk` (the gate ran its fresh lanes there - use it for CP2); lane 3's
`server` and `client` `node_modules` are JUNCTIONS into lane 1 (which lacks
the SDK).

**Check lane cleanliness by DELIVERY.md TIMESTAMP, not `git status`** - it is
gitignored, so a stale report reads as "clean". Prefer a DISTINCT report
filename per lane run (`RECON-R1.md` / `RECON-R2.md`) so a stale file cannot
impersonate a fresh one at all.

**Lane `node_modules` drift is real.** When a lane's failures are
`Cannot find module`, suspect the environment before the code, and verify in a
lane known to be current.

## Other open items

**Seth items:** P-A's dashboard steps and the CP2 go-ahead (top of this file); the R6 tagline pick
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

- **The WorkOS External Sign-in URI must be the FULL `/connector/login` path.**
  Anything else (the API host on Aug 8, the bare site root on Sept 26) strands
  the handshake silently - AuthKit redirects, nothing reads `external_auth_id`,
  and the client only says it cannot connect. Read the dashboard value back
  after every environment change.
- **Agents cannot write prod WorkOS auth config** - the auto-mode classifier
  refused it twice on Sept 26, even with Seth's go-ahead. Plan every prod
  identity-provider change as a SETH step with exact values; agents read and
  verify.
- **Opening the prod API in a browser tab proves nothing about auth.** The
  prod session cookie is `partitioned` (`server/src/app.js:169-170`), so a
  top-level visit sends no cookie and every authed route answers 401 while the
  app itself works. Verify authed behaviour in-app.
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
  22.12 - now pinned by `engines` (CP1). Watch for PHANTOM dependencies - `zod`
  was required by `mcpServer.js` for a whole wave before `bdad1c1` declared it.
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
