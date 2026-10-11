# TASK MXF6: coach reliability (critic round 3: answers survive leaving, status/ask failures recover, coach bar polish)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Critic round 3 of 3 after MXF3 (the coach flow end to end, plus an app
sweep) scored 5/10. The coach's happy path works: ask, stream, leave, come
back, bar on every tab, Read, reload, History. It breaks on the unhappy
paths. Full report: `docs/tasks/mxf3-critic-round-3-FINDINGS.md` (R3-x IDs
below; screenshot names refer to a gitignored folder you do not need).
Seth's standing ask (MXC1): "the coach keeps working when you leave". On a
phone, "leaving" includes locking the screen between sets, a reload, and
switching conversation, not only a tab change. This block makes that true
end to end. A parallel block (MXF7) owns the non-coach findings in another
lane, so stay inside FILES TO TOUCH. Do NOT edit ROADMAP.md: both parallel
blocks would collide on it, so the reviewer updates it at landing.

R3-1 and R3-2 are BUGS: root-cause section first in DELIVERY.md (file:line,
mechanism), then the fix.

CHANGES:
1. BUG R3-1 (P1): an in-flight answer is thrown away, and nothing is saved,
   when the user taps "+" (new conversation), opens another conversation
   from History > Coach, reloads, or the connection drops. Mechanism:
   `server/src/controllers/coachController.js` `askCoach` aborts the model
   stream on `res.on("close")` and saves only a finished, non-aborted
   exchange (`saveSuccessfulExchange` behind `!controller.signal.aborted`).
   The client aborts on those actions (`CoachPanel.jsx` reset / conversation
   switch, `CoachSessionContext.jsx` `clearSession`). New behaviour, decided
   by the Opus seat:
   (a) SERVER: a client disconnect no longer stops the answer. The server
       keeps generating to the end and saves the exchange exactly as a
       finished one is saved today. Writes to the closed response are
       skipped, never thrown. Off-topic, refusal and provider-error paths
       keep today's rules for what gets saved.
   (b) SERVER: an explicit Stop really stops. The client sends a
       `streamId` (random, client-generated) with `/coach/ask`, and Stop
       calls a new `POST /coach/stop` with `{ streamId }`. The server
       aborts that stream and saves nothing (today's Stop outcome). Keep
       the registry in memory, in a small module under
       `server/src/coach/` or `server/src/lib/`, keyed by user id +
       streamId, with entries removed on finish. A stop for an unknown
       stream, or one owned by another user, is a silent 204: it never
       reveals whether another user's stream exists. `/coach/stop` sits
       behind `authRequired` like every coach route. Do NOT change the
       rate limiters or the weekly-cap rules.
   (c) CLIENT: tapping "+" or opening another conversation while an answer
       is streaming opens an in-app `ConfirmPanel` (the qol4 component), never
       a native dialog: "The coach is still answering." Buttons: [Keep
       waiting] (the default, focused) and [Open anyway]. The second
       carries a note that the answer will be saved to History > Coach. Open
       anyway closes the client stream WITHOUT calling stop, so (a) saves
       it.
   (d) CLIENT: if the page reloads, or the app comes back, while an answer
       was in flight, `/coach` shows one calm line: "Your last question is
       still being answered. It will be in History > Coach." Keep a small
       pending marker in sessionStorage, cleared when that conversation
       shows up or after 10 minutes. It must not double up with the bar's
       own working/answered states.
2. BUG R3-2 (P1): if `/coach/status` fails on load (429, offline, 5xx),
   `/coach` is stuck. The conversation shows, but the composer is gone,
   with no message and no retry. Fix: a failed status shows the right copy
   (MXF5's 429 copy, or the connection copy for network/5xx) plus a Retry
   button. It also retries on its own when the page becomes visible again,
   or the browser comes back online. The composer comes back as soon as a
   status succeeds. A transient failure never leaves the page without a
   way forward.
3. R3-3 (P2): a failed ask has no retry and wipes the question. On any ask
   failure, the question goes back into the box and the failed exchange
   offers "Try again". A question over the server's limit (1000 chars)
   must never reach the server: the box caps at 1000 and shows a quiet
   counter from about 900. The 400 for length maps to "Questions can be up
   to 1000 characters." Check the server's exact limit in the controller
   and use that number, not a guess.
4. R3-8 (P2): in the coach wait pill, "Thinking..." sits about 5 px above
   the dots and the pill's centre line, at 412 and 390. Centre the text and
   the dots on one line, within 1 px (`AiWait.jsx`, `ai-wait.css`, or the
   page variant in `coach-page.css`).
5. R3-9 (P3): the coach bar's dismiss is a text "x" (`.coach-working-bar__dismiss`).
   Use `GlyphIcon name="close"` (`client/src/components/GlyphIcon.jsx`,
   from MXF5; do NOT edit that file, MXF7 owns it) and centre it within
   1 px.
6. R3-10 (P3): Read lands on the tail of a long answer. Read (and any open
   of a just-finished answer) lands on the START of the latest answer,
   using the page's existing `placeAnswerStart` logic.
7. R3-11 (P3): the bar pops in and out with no motion, and its height jumps
   56 -> 62 on the working -> answered flip. Give it a short enter/exit
   (MX motion tokens from `client/src/styles/` / MOTION-DIRECTION.md, about
   200-250 ms, transform/opacity only). Keep both states at one height.
   Under `prefers-reduced-motion`, no movement. Never cover the nav or
   Finish while animating.
8. R3-12 (P3): History > Coach does not refresh when an answer saves while
   the list is open. Refetch it when the coach session reports a save
   (the bar's flip to "answered" is the signal), and when the page becomes
   visible again.
9. R3-7 + R3-15 (P2/P3), Profile > AI access (`AiConnectorPage.jsx`):
   (a) The copy says coach chats are in "Library, under Coach". They now
       live in History > Coach.
   (b) The page jumps 66 px when the coach status line arrives. Reserve
       its space, or render a skeleton line of the same height.
   Leave the released What's New entries in `client/src/data/whatsNew.js`
   alone. They are history, and the wave's release note will announce the
   move.
10. R3-18 small: the coach "+" calls `focus()` on the textarea but
    `activeElement` stays BODY. Make the focus land, inside the tap's
    gesture.

GUARDRAILS:
- Zero new dependencies; no package.json / lockfile changes, no installs.
- No schema change, no migration, no change to rate limiters, weekly cap,
  consent, key handling or what a conversation stores.
- Cross-user isolation: every new server path is scoped to `req.authUserId`.
  Say in DELIVERY.md how you checked it.
- Client: tokens only (check-hex clean), all 5 palettes x light/dark, phone
  first.
- Do not touch the keyboard fit (`CoachPage.jsx` fit, `coachKeyboardFit.js`,
  `visibleBand.js`), `GlyphIcon.jsx`, `index.css`, `SessionDetailPage.jsx`,
  or anything MXF7 owns.

FILES TO TOUCH:
- `server/src/controllers/coachController.js`, `server/src/routes/coachRoutes.js`
- a new small module under `server/src/coach/` or `server/src/lib/` (the
  stream registry), with unit tests under `server/test/lib/` (the unit lane
  runs `test/lib/**`)
- `client/src/api/coachApi.js`
- `client/src/context/CoachSessionContext.jsx`
- `client/src/components/coach/` (CoachPanel, CoachWorkingBar, AiWait,
  CoachLeaveNote if needed)
- `client/src/styles/coach-page.css`, `client/src/styles/coach-working-bar.css`,
  `client/src/styles/ai-wait.css`
- `client/src/pages/SessionsPage.jsx` (the Coach side's refresh only)
- `client/src/pages/profile/AiConnectorPage.jsx`, `client/src/styles/ai-access.css`,
  `client/src/styles/coach-history.css`
- `server/data/app-guide.md` only if it still says coach history is in Library
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (the Opus seat re-runs round 3's repros on the real app
with the mock coach and the staging DB at landing):
- `npm run build` from `client/` passes; `node scripts/check-hex.mjs` exits
  0; `npm run test:unit` from `server/` green with your new registry tests
  counted (verbatim output for all three).
- `git status --porcelain --untracked-files=all` lists only FILES TO TOUCH.
- Registry unit tests cover: register/finish removes the entry; stop by the
  owner aborts; stop by another user id is a no-op returning the same
  result shape; a stop for an unknown id is a no-op.
- Item 1: DELIVERY.md shows the server code path for disconnect vs stop,
  and argues (or shows with the mock provider) that (i) a closed client
  still gets the exchange saved, and (ii) Stop saves nothing.
- Item 2: DELIVERY.md shows the status failure path and the retry
  triggers.
- Items 3-10: one section each with what changed, file and lines, how it
  was verified. Say plainly what was and was not browser-verified (the
  lane has no `server/.env`; stub, or argue from code).

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
