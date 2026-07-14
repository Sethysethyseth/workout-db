---
name: dispatch-unit
description: Dispatch one QUEUED task block to Cursor without Seth relaying it - Channel A (Cloud Agents API) or Channel B (headless CLI in the lane worktree), with the quota fallback ladder. Use when running the relay loop or when Seth says "dispatch <unit>".
---

# Dispatch a unit (the autonomous hand-to-Cursor ritual)

Claude Code only. Design + rationale: `docs/specs/autonomous-cursor-dispatch.md`.
This skill covers DISPATCH and MONITOR only - the audit stays `land-unit`,
authoring stays `author-task-block`, and the gate is untouched (everything
here is staging-side).

## 0. Preconditions

- The block is QUEUED in `docs/tasks/QUEUE.md`, its serialization notes
  allow it now (if in doubt whether units collide, they do - serialize),
  and nothing else is in flight on shared files.
- The block file is COMMITTED AND PUSHED (Channel A reads from GitHub;
  an unpushed block is invisible).
- Pick the channel from the MODEL header: `auto` -> Channel B auto rung;
  judgment tier (`opus` etc.) -> **Channel B named rung** with that
  model id. Channel A is OFF by default - the July 14 probe showed
  cloud agents require usage-based pricing (never the included pool),
  which the standing billing precondition keeps disabled; use A only
  if Seth has deliberately enabled capped usage-based pricing.
- Health check the rung first: the key lives in the User registry -
  read it inline (`[Environment]::GetEnvironmentVariable(
  'CURSOR_API_KEY','User')`; `$env:` may be stale in a Claude Code
  shell) - and invoke the CLI by full path
  (`C:\Users\Sethy\AppData\Local\cursor-agent\cursor-agent.ps1`;
  PATH may be stale the same way). Rung unavailable -> descend the
  ladder (section 3), never stall.

## 1. Channel A - cloud agent

- `POST https://api.cursor.com/v1/agents` (Bearer CURSOR_API_KEY):
  `prompt.text` = the standard dispatch line ("Read docs/tasks/<unit>.md
  and execute it exactly...") + "write the delivery report into the PR
  body per the block's STOP CONDITION footer"; `repos[0]` = the GitHub
  repo at `startingRef` = the wave branch; `model.id` per MODEL header;
  `autoCreatePR: true`.
- Record agent `id` + `latestRunId`; flip the unit DISPATCHED in
  QUEUE.md with both ids in the notes.
- Poll `GET /v1/agents/{id}/runs/{runId}` on a ~10-15 min cadence
  (ScheduleWakeup in a loop session; don't spin). Terminal states:
  - FINISHED -> delivery is `git.branches[]` (`cursor/<slug>` + prUrl):
    flip AWAITING-REVIEW, hand to `land-unit` (cloud-branch mode).
  - ERROR/EXPIRED/CANCELLED -> read `result`; quota-shaped error ->
    descend the ladder; anything else -> one re-dispatch, then escalate.
- Bounce channel: `POST /v1/agents/{id}/runs` with the audit findings
  as a follow-up prompt (cheaper than a cold re-dispatch).

## 2. Channel B - headless CLI in the lane worktree

- Lane worktree: `C:\dev\worktrees\cursor-lane` (OUTSIDE OneDrive).
  Create once: `git worktree add C:\dev\worktrees\cursor-lane -b
  cursor/<unit> <wave-branch>`; reuse thereafter (amortizes npm
  install). Per dispatch: `git status` MUST be clean in it (dirty =
  stop, a prior delivery wasn't landed), then
  `git checkout -B cursor/<unit> <wave-branch>`.
- Flip the unit DISPATCHED in QUEUE.md (channel, rung, model in the
  notes) before the run - same bookkeeping as Channel A.
- Run as a BACKGROUND task with a hard timeout (print mode has a known
  indefinite-hang bug - never foreground-wait):
  `agent -p "<dispatch line + 'write the report to DELIVERY.md in this
  directory and make NO git operations'>" --force --output-format text`
  with cwd = the lane worktree. Model: named for plan-credit rung,
  `auto` for the free rung. ALWAYS pass `--model` EXPLICITLY - the CLI
  remembers the last-used model, so a flagless run silently inherits
  whatever the previous invocation used (July 14: a flagless dispatch
  inherited an exhausted named model and quota-refused while
  `--model auto` worked fine).
- On hang/timeout: kill, retry once, then descend or escalate.
- On exit: delivery = uncommitted changes + DELIVERY.md in the
  worktree -> flip AWAITING-REVIEW, hand to `land-unit` (local-relay
  mode, pointed at the worktree; two-agents untracked-files check
  applies there before the commit).

## 3. The fallback ladder

A named -> B named -> B auto -> STOP (page Seth). Descend on: missing
key/CLI, 402/429-family API errors, run ERROR with a quota message, CLI
auth/quota exit. Blocks are self-contained: re-dispatching a dead unit
from scratch on the next rung is safe by construction. Log every
descent in the QUEUE notes (the Composer-for-NT2 precedent shows why
the audit needs to know who actually delivered).

## 4. Hard stops (never dispatch past these)

- Two bounces on one unit -> stop, page Seth.
- Any `land-unit` escalation trigger fired -> stop.
- Wave complete -> the pre-main gate is Fable + Seth, never this skill.
- A migration-carrying or prod-touching block -> this skill refuses;
  those are Seth's manual track, full stop.
