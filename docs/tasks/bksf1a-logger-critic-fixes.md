# TASK bksf1a: Block-day logger - critic round 1 fixes (keypad, finish, half-filled sets, header)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The separate feel critic scored the bks work 5/10 in round 1. Its report is
`docs/tasks/bks-critic-round-1-FINDINGS.md` (read the findings named below in
full; finding IDs refer to that file). This block fixes everything it found in the
block-day logger, which bks2 built (`docs/tasks/bks2-block-logger-planned-rows.md`,
design reference `docs/design/recovery-logbook-logger-reference.md`). Every bks2
contract stays in force:
- "As planned" / the set-number tap never fills effort
- per-side grids
- author notes come from `plan.notes`
- no checkbox bar on block days

FILES TO TOUCH:
- client/src/pages/SessionDetailPage.jsx (block-day branch, plus the finish flow
  as it applies to block days)
- client/src/components/blocks/log/*
- client/src/styles/blocks/bk-log.css
- client/src/styles/blocks/bk-ui.css (ONLY the warn/contrast token aliases for
  P2-8; nothing else)
Do NOT modify anything outside these files. In particular: NOT `index.css`,
NOT `components/Layout.jsx` (hide global bars with an `<html>` class plus CSS in
`bk-log.css`, the pattern `bk-log-kbd` already uses), NOT the builder, import,
library or Home files (three other units are editing those in parallel).

CHANGE:
1. **Keypad (P1-2, logger part):**
   - Keyboard mode (`html.bk-log-kbd`) also hides `.session-finish-dock`.
   - The page gets enough `scroll-padding-bottom` that a focused set field or
     the session-note textarea scrolls fully clear of anything still fixed.
   - Focusing the session note scrolls it into view.
2. **Finish (P1-3):**
   - On a live block-day session the global bottom nav is deliberately hidden,
     so the finish dock never sits on top of a nav target. Same `<html>`-class
     pattern; the class is removed when the page unmounts.
   - The persistent "In progress / Resume" bar is hidden on the session it
     points to (P2-9, second half).
   - Finish with planned sets still unlogged shows an inline confirm in the
     dock, following the Discard confirm pattern by name: "12 of 16 planned
     sets not logged - finish anyway?", with Finish anyway / Keep logging.
   - Finish with every planned set logged goes straight through, as today.
3. **Half-filled sets (P1-4):**
   - On block days a row counts as LOGGED only when it has reps or seconds.
     A row with only weight (or only effort) typed stays a DRAFT. It is not
     created server-side, it shows no check mark, and the counter doesn't
     count it.
   - The set-number button on such a draft logs it: typed values plus plan
     values for the blank reps/seconds/weight, never effort.
   - The check mark shows if and only if the row is counted, so the card
     counter, the header "x / y sets logged" and the Discard confirm's count
     always agree.
   - If the shared draft-promotion path promotes on weight alone, gate it for
     block days only. Quick log and template sessions keep their behaviour.
4. **Remove (P2-3):**
   - Removing a LOGGED set needs an inline confirm (or an undo toast) and
     deletes the set row as removal does elsewhere. It must not leave a
     blanked row behind.
   - Entering edit mode must not grow the card height by more than 48px. Show
     a compact remove control in place, not extra rows.
5. **Progress (P2-4):** the header bar width = logged / total of the CURRENT
   counts (0% at 0/16). Find the constant-50% source and remove it.
6. **Per-side toggle (P2-5):**
   - Label it "Per side" (or "Left/Right" with an accessible name), not "L/R".
   - Switching an exercise that already has logged sets asks first.
   - Switching an untouched exercise is instant.
7. **Header (P2-12):**
   - The block name appears ONCE on the page, and the day name ONCE as the
     title.
   - When the block locks the effort scale, the RIR/RPE control collapses to a
     one-line read-only chip (e.g. "Effort: RPE") of 32px or less, and the
     explainer lines go into its accessible description.
   - The first exercise card starts above y=420 at 390x844 (measure it in
     DELIVERY.md).
8. **Small fixes:**
   - The pencil focuses the set-note input it opens.
   - Every input or textarea in the block-day logger is at least 16px (iOS
     zoom, P2-2: set note, session note).
   - Logger tap targets are at least 44px (Remove, Back).
   - "Back" on a block day doesn't use a native `confirm()` when everything
     has autosaved. If something genuinely unsaved remains, use an inline
     confirm.
9. **Palette (P2-8):**
   - The over-cap warning must not share the accent hue in any palette. In
     iron the accent IS amber, so remap the over-cap state to the bad/red
     family OR give iron a non-amber warn alias.
   - Ghost placeholder text and "+ Note" reach at least 3:1 contrast against
     the field surface in all 5 palettes x 2 modes. Adjust the `--bk-*` alias
     opacity/mix only, with no new hex.
   - List the computed contrast for iron light and champ dark in DELIVERY.md
     (computed with `getComputedStyle` math or a small script).

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green. `npm run test:unit` from `server/` green.
  `node scripts/check-hex.mjs` clean.
- **Hook rule:**
  - No hook (`use*`) is called after an early `return` in
    `SessionDetailPage.jsx` or in any component you touch. Grep the
    component bodies and state the result in DELIVERY.md.
  - The last landing crashed exactly this way (`924bc66`), and the build
    cannot see it.
- DELIVERY.md maps each numbered CHANGE item (1-9) to file:line, and gives the
  measured y of the first exercise card for item 7.
- Code-read evidence, against the plan of test123's W3 Upper A (bench 4 x 6 @
  195, RPE cap 8):
  - Typing weight 185 alone into set 1 leaves it a draft: no create call, no
    check mark, counter 0/4.
  - Tapping the set-number button then creates reps 6 / weight 185 with no rpe
    key.
  - Show the gating condition with file:line.

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
