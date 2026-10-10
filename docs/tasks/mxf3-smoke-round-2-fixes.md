# TASK MXF3: Seth's smoke round 2 fixes (coach field under the keyboard, plain chat-bubble icon, a test keyboard for the critic)

STATUS: QUEUED
MODEL: auto   <!-- Fable 5.1 + Opus capped in Cursor until Oct 18; Seth: auto + a harder Opus-seat audit -->
MODE: 1-relay (lane worktree)

CONTEXT:
Seth re-smoked `motion-wave` (MXF2 + MXC1) on his phone on Oct 10: Android
Chrome, 1080x2424 screen (about 411 CSS px wide, DPR ~2.6), Gboard, gesture
navigation, crimson dark. He found two defects and called this class of
miss "getting embarrassing", so the fix also ships a test keyboard that later
critic rounds use to catch these before he does. His answers to the two
questions still open from the last smoke: gains stay green on crimson, and
History keeps remembering the Coach side. Neither needs a change here.
Design of record stays `docs/design/mocks/motion/MOTION-DIRECTION.md` and
`ROADMAP.md`. Keep ROADMAP.md current: the "MXF3" entry already exists, so
update its status and the "Last checkpoint" line like the MX units.

Item 1 is a BUG. In DELIVERY.md, give it a root-cause section BEFORE the
fix: file:line, the mechanism, and why it explains exactly what Seth saw.
Then make the fix. The fix must hold whichever candidate cause turns out to
be true, because nobody here can open a real Android keyboard.

CHANGES:
1. BUG: on `/coach` the keyboard covers the field you are typing in.
   Seth's screenshot (keyboard up, typing a question): the page header
   "Coach" is still at the top, so the page has not panned. The cap line
   "4 of 7 questions left this week" shows. The input row is cut in half by
   the keyboard's top edge, and the send button is clipped. The overshoot is
   about 20-25 CSS px, close to Android's gesture-bar inset. The code today
   is the `fit()` effect in `CoachPage.jsx`. It treats the keyboard as up when
   `innerHeight - vv.offsetTop - vv.height > 80`, sizes `.coach-page` from
   its own rect top and `vv.height`, and toggles `html.coach-kbd` to hide
   the bottom nav. Confirm or rule out each candidate below, ranked, with
   evidence:
   (a) In edge-to-edge Chrome on Android (`viewport-fit=cover` is in
       `index.html`), `visualViewport.height` reports more visible height
       than there is, by the bottom system inset.
   (b) The overlap formula drops to 0 when Chrome pans the visual viewport
       to reveal the field (offsetTop can grow up to `innerHeight - vv.height`).
       The class and the height then switch off mid-sequence, and the last
       fit runs on stale geometry.
   (c) Layout moves without a visualViewport event, so `fit` never re-runs.
       Examples: the document's scroll clamps after the height change, the
       route transition commits, the first-open note mounts, the composer
       grows, fonts load.
   Fix contract (Cursor picks the implementation):
   - Keyboard state: "open" holds only while a field inside the coach page
     has focus AND the geometry says a keyboard is up. Read the geometry
     from the best source the browser has. When `navigator.virtualKeyboard`
     exists (Chrome), the keyboard's top comes from that API. It only
     reports geometry while `overlaysContent` is true, so set it only while
     `/coach` is mounted. Restore the previous value on unmount and on any
     route change, including the transition window where the route layer
     keeps this page mounted (see `stillOnCoach` in the same file). No other
     page may ever run with it on. Without that API (iOS Safari, Firefox),
     compare `visualViewport` against a no-keyboard baseline height, never
     against `innerHeight - offsetTop`. A pan must never switch "open" off.
   - Layout invariant: while open, the composer's bottom edge sits at the
     keyboard's top, 0-4 px above it, and the whole input and send button
     are visible. The page header stays visible, and the conversation
     scroller takes up whatever height is left. When the keyboard closes,
     the page returns to its normal phone layout: bottom nav back, no
     inline height left behind, and the composer backing still runs down to
     the nav (the qolf7 rule in `coach-page.css`).
   - Self-check: one frame after each fit, measure the composer's bottom
     against the keyboard top. If it is off by more than 2 px, correct it
     once. An unknown offset must never leave the field covered.
   - Re-fit triggers: visualViewport resize and scroll, virtualKeyboard
     `geometrychange`, focusin and focusout inside the page, window resize,
     and the composer changing height (the textarea grows with its text).
     At most once per frame.
   - The conversation still lands at its newest message when the keyboard
     opens. Nothing jumps while the user scrolls the thread.
   - Debug readout: only when the URL carries `?kbdebug=1`, `/coach` shows
     a small fixed readout (tokens only) of innerHeight, vv.height,
     vv.offsetTop, the virtualKeyboard rect (or "none"), the computed
     `env(safe-area-inset-bottom)`, the page top, the composer bottom, the
     keyboard top used, and which source supplied it. Without the param it
     never renders. If a gap is left on the phone, Seth screenshots this.
   - Keep the pure geometry (inputs -> page height / open state) in an
     exported function in a new module under `client/src/lib/`, with no
     imports and no DOM access, so node can run it directly.
