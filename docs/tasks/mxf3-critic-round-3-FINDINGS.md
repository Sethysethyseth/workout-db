# Round 3 - focus: the coach flow end to end, then a whole-app "would this embarrass us" sweep

SCORE (focus area): 5/10   (Part 1 coach flow 5/10, Part 2 sweep 6/10; round = lower of the two)

The coach's happy path is good now: wait, stream, leave and come back, the bar on every tab, Read, reload and History all work, and the R1/R2 fixes mostly hold.
The failure paths break it. Opening another conversation (or tapping +) while the coach is working throws the answer away and saves nothing, and a failed status call leaves /coach with no composer and no message.
The sweep found one native confirm in a normal flow, a header that swaps and jumps when you open a workout, text-glyph "..." icons riding 5px low, and copy that sends people to a Library > Coach tab that no longer exists.

Method: a separate Playwright context (isMobile, hasTouch, DPR 2.625, Android Chrome UA) logged in as demo.critic. `page.on('dialog')` was registered: beforeunload accepted, everything else logged and dismissed.
Part 1 ran at 412x800 crimson dark, and the key steps again at 390x844 champ light. Part 2 ran at 412x800 crimson dark and 390x844 champ dark.
Rate limit: I read the `RateLimit` header on every /coach response. The lowest it got was 9 of 40 left, so there was no lockout.
Note: in dev, StrictMode fires every /coach GET twice, so each status, list or conversation load costs 2 of the 40.
Screenshots are in `round-3/`.

## Findings, ranked (P1 x2, P2 x7, P3 x11)

### R3-1 (P1) Opening another conversation, or tapping +, while the coach is working discards the question and the answer. Nothing is saved.
- Surface: bar "Coach is working on it" -> History > Coach -> open any row. Also /coach "+" mid-answer. 412x800 crimson dark (layout-independent).
- Repro A: /coach, + (new), ask a long question (~980 chars makes the mock stream ~4.5s). Tap History right away; it opens on the Coach side.
  Tap any older conversation within about 2s.
- Evidence A: question B was streaming (len 294, caret on). I opened c=15, which loaded 1 Q / 1 A. The bar vanished with no "could not answer".
  History > Coach was refetched afterwards (GET /coach/conversations): still 4 rows, and question B is gone for good. Shots `15-...`, `16-history-coach-after-abort-...`.
- Repro B: ask, then tap + at +1.4s (len 310, streaming). The thread clears to the intro with no confirm. Question C never reached History (list refetched, 4 rows).
  Shot `17-plus-mid-stream-...`.
- Why it matters: the first-open note tells people to "Ask a question, then leave this page". History > Coach is the natural place to wait, and opening an old chat there quietly kills the new one.
- Mechanism (confirmed in code): `CoachPanel.jsx:291-297` aborts the in-flight stream when `resumeConversationId` changes to another id.
  `reset()` -> `clearSession()` (`CoachSessionContext.jsx`) aborts too. The server stops on `res.on('close')` and only saves an exchange after a full, un-aborted stream (`coachController.js:409, 474-491`).
  So any client abort, a mid-answer reload included, throws the answer away.
  Fix idea: don't abort on navigation. Keep the stream in the provider and load the other conversation alongside it, or let the server finish and save after the client disconnects.

