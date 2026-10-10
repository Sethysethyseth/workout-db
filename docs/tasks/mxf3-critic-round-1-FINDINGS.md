# Round 1 - focus: every place you type, keyboard up

SCORE (focus area): 3/10

/coach is now genuinely fixed: composer 2px above the keyboard in all 4 models, both viewports, every state, and it restores cleanly.
But the quick workout logger - the screen a lifter types into most - fails the rule three ways: search results open under the keyboard
(0px on Seth's phone), the set field you're typing into gets unmounted ~1.2s in (keyboard drops, digits lost), and resuming a workout opens every suggestion list over the set fields.

Method note: tests run in a separate Playwright context with isMobile + hasTouch +
DPR 2.625 + Android Chrome UA (pointer: coarse, overlay scrollbars), so widths match
a phone (no 15px desktop scrollbar). Shim + measuring helpers re-injected after
every full load. Phone pass = 412x800 crimson dark; house pass = 390x844 champ dark.

## Findings, ranked (P1 x3, P2 x1, P3 x3)

### R1-3 (P1) Resuming a quick workout opens EVERY exercise's suggestion list over the set fields - tapping Weight swaps the exercise
- Surface: quick logger after Home > "Resume workout" (also full reload of /sessions/:id). 412x800 crimson dark. No keyboard needed.
- Repro: start an empty workout, pick exercises from search (I had Bench, Squat, Curl, Lunges, Pushdown), go Home
  (full load), tap "Resume workout", wait ~2s, tap Set 2 Weight of Barbell Squat.
- Evidence: at +400ms no lists; at +1900ms all 5 `.exercise-picker-suggestions` are open with items (Squat list
  391px tall, display block, nothing focused). The page restores scroll to the Squat card, so the list sits over the
  set rows: `elementFromPoint` at the centre of Weight (293-334) -> SPAN "Barbell Squat To A Bench", Reps -> BUTTON
  "Barbell Squat To A Bench". A real touch tap at (129,314) left focus on BODY and RENAMED the exercise to
  "Barbell Squat To A Bench". Screenshots: `25-quick-resume-lists-412.png`, `23-coach-working-logger-412-chrome.png`.
- Guess (fairly confident): `SessionDetailPage.jsx` 656-689 - the search effect runs on mount with `name` = the saved
  exercise name (>= 2 chars) and calls `setSuggestionsOpen(results.length > 0)` without checking that the name
  input is focused or that the user typed. Gate opening on focus / a user edit, not on mount.

### R1-1 (P1) Quick logger: exercise search results open UNDER the keyboard - zero results visible
- Surface: quick workout logger (/sessions/:id), first exercise's "Exercise name" search. 412x800 crimson dark, chrome model.
- Repro: Home > Start empty workout > tap "Exercise name" (field sits at 539-583, below the keyboard line) > type "bench".
- Evidence: after focus the browser scrolls the field to just above the keyboard (field 452-496, kbTop 500, scrollY 87).
  The suggestions list opens downward: `.exercise-picker-suggestions` rect 500-509.6, inline `max-height: 0px`,
  scrollHeight 432 (10 matches exist). Nothing is visible and nothing is tappable. The user only sees results by
  dragging the page up with the keyboard open (scroll +150 -> max-height 149px; +300 -> 449px, but then the field
  sits under the sticky exercise heading 0-44). Screenshots: `12-quick-search-412-chrome.png`,
  `13-quick-search-412-chrome-after-manual-scroll.png`. Contrast: the 2nd exercise's search (field at 166 after
  "+ Add exercise" scrolls) gets 284px of list and works (`15-quick-search2-412-chrome.png`).
- Seth's phone (edge model, overlaysContent off outside /coach): list rect 500-523, max-height 23px - the clamp uses
  `vv.height` (524, over-reported by the 24px inset), so the 23px it allows is itself behind the keyboard (`50-quick-search-412-edge.png`).
