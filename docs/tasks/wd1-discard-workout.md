# TASK WD1: a small X to stop (discard) a workout you started - safe in every scenario

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth, Sept 27, 2026: "once you start a workout there should be an option to
stop the workout, a small x or cancel ... make sure the cancel works in all
scenarios." Today there is NO way out of a started workout except Finish.
The server already has `DELETE /sessions/:id` (`sessionController.js:1487`)
and the client already has `sessionApi.deleteSession` (`sessionApi.js:54`),
but nothing in the UI calls them. And since the F-wave, Finish requires
effort on every logged set, so a lifter who wants to bail mid-workout is
stuck.

**The hazard this unit must close (verified Sept 27):** reopening a finished
workout (`reopenSession`, `sessionController.js:1401`, MW3) only sets
`completedAt` back to null. A reopened workout is then INDISTINGUISHABLE
from a new one - on the client and the server. A naive "X = delete" would
let a user permanently erase a finished workout from their history by
reopening it and tapping X. So this unit adds a persisted marker
(`reopenedAt`) and puts the "may this be discarded" rule on the SERVER, where
a stale tab or a client bug cannot get around it. It is MIGRATION-CARRYING:
you WRITE the migration file; you never apply it (no `prisma migrate`, no DB).

FILES TO TOUCH:
- `server/prisma/schema.prisma`       (`reopenedAt DateTime?` on
                                       `WorkoutSession`)
- `server/prisma/migrations/20260927130000_add_session_reopened_at/migration.sql`
                                      (NEW - one nullable ADD COLUMN)
- `server/src/lib/sessionDiscard.js`  (NEW - the pure "can discard" rule)
- `server/src/controllers/sessionController.js` (`reopenSession` stamps
                                       `reopenedAt`; new discard handler)
- `server/src/routes/sessionRoutes.js` (the discard route)
- `server/test/lib/sessionDiscard.test.js` (NEW)
- `client/src/api/sessionApi.js`      (`discardSession`)
- `client/src/pages/SessionDetailPage.jsx` (the X, the confirm, the exits)
- `client/src/pages/DashboardPage.jsx` (a "Workout discarded" flash)
- `client/src/index.css`              (only the rules the X/confirm/flash need)
Do NOT modify anything outside these files. Leave `DELETE /sessions/:id`
and `sessionApi.deleteSession` exactly as they are (nothing uses them; this
unit does not start to).

CHANGE:

**A. Schema + migration.** `WorkoutSession.reopenedAt DateTime?` - set when
a finished workout is reopened, NEVER cleared (finishing it again leaves it
set: it records "this workout was finished at least once"). Migration: one
`ALTER TABLE "WorkoutSession" ADD COLUMN "reopenedAt" TIMESTAMP(3);` - no
default, no backfill, nothing else. Mirror the formatting of
`20260804180000_add_ai_consent/migration.sql`. `npx prisma validate` must
pass. Every session payload `SessionDetailPage` reads must include
`reopenedAt` - check whether those handlers use `include` (all scalars come
back already) or `select` (then add it).

**B. The rule - `server/src/lib/sessionDiscard.js`, pure, no Prisma.** A
workout may be discarded only when it is LIVE (`completedAt` null) AND was
NEVER finished (`reopenedAt` null). Export a function taking the session's
`{ completedAt, reopenedAt }` and returning allowed or not, with a reason.

**C. `POST /sessions/:id/discard`** (authRequired, same id parsing and
ownership scoping as `deleteSession`):
- not found / not the caller's -> 404 (as `deleteSession` does);
- rule says no -> 409 `{ error: "not_discardable", reason }`, nothing
  deleted;
- otherwise delete the session (sets and session exercises go with it via
  the existing cascades) -> 204.
Check-and-delete must not be racy against a concurrent finish: do the
delete with a WHERE that includes the rule's conditions (e.g. `deleteMany`
on id + userId + `completedAt: null` + `reopenedAt: null`), then decide
404 vs 409 from a follow-up read only when nothing was deleted.
`reopenSession` additionally sets `reopenedAt: new Date()`.

**D. The client - every scenario below is part of the contract.** Follow
the existing inline-confirm pattern on this page BY NAME - `confirmReopen` /
`reopenBusy` (`SessionDetailPage.jsx:1871-1872`, rendered around `:3098`) -
rather than a new modal or portal. Follow the finish exit BY NAME: the
finish path navigates `navigate("/", { replace: true, state: {
workoutSaved: true } })` (`:2362`) and `DashboardPage` shows its
`workout-tab__saved-flash` from `location.state` (`:103-107`, `:163`);
discard mirrors it with `workoutDiscarded: true` and a quiet "Workout
discarded" flash (muted, no emoji, no celebration).

