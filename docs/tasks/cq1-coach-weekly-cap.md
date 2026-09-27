# TASK CQ1: cap the hosted coach at 7 questions per rolling week (owner exempt)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The in-app coach (`docs/specs/ai-layer.md` section 5, Lane B) runs on a
HOSTED Cursor key that Seth pays for, or on a user's own Anthropic key (BYO,
`x-coach-key` header). Nothing limits hosted use today. **Seth's rulings,
Sept 27, 2026:**
- Every user gets **7 coach questions per ROLLING 7 days** on the hosted key.
- **Only hosted-key questions count.** BYO-key questions are unlimited (the
  user pays). Mock-provider questions (`COACH_PROVIDER=mock`, dev) never count.
- **Only coach questions count.** `POST /coach/palette` (palette studio) is
  NOT capped and must not change. The Claude connector (`server/src/ai/`,
  Lane A) is the user's own assistant and is untouched.
- **Seth (`sethjknisel@gmail.com`) is exempt.** The exemption is config, not
  code: an env var `COACH_UNCAPPED_EMAILS` (comma-separated, case-insensitive,
  whitespace-trimmed). No email address is written into code or tests other
  than as obvious fixtures.

Nothing stores coach usage today (no model in `server/prisma/schema.prisma`
records it), so this unit adds a small table - it is MIGRATION-CARRYING. You
WRITE the migration file; you never apply it (no `prisma migrate`, no DB).

FILES TO TOUCH:
- `server/prisma/schema.prisma`              (new `CoachUsage` model + the
                                              back-relation on `User`)
- `server/prisma/migrations/20260927120000_add_coach_usage/migration.sql`
                                             (NEW - additive only)
- `server/src/coach/weeklyCap.js`            (NEW - pure cap logic + the
                                              exemption parser)
- `server/src/coach/askCoach.js`             (`loadCoachAccess` also returns
                                              what the cap needs, e.g. email)
- `server/src/controllers/coachController.js` (enforce on `askCoach`; report
                                              on `getCoachStatus`; palette
                                              handler untouched)
- `server/.env.example`                      (document `COACH_UNCAPPED_EMAILS`)
- `server/test/lib/coachWeeklyCap.test.js`   (NEW)
- `client/src/api/coachApi.js`               (surface the new status field
                                              and the 429 shape)
- `client/src/components/coach/CoachPanel.jsx` (remaining count + capped state)
- `client/src/index.css`                     (only the coach-panel rules this
                                              needs; CoachPanel's classes
                                              already live here)
Do NOT modify anything outside these files. In particular NOT
`server/src/coach/cursorProvider.js` or its test (a parallel unit, CP2, owns
them), `provider.js`, anything under `server/src/ai/`, the palette path, or
`package.json` / lockfiles.

CHANGE:

**A. Schema + migration.** Model `CoachUsage`: an autoincrement id, `userId`
(String, FK to `User.id`, `onDelete: Cascade`), `createdAt` (default now),
and an index on `(userId, createdAt)`. One row = one counted question. It
stores NO question text, no answer, no model output - nothing but who and
when. Follow `AiConsent` in the same schema BY NAME for the FK/cascade
shape. Write the migration SQL by hand or generate it with `prisma migrate
diff` between the pre-change and new schema files (no DB needed); it must be
additive only - `CREATE TABLE`, `CREATE INDEX`, `ADD CONSTRAINT` for the FK,
nothing that alters or drops an existing table. Mirror the formatting of
`20260804180000_add_ai_consent/migration.sql`. `npx prisma validate` must
pass; `npm run prisma:generate` is fine to run (it needs no DB).

**B. `weeklyCap.js` - pure, no Prisma import.** At minimum:
- the limit constant (7) and window (7 days);
- an exemption parser for `COACH_UNCAPPED_EMAILS`, following
  `parseReviewerEmails` in `server/src/middleware/feedbackReviewerRequired.js`
  BY NAME (trim, lowercase, drop empties); unset or empty means nobody is
  exempt;
- an evaluator that, given the timestamps of a user's counted questions and
  `now`, returns whether another question is allowed, how many are used and
  remaining in the window, and `nextAvailableAt` (when the oldest in-window
  question ages out) - `null` when a question is available now.
