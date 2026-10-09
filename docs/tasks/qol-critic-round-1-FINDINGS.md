# QOL feel critic, round 1 - FINDINGS (preserved from `.playwright-mcp/qol-critic/round-1.md`)

> Seat triage (Oct 9, Opus seat). The critic run that shot the 67 screenshots
> died before writing; a fresh critic wrote this report from them. Item numbers
> below are what the fix blocks cite.
> - **#5 (reorder may not stick): NOT A BUG.** Re-checked live: a held drag of
>   Plank above Bench reordered the cards and flipped the block to UNSAVED. The
>   dead run's "after drop" shot was an artifact. Nothing saved.
> - **#14 (Login flash on cold load): FIXED DIRECTLY, `33cd671`.** Root cause
>   in `AuthContext.jsx`: a superseded `/auth/me` (pageshow starts a second one
>   at boot) cleared `authLoading` while the user was still null.
> - **qolf1:** #1, #6, #7, #8, #20, #21. **qolf2:** #2, #3, #9, #12, #13,
>   #24 (meta only), #25, #27, #33. **qolf3:** #4, #19, #22, #23.
>   **qolf4:** #10, #15, #16, #17, #18, #29.
> - **Not fixed, with reasons:** #11 ALL-CAPS builder sheet titles are the BK
>   wave's recovery-site look (rule 3 binds NEW surfaces); #24's tab count was
>   an accepted qol10 deviation; #26, #28, #30, #31, #32 are pre-existing P3
>   polish outside this wave's surfaces - stowed for the next builder/Library pass.

SCORE: 5/10

The copy is strong: plain words, the right button names, counts in the confirms ("Your 3 logged sets will be deleted"). Several flows feel good: the finish sheet, the rest bar, last-time ghosts, Recent, the icon-list sheets. But three layouts look visibly broken, and the floating bar is one of them, which a lifter sees on every page mid-workout. The logger is cramped by its own chrome. Selection and sheet-header styles drift between surfaces. That adds up to competent but ordinary, with visible breakage.

Evidence note: this report was written from the 67 screenshots of the dead run. I took no re-shots, because every surface A-M has at least some usable evidence. The gaps are listed under each surface.

## Ranked fix list

### P1 - breaks flow or looks broken

1. **P1 / E** - At 390px the floating In-progress bar collapses.
   - "In / progress / · 2m" stacks into a 3-line column and the title shrinks to "Work...", while "Resume workout" takes the middle.
   - It shows on every non-logger page during a workout.
   - Screenshots: `E-floating-bar-zoom-champ-dark.png`, `E-floating-bar-analytics-champ-dark.png`, `M-execution-champ-dark.png`.
   - Fix: make the text column `flex: 1; min-width: 0`, with the meta on one nowrap line and the title on one ellipsis line. Shorten the link to "Resume" below about 420px so the text keeps priority.
2. **P1 / I (H)** - A continued coach thread is boxed in.
   - The thread renders in a fixed-height inner scroller (about 470px, native scrollbar) that ends at y≈536.
   - That leaves about 180px of dead space above the composer. The new reply ("Coach" label at the bottom edge) lands below the fold, and the box has not scrolled to it.
   - Screenshot: `I-coach-continued-champ-dark.png`.
   - Fix: the thread fills the space between header and composer (`flex: 1; min-height: 0; overflow-y: auto`) and scrolls to the newest message on send and on answer.
3. **P1 / K** - The empty and typing states of "Use your own Anthropic key" are broken.
   - The label is crushed into a column about 30px wide ("Your / A... / API key"), and the password input overlaps it.
   - "Save key" is squeezed to about 25px wide, and its text spills onto the help copy.
   - The saved state is fine.
   - Screenshots: `K-key-section-empty-champ-dark.png`, `K-key-section-broken-zoom-champ-dark.png`, `K-key-typed-champ-dark.png`.
   - Fix: stack label, input and button vertically at full width (column flex), button below the input.

### P2

