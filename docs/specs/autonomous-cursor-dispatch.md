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
relay loop".

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
batching Cursor execution across units. Skills load fresh at
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
3. Nothing in flight and QUEUE.md has a QUEUED unit whose serialization
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
- AGENTS.md/CLAUDE.md workflow sections describe relay v4 - amend to v5
  only AFTER the probe validates and the first autonomous unit lands
  clean (adoption evidence first, doctrine second).
