# Task queue - file-dispatched Cursor units

The relay without the pasting - and, since relay v5 (July 14, 2026),
without the manual dispatch: Claude Code authors unit-scale task blocks
as files in this directory AND dispatches them to Cursor itself (headless
CLI in the lane worktree as the backbone, Cloud Agents API as the gated
exception - design in `docs/specs/autonomous-cursor-dispatch.md`). Seth
pointing Cursor at a block by hand still works; both paths execute the
same block verbatim. This directory is the queue, `QUEUE.md` is the
index, `_TEMPLATE.md` is the block format.

Part of the poor-mans-agentic-workflow experiment - design rationale and
public-repo tracking live in `docs/specs/poor-mans-agentic-workflow.md`.

---

## The loop

1. **Author (Claude Code, planning session):** writes `docs/tasks/<unit>.md`
   from `_TEMPLATE.md`, adds it to `QUEUE.md` as `QUEUED`, commits AND
   pushes (dispatch preconditions on pushed - the cloud channel reads from
   GitHub). Ritual: the `author-task-block` skill.
2. **Dispatch (Claude Code):** the `dispatch-unit` skill - Channel B
   (headless CLI in the lane worktree `C:\dev\worktrees\cursor-lane`) by
   default, with the quota fallback ladder; flips the unit `DISPATCHED`.
   Hand-relay fallback (Seth, one line in Cursor):

   > Read `docs/tasks/<unit>.md` and execute it exactly. It is the complete
   > task; do not ask for the task in chat.

3. **Execute (Cursor):** implements, gets tests green, writes the delivery
   report to `DELIVERY.md` at the root of whichever tree it runs in (the
   lane worktree for autonomous dispatches, the main tree for hand relays;
   the cloud channel reports in the PR body instead - files touched,
   verbatim test output, per-criterion evidence, deviations - format in
   the template), STOPS. The standing footer in every block repeats the
   hard rules (no git, no HANDOFF, no scope creep, no editing the task
   file).
4. **Review + land (Claude Code):** audits `DELIVERY.md` against the
   delivery tree (scope, spot-check 1-2 criteria, verify claimed
   deviations), re-runs the unit lane + client build fresh in that tree
   (the report is never trusted for green tests), fixes-or-bounces,
   commits with SHA verification, flips the unit's status in `QUEUE.md`,
   updates `docs/HANDOFF.md` (moving aged session logs to
   `docs/HANDOFF-ARCHIVE.md`). Ritual: the `land-unit` skill.

Bugs enter the queue as DIAGNOSIS blocks first (root cause + evidence +
proposed fix in `DELIVERY.md`, no code changes); the fix block dispatches
after the reviewer verifies the reasoning. Two blocks with fully disjoint
FILES TO TOUCH may be dispatched back-to-back and reviewed in one session
(one commit per unit). Details for both: `cursor-task-block-template.md`.

Seth's whole job: authoring go-aheads, bug reports, staging smoke
sign-off, and the gate items (main merges, prod, migrations). No prompt
authoring, no pasting specs, no dispatch lines unless he wants to
hand-relay.

## Statuses (tracked in QUEUE.md, single writer = Claude Code)

- `DRAFT` - block exists but not final; do not dispatch.
- `QUEUED` - authored, committed, ready to dispatch.
- `DISPATCHED` - handed to Cursor. `dispatch-unit` flips this itself
  (channel + rung + model in the notes); on a hand relay Seth flips it
  or tells Claude Code to.
- `AWAITING-REVIEW` - Cursor stopped with tests green.
- `LANDED <sha>` - reviewed and committed.
- `BOUNCED` - review failed; block updated with what to fix, back to QUEUED.

Cursor NEVER edits `QUEUE.md`, task files, or anything in `docs/` - same
single-writer rule as HANDOFF.

## Two modes (hand-relay paths - autonomous dispatch supersedes them)

Autonomous dispatch (the v5 default) always runs in the lane worktree
`C:\dev\worktrees\cursor-lane`, whatever the block's MODE line says -
see the `dispatch-unit` skill. The modes below govern the hand-relay
fallback and stay valid there:

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
- State the recommended Cursor model tier at the top (`MODEL: opus` for
  judgment-heavy units, `MODEL: auto` for mechanical ones) - this is
  where the cost lever lives, and since v5 it is also the dispatch-routing
  lever (`auto` -> the free CLI rung, named tier -> plan credit). The
  value is passed verbatim to `--model`, so it must name a LIVE model:
  never `fable` (departed July 18, 2026). Blocks landed before that date
  carry `MODEL: fable` in their headers - that is history, not a
  template to copy.
- Delivery-mechanism token overhead (file read vs paste) is noise; do not
  optimize it. Optimize block size (bigger coherent units amortize Cursor's
  fixed context-loading cost) and model tier instead.
