# TASK bkf1c: critic round 1 fixes - finished summary shows timed sets; analytics sees evening sessions; logger placeholders

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The blocks-v2 wave (BK) failed its first coach-persona critique at 6/10
(`docs/tasks/bk-critic-round-1-FINDINGS.md` - read it; finding numbers below
refer to it). Two P1s live here:
- [3] After finishing a block session with a 45-second timed set and a
  5 x 55 lb set, the workout summary says SETS 1 and lists the timed
  exercise as "0 sets / No sets logged" - the DB holds both
  (`WorkoutSet.durationSec` 45, `reps` null). The logger already counts a
  `durationSec` set as logged (`sessionSetHasCoreLogged` in
  `SessionDetailPage.jsx`, BK9); the completed view
  (`client/src/components/workout/CompletedSessionSummary.jsx`) does not.
- [4] Analytics requests send `to` as a date-only string; the server reads
  it as 23:59:59.999Z (UTC). An 8:42 PM EDT session (00:42Z next day) is
  outside "today" until tomorrow, so Execution showed "Nothing to compare
  yet". The summary endpoint already accepts ISO datetimes for `from` and
  `to` (`server/src/controllers/analyticsController.js` getSummary).
Sibling blocks bkf1a and bkf1b run in parallel on DISJOINT files - stay
inside the list below.

FILES TO TOUCH:
- `client/src/components/workout/CompletedSessionSummary.jsx`
- `client/src/pages/SessionDetailPage.jsx`   (ONLY if the summary's counts
                                              or rows are computed here)
- `client/src/pages/AnalyticsPage.jsx`       (`rangeForWeeks`)
- `client/src/components/analytics/WeeklyReport.jsx`
- `client/src/lib/dateRange.js`              (NEW - pure local-day helper)
- `client/src/components/blocks/log/*`       (planHelpers placeholders)
Do NOT modify anything outside these files (NOT `components/blocks/ui/*`
- `rxFormat.js` belongs to bkf1a - and NOT the server).

CHANGE (observable contract, finding number in brackets):
1. [3] **Timed sets are logged sets on the finished summary.** The summary
   header's SETS count and each exercise's "n sets" include sets with a
   `durationSec` (reps null); each such set row renders its time ("45 s",
   "1:30" for 90, with the load when present: "20 lb × 45 s") - never
   "No sets logged" when the exercise has a timed set. Volume stays
   strength-only (timed sets add nothing, as the engine already does).
   Non-timed rows are unchanged.
2. [26] Notes shown on the finished summary keep their line breaks (the
   plan's "Setup: ...", "Lead side: ..." lines stay on separate lines).
3. [4] **Local-day ranges.** A pure helper in `client/src/lib/dateRange.js`
   returns `{ from, to }` as ISO datetimes for the START of the local day
   N days back and the END of today in the device's local time zone.
   `AnalyticsPage`'s summary request and `WeeklyReport`'s requests use it
   (same day counts as today). Leave the coach range (`coachRange`, the
   `/coach/ask` body) as date-only - its contract is date labels; say so
   in DELIVERY.md. Anything that DISPLAYS the range keeps showing dates.
4. [13][23] Logger placeholders for planned sets (`planHelpers.js`): no
   planned weight -> the weight placeholder is empty (not "e.g. 185");
   a capped RPE shows "≤ 7" and a capped RIR "≥ 2" as the effort
   placeholder; an uncapped target shows the number as today.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles (paste the tail);
  `node scripts/check-hex.mjs` clean; `npx eslint
  src/components/workout/CompletedSessionSummary.jsx src/lib/dateRange.js
  src/components/blocks/log src/components/analytics/WeeklyReport.jsx` 0
  errors (and no NEW errors in `AnalyticsPage.jsx` / `SessionDetailPage.jsx`
  versus `HEAD` - paste both counts if either already has some).
- A `node --input-type=module` snippet in DELIVERY.md, run with
  `TZ=America/New_York`, prints (verbatim) the helper's range for "4
  weeks" at a fixed instant of 2026-09-29T20:42:00-04:00: `to` is
  `2026-09-30T03:59:59.999Z` and `from` is `2026-09-02T04:00:00.000Z`
  (28 local days including today); and at 2026-09-29T10:00:00-04:00 the
  same `to`. (Inject "now" as a parameter so the snippet is deterministic.)
- The summary's set-count helper (pure, exported or local but covered by
  the snippet) counts `[{ reps: null, durationSec: 45 }, { reps: 5,
  weight: 55 }]` as 2 and formats the timed row as "45 s".
- `planHelpers` snippet (verbatim): no-weight plan set -> weight placeholder
  `""`; `{ effort: "rpe", effortCap: true }` + set rpe 7 -> "≤ 7";
  `{ effort: "rir", effortCap: true }` + rir 2 -> "≥ 2"; uncapped rpe 8 ->
  "8".
- DELIVERY.md walks items 1-4 and lists the reviewer's LIVE check: an
  evening block session with one timed and one weighted set -> finished
  summary shows 2 sets with "45 s"; Analytics (4 weeks) Execution lists
  the session the same evening.

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
