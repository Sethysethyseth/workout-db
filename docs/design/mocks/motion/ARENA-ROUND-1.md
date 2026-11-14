# ARENA round 1 - rulings and build instructions

Written by the design seat for the builder of step 2. You need no chat
history to use this. Read it with the artifact open:

- **The artifact (design of record from now on):**
  `docs/design/mocks/motion/arena-draft-3.html`. Open it in a browser. The
  switches above the phone set every state named below. Its script is the
  spec: where this file and the artifact disagree, the artifact wins.
- **History, do not edit:** `arena-draft-2.html`.
- **The critique list these rulings answer:**
  `docs/tasks/ar-critique-ledger.md` (items 1 to 10 and two open calls).
  Items 8 to 10 came from Seth's Nov 14 phone notes and were drawn into
  draft 3 the same day. Where a ruling for 8 or 9 touches an earlier
  ruling, 8 and 9 win; each such place is marked "(see 8)".

Everything here is behind Arena view (`html[data-arena]`). With Arena view
off, the app must look and behave exactly as it does today.

## How to read the artifact

| Switch row | What it does |
| --- | --- |
| Place | Home, Analytics, History, Library, Profile, Coach. Walks the camera. |
| State | Idle / Live workout / Resting / Finished. Held still so you can look. The live demo is "Push Day", three sets logged, clock at 12:34. |
| View | Open / Folded / Full view. Folded is the strip in the logger and the rail everywhere else (item 8). Open is greyed out on Coach (it is always folded). |
| Bottom row | Keyboard (a stand-in keyboard), Finish sheet, Start picker, Setup sheet (item 9), Short phone (draft 2's stubbier frame, to show the roof being cut from the top). |

The phone in the artifact is 100 pixels wide and 204 tall by default, the
shape of a real phone (412 x 839). One room pixel is one square; nothing is
ever scaled differently.

## Rulings, one per ledger item

### 1 - FIX - Coach: the ask box is not on screen

**Ruling.** The ask box is pinned to the bottom of the Coach page, directly
above the tabs, on every visit, with or without a live workout. The chat
scrolls between the strip and the box. With the keyboard open the box sits
on the keyboard and the strip stays at the top.

**Why.** The page was sized for a screen without the strip, so under Arena
the box fell below the fold. It has to be reachable without scrolling.

**What "fixed" looks like in the artifact.** Place: Coach. The box and Send
are above the tabs at rest. Press Keyboard: the tabs give way to the
keyboard, the box sits on it, the strip is still there. Type in it. Press
Live workout or Resting: nothing about the box changes; the in-progress bar
sits between the box and the tabs.

**Build check.** At scroll 0, without scrolling or simulating a keyboard:
the composer's top is below the strip's bottom, and its bottom is at or
above the bottom nav's top. At 412 x 839 and 360 x 740, Arena on, with and
without a live workout. Then focus it and type a real character. The
expected cause is in the ledger: `.coach-page` height is `100dvh` minus the
nav, but under Arena the page starts under the 18svh strip (plus the
sheet's 2px rule and 14px top padding). Subtract those under
`html[data-arena]`. After item 8 Coach sits under the rail, not the
strip: subtract the rail's height. Use the stage's real height (one
variable), never a second hard-coded number.

### 2 - DESIGN - The strip's look

**Where the strip is shown changed on Nov 14 (see 8):** the logger and
Home with a workout running, nowhere else. Its look, below, stands.

**Ruling.** The strip is a slice of the room, not a black LED panel. It is
the room's own drawing, cut close to the scoreboard: the lit, dithered air;
the two posts the board hangs from; the board's frame and crown; the two
tower lamps either side; the week's seven lamps under it. Type is at the
room board's size (one pixel per font pixel), two lines: a dim label, then
a bright value. Only REST goes big: the word REST, the countdown at double
size, and a bar inside the frame that drains.

The room's board and the strip are fed by **one face function**
(`boardFace` in the artifact). First match wins:

1. Resting -> REST + countdown + drain bar. Follows you to every place.
2. Just finished (about 5 seconds) -> `SAVED` over the workout's name.
3. The Log cheering -> `LOG` / `CHAMP`.
4. Logging (Home / the logger) -> the workout's name over `12:34 · SET 4`.
5. Otherwise the place's own face: Home cycles the week faces; Analytics
   shows the view's headline; History `WORKOUTS` / count; Library
   `BLOCK W1` / `1 OF 18`; Profile `STREAK` / `3 WEEKS`; Coach shows the
   chalk lines, or three dots while it thinks.

The board is 38 pixels wide. It widens to 64 for the live line and for
REST (both need the room), and narrows again after. A face that needs the
wide board is drawn only once the board is wide.

**Why.** Seth's note was the "weird timer background": a huge clock on
near-black, unrelated to the room under it. Cutting the strip from the room
makes the strip and the room one object, and it stays correct in every
palette for free because it uses the room's ramp.

**Changed from the brief, and why.** The strip always looks at the
scoreboard over the platform, whichever place you are at (the brief did not
say). One board, one position: the strip can then fade in place on every
route with nothing travelling. The strip no longer has a separate bottom
edge line or a full-width rest line; the sheet's accent rule is the edge
and the drain bar is inside the board.

### 3 - DESIGN - Which tab owns the live workout

**Ruling (Seth's decision, fixed).** Home. While the live logger
(`/sessions/<the active id>`) is open under Arena, the bottom nav lights
Home, and the camera stands at the platform (it already does). A past
workout (`/sessions/<any other id>`) still lights History and the camera
stands at the stands. With Arena off, nothing changes.

**Why.** The room's platform is where the lifting happens; lighting History
while the camera is at the platform says two different things.

**In the artifact.** State: Live workout. The logger is in Home, Home is
lit. Open a row in History: History is lit.

### 4 - DESIGN - Two clocks

**Ruling (Seth's decision, fixed).** One clock. Under Arena the logger's
own "LIVE 0:03 · 0 SETS" line is not shown. The strip is the logger's
header: the workout name over `elapsed · SET n` (for a block day,
`elapsed · n OF total`). On a rest it flips to REST. A logged set is
acknowledged by the flash that exists today (the board's frame and crown go
bright for about 200ms). The logger keeps its rest controls
(-15s / +15s / Skip); the countdown itself is only on the board.

**Why.** Two running clocks one above the other read as a bug.

**In the artifact.** State: Live workout, then Resting. There is no clock
anywhere in the sheet.

### 5 - DESIGN - Empty sky in the full view

**Ruling.** The room gets a roof. From the top down, in world rows (the
floor is row 150):

| Rows | What |
| --- | --- |
| above 15 | Purlins (horizontal lines, closing up as they go back) and a rafter every 25 columns. Drawn up to the top of whatever frame there is. |
| 22 to 28 | The main truss: two chords and a zigzag web. |
| 29 to 35 | A lamp can under the truss over each place (columns 50, 254, 350, 450; two over the platform at 112 and 188, above the towers). The can over the place you are at is lit. Each throws a thin, faint shaft down through the air. |
| 39 to 51 | The upper deck: four rows of dim seats with aisles. On Finish a few of them flash, like cameras. |
| 55 to 63 | The balcony front: a rail, a face, and each place's name lettered on it above the place (THE STANDS, THE PLATFORM or THE SCOREBOARD, COACH'S CORNER, THE RACK, LOCKER ROOM). The name of the place you are at is bright. |

The scoreboard now hangs from the truss: two cables (columns 120 and 180)
to a spreader bar at row 66, two posts down to the board. The three
banners hang from the balcony front (top at row 63) instead of on long
cords.

**The camera and the pixel size do not change.** The camera is fixed to
the floor (7 rows below it at the full view's bottom edge). A taller phone
has more rows, and the extra rows are roof. Press Short phone to see the
same room with fewer rows.

**Why.** The ledger's 45% of empty dark was there because the room was
drawn for a shorter frame than a real phone. Zooming or raising the camera
would break the ONE MOTION rule and make the pixels chunkier; filling the
air does neither, and the balcony names answer "where am I" inside the
picture.

**Changed from the brief, and why.** (a) The scoreboard's rigging and the
banners' hanging point moved, as above, so nothing crosses the lettering.
(b) In the artifact the LogChamp wordmark and the Coach button moved off
the canvas into the top of the sheet. The app never drew them on the
canvas (pages keep their own header), so this only makes the artifact match
the app. No app change. (c) The small place label under the wordmark is
gone; the balcony carries the name.

### 6 - DESIGN - Sheets that slide up

**Ruling.** Skin them to match the page sheet: square corners, the 2px
accent rule on top, the 34 x 3 grip mark, the title in the display face,
square dark inputs, list rows as squared outlined rows. The main button
stays rounded (as on the page). The dimmed backdrop stays. This is CSS
only: they rise, rest and dismiss exactly as today. It covers every
surface rendered outside `#root` by a portal: the Finish confirm ("1 set
has no RIR"), the other confirm panels (finish with sets not logged,
discard), the start-workout picker, and the remaining sheets that use the
same shells (training prefs, add exercise, the two info sheets).

**Why.** A rounded sheet over a squared page looks like two apps.

**In the artifact.** Press Finish sheet, and Start picker (type in its
search box). Discard (the X in the logger, after a set is logged) and
Finish with sets left use the same sheet.

### 7 - FIX - Page error on Finish

**Ruling.** Finishing a workout must throw no page error. The SAVED moment
still plays and the room still opens in one motion, riding the sheet's
edge. The ONE MOTION rule is not touched.

**What "fixed" looks like in the artifact.** State: Live workout, press
Finish, Finish anyway. The sheet drops, the room opens once, the board
reads SAVED over the name, the lamps flash. Nothing else moves.

**Build direction.** The error ("Transition was aborted because of invalid
state. Viewport size changed") is a view transition being aborted while
the stage changes height, and the rejection reaching the page. Do both:
(1) under Arena, do not hold a view-transition snapshot across a
navigation that changes the stage's height out of the live logger - take
the existing fade branch for it; (2) never leave a view transition's
promises unhandled (`ready` as well as `finished`), so an abort can never
surface as a page error. Find the real cause first; if it is not this,
fix what it is.

**Build check.** With a `pageerror` listener attached from page load:
start a workout, log a set, finish. Zero page errors and zero console
errors, at both phone sizes, and the SAVED face is seen.

### 8 - DESIGN - The banner feels like filler away from Home

**Ruling.** Folded has two sizes, chosen by the route and nothing else.

- **The strip (18svh, the scoreboard)** only where the board is doing a
  job: the live logger, where it is the page's header and only clock, and
  Home while a workout is running (as today).
- **The rail (11 room rows, about 45px on a 412 x 839 phone)** everywhere
  else the strip used to be: any other page once it is scrolled, Coach,
  a past workout, the Advanced analytics view, and any page with the
  keyboard up. The rail is the room cut at its balcony front (world rows
  54 to 64, over the place you are at), so it reads the place's name:
  THE SCOREBOARD, THE STANDS, COACH'S CORNER, THE RACK, LOCKER ROOM.
- **The rail's one line**, first match wins: resting -> `REST m:ss`, and
  the balcony's bottom edge drains left to right; just finished ->
  `SAVED <name>` for about 5 seconds; otherwise the place's name.
- The open room at the top of each page is unchanged. Scrolling folds it
  1:1 as today; the fold simply continues to the rail. The rail fades in
  place over the last 30% of the fold, the same rule as the strip.
- The size never changes with the state. A rest that starts while you
  read Analytics changes the rail's line and moves nothing.

- **AMENDED Nov 14 (frontier seat, Seth's phone smoke): the fold carries
  across a change of tab.** If the room was folded to the rail on the
  open page you leave, the next open page arrives folded (scrolled
  exactly to its fold end, a cut, no ease); scroll up and the room is
  there. Leave a page with the room open (or only part folded) and the
  next arrives open, as before. Rail-only pages (Coach, a past workout,
  unlisted routes) and the logger do not change what is remembered.
  Leaving the logger (Finish, Discard) always opens Home at the top, so
  the SAVED room is seen. Back / forward keep the browser's own scroll.
  A reload starts open. Code: `lib/arenaFold.js`.

**Why.** Seth: the banner "makes sense on the home screen but in other
parts it feels kinda like a filler". Scrolled into Analytics, a fifth of
the screen said TRICEPS 0 SETS above the same numbers. The board earns
its height only where it is the header. The rail keeps what the strip was
for away from the logger (where am I, is a rest running, a way back to
the full view by tapping it) at a quarter of the height.

**In the artifact.** Place: Analytics, View: Folded. Then State: Resting
on any place but Home. Place: Coach.

**Build check.** At 412 x 839 and 360 x 740, on every route but the live
logger and live Home: scrolled to the fold's end, the stage's visible
height is 11 room pixels (the same pixel size as the room), and the
sheet's top is directly under it. With a rest running the rail reads
`REST m:ss` and the stage height has not changed between idle, live and
resting. Tapping the rail opens the full view.

### 9 - DESIGN - The logger is cluttered

**Ruling.** Under Arena the logger's page starts with one row, then the
lifts.

| Today, top to bottom | Round 1 |
| --- | --- |
| X and Back | The X stays, in the one row. Back is the Home tab. |
| "Log workout" title | Gone. The strip is the header (item 4). |
| LIVE clock and set count | Gone (item 4). |
| Setup hotbar: RIR / RPE, Exercise notes, Repeat last, Edit | One **Setup** button in the one row. It opens the existing Logging setup sheet. |
| WORKOUT NAME label and box | The box is the first thing in the one row. No label; the placeholder says what it is. |
| "Add a workout note" | Below the last exercise, after "+ Add exercise". |
| View: Builder view / Table view | A **Layout** line in the Setup sheet. |
| "Autosaves as you go..." and "Log at least one set..." above Finish | Gone. The button itself reads `Log a set to finish` until a set is logged, then `Finish workout`. |

The one row is: name box, Setup, X. The Setup sheet (skinned per item 6)
holds, in order: weight unit, effort scale, layout, exercise notes, set
notes, repeat last time's numbers, rest timer, rest length. Changing a
setting redraws the sheet in place; it does not slide up again.

**Why.** Seth: "the log workout screen is cluttered". On his phone the
first weight box was below the fold. Everything removed from the page is
either said by the strip or set once and left.

**Scope, so nothing is lost.** Item 9 changes only the top of the live
logger (above the first exercise), where the note link sits, and the two
helper lines over Finish. Every exercise card and everything in it is
untouched: collapse, rename, exercise search, set count, L/R, add and
remove set, delete, set notes, exercise notes, last-time and planned
numbers, "As planned", the table view, the rest controls, the Finish and
Discard confirms. Every control taken off the page has a named new home
in the table above; none is deleted. The hotbar's effort note (a block's
locked scale) shows in the Setup sheet. Back's job (leave the logger,
lose nothing) is done by the tabs; the workout is resumed from Home or
the in-progress bar as today. A finished workout's page
("Workout summary") is not touched.

**Stated so nobody restores it silently:** this retires the hotbar
(`qolf9`) under Arena. Seth can reverse that at his one look. With Arena
off the logger is exactly as today.

**AMENDED Nov 14 (frontier seat, Seth's phone smoke: the quick logging
features "were added and then removed"; he handed the seat the final
say).** The hotbar's quick toggles are back under Arena, as ONE slim row
(36px, squared, no box) directly under the one row: `RIR | RPE`,
`Exercise notes`, `Repeat last`, and a new `Table` chip (the view
switch, not shown on a block day). The hotbar's Edit is not repeated:
Setup, in the one row, is the way into the sheet, and the sheet keeps
every setting including Layout. Why: the toggles are used mid-workout
(notes off to pull the weight boxes up, table view on), and a sheet is
two taps and a context switch for a one-tap job; one 36px row costs less
than the exercise-notes box it can hide. The title, the LIVE line, the
name label, the note link's old position and the helper lines over
Finish stay gone. Arena off: unchanged.

**In the artifact.** State: Live workout. Then Setup sheet. (The
artifact does not draw the chip row; this amendment is the spec for it.)

**Build check.** Arena on, a new empty workout, 412 x 839, no scroll:
the first exercise's name box and its first weight box are both on
screen. Every setting in the sheet changes the logger behind it at once.
Arena off: the page is unchanged.

### 10 - NOTE - The clock stays when the rest timer is off

No change (Seth: "don't mind this actually"). With the rest timer off the
strip still shows the workout's elapsed time and set; the REST face simply
never appears.

### Open call - Coach: open tall, or always the strip

**Ruling.** Always folded, and since Nov 14 that means the rail (see 8),
not the strip. Coach never takes the open size, on first visit or after.
The chalk lines and the thinking dots are on the room's board in the full
view only; the page's own "Coach is thinking" line covers the rest. The ask box is visible at rest and with the keyboard open
(item 1). In the full view Coach behaves like every other place.

**Why.** Coach is a working page: the chat and the box need the height.
The board says what the chalkboard used to say.

### Open call - Swipe to walk

**Ruling (Seth's decision, fixed).** Not this round. Nothing is drawn for
it, and the artifact's own drag-to-walk was removed. The camera walks when
a tab is tapped. A drag on the arena only looks around when zoomed in.

### Light-mode arena (AR6)

Out of this round (Seth's decision, fixed). The room stays dark in light
mode. Nothing is drawn for it.

## State matrix

What must be on screen and usable, Arena on, at 412 x 839 and 360 x 740.
"Typeable" means: focus it without scrolling tricks and type a real
character. Prove every cell, side by side with the same state in the
artifact.

| Route | Idle | Live workout | Resting | Just finished |
| --- | --- | --- | --- | --- |
| Home `/` | Room open at the platform; board cycles the week; balcony THE PLATFORM. Start buttons pressable. | Strip only (as today). Strip: name over `12:34 · SET n`. The resume card is pressable. Home lit. | Strip: REST + drain bar. | Room open; board SAVED + name for ~5s; lamps flash; saved card. Start buttons pressable again. |
| Live logger `/sessions/<active id>` | (not reachable) | Strip only. Strip: name over `12:34 · SET n`. No clock line, title, hotbar or view switch in the page: one row (name box, Setup, X), then the lifts. Home lit. Name box, every weight / reps / effort box typeable. Setup, Log, Add set, Add exercise, Finish pressable. | Strip: REST, big countdown, drain bar. -15s / +15s / Skip pressable. Every box still typeable. | Leaves to Home (cell above). No page error. |
| Analytics `/analytics` | Room open; board opened to the view. View tabs and Advanced pressable. Scrolled: the rail, THE SCOREBOARD. | Same, plus the in-progress bar above the tabs. | Open: the opened board keeps the view. Rail (scrolled): REST m:ss, edge draining. | Rail (scrolled): SAVED + name for ~5s. |
| History `/sessions` | Room open at the stands; balcony THE STANDS. Rows pressable. Scrolled: the rail, THE STANDS. | Same + in-progress bar. History lit (you are browsing History). | Rail: REST. | Rail: SAVED; one more seat lit. |
| Past workout `/sessions/<other id>` | Rail; History lit. Reopen etc. pressable. | Same + in-progress bar. | Rail: REST. | Rail: SAVED. |
| Library `/templates` and below | Room open at the rack; balcony THE RACK. Scrolled: the rail, THE RACK. Search boxes typeable. | Same + in-progress bar. | Rail: REST. | Rail: SAVED. |
| Profile `/profile` | Room open at the lockers; balcony LOCKER ROOM. Scrolled: the rail, LOCKER ROOM. Settings pressable. | Same + in-progress bar. | Rail: REST. | Rail: SAVED. |
| Coach `/coach` | Rail only: COACH'S CORNER. Ask box above the tabs, typeable; Send and the suggestion chips pressable. | Same; the in-progress bar sits between the ask box and the tabs; **the box is still typeable**. | Rail: REST. Box typeable. | Rail: SAVED. Box typeable. |

Across every route:

| Condition | Must hold |
| --- | --- |
| Keyboard open | The folded stage stays (strip in the logger, rail elsewhere). The focused box is on screen. On Coach the ask box sits on the keyboard. In the logger the focused row is on screen. |
| Full view | The room fills the screen down to the one line and the tabs; roof to the top edge; the balcony name of the place is bright; tabs pressable and the full view survives a tab change; tapping the arena or the line brings the page back. |
| Strip | Logger and live Home only. Fades in place; never slides. Same face as the room board at that moment. |
| Rail | Every other folded page. 11 room rows. Fades in place over the last 30% of the fold; never slides. One line: REST, SAVED, or the place's name. |
| Slide-up sheet open | Squared skin; title readable; main button and the second button pressable; any text box in it typeable; backdrop tap closes it. |
| At rest | Zero animation frames, as today. The strip redraws only when its face changes (once a second while a clock runs). |
| Reduced motion | No easing: sizes and faces cut. The week face does not cycle. |
| Every screen | `document.documentElement.scrollWidth === window.innerWidth`. |
| Palettes | All five palettes: the room, roof and strip use the ramp read from the tokens; the sheet skins use tokens only. |

Home with a workout running keeps today's page (the resume card) and
today's strip size; the logger is the working page. In the artifact the
logger is drawn inside Home, which is the same ruling: Home owns it.

## Nothing is lost (Seth, Nov 10 and again Nov 14)

Seth's standing rule: nothing built so far may be lost; every feature
keeps a home. This round keeps it this way:

- **Arena view is a skin and a stage over the SAME pages.** The app's
  routes, pages and components are the real ones. The artifact draws only
  the pages this round changes; a feature the artifact does not draw is
  NOT removed. If it is in the app today, it is in the app after the
  build, in the same place, unless a ruling above names a new home.
- **Routes the matrix does not list** keep their page exactly as today
  and get the rail (they had the strip): the workout builder
  (`/create-template`, `/templates/:id/edit`), community workouts
  (`/templates/public`), the block builder (`/blocks/:id/edit`),
  **import from a sheet (`/blocks/import`)**, the running block
  (`/blocks/current`), `/log-workout`, every `/profile/*` page
  (appearance, training, security, AI and connector, feedback, what's
  new), and `/hello`. Login and register have no arena.
- **The only controls that move** are the logger's, in item 9's table.
- **Build check.** With Arena on, at 412 x 839: open each route above,
  confirm the page's primary action is on screen and pressable and every
  text box is typeable (the state matrix rule), including the import
  page's paste box and its Import button. Arena off: the full app is
  pixel-identical to today.

If the build finds a feature that this round would hide or strand, it
stops and reports it; it does not pick a new home itself.

## App files the build will touch

All under `client/src/`. One-line reason each.

**The room and the strip**

- `components/arena/arenaEngine.js` - draw the roof (purlins, truss, lamp
  cans and their shafts, upper deck, balcony names), the board's rigging,
  the banners' new hanging point; draw the board from one face; draw the
  strip as the room cut to the scoreboard (same lighting field, same board
  code) instead of the flat black panel; board widening for the live line
  and REST. The board already rises 4 rows on Analytics: keep that.
- `lib/arenaBoards.js` - the face data: every face as a label and a value
  that fit the 38-wide board (9 characters), the live line
  (`name` over `elapsed · SET n`), the History / Library / Profile faces
  in the new label-over-value form. Stays pure.
- `components/arena/ArenaStage.jsx` - hand the engine what the face needs
  (workout name, place); keep the stage's size change out of the route's
  view transition on Finish (item 7).
- `components/arena/arena.css` - only what the new strip needs (it no
  longer has its own background), plus the rail's height. The Coach page
  inset (item 1) must use the rail's height, not the strip's.
- `lib/arenaSheet.js` - a third folded size, the rail, and which routes
  get it (item 8). The fold and reveal maths are reused with the rail's
  height as the end of the ride.

**The skin and the pages**

- `styles/arena-skin.css` - skin the portaled sheets (item 6); hide the
  logger's own clock line under Arena (item 4).
- `pages/SessionDetailPage.jsx` - under Arena, the live logger's one-row
  header and the note link's new position (item 9). Arena off: untouched.
- `components/prefs/TrainingPrefsStrip.jsx` - not rendered in the live
  logger under Arena; a Setup button opens the sheet instead (item 9).
- `components/prefs/TrainingPrefsSheet.jsx` - a Layout line, Builder or
  Table, when opened from the live logger (item 9).
- `components/templates/ViewModeToggle.jsx` - not rendered in the live
  logger under Arena (item 9).
- `styles/coach-page.css` - size the Coach page for the strip under Arena
  so the ask box is on screen (item 1).

**The shell**

- `components/layout/BottomNav.jsx` - under Arena, light Home while the
  live logger is open (item 3). Do this here, not in
  `components/motion/navOrder.js`: the route transition's direction reads
  that file and must not change.
- `components/motion/RouteTransition.jsx` - stop the Finish page error
  (item 7).

If the build finds it needs a file not on this list, stop and say so in
the delivery report rather than widening quietly.

## What is NOT changing

- The ONE MOTION rule: the camera's height never changes; the stage rides
  the sheet's top edge as one piece with no gap; the strip fades in place;
  scrolling folds 1:1.
- The camera, the pixel size (4 CSS px per room pixel on a phone), the
  place positions, the open, strip (18svh) and tour sizes in
  `lib/arenaSheet.js`, and the fold / strip-reveal maths. The rail is a
  new, smaller end to the same fold (item 8).
- Everything below row 63 of the room except the board's rigging, the
  board's face and width, and where the banners hang: stands, platform,
  bar, towers, chalkboard, rack, lockers, the Log, the crown rain.
- Motion on the slide-up sheets, and every existing motion in the table at
  the bottom of the artifact.
- Coach's place in the nav (its own button; no tab).
- With Arena view off: nothing at all.
- Not in this round: light-mode arena (AR6), swipe-to-walk, the grip, the
  chalkboard's answer text, the program board's progress, the stands'
  crowd, the multi-view Analytics board (all listed in
  `docs/tasks/ar-fid-FINDINGS.md`; none is ruled on here).

## Where the design seat departed from the brief

Seth allowed design-only overrules if stated. All are noted in place
above; in one list:

1. The strip always looks at the platform's scoreboard, on every route.
2. The strip has no separate edge line or full-width rest line.
3. The board widens (38 to 64) for the live line and REST.
4. The scoreboard hangs from a spreader; the banners hang from the balcony.
5. Artifact only: wordmark and Coach button moved into the sheet; the
   place label is replaced by the balcony lettering; the Coach ask box and
   the logger's rest row and Finish are pinned above the tabs.
6. The artifact's default effort scale is RIR, so the Finish sheet reads
   as in the ledger.
7. Nov 14: the strip is the logger's only; other pages fold to the rail
   (item 8). This replaces "Coach: always the strip" with "always the
   rail" and removes the History / Library / Profile / Analytics strip
   faces (those faces still show on the room's board when open).
8. Nov 14: the logger's hotbar and view switch move into the Setup sheet
   under Arena (item 9).
