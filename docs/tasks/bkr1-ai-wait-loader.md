# TASK bkr1: One AI wait - crown loader, slow-wait copy, and client timeouts on every AI call

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (`docs/tasks/bk-smoke-FINDINGS.md`): Seth wants "custom
loading for AI... like the initial loading screen... I like the crown...
add a text if the loading takes too long". Today every AI wait is button
text only ("Drafting...", "Converting...") with no timeout anywhere. The
diagnosis `docs/tasks/bkr-d2-coach-draft-hang-FINDINGS.md` shows Draft with
the coach can sit on "Drafting..." forever: the client fetch has no
timeout/abort. This unit is CLIENT ONLY. The server abort-on-disconnect +
refund lands separately with bkr2.

FILES TO TOUCH:
- client/src/components/coach/AiWait.jsx       (NEW - the shared indicator)
- client/src/styles/ai-wait.css                (NEW - its styles; import it
                                                from AiWait.jsx like
                                                StartWorkoutHero imports
                                                bk-run.css)
- client/src/api/http.js, client/src/api/coachApi.js (pass an optional
                                                `signal` through to fetch for
                                                coachBlockDraft, coachImportMap,
                                                generatePalette)
- client/src/components/blocks/builder/CoachDraftCard.jsx
- client/src/components/blocks/builder/BlockBuilder.jsx (only its
                                                "Previewing coach draft..." busy
                                                state)
- client/src/components/blocks/import/ImportSourceStep.jsx (onCoachConvert)
- client/src/pages/ImportBlockPage.jsx         (the import-map AI read)
- client/src/pages/profile/AppearancePage.jsx  (palette: timeout + slow copy
                                                only - keep its existing
                                                palette-studio animation)
- client/src/components/coach/CoachPanel.jsx   (only the wait BEFORE the first
                                                streamed token, if it is plain
                                                text today)
Do NOT modify anything outside these files.

CHANGE:
1. **`AiWait` - the look (fully specified; this is the design).**
   - Mark: the LogChamp crown glyph, the same path the coach uses
     (`.coach-panel__crown` mask in index.css: `M3,19L3,8L8,12L12,5L16,12L21,8L21,19Z`),
     painted in `var(--color-interactive)`.
   - Motion: the splash's breathe (`splash-breathe`, opacity 0.78 <-> 1,
     2.4s ease-in-out, infinite) plus a gentle lift on the same cycle
     (translateY 0 -> -2px). Nothing else moves. Under
     `prefers-reduced-motion: reduce` it is static at full opacity.
   - Two sizes: `inline` (16px crown, sits LEFT of the button label inside
     the busy button, replacing the plain "...") and `block` (28px crown,
     centered above a status line, used where the wait fills a panel).
   - Copy ladder, one line, `var(--color-text-secondary)`, 14px, live region
     `aria-live="polite"`:
     - 0-400 ms: nothing shown (reuse the delay-before-show idea from
       `useDelayedReveal` in `client/src/components/LoadingState.jsx` - no
       flash on fast answers);
     - from 400 ms: the action's verb line, passed in as a prop
       ("Drafting your block...", "Reading your sheet...", "Converting...",
       "Designing your palette...", "Thinking...");
     - from 15 s: "Still working - big blocks can take up to a minute.";
     - from 45 s: "Almost there. Hang tight.";
     - the line cross-fades (180 ms ease-out) when it changes.
   - Tokens only - no hex, every palette x light/dark must read correctly
     (`scripts/check-hex.mjs` stays clean on the diff).
2. **Busy buttons.** Every AI-triggering button above shows the `inline`
   AiWait while busy (crown + verb), stays disabled, and keeps its width (no
   layout jump). Where a status line fits under the button (CoachDraftCard,
   ImportSourceStep, ImportBlockPage, AppearancePage), render the copy ladder
   there.
3. **Client timeouts.** Each AI call gets an `AbortController` with a hard
   timeout of 120 s (one named constant in coachApi.js). On timeout: clear
   busy and show "The coach took too long. Try again in a moment." in the
   component's existing inline error slot. If the component unmounts
   mid-call, abort the request and set no state. Existing `ApiError` /
   `weekly_limit` handling stays exactly as it is.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`; client `npm run build` clean.
- `node scripts/check-hex.mjs` (repo root) reports nothing new in the diff.
- Grep: every call of `coachBlockDraft(`, `coachImportMap(`,
  `generatePalette(` in `client/src` passes a `signal`, and each call site
  renders `AiWait`.
- Grep: `ai-wait.css` contains a `prefers-reduced-motion: reduce` block that
  sets `animation: none`.
- Playwright at 390x844 against a local server started with
  `COACH_PROVIDER=mock` (see AGENTS.md "How to run"; if the mock answers too
  fast, delay it with request interception): with a 20 s delayed
  `/coach/block-draft`, the Draft button shows the crown + "Drafting your
  block...", and the 15 s line appears. With a 130 s delay, the timeout
  message appears and the button is enabled again. Record screenshots in
  DELIVERY.md, or say plainly that no browser was available.

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