`sessionApi.discardSession(id)`: POSTs the discard; on 204 AND on 404
(already gone - another tab or device) it fires `notifySessionsChanged({
type: "deleted", sessionId })` exactly as `deleteSession` does and resolves
as success; on 409 it rejects with an error the page can recognize.

The scenarios (put a table in DELIVERY.md: scenario -> file:line that
handles it -> how you verified it):
1. **Where the X lives:** a small X (icon button) in the live workout's
   header, shown ONLY when the workout is live AND `reopenedAt` is null.
   Accessible name "Discard workout"; hit target at least 44x44 px; must
   not crowd the header at 360 px wide; clearly not the Finish button.
2. **Reopened finished workout:** no X at all - Finish (which already
   exists) is how you leave it. The server's 409 is the backstop.
3. **Nothing logged yet** (zero saved sets - template-started workouts
   create no set rows until you log one): tapping X discards immediately,
   no confirm.
4. **At least one saved set:** X opens the inline confirm: "Discard this
   workout?" / "Your N logged sets will be deleted. This can't be undone."
   (N = saved sets; singular "set" when N is 1), buttons "Discard workout"
   (the destructive one, existing danger-token styling) and "Keep logging"
   (closes the confirm, changes nothing). Initial focus on "Keep logging";
   Escape closes it and returns focus to the X.
5. **Success:** navigate to Home with `replace: true` (Back must NOT land on
   the dead workout), the flash shows, and the Home hero + resume bar clear
   at once - `ActiveSessionContext` already drops a session on the
   `deleted` event (`ActiveSessionContext.jsx` `onSessionsChanged`); if the
   user had a second live workout, it simply becomes the resume target.
6. **No "are you sure you want to leave" after a discard.** This page arms a
   live-logging nav guard (`setLiveLoggingGuard`, `:2152-2160`) and a
   `beforeunload` handler (`:2163-2170`). Neither may fire on the discard's
   own navigation.
7. **Network failure / 5xx:** stay on the page, nothing lost, a short
   inline message ("Couldn't discard. Check your connection and try
   again."), controls re-enabled so the user can retry.
8. **409 not_discardable** (e.g. another tab finished it meanwhile):
   nothing deleted; re-fetch the session and show "This workout was already
   finished." The page then renders whatever state the server reports.
9. **Double tap / tap while busy:** exactly one request - busy state
   disables the X and both confirm buttons (mirror `reopenBusy`).
10. **Saves in flight at the moment of discard** (a set being saved, a
    debounced notes/name/field write): after a successful discard none of
    them may surface an error message or toast, and none may run against
    the deleted workout afterward. Find every pending-write mechanism on
    this page (debounce timers, pending promises) and name how each is
    neutralized in the table.
11. **Unsaved draft inputs** (typed but not yet saved) are dropped
    silently - no prompt.
12. **Timers and listeners** tied to the live workout (rest timer,
    intervals, wake lock, if present) stop - nothing fires after leaving.
13. **Opening a stale URL** to a discarded workout (history, bookmark,
    another tab) shows the page's existing not-found/error state, not a
    crash or a blank screen.
14. **Theming:** tokens only - every surface correct across the 5 palettes
    x 2 modes; `scripts/check-hex.mjs` clean.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - paste verbatim counts; more
  tests than the baseline you find at the start (record it); no existing
  test modified.
- `sessionDiscard.test.js` proves: `{ completedAt: null, reopenedAt: null
  }` -> allowed; `{ completedAt: <date>, reopenedAt: null }` -> not allowed;
  `{ completedAt: null, reopenedAt: <date> }` (a reopened workout, live
  again) -> NOT allowed; both set -> not allowed. `grep -n "prisma"
  server/src/lib/sessionDiscard.js` prints nothing (paste).
- Migration: paste `migration.sql` verbatim - it is exactly one nullable
  `ADD COLUMN` on `"WorkoutSession"`. `npx prisma validate` output pasted.
- From `server/`: `node -e "require('./src/app')"` exits 0.
- `git diff` of `sessionController.js` shows `deleteSession` byte-identical
  and `reopenSession` changed only by the `reopenedAt` stamp (paste the
  diff). `git diff --stat` + `git status --untracked-files=all` show only
  FILES TO TOUCH (paste both).
- `npm run build` clean from `client/`; `node scripts/check-hex.mjs` clean
  (paste both).
- The 14-row scenario table in DELIVERY.md, each row with a file:line.
  The reviewer verifies it by reading, and Seth smokes it on staging.

NOT FOR THIS LANE (reviewer's / Seth's steps): applying the migration; the
live smoke of the scenarios on the staging deploy.

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