2. Coach icon: a plain chat bubble. Seth: "its off, the crown needs to go,
   just make it a chatbox icon." The bubble's circle in `CoachMarkIcon.jsx`
   today is centred near (14.7, 13.3) in a 24-unit box, so the crown sits up
   and to the left inside it, and the glyph sits off-centre in the round
   Home button. Redraw `CoachMarkIcon` as a plain chat bubble: a rounded
   body with a small tail, outline only, NOTHING inside (no crown, no dots,
   no lines; the "..." already read as a glitch in round 1). Match the
   bottom nav icons: `strokeWidth="1.8"`, `currentColor`, round joins
   (`components/layout/BottomNav.jsx`). Geometry rules: the body's bounding
   box is centred in the 24-unit box within 0.5 units on both axes, the
   tail stays inside the box, and no stroke touches the box edge. Both
   current uses get the new glyph: the Home masthead button
   (`DashboardPage.jsx`) and the coach page's intro mark (`CoachPanel.jsx`).
   Keep the component name; update its comment. In the 44 px masthead
   button, the glyph's painted box is centred within 1 px. Leave every
   other coach crown alone. That covers the reply-avatar crown
   (`coach-msg__crown`), the launcher/panel crowns, the working-bar beat
   and the AiWait crown. Those are the coach's identity and wait language,
   not the button.
3. A test keyboard for Playwright and the critic. Add
   `scripts/virtual-keyboard-shim.js`: plain browser JavaScript, injected
   with `page.addInitScript({ path })` or pasted into `browser_evaluate`,
   and never imported by the app. It fakes an Android or iOS keyboard well
   enough that a screenshot shows whether a field is covered. Models:
   - `chrome`: Chrome's default (resizes-visual). `innerHeight` stays
     fixed and `visualViewport.height` shrinks by the keyboard height K.
     If the focused field would sit under the keyboard, pan offsetTop to
     reveal it, as Chrome does, and fire visualViewport `scroll`.
   - `edge`: like `chrome`, but `visualViewport.height` over-reports by
     an inset N (default 24) - candidate (a). Also provide a fake
     `navigator.virtualKeyboard` whose `boundingRect` carries the TRUE
     keyboard rect and fires `geometrychange`, but only while
     `overlaysContent` is true. While it is true, the visual viewport does
     not shrink or pan; that is the real API's behaviour.
   - `ios`: no `navigator.virtualKeyboard`. The visual viewport shrinks,
     offsetTop pans to reveal the field, and the document can scroll.
   - `content` (resizes-content): `innerHeight` and `visualViewport.height`
     shrink together.
   In every model, draw an opaque keyboard rectangle at the true keyboard
   rect (fixed, topmost, `pointer-events: none`), so screenshots show
   exactly what it covers. API on `window.__kbd`:
   - `open(model, { height, inset })` and `close()`.
   - `auto(model, opts)`: opens on focusin of an input, textarea or
     contenteditable, and closes on focusout to nothing editable.
   - `report()`, returning `{ model, keyboardTop, focused: { tag, name,
     top, bottom }, covered }`, where `covered` is true when any part of the
     focused field's box sits below `keyboardTop`. It also returns a list
     of fixed or sticky elements that overlap the focused field (bottom
     nav, Finish dock, bars, chips).
   Override with `Object.defineProperty` on the instances (`window`,
   `window.visualViewport`, `navigator`), and restore everything on
   `close()`. Put a usage comment at the top of the file with a Playwright
   example and the 390x844 numbers the critic uses (K = 300).

