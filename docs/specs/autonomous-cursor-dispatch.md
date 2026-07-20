# Autonomous Cursor dispatch (relay v5 proposal)

**Status: ADOPTED (July 14, 2026)** - setup complete, probe complete,
and NT3 landed clean (`98963f6`) as the first autonomous unit, all the
same day. AGENTS.md/CLAUDE.md now describe relay v5. Probe verdict:
Channel A is unavailable under the overage-OFF billing precondition
(see "Probe results"), so **Channel B is the backbone for ALL blocks**,
not just MODEL-auto ones. Authored July 13, 2026 (Fable session, Seth's
go-ahead on the brainstormed design); probe + trial July 14 (Fable).
Amended July 15, 2026 (Fable, Seth's go-ahead): one RESIDENT Sonnet
session per wave is the stated norm for the relay loop, and Seth's
smoke sign-off is one consolidated checklist at wave end - see "The
relay loop". Amended July 18, 2026 (v5.2, Fable's last session, Seth's
direction): FAN-OUT - multiple Cursor agents in parallel, one per
worktree, and Cursor report lanes now aid the frontier seats' own
work (authoring recon, gate fuel) - see "Fan-out (relay v5.2)".

## What this changes, in one sentence

The manual step "Seth points Cursor at a block" is replaced by Claude
Code dispatching the block itself - via Cursor's Cloud Agents API
(Channel A) or the headless Cursor CLI in a worktree (Channel B) - so
the relay runs Fable-authors -> auto-dispatch -> Cursor-executes ->
Sonnet-lands without Seth in the inner loop.

## What does NOT change

- The command-running gate. Everything here is staging-side. Main
  merges, prod, migrations, destructive ops still ask first.
