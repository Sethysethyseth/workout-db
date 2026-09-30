# TASK bkf2: critic round 2 fixes - desktop header offset, readable import match rows, unmatched-names consequence, rest stepper

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
The blocks-v2 wave's coach-persona critique scored 7.5/10 in round 2
(`docs/tasks/bk-critic-round-2-FINDINGS.md` - read it). All P0/P1 are closed;
these four P2s stand between the wave and the 8+ bar. Design of record:
`docs/specs/blocks-v2.md` section 10 (tokens only, 44px targets, motion).

FILES TO TOUCH:
- `client/src/components/blocks/ui/StickyHeader.jsx`
- `client/src/components/blocks/ui/Stepper.jsx`
- `client/src/styles/blocks/bk-ui.css`
- `client/src/components/blocks/builder/ExerciseCard.jsx` (ONLY the rest
                                              stepper's format function)
- `client/src/components/blocks/import/*`
- `client/src/styles/blocks/bk-import.css`
Do NOT modify anything outside these files (not the app shell / nav, not
`index.css`).

CHANGE (observable contract):
1. **The block StickyHeader never covers the app's top navigation**, at
   any width. Today it uses a fixed `--bk-sticky-top: 64px` on wide
   screens, but at 1280px the app nav renders as TWO rows (~100px: logo +
   Profile, then the links) and the header covers the links row. The
   header's top offset must equal the app nav's actual rendered bottom
   edge when that nav is sticky/fixed and visible (measure the app's nav
   element - find it in `client/src/components` / the app shell and name
   it in DELIVERY.md - with a ResizeObserver or equivalent; 0 when the nav
   is not present, e.g. phones with the bottom nav). Unmount cleans up.
2. **Import matching rows show the exercise name in full.** At 390px no
   name up to 30 characters is truncated: the name may wrap to two lines;
   the row's only control is "Match..." (44px target). Drop the per-row
   "Not in your library" and "Keep as typed" text: the unmatched section's
   heading says "Not in your library (21)" and one line under it says
   "Kept exactly as typed unless you match them."
3. **Say what not matching costs.** Under that line (or as the section's
   note), plain language: "Unmatched exercises still import and log
   normally, but they won't count toward Analytics (muscle volume,
   strength trends, Execution) until you match them to your library."
   Only shown when there is at least one unmatched name.
4. **The rest stepper's value fits on one line** at 390px for every value
   (0 -> today's "No rest" wraps to two lines in the 52px value cell).
   Show a short form for 0 ("None" or "—" with `aria-label` "No rest"),
   keep "1:30"-style values, and make the value cell never wrap
   (`white-space: nowrap`) for any `Stepper`.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles (paste the tail);
  `node scripts/check-hex.mjs` clean; `npx eslint src/components/blocks`
  0 errors.
- DELIVERY.md names the app nav element and the mechanism for item 1, and
  shows the StickyHeader's computed `top` for two widths you reasoned
  about (e.g. "1280px, two-row nav: top = nav.getBoundingClientRect().bottom";
  "390px, bottom nav only: 0").
- The unmatched heading/count and the item-3 sentence come from a pure
  helper or constant; a `node --input-type=module` snippet prints the
  heading for 0, 1 and 21 unmatched names ("" / "Not in your library (1)"
  / "Not in your library (21)") - verbatim output.
- `grep -n "white-space" client/src/styles/blocks/bk-ui.css` shows the
  stepper value rule (paste).
- DELIVERY.md lists the reviewer's LIVE checks: builder at 1280x800 with
  the page scrolled - the week strip sits below the full app nav; import
  preview at 390px with ~20 unmatched names - every name readable, the
  consequence sentence shown; a rest of 0 on one line.

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
