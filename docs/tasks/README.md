# Task queue - file-dispatched Cursor units

The relay without the pasting. Claude Code authors unit-scale task blocks as
files in this directory; Seth dispatches one to Cursor with a single line;
Cursor reads the file and executes. This directory is the queue, `QUEUE.md`
is the index, `_TEMPLATE.md` is the block format.

Part of the poor-mans-agentic-workflow experiment - design rationale and
public-repo tracking live in `docs/specs/poor-mans-agentic-workflow.md`.

---

## The loop

1. **Author (Claude Code, planning session):** writes `docs/tasks/<unit>.md`
   from `_TEMPLATE.md`, adds it to `QUEUE.md` as `QUEUED`, commits AND
   pushes (Cursor runs in the cloud from GitHub - an unpushed block is
   invisible). Ritual: the `author-task-block` skill.
2. **Dispatch (Seth, one line in Cursor):**

   > Read `docs/tasks/<unit>.md` and execute it exactly. It is the complete
   > task; do not ask for the task in chat.

3. **Execute (Cursor):** implements, gets tests green, writes the delivery
   report to `DELIVERY.md` at the repo root (files touched, verbatim test
   output, per-criterion evidence, deviations - format in the template),
   STOPS. The standing footer in every block repeats the hard rules (no
   git, no HANDOFF, no scope creep, no editing the task file).
4. **Review + land (Claude Code):** audits `DELIVERY.md` against the working
   tree (scope, spot-check 1-2 criteria, verify claimed deviations), re-runs
   the unit lane + client build fresh (the report is never trusted for green
   tests), fixes-or-bounces, commits with SHA verification, flips the unit's
   status in `QUEUE.md`, updates `docs/HANDOFF.md` (moving aged session logs
   to `docs/HANDOFF-ARCHIVE.md`). Ritual: the `land-unit` skill.

Bugs enter the queue as DIAGNOSIS blocks first (root cause + evidence +
proposed fix in `DELIVERY.md`, no code changes); the fix block dispatches
after the reviewer verifies the reasoning. Two blocks with fully disjoint
FILES TO TOUCH may be dispatched back-to-back and reviewed in one session
(one commit per unit). Details for both: `cursor-task-block-template.md`.

Seth's whole job: dispatch lines, and telling Claude Code "review <unit>"
when Cursor stops. No prompt authoring, no pasting specs.

## Statuses (tracked in QUEUE.md, single writer = Claude Code)

- `DRAFT` - block exists but not final; do not dispatch.
- `QUEUED` - authored, committed, ready to dispatch.
- `DISPATCHED` - Seth pointed Cursor at it (Seth flips this one, or tells
  Claude Code to; it's the only status change Claude Code can't observe).
- `AWAITING-REVIEW` - Cursor stopped with tests green.
- `LANDED <sha>` - reviewed and committed.
- `BOUNCED` - review failed; block updated with what to fix, back to QUEUED.

Cursor NEVER edits `QUEUE.md`, task files, or anything in `docs/` - same
single-writer rule as HANDOFF.

## Two modes

**Mode 1 - file relay (the pilot, start here).** One working tree, one agent
active at a time, exactly today's relay minus the pasting. No new risk; the
two-agents-one-tree gotcha never triggers because activity is serialized.

**Mode 2 - parallel worktrees (graduate to this after ~3 clean Mode 1 units).**
Cursor works in its own `git worktree` OUTSIDE OneDrive while Claude Code
reviews/lands the previous unit or works a disjoint one in the main checkout.
Requirements, all mandatory:

- The two active blocks are **file-disjoint** (their FILES TO TOUCH sections
  share nothing, including test files and barrel/index files).
- Cursor's block says at the top which worktree path + branch it lives in.
- Only Claude Code merges worktree branches; ritual in `docs/RUNBOOK.md`
  ("Parallel worktree ritual").
- If in doubt whether two blocks are disjoint, they aren't - serialize.

## Authoring rules (for Claude Code)

- Use `_TEMPLATE.md` (the unit-scale variant of
  `cursor-task-block-template.md` with the standing footer baked in).
- Filename: `<unit-id>-<slug>.md`, lowercase (e.g. `a5-exercise-picker.md`).
- The block must be fully self-contained: Cursor gets NO chat context beyond
  the dispatch line. If the block needs a decision that isn't made yet, it's
  DRAFT, not QUEUED.
- State the recommended Cursor model tier at the top (`MODEL: fable` for
  judgment-heavy units, `MODEL: auto/cheap` for mechanical ones) - this is
  where the cost lever lives.
- Delivery-mechanism token overhead (file read vs paste) is noise; do not
  optimize it. Optimize block size (bigger coherent units amortize Cursor's
  fixed context-loading cost) and model tier instead.
