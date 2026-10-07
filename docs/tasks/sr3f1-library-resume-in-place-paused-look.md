# TASK sr3f1: Library - the Start/Resume choice opens where you tapped, and a paused block looks paused

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Fix round for the sr3 feel critic, round 1 (`docs/tasks/sr3-critic-round-1-FINDINGS.md`,
6/10 FAIL): its P1-1, P2-5 and P3-9. sr3-1 (pause/resume) added a "Left off at
Wn · Day" line on Library block cards and an on-page Start choice ("Resume at
Wn · Day" / "Start over" / Cancel, plus "This pauses <block> - you can pick it up
where you left off." when another block is running). On a phone that choice
renders ONCE above the whole list (`MyTemplatesPage.jsx` ~line 434,
`bk-lib-confirm`), so tapping Start on a card below the fold shows nothing - the
critic measured "Start over" at y = -532 px. Seth's ruling (Oct 7): a paused
block gets a "Paused" chip, a "Resume" button, "n of N days done", and sorts
right under the running block.

FILES TO TOUCH:
- client/src/pages/MyTemplatesPage.jsx
- client/src/components/library/LibraryBlockCard.jsx
- client/src/styles/blocks/bk-library.css
Do NOT modify anything outside these files. No server change: `GET
/block-runs/left-off` already returns `{ runs: [{ runId, blockTemplateId,
endedAt, nextDay, dayName, doneDays, totalDays }] }`.

CHANGE:

1. **The choice opens on the tapped card (P1-1).** The Start / Resume choice and
   the switch confirm render ON or directly under the card whose button was
   tapped - never in one shared slot above the list. Follow the pattern the
   Library card's in-page DELETE confirm already uses (bkrf1c: "asks on the
   card"). When it opens, the confirm is scrolled into view if any part of it is
   off-screen, and focus moves to its primary button. Only one card's confirm is
   open at a time. Copy, buttons and behaviour of the choice are unchanged.
2. **A paused block looks paused (P2-5).** For a block that appears in the
   left-off list (and is not the running block):
   - a "Paused" chip in the same chip row as the existing "Running" chip, using
     an existing `Chip` tone that is NOT the running block's `good` tone;
   - the card's primary button reads "Resume" instead of "Start"; tapping it
     opens the same choice as today (Resume at ... / Start over / Cancel);
   - the left-off line also shows progress, e.g.
     "Left off at W1 · Lower A · 1 of 16 days done" (from `doneDays` /
     `totalDays`);
   - Blocks list order: the running block first, then paused blocks (most
     recently paused first, by `endedAt`), then every other block in today's
     order.
   Never-run blocks and the running block look and behave exactly as today.
3. **Exercises empty state (P3-9).** The Library > Exercises empty state today
   says custom exercises come only from a live workout's "Not tracked - add?"
   pill. Rewrite it so it names BOTH ways in: "Add to your library" from the
   block builder's exercise search (or an imported sheet's "Not in your library"
   rows), and the pill on a live workout. Keep it to two short sentences.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors; `npm run test:unit`
  from `server/` still green; `node scripts/check-hex.mjs` clean and every new
  `var(--...)` resolves (grep it in `client/src/index.css` or the block CSS that
  defines it).
- `git diff --stat` lists only the three FILES TO TOUCH.
- `grep -n "bk-lib-confirm" client/src/pages/MyTemplatesPage.jsx` no longer
  shows a single list-level confirm rendered before the block list (paste the
  grep and say where the confirm now renders).
- Evidence from a local run at 390x844 (client against a stub API or a
  non-prod API - `client/.env` is PRODUCTION, never use it), screenshots under
  `.playwright-mcp/sr3f1/`, with a list of at least 5 blocks where a PAUSED block
  is NOT first in today's order:
  (a) the list: running block first, the paused block second with its Paused
  chip, "Resume" button and "... · n of N days done";
  (b) a card scrolled well below the fold (page scrollY > 600) after tapping its
  Start: the choice is fully inside the viewport (paste its
  `getBoundingClientRect()` top/bottom and `window.innerHeight`);
  (c) the paused card after tapping Resume: the choice on that card;
  (d) the Exercises tab empty state.

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
