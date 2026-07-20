# Cursor Task-Block Template

The drop-in prompt format. Claude emits these; you paste into Cursor (on Auto) with zero edits. Designed so Cursor stays scoped, doesn't wander, and produces a diff you can review in under a minute.

---

## The format

```
## TASK: <one-line title>

CONTEXT:
<1–2 sentences. What this is part of, why it matches the existing codebase.>

FILES TO TOUCH:
- path/to/file1   (what changes)
- path/to/file2   (what changes)
Do NOT modify anything outside these files.

CHANGE:
<Plain, specific description of exactly what to do. Reference existing
patterns/functions by name so Cursor matches the codebase style.>

ACCEPTANCE CRITERIA:
- <observable thing that proves it worked>
- <e.g. "npm run dev compiles with no errors">
- <e.g. "the list renders the seeded exercises">

STOP CONDITION:
When the above criteria are met, stop. Do not refactor unrelated code,
add dependencies, or expand scope. If a criterion can't be met, stop and
explain why instead of guessing.
```

---

## Why each section earns its place

- **FILES TO TOUCH + "do NOT modify anything outside"** → kills the #1 review red flag (unexpected files in the diff). Your scope check in Stage 5 becomes trivial.
- **Reference existing patterns by name** → Cursor matches your codebase instead of inventing a new style ("Fit" check).
- **ACCEPTANCE CRITERIA** → gives both Cursor and you an objective "done," so review is a yes/no, not a judgment call.
- **STOP CONDITION** → the single most important line. Agents sprawl when not told to stop. This keeps the diff small and the task one-session-sized.

---

## Worked example (workout app)

```
## TASK: Add exercises list component

CONTEXT:
Part of the workout app. We already have an /api/exercises route returning
JSON. This adds the UI that displays them, matching the existing component
style in src/components.

FILES TO TOUCH:
- src/components/ExerciseList.tsx   (new component)
- src/pages/Exercises.tsx           (render the new component)
Do NOT modify anything outside these files.

CHANGE:
Create ExerciseList.tsx that fetches from /api/exercises and renders each
exercise as a card. Follow the same data-fetching and card pattern used in
src/components/WorkoutList.tsx. Then import and render <ExerciseList /> in
Exercises.tsx.

ACCEPTANCE CRITERIA:
- npm run dev compiles with no errors
- Visiting /exercises shows a card per seeded exercise
- Styling matches WorkoutList cards

STOP CONDITION:
Stop when criteria are met. Don't add new dependencies, don't restyle
WorkoutList, don't touch the API route. If the API isn't returning data,
stop and say so.
```

---

## Unit-scale variant (for Fable-on-Cursor)

When Cursor is running a capable model AND Claude Code is doing the
review, the scope cap moves from "1-3 files, diff reviewable in a minute" to
"one coherent roadmap unit with a testable contract" (e.g. ALL of B3b:
per-exercise aggregation + PR detection + balance ratios + summary object +
meta + tests, in one block). Same format, four changes:

- **FILES TO TOUCH** may name directories plus a contract ("new modules under
  `server/src/analytics/`, tests under `server/test/analytics/`") instead of
  an exhaustive file list.
- **ACCEPTANCE CRITERIA** must be machine-checkable: `npm run test:unit`
  green, plus concrete input->output examples for the unit's public contract
  (the reviewer verifies these, not vibes).
- **CHANGE is contract-first, not implementation-first (v4):** name the
  files, the patterns to follow (by name), and the observable contract —
  do NOT write out the exact CSS values, JSX placement, or line-level
  implementation. Cursor makes the implementation choices; the acceptance
  criteria and the review lane protect precision. EXCEPTION: judgment-heavy
  visual units (the L5/T3-visuals kind), where the design detail IS the
  spec — those stay fully specified.
- **STOP CONDITION** always includes these three lines verbatim:
  - "Do NOT commit, push, or touch git in any way - leave the working tree
    for review."
  - "Do NOT edit docs/HANDOFF.md, AGENTS.md, or CLAUDE.md - state is the
    reviewer's job."
  - "Before stopping, run every lane this block allows and write the
    delivery report to DELIVERY.md at the repo root (see the template's
    Delivery report section). Do not commit it."

The safety net for the bigger diff is the review lane (Claude Code audits
the delivery report against the tree and re-runs the cheap lanes before
committing) plus the DB-free unit-test lane - not diff smallness. Don't use
this variant without both.

---

## Delivery report (required on every unit-scale block, v4)

Before stopping, Cursor writes `DELIVERY.md` at the repo root (gitignored,
never committed; one `## <unit-id>` section per block when batching):

- **Files touched** — exact list; anything outside FILES TO TOUCH flagged
  explicitly with a reason.
- **Test evidence** — verbatim output of every lane the block allows
  (`npm run test:unit` from `server/`, client `npm run build`; NEVER
  `npm test` on a migration-carrying block).
- **Acceptance criteria** — each criterion restated with the evidence that
  proved it (grep output, test name, node eval result). "Done" is not
  evidence.
- **Deviations** — anything implemented differently from the block, with the
  reason. An unreported deviation found in review is an automatic bounce.

What this buys: the reviewer audits a claim instead of reconstructing the
delivery. The reviewer still re-runs the unit lane + client build fresh —
the report is trusted for narrative, NEVER for green tests (executors have
claimed passing criteria that didn't pass; verify-before-trust holds). A
report that doesn't match the tree is itself the loudest review signal.

---

## Diagnosis-block variant (bugs get a Cursor first pass, v4)

For a bug report, the FIRST block dispatched is a diagnosis, not a fix.
Same format, but CHANGE says: reproduce or trace the bug, make NO code
changes, and write to `DELIVERY.md`:

- **Root cause** — file:line, the mechanism, and why it explains the exact
  reported symptom (not just "a" plausible cause).
- **Blast radius** — what else the mechanism touches.
- **Proposed fix** — concrete, smallest-correct.

The reviewer verifies the reasoning (cheap) instead of deriving it
(expensive), then green-lights a fix block, or overrides and escalates to
the frontier seat (Opus) per the standing triggers.

**The direct-fix exception, stated so it doesn't drift:** when diagnosis was
~95% of the work and the fix is trivial (the promotion-glitch / wheel-scroll
pattern), the agent that diagnosed ships the fix directly — relaying a
one-liner costs more than it protects. Everything where implementation is
the bulk of the work goes to Cursor, however small.

---

## Batching (non-colliding units, v4)

Two QUEUED blocks whose FILES TO TOUCH don't intersect (including test,
CSS, and barrel/index files) may be dispatched to Cursor back-to-back and
reviewed in ONE Claude Code session: one `DELIVERY.md` section per unit,
one commit per unit (never combined), one HANDOFF update for the batch.
Colliding units stay strictly serialized, as always. If in doubt whether
two blocks collide, they do.

---

## How to ask Claude for one

You usually won't write these by hand — that's the point. Just say:

> "Give me the Cursor task block for the next step."

or

> "Turn step 3 of the plan into a Cursor task block."

If a block's diff comes back too big to review in a minute, tell Claude: **"That was too big — split it into two blocks."**
