# CLAUDE.md  (LogChamp - Claude Code specifics)

> All shared agent context - project, stack, conventions, UI architecture,
> the command-running gate, verify-before-trust, durable gotchas - lives in
> AGENTS.md (single source, imported below). This file holds ONLY what is
> specific to Claude/Claude Code. Don't duplicate AGENTS.md content here.
> Current work-state: `docs/HANDOFF.md`. Full stable context (product vision,
> schema rationale, incident history): `WORKOUTDB_MASTER_PROMPT_17.md` - pull
> that in for planning/architecture work, not every turn.

@AGENTS.md

---

## Model selection / division of labor (v3 - Sonnet resident, Fable gated)

Decided July 3, 2026 (token-efficiency rebalance). Three roles:

- **Sonnet in Claude Code = the resident driver.** Runs the day-to-day
  relay: light per-unit review of each Cursor delivery (re-run build +
  test lanes, scope check against FILES TO TOUCH, spot-check acceptance
  criteria - verify-before-trust still applies in full), commits with SHA
  verification, pushes to staging, HANDOFF + QUEUE upkeep, dispatch
  bookkeeping. Sonnet does NOT author task blocks and does NOT settle
  contract ambiguity - it bounces up instead of guessing (escalation
  triggers below).
- **Fable/Opus in Claude Code = the architect + final gate.** Short, rare,
  high-leverage sessions: (a) authors the unit-scale task blocks (the
  skeletons Sonnet/Cursor execute), architecture and planning with the repo
  in hand; (b) ONE thorough review of the accumulated branch diff before
  any merge to main - nothing ships to main without a Fable/Opus pass.
  Standing escalation triggers that pull Fable in mid-wave: schema or
  migration design (A4), security / cross-user isolation surfaces, prod
  incidents, root-cause debugging Sonnet can't close, and any unit where
  Sonnet's review finds the delivery and the spec disagree in a way the
  block doesn't settle.
- **Cursor = the hands.** Executes unit-scale task blocks (Sonnet, or
  cheaper per the block's MODEL header - mechanical units route to auto/
  cheap). Writes code, runs tests, STOPS. Never commits, never edits
  `docs/HANDOFF.md` (see the division-of-labor rule in AGENTS.md).

Accepted trade-off, stated so nobody "fixes" it silently: deep review moves
from per-unit to the single pre-main gate, so a contract bug can now land on
staging and be caught one gate later. Sonnet's per-unit pass is the tripwire
(tests, scope, acceptance strings); the pre-main Fable review is the net.

## Workflow (the relay, v3)

Fable plans / Cursor executes / Sonnet drives and lands. The loop per unit:

1. Fable (Claude Code) emits a **unit-scale task block** (template:
   `cursor-task-block-template.md`, "Unit-scale variant") - one coherent
   roadmap unit with a testable contract, not a 1-3 file slice. Fable
   typically authors a wave of blocks in one session, then drops out.
2. Cursor implements it, gets tests green, stops without committing.
3. Sonnet (Claude Code) runs the per-unit pass: re-runs the test lanes and
   client build, checks scope against the block, spot-checks acceptance
   criteria, fixes trivia or bounces (to Cursor for rework, to Fable for
   ambiguity), commits with SHA verification, pushes to staging, updates
   HANDOFF, dispatches the next block.
4. Before merge to main: Fable/Opus reviews the full accumulated branch
   diff against the specs (the review lane caught a real shipped-contract
   bug on day one - it is not optional ceremony; it has moved gates, not
   disappeared). Merge itself stays behind Seth's "push to main" trigger
   phrase per the gate.

`docs/HANDOFF.md` carries current-state between sessions - all agents read it.

## Claude-Code-specific environment

- NEVER set `ANTHROPIC_API_KEY` - subscription login auth; an env key bills
  per-token silently. (This is about THIS environment's auth - it does not
  forbid the app itself from using its own API key server-side; that's a
  separate, deliberate app-billing choice. See the analytics spec, section 8.)
- `.claude/settings.local.json` is per-machine (gitignored). Destructive ops
  are deliberately NOT allowlisted there - they must always prompt, matching
  gate item 4.
