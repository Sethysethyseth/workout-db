# TASK qol6: The coach helps with the app - app guide, help mode without consent, a /coach page, entry points, a better wait

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
This unit covers Seth's ask 6 plus two stowed items:
- **Ask 6.** The coach tells users it can help them navigate the app, and
  it actually can. Ruling 4 (`docs/specs/quality-of-life-wave.md`):
  without AI consent the coach answers how-to questions from an app guide
  and receives NO training data.
- **Coach discoverability.** Today the panel only mounts on Analytics, the
  finished-workout debrief and the builder sheet.
- **A "thinking" state** that fits the coach. `AiWait`'s slow copy talks
  about big blocks.

The persona already counts "how to use LogChamp" as on-topic
(`server/src/coach/prompt.js` 28), but the model has nothing to answer
from. Recon: `docs/tasks/qol-r2-...-FINDINGS.md` section C and
`docs/tasks/qol-r3-...-FINDINGS.md` sections B and F. Design rules: spec
section 2.

FILES TO TOUCH:
- server/data/app-guide.md                 (new - the guide, user-facing prose)
- server/src/coach/appGuide.js             (new - loads the guide)
- server/src/coach/prompt.js
- server/src/coach/coachRequest.js         (two new focus types)
- server/src/coach/askCoach.js
- server/src/controllers/coachController.js (ask + status only)
- server/test/lib/coachPrompt.test.js      (extend) and/or a new
                                            server/test/lib/coachHelpMode.test.js
- client/src/pages/CoachPage.jsx           (new)
- client/src/styles/coach-page.css         (new)
- client/src/App.jsx                       (one route)
- client/src/components/coach/CoachPanel.jsx
- client/src/components/coach/AiWait.jsx   (a copy-ladder prop)
- client/src/lib/coachSuggestions.js       (help chips)
- client/src/api/coachApi.js               (status shape only)
- client/src/pages/DashboardPage.jsx       (masthead entry)
- client/src/pages/ProfilePage.jsx         (one row)
Do NOT modify anything outside these files.

CHANGE:
**The guide**
1. **`server/data/app-guide.md`** is a plain-language guide to LogChamp,
   written FROM THE CODE as it stands. Read `client/src/App.jsx` routes,
   `BottomNav.jsx`, and the page components, and use the exact on-screen
   labels.
   - Sections: Home; Logging a workout; Blocks (build, run, pause/resume);
     Templates; Library (Blocks, Workouts, Exercises, adding your own
     exercise); History; Analytics and Exercises; Importing a block or
     history; Profile (Training, Appearance, AI access, Security, What's
     new); The coach.
   - Each section says what the area is for, then the common tasks as tap
     paths ("Open Library, then the Exercises tab, then ...").
   - Add a short "Not in LogChamp yet" section with things users may ask
     for that don't exist. Read the code to confirm each one, e.g.
     sharing blocks publicly.
   - Under 12,000 characters. No internal names, endpoints, or file names.
   - The guide is maintained by the What's New lane from now on (spec
     section 4). Put a one-line HTML comment at the top saying so.
2. **`appGuide.js`:** reads the file once at module load (path from
   `__dirname`) and exports `getAppGuide()`. If the file is missing or
   empty, it returns `""` and help still works on the persona alone.

**Server: prompt, focus types, consent**
3. **`prompt.js`:** `buildCoachSystemBlocks` inserts the guide as its own
   text block right after the persona, inside the cached prefix. Its
   framing line: "LogChamp app guide. Answer how-to and where-is questions
   from this guide, using its on-screen labels. If the guide doesn't cover
   it, say you're not sure - never invent a screen or button."
4. **`coachRequest.js`** adds two focus types, `{ type: "general" }` and
   `{ type: "help" }`, and updates the error message list.
   - **`help`:** NO training data. Never compute or load the analytics
     summary or any session/block data, and never attach a data block.
     The system blocks are persona + guide + volatile framing only.
   - **`general`:** the same data as today's default analytics ask, plus
     the guide.
5. **Consent** (`coachController.js` ask + `askCoach.js`):
   - A user WITHOUT active consent may ask ONLY with focus `help`. Every
     other focus keeps today's 403 `no_consent`.
   - A user WITH consent may use any focus.
   - Provider/key resolution, the weekly cap (help costs 1 like any ask),
     off-topic refunds and the SSE stream are all unchanged.
   - Structure the no-consent path so the summary loader is unreachable
     from it. The reviewer greps for this.
