---
name: land-unit
description: Audit and land one Cursor delivery - re-run lanes fresh, audit DELIVERY.md against tree and block, commit with SHA verify, push to staging, QUEUE/HANDOFF upkeep. Use when Seth says "review <unit>" or a delivery is awaiting review.
---

# Land a unit (the per-unit audit + land ritual)

Claude Code only - Cursor never runs this and never sees it. One unit =
one commit, even when reviewing a batch. Verify-before-trust holds at
every step: the delivery report is trusted for narrative, NEVER for
green tests.

Fan-out (v5.2): parallel lanes may DELIVER concurrently, but they land
ONE AT A TIME through this ritual - fan-out multiplies executors,
never reviewers. REPORT-lane deliveries (recon/research/audit blocks)
have no code to land: audit = verify the lane tree is porcelain-empty
(the no-edits contract), read the report, spot-check 1-2 claims
directly, then either preserve it as a `-FINDINGS.md` doc commit (FP0
precedent, wave units) or fold it into the HANDOFF session log
(session-scoped lanes).

## 0. Preconditions

- Read the task block (`docs/tasks/<unit>.md`) and `DELIVERY.md` (the
  `## <unit-id>` section when units were batched).
- Delivery arrives one of three ways:
  - **Lane worktree (the v5 backbone):** `dispatch-unit` ran the headless
    CLI in a pool worktree (`C:\dev\worktrees\cursor-lane`, `-2`, `-3`
    since v5.2) - uncommitted changes + DELIVERY.md sit in THAT tree,
    not this one. Audit and run the lanes
    THERE; land per the lane variant in section 4.
  - **Local relay (hand-relay fallback):** Seth pointed Cursor at the
    block himself - changes sit uncommitted in this working tree.
  - **Cloud branch (Channel A exception):** Cursor pushed a `cursor/<slug>`
    branch + PR, report in the PR body (the NTFIX1 / PR #3 pattern).
    `git fetch`, audit the PR diff, ff-merge onto the wave branch after
    the audit passes.
- Two-agents check: `git status --untracked-files=all` immediately before
  any commit, in whichever tree the commit happens - untracked DIRECTORIES
  collapse to one line and hide new files. OneDrive lags (main tree only;
  the lane worktree lives outside OneDrive): a stale-looking file is
  usually sync lag; let writes settle.

## 1. Re-run the cheap lanes FRESH

- Run them in the tree that holds the delivery (the lane worktree for
  dispatched units, this tree otherwise).
- `npm run test:unit` from `server/` (DB-free lane).
- `npm run build` from `client/`.
- NEVER `npm test` on a migration-carrying block (`pretest` runs
  `prisma migrate deploy`).
- Integration-lane failures: check whether `main` fails the same way
  before treating it as a regression (shared-staging FK pollution).

## 2. Audit DELIVERY.md against the tree and the block

- **Scope:** every changed file is inside FILES TO TOUCH - including
  test, CSS, and barrel/index files. An unexpected file is the #1 red flag.
- **Spot-check 1-2 acceptance criteria by hand** (grep, node eval,
  browser) - "Done" is not evidence.
- **Deviations:** verify each claimed deviation is real and sane. An
  UNREPORTED deviation found in review is an automatic bounce.
- **UI-touching units:** run `node scripts/check-hex.mjs` - flags raw
  hex/rgb/hsl added outside `client/src/index.css` (tokens-only rule,
  8 palette x mode combos). Hits are a review signal to judge, not an
  auto-fail.
- A report that doesn't match the tree is itself the loudest signal.

## 3. Decide: fix, bounce down, or bounce up

- **Trivia:** fix it yourself; note the fix in the HANDOFF session log.
- **Rework:** flip the block to BOUNCED in QUEUE.md with what to fix
  written into the block; back to QUEUED once updated.
- **Ambiguity:** if the delivery and the spec disagree in a way the block
  doesn't settle, escalate to the frontier seat (Opus; Fable is
  departed) - never settle contract ambiguity in this seat. Other standing escalation triggers: schema/migration design,
  security or cross-user isolation surfaces, prod incidents, root-cause
  debugging that won't close.

## 4. Land

- Stage files INDIVIDUALLY - never `git add .` (untracked junk exists).
- ASCII-only commit message; hyphens, never em-dashes.
- One commit per unit, even in a batch.
- Lane-worktree deliveries (NT3 precedent): commit in the LANE on its
  `cursor/<unit>` branch, then ff-merge onto the wave branch (rebase the
  lane branch first if the wave moved) and push from the main tree. One
  commit per unit still holds.
- SHA verify: `git log --oneline -1`.
- Push to the staging branch (allowed without asking; prod-bound pushes
  and main are gated). Confirm arrival:
  `git log origin/<branch> -1 --oneline` - a redeploy rebuilds the OLD
  HEAD until the push lands.

## 5. Bookkeeping

- `docs/tasks/QUEUE.md`: flip the unit to `LANDED <sha>` (or BOUNCED).
- `docs/HANDOFF.md`: update, keep capped (~300 lines); move aged session
  logs VERBATIM (never summarized) to `docs/HANDOFF-ARCHIVE.md`,
  newest first.
- Smoke list (standing ask - Seth tests on the staging-branch Vercel
  deploy, never local dev): write the unit's smoke items into the HANDOFF
  session log, and in a resident relay session CARRY THEM FORWARD - Seth
  smokes ONCE per wave against the consolidated checklist handed over at
  wave end, not after every unit. A hand-relayed or single-unit session
  still gives its list immediately.
- Wave progress line (Seth's standing ask, July 16): end the landing
  report with "n/N - <one-line result>" where N = the wave's total
  block count in QUEUE.md and n = units landed so far; the final unit
  says "N/N complete" instead. Matching dispatch-side convention in
  `dispatch-unit` section 2b.
- **Keep the landing report BRIEF.** Seth reads these mid-wave, one per
  unit: what landed (one line), the SHA, anything he needs to know
  (fixes applied, deviations accepted, bounces), the n/N line. Do NOT
  paste test output, diffs, or file lists - the audit happened; report
  its conclusion. Detail belongs in the HANDOFF session log, and the
  full read belongs to the pre-main gate. Exception: a bounce or an
  escalation gets the evidence inline, because Seth is being asked to
  judge it.
- Relay loop: free width remaining (v5.2: 2 default / 3 cap, counting
  every in-flight lane) and QUEUE.md has a QUEUED unit whose
  serialization notes allow it -> dispatch it via `dispatch-unit` IN THIS
  SAME SESSION (one resident session per wave is the norm - spec, "The
  relay loop").

## 6. Wave end - HARD STOP for smoke

When n == N (every block in the wave LANDED, nothing QUEUED or in
flight), the relay session's job is DONE. In one message:

- "N/N complete" plus a one-line-per-unit recap.
- The CONSOLIDATED smoke checklist: every landed unit's smoke items
  carried forward into one list, against the staging Vercel deploy
  (never local dev), with `origin/<branch>` confirmed so Seth knows the
  deploy has the code.
- An explicit ask for smoke sign-off.

Then STOP. Do NOT roll into the pre-main gate, do NOT run
`/code-review`, do NOT start reading the branch diff, do NOT schedule a
wakeup to do it later. Seth smoking the wave comes FIRST, always - his
findings are review input, and a gate run before smoke gets partly
re-run after it.

The gate resumes only when Seth signs off (or explicitly waives smoke),
and it runs under the `pre-main-review` skill in a FRONTIER seat (Opus).
If this session is Sonnet, say the wave is ready for the gate and hand
the chair over - Sonnet never runs the gate itself.