- One writer for git and state. Claude Code remains the only agent
  committing to wave branches and editing HANDOFF/QUEUE. (Cloud agents
  pushing their own `cursor/<slug>` branch is the already-accepted
  delivery mechanism - NTFIX1 / PR #3 precedent - not a violation; the
  block footer's no-git rule governs the local/worktree lane.)
- `land-unit` stays the audit ritual. Both channels normalize to inputs
  land-unit already handles: a `cursor/` branch + PR (its "Cloud
  branch" mode) or uncommitted changes in a tree (its "local relay"
  mode, pointed at the worktree).
- Escalation triggers. Contract ambiguity, schema/security surfaces,
  and repeated bounces still stop the machine and page a human.
- Block authoring (`author-task-block`) and the pre-main Fable gate.

## Channel A - Cloud Agents API (default for judgment-tier blocks)

Base URL `https://api.cursor.com`, auth `Authorization: Bearer
$env:CURSOR_API_KEY` (key from cursor.com/dashboard -> API Keys).

Dispatch (block must already be COMMITTED AND PUSHED - an unpushed
block is invisible to the cloud):

```
POST /v1/agents
{
  "prompt": { "text": "Read docs/tasks/<unit>.md and execute it exactly. It is the complete task; do not ask for the task in chat. Write the delivery report into the PR body per the block's STOP CONDITION footer." },
  "repos":  [{ "url": "https://github.com/Sethysethyseth/workout-db",
               "startingRef": "<wave-branch>" }],
  "model":  { "id": "<per the block's MODEL header; GET /v1/models for ids>" },
  "autoCreatePR": true
}
```

Response carries `id` + `latestRunId`. Poll:

- `GET /v1/agents/{id}/runs/{runId}` -> `status` is one of CREATING /
  RUNNING / FINISHED / ERROR / CANCELLED / EXPIRED; terminal runs carry
  `result` (final reply) and `git.branches[]` (`{ repoUrl, branch,
  prUrl }`).
- `GET /v1/agents/{id}/usage` -> per-agent token/cost after the run
  (this is the pricing-probe instrument).
- `POST /v1/agents/{id}/runs` -> follow-up run on the same agent: the
  cheap bounce channel (send audit findings as a new prompt instead of
  re-dispatching cold).

On FINISHED: the delivery is a `cursor/<slug>` branch + PR, report in
the PR body -> `land-unit` cloud-branch mode, unchanged.

Cloud constraints (both verified the hard way in the NT-wave):

- The cloud workspace has NO `server/.env` and no `DATABASE_URL` -
  cloud-dispatched blocks may only require the DB-free lanes
  (`test:unit` + client build). That is already the block norm; blocks
  that genuinely need the integration lane go Channel B or local relay.
- Optional tune (open item): a `.cursor/environment.json` with install
  steps would let cloud agents run the lanes without rediscovering
  `npm install` each time.

## Channel B - headless CLI in a worktree (default for MODEL-auto blocks)

The Cursor CLI (`agent`; some installs expose `cursor-agent` - check
with `Get-Command`) runs the same agent non-interactively:

```
agent -p "<same dispatch prompt, but: write the report to DELIVERY.md and make NO git operations>" --force --output-format text
```

Rules of the lane:

- Runs in a dedicated worktree OUTSIDE OneDrive (n5 precedent):
  `git worktree add C:\dev\worktrees\cursor-lane -b cursor/<unit> <wave-branch>`.
  The lane worktree may persist across units to amortize `npm install`
  (worktrees do not carry node_modules); precondition per dispatch:
  `git status` clean in it, then `git checkout -B cursor/<unit>
  <wave-branch>`. Claude Code's main tree is never touched.
- The CLI writes files but does NOT commit (block footer governs, as in
  the local relay). Delivery = uncommitted changes + DELIVERY.md in the
  worktree -> `land-unit` local-relay mode pointed at the worktree;
  Claude Code commits from there and merges to the wave branch.
- Known defect: print mode can hang indefinitely (public bug reports).
  Always run under a hard timeout as a background task; on hang, kill,
  retry once, then descend the ladder or escalate.
- Model: honors the plan's included usage. `--model auto` (or omitted)
  is the effectively-free rung on Pro; named models draw plan credits.

## The fallback ladder (token exhaustion -> seamless descent)

```
A: cloud agent, named model     (usage-based credit ONLY - see below)
B: CLI, named model             (plan included credit)
B: CLI, auto                    (included at no extra cost on Pro)
STOP: page Seth                 (auth broken / all rungs refused)
```

**Probe finding (July 14): rung A is DEAD under the standing billing
precondition.** Cloud agents require usage-based pricing enabled with
>= $2 headroom before they will even accept a dispatch - they never
draw the included Pro pool. With Seth's overage toggle OFF (the agreed
precondition: exhaustion means refusals, never charges), `POST
/v1/agents` returns `400 usage_limit_exceeded` at dispatch time,
before any token spend. Rung A only exists if Seth deliberately
enables usage-based pricing with a spend cap - a billing decision,
not a routing one; do not flip that toggle from an agent seat.

Descend when: pre-dispatch health check fails (no CURSOR_API_KEY / API
unreachable); POST /v1/agents returns a quota or payment error (402/429
family); a run terminates ERROR with a quota message; the CLI exits
with an auth/quota error. Mid-unit death is safe: blocks are
self-contained contracts, so the unit re-dispatches from scratch on the
next rung. Composer-delivered NT2 ("Cursor out of Opus tokens") is the
manual prototype of exactly this descent.

Routing defaults, FLIPPED by the July 14 probe: MODEL `auto` blocks ->
Channel B auto rung directly (free); judgment-tier blocks (`opus` etc.)
-> **Channel B named rung** (plan included credit), NOT Channel A.
Channel A is the exception, used only if Seth has deliberately enabled
capped usage-based pricing for a specific need. The block's MODEL
header stays the single cost lever. Note the B-named rung shares its
pool with Seth's interactive Cursor IDE usage and can be exhausted
mid-cycle (it was on July 14 - "$64 saved on API model usage" refusal,
resets with the billing cycle, currently the 17th) - when refused,
descend to B-auto or hold the unit for the reset per the block's
urgency; don't silently downgrade a block whose MODEL header was a
deliberate quality call without noting it in the QUEUE entry.

## The relay loop (what makes it autonomous, not just scriptable)

