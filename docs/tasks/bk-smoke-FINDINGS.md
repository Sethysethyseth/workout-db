# BK wave smoke - FINDINGS (Seth, staging Vercel, started Sept 30 2026)

Checklist: `docs/HANDOFF.md` -> "Wave smoke checklist - BK". Severity: P0 broken/data
loss, P1 blocks him, P2 friction, P3 polish. CR = change request (new scope, not a
defect against the BK contract).

## Results

1. Import - result pending (Seth went straight to change requests CR1-CR4 below).

## Change requests raised during the smoke (Sept 30)

- **CR1 - Import any format.** The importer only understands our column
  headers. Seth wants people's own spreadsheet layouts to import. His idea:
  an algorithm sifts the file, and if that is too inconsistent an AI does
  it. AI import should later be a paid benefit; for now it costs 3 of the
  7 weekly coach uses.
  Recon: `server/src/blocks/tableToBlock.js` maps headers through fixed
  alias sets (one row per exercise). The AI path already exists as
  "Let the coach convert it" (`POST /coach/block-draft` mode=convert). That
  path accepts up to 20k chars of input and returns at most 8000 output tokens,
  and it costs 1 use. A full 6-week sheet (~600 sets) regenerated as JSON does
  not fit in 8k tokens, so it would truncate.
- **CR2 - Block logging looks like the old logger.** A planned 4 sets still
  has to be added by hand. Seth prefers the look of the Claude artifact
  tracker (screenshot requested). Wanted:
  - one row per planned set, pre-made
  - every field greyed out as a ghost value, weight included; today only
    reps/RPE ghost, and weight falls back to "e.g. 185" when the plan has none
  - sets can still be added and removed; the artifact cannot do this
  Recon: `SessionDetailPage.jsx` ~1320 (plan placeholders),
  `AsPlannedControl.jsx`.
- **CR3 - Notes toggles on block workouts.** The top of a block workout shows
  the "Workout description / Exercise notes / Set notes" checkboxes
  (`SessionDetailPage.jsx` ~3305). It looks unappealing. Decide whether it
  belongs there, needs a better look, or becomes a setting the block author
  picks so the lifter never sees it.
- **CR4 - Library tab.** The UI/UX is stale and has barely changed since
  launch; it needs an upgrade. Remove "Create workout".

## Decisions (Seth, Sept 30)

- **All four CRs belong to THIS wave.** They are Seth's smoke notes, and he wants
  them usable when the wave reaches prod. Smoke sign-off resets; re-smoke once they land.
- CR1: **AI maps the layout, the parser fills the rows.** The AI sees the headers
  plus about 40 sample rows and returns a mapping recipe. The deterministic
  parser applies it to every row, then the usual preview runs. It costs 3 of
  the 7 weekly uses and is meant to become a paid benefit later.
