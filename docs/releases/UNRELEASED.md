# UNRELEASED - What's New ledger (single writer: Claude Code)

Shipped work waiting for release notes. The What's New lane
(`docs/tasks/_WHATS_NEW.md`) turns this into `RELEASES` entries at wave end.
Then Claude Code moves the consumed sections VERBATIM to
`docs/releases/RELEASED.md` (newest first) and resets this file to its
header. Process of record: `docs/specs/quality-of-life-wave.md` section 4.

Entry format, one per user-facing landing (`land-unit` section 5 appends
it):

`- [<unit>] <what changed, plain words> | Where: <tap path> | Files: <1-3 key UI files the writer should read>`

Write what a lifter would notice. Internal-only work gets no entry.

---

## Catch-up: on prod since Oct 7, 2026, never announced

Everything below merged to `main` between Aug 6 and Oct 7 but has no
release entry (the last is `2026-08-ai-assistant`, Aug 5). The writer
releases it as ONE catch-up entry dated 2026-10-07.

- [bk5/bk8/sr3-1] Build training blocks: weeks of planned workouts with sets, reps, weight, rest, timed sets and effort targets, then run them day by day; switching blocks pauses the old one and you can resume or start over | Where: Library, then Blocks; Home shows the running block under Start a workout | Files: client/src/components/blocks/builder/BlockBuilder.jsx, client/src/pages/BlockRunPage.jsx, client/src/components/blocks/run/UpNextCard.jsx
- [bks2/bk9] Block days log one row per planned set, with the plan shown as grey hints; tap a set number to log it as planned | Where: start a block day | Files: client/src/components/blocks/log/BlockSetRow.jsx, client/src/components/blocks/log/BlockExerciseCard.jsx
- [bk6/bks4/bks1] Import a block from a spreadsheet, Excel file or pasted text, or turn your workout history into a block; AI can read messy sheets and fix a file that won't import | Where: Library, then Import | Files: client/src/pages/ImportBlockPage.jsx
- [bk12] The coach can draft a block from a description | Where: the block builder, Draft with the coach | Files: client/src/components/blocks/builder/CoachDraftCard.jsx
- [8455059/bkr2/cq1] An in-app coach explains your numbers on Analytics and debriefs a finished workout; it stays on training topics and has a weekly limit of 7 questions | Where: Analytics, Ask about these numbers; a finished workout, Debrief this workout | Files: client/src/components/coach/CoachPanel.jsx
- [d28989b] Create your own colour palette with AI | Where: Profile, then Appearance | Files: client/src/pages/profile/AppearancePage.jsx
- [bks3/bksf1d] A redesigned Library with your blocks first, and your running block at the top | Where: Library | Files: client/src/pages/MyTemplatesPage.jsx
- [sr3-4/sr3f3] Add an exercise that isn't in the catalog to your library straight from the builder or an import | Where: block builder search, Add to your library | Files: client/src/components/workout/AddExerciseToLibrarySheet.jsx
- [sr3-6] Hold a day or week to drag it into a new order | Where: block builder | Files: client/src/components/blocks/ui/useHoldToReorder.js
- [sr3-5] Mark a block exercise as per side to log left and right | Where: block builder, exercise card, Per side | Files: client/src/components/blocks/builder/ExerciseCard.jsx
- [wd1] Discard a workout you started by mistake | Where: the x at the top of a live workout | Files: client/src/pages/SessionDetailPage.jsx
- [bkr5] Home leads with Start a workout, and your running block sits right under it | Where: Home | Files: client/src/pages/DashboardPage.jsx

## quality-of-life-updates (wave opened Oct 8, 2026)

<!-- land-unit appends one entry per user-facing landing below this line -->
- [qol5] Importing workout history with more than 7 different workouts no longer fails: your 7 most-logged are kept and the skipped ones are named. Very large pastes to the AI import get a clear "too large" message instead of an error code | Where: Library, then Import | Files: client/src/pages/ImportBlockPage.jsx, client/src/components/blocks/import/ImportPreviewStep.jsx
- [qol3] In the block builder, press and hold an exercise to drag it to a new spot; the day shrinks to one line per exercise while you move it | Where: Library, then Blocks, then edit a block | Files: client/src/components/blocks/builder/BlockBuilder.jsx, client/src/components/blocks/builder/ExerciseCard.jsx
- [qol8] Edit exercises you created: rename them or change which muscles they work; past workouts pick up the new name. Library also shows each tab as soon as it is ready instead of waiting on everything | Where: Library, then the Exercises tab, then tap an exercise | Files: client/src/components/library/LibraryExerciseCard.jsx, client/src/components/workout/AddExerciseToLibrarySheet.jsx
- [qol2] Your logging settings now live in one place instead of inside the workout screen: lbs or kg, RIR or RPE, exercise and set notes, plus two new options (repeat last time's numbers, rest timer). A strip under Start a workout shows your current setup and opens the settings | Where: Home, the strip under Start a workout; or Profile, then Training | Files: client/src/components/prefs/TrainingPrefsForm.jsx, client/src/components/prefs/TrainingPrefsStrip.jsx, client/src/pages/profile/TrainingPage.jsx
- [qol9] The block builder is easier to read: long block names fit on their own line, every menu looks the same, "Per side" only shows on one-sided lifts (you can still turn it on for any lift), the selected week is no longer a bright white bar, and the add-exercise search shows your recent exercises before you type | Where: Library, then Blocks, then edit a block | Files: client/src/components/blocks/builder/BlockBuilder.jsx, client/src/components/blocks/builder/ExercisePicker.jsx
- [qol4] You can finish a workout even if some sets have no RIR or RPE: you get a short warning that those sets won't count toward effort stats, and can finish anyway or go back and add them. You can also discard a workout you started by mistake straight from Home or the In progress bar, with a confirm first. Confirmations now appear inside the app instead of browser pop-ups | Where: the Finish workout button; the x on the Home In progress card | Files: client/src/components/ConfirmPanel.jsx, client/src/components/workout/ActiveWorkoutHero.jsx, client/src/components/workout/PersistentWorkoutBar.jsx
- [qol6] The coach now has its own page and can help you find your way around LogChamp, even if you haven't turned on AI access (it then sees only your question, never your training). With AI access on, it answers training questions there too. The first answer shows clearer progress while it thinks | Where: the chat bubble at the top of Home; or Profile, then Coach | Files: client/src/pages/CoachPage.jsx, client/src/components/coach/CoachPanel.jsx, server/data/app-guide.md
- [qol7] Turn on Repeat last time's numbers and every empty set shows what you lifted last time, greyed out. Tap the set number to log those numbers, or type your own. It never fills in effort, and nothing is saved until you log it. On a block day the plan still comes first; last time only fills in a weight the plan left blank | Where: Profile, then Training (or the strip on Home), then Repeat last time's numbers; then any workout | Files: client/src/pages/SessionDetailPage.jsx, client/src/components/blocks/log/AsPlannedControl.jsx
- [qol13] Small fixes: on the Crimson palette, good results now show in green instead of an amber that looked like a warning; on a computer the In progress bar lines up with the page instead of stretching across; Execution shows whole numbers (3 x 8, not 2.67 x 7.5); and after your phone clears site data you no longer see the login screen flash before you are signed back in | Where: Analytics (Execution); Profile, then Appearance, then Crimson | Files: client/src/lib/executionVerdict.js, client/src/components/ProtectedRoute.jsx