A Sonnet Claude Code session runs the loop (Fable stays withheld per
the standing rule). **One RESIDENT session per wave is the norm**
(amended July 15, 2026): the SAME Sonnet session runs every tick -
dispatch, monitor (scheduled wakeups while Cursor executes, never
spinning), land, dispatch-next - from "run the relay" until a stop
condition. Opening a fresh Sonnet session per unit is the degraded
fallback (session crash, hand-relay), not the design. What batches at
wave scale is SETH'S attention (one smoke, one gate), never the
machine checkpoints - per-unit audit, one commit per unit, and
bisectable history are unchanged; do not "extend" this amendment into
batching Cursor execution across units. (v5.2 rider: fan-out
PARALLELIZES execution across disjoint units, which is not batching -
what stays unbatched is the per-unit audit/commit at landing; see
"Fan-out (relay v5.2)".) Skills load fresh at
execution time, so a long resident session still runs the exact
`land-unit`/`dispatch-unit` checklists, not a degraded memory of them.
Per tick:

1. In-flight unit? Poll it (API run status, or the CLI background
   task). Not terminal -> schedule the next wake (~10-15 min for cloud
   runs) and yield.
2. Terminal delivery -> run `land-unit` (mode per channel). Fix / bounce
   / escalate per that skill. Bounce = follow-up run (Channel A) or
   re-dispatch with findings appended (Channel B); TWO bounces on one
   unit = stop, page Seth.
3. Free width remaining (v5.2: 2 default / 3 cap, counting every
   in-flight lane) and QUEUE.md has a QUEUED unit whose serialization
   notes allow it -> dispatch via `dispatch-unit`, flip it DISPATCHED.
4. Stop conditions: queue empty; wave complete (pre-main gate is Fable
   + Seth, never the loop); any land-unit escalation trigger; ladder
   exhausted.

Seth's remaining touchpoints: authoring go-ahead, bug reports, staging
smoke sign-off, and every gate item - exactly the judgment surface.
Smoke sign-off is ONE consolidated checklist per wave: the resident
session carries each landed unit's smoke items forward and hands Seth
the full list at wave end (the NT-wave July 14 sign-off - NTFIX1 + NT3
smoked together against one four-item list - is the precedent), not a
list after every unit.

## One-time setup (Seth, ~10 minutes)