GUARDRAILS (same as every MX unit):
- Zero new dependencies; no package.json / lockfile changes, no installs.
- Client only, plus the one dev script. Tokens only (check-hex clean). All
  5 palettes x light/dark.
- Do not change the app's viewport meta. A global `interactive-widget`
  change would move every fixed bottom bar and break the logger's keyboard
  detection (`restLeave.js`, the `bk-log-kbd` effects), so it is out.
- Do not touch the loggers, the CoachWorkingBar placement logic, or any
  other page's keyboard handling. This block is `/coach` only.
- Navigation never waits on an animation; a tap mid-transition wins.
- Do not change the 420 ms route duration or the FLIP / surface durations.
- Nothing a page does today goes missing (content, warnings, buttons).
- Phone first (390 px), no horizontal scroll.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (the MXF3 entry + Last checkpoint only)
- `client/src/pages/CoachPage.jsx`
- `client/src/components/coach/CoachPanel.jsx` (only the composer, if the fit
  needs a ref or a resize hook there, and the intro mark)
- `client/src/components/coach/CoachMarkIcon.jsx`
- `client/src/styles/coach-page.css`
- new module(s) under `client/src/lib/` (the pure keyboard geometry)
- new `scripts/virtual-keyboard-shim.js`
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable; the reviewer also checks each item
in a real browser at 390x844 on the staging DB, using the shim):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` exits 0, or DELIVERY.md justifies each hit.
- `npm run test:unit` from `server/` stays green (verbatim count).
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (gitignored `.playwright-mcp/` aside); no package changes.
- `rg -n "interactive-widget" client/` finds nothing, and `index.html` is
  unchanged.
- Item 1, pure function: DELIVERY.md shows the module's export, and a table
  produced by actually running it in node (`node -e "import(...)"`, with the
  command shown). It covers at least: no keyboard; `chrome` with no pan;
  `chrome` panned to the bottom (still open); `edge` with the
  virtualKeyboard rect; `ios` panned; `content`; field blurred with a
  keyboard-sized viewport (not open). Each row gives the page height and
  the open state.
- Item 1, in the browser with the shim, on `/coach` at 390x844 with the
  composer focused, for EACH of the four models: `__kbd.report().covered`
  is false. The composer's bottom sits 0-4 px above `keyboardTop`, and the
  send button's rect lies fully above `keyboardTop`. After `close()` and a
  blur: no `coach-kbd` class, no inline height on `.coach-page`, the bottom
  nav is visible, and `navigator.virtualKeyboard.overlaysContent` (in the
  `edge` model) is back to false once you navigate to Home. DELIVERY.md
  shows the measured numbers per model, plus one screenshot per model saved
  under `.playwright-mcp/mxf3/`.
- Item 1, root cause: DELIVERY.md ranks candidates (a)-(c) with evidence
  and names anything else found.
- Item 2: DELIVERY.md shows the new path data, the computed bounding box of
  the bubble body in viewBox units (centred within 0.5), and the measured
  centre offset of the painted glyph inside the 44 px masthead button
  (within 1 px). `rg -n "crown" client/src/components/coach/CoachMarkIcon.jsx`
  finds nothing.
- Item 3: DELIVERY.md shows `__kbd.report()` output from a real page for
  each model, AND one deliberate negative proving the shim catches a
  miss: on the fixed build, a field nothing fits (for example a plain
  input appended at the bottom of the page through `evaluate`) reports
  `covered: true`, and its screenshot shows the drawn keyboard over it.
- Browser access: the lane has no `server/.env`, so stub the API in the
  browser (Playwright `page.route` for the auth and coach endpoints the
  page calls). Say what you stubbed. If the lane cannot drive a browser at
  all, say so plainly and deliver the pure-function table plus the shim
  code; the reviewer runs the browser checks. Do not stall on it.
- DELIVERY.md: one section per CHANGE item 1-3 with what changed, the file
  and lines, and how it was verified; ROADMAP MXF3 status; anything not
  done marked PARTIAL with a "pick up here" note.

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