4. **P2 / C F G** - Logger chrome takes about a third of the phone.
   - The sticky exercise header is about 125px: name, Tracked, "Last time", and a full "Remove exercise" button.
   - The Finish dock is 120px with two lines of standing copy, and 155px once the rest bar shows.
   - That leaves about 560 of 844px for sets.
   - Screenshots: `F-three-logged-set4-champ-dark.png`, `F-G-set1-logged-rest-bar-champ-dark.png`, `C-logger-empty-champ-dark.png`.
   - Fix: take "Remove exercise" out of the sticky header (put it behind a "..." or leave it unstuck), and cut the sticky part to the name line. Make the dock one line: drop "Autosaves as you go..." once a set is logged.
5. **P2 / L** - The reorder may not stick.
   - `L-dragging-champ-dark.png` shows Plank above Bench. `L-after-drop-champ-dark.png` shows the original order (A Bench, B Plank).
   - Either the drop reverted or the previous run dragged it back. I cannot tell from the shots. If it reverts, this is P1.
   - Fix: verify a drop persists in the draft before smoke.
6. **P2 / E M** - At 1280px the bar does not line up with the page column.
   - It is a fixed strip about 720px wide, centred.
   - On Analytics it is inset about 116px each side: bar 274-992, column 158-1106 (`E-M-floating-bar-1280-champ-dark.png`).
   - On Training it is about 23px wider than the cards: bar 274-992, cards 297-968 (`B-training-1280-champ-dark.png`).
   - Fix: render the bar inside the page column container, or reuse the page's max-width and padding variables.
7. **P2 / M** - The Analytics Strength tab scrolls sideways in crimson light.
   - A horizontal scrollbar shows at the bottom. The Chart/Table toggle, the Execution tab, the row meta ("top set +35 lbs · top set 220 × 10") and the right axis labels are cut off at the edge.
   - Screenshot: `M-crimson-light-good-green.png`.
   - This is probably older than this wave, but it sits on the M surface.
   - Fix: let the strength-row meta wrap (`white-space: normal; min-width: 0`) and give the tab strip its own horizontal scroller.
8. **P2 / E** - The "Workout discarded" notice looks like an empty text field.
   - It is a bordered box with grey text and no icon, tint or dismiss.
   - Screenshot: `E-after-discard-home-champ-dark.png`.
   - Fix: use the toast/notice treatment (accent tint or icon, an x, auto-fade).
9. **P2 / I** - The row "..." menu and the delete confirms are off-pattern.
   - The row "..." opens a small dropdown with one "Delete" item. That is a new menu style, not the shared bottom-sheet icon list (rule 6) (`I-coach-row-more-sheet-champ-dark.png`).
   - Single "Delete" is an accent-blue primary, while "Delete all" uses the danger style (`I-after-row-delete-champ-dark.png` vs `I-delete-all-confirm-champ-dark.png`).
   - Fix: send "..." through the BuilderSheet icon list, and use the danger token on both confirms.
10. **P2 / L** - Selection styles are mixed inside the builder.
    - The selected week pill is accent-tinted (good).
    - The selected day pill has a white outline, and the selected segment of Edit/Progression and Reps/Time is solid white.
    - Screenshots: `L-builder-existing-champ-dark.png`, `L-reps-sheet-per-side-checkbox-champ-dark.png`.
    - Fix: apply the same `color-mix` accent tint to the selected day pill and to the selected segment.
11. **P2 / L J** - Sheet titles use two different header styles.
    - New sheet titles are ALL-CAPS display type: "ADD EXERCISE", "WEEK 1", "BLOCK", "REPS / TIME", "ADD TO YOUR LIBRARY", and the label "LABEL".
    - J's "Edit exercise" is sentence case and centred.
    - The same form (add vs edit an exercise) gets two different headers.
    - Screenshots: `L-week-actions-sheet-champ-dark.png`, `J-add-to-library-form-champ-dark.png` vs `J-edit-exercise-sheet-champ-dark.png`.
    - Fix: one sheet-title class: sentence case, left-aligned, x on the right.