1. Mint an API key: cursor.com/dashboard -> API Keys. Set it
   user-level: `[Environment]::SetEnvironmentVariable('CURSOR_API_KEY',
   '<key>', 'User')`. (This does not conflict with the NEVER-set
   ANTHROPIC_API_KEY rule - that rule is about Claude Code's own auth
   billing; Cursor's key is how its API authenticates at all.) Never
   commit it anywhere.
2. Install the Cursor CLI - on Windows the installer is
   `irm 'https://cursor.com/install?win32=true' | iex` (the docs' curl
   form is Unix-only) - and run `agent login` once, or rely on
   CURSOR_API_KEY in CI mode. Verify with `cursor-agent status`
   (installs to `C:\Users\<user>\AppData\Local\cursor-agent\`; expect
   `agent.ps1`/`cursor-agent.ps1` wrappers, no `.exe`).
3. Confirm `C:\dev\worktrees\` exists (n5 already used it).
4. Say the word and Claude Code runs the pricing probe (below).

Setup was COMPLETED and verified July 14: key in the User registry,
CLI `2026.07.09-a3815c0` responding, `cursor-agent status` -> logged
in as Seth, lane worktree created, overage toggle confirmed OFF.
Known gotcha: a Claude Code session's shell may still not see the
User env var or PATH update even after a session restart (the parent
process chain holds the stale environment) - read the key from the
registry inline (`[Environment]::GetEnvironmentVariable(
'CURSOR_API_KEY','User')`) and invoke the CLI by full path instead of
relying on `$env:` / PATH.

## Pricing probe - RESULTS (run July 14, 2026, Fable session)

The probe as designed (read-only prompt, cheapest named model,
`autoCreatePR: false`) was run against all three rungs. Verdicts:

1. **Channel A: blocked at dispatch, $0 spent.** `POST /v1/agents`
   (valid request shape - see API notes below) returned `400
   usage_limit_exceeded`: "Usage-based pricing required. Background
   Agent requires at least $2 remaining until your hard limit."
   Cloud agents are usage-based-only; the included Pro pool never
   covers them. Under the overage-OFF precondition this rung always
   refuses cleanly at dispatch time. The per-unit token-cost question
   the probe was designed to answer is therefore MOOT until Seth ever
   chooses to enable capped usage-based pricing.
2. **B named (`--model claude-haiku-4-5`): refused this cycle.**
   `ActionRequiredError: You've hit your usage limit... saved $64 on
   API model usage this month with Pro... resets 7/17/2026.` The
   included named-model pool was already exhausted by IDE usage -
   note this contradicts the "33% consumed" dashboard reading from
   July 13; the meter that gates named-model CLI calls is evidently
   the API-model-usage pool, not that one.
3. **B auto: WORKS, free.** Headless `agent -p` print-mode run in the
   lane worktree returned the correct answer (README's first heading),
   no hang, no files changed, no git operations. This is the backbone
   rung.

API shape corrections learned while probing (the original sketch above
was close but not exact): `model` must be an OBJECT `{ "id": "..." }`
(a bare string is rejected); `repos: [{ url, startingRef }]` and
top-level `autoCreatePR` are correct as sketched (`source`/`target`
keys are rejected). `GET /v1/models` works and lists ~33 model ids.

## Fan-out (relay v5.2, July 18, 2026)

Adopted from the same-day receipt in the workflow repo: one frontier
session ran FOUR Cursor agents (three parallel + one serialized), zero
collisions by construction, and the parallel verify lane caught a real
launch blocker "for free" while the content lane worked. Design note
with the full grain: the workflow repo's
`source-material/fan-out-dispatch-2026-07-18.md`. This section is the
LogChamp adoption of that grain.

### Lane classes (the load-bearing distinction)

- **CONTENT lanes** produce repo changes. They parallelize ONLY when
  their FILES TO TOUCH are fully disjoint (including test, CSS, and
  barrel/index files - if in doubt, they collide: serialize), and they
  ALWAYS serialize through the single reviewer at landing. This is the
  existing batching rule, now stated as a lane class.
- **REPORT lanes** produce a report file and touch nothing else. They
  are embarrassingly parallel: zero merge risk, no code-landing
  commit - the "delivery" is reading the report (optionally preserved
  via a docs-only FINDINGS commit, FP0 precedent). Verification sweeps, audits, web
  research, recon passes, and diagnosis blocks are ALL report lanes.
  Report lanes are the cheap on-ramp: when unsure how wide to go,
  fan out report lanes, not content lanes.

### Worktree pool (one agent per worktree, ALWAYS)

The unit of safe parallelism is the worktree, not the file list - this
generalizes the two-agents-one-tree scar to N agents by making it
structurally impossible. `C:\dev\worktrees\cursor-lane` stays the
primary content lane (amortized npm install). Parallel lanes get
`cursor-lane-2`, `cursor-lane-3`, created on demand
(`git worktree add C:\dev\worktrees\cursor-lane-N -b cursor/<slug>
<base>`); report lanes rarely need node_modules, so cold worktrees are
fine there. Per-dispatch preconditions are unchanged and apply PER
worktree: clean tree, `checkout -B`, explicit `--model`, background
task with timeout. A lane holding an unlanded delivery is NOT clean -
skip it, use another (never disturb an in-flight delivery).

Concurrency mechanics (July 18 research lane, sources in its report):
STAGGER launches by a beat - never fire two `agent -p` processes in
the same instant (a staff-confirmed session-init/file-lock race
killed one of two simultaneous starts on 2025-11 builds; reported
fixed since, unverified on the current Windows build). The CLI's
shared `~/.cursor/cli-config.json` persists last-used model state -
explicit `--model` per run fully covers the run itself (never run
flagless; standing rule). If soak use ever shows config clobbering,
the escalation lever is a per-lane `CURSOR_CONFIG_DIR`.

### Many hands, one gate (what fan-out must never change)

- Fan-out multiplies EXECUTORS, never reviewers. Audit, commit, push,
  and state upkeep stay single-file through one Claude Code seat;
  parallel deliveries land ONE AT A TIME through `land-unit`.
- Dispatch width is set by what the reviewing seat can audit while
  it's fresh, not by how many agents can run. Width 2 is the default
  for unattended fan-out; 3 is the hard cap, for babysat sessions
  (the receipt's width). The July 18 research lane's grounding
  (preserved: `fanout-cli-concurrency-research-2026-07-18.md`): no
  official CLI concurrency SLA exists; provider rate limits, print
  hangs, and quota burn compound with width - and the auto pool is
  shared with Seth's interactive IDE use.
- The gate NEVER fans out: no parallel agent touches gate items
  (main merges, prod, migrations). Two-bounce stop applies PER lane.
- Seth's attention still batches: dispatch N, ONE consolidated review
  pass, one smoke checklist. Progress messaging counts LANDINGS, not
  dispatches (a parallel dispatch is announced as one message).

### Where Cursor now aids the frontier seats (the v5.2 extension)

Fan-out is not just wider execution - it moves grunt work OFF the
frontier seats in their own two rituals. **Explicit (July 19, 2026):
the fan-out vehicle is CURSOR agents (report lanes on the cheap rung),
NOT Claude subagents.** A frontier seat that fans its grunt search out
via the Agent tool spends frontier-family tokens on exactly the work
this section exists to move off them - when a ritual (including a
built-in like `/code-review`) says "spawn agents," the LogChamp
reading is: dispatch Cursor report lanes per this section, and keep
only the judgment calls (dedupe, verdicts, the ruling) on the frontier
seat.

- **Authoring support (skeleton design).** Before authoring a wave,
  the frontier seat may dispatch report lanes for the grounding it
  would otherwise grep out itself: repo recon (NOW-state per finding
  with file:line evidence - FP0 is the proven pattern), web/competitor
  research, spec-input sweeps. The frontier seat then authors
  contracts FROM the reports. The judgment - scope calls, contracts,
  trade-offs, rejections - never delegates; only the search does.
- **Gate support (pre-main review).** The gate seat may dispatch
  parallel report lanes as gate fuel while it reads: per-unit
  diff-vs-block coverage reports (each acceptance criterion -> where
  the diff satisfies it), fresh-lanes verification runs, cross-doc
  consistency sweeps. Verify-before-trust governs: reports compress
  SEARCH, never judgment - the gate still spot-checks claims directly
  and owns every verdict, and the ruling itself never fans out.

Session-scoped report lanes (authoring recon, gate fuel) are recorded
in the HANDOFF session log, NOT in QUEUE.md - the queue stays the
roadmap-unit ledger. A report lane that is itself a roadmap unit
(FP0) gets a QUEUE entry like any other.

### Economics

N parallel auto-rung lanes are free and compress wall-clock; the
frontier seat's token cost stays roughly flat (authoring + auditing is
the same work serial or parallel). The real win is frontier-session
utilization: a seat that would idle waiting on one executor authors
the next block - or reads the next report - while three run. Failure
isolation comes free: a hung or quota-dead agent strands only its own
lane; blocks are self-contained, so re-dispatch on another ladder rung
is safe by construction.

### First LogChamp receipt

July 18, 2026 (this amendment's own session): two report lanes ran
concurrently on the auto rung in `cursor-lane-2`/`cursor-lane-3` - a
CLI-concurrency research sweep and a cross-doc consistency audit of
this very amendment - while FP2's unlanded delivery sat untouched in
`cursor-lane`. Results recorded in the HANDOFF session log.

## Risks / open items

- ~~Cloud-agent credit burn unknown~~ RESOLVED July 14: moot - cloud
  agents require usage-based pricing outright, so Channel A is off
  under the standing billing precondition (see "Probe results").
- B-named rung shares the included pool with Seth's IDE usage and can
  be exhausted mid-cycle; the loop must treat a named-model refusal as
  routine ladder descent, not an incident.
- CLI print-mode hang (mitigated: timeout + retry + ladder).
- `.cursor/environment.json` for cloud lane setup - unspecified, tune
  later.
- QUEUE serialization notes are prose; the loop must read them
  conservatively (if in doubt whether units collide, they do -
  serialize). This is deliberate; do not "fix" it with a format change
  without Fable.
- ~~AGENTS.md/CLAUDE.md workflow sections describe relay v4~~ RESOLVED:
  amended to v5 July 14 after NT3 landed clean, and to v5.2 July 18
  (adoption evidence first, doctrine second - held both times).
