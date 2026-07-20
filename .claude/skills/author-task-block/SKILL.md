---
name: author-task-block
description: Author a unit-scale Cursor task block contract-first from docs/tasks/_TEMPLATE.md, register it in QUEUE.md, commit AND push. Use in Fable/Opus planning sessions when emitting the next block or wave of blocks.
---

# Author a task block (the Fable/Opus planning ritual)

Blocks are contracts, not implementations. Cursor gets NO chat context
beyond the one-line dispatch prompt - autonomous via `dispatch-unit` or
Seth by hand, same line either way - the file must stand alone.

## Inputs first

- `docs/HANDOFF.md` (current state) and the relevant spec in `docs/specs/`.
- Wave planning: grep `docs/HANDOFF-ARCHIVE.md` for prior accepted
  deviations, sequencing flags, and reviewer fixes - they are contract fuel.
- Template: `docs/tasks/_TEMPLATE.md` (standing footer baked in). Format
  rationale when in doubt: `cursor-task-block-template.md`.

## Contract-first rules (v4, carried unchanged into v5)

- Name the files, the patterns to follow BY NAME, and the observable
  contract. Do NOT write line-level implementation, exact CSS values, or
  JSX placement - Cursor makes those choices; acceptance criteria and the
  review lane protect precision. EXCEPTION: judgment-heavy visual units
  where the design detail IS the spec - fully specify those.
- ACCEPTANCE CRITERIA must be machine-checkable: unit lane green, client
  build clean, concrete input -> output examples the reviewer can verify.
  Not vibes.
- Fully self-contained: if the block needs a decision that isn't made
  yet, STATUS stays DRAFT, not QUEUED.
- MODEL header is the cost lever AND the dispatch-routing lever
  (`auto` -> Channel B auto rung, free; named tier -> B named rung,
  plan credit - see `dispatch-unit`): `fable`/`opus` for judgment-heavy
  units, `auto` for mechanical ones. (Standing rule: execution units
  default to Opus; Fable is withheld for the pre-main gate.)
- MODE line: `1-relay`, or `2-worktree` with explicit path + branch
  (requirements in `docs/tasks/README.md`). Autonomous dispatch runs
  1-relay blocks in the lane worktree regardless - MODE governs the
  hand-relay fallback, not the channel.
- Lanes: assume the DB-free lanes only (`test:unit` + client build) -
  no dispatch channel can run the integration lane (no `server/.env`
  in the lane worktree or the cloud). A block that genuinely needs it
  is a hand-relay flag; say so in the block.
- Keep the STOP CONDITION standing footer VERBATIM - it carries the
  no-git / no-HANDOFF / no-scope-creep / write-DELIVERY.md rules.
- Optimize block size (bigger coherent units amortize Cursor's fixed
  context-loading cost) and model tier - not delivery-mechanism tokens.

## Variants

- **Diagnosis block (bugs enter here first):** CHANGE says reproduce or
  trace, make NO code changes, and write to `DELIVERY.md`: root cause
  (file:line, mechanism, why it explains the EXACT symptom), blast
  radius, smallest-correct proposed fix. Fix block dispatches only after
  the reviewer verifies the reasoning.
- **Report block (recon / research / audit):** CHANGE says produce a
  REPORT ONLY - no code changes, no git operations - written to
  `DELIVERY.md` (preserve as a `-FINDINGS.md` doc at landing if it
  should outlive the session; FP0 precedent). Report blocks are
  report LANES (spec, "Fan-out"): embarrassingly parallel, no landing
  commit. Diagnosis blocks are a special case of this variant.
- **Batching / parallelism (v5.2):** two CONTENT blocks may run
  concurrently (or back-to-back) only if FILES TO TOUCH are fully
  disjoint - including test, CSS, and barrel/index files. If in doubt
  whether they collide, they do: serialize. REPORT blocks parallelize
  freely with anything. One agent per worktree, always; width cap 3.
## Authoring recon - fan search out to Cursor first (v5.2)

Before authoring a wave, DISPATCH RECON. This is the default opening
move for any wave bigger than one block, not an optional flourish: the
grounding this seat would otherwise grep out itself is exactly the grunt
work fan-out exists to move off the frontier seat.

**The vehicle is CURSOR report lanes - never Claude subagents.** When a
ritual (including a built-in like `/code-review`) says "spawn agents",
the LogChamp reading is: dispatch Cursor report lanes on the cheap rung
via `dispatch-unit`, and keep only judgment here. Using the Agent tool
for this spends frontier-family tokens on search.

Mechanic: `dispatch-unit` section 2c. One agent per worktree
(`cursor-lane-2`, `-3`), explicit `--model`, staggered launches, width 2
default / 3 cap, background tasks with timeouts. Report lanes touch no
files, so they parallelize freely - including alongside an unlanded
delivery sitting in `cursor-lane`.

Recon lanes worth dispatching:

- **NOW-state recon:** for each planned unit, what exists today, with
  file:line evidence and the patterns already in use (FP0 is the proven
  pattern). This is what makes "follow pattern X BY NAME" possible.
- **Web / competitor research** on the product question behind the wave.
- **Spec-input sweeps:** every place in `docs/specs/` and the master
  prompt that constrains the planned units.
- **Collision mapping:** candidate FILES TO TOUCH per unit, so the
  serialization notes are grounded rather than guessed.

Then author the contracts FROM the reports, spot-checking claims that
carry weight. The judgment - scope calls, contracts, trade-offs,
rejections - never delegates; only the search does. Session-scoped recon
lanes are logged in the HANDOFF session log, NOT in QUEUE.md (a recon
lane that is itself a roadmap unit gets a QUEUE entry like any other).

## Finish

- Filename: `<unit-id>-<slug>.md`, lowercase, in `docs/tasks/`.
- Register in `docs/tasks/QUEUE.md` as QUEUED with a one-line scope.
- Commit AND PUSH - `dispatch-unit` preconditions on committed AND
  pushed (Channel A reads from GitHub; keeping the invariant means any
  rung can pick the unit up).
- Dispatch is Claude Code's job now (relay v5): invoke `dispatch-unit`,
  or leave the unit QUEUED for the relay loop to pick up. Seth pointing
  Cursor at a block by hand still works; the line for that path:
  > Read `docs/tasks/<unit>.md` and execute it exactly. It is the
  > complete task; do not ask for the task in chat.