12. **P2 / H** - The composer sits on a hard-edged dark slab.
    - The slab (x 16-374, y 716-790) floats over the city scene and matches nothing else on the page.
    - Screenshots: `H-coach-empty-access-champ-dark.png`, `H-coach-answer-champ-dark.png`.
    - Fix: either make the backing full-bleed with the nav surface token, or drop it.
13. **P2 / H** - "Stop" is hard to read in the wait state.
    - It is white text on a pale lavender fill.
    - Screenshot: `H-coach-wait-state-champ-dark.png`.
    - Fix: use the standard secondary button tokens.
14. **P2 / M** - A cold reload showed the Login screen to a signed-in account.
    - Screenshot: `M-login-flash-cold-load-crimson-light.png`.
    - I could not confirm how long it lasts.
    - Fix: show a neutral splash until the session check resolves.

### P3 - polish

15. **P3 / A** - The Logging setup sheet needs a scroll for its controls.
    - Rest Duration is below the fold inside an inner scroller with a native grey scrollbar.
    - Help text runs flush into the scrollbar ("aren't").
    - The "Units and effort" header touches the subtitle.
    - The sheet is about 98% tall, so the strip behind it, which updates live, is never visible.
    - Screenshots: `A-sheet-champ-dark.png`, `A-sheet-switches-zoom.png`.
    - Fix: cap the sheet at about 85% height, add right padding to the scroll area, and tighten section gaps so it fits at 844.
16. **P3 / A B** - Off toggles are nearly invisible in champ dark.
    - A dark knob sits on a dark track ("Set notes").
    - Screenshots: `A-sheet-champ-dark.png`, `B-training-bottom-champ-dark.png`.
    - Fix: a lighter knob token for the off state.
17. **P3 / A** - The "Notes on" pill is ambiguous.
    - It shows while set notes are off.
    - Screenshot: `A-home-strip-champ-dark.png`.
    - Fix: say "Exercise notes", or only show the pill when both are on.
18. **P3 / B** - The Training page is not tuned for 1280.
    - The segmented controls stretch to about 640px.
    - The subtitle says "on this phone" on desktop.
    - Screenshot: `B-training-1280-champ-dark.png`.
    - Fix: cap segmented controls at about 360px, and say "on this device".
19. **P3 / C F** - Some logger labels are title case.
    - "Builder View", "Table View", "Reps in Reserve".
    - Screenshots: `C-logger-empty-champ-dark.png`, `F-repeat-last-ghosts-champ-dark.png`.
    - Fix: sentence case.
20. **P3 / E** - The Home live card repeats itself.
    - The heading "Resume workout" duplicates the button.
    - The button is narrower than the Start button (32-295 vs 32-343).
    - Screenshot: `E-home-live-card-champ-dark.png`.
    - Fix: make the workout name the heading, and make the button full width.
21. **P3 / E** - Focus is not visible on either discard confirm.
    - No focus ring shows on "Keep workout", so I cannot confirm focus starts there.
    - Screenshots: `E-discard-confirm-from-bar-champ-dark.png`, `E-discard-confirm-home-champ-dark.png`.
    - Fix: a `:focus-visible` ring from `--color-interactive`.
22. **P3 / D** - The "Add RIR" highlight is easy to miss.
    - It is only a 1px amber border and a label tint.
    - The second highlighted field (Set 3) lands under the dock.
    - Screenshot: `D-add-rir-highlight-champ-dark.png`.
    - Fix: a 200ms tint pulse on the field, and scroll so the first missing field sits mid-screen.
23. **P3 / F** - The set-number "log as last time" square does not look tappable.
    - It is a bare number box with no cue.
    - Screenshot: `F-repeat-last-ghosts-champ-dark.png`.
    - Fix: an accent outline or ghost-check icon on rows that have ghosts.
24. **P3 / I** - The Coach tab breaks two rules.
    - Row meta "General · today" is a middle-dot string (rule 3).
    - The tab label "COACH" is ALL-CAPS and has no count, unlike its siblings.
    - Screenshot: `I-library-coach-tab-champ-dark.png`.
    - Fix: "General, today", and give the tab a count.
