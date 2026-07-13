---
name: author-task-block
description: Author a unit-scale Cursor task block contract-first from docs/tasks/_TEMPLATE.md, register it in QUEUE.md, commit AND push. Use in Fable/Opus planning sessions when emitting the next block or wave of blocks.
---

# Author a task block (the Fable/Opus planning ritual)

Blocks are contracts, not implementations. Cursor gets NO chat context
beyond Seth's one-line dispatch - the file must stand alone.

## Inputs first

- `docs/HANDOFF.md` (current state) and the relevant spec in `docs/specs/`.
- Wave planning: grep `docs/HANDOFF-ARCHIVE.md` for prior accepted
  deviations, sequencing flags, and reviewer fixes - they are contract fuel.
- Template: `docs/tasks/_TEMPLATE.md` (standing footer baked in). Format
  rationale when in doubt: `cursor-task-block-template.md`.

## Contract-first rules (v4)

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
- MODEL header is the cost lever: `fable`/`opus` for judgment-heavy
  units, `auto` for mechanical ones. (Standing rule: execution units
  default to Opus; Fable is withheld for the pre-main gate.)
- MODE line: `1-relay`, or `2-worktree` with explicit path + branch
  (requirements in `docs/tasks/README.md`).
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
- **Batching:** two blocks may dispatch back-to-back only if FILES TO
  TOUCH are fully disjoint - including test, CSS, and barrel/index
  files. If in doubt whether they collide, they do: serialize.

## Finish

- Filename: `<unit-id>-<slug>.md`, lowercase, in `docs/tasks/`.
- Register in `docs/tasks/QUEUE.md` as QUEUED with a one-line scope.
- Commit AND PUSH - Cursor runs in the cloud from GitHub; an unpushed
  block is invisible to it. Its delivery may come back as a
  `cursor/<slug>` branch + PR (report in the PR body) rather than a
  local working tree.
- Hand Seth the dispatch line:
  > Read `docs/tasks/<unit>.md` and execute it exactly. It is the
  > complete task; do not ask for the task in chat.
