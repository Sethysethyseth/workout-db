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

## Model selection (soft default - you still choose)

Start in Sonnet. Both a Sonnet chat and an Opus chat stay open; reach into the
Opus chat only when a task hits one of the Opus tendencies (see
routing-cheatsheet.md section B). Drop back to Sonnet the moment the hard part
is solved. Nothing auto-routes - "Sonnet first" is just the home base that keeps
the cheap lane cheap and prevents Opus-drift.

## Workflow note (the relay)

Claude plans / Cursor executes. For small changes (1-3 files), Claude produces a
**Cursor task block** (scoped, file-named, acceptance criteria, stop condition -
template: `cursor-task-block-template.md`) rather than editing directly. Hand
big mechanical jobs + DB inspection + repo hygiene to Claude Code.
`docs/HANDOFF.md` carries current-state between sessions - all agents read it.

## Claude-Code-specific environment

- NEVER set `ANTHROPIC_API_KEY` - subscription login auth; an env key bills
  per-token silently. (This is about THIS environment's auth - it does not
  forbid the app itself from using its own API key server-side; that's a
  separate, deliberate app-billing choice. See the analytics spec, section 8.)
- `.claude/settings.local.json` is per-machine (gitignored). Destructive ops
  are deliberately NOT allowlisted there - they must always prompt, matching
  gate item 4.
