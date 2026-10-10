# TASK MXC1: The coach keeps working when you leave + coach history moves to History

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Seth smoked `motion-wave` on his phone, Oct 10, and asked for these coach
changes inside this wave. Today the coach page (`/coach`, reached from Home's
top-right masthead button and from Profile) loses the conversation when you
switch tabs: `CoachPanel.jsx` aborts its stream on unmount
(`useEffect(() => () => abortRef.current?.abort(), [])`), the server
(`coachController.js`, `res.on("close")`) then aborts too and saves nothing,
and coming back to `/coach` without `?c=` starts empty. A separate block
(MXF2: Finish dock, rest timer, Analytics colours) may run at the same time
in another lane - stay inside FILES TO TOUCH. Design language: follow
`docs/design/mocks/motion/MOTION-DIRECTION.md` and the shipped MX primitives
(`client/src/components/motion/` - `SlidingIndicator`, `Cascade`) by name.
Do not edit `ROADMAP.md`; the reviewer keeps the MXC1 entry current.

SETH'S WORDS (Oct 10, the contract's intent):
- "If you start asking the coach a question and tab out, it resets the
  convo. When you first open the coach tab have a small announcement come
  up saying you can ask the coach a question and tab out and it will
  continue working. When you tab out it should have a screen similar to
  when you're resuming a workout saying it's working on it (or whatever
  prompt you choose), then when it's done have it say it's finished."
- "Move AI coach talk history to the History tab, make it look nice, it's
  kind of crammed in the Library tab." Ruling: a Workouts | Coach switch at
  the top of History.
- The masthead coach button shows a "..." inside the chat icon (the dots in
  `ChatBubbleIcon`-style glyph). He reads it as a glitch.

