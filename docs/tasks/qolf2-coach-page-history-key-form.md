# TASK qolf2: Coach page - one scroll that follows the answer, a composer that belongs, readable Stop; history rows and confirms on pattern; a key form that isn't broken

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the QOL feel critic, round 1 (5/10). Read
`docs/tasks/qol-critic-round-1-FINDINGS.md` items #2, #3, #9, #12, #13, #24,
#25, #27, #33 for the measured evidence. The surfaces came from qol6 (the
/coach page), qol10 (coach history) and qol11 (your own key). Design rules:
`docs/specs/quality-of-life-wave.md` section 2. New CSS goes in the files
named below. Do NOT edit `client/src/index.css`; scope overrides to the coach
page or the AI access page instead. `CoachPanel` also renders inside
Analytics and finished workouts: those embedded panels must look and behave
exactly as today. Runs in parallel with qolf1, qolf3 and qolf4. None of them
touch these files.

FILES TO TOUCH:
- client/src/pages/CoachPage.jsx
- client/src/components/coach/CoachPanel.jsx
- client/src/styles/coach-page.css
- client/src/components/library/CoachConversationList.jsx
- client/src/styles/coach-history.css
- client/src/pages/profile/AiConnectorPage.jsx
- client/src/styles/ai-access.css   (NEW, imported by AiConnectorPage.jsx)
Do NOT modify anything outside these files.

CHANGE:

1. **A continued thread fills the page (#2, P1).** Opening /coach?c=<id>
   renders the conversation inside a fixed-height inner box. The suspect is
   `.coach-thread` in index.css, `max-height: min(56vh, 520px)`. That leaves
   about 180px of dead space above the composer, and the newest reply lands
   below the box's fold.
   - On /coach, a continued thread and a fresh one look and scroll the same
     way.
   - The conversation fills the space between the page header and the
     composer, with ONE scroll container (no nested scrollbar).
   - When the user sends, the view scrolls to their message. When an answer
     starts streaming, it scrolls so the answer's start is in view.
   - Do not yank the view while the user has scrolled up to read; follow the
     newest only when they were already at or near the bottom.
   - Respect `prefers-reduced-motion` (no smooth scroll).
2. **The composer belongs to the page (#12, P2).** The composer sits on a
   hard-edged dark slab (x 16-374, y 716-790) that floats over the scene and
   matches nothing else. Either remove the slab, or make the backing
   full-bleed using the bottom nav's surface token so it reads as part of
   the app's chrome. Pick one and say which in DELIVERY.md. The composer
   stays above the bottom nav and clear of the keyboard, as today.
3. **Stop is readable (#13, P2).** While waiting, the send button becomes
   "Stop": white text on a pale lavender fill. Give it the app's standard
   secondary-button tokens, so the text passes 4.5:1 against its fill in
   champ dark and crimson light. This applies on /coach only, unless the
   embedded panel shares the exact same contrast failure (if so, fix it
   there too and say so).
4. **Suggestion rows lose the "?" glyph (#33, P3).** The "?" marks read as
   placeholders. Use a chat-bubble or arrow mark drawn the way the app's
   other stroke icons are, or no mark at all. Keep the rows 52px or taller.
5. **The history row's "..." becomes a direct delete (#9, P2).** Today each
   Library > Coach row has a "..." that opens a small one-item dropdown, a
   menu style found nowhere else.
   - Replace it with a 44px delete icon button, aria-label
     "Delete conversation".
   - It opens the existing `ConfirmPanel` with `tone="danger"` (today the
     single delete is accent-blue while Delete all is danger; both are
     danger now).
6. **Confirms say what happens (#25, P3).**
   - Single delete:
     - title "Delete this conversation?"
     - body "It's removed from your coach history. This can't be undone."
     - buttons "Delete conversation" / "Keep conversation"
   - Delete all:
     - title "Delete all coach conversations?"
     - body "Every saved conversation is removed. This can't be undone."
     - buttons "Delete all" / "Keep conversations"
   - Remove key (AI access):
     - title "Remove your key?"
     - body "The coach goes back to the app's shared limit until you add a
       key again."
     - buttons "Remove key" / "Keep key"
     - If the current copy explains the fallback differently, keep the true
       behaviour and adjust the wording to match it. Say so in DELIVERY.md.
7. **Row meta without a middle dot (#24, P3).** "General · today" becomes
   "General, today" (rule 3). Apply the same rule to any other middle-dot
   meta on these rows.
8. **The key form stacks (#3, P1).** On Profile > AI access, the empty and
   typing states of "Use your own Anthropic key" are broken. The label is
   crushed into a ~30px column, the password input overlaps it, and "Save
   key" is ~25px wide with its text spilling onto the help copy. The saved
   state ("Key ending in wxyz", "Remove key") is fine and must stay as is.
   - Stack the form at full width: label, then the input, then "Save key"
     (a 44px button), then the help copy.
   - The rules go in the new `ai-access.css`.
9. **AI access copy points at the coach's new home (#27, P3).** "The coach
   lives on the Analytics page..." and "Open Analytics to ask the coach" are
   out of date: the coach has its own page, opened from the chat bubble at
   the top of Home. Rewrite those lines to say so, and keep any link working
   (point it at /coach). Plain words, sentence case, no arrows.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/` (no server change expected).
- `npm run build` from `client/` compiles clean, and `node scripts/check-hex.mjs`
  reports no new raw colours. Every new `var(--...)` resolves in
  `client/src/index.css`.
- `git diff --name-only` lists only files from FILES TO TOUCH.
- `grep -n "aria-haspopup" client/src/components/library/CoachConversationList.jsx`
  returns nothing.
- No "·" remains in `CoachConversationList.jsx` row meta.
- `grep -rn "lives on the Analytics page\|Open Analytics to ask" client/src`
  returns nothing.
- DELIVERY.md says, per item 1-9, which rule or element produces each
  real-app result below.
- Real-app items for the reviewer (390x844, champ dark unless noted):
  - /coach?c=<id> with a 2-exchange thread:
    - exactly one element in the conversation area has `overflow-y: auto`
      and `scrollHeight > clientHeight`
    - the gap between the last message's bottom and the composer's top is
      <= 24px once the content overflows
    - after sending, the new user message is in the viewport
  - The embedded coach on /analytics looks the same as before this unit.
  - The composer shows no slab edge inside the page margins (or a full-bleed
    backing edge to edge).
  - "Stop" text contrast >= 4.5:1 in champ dark and crimson light.
  - On Library > Coach, each row has one "Delete conversation" button, 44px
    or larger. It opens a danger-tone ConfirmPanel with the copy in item 6,
    and "Keep conversation" closes it.
  - On Profile > AI access with no saved key: the label, input and "Save key"
    are each the content column's width, and none of them overlap (compare
    bounding boxes). Saving a key still shows "Key ending in ...", and
    Remove opens the item 6 confirm.

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
