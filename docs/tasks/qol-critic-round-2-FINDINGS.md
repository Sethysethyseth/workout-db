# QOL feel critic, round 2 - FINDINGS (preserved from `.playwright-mcp/qol-critic/round-2.md`)

> Seat triage (Oct 9, Opus seat). Round 2 scores: wave 6/10 (round 1 was 5/10),
> look and feel app-wide 5/10. 78 screenshots in `.playwright-mcp/qol-critic/round-2/`
> (gitignored, local only).
> - **Part A -> fix round:** qolf6 (logger: #2, #4, #5, #11) and qolf7 (#1, #3,
>   #6, #7, #8, #9, #12). File-disjoint, run in parallel.
> - **#10 (focus on the missing-effort sheet) is Seth's call** - NOT fixed; asked.
> - **Part B is input for the NEXT frontend wave** (Seth, Oct 9) - NOT fixed here.
>   It gets compiled with round 3's Part B into one look-and-feel doc for that wave.

# QOL feel critic, round 2 of 3

SCORE (wave): 6/10
SCORE (look and feel, app-wide): 5/10

Wave: round 1's three visible breakages are gone. The phone bar, the boxed coach thread and the crushed key form are all fixed, and almost every targeted change landed cleanly. But the wave's own pieces collide in two places. The In progress bar now sits on top of the coach composer during a workout. And the qolf5 ghost-input style kills qolf3's missing-field tint. The setup sheet also hit its height target by crushing its gaps. Two of Seth's three checks fail somewhere ("nothing cramped", "fixed bars never cover what you type"), which caps the wave at 6.

App-wide: the personality is real (the scene art, the palettes, the notched hero frame). The best surfaces are History and the summary tables. But the app speaks two visual languages, has five "selected" styles, and puts long text straight on busy scene art. It reads as competent but assembled, not designed as one system.

Setup notes: 390x844 champ dark unless named. Cold loads showed 2-5s of splash or blank scene. `/auth/me` answered in 125ms, so I treat that as Vite dev-server module loading and did not score it.

---

## Part A - wave fix list

### P1

1. **P1 / H (qolf1 x qolf2): during a live workout, the In progress bar covers the coach composer.**
   - On /coach the bar wrap (z-index 5) sits at y 718-788, and the textarea sits at y 726-770. `elementFromPoint` at the textarea returns `persistent-workout-bar__title`.
   - No composer is visible at all. The bar's x is Discard, so the only on-page way to reach the box is to discard the workout.
   - Screenshot: `A-coach-empty-live.png`. Without a workout the composer is fine (`A-coach-empty.png`).
   - Cause: `PersistentWorkoutBar.jsx:87` hides the bar only on `/` and `/blocks/import`.
   - Smallest fix: add `/coach` to that hide rule. Alternatively, lift the composer by the bar's height when a session is live.

### P2

2. **P2 / D (qolf3 x qolf5): the Add RIR tint is dead whenever Repeat last is on.**
   - Add RIR does scroll Set 1's RIR to y 363 (mid-screen), but only the "RIR" label turns amber. The field keeps bg rgb(15,22,40) and border #4a6282.
   - Screenshot: `A-add-rir-scroll-tint.png`.
   - Cause: the hint input carries the inline `LAST_TIME_GHOST_INPUT_STYLE` (`SessionDetailPage.jsx:288`: `background: var(--color-surface-1)` and `border: 1px solid var(--color-input-border)`). Inline wins over `logger.css:88-96`. Repeat last is on by default, so most lifters never see the tint.
   - Smallest fix: move that style object into a class in `logger.css`, or drop `background` and `border` from it.
3. **P2 / A (qolf4): the Logging setup sheet fits by being cramped.**
   - It sits at about 86% height with no inner scroll (good).
   - But the gap from help text to the next label is 4px (331 to 335, 696 to 700), subtitle to "Units and effort" is 8px, and help text to the next group is 9px. The groups run together.
   - Screenshot: `A-logging-setup-sheet.png`.
   - Fix: restore about 16px between groups and 8px from helper to label. Take the height back from the segmented control heights or the lead line, or allow about 90%.
4. **P2 / C (qolf3): the exercise "..." is a hidden one-shot delete.**
   - "..." (aria label "Remove Barbell Squat") goes straight to "Remove Barbell Squat?" with "Yes, remove" / "Cancel".
   - There is no consequence line even with 2 logged sets, the button labels are generic (rule 3), and "..." promises a menu.
   - Screenshot: `A-exercise-more-menu.png`.
   - Fix: add "Your 2 logged sets will be deleted." and name the buttons "Remove exercise" / "Keep exercise". Either make "..." open the one-row icon-list sheet, or use a trash icon.

### P3

5. **P3 / C:** the exercise suggestion list runs under the Finish dock, and the last options are hidden behind it (`B-logger-suggestions.png`). Fix: cap the list height to the space above the dock, or scroll the input up on focus.
6. **P3 / I:** a cold load of `/coach?c=4` lands at scrollTop 818 of 875, so the newest answer's last paragraph is below the fold (`A-coach-continued-cold.png`). After a send it is correct. Fix: scroll to the end after layout settles (next frame or fonts ready).
7. **P3 / H:** an 18px strip of scene shows between the composer bottom (772) and the nav top (790) (`A-coach-empty.png`). Fix: run the backing down to the nav.
8. **P3 / K:**
   - The "Let assistants draft blocks" off switch is still a dark knob on a dark track (`A-key-form-empty.png`). The qolf4 knob token did not reach it.
   - "Open the coach from the chat bubble at the top of Home." repeats paragraph one of the same card (`A-key-saved.png`).
   - Fix: use the shared off-knob token, and drop the footer line.
9. **P3 / L:** the block run page still marks the selected day with a white outline, and the NEXT badge overlaps the pill border (`B-block-run.png`). The builder now uses the accent tint. Fix: use the same tint there.
10. **P3 / D:** the missing-effort sheet puts focus on "Finish anyway", not "Add RIR" (`A-finish-missing-effort-sheet.png`). In an RIR-first app the safe default is Add RIR. This is Seth's call.
11. **P3 / C:**
    - The "Sets" select shows the logged count ("1", then "2") while 4 set rows render (`A-qolf5-hints-before-log.png`).
    - "+ Add set" jumps from the top row to below the list after the first log (`A-qolf5-set1-logged-hint-stays.png`, `A-logger-lower-sets.png`).
    - Fix: keep Add set in one place, and make the select show the row count or hide it.
12. **P3 / E:** with a live workout, Last 7 days says Workouts 1, Sets 2 and Top set 130 x 5, while its day strip reads "0 of 7 days trained" (`A-home-live-card-390.png`). Fix: leave in-progress work out of the card, or mark today.

### Per change

- **qolf1**
  - Bar at 390 (one-line status, one-line title, "Resume"): **fixed** (`A-bar-analytics-390.png`).
  - Bar at 1280 matches each column: **fixed**. Measured bar vs column: Analytics 158-1106 = 158-1106; History the same; Library 280-1000 = 280-1000; Training 296-968 = 296-968; Profile 166-1114 matches its two columns (`A-bar-profile-1280.png`).
  - "Workout discarded" notice with the copy and an x: **fixed** (`A-discarded-notice.png`).
  - Home live card heading is the workout name, and Resume spans the card (32-343): **fixed** (`A-home-live-card-390.png`).
  - Focus ring on the safe action: **fixed** on Keep workout, Keep set, Keep conversation and Keep key. The missing-effort sheet is the exception (#10).
  - Analytics > Strength does not scroll sideways at 390: **fixed**. scrollWidth equals clientWidth (375) in all 10 palette x mode combos, crimson light included.
- **qolf2**
  - One scroller, and new answers come into view: **fixed** after a send (`A-coach-long-thread.png`); **partly** on a cold load (#6).
  - Full-bleed composer backing: **fixed** (`A-coach-empty.png`), apart from the seam (#7). But the bar covers it during a workout (#1).
  - Stop is readable and suggestions have a chat mark: **fixed** (`A-coach-wait-stop.png`).
  - Library > Coach trash button with a danger confirm that says what happens: **fixed** (`A-coach-row-delete-confirm.png`).
  - Row meta without the middle dot ("General, today"): **fixed** (`A-library-coach-tab.png`).
  - Key form stacks at full width, and the copy points at the coach page: **fixed** (`A-key-form-empty.png`, `A-key-form-typed.png`); the copy is duplicated (#8).
- **qolf3**
  - Only the name line is sticky, and Remove sits behind "...": **fixed** for stickiness; the "..." itself is #4.
  - The logged dock is just the button plus the rest bar (about 122px with the rest bar, down from 155): **fixed**.
  - Sentence case ("Builder view", "Table view", "Reps in reserve"): **fixed**.
  - Add RIR scrolls the first missing field mid-screen and tints every missing field: **partly**. The scroll works; the tint is dead with Repeat last on (#2).
  - Accent outline and check on ghost set-number buttons: **fixed** (`A-qolf5-hints-before-log.png`).
  - In-app delete-set confirm ("Delete this set?", focus on Keep set): **fixed** (`A-delete-set-confirm.png`).
- **qolf4**
  - Sheet about 86% tall and fits without inner scrolling: **partly**. It fits, but it is cramped (#3).
  - Off switches visible: **fixed** on Training and in the sheet (`A-training-1280.png`); **not fixed** on AI access (#8).
  - The Notes pill says "Exercise notes": **fixed**.
  - Training at 1280 (segmented controls 360px, "on this device"): **fixed** (`A-training-1280.png`).
  - Builder day pill and selected segment use the accent tint: **fixed** in the builder (`A-builder-existing.png`, `A-builder-reps-time-sheet.png`); not on the run page (#9).
  - A held card lifts with a 2px accent ring and a glow: **fixed** (`A-builder-held-card.png`).
- **qolf5**
  - Grey hint in every empty RIR box (Squat 3/2/2/1, which matches Sep 8 in `B-session-summary-top.png`): **fixed**.
  - The hint stays after the set is logged, until you type: **fixed** (`A-qolf5-set1-logged-hint-stays.png`, `A-qolf5-typed-rir.png`).
  - Never filled in, and Finish counts hint-only sets as missing ("2 sets have no RIR"): **fixed**.
- **Auth:** **fixed**. Five cold loads showed the splash and never the Login screen.

### Round 1 surfaces A-M, re-walked

- **A, B:** see qolf4. The Home strip renders cleanly in all 10 combos (`B-pal-home-*`).
- **C, D, F:** see qolf3 and qolf5. This also covers the iron dark gap from round 1.
- **E:** good.
- **G:** the rest bar is unchanged and fine.
- **H:** #1 and #7; otherwise good.
- **I:** good.
- **J:** not re-walked. demo.critic has no custom exercise, and the brief forbids creating one.
- **K:** #8.
- **L:**
  - The tints and the glow pass. "Close" now returns to Library.
  - Still open, as already stowed: the ALL-CAPS sheet titles, and the day strip clipped with no fade (`A-builder-held-card.png`).
- **M:**
  - Execution shows whole numbers (50%, 100%, 25%).
  - Crimson light and crimson dark render (`B-pal-analytics-crimson-*`).
  - What's New `?preview=1` (`B-whats-new.png`) and the Profile "Latest update" card (`A-profile-preview-latest.png`) render.

---

## Part B - look and feel, for the next-wave redesign

### Keep

- **The scene art per palette.** The city, ember, forest, slate and red skylines are the single biggest "this is LogChamp, not a template" signal, especially behind empty states and the login (`B-login.png`, `B-pal-home-*`). Keep it as a backdrop; control where it meets text (see Change #4).
- **The notched-corner hero frame** on Home's "Start a workout" (`B-home-idle-champ-dark.png`). It is the one memorable element on Home and it re-tints per palette. Keep it as Home's signature and do not spread it.
- **Palettes as whole environments.** Accent, scene, surfaces and crown all shift together. The crown mark is a good small brand device.
- **History.**
  - The date tiles (accent weekday over a big day number) and the right-aligned top set and volume (`B-history-list.png`).
  - The desktop version, with TOP SET / VOLUME / TIME columns, is the most professional screen in the app (`B-desk-history.png`).
- **The session summary tables** (SET / WEIGHT / REPS / EFFORT rows) (`B-session-summary-top.png`).
- **The block logger's density.** About 50px set rows in a SET / REPS / WEIGHT / RPE grid, plus the quote-ruled coach note (`B-block-day-rack-pull.png`). This is the right base for all logging.
- **The confirm pattern.** A question title, one consequence line, a danger action, and a named keep action that has focus (`A-coach-row-delete-confirm.png`, `A-key-remove-confirm.png`).
- **Small feedback that works:**
  - The weeks picker selects instantly and dims the body while it loads (`B-analytics-weeks-4-loading.png`).
  - The rest bar's depleting line.
  - The held-card glow.
- **Plain, specific copy** in confirms and in the missing-effort sheet.
- **The Muscles bars** (nested effective / stimulating bars) (`B-analytics-muscles.png`).

### Change, ranked by impact

1. **Two visual languages (plus a third wordmark).**
   - Block surfaces speak condensed blocky caps: "LIBRARY", "PHASE 1", "R2 SKELETON", "BARBELL BENCH PRESS - MEDIUM GRIP", "RACK PULL", "IMPORT A BLOCK", "REPS / TIME", "+ COACH NOTE", "NO SAVED WORKOUTS". See `B-library-blocks.png`, `A-builder-existing.png`, `B-block-day-logger-top.png`, `B-import.png`, `B-block-run.png`.
   - The rest of the app speaks a wide rounded heading face plus a sans body: "Analytics", "History", "Coach", "Start a workout".
   - Home shows both on one screen: "Start a workout" next to "W1 · LOWER - HIP DOMINANT".
   - Login and the splash use a third face, a pixel "LOGCHAMP" (`B-login.png`), while the header wordmark is the rounded face.
   - Import's help text is a whole ALL-CAPS paragraph.
   - Direction: pick ONE display face and give it a narrow job (page titles and big numbers). Everything else, exercise and block names included, is sentence case in the body face. Caps survive only as one tiny eyebrow style at one size and tracking. Pick one wordmark.
2. **Selection, buttons and section headers drift by page.**
   - A "selected" option has five looks: solid accent (Training lbs/RIR, `B-training-390.png`); accent tint (builder, weeks picker, Analytics tabs); solid white (Library "Yours" and "BLOCKS", Import "Paste"); white outline (block run day); dark fill with a border (Appearance "Dark", `B-appearance.png`).
   - Buttons come in about five tiers: filled accent, dark outlined, solid white ("New block", "Open", "Start"), bare text ("Edit", "Make public", "Settings", Import "Cancel"), and light lavender on Login.
   - Direction: one selected token, three button tiers (primary, secondary, quiet), and one section-header style.
3. **Two loggers.**
   - The quick logger's Builder view stacks labelled fields, about 240px per set, so you see about 2.5 sets per screen (`A-qolf5-hints-before-log.png`).
   - The block logger is a dense table (`B-block-day-rack-pull.png`).
   - Same job, different chrome: headings ("Log workout" vs no title), add actions, set number treatment.
   - Direction: one logger on the block-table grid for both workout types. Keep the single sticky name line, the one-line dock, and set-number-as-log.
4. **Text straight on busy scene art.** Long text crosses the bright skyline band (about y 650-790 at 390):
   - Coach answers (`A-coach-long-thread.png`).
   - The What's New body and its "See the details" link (`B-whats-new.png`).
   - The "Recent workouts" heading, Library coach rows (`A-library-coach-tab.png`), and the Profile "Log out" box (a translucent bordered box that reads like an empty input, `B-profile-390.png`).
   - Direction: content always sits on a surface or a scrim, and the scene shows only where nothing is being read: headers, margins, empty states.
5. **Hierarchy and type scale are uneven.**
   - In-card headings run 28px ("Execution", "Data quality", "Strength trends", `B-analytics-execution.png`) next to 11px caps labels. The page title and the card titles compete.
   - Analytics Exercises rows truncate names ("Standing Calf Rai...", "Bent Over Barbell ...") because three stat columns squeeze them. Best E1RM is orphaned on its own line, and each row is a 120px card (`B-analytics-exercises-rows.png`).
   - History meta orphans "sets" on line 2.
   - The summary grid has an empty sixth cell.
   - Every exercise carries a green "Tracked" pill, which is noise (`B-session-summary-top.png`).
   - Direction: a 4-5 step type scale. Card titles sit a step below the page title. Exercise rows use name plus one hero number, with the rest on demand.
6. **Loading states differ by page.**
   - Blank scene: the logger (2-5s, with the bar offering "Resume" for the workout you are opening), the builder, and the Analytics body (`B-analytics-top-champ-dark.png`).
   - An empty bordered card: the Home block card (`B-pal-home-iron-dark.png`).
   - Shimmer skeletons: Library, the block run page, Home in chill light (`B-pal-home-chill-light.png`).
   - Library tab counts read "0" until loaded, then the Running card pops in about 80px down (`B-library-workouts.png` vs `B-library-exercises.png`).
   - Direction: one skeleton language, shown at once, that reserves the final layout. (Duration is exaggerated by dev mode; the inconsistency is not.)
7. **Copy and punctuation that read amateur against "very professional":**
   - The Login tagline "Log your shit dog" (Seth's call: personality or pro).
   - "→" in links ("See analytics →", "View all → History").
   - Middle-dot meta everywhere; "last 30d ago"; "2 set(s)"; "PARKED" / "Create workout is parked"; "Quick log (one-time)"; "exercise catalog files"; an em dash in the logger subtitle; "DRAFT" in caps mid-sentence.
   - Number formats disagree: 14.8k lbs next to 5780 lbs.
   - Direction: apply rule 3 app-wide, not only to new surfaces.
8. **The desktop shell.**
   - The phone nav is Home / Analytics / History / Library / Profile. The desktop nav is Workout / Library / History / Analytics, with Profile as a bare top-right link that has no active state (`A-bar-profile-1280.png`).
   - Column widths change per page: 948 (Home, Analytics, History), 720 (Library), 672 (Training).
   - The wordmark sits 15px left of the content column (`B-desk-home.png`).
   - Library on desktop is one 240px card per block in a narrow column (`B-desk-library.png`).
   - Direction: one shell grid, the same nav names and order, and a block grid on desktop.

### Inconsistencies

| Job | Style A (where) | Style B (where) | Style C+ (where) |
|---|---|---|---|
| Selected option | solid accent fill (Training lbs/RIR) | accent tint (builder W1/Day/Edit, weeks picker, Analytics tab) | solid white (Library Yours/BLOCKS, Import Paste); white outline (block run day); dark fill and border (Appearance Dark) |
| Page title | wide rounded mixed case (Analytics, History, Coach, Training) | condensed caps (LIBRARY, IMPORT A BLOCK) | none (Profile, block logger, builder) |
| Section header | caps on a dark chip outside the card (Profile SETTINGS, AI access, Appearance THEME, Security, Feedback) | accent sentence case inside the card (Training, Logging setup sheet) | caps with an accent tick (What's New); caps with a rule (builder "DAY 1 ——") |
| Bottom sheet chrome | grabber, sentence-case title, no x (confirms) | no grabber, caps title, x (builder REPS / TIME) | grabber, title, Done (Logging setup) |
| Set entry | stacked labelled fields (quick logger) | table grid (block logger) | |
| Add action | "+ Add set" outlined button (both loggers) | "+ Note" accent text link (block logger) | "+ COACH NOTE" caps ghost (block logger, run page); "+ ADD EXERCISE" dashed caps (builder) |
| Destructive entry | trash icon (Library coach rows) | x (remove set, discard workout) | "..." then confirm (remove exercise); red "Delete" text (Library block card); red-text box (Log out) |
| Confirm button names | "Delete set" / "Keep set" (sets, conversations, key, workout) | "Yes, remove" / "Cancel" (remove exercise) | |
| Switch off state | light knob, dark track (Training, setup sheet) | dark knob, dark track (AI access draft blocks) | |
| Form submit | primary accent (Security Update password, Save key) | secondary dark (Feedback Send feedback) | light lavender (Login, Create account) |
| Form label | bold white 16px (Security, key form) | grey 13px (Feedback Category/Message) | caps paragraph (Import) |
| Loading | blank scene (logger, builder, Analytics body) | empty bordered card (Home block card) | shimmer skeleton (Library, block run); pixel splash (auth) |
| Tags and pills | caps PRIVATE / RUNNING / PARKED (Library) | sentence lbs / RIR / Repeat last (Home strip) | green "Tracked" (logger, summary) |
| Back / exit | "← Profile" link (Profile sub-pages) | "Back" pill (logger, summary) | "Close" pill (builder) |
| Wordmark | pixel LOGCHAMP with crown (Login, splash) | rounded "LogChamp" with small crown (Home header, desktop nav) | |
| Big-number format | 14.8k lbs, 14.3k lbs | 5780 lbs, 9403 lbs | |
| Primary nav | Home / Analytics / History / Library / Profile (phone) | Workout / Library / History / Analytics, plus Profile on the right (desktop) | |

### Palette notes

- **Crimson (both modes): the accent is the danger hue.**
  - Rising strength trends are drawn in alarm red (`B-pal-analytics-crimson-dark.png`, `-light.png`). "Delete" red and accent red cannot be told apart.
  - In dark mode the scene floods the whole viewport red (`B-pal-home-crimson-dark.png`). It reads as an error state, which is the worst fit for an analytics app.
  - Needs a non-red danger, or an accent that is not the danger red.
- **Forest:** "good" green equals the accent green, so "+47 lbs" and "+35 lbs" gains do not pop against green chrome (`B-pal-analytics-forest-dark.png`, `-light.png`).
- **Iron light:** amber text on cream ("Edit", "NEXT IN YOUR BLOCK", "COACH") is low contrast (`B-pal-home-iron-light.png`, `B-pal-analytics-iron-light.png`).
- **Chill dark:** the flattest combo. The scene is nearly invisible, and the slate primary button has the weakest pull (`B-pal-home-chill-dark.png`).
- **Light modes in general:** the scene bleaches to a grey haze behind white cards, so they read more generic than dark. Card vs background contrast is thinnest in chill light (`B-pal-home-chill-light.png`).
- **Best:** champ dark, then forest dark and iron dark.

### The three biggest levers

1. **One type system.** One display face, used only for page titles and hero numbers. Sentence case everywhere, block surfaces included. One tiny caps eyebrow style. One wordmark.
2. **One component state system.** A single "selected" token, three button tiers, one section-header style, one sheet header, and one off-switch knob. This is the difference between "assembled" and "designed".
3. **One logger, and content always on a surface.**
   - Rebuild quick logging on the block logger's table grid (single sticky name line, one-line dock).
   - Give every reading surface a backing or scrim so the scene is the stage, not the page.

---

## Cleanup confirmation

- **Workouts:** quick workout session 493 was discarded via the Home card x and Discard workout (`A-discarded-notice.png`). Block day session 494 was discarded via the logger x (0 sets, so no confirm). API `GET /sessions/493` and `/494` both return 404, and Home shows "Start a workout". Nothing was finished.
- **Key:** the fake key (wxyz) was saved, then removed. API `/coach/status` reports `byoKey.saved: false`.
- **Coach:** conversation c=4 (4 questions, mock answers) was deleted via Library > Coach. API `/coach/conversations` returns 0 items.
- **Builder:** opened on block 123, held a card without moving it, and opened the Reps/Time sheet. Never saved; status stayed SAVED. All four templates keep their Sep 30 `updatedAt`. No draft key in localStorage.
- **Other:** nothing imported (Import page looked at only). No custom exercises (API returns 0). The weeks picker was put back to 12.
- **Accounts and theme:** the probe account was only used to view /coach, and nothing was sent. demo.critic is signed back in. Theme and palette are reset to dark / champ.
