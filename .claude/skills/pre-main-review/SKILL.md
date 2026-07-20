---
name: pre-main-review
description: The pre-main gate - one thorough frontier review of the whole accumulated wave diff against the specs, with Cursor report lanes as gate fuel. Use when a wave is complete AND Seth has signed off on staging smoke, or when Seth says "review the branch" / "pre-main".
---

# Pre-main review (the gate ritual)

Frontier seat ONLY - that means OPUS (Fable departed July 18, 2026).
Sonnet does not run this -
if a wave is complete and no frontier seat is in the chair, STOP and say
so. This skill produces a VERDICT, not a merge: the merge itself stays
the copy-paste RUNBOOK ritual behind Seth's verbatim "push to main".

Nothing ships to main without a pass here. The gate has moved (v3: from
per-unit to once-per-wave) - it has never become optional. It caught a
real shipped-contract bug on day one.

## 0. Order of operations - do not reorder

The wave-end sequence is fixed:

1. Final unit lands -> `land-unit` reports "N/N complete" and hands over
   the CONSOLIDATED smoke checklist.
2. **Seth smokes on the staging Vercel deploy and signs off.** HARD STOP.
   The relay session ends here. Do not open this skill, do not run
   `/code-review`, do not start reading the branch diff.
3. Seth's sign-off (or his explicit "skip smoke, review it") is the ONLY
   entry condition for this skill.
4. This skill runs -> verdict + any fix blocks.
5. Merge to main: RUNBOOK ritual, gated on the trigger phrase, Seth runs
   it one command at a time.

Why smoke goes first: smoke findings are review INPUT. A defect Seth
finds on the deploy reshapes what the gate reads for, and a review run
before smoke gets partly re-run after it. Reviewing first burns the
expensive seat twice.

If Seth reports a smoke defect: it becomes a diagnosis block for Cursor
(per AGENTS.md), the fix lands through `land-unit`, and the gate entry
condition resets to a fresh sign-off.

## 1. Load the review fuel

- The full accumulated diff: `git diff main...<wave-branch> --stat`, then
  per-unit diffs.
- Every task block in the wave (`docs/tasks/`) - the CONTRACTS are what
  the diff is judged against.
- The relevant `docs/specs/` files.
- `docs/HANDOFF-ARCHIVE.md` - grep the wave's session logs. Accepted
  deviations, sequencing flags, and reviewer fixes are gate fuel; this
  archive is frontier-only reading and this is the moment it exists for.

## 2. Fan out gate fuel to CURSOR - never to Claude subagents

Standing rule (spec, "Where Cursor now aids the frontier seats"): when a
ritual says "spawn agents" - INCLUDING built-ins like `/code-review` -
the LogChamp reading is dispatch Cursor REPORT lanes on the cheap rung.
Fanning grunt search out via the Agent tool spends frontier-family tokens
on exactly the work fan-out exists to move off this seat.

Mechanic: `dispatch-unit` section 2c. One agent per worktree
(`cursor-lane-2`, `-3`), explicit `--model`, staggered launches, width 2
default / 3 cap, background tasks with timeouts. These are
session-scoped report lanes: log them in the HANDOFF session log, NOT in
QUEUE.md.

Gate-fuel lanes worth dispatching (pick what the wave actually needs):

- **Per-unit coverage report:** for unit X, map each ACCEPTANCE CRITERION
  to where the diff satisfies it, with file:line evidence, and flag any
  criterion with no corresponding change.
- **Fresh-lanes verification:** `npm run test:unit` from `server/` plus
  `npm run build` from `client/` on the wave branch, verbatim output.
- **Cross-doc consistency sweep:** specs vs. AGENTS.md vs. CLAUDE.md vs.
  HANDOFF vs. QUEUE - contradictions and stale state introduced by the
  wave.
- **Tokens-only sweep:** `node scripts/check-hex.mjs` plus a read of every
  CSS/style hunk in the diff across the 8 palette x mode combos.

Verify-before-trust governs all of it: reports compress SEARCH, never
judgment. Spot-check claims directly. Every verdict is this seat's, and
the ruling itself never fans out.

## 3. Read for the things per-unit review structurally cannot catch

The per-unit pass is the tripwire; this is the net. Look for:

- **Cross-unit contract drift:** unit 3 satisfied its block while
  breaking an assumption unit 1 shipped.
- **Seams:** shared components, context, and API shapes touched by more
  than one unit.
- **Accumulated deviations:** each was individually accepted; read them
  together and ask whether the sum still matches the spec.
- **Scope leakage across the wave** - files touched by no block.
- **Schema / security / cross-user isolation surfaces** anywhere in the
  diff. These are standing escalation triggers and get read directly, not
  via a report lane.
- Anything the archive flagged as "revisit at the gate".

## 4. Verdict

Give Seth a SHORT verdict, not a transcript:

- **PASS** - ready for the merge ritual. Say so plainly.
- **PASS WITH FIXES** - name each fix, and whether it is a trivial
  in-seat fix or a Cursor fix block.
- **BLOCKED** - the defect, the evidence, and what unblocks it.

Findings that need code go out as task blocks via `author-task-block` and
land through `land-unit` like any other unit. A blocked gate re-runs from
section 1 after the fixes land - not a partial re-read.

## 5. What this skill never does

- Never merges, never pushes to main, never touches prod or migrations.
  The merge sequence is RUNBOOK + the verbatim "push to main" trigger,
  one command at a time with manual approval before each.
- Never fans out the ruling.
- Never runs before Seth's smoke sign-off (section 0).