- House pass 390x844 champ, chrome AND ios: field 496-540, kbTop 544, list 544-553.6, max-height 0px, 10 items
  (`30-quick-search-390-champ-chrome.png`, `...-ios.png`).
- Caveat: the shim scrolls minimally (field ends 4px above the keyboard), as iOS Safari does. If Android Chrome
  centres the field instead, the list gets ~250px; either way the list never flips above or scrolls the field up.
- Guess: `SessionDetailPage.jsx` ~690-725 clamps the list to `vv.offsetTop + vv.height - listTop` (correct) but
  nothing moves the field up when that clamp is tiny - needs a "scroll field to top of visible band" on open, or
  flip the list above the field when space below < ~150px.

### R1-2 (P1) Quick logger: the set field you are typing in is unmounted ~1.2s after the first keystroke - keyboard drops, next digits are lost
- Surface: quick logger, FIRST entry into an un-logged (draft / "last time" ghost) set row. 412x800 crimson dark, chrome model.
- Repro A (no history exercise): + Add exercise > pick "Barbell Curl" > tap set 1 Weight > type "25" > pause.
  Trace: focused at +200ms; at +1700ms `activeElement=BODY`, the original input `isConnected=false`, keyboard closed.
- Repro B (exercise with "last time" ghost rows): + Add exercise > "Dumbbell Lunges" (3 ghost rows) > type "13" in
  the LAST row's Weight. At +1132ms still focused, at +1318ms BODY / disconnected; a "5" pressed right after went
  nowhere. The logged row then JUMPS from set 3 to the top (now @380 as Set 1; ghost rows re-render below it).
- Also seen on Barbell Squat set 1 (ghost rows): weight "135", then tap Reps and type "5" within ~1s -> focus
  BODY and the "5" is GONE: `19-quick-closed-rest-412.png` shows Set 1 Weight 135 with Reps empty (amber "missing"
  state). So this is data loss, not just a keyboard flicker: a lifter typing weight-then-reps at normal speed loses reps.
- Not seen on rows that already exist server-side (set 2 created by "+ Add set": focused through +2583ms).
- Evidence: screenshots `20-quick-after-focus-drop-412.png` (row moved to top, keyboard gone).
- Guess: `SessionDetailPage.jsx` ~2170-2300. Draft/ghost rows render in a different branch with keys
  `session-set-slot-<se>-ghost-<i>`; after `onPromoteDraft` autosaves, the real set renders in the sortedSets
  branch keyed `session-set-slot-<se>` / `s.id`, so React unmounts the focused input (and logged sets sort
  first, which moves the row). Keep the same element across promotion (stable key + same branch) or restore focus.


### R1-4 (P2) Block builder exercise picker: list does not shrink for the keyboard - "Use 'x'" / "Add 'x' to your library" sit under it
- Surface: Library > New block > + ADD EXERCISE picker sheet. 390x844 champ dark, chrome model.
- Repro: open the picker (search autofocuses, keyboard up), type "squat", scroll the results to the end.
- Evidence: `.bk-picker__list` 250.8-824 (clientHeight 573, scrollHeight 2057) while kbTop is 544, so the list's
  last 280px are always behind the keyboard. Scrolled to the end: "Use 'squat'" 733-777 and "Add 'squat' to your
  library" 781-825, both below 544 - unreachable while typing. The top results are fine (Barbell Squat 251-295).
  Screenshots: `34-builder-picker-search-390-chrome.png`, `35-builder-picker-scrolled-end-390-chrome.png`.
- Guess: the `.bk-sheet--picker` is a full-height fixed sheet (0-844) with no visualViewport fit; size it to
  `vv.height` (or add bottom padding = keyboard height) while the keyboard is open, as /coach now does.

