# TASK qol-gate-r3: Gate fuel - acceptance-criteria coverage for all 24 QOL blocks (REPORT ONLY)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Pre-main gate for the quality-of-life wave: branch `quality-of-life-updates`,
61 commits ahead of `main` @ `b5c6777`. Each of the 24 task blocks was
audited when it landed; this lane checks that the SUM still holds - later
units can quietly undo what an earlier unit's contract promised. This is a
REPORT lane: no code changes, no git operations. You map; the reviewer
judges.

The 24 blocks, in `docs/tasks/`:
qol1-schema-coach-key-history, qol2-training-preferences,
qol3-builder-exercise-hold-to-move, qol4-confirm-panel-finish-discard,
qol5-server-fixes-413-history-cap, qol6-coach-app-help-everywhere,
qol7-repeat-last-time, qol8-edit-custom-exercises, qol9-builder-polish,
qol10-coach-history, qol11-byo-key-vault, qol12-rest-timer,
qol13-small-visual-fixes-connector-forward, qol14-whats-new-system,
qol15-whats-new-release, qolf1-workout-bar-home-confirm-analytics,
qolf2-coach-page-history-key-form, qolf3-logger-room-and-cues,
qolf4-prefs-polish-builder-selection, qolf5-repeat-last-effort-hint,
qolf6-logger-round-2-fixes, qolf7-round-2-fixes-coach-prefs-run-home,
qolf8-logging-setup-strip-into-the-workout, qolf9-setup-strip-hotbar
(all `.md`). `docs/tasks/QUEUE.md` (QOL section) records, per unit, the
accepted deviations and reviewer fixes - read those too; an accepted
deviation is NOT a gap.

FILES TO TOUCH:
- REPORT-QOL-GATE-R3.md at the repo root (new, the ONLY file you write)
Do NOT modify, create or delete anything else. No DB connection, no dev
server.

CHANGE (report only):

1. **Per block, every machine-checkable acceptance criterion re-run on
   HEAD.** For each block, list its grep / file / behaviour criteria and
   re-check each against the CURRENT tree (not the unit's own commit):
   - grep criteria: run the grep, paste the output (or "no output").
   - "X exists / is wired" criteria: cite file:line on HEAD.
   - real-app criteria (taps on a device): do NOT attempt; list them as
     REVIEWER-ONLY.
   Verdict per criterion: HOLDS / BROKEN-ON-HEAD / UNSURE, with evidence.
2. **Later-unit regressions.** For every criterion that is BROKEN-ON-HEAD,
   find the commit that broke it (`git log -S` / `git log -L` on the
   relevant lines) and say whether a later block's contract or a QUEUE
   note explains it (quote the note) or nothing does.
3. **CHANGE items with no diff.** For each block, list any numbered CHANGE
   item for which you cannot find a corresponding change in
   `git diff b5c6777...HEAD`, unless QUEUE.md records it as reverted,
   stowed, or an accepted deviation (quote the note). Known: qolf7 item 7
   (Last 7 days) was REVERTED - confirm it is fully gone.
4. **Shared surfaces touched by many units.** For
   `client/src/pages/SessionDetailPage.jsx`,
   `client/src/components/workout/PersistentWorkoutBar.jsx`,
   `client/src/pages/DashboardPage.jsx`, and
   `client/src/components/prefs/*`: list which blocks touched each file
   (from `git log --format='%h %s' b5c6777..HEAD -- <file>`), then list
   every pref key, CSS class, prop, or helper that one unit ADDED and a
   later unit REMOVED or RENAMED while something still references the old
   name (file:line of the dangling reference), or "none found".

ACCEPTANCE CRITERIA (machine-checkable):
- `REPORT-QOL-GATE-R3.md` exists with sections 1-4.
- A summary table at the top: block -> criteria count, HOLDS, BROKEN-ON-HEAD,
  UNSURE, REVIEWER-ONLY.
- `git status --porcelain` shows ONLY `?? REPORT-QOL-GATE-R3.md` (paste it
  at the end of the report).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
