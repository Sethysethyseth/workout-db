---
name: land-unit
description: Audit and land one Cursor delivery - re-run lanes fresh, audit DELIVERY.md against tree and block, commit with SHA verify, push to staging, QUEUE/HANDOFF upkeep. Use when Seth says "review <unit>" or a delivery is awaiting review.
---

# Land a unit (the per-unit audit + land ritual)

Claude Code only - Cursor never runs this and never sees it. One unit =
one commit, even when reviewing a batch. Verify-before-trust holds at
every step: the delivery report is trusted for narrative, NEVER for
green tests.

## 0. Preconditions

- Read the task block (`docs/tasks/<unit>.md`) and `DELIVERY.md` (the
  `## <unit-id>` section when units were batched).
- Delivery arrives one of two ways:
  - **Mode 1 (local relay):** changes sit uncommitted in this working tree.
  - **Cloud branch:** Cursor pushed a `cursor/<slug>` branch + PR, report
    in the PR body (the NTFIX1 / PR #3 pattern). `git fetch`, audit the
    PR diff, ff-merge onto the wave branch after the audit passes.
- Two-agents check: `git status --untracked-files=all` immediately before
  any commit - untracked DIRECTORIES collapse to one line and hide new
  files. OneDrive lags: a stale-looking file is usually sync lag; let
  writes settle.

## 1. Re-run the cheap lanes FRESH

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
  doesn't settle, escalate to Fable - never settle contract ambiguity in
  this seat. Other standing escalation triggers: schema/migration design,
  security or cross-user isolation surfaces, prod incidents, root-cause
  debugging that won't close.

## 4. Land

- Stage files INDIVIDUALLY - never `git add .` (untracked junk exists).
- ASCII-only commit message; hyphens, never em-dashes.
- One commit per unit, even in a batch.
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
- Give Seth a short bullet smoke-test list for the staging deploy
  (standing ask - he tests on the staging-branch Vercel deploy, never
  local dev).
