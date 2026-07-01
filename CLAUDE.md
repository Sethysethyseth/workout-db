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

## Model selection / division of labor (the Fable split)

Two Fable seats, two roles:

- **Fable in Claude Code (this environment) = the brain.** Architecture and
  planning with the repo in hand, unit-scale task-block authoring, diff review
  against the spec after every Cursor unit, root-cause debugging, audits,
  ALL git operations (commit/push/state), HANDOFF upkeep, and the formerly
  Opus-tier escalations (A1 prod migration, A4 FK schema design, Track C
  security). Sessions should be short and high-leverage - drop out when the
  judgment work is done; don't let Fable become resident for mechanical work.
- **Fable in Cursor = the hands.** Executes unit-scale task blocks (whole
  roadmap items, multi-file, token-heavy codegen + tests). Writes code, runs
  tests, STOPS. Never commits, never edits `docs/HANDOFF.md` (see the
  division-of-labor rule in AGENTS.md).
- **Sonnet chat = the cheap lane** for quick conversational questions that
  don't need the repo. Truly mechanical work (rename sweeps, boilerplate)
  doesn't need Fable anywhere - use a cheaper Cursor model.

## Workflow (the relay, v2)

Claude Code plans and reviews / Cursor executes. The loop per unit:

1. Claude Code emits a **unit-scale task block** (template:
   `cursor-task-block-template.md`, "Unit-scale variant") - one coherent
   roadmap unit with a testable contract, not a 1-3 file slice.
2. Cursor (Fable) implements it, gets tests green, stops without committing.
3. Claude Code reviews the working tree against the spec (this lane caught a
   real shipped-contract bug on day one - it is not optional ceremony),
   fixes-or-bounces, commits with SHA verification, updates HANDOFF, emits
   the next block.

`docs/HANDOFF.md` carries current-state between sessions - all agents read it.

## Claude-Code-specific environment

- NEVER set `ANTHROPIC_API_KEY` - subscription login auth; an env key bills
  per-token silently. (This is about THIS environment's auth - it does not
  forbid the app itself from using its own API key server-side; that's a
  separate, deliberate app-billing choice. See the analytics spec, section 8.)
- `.claude/settings.local.json` is per-machine (gitignored). Destructive ops
  are deliberately NOT allowlisted there - they must always prompt, matching
  gate item 4.