25. **P3 / I K** - Some confirms do not say what happens.
    - "Delete all coach conversations?" and "Remove your key?" have no consequence line.
    - A bare "Keep" does not say what is kept.
    - Screenshots: `I-delete-all-confirm-champ-dark.png`, `K-remove-key-champ-dark.png`.
    - Fix: one line of consequence copy like the discard sheet, plus "Keep conversations" and "Keep key".
26. **P3 / J** - Exercise delete uses a different confirm.
    - The confirm is inline in the card, while E, I and K use the bottom-sheet confirm.
    - The name is forced to uppercase ("CRITIC PROBE LIFT").
    - Edit and Delete are small text links.
    - Screenshots: `J-delete-exercise-confirm-champ-dark.png`, `J-exercises-list-champ-dark.png`.
    - Fix: use the shared confirm sheet, show the name as typed, and make Edit and Delete 44px buttons.
27. **P3 / K** - Some AI access copy is out of date.
    - It says "The coach lives on the Analytics page" and "Open Analytics to ask the coach", but /coach now opens from Home.
    - Screenshot: `K-key-saved-champ-dark.png`.
    - Fix: point to the Home chat bubble.
28. **P3 / L** - The builder's exit and menu items are unclear.
    - In the block "..." sheet, "Back" lands on /create with the Home tab lit.
    - New blocks say "Back"; saved blocks say "Close".
    - "Settings" uses a pencil icon, and "Copy forward..." reuses the icon of "Replace exercise".
    - Screenshots: `L-builder-menu-sheet-champ-dark.png`, `L-after-back-champ-dark.png`, `L-week-actions-sheet-champ-dark.png`.
    - Fix: one exit label ("Close") going back to Library, and distinct icons.
29. **P3 / L** - Lift-to-drag is barely visible.
    - The lifted card only shifts about 5px, with no shadow or accent.
    - Screenshot: `L-long-press-collapsed-champ-dark.png`.
    - Fix: an elevation shadow and an accent border while lifted.
30. **P3 / L** - The builder layout jumps.
    - On a new block the week strip is missing until the first exercise is added (`L-builder-new-champ-dark.png` vs `L-builder-after-add-champ-dark.png`).
    - The day strip runs off the right edge with no fade (`L-builder-existing-champ-dark.png`).
    - Fix: always show the week strip, and add an edge fade to the day strip.
31. **P3 / L** - The "Added 'Critic Probe Lift' to your library." toast covers the bottom nav.
    - Screenshot: `L-builder-after-add-champ-dark.png`.
    - Fix: offset the toast above the nav.
32. **P3 / L A** - Unit labels disagree: "lb" in the builder vs "lbs" on the Home strip.
    - Screenshots: `L-builder-after-add-champ-dark.png`, `A-home-strip-champ-dark.png`.
    - Fix: one unit label.
33. **P3 / H** - The "?" glyphs used as suggestion icons read as placeholders.
    - Screenshot: `H-coach-empty-access-champ-dark.png`.
    - Fix: a chat or arrow icon, or no icon.

## Per surface

