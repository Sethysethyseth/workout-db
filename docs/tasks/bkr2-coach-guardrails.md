# TASK bkr2: Coach guardrails - every hosted AI call counts, no overshoot, on-topic only

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (Oct 5, `docs/tasks/bk-smoke-FINDINGS.md`). Seth's rules:
"make sure people are only getting 7 uses a week", and the coach must stay
on LogChamp/training topics. It currently wrote him a C# script and did
plain math, then added "that's not a workout". Seat audit of today's cap
(`server/src/coach/weeklyCap.js`, `server/src/controllers/coachController.js`):
- ask (`askCoach`) and draft (`draftBlock`) check the cap, then insert one
  `CoachUsage` row before the model call and remove it if nothing was
  delivered.
- import-map (`importMap`) checks that 3 uses remain and inserts 3 rows only
  AFTER the ~50 s model call, so the race window is the whole call.
- palette (`generatePalette`) never checks or counts the cap at all.
- Every path is check-then-insert with no lock, so concurrent calls can
  overshoot 7.
This unit is server-only. bkr3 builds a token-priced AI file fix on the
reservation API defined here, so get the API shape right.

FILES TO TOUCH:
- server/src/coach/weeklyCap.js           (pure rules: cost constants, any
                                           new pure helpers for settling a
                                           reservation)
- server/src/coach/usageLedger.js         (NEW - the DB-touching reserve /
                                           settle / refund functions; Prisma
                                           client injected so unit tests can
                                           fake it)
- server/src/controllers/coachController.js (askCoach, draftBlock,
                                           importMap, generatePalette move
                                           onto the ledger)
- server/src/coach/prompt.js              (scope rule in COACH_PERSONA)
- server/src/coach/blockDraft.js         (`buildBlockDraftSystemPrompt` -
                                           scope rule for mode "generate")
- server/test/lib/coachWeeklyCap.test.js, server/test/lib/coachUsageLedger.test.js
  (NEW), and the existing coach*.test.js files whose expectations change
Do NOT modify anything outside these files. No schema change - reuse the
existing `CoachUsage` table as is.

CHANGE:
1. **Reservation ledger (`usageLedger.js`).** Three functions:
   - `reserveUses(prisma, userId, n, now)` - inside ONE transaction that
     takes a per-user lock (`pg_advisory_xact_lock` keyed on the user id, or
     an equivalent row lock - your choice, but it must serialize two
     concurrent reservations for the same user), count the rows in the
     rolling window with the existing `evaluateWeeklyCap` rules, and insert
     `n` rows only if `remaining >= n`. Returns `{ ok: true, ids, cap }` or
     `{ ok: false, cap }` where `cap` is the same shape `loadWeeklyCap`
     returns today (`limit, used, remaining, nextAvailableAt, allowed`).
   - `settleUses(prisma, ids, actualCost)` - keep the first `actualCost`
     rows (clamped to 0..ids.length) and delete the rest.
   - `refundUses(prisma, ids)` - delete them all (P2025-tolerant, logs like
     `removeUsageRow` does today).
2. **Every hosted, capped path reserves BEFORE the model call** and settles
   or refunds after:
   - ask: reserve 1; refund if no answer text was delivered (today's rule)
     OR the reply is an off-topic decline (step 3).
   - draft (convert and generate): reserve 1; refund on any non-delivery.
   - import-map: reserve `IMPORT_MAP_COST` (3) up front instead of inserting
     after the call; refund on any failure.
   - palette: NEW - reserve 1 (`PALETTE_COST = 1` in weeklyCap.js); refund
     on failure. When the cap is spent, return the same 429
     `{ error: "weekly_limit", limit, used, remaining, needed, nextAvailableAt }`
     body the other paths use.
   `capAppliesToAccess` (hosted key + not in `COACH_UNCAPPED_EMAILS`) still
   decides whether the ledger is used at all; BYO and mock stay uncapped.
   All 429 bodies carry `needed` (the cost of that action).
3. **On-topic only.** Add a scope rule to `COACH_PERSONA` and to the
   "generate" draft system prompt: the coach answers only about the
   lifter's training, their LogChamp data, lifting technique/programming,
   and how to use LogChamp. For anything else (code, general math,
   homework, trivia, other apps) it does NOT do the task. It replies in at
   most two sentences, saying what it can help with instead. For `askCoach`, make that decline
   detectable server-side: e.g. the model starts an off-topic reply with a
   fixed marker that the server strips before streaming and uses to refund
   the use. Pick the mechanism; it must not leak a marker to the client,
   and it must not refund on-topic answers. For draft "generate", an
   off-topic description must end as a 4xx with a plain message ("The
   coach can only build training blocks.") and a refund, never a block.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean.
- Unit tests (fake Prisma) prove:
  - reserve with remaining 2, n=3 -> `{ ok:false }`, zero rows inserted;
  - reserve with remaining 7, n=3 -> 3 ids;
  - settle(ids of 4, actualCost 2) deletes exactly 2;
  - refund deletes all.
- A unit test proves the lock is taken in the same transaction as the
  count + insert (assert the call order on the fake transaction client).
- Controller tests (existing dependency-injection style in
  `coachBlockDraft.test.js` / `coachImportMap.test.js` / `coachPalette.test.js`):
  - palette with a hosted key and remaining 0 -> 429 `weekly_limit`,
    `needed: 1`, model never called;
  - palette success -> 1 row kept; palette model failure -> 0 rows kept;
  - import-map model failure -> 0 rows kept (today: never inserted, keep it
    that way through the reservation);
  - askCoach with an off-topic marker reply -> the marker is absent from
    every SSE `delta`, and the use is refunded;
  - askCoach with an ordinary answer -> 1 row kept.
- `coachPrompt.test.js` asserts the scope rule text is present in the
  persona (test the rule's presence, not model behaviour).
- In DELIVERY.md, list every hosted AI entry point in `server/src/` (grep
  `completeAnthropic|completeCursor|openCoachStream`) and the cost each
  one now reserves - nothing left uncounted.
- LANDING NOTE (reviewer, not Cursor): a live staging proof - 4 concurrent
  asks from an account with 2 remaining yield exactly 2 answers + 2 x 429;
  "write me a C# script that sorts a list" yields a short decline and no
  net use. The integration lane is not available in dispatch lanes.

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
