# Autonomous Cursor dispatch (relay v5 proposal)

**Status: PROPOSED** - blocked on the one-time setup checklist (bottom)
and the pricing probe. Nothing in the relay changes until Seth runs
setup and the probe validates the cost model. Authored July 13, 2026
(Fable session, Seth's go-ahead on the brainstormed design).

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
A: cloud agent, named model     (usage-based credit)
B: CLI, named model             (plan included credit)
B: CLI, auto                    (included at no extra cost on Pro)
STOP: page Seth                 (auth broken / all rungs refused)
```

Descend when: pre-dispatch health check fails (no CURSOR_API_KEY / API
unreachable); POST /v1/agents returns a quota or payment error (402/429
family); a run terminates ERROR with a quota message; the CLI exits
with an auth/quota error. Mid-unit death is safe: blocks are
self-contained contracts, so the unit re-dispatches from scratch on the
next rung. Composer-delivered NT2 ("Cursor out of Opus tokens") is the
manual prototype of exactly this descent.

Routing defaults until the probe says otherwise: MODEL `auto` blocks ->
Channel B auto rung directly (free); judgment-tier blocks (`opus` etc.)
-> Channel A. The block's MODEL header stays the single cost lever.

## The relay loop (what makes it autonomous, not just scriptable)

A Sonnet Claude Code session runs the loop (Fable stays withheld per
the standing rule). Per tick:

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

## One-time setup (Seth, ~10 minutes)

1. Mint an API key: cursor.com/dashboard -> API Keys. Set it
   user-level: `[Environment]::SetEnvironmentVariable('CURSOR_API_KEY',
   '<key>', 'User')`. (This does not conflict with the NEVER-set
   ANTHROPIC_API_KEY rule - that rule is about Claude Code's own auth
   billing; Cursor's key is how its API authenticates at all.) Never
   commit it anywhere.
2. Install the Cursor CLI (cursor.com/docs/cli, Windows stable) and run
   `agent login` once - or rely on CURSOR_API_KEY in CI mode.
3. Confirm `C:\dev\worktrees\` exists (n5 already used it).
4. Say the word and Claude Code runs the pricing probe (below).

## Pricing probe (ready to run once the key exists)

1. `POST /v1/agents` with a read-only prompt ("open docs/tasks/README.md
   and reply with its first heading; change nothing"), `autoCreatePR:
   false`, cheapest named model.
2. On FINISHED: `GET /v1/agents/{id}/usage` + eyeball the dashboard's
   usage page. That number, extrapolated to an NT2-sized unit, decides
   whether Channel A is the backbone or the exception.
3. Same probe through the CLI auto rung to confirm the "included at no
   extra cost" claim.

## Risks / open items

- Cloud-agent credit burn unknown until the probe runs (the single
  blocking unknown; the whole routing default flips on it).
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