### R3-2 (P1) If /coach/status fails on load, /coach is stuck: the conversation shows, the composer is gone, there is no message and no retry
- Surface: reload /coach?c=<id> while /coach/status returns 429. The same path runs for offline, 5xx or a timeout. 412x800 crimson dark.
- Repro: with a conversation active, make /coach/status fail (I used a route stub returning the server's real 429 body) and reload.
- Evidence: after 2.5s the thread is there (2 messages) and `.coach-page__composer` is absent. `.coach-panel__notice` count is 0.
  The only button is "New conversation". Shot `44-status-429-with-thread-...`.
  Tapping + shows "The coach is taking a breather. Try again in a few minutes." but still no composer and no retry button. Shot `45-status-429-empty-...`.
  The page never retries on its own. The only way out is to leave and come back, which remounts the panel.
- Mechanism (confirmed): `showComposer` needs `!statusError` (`CoachPanel.jsx:682-683`). The status error notice only renders in the `thread.length === 0` branch (774-779).
  The status effect (248-262) depends on `[open, status]`, so a set `statusError` is never cleared or retried.
  Round 2 hit exactly this trigger (429 from reloading /coach).

### R3-3 (P2) Ask errors have no retry and wipe the question. A question over 1000 chars gets a misleading "couldn't reach its model"
- Surface: /coach composer. 412x800 crimson dark.
- Evidence: I pasted 1050 chars; the textarea has `maxLength -1` and no counter. Send -> server 400 `question must be at most 1000 characters`.
  The UI says "The coach couldn't reach its model. Try again." and the input is emptied (value length 0). Retrying can only fail the same way.
  Shot `27-long-question-400-...`. Offline: "Couldn't reach LogChamp. Check your connection and try again." (calm), but again no retry and the text is cleared. Shot `25-...`.
  429 (stubbed): "The coach is taking a breather..." (calm).
- Guess: `coachApi.js:258-260` maps `data.error` (a sentence) to `code`, and `coachErrorMessage` falls back to provider_error. `ask()` calls `setInput("")` before the request.
  Fix: cap the input at 1000 with a counter, map a 400 to a real message, add a Retry on the failed bubble (or put the text back).

### R3-4 (P2) Bottom nav on a live quick workout raises a native `window.confirm`
- Surface: /sessions/:id (live quick workout). 412 crimson dark.
- Evidence: Home, Analytics, History, Library and Profile each raised `confirm: "You have a workout in progress. Leave this screen? You can open it again from the home screen."`
  That is 5 of 5 tabs. Leaving another way does not ask at all: the in-page Back, browser Back, and the coach chip's Read all leave without asking.
  The discard flow uses in-app panels. This is the R1 "Home does nothing" outside-focus item, now confirmed as a native box.
- Guess: `confirmLeaveLiveSession()` in the nav click handler. Swap it for the in-app confirm panel, or drop it, since Back already leaves freely and the workout is autosaved.

### R3-5 (P2) Opening a workout from History: the header swaps title and jumps 46px down
- Surface: History > any row -> /sessions/:id summary. 412 crimson dark, also seen at 390.
- Evidence: rAF trace after the tap. At +194ms the header is "Lower A / Tue 14 · 7:17 PM / Top set 180 lbs x 10", top 12, no Back button, over 6 stat skeleton tiles.
  At +528ms it becomes "Back / Workout summary / Finished Jul 14, 7:17 PM", head top 58, 5 stat tiles.
  Layout-shift entry 0.0076 `session-detail-head__text 12->58`. The workout's name ("Lower A") disappears from the loaded header altogether.
  Shots `33a-session-open-placeholder-...` and `33b-session-open-loaded-...`.
- Guess: the optimistic header from the list row (SessionDetailPage) has a different layout from the loaded summary. Render the same head in both states, with Back included, and keep the name.

### R3-6 (P2) Block builder "..." menus are text glyphs that sit about 5px low in their circles
- Surface: Library > New block: header "Builder menu" (40px circle) and each day's "Day N actions" (32px). 412 crimson dark.
- Evidence (pixel ink centre vs host): Builder menu (−0.19, **+5.14**), Day 1 actions (0, **+4.76**). innerHTML is the text "…".
  This is the R2-3 class that MXF5 fixed elsewhere (discard x, stepper, chevrons are SVG now). Shot `38-builder-...`.
- Fix: a 24-box SVG (three dots) like the nav icons.

### R3-7 (P2) Copy still says coach history lives in "Library, under Coach". It moved to History > Coach and Library has no Coach tab.
- Profile > AI access: "Your coach conversations are saved to your account. Find or delete them in Library, under Coach." (`AiConnectorPage.jsx:411-412`).
- What's New (Oct 9 entry, the top of `?preview=1`): "Chats are saved under Library, then Coach." The "Saved coach conversations" item says "Library has a Coach tab" with where "Library, then Coach".
  (`data/whatsNew.js:54, 111-113`). Release notes that point to a tab that doesn't exist are the "lol" class.

### R3-8 (P2) Coach wait pill: "Thinking..." sits 5px above the dots and the pill's centre line
- Surface: /coach right after every send. 412 crimson dark and 390 champ light.
- Evidence: pill centre 617.1, dots centre 617.1, text line box centre **611.8** (412). At 390: pill 172.6, dots 172.5, text **167.3**. Shot `03-coach-wait-412-crimson-dark.png`.
  This is the same off-centre family as the masthead icon Seth flagged, and it shows on every question.
- Guess: `.coach-page-wait` centres the dots, but `AiWait variant="status"` brings its own line-height or margin, or a second (empty) line. Align the copy to the dots' centre.

### R3-9 (P3) Coach bar dismiss "x" is still a text glyph, 1.7px low
- `.coach-working-bar__dismiss` = `<span>×</span>` at 21.6px system-ui. Ink offset (0, **+1.71**) in its 44px box. MXF5 converted the Home card x and the workout bar x, but missed this one.

### R3-10 (P3) Read lands on the tail of a long answer
- Surface: bar "Coach answered" -> Read. Answer ~1450 chars at 412: the scroller is pinned to the bottom (gap 0), so the question and the answer's first ~10 lines are off-screen.
  Shot `20-read-from-live-...`. The page already has `placeAnswerStart` for live answers; Read should land on the answer's start too.

### R3-11 (P3) The bar has no enter or exit motion, and the flip changes its height
- The bar appears on the first frame after the route commit and disappears instantly (`getAnimations()` on the bar: none, in all samples).
- Working -> answered: height 56 -> 62 and top 724 -> 718 (390) in one frame. The only motion is the crown beat (480ms, peak scale 1.18).
  This meets the MXC1 contract ("one small motion beat") but reads as a pop next to the MX wave's motion.

### R3-12 (P3) History > Coach list doesn't refresh when the answer saves
- I asked at 390 and went to History > Coach mid-answer. The bar flipped to "Coach answered", but the list (fetched before the save) still lacked that conversation (c=18). Shot `51-bar-answered-history-390-champ-light.png`.

### R3-13 (P3) Workout summary exercise titles still ragged (R2-9 not fixed)
- Titles left at 57.27 (01) vs 59.72 / 60.09 / 59.78 / 60.14 (02-05). The index has `tabular-nums` now, but widths are still 14.27 vs 16.72-17.14, so the font has no tnum.
  Give the index a fixed width instead.

### R3-14 (P3) Library: the running-strip skeleton is 58px but the strip is 71px, so tabs and list jump 13px at about +1.3s
- Trace: `skeleton__bar 106/58` -> `bk-lib-running 106/71`; nav-row 174->187, type-tabs 230->243, list 284->297. Layout-shift entry 0.475.
  Shots `34-library-...` and `35a-library-skeleton-...`. The first paint also listed "R2 SKELETON" first; after load the running block "PHASE 1" is first.

### R3-15 (P3) Profile > AI access jumps 66px when the coach status line arrives
- Layout-shift 0.0202: `settings-section 665->731`, `ai-key-details 578->644`. This page's status fetch also counts against the coach limit.

### R3-16 (P3) Copy
- Em dashes: "Live session — updates save as you go. One-time session." (live logger), the auto-name "Workout — Oct 11" in the in-progress bar,
  and "One-time session—saved in History only, not as a reusable workout." (summary).
- "2 set(s) in this range had an unresolved exercise name" (Analytics > Data quality).
- Analytics chip "Why has lats gone quiet?" should be "have".
- Home: "No workouts yet in the last 7 days - the 7 days before you logged 2." (2 what?)
- Library: "Create workout PARKED". "Parked" is roadmap jargon to a lifter.

### R3-17 (P3) Small tap targets in primary flows
- "← Profile" back link is 76x28 on all 6 Profile sub-pages and What's New. Home "See analytics →" is 83x17 and "View all → History" 99x17.
- Run page "Library" link is 53x16. The Analytics range pills are 85x36.

### R3-18 (P3) Builder name field: no inner padding, autofocused
- `input` padding 0, border none, 2px outline at offset 2. The placeholder "Name this block" sits about 4px from the focus ring. It is focused on open, so on a phone the keyboard comes up as soon as you tap New block.
  Small: the coach "+" calls `focus()` on the textarea, but `activeElement` stayed BODY.

## Native dialogs seen (every one)

| Flow | Dialog |
|---|---|
| Bottom nav (any of 5 tabs) from a live quick workout | `confirm`: "You have a workout in progress. Leave this screen? You can open it again from the home screen." (x5, R3-4) |
| Full reload / goto from a live workout | `beforeunload` (expected, accepted) |
| Discard workout (Home x and in-page x), delete conversation, builder Back, coach Read from a live workout | none (in-app panels or silent) |

## Checked and clean

| Check | Measurement |
|---|---|
| First-open note | shown on the first /coach open in a fresh context (16,64 380x79); key `workoutdb-coach-keeps-working`=seen written on show; not shown after client nav or a full reload |
| Ask a suggestion: wait -> stream -> done | dots at +66ms, first text +911ms, done +2616ms; Stop during, send after; ?c=14 written at meta; scroller gap 0 |
| Bar on tab switch mid-stream | History: "Coach is working on it" 48ms after the route commit; Analytics: flips to "Coach answered" |
| Bar vs bottom nav, all 5 tabs | 412: bar 674-736 vs nav 744; 390: 718-780 vs nav 788; place=bottom everywhere |
| Bar vs last list row | History at max scroll: last card bottom 652 < bar top 674 |
| Bar vs Finish dock (live quick workout) | chip place=top 8-66, `--coach-working-chip-h` 66px, sticky heading top 66px (R1-5 holds), dock 625-744 clear |
| Error bar (ask fails off-page) | "Coach could not answer" / Open / x; Open -> /coach?c=16 with the error under the question |
| Read opens the exchange | /coach?c=14: 2 Q / 2 A, no refetch, bar cleared |
| Leave + come straight back mid-stream | /coach?c=14: 3 Q / 3 A, no duplicate, no blank, caret still writing (len 425 -> 447) |
| Reload /coach?c=14 | "Opening that conversation..." at +348ms, 3 exchanges at +966ms, scrollTop 547/1154 (gap 0) |
| New conversation (+) | URL /coach, session id cleared, intro + 4 chips |
| History > Coach | "October 2026 / 5 conversations"; open then Back -> /sessions?view=coach with Coach pressed; side remembered |
| Delete one conversation | in-app panel, 204, list and count update, no native dialog |
| Delete the ACTIVE conversation | session cleared; /coach shows a clean empty state, not a stale thread |
| Composer vs keyboard (edge + chrome, 412) | composer bottom 498 vs kbTop 500 (edge), 728 vs 730 (chrome); no overlaps |
| Reduced motion | no crown beat on the flip; routes use a 160ms fade; nothing slides |
| Rapid taps (4 tabs in 843ms) + Back mid-transition | settles on /profile, correct h1, active tab right, no transformed pages or running animations at +1.2s |
| Copy scan (em/en dash, undefined/NaN/null, "1 sets") | clean on Home, Analytics (4 views x 4 ranges), History, Library, run page, Profile + 5 sub-pages, What's New, except R3-16 |
| Horizontal overflow | scrollWidth == viewport on every page at 390 and 412 |
| Console | no page errors; flushSync warning x36 (known, not re-reported); 401 x2 at /login (pre-auth); the rest were errors I induced |
| R1-1 quick search under keyboard | FIXED: field 279-324, list 328-471 (143px), kbTop 500, results visible |
| R1-2 field unmounted on first keystroke | FIXED: weight "135" draft promoted with focus kept; reps "5" kept, focus held 2.1s |
| R1-3 resume opens every list | FIXED: 0 open lists at 0.4/1/2/3s after Resume (full reload) |
| R2-1 white on accent | FIXED: forest dark send 10.25:1; Library GO dark on salmon |
| R2-2 chart card padding | FIXED: h2 inset 15px |
| R2-3 glyph icons | FIXED: discard x, stepper -/+, Profile chevrons are SVG. Still open: bar x (R3-9) and builder "..." (R3-6) |
| R2-4 Stop label | FIXED: centre offset -0.01px |
| R2-5 iron light accent text | FIXED: nav active `--color-interactive-ink` #92400e (~7.8:1) |
| R2-13 native radios | FIXED: color-scheme dark, radios dark grey |
| Weekly cap copy | account has no cap (`weeklyCap` null). Copy read in code: "N of 7 questions left this week" and "...Your next question frees up Sun at 9:00 AM." Both read fine |

## Outside focus

- Dev StrictMode doubles every /coach GET, so dev burns the 40/15min budget twice as fast (status, list, conversation). Worth knowing before the next critic run.
- Within one session, reopening a conversation from History shows the client cache, including failed Q + error pairs that the server never saved (c=16 showed 5 exchanges; the server had 1).
- /coach shows no in-progress workout bar while a workout is live. The only ways back are Home or History. Possibly intended.

## Housekeeping

- Coach: I created c=14, 15, 16, 17, 18, 19 and deleted every one individually from History > Coach. c=12 and c=13 (Sat 10, not mine) were left alone. "Delete all" was never used.
- Workouts: /sessions/522 (empty quick) was discarded via Home x + panel. /sessions/523 (Bench 135x5) was discarded via the in-page x + panel. Home shows "Start empty workout" and no Resume.
- Nothing was finished, imported or saved. The builder was opened, nothing typed, then Back. No account settings changed.
- Appearance was only changed inside my separate context (localStorage + attributes), set back to dark / champ before I closed it. The main MCP context's localStorage reads dark / champ.
  Reduced-motion emulation was reset. The context is closed, leaving 1 browser context.
- Rate limit: the lowest reading was 9 of 40 remaining. No lockout.

## Skipped

- iOS and content keyboard models on /coach (did edge + chrome). At 390 champ light I repeated the ask / wait / bar / motion steps but not reload or History.
- The R1-2 ghost-row variant (Repeat last is off on this account). Import: Paste tab only, looked at but not exercised.