Keep the DB reads/writes out of this module (the controller or a thin
helper next to it does them) so the rules are unit-testable.

**C. Enforcement on `POST /coach/ask`.** After consent and key resolution
succeed and BEFORE any SSE headers are written:
- The cap applies only when the resolved key source is `hosted` AND the
  user's email is not exempt. Otherwise the request behaves exactly as today.
- At or over the limit -> `429` JSON `{ error: "weekly_limit", limit, used,
  nextAvailableAt }` (ISO string). No stream, no model call, no row written.
- Under the limit -> write one `CoachUsage` row, then stream as today.
- **A question only counts if the user got an answer.** If the stream ends
  without delivering any answer text (a provider error, a refusal with no
  text, or the client disconnecting before the first text), remove that
  question's row. Once any answer text has been sent, it counts, however
  the stream ends.
- Two simultaneous questions at 6/7 may both get through; that slop is
  acceptable - do not add locking.

**D. `GET /coach/status`** gains `weeklyCap`: `{ limit, used, remaining,
nextAvailableAt }` when the cap applies to this caller (same rule as C,
including the BYO header the status call already reads), else `null`.
Every existing field stays unchanged.

**E. Client.** In `CoachPanel` (follow its existing state, copy, and class
patterns BY NAME; tokens only - `scripts/check-hex.mjs` must stay clean):
- When `weeklyCap` is present and questions remain: a quiet, muted line such
  as "4 of 7 questions left this week". Exempt / BYO / uncapped users see
  nothing new.
- At zero: the ask control is disabled and the panel says the week's
  questions are used and when the next one frees up, in the user's LOCAL
  time, in plain language (e.g. "Your next question frees up Tue at 3:10
  PM."). No error styling - this is a limit, not a failure.
- A `429 weekly_limit` from `/coach/ask` (stale status, second tab) shows
  that same capped state, never a generic error.
- After each answered question the remaining count updates without a page
  reload (refetch status or decrement - your choice).
- Match the panel's existing voice: short, plain, no exclamation marks.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` - paste verbatim counts. Baseline
  30 suites / 324 tests (CP2 lands its own tests in parallel; count only
  against this baseline in your lane). No existing test modified.
- `coachWeeklyCap.test.js` proves, at minimum:
  - exemption parser: `" Seth@Example.com , ,b@x.io"` -> contains
    `seth@example.com` and `b@x.io`; `undefined` and `""` -> nobody exempt;
    matching is case-insensitive.
  - evaluator with `now = 2026-09-27T12:00:00Z`: 6 timestamps inside the
    last 7 days -> allowed, used 6, remaining 1, `nextAvailableAt` null;
    7 inside, oldest `2026-09-21T09:00:00Z` -> not allowed, used 7,
    remaining 0, `nextAvailableAt` `2026-09-28T09:00:00.000Z`; 7
    timestamps all older than 7 days -> allowed, used 0; the boundary (a
    timestamp exactly 7 days old) is OUT of the window - pin it.
  - `weeklyCap.js` has no Prisma import (a `grep -n "prisma"` on it prints
    nothing - paste it).
- Migration: paste `migration.sql` verbatim; `grep -niE "drop|alter
  table \"(user|workoutsession)\"" ` on it prints nothing; `npx prisma
  validate` output pasted.
- From `server/`: `node -e "require('./src/app')"` exits 0 (the module graph
  loads).
- `git diff --stat` + `git status --untracked-files=all` show only FILES TO
  TOUCH (paste both); `generatePalette` in `coachController.js` is
  byte-identical to before (paste `git diff` of that controller and point
  at it).
- `npm run build` clean from `client/`; `node scripts/check-hex.mjs` clean
  (paste).
- In DELIVERY.md, a short WIRING note: the exact file:line where the cap
  check runs in `askCoach`, where the row is written, and where it is
  removed on a no-answer ending - the reviewer verifies these by reading.

NOT FOR THIS LANE (the reviewer's steps, listed so you do not attempt them):
applying the migration anywhere; the live check on staging (seed 7 rows for
a non-exempt test account, confirm the 8th question gets the capped state);
setting `COACH_UNCAPPED_EMAILS` on Render.

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