- CR3: open. Seth wants the notes to move into the block builder somehow
  (the goal is the lifter's experience) and will discuss after the proposal.
- CR4: Keep "Create workout" visible but greyed out as parked, so it isn't
  forgotten ("nobody uses this").

## Test data

- Staging account **test123** / `password` (email `test123@example.com`), created
  Sept 30. Block "Upper/Lower Strength - 4wk" (id 126): 4 weeks x 4 days, RPE caps
  on the main lifts, a timed plank, week 4 labeled Deload. Active run 5; weeks 1-2
  logged (sessions 455-462, Sep 14-25). Week 3 is next.

## Later rulings (Sept 30)

- **.xlsx upload approved** ("yes add xlsx"). The seat installed `read-excel-file`
  ^9.3.10 in client/ (MIT; `npm audit` adds nothing new) and authored bks4, which
  runs after bks1.
- **Two "Resume workout" indicators** on Home at once (`claudefiledrop/image0.jpg`:
  the in-progress card plus the bottom bar). Deferred to the NEXT wave; listed under
  QUEUE Candidates.

## Smoke round 2 (Oct 1+; run Oct 5)

Seth smoked on staging Vercel as test123; the seat ran the items he did not touch
locally at 390px (HEAD code, staging DB, mock coach - no uses charged). Seth ruled
Oct 5: every finding below becomes a unit in a fix wave; sign-off resets.

**Seth's results (staging, phone):**
- Import, File tab (item 2): PASS - an old recovery block imported cleanly
  (landed as "Imported Block", 6 weeks x 5 days).
- Home (item 8): **CR** - a running block takes over the whole hero and hides
  logging behind "Other workout". Wanted: logging first, the block under it as a
  bold "next in your block" card. Fold in the duplicate Resume (in-progress card +
  bottom bar, `claudefiledrop/image0.jpg`, deferred Sept 30). Primary screen ->
  Artifact mock first (Seth: yes).
- Log a block day (item 9): **FAIL P1** - in a block workout the bottom "Finish
  workout" button disappears and only comes back after touching the workout.
- Draft with the coach (item 12): **FAIL P1** - shows "Drafting..." and nothing
  else happens. Staging shows test123 coach-usage rows at 2026-10-06 00:37Z and
  01:30Z, so a use may have been charged for a draft he never saw. No loader, no
  timeout.
- AI waits: **CR** - one custom AI loader (the crown) for every AI wait, a small
  crown spinner on the button, and a "this is taking a minute" line when slow.
- Builder "..." menu (item 7): **FAIL P2** - looks out of place. Seat check: the
  exercise "..." popover mixes actions (Move up/down, Duplicate, Replace, Fill)
  with settings (Reps/Time, Rep range, Rest stepper) and runs under the bottom nav
  at 390px (`.playwright-mcp/smoke-r2/07c-exercise-menu.png`). Extra UI/UX care.
- AI file fix: **CR** - when an import has problems, offer "Have AI fix this
  file", charged 1-4 uses by tokens actually used (paid later). Seth: merge it
  with the existing layout read into ONE button.
- Weekly cap: **CR** - make sure everyone gets 7 uses a week. Seat check:
  ask / draft / layout read are capped (rolling 7 days); `/coach/palette` is NOT
  counted at all; concurrent requests can overshoot (check-then-insert). Seth:
  palette costs 1; close the race. `COACH_UNCAPPED_EMAILS` exempts listed emails -
  Seth to check the prod list.
- Coach scope: **CR** - the coach answers anything (it wrote a C# script and did
  math, then said "that's not a workout"). Keep it to app/training topics; refuse
  off-topic up front.

**Seat-run items (local, 390px):**
1. Library: PASS (Blocks first, running strip, Create workout greyed PARKED).
3. Sets x Reps without AI: PASS (5 x 5, 4 x 6-8, nothing skipped).
4. AI layout read: the standard reader already handled `Movement / Sets x Reps /
   Load (kg) / Session` (kg -> lb, 1 change) so the offer never appeared. Note:
   the Paste-tab "Let AI read this layout" button runs the 1-use CONVERT
   (`/coach/block-draft`), not the 3-use layout read - confirms the merge above.
5. Any AI: PASS (a chatty answer with a ```json fence previewed cleanly).
6. Export: PASS (round-trip identical, Nothing skipped).
7. Builder: one row per set PASS; "..." menu see above.
10. Execution: PASS (lists the block's lifts; fractional numbers known/deferred).
11. Connector drafts: deferred - needs the staging connector.
13. Desktop 1280: builder sticky header sits under the app nav when scrolled -
    PASS. Quick-log / saved-workout regression not run (would start a live
    session on Seth's account).

**Seat-found minors (P3):**
- A hard load of a deep link (`/blocks/import`) flashes the Login screen for a
  moment while the session check runs.
- An imported file's block name defaults to "Imported block" - use the file name.
- Builder Settings -> Delete block uses the browser's native confirm, not the
  in-page confirm the rest of the app uses.

## Smoke round 3 (Oct 6; staging Vercel, Seth's phone) - INTAKE ONLY

Seth's notes after the bkr wave landed (12/12, `bf380bc`). Seth ruled Oct 6:
record them and hand them to the NEXT chat - this session proposes no
solutions. Severity is the seat's intake guess; the next agent confirms it.
Bugs go through a DIAGNOSIS block first; CRs need authored blocks.

1. **Starting another block can wipe progress - P0 if confirmed (data loss).**
   Seth: "if you have 2 blocks, and start another im pretty sure you lose all
   progres on the previous, we cant have this." Not yet reproduced. Diagnosis
   first: what happens to the running block's run, its logged sessions, and
   its progress when a second block's run is started.
2. **Add exercise opens wrong the first time - FAIL P2 (bug).** In the block
   builder, "+ Add exercise" usually opens (the first time) as an "ADD
   EXERCISE" sheet with the keyboard up and no search field or list visible;
   tapping it again opens the normal search screen. Screenshot:
   `claudefiledrop/smoke-r3-add-exercise-first-open.png` (Android Chrome,
   staging Vercel). Diagnosis first.
3. **Max 7 days per week - CR.** "in block builder cant have more than 7 days
   in a week."
4. **Removing weeks and days isn't discoverable - CR (P2).** "no way that i can
   see to remove weeks or days from a block, if its there it should be a
   little more obvious but not too glaring, i trust you frontend judgement on
   this." (Delete week/day exist behind in-page confirms since bkr4/bkrf1a -
   the issue is finding them.)
5. **RPE/RIR choice lives in block Settings ("..." top right) - OPEN
   QUESTION, Seth wants the agent's opinion.** "i like them but i fear people
   might not see thats where you select rpe/rir". Give him a recommendation
   (with the trade-off) before authoring anything.
6. **Add a not-in-library exercise to your library from the builder - CR.**
   "if an exercise isnt in libray in the block builder you should be able to
   put it in your library from the block builder".
7. **"Single" exercises should get a left and a right side - CR.** "when using
   a 'single' exercise it should populate a left and a right side like how
   normally logging does it". Confirm with Seth what "single" means here
   (exercise type / per-side flag) and where (block logger, builder plan).
8. **Imported blocks with exercises not in the library - CR (future).** "if you
   import a block and it has workouts that arent saved the app should probably
   catch that and have you add them to the library".
9. **Private / Public on blocks does nothing - CR, Seth's exact copy.** When
   someone taps it, show a small message: "this hasnt been implemented yet bro
   stop prying".

**Process ruling (Oct 6):** the separate-agent feel critic now runs ONE
iteration by default (still scored 0-10); Seth says when he wants more rounds.

The round-3 re-smoke checklist in HANDOFF is otherwise un-run - no PASS/FAIL
recorded for its 11 items yet.
