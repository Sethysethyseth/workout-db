# TASK L5: What's New visual treatment - patch-notes aesthetic

STATUS: QUEUED
MODEL: fable
MODE: 1-relay

CONTEXT:
The What's New skeleton is already built and committed (data:
`client/src/data/whatsNew.js`; storage: `client/src/lib/whatsNewStorage.js`;
components: `client/src/components/whatsnew/` - Gate/Modal/Content; page:
`client/src/pages/profile/WhatsNewPage.jsx`; structural CSS at the bottom
of `index.css` under the "What's new (release notes) - SKELETON ONLY"
comment). It works: modal fires once per device per release, dismisses via
button/backdrop/Escape, archive page lists all releases. This unit is the
LOOK: Seth wants it to read like Overwatch patch notes - a confident,
game-y release announcement - but translated into the LogChamp token
system so it feels native in every palette and both modes. Restraint rule
from AGENTS.md still binds: ~150-250ms, ease-out, no flashy motion.

FILES TO TOUCH:
- client/src/index.css                                  (replace/extend the
                                                         skeleton whats-new-*
                                                         rules)
- client/src/components/whatsnew/WhatsNewContent.jsx    (JSX structure/classes
                                                         only if the design
                                                         needs extra wrappers)
- client/src/components/whatsnew/WhatsNewModal.jsx      (same - presentation
                                                         only)
- client/src/pages/profile/WhatsNewPage.jsx             (same - presentation
                                                         only)
Do NOT modify anything outside these files. OFF-LIMITS even inside them:
the gate/seen logic (`WhatsNewGate.jsx`, `whatsNewStorage.js`), the data
file and its copy, all dismiss paths (button, backdrop, Escape, see-all
link), the a11y wiring (role/aria-modal/aria-labelledby/headingId), and
the route. Behavior is done; this is paint.

CHANGE (design intent - you own the fine judgment within these rails):

1. **Modal = announcement, not alert.** The card should feel like a
   release poster: the "What's new in LogChamp" kicker small and
   confident (uppercase, letterspaced - already sketched), the release
   title big (largest type in the card by a clear margin), date and
   tagline quiet under it. Consider a subtle accent treatment on the
   header zone (e.g. a soft `color-mix` wash or top rule off
   `--color-interactive`) so the header reads as a distinct band -
   hand-tune the mix so it works in all 4 palettes x 2 modes; never a
   raw hex.

2. **Overwatch-style section headers.** Each category heading (Analytics /
   Logging / Navigation / Look & feel) gets a strong, repeated treatment:
   small-caps or weighty label with a short accent bar or left rule
   derived from `--color-interactive` via `color-mix` (follow the
   accent-adjacent convention so future palettes inherit it). Headings
   must clearly chunk the list the way Overwatch's orange category
   headers do.

3. **Bullet rhythm.** Items are full sentences; give them comfortable
   line-height and spacing so the list scans, with custom list markers
   that match the accent treatment (CSS `::marker` or a styled
   pseudo-element - not emoji). The card scrolls (max-height is in the
   skeleton); make sure the scroll state looks intentional, e.g. header
   stays legible against content scrolling under it if you make it
   sticky (optional).

4. **Entrance motion, restrained:** one composed entrance for the modal
   (e.g. overlay fade + card rise ~12px, 150-250ms, ease-out, honoring
   `--motion-base`/`--ease-standard` if those exist - check how
   `loading-state`/T3 did it). No looping animation, no confetti, no
   per-bullet stagger.

5. **Footer:** "Got it" is the primary action (btn already); "See all
   updates" stays quiet/secondary. Keep both exactly as wired.

6. **Archive page** (`/profile/whats-new`): each release card reuses the
   same header + section treatment so the page reads as a changelog of
   posters, newest first. The `settings-page-back` pill and
   `settings-page-title` already match the profile sub-page pattern -
   leave them.

7. **Mobile:** at narrow widths the modal may go full-width bottom-sheet
   style (like the L4 sheet direction) or stay centered - your call, but
   it must clear the bottom tab bar visually and never overflow
   horizontally at 360px.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` green.
- `grep -n "#[0-9a-fA-F]\{3,8\}" ` over the changed CSS region -> no new
  hex (tokens/color-mix only).
- `grep -n "workoutdb-whats-new-seen" client/src` -> exactly the one hit
  in `whatsNewStorage.js` (gate logic untouched).
- `client/package.json` byte-identical; no new dependencies.
- Manual contract (reviewer verifies in dev): clear localStorage key
  `workoutdb-whats-new-seen` -> reload logged in -> modal enters with the
  single restrained animation, header reads as a distinct band, section
  headers chunk clearly, dismiss via all three paths still works and it
  does not re-fire on reload; `/profile/whats-new` renders the same
  treatment per release; checked in all 4 palettes x light + dark; no
  horizontal overflow at 360px.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
