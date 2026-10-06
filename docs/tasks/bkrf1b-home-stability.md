# TASK bkrf1b: Home polish after critic R1 - no late jump, a calmer block card, honest week strip

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
bkr critic round 1 scored 6/10 FAIL (`docs/tasks/bkr-critic-round-1-FINDINGS.md`
- read it; ids below refer to it). This unit fixes the Home half (bkr5 landed
`52ee633`). Seth's rulings that stay: logging first; the block card under the
hero; ONE week strip on Home (the This week day strip shows only when no block
card does); one Resume while live. Runs in parallel with bkrf1a and bkrf1c -
stay inside your files.

FILES TO TOUCH:
- client/src/pages/DashboardPage.jsx
- client/src/components/blocks/run/UpNextCard.jsx
- client/src/components/analytics/WeeklyReport.jsx
- client/src/components/workout/WeekStrip.jsx
- client/src/components/workout/StartWorkoutHero.jsx
- client/src/components/workout/ActiveWorkoutHero.jsx
- client/src/components/workout/PersistentWorkoutBar.jsx
- client/src/styles/blocks/bk-run.css
Do NOT modify anything outside these files (index.css belongs to bkrf1a this
round - put Home styles in bk-run.css).

CHANGE:
1. **P2-3 no late jump.** While `/block-runs/active` is pending, render a
   block-card placeholder of the card's real height in its slot. Remember
   "this user has an active run" in `sessionStorage` (key
   `workoutdb-home-has-run`, read synchronously on mount) so a user WITH a run
   gets the placeholder from the first frame and a user WITHOUT one gets none.
   When the run resolves to none, remove the placeholder (the only allowed
   shift, and only on a first visit). Size the This week skeleton for its
   state (with or without the day strip) so Recent workouts does not move
   when it resolves. Target: Home CLS < 0.05 on a warm load with a run.
2. **P2-4 a calmer block card** (target ~190px tall at 390):
   - day label 22px block font, ONE line, `text-overflow: ellipsis`;
   - the exercise line clamped to ONE line with an ellipsis, followed by the
     muted "+N · M sets" (keep that part visible);
   - the Start button label 15px, 44px tall;
   - the hero stays the heaviest thing on the page.
3. **P3-4** "View block ›": 44px-tall hit area (padding + negative margin), same
   visual size.
4. **P2-6** hide the persistent In-progress bar on `/blocks/import` too (the
   import preview's sticky "Create block" sits under it). Keep it on every
   other route except `/` (bkr5) and wherever the builder already hides it.
5. **P3-5 honest week.** The stats are a rolling 7 days (`/analytics/summary`
   ending today) but the strip is the calendar week. Make them agree: the
   strip shows the SAME 7 days (oldest -> today, weekday letter + date under
   each, today outlined), and the card title reads "Last 7 days". Comparison
   copy ("vs last week") becomes "vs the 7 days before".
6. **P3-12 desktop.** At >=1024px, the hero and the block card sit side by side
   (two equal columns, same height), This week + Recent below; no CTA wider
   than ~420px.
7. **P3-9** "Resume workout" vs "Resume Workout": one casing ("Resume
   workout") on the hero and the bar.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean;
  `node scripts/check-hex.mjs` clean.
- Grep: `workoutdb-home-has-run` is read and written in DashboardPage; the
  block-card placeholder renders while the run fetch is pending.
- Grep: PersistentWorkoutBar returns null on `/` and `/blocks/import`.
- Grep: WeeklyReport's title reads "Last 7 days"; WeekStrip takes the same
  from/to window the summary uses.
- Every new `var(--...)` resolves in `client/src/index.css` or
  `client/src/styles/blocks/bk-ui.css` - list them.
- Playwright at 390x844 if available (else say so): block card height
  <= 200px with a long day name; with `PerformanceObserver` on
  `layout-shift`, the warm-load CLS of Home with a run < 0.05.

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
