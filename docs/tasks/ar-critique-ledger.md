# ARENA critique ledger - the input for one Fable round

STATUS: STEP 1 (DESIGN) DONE, SETH SAID GO Nov 14 ("Looks and feels
good") - every item 1-10 is ruled in
`docs/design/mocks/motion/ARENA-ROUND-1.md` and drawn in
`arena-draft-3.html` (Artifact TCamsFYqboRqw6VVFJqoiX), which is now the
design of record. Step 2 (the one build unit) is not authored yet. His
condition: every feature carries over (ARENA-ROUND-1.md, "Nothing is
lost"). New findings still go in as new rows. Single writer: Claude
Code. Opened Nov 12-13, 2026.

## How this round works (Seth, Nov 13)

Seth: continue with the critiques in mind and have Fable fix everything
at the end in ONE round, instead of going back and forth. "We should be
basing the changes off the artifact and the Fable's instructions."

- **The reference is the artifact.** `docs/design/mocks/motion/
  arena-draft-2.html` (Artifact BxNBepax8Fg99q3sUvaUaU) stays the design
  of record. Every change in this round is judged against it. Where Fable
  changes the design, Fable updates the artifact FIRST, and the updated
  artifact becomes the new design of record.
- **Fable's instructions govern the build.** Fable (Fable 5.2, Cursor
  named rung) makes the creative calls. Its written decisions (in the
  artifact and in the block it hands back) are what the build follows.
  Nobody else re-decides them.
- **One round, two steps, in order:**
  1. DESIGN - Fable reads this whole ledger, decides each DESIGN item,
     and updates the artifact. Seth looks once on his phone: go or
     tweak. (The only stop in the round.)
  2. BUILD - one unit implements the updated artifact plus every FIX
     item, each FIX with a check that proves it. One audit, one landing.
- Standing rules still hold: everything behind Arena view until AR7;
  the ONE MOTION rule; tokens only, all palettes; phone-profile proof at
  412 x 839 and 360 x 740; zero frames at rest; reduced motion honoured.

## Prevention (Seth, Nov 13: "to stop things like this in the first place")

Both findings so far got through the same gaps: proofs ran the idle page
only (no live workout, no typing), and visual rules were written by the
block author instead of drawn in the artifact. From now on (ROADMAP
"ARENA wave", prevention rules; `author-task-block`; `land-unit`):
- The artifact is the spec; Fable draws any missing state there first.
- Every unit proves a STATE MATRIX - idle / live workout / resting /
  finished, keyboard open, full view, strip - with every control on
  screen and usable (type into every text box).
- Visual proof is side by side with the artifact, never app-only.
Fable's build block in this round carries all three.

## Items

Kinds: FIX = broken, must work after the round. DESIGN = Fable's call.

| # | Kind | Where | What Seth saw | Notes |
| --- | --- | --- | --- | --- |
| 1 | FIX | Coach, Arena ON - EVERY visit, live workout or not | "You can't type, can only use recs" - the ask box is not on screen | CONFIRMED in the reviewer's headless smoke Nov 13: at scrollY 0 the composer top is 877px on an 839px screen (412x839) and 760-833 on 740 (360x740); the bottom nav covers 783-839. Arena OFF: 710-783, fine. Cause: `.coach-page` height is 100dvh minus the nav, but under Arena the page starts below the 18svh strip, so the composer lands past the fold. Earlier checks measured with a simulated keyboard / scrolled the box into view, so they passed. |
| 2 | DESIGN | The strip (folded scoreboard), e.g. live clock | "The weird timer background isn't crazy appealing" - huge LED clock on near-black | Fable decides the strip's look; carry the same thinking into the room's boards so they stay one system. |
| 3 | DESIGN | Live logger, Arena ON | (reviewer smoke) the bottom nav lights History while you log a live workout | The logger lives at `/sessions/:id`; the prototype keeps the live workout in Home. Fable: which tab owns the live workout. |
| 4 | DESIGN | Live logger + strip | (reviewer smoke) two running clocks: the strip's big LED clock and the logger's own "LIVE 0:03 · 0 SETS" line right under it | Fable: one clock, or each with a distinct job. Ties to item 2. |
| 5 | DESIGN | Full view, every place | (reviewer smoke; also headless polish note 6, Nov 12) the top ~45% of the full view is empty dark sky above the room | The prototype frames the room taller (fixed 100x178, cam y 3). Fable: framing / what fills the sky. |
| 6 | DESIGN | Sheets that slide up (Finish confirm "1 set has no RIR", start-workout picker, confirm panels) | (reviewer smoke) they keep today's rounded look over the squared Arena skin | AR3 left portaled surfaces outside `#root` as today. Fable: skin them or not. |
| 7 | FIX | Finish a workout, Arena ON | (reviewer smoke) a page error on finish: "Transition was aborted because of invalid state. Viewport size changed" | The room grows back to the open size during the route's view transition. The SAVED moment still plays (SAVED PUSH DAY seen). Find and stop the error without touching the ONE MOTION rule. |
| 8 | DESIGN | The strip on every page but Home (his shots: Analytics scrolled, strip reads TRICEPS 0 SETS; the logger) | Nov 14: "the visual ... at the top is something to consider. It makes sense on the home screen but in other parts it feels kinda like a filler, take a try at a solution" | RULED same day, drawn in draft 3: strip for the logger only, a thin rail elsewhere. ARENA-ROUND-1.md item 8. |
| 9 | DESIGN | Live logger | Nov 14: "the log workout screen is cluttered" (his shot: strip, X / Back, title, LIVE line, setup hotbar, name box, note link, view switch, then the first exercise; two helper lines over Finish) | RULED same day, drawn in draft 3: one row, then the lifts; the rest into the Setup sheet. ARENA-ROUND-1.md item 9. Retires the qolf9 hotbar under Arena - Seth can reverse at his look. |
| 10 | NOTE | Strip, rest timer OFF | Nov 14: "the timer still sits there even if you turn it off, don't mind this actually" | No change: the elapsed clock stays. ARENA-ROUND-1.md item 10. |
| 11 | FIX? | Past workout with a workout live, Arena ON | (light smoke after ar-r1b, Nov 14) at 360 (and 412 at scroll 0) Reopen workout sits under the in-progress bar / tabs until the page is scrolled 33-132px | Open. Reachable by scrolling; probably pre-existing (not touched by ar-r1b). Check against Arena OFF before ruling. |
| 12 | DESIGN | Coach with a workout live | (light smoke) no in-progress bar on Coach; ARENA-ROUND-1.md state matrix says it sits between the ask box and the tabs. Arena OFF shows none there either | Open. Pre-existing app behaviour vs a matrix line; Seth's call whether Coach should show the bar. |
| 13 | NOTE | Rest timer start | (light smoke) rest starts when focus leaves the set's row, not when moving to the RIR box in the same row | Existing behaviour (mxf2: the rest waits until you move off a set). No change. |
| 14 | DESIGN | Live logger, Arena ON | Nov 14 phone smoke: "the missing log features that were added and then removed" (his shot: one row, then the exercise card - no RIR / RPE, Exercise notes, Repeat last, no view switch) | RULED and BUILT same day by the frontier seat (Seth: "you be in charge of the final say"): the quick toggles are back as one slim chip row under the one row, plus a Table chip; Setup stays the way into the sheet. ARENA-ROUND-1.md item 9, amendment. |
| 15 | DESIGN | Changing tabs, Arena ON | Nov 14 phone smoke: "when you navigate in arena it defaults you to showing most of the arena ... if you're navigating and you want to see the data on the bottom this can be a hassle" | RULED and BUILT same day: a folded room stays folded across a tab change; scroll up to bring it back; leave a page open and the next arrives open. ARENA-ROUND-1.md item 8, amendment. |
| 16 | DESIGN | Live logger chip row | Nov 14, second look: "Looking good I'd say we can get rid of table" (his shot: the Table chip cut off at the right edge) | BUILT: Table chip removed; the layout switch stays in the Setup sheet. |
| 17 | DESIGN | History and Library places | Nov 14: "The stands and the rack don't make much sense name wise and visually the stands ... don't serve a purpose for what it's doing, use your creative brain" | BUILT for his look (frontier seat's proposal, his to veto): History is THE LOG PILE - the near stands are gone; eight stacks, one per week, newest by the platform, one log per workout, the count on top, this week bright, the open workout's log lit. Library is THE PLAYBOOK (drawing unchanged: program board + weights). ARENA-ROUND-1.md item 8 note. |
| 18 | EGG | Cold-open crown | Nov 14: "grab the spinning loading crown ... and throw it around, once it falls under the screen it will respawn" | BUILT in the boot crown intro (canvas): press the crown to pick it up, flick to throw, bounces off the sides, falls out, pops back. A tap anywhere else still skips. Not on the plain page loader or under reduced motion (the intro never mounts there). |
| 19 | COPY | Start button, logger title | Nov 14: rename "log workout to raw log"; random start lines like "straight raw loggin it?" | BUILT: a workout with no template or block is a "Raw log" (page title, start picker, hello page); Home's start button picks a line from `client/src/lib/startLines.js` per visit - Seth adds his own there. |
| 20 | DESIGN | History place | Nov 14, third look: "log pile is cool ... but off theme, let's keep the theme of the arena ... I want everything to feel seamless ... like you're moving through one thing" | BUILT: the log pile is gone; the near stands are back as THE HOME CROWD - one row per week (front row = this week, 11 weeks), one fan per workout seated from the platform side, this week's row bright, the open workout's fan on its feet (the newest when none is open). Library stays THE PLAYBOOK. Supersedes row 17's pile. |
| 21 | EGG | Crown before login | Nov 14: "the first spinning crown before you log in doesn't let you throw it, that's where I want the Easter egg ... move it to there" | BUILT: moved off the boot canvas intro (row 18) onto the full-page loader's crown (`LoadingState` page tone, `motion/useCrownThrow.js`): press, drag, flick; bounces off the sides, falls under the screen, a fresh one is back spinning. Reduced motion: inert. |
| 22 | COPY | Home start button | Nov 14: "start workout like 95 percent of the time, and ... raw loggin it? 5 percent ... remove the other ones" | BUILT: `lib/startLines.js` - "Start workout", 5% "Straight raw loggin' it?"; Seth adds rare lines there. Supersedes row 19's list. "Raw log" naming elsewhere stays. |

Open calls - RULED (ARENA-ROUND-1.md): Coach never opens tall; it stays
folded, which since item 8 means the rail, not the strip. No
swipe-to-walk this round. AR6 light-mode arena is out of this round.

Add new findings as rows above (next number), in Seth's words.

Reviewer's light smoke (Nov 13, cloud rig on the branch HEAD, champ dark, 412x839 + Coach at 360x740): live workout across all six tabs - every text box reachable and typed into EXCEPT Coach (item 1); logger set -> REST strip + rest bar; rest follows to Analytics; Finish -> SAVED + name in the open room, back to the week face; full view on Home; zero rAF at rest after the save; scrollWidth = innerWidth everywhere checked. Not run headless: light mode, other palettes, reduced motion, a real keyboard.

## Cause confirmed (Nov 14, cloud rig, read-only)

Item 1, Coach composer: CONFIRMED. Arena OFF the page starts at 12px and the
composer spans 710-783 (nav top 783) at 412x839; Arena ON the page starts at
179px and the composer spans 877-950, entirely under the nav. Same +167px at
360x740 (611-684 OFF, 760-833 ON vs nav 684). A live workout changes nothing:
idle and live measure identically, so the workout bar is not the cause. The
offset is the strip (151px) plus the sheet's top inset. Fix is in the build
block (arena.css inset variable used by .coach-page height).