### R1-5 (P3) Coach "working / answered" chip sits on top of the logger's sticky exercise heading
- Surface: live quick workout with the coach working (MXC1 item 9). 412x800 crimson dark.
- Evidence: `.coach-working-bar-wrap` 0-52 (working) / 0-66 (answered) over `session-exercise-heading-sticky` 0-44;
  the exercise name and its delete icon are hidden while the chip shows (`25a-where.png`). The focused set field
  (294-335) was NOT covered, Finish (621-744) and nav (744-800) were clear, so item 9 itself holds.
- Guess: the sticky heading's `top` ignores the chip height; offset it by the chip (CSS var) while the chip shows.

### R1-6 (P3) /coach?kbdebug=1 readout is legible but sits on the title and pans away with the page
- 10px monospace on a 92% opaque surface, pointer-events none, z 40, fixed 8-143 x 8-185: readable, but it covers
  "Coach" and the first message's label. In pan models (chrome without the VK API, iOS) it is position:fixed to
  the layout viewport, so it is under the pan band exactly when you want to read it (`07-coach-cold-c9-kbdebug-412-chrome.png`).
  On Seth's phone (edge model, no pan) it is visible (`07-...-edge.png`). Pin it to `vv.offsetTop` if it matters.

### R1-7 (P3) "Add a workout note" reveals the textarea but doesn't focus it
- Quick logger, 412 crimson: after the tap `document.activeElement` is BODY; the note textarea (370-466) needs a
  second tap to bring the keyboard up. Once focused it is clean (370-466 vs kbTop 500, no move).

## Checked and clean

| Surface | Viewport / model | Measurement |
|---|---|---|
| /coach empty (suggestions) | 412 chrome/ios | textarea 682-726, composer bottom 728, kbTop 730 (2px), send 682-726 full; pan 230 |
| /coach empty | 412 edge/content | textarea 452-496, composer bottom 498, kbTop 500; nav display:none while open |
| /coach conv c=9 (3 exchanges) | 412 all 4 models | composer 2px above kbTop every model; message list pinned to bottom (scrollGap 0-1) |
| /coach multi-line (8 lines) | 412 edge/chrome/ios | textarea grows 44->158 then scrolls inside (scrollH 258); bottom stays 496/726; send stays 452-496/682-726 |
| /coach?c=9 cold + kbdebug | 412 edge/chrome | composer 498/kbTop 500 (edge, source virtualKeyboard), 728/730 (chrome, source baseline) |
| /coach first-open note | 412 edge/chrome | note 64-142 in flow, scroll shrinks to 152-441; composer 2px above kb |
| /coach conv + empty | 390x844 champ, all 4 models | composer bottom 542 vs kbTop 544 (edge/content), 772 vs 774 (chrome/ios) |
| Quick logger set 1 weight/reps/effort (ex 1) | 412 chrome | weight 929 -> 379-420 after focus (doc scrolled), reps 379-420 no jump, effort 472-512 -> 456-496 (16px); no overlaps |
| Quick logger LAST set of last exercise | 412 chrome + ios | effort 338-378, weight/reps 244-285, kbTop 500, 0px move on focus, no overlaps |
| Quick logger workout note textarea | 412 chrome + ios | 370-466 vs kbTop 500, no move, no overlaps |
| Quick logger chrome while typing | 412 | html.bk-log-kbd hides nav, in-progress bar, Finish dock, rest bar (rest display:none while typing) |
| Quick logger keyboard close | 412 | nav 744-800 + dock 621/626-744 back, bk-log-kbd removed, scrollY unchanged, rest bar 630-684 shows |
| Block day logger (W1 Lower - Hip Dominant) | 412 crimson chrome + ios | workout note 441-525 (pan 30, kbTop 530); last set Seconds/Weight/RPE 183-227; ex1 reps -2429 -> 318-362 via app scroll; no fixed overlaps; nav/dock/bar hidden |
| Block logger typing persistence | 412 chrome | typed "95" in ex2 set1 Weight, focus held 2.5s (no remount, unlike R1-2) |
| Block logger "Log set 1 as planned" with keyboard up | 412 chrome | button 474 < kbTop 500, tap logged it, keyboard closed, scrollY 383 unchanged, dock + nav back |
| Block day logger | 390 champ chrome + ios | note 485-569 (kbTop 574, pan 30), last RPE 227-271, ex1 reps 340-384, first secs 339-383; no overlaps |
| Coach working + live logger | 412 chrome | chip 0-52/0-66, focused weight 294-335 uncovered, Finish 621-744 + nav clear |
| Block builder name field | 390 champ chrome | 64-100 inside sticky header, kbTop 544 |
| Block builder lowest set (Set 7 reps/load) | 390 chrome + ios | 464.8-508.8 before and after focus (0px move), kbTop 544; Set 1 reps 176-220; nav back 788-844 on close |
| Builder picker search field | 390 chrome | 195-239 autofocused, top results 251-535 visible above kbTop 544 |
| keyboard close, /coach | both viewports, all models | composer back to 744/788, nav back 744-800/788-844, html.coach-kbd removed, inline height cleared |
| Profile > Feedback textarea | 390 champ chrome + ios | 308-411 vs kbTop 544, no move, no overlaps |
| Login (2 fields) | 412 crimson + 390 champ, chrome + ios | password 455-499 vs 500 (412), 477-521 vs 544 (390); no pan, no overlaps |
| Register (4 fields) | 412 + 390, chrome + ios | lowest 551-595: pan 99, kbTop 599 (412); 573-617 pan 77 (390); none covered |
| Import paste textarea | 412 crimson chrome + ios | 191-443 vs kbTop 500; 14 pasted rows scroll inside (h 250) |
| Create-exercise sheet ("Add to your library") name | 390 champ chrome + ios | 395-439 vs kbTop 544, no move |
| No typable fields (nothing to fail) | - | Profile > Training (stepper = buttons), Logging setup sheet (TrainingPrefsForm has no inputs), AI access (no key field exists now), History, Library filter |