6. **`GET /coach/status`** adds `help: { available: boolean }`. It is true
   when provider/key resolution succeeds, regardless of consent. Every
   existing field keeps its meaning.

**Client**
7. **`/coach` route** (inside `ProtectedRoute`) -> `CoachPage`.
   - Page title "Coach". `CoachPanel` renders in an always-open page
     layout: the thread fills the page and the composer is pinned to the
     bottom above the bottom nav. It stays keyboard-safe: the phone keypad
     never covers the composer or the last message.
   - It asks with focus `general` when consent is on and `help` when it is
     off.
   - Empty thread: one short line, "Ask about your training, or how to do
     something in LogChamp.", followed by chips.
     - Consented: up to two training chips from `buildSuggestedQuestions`
       plus two help chips.
     - Not consented: three help chips plus one quiet line, "Turn on AI
       access to ask about your own numbers.", linking to `/profile/ai`.
   - Help chips (new export in `coachSuggestions.js`): "How do I start a
     block?", "Where do I switch to kg?", "How do I edit an exercise I
     made?".
   - When neither help nor training is available (no provider), show
     `CoachPanel`'s existing unavailable copy.
   - **The one memorable element: the empty state.** Make it a calm,
     well-set intro, not a wall of chips.

   Layout from the Oct 8 mock:
   - **Header:** "Coach" in the display font, plus a round "New
     conversation" icon button (qol10 wires it; render it now and have
     it clear the thread).
   - **Empty state:** left-aligned in the upper third.
     - A small rounded-square tile holding the chat-bubble icon, with an
       accent tint and border.
     - The intro line set large (~25px) in the display font, with
       balanced wrapping.
     - The chips as full-width suggestion ROWS (52px or taller, a leading
       question-mark icon, left-aligned text), not pills.
     - The AI-access line in muted text, with "Turn on AI access" as the
       link.
   - **Thread:**
     - Your messages are right-aligned accent-tinted bubbles.
     - Coach replies are plain text on the page, under a small crown +
       "Coach" label - no bubble.
     - The wait state is a small surface chip: three accent dots plus
       the ladder text.
   - **Composer:** an input plus a square send button, pinned above the
     bottom nav, with a hairline top border.
8. **Entry points**
   - Home masthead: a 44px round icon button on the right, level with
     the wordmark, aria-label "Ask the coach", leading to `/coach`. Use a
     CHAT-BUBBLE icon (an outline bubble with three dots), NOT the crown:
     the Oct 8 mock showed a second crown beside the logo reads as a
     duplicate. The crown stays the coach's signature INSIDE the panel.
   - Profile Settings: a "Coach" row, subtitle "Ask about training or how
     to use the app", leading to `/coach`.
   - The existing panels (Analytics, debrief, builder) keep their behavior.
9. **Wait copy:** `AiWait` gains an optional `ladder` prop,
   `[{ atMs, text }]`. The default reproduces today's behavior exactly.
   `CoachPanel` passes a coach ladder:
   - 0.4s: "Thinking..."
   - 8s: "Reading your training..." (data focuses) or "Checking the
     guide..." (help)
   - 20s: "Still working. The first question takes the longest."
   - 45s: "Almost there."

   Show it until the first token, as today.
10. Styles go in `coach-page.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with new tests asserting:
  - `buildCoachSystemBlocks` for focus `help` contains the guide text and
    NO data block, even when a summary object is passed in
  - focus `general` contains both
  - `coachRequest` accepts `{type:"help"}` and `{type:"general"}` and
    rejects `{type:"nope"}`
  - `getAppGuide()` is non-empty and under 12,000 characters
- Client `npm run build` clean. `node scripts/check-hex.mjs` passes.
- `app-guide.md`: under 12,000 characters (`wc -c` in DELIVERY.md), every
  section listed in step 1 present, and no file names, routes or
  identifiers in it (grep for `/`, `.jsx`, `Controller`; quote results and
  explain any hit).
- Live checks the reviewer runs (mock coach, staging DB):
  - a user WITHOUT consent: `POST /coach/ask` with focus `help` streams
    an answer; focus `view` returns 403 `no_consent`
  - `/coach/status` returns `help.available: true` for that user
  - the Home crown leads to `/coach`
  - at 390x844 the composer stays visible with the keypad open

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