- **A. Logging setup strip.**
  - The strip reads cleanly in champ dark and crimson light; tokens hold, and the "Repeat last" pill tints correctly in both palettes.
  - The sheet works but is heavy: it is about 98% tall, has an inner native scrollbar, and Duration sits below the fold (#15).
  - Evidence gap: no shot shows the strip updating live, because the sheet covers it. Iron dark was never shot.
- **B. Profile, then Training.**
  - There is one card per group, the "Training" row has a clear subtitle, and the bottom card clears the nav at scroll end (`B-training-bottom`).
  - At 1280 it is over-stretched (#18). Iron dark was never shot.
- **C. Logger without toggles.**
  - The toggles are gone, and "Add a workout note" is a quiet text button.
  - The view switcher is title case. The dock's two standing lines of copy are noise (#4).
- **D. Finish without effort.**
  - This is the best new surface: a tight sheet with exact copy ("2 sets have no RIR... won't count toward effort stats").
  - The highlight is too quiet (#22).
  - Whether "Finish anyway" should be the filled primary in an app built around RIR is Seth's product call.
- **E. Discard.**
  - The Home x, the confirm copy with a set count, the "Discard workout"/"Keep workout" naming, and the hero going back to Start all work.
  - The phone floating bar is broken (#1), the notice looks like an input (#8), and focus on Keep is not visible (#21).
- **F. Repeat last time.**
  - Ghosts are clearly lighter than logged values, the "Last time: Sep 8" caption is right, and the set-number tap logs (`F-G-set1`).
  - The tap target has no cue (#23), and Builder view gives about one set per half-screen.
- **G. Rest timer.**
  - All the parts are there: time, Rest, exercise, -15s, +15s, Skip, and a depleting accent line (full in `F-G-set1`, about 75% in `D-add-rir-highlight`). The buttons are about 44px.
  - It adds 35px to an already tall dock (#4).
  - The keypad-hide behaviour cannot be checked on desktop.
- **H. Coach.**
  - The empty state is right: intro line, suggestions (4 rows with access, 3 rows plus the "Turn on AI access" line without), and the composer sits above the nav. The wait dots are fine.
  - The composer slab (#12) and the Stop contrast (#13) cheapen it, and the empty state is heavy at the top with a large void below.
- **I. Coach history.**
  - The tab, the rows (title, context, date), the empty state ("Ask the coach") and "Delete all conversations" all exist.
  - The continued thread is broken (#2), the "..." menu and the confirm colours are off-pattern (#9), and the meta uses a middle dot (#24).
- **J. Edit your own exercise.**
  - The sheet pre-fills the name and the MAIN muscles, "Save changes" stays disabled until something changes, and the summary line "Mostly chest and triceps" is a nice touch.
  - Its header style disagrees with the Add sheet (#11), and delete uses an inline confirm (#26).
- **K. Your own key.**
  - The saved state is clean ("Key ending in wxyz", "Remove key"), and the copy says the key is encrypted on the server.
  - The entry state is broken (#3), and the AI access copy is out of date (#27).
- **L. Builder.**
  - These pass: one-line collapse on hold, the name on its own row, week strip plus day picker together, icon-list "..." sheets, the tinted week pill, "Recent" in an empty search, and "Per side (left and right)" on the one-sided Alternating Kettlebell Row.
  - These fail: the reorder might not persist (#5), selection styles are mixed (#10), and sheet titles are ALL-CAPS (#11).
  - Evidence gap: the Reps sheet for a two-sided lift was never shot, so "only on one-sided" is half-proven.
- **M. Smaller fixes.**
  - Execution shows whole numbers (50%, 100%, 25%, 60%), and crimson light shows "good" in green ("+47 lbs", the matched-effort lines).
  - The 1280 bar is misaligned (#6), and the Strength tab overflows sideways (#7).
  - Evidence gaps: there are no shots of crimson dark, of `/profile/whats-new?preview=1`, or of the `/profile?preview=1` "Latest update" card. History at 1280 shows an empty list (`E-M-floating-bar-1280-history`), probably still loading, so I am not judging it.

## Cleanup

- **Checked through the API (orchestrating seat, Oct 9):**
  - demo.critic has no in-progress workouts, no saved key, no coach conversations and no custom exercises. No block template has been updated since Sept 30, which means the builder was never saved.
  - The probe account (qol8.probe) has no conversations or sessions.
- **What the screenshots show:**
  - The D/E quick workout was discarded: "Your 3 logged sets will be deleted" in `E-discard-confirm-home`, then "Workout discarded" in `E-after-discard-home`.
  - The fake key was removed (`K-remove-key`).
  - The conversations were deleted (`I-after-row-delete`, `I-delete-all-confirm`, then the empty state in `I-coach-tab-empty`).
  - "Critic Probe Lift" was deleted (`J-delete-exercise-confirm`).
- **Not proven:** a local unsaved builder draft (browser storage only, so invisible to the API) was offered in `L-new-block-draft-banner`, and no shot shows Discard being tapped. It is harmless to server data.
- **This run:** I created nothing. I took no re-shots and opened no browser session, accounts or data.