Skipped / not covered: edit-exercise sheet (the account has 0 custom exercises; making one means saving).
Quick logger checked at 390 only for the search (R1-1); block logger, builder, login, register, coach at both.

## Outside focus

- Bottom-nav "Home" tap does nothing on a live quick workout (/sessions/505 stayed put after two taps; Home from /coach works).
- /coach (no ?c=) after a full reload reopened the last conversation instead of the empty state - may be MXC1 intent.
- Coach empty-state suggestion cards run under the overlay scrollbar at the right edge (border clipped ~x 375).
- Shim quirk: in the chrome model it drew "panned off-screen 0px" for a 1.5e-5 px pan (`state.offsetTop > 0` float noise).

## Housekeeping

- Coach: c=9 ("Is my push and pull volume balanced?", 3 exchanges) and the working-test conversation ("Give me a
  long detailed answer...") - both DELETED one by one from History > Coach. "Delete all" never touched. History > Coach empty after.
- Quick workout /sessions/505 (5 exercises, test sets) - DISCARDED via Home x + confirm.
- Block day /sessions/506 (W1 Lower - Hip Dominant, 1 set logged as planned) - DISCARDED.
- Quick workout /sessions/507 (empty, search test at 390) - DISCARDED.
- Quick workout /sessions/508 (empty, edge search test) - DISCARDED. Home shows "Start empty workout", no Resume.
- New block in builder: typed name + 1 exercise, never saved; its local "unsaved changes" draft was Discarded. Library
  still BLOCKS 4 / WORKOUTS 0 / EXERCISES 0. Create-exercise sheet typed in, closed, never saved.
- Nothing finished, imported, sent or saved. No settings changed.
- Testing ran in a separate isMobile/hasTouch context (closed at the end). Palette/mode were only ever set as
  attributes; the original MCP tab is reloaded on / with data-palette=champ, data-theme=dark, localStorage
  workoutdb-palette=champ / workoutdb-theme=dark (unchanged). Its viewport is left at 412x800.