CHANGES:
1. The conversation survives leaving `/coach`. Move the ask/stream state
   (thread, streaming flag, conversation id, the AbortController, the
   weekly-cap bookkeeping the panel updates after an answer) out of the
   page-layout `CoachPanel` into an app-level provider mounted once above
   the routes (e.g. a `CoachSessionProvider` + hook under
   `client/src/context/`, following `ThemeContext`'s accessor pattern). The
   stream keeps running while you are on another tab; coming back to
   `/coach` shows the same conversation - mid-stream if still going,
   finished if done. Only Stop, New conversation, or logging out abort or
   clear it. Keep the active conversation id in sessionStorage so a reload
   reopens it through the existing `?c=` resume path (an answer that was in
   flight during a reload is lost - acceptable, server stays untouched).
   The non-page (sheet) layouts of `CoachPanel` (Analytics debrief etc.)
   keep working exactly as today - they may keep their local state.
2. First-open announcement. The first time a user opens `/coach` on a
   device, a small dismissible note says, in plain words, that they can ask
   a question, leave, and the coach keeps working and lets them know when
   it is done. Shown once (localStorage; new keys use the existing
   `workoutdb-` prefix - never rename existing keys). Never covers the
   composer or blocks typing.
3. "Coach is working" bar. While an answer is in flight and the user is NOT
   on `/coach`, show a persistent bar in the same language as
   `PersistentWorkoutBar` (the resume-workout bar): the coach crown (the
   `AiWait` crown) + "Coach is working on it" + a short snippet of the
   question; tapping it opens `/coach` on that conversation. When the
   answer finishes it flips to a finished state ("Coach answered - tap to
   read", or your wording; no em dashes) with one small motion beat; on
   error it says the coach could not answer and still opens `/coach`. It
   disappears once the user opens `/coach`, or when dismissed in the
   finished/error state. Visible on every page except `/coach`, Home
   included. It must NEVER overlap the workout bar, the Finish dock, the
   bottom nav, or an input with focus: where the bottom is taken (a live
   workout page) place it at the top under the masthead or as a compact
   chip - your call, show it in DELIVERY.md. It gets its own
   `view-transition-name` (rules in its own CSS file, copying how
   `shell-motion.css` keeps `.persistent-workout-bar` still during a route
   slide - do NOT edit `shell-motion.css`). Reduced motion: no beat, just
   the state change.
4. Coach history moves to History. Remove the Coach tab from Library
   (`MyTemplatesPage.jsx` - its tab button, panel and any "coach" tab
   branches; nothing else in Library changes). `SessionsPage.jsx` gets a
   Workouts | Coach switch at the top with ONE sliding selected indicator
   (`SlidingIndicator`, the same pill as Analytics' view tabs). Workouts is
   the default and is exactly today's History (MX6/MXF1 grow transform,
   month grouping, skeletons all unchanged). Coach shows the saved
   conversations as cards grouped by month the same way workouts are
   (title or first question, date, and whatever `CoachConversationList`
   shows today), newest first, with today's actions kept: open
   (`/coach?c=id`), delete one with its confirm, delete all with its
   confirm, paging/"load more", empty state with a link to ask the coach.
   Make it look designed, not a moved list: same card surface, spacing and
   type scale as the workout rows. The chosen side is remembered for the
   session (`?view=coach` in the URL is the clean way - your call) so Back
   from a conversation lands on the Coach side. Reuse or move
   `CoachConversationList` - your call; delete files that end up unused.
5. Masthead icon. Replace the masthead coach button's glyph (Home,
   `DashboardPage.jsx` `.coach-masthead-btn`) with one that has nothing
   inside the bubble that reads as a loading "...": e.g. a plain bubble, or
   the crown inside a bubble. Same size, hit area and aria-label. If the
   same dotted glyph is used elsewhere for the coach (the `/coach` intro
   mark), change it there too so they match.

GUARDRAILS:
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only - no server code change (the one app-guide sentence below
  is data). Tokens-only (check-hex clean); all 5 palettes x light/dark.
- Nothing the coach does today goes missing: suggested questions, help
  chips, weekly-cap copy, consent / unavailable notices, truncation notice,
  Stop, New conversation, `?c=` resume, the debrief/sheet layouts.
- THE LOGGER IS THE FLOOR: the bar never delays or covers logging.
- Navigation never waits on an animation.
- `prefers-reduced-motion: reduce` honoured for every new motion.
- Phone first (390px), no horizontal scroll.
- Do NOT touch `SessionDetailPage.jsx`, the analytics files, the logger,
  `index.css`, `shell-motion.css` or `RouteTransition.jsx` - MXF2 owns them
  and may be running in parallel. New styles go in the coach CSS files
  below or a new file under `client/src/styles/`.

FILES TO TOUCH:
- `client/src/components/coach/` (CoachPanel and new coach components)
- `client/src/pages/CoachPage.jsx`
- `client/src/context/` (new provider module only)
- `client/src/App.jsx` and/or `client/src/components/Layout.jsx` (mount the
  provider and the bar only)
- `client/src/components/library/CoachConversationList.jsx` (move / reuse /
  delete)
- `client/src/pages/MyTemplatesPage.jsx` (remove the Coach tab only)
- `client/src/pages/SessionsPage.jsx` (the Workouts | Coach switch and the
  Coach side only)
- `client/src/pages/DashboardPage.jsx` (the masthead coach glyph only)
- `client/src/styles/coach-page.css`, `client/src/styles/coach-history.css`,
  new files under `client/src/styles/`
- `client/src/lib/` (new modules only)
- `server/data/app-guide.md` (the coach's own help guide - line ~126 says
  "Earlier ones stay under Library, then Coach": point it at History, then
  Coach, and say in one short clause that the coach keeps working if you
  leave. The guide is 11,923 chars against a hard 12,000 cap
  (`server/test/lib/coachHelpMode.test.js`) - it must stay under 12,000;
  trim words elsewhere in that same paragraph if needed. Nothing else in
  the guide changes.)
Do NOT modify anything outside these files. `client/src/data/whatsNew.js`
is release HISTORY - do not edit it; the wave's What's New unit announces
the move.

ACCEPTANCE CRITERIA (machine-checkable; the reviewer also checks each item
in a real browser at 390x844 on the staging DB with the mock coach):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `npm run test:unit` from `server/` stays green (verbatim count).
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (gitignored `.playwright-mcp/` aside); no package changes
  and no server change other than `server/data/app-guide.md`.
- `wc -c server/data/app-guide.md` prints a number below 12000, and
  `rg -n "Library, then Coach" server/data/app-guide.md` returns nothing.
- `rg -n "abortRef.current\?\.abort\(\), \[\]" client/src/components/coach`
  returns nothing for the page layout (the unmount abort is gone or limited
  to the sheet layouts - DELIVERY.md says which).
- `rg -n "\"coach\"" client/src/pages/MyTemplatesPage.jsx` returns no tab
  branch; `rg -n "SlidingIndicator" client/src/pages/SessionsPage.jsx`
  finds the switch.
- DELIVERY.md walks these flows with evidence (DOM / state / screenshots
  where you can render): ask -> go to History mid-answer -> bar shows
  working -> answer finishes -> bar shows finished -> tap -> `/coach` shows
  the full exchange and the bar is gone; ask -> leave -> come back before it
  finishes -> stream still running; New conversation clears it; reload on
  `/coach` reopens the conversation via `?c=`; first-open note shows once
  and never again after dismiss; live workout page + working coach -> the
  bar does not overlap the workout bar, Finish dock, bottom nav, or a
  focused input (rects); History Coach side: open, delete one, delete all,
  load more, empty state; Back from a conversation lands on the Coach side;
  Library has no Coach tab.
- DELIVERY.md: one section per CHANGE item 1-5 with what changed, the file
  and lines, how it was verified, and anything not done marked PARTIAL with
  a "pick up here" note.

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
