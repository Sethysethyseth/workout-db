# Handoff - cross-pollination session (Fable, July 12-13), for the continuing agent

**What this is:** the remaining work from a Fable session that cross-
pollinated this repo with the poor-mans-agentic-workflow shell repo
(`C:\dev\the-poor-mans-agentic-workflow`). The shell-repo half is DONE and
pushed (its `main` = `6876e2e`); the workout-db half was deliberately
deferred because another agent was live in this tree (NTFIX1). Left as an
untracked file in `docs/parked/` so it never races the active wave; fold
into HANDOFF/QUEUE or delete once absorbed.

## Already done (do not redo)

Shell repo `main` `6876e2e`: BRIEF decisions 14 (tools/ waiver -
`tools/token-tracker/` completed + smoke-tested) and 15 (receipts refresh);
`source-material/` gained `cursor-token-savings-stats.md` + `-data.json`
(copied from this repo's `docs/specs/`, verified clean) and
`receipts-addendum-2026-07-12.md`. That addendum is currently the ONLY
traceable record of the post-July-7 workflow events (item 4 below fixes
that). Full session state: the shell repo's HANDOFF.md top entry.

## STATUS as of 2026-07-28 (Opus session)

The NTFIX1 wait-constraint below EXPIRED long ago (NTFIX1 and NTFIX2 both
landed; the FP wave has since shipped to prod). Seth reviewed all four
items July 28:

- **Item 1 (Next-action line) - DONE.** Line added at the top of
  `docs/HANDOFF.md` with its standing rule; upkeep bullet added to
  `land-unit` section 5.
- **Item 2 (usage tracker) - BURIED by Seth, deliberately.** "bury it and
  we can talk about it later." Do NOT implement, do NOT re-propose
  unprompted. The design work is preserved for that later conversation:
  on-demand reporting instead of a scheduled review (unasked reviews cost
  nothing), APPEND-BLIND rows so per-session cost stays flat as the file
  grows (never read-then-append), an aggregate script so the report never
  loads the raw log, and don't log what `git log` + QUEUE.md already
  know. Open sub-questions if it's revived: whether `docs/usage-tracker.md`
  is the right home, and that Cursor $ can't be self-observed.
- **Item 3 (reviewer checklist) - DONE, as the backport it had become.**
  No new file. `land-unit` section 2 gained the "things a green build
  CANNOT catch" list (contract seams, `var()` tokens resolve, dangling
  refs); scope-vs-FILES-TO-TOUCH was already covered. The public repo's
  checklist should still be EXTRACTED from the skill, not written fresh.
- **Item 4 (tracking-doc catch-up) - DONE, and extended.** Section 10 of
  `docs/specs/poor-mans-agentic-workflow.md` got the five July 11-13
  entries this doc specified, PLUS the July 14 / 18 / 20 relay changes
  (v5, v5.2 fan-out, v5.3 gate ritual) that postdated this doc and were
  also missing, plus a July 28 entry for this absorption. Section 8 got
  the seat-split receipt line. CORRECTION to the instruction below: the
  two `cursor-token-savings-stats` files are NOT untracked in this repo,
  they do not exist here at all - they survived only in the shell repo,
  so section 8 now cites that location instead of staging local copies.

**This file's only live content is item 2.** Once that conversation
happens, it can be deleted. Still untracked, still awaiting Seth's
standing ruling on where `docs/parked/*` lives (here vs the workflow repo).

---

## Remaining work (workout-db side - WAIT until NTFIX1 lands and the tree is quiet)

All four are docs/process changes, no product code. Sonnet-appropriate.

1. **"Next action (human):" line in HANDOFF.md.** Standing line at the very
   top, filled on EVERY rewrite, never empty (one sentence: the single
   thing Seth does next). Also add the line to the `land-unit` skill's
   HANDOFF-upkeep step so it self-maintains. Rationale: dogfooding the
   shell repo's decision-10 no-dangling-next-action requirement.

2. **Filled usage tracker.** Adapt the shell repo's
   `templates/usage-tracker.md` into a live file here (suggest
   `docs/usage-tracker.md`): weekly window plan, per-session log (date,
   anchor time, seat, units shipped, cap-hit y/n, one-line note), weekly
   review incl. Cursor $ of $20. Add one-row-per-session upkeep to
   `land-unit`'s session-close step. Rationale: two token-expiry scrambles
   (July 2 planner seat, July 11 executor seat) happened unwatched; this
   also feeds the public repo's mini-receipts continuously.

3. **Reviewer checklist - PARTIALLY SUPERSEDED, verify instead of create.**
   The original idea (a checklist file for the per-unit audit) predates the
   new `.claude/skills/land-unit` skill, which now carries that ritual.
   Instead: read `land-unit` and confirm it covers the July-11 Opus audit's
   "things a build can't catch" list (API row/resolve shapes vs client
   reads, CSS var() tokens resolve, no dangling refs, scope vs FILES TO
   TOUCH); backport anything missing INTO the skill. The public repo's
   future `checklists/reviewer-checklist.md` should then be extracted FROM
   the skill, not written fresh.

4. **Tracking-doc catch-up** (`docs/specs/poor-mans-agentic-workflow.md` -
   its own rule: every workflow change appends to section 10). Missing
   entries, all traceable to QUEUE.md/HANDOFF.md/the shell addendum:
   - 2026-07-11: executor substitution - Cursor out of Opus tokens, NT2
     (`f26e783`) delivered by Composer from the same block file, zero repo
     changes (roles-not-tools receipt).
   - 2026-07-11: planner-tier refinement - Fable withheld for
     gate/skeletons/escalations; Opus audits execution units.
   - 2026-07-12: cloud-dispatch variant (`804b65b`) - blocks must be
     PUSHED; delivery = `cursor/` branch + PR body; own clone (no
     shared-tree hazard); reviewer audits the PR branch.
   - 2026-07-12: smoke checklist caught E/F after a clean 11-criterion
     audit; diagnosis-first skipped per Seth "this once," recorded, then
     partially walked back (NTFIX1 keeps F diagnose-first).
   - 2026-07-13: rituals moved into project skills (`land-unit`,
     `author-task-block`); merge-to-main + schema-deploy deliberately kept
     as RUNBOOK copy-paste (friction is a feature). This is publishable
     workflow content.
   Also append section-8 receipt lines for the N/NT waves or point at
   `docs/specs/cursor-token-savings-stats.md` (37 units / 35 commits,
   78.4/21.6 unit split, 80.7/19.3 byte split, July 2-11).
   These two spec files are still UNTRACKED - stage them with this commit.

## Constraints

- Do not touch NTFIX1's files or its QUEUE entry until it lands + audits.
- `git status --untracked-files=all` before committing (two-agents rule);
  stage individually; docs-only commit(s) on the current branch; staging
  push fine, no main.
- Open Seth decisions - do NOT settle: charts placement/format for the
  token-savings visuals; whether `docs/usage-tracker.md` is the right home.
