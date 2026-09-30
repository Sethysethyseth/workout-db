# TASK bks3: Library tab redesign - blocks first, recovery look, "Create workout" parked

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
From Seth's BK smoke (Sept 30, `docs/tasks/bk-smoke-FINDINGS.md` CR4): "the library
tab itself needs a UI and UX upgrade, it looks stale and hasn't changed much at all
since the app started". Blocks are now the product's main planning object. The
page (`client/src/pages/MyTemplatesPage.jsx`, route `/templates`, nav label
"Library") still leads with the old saved-workout flow and uses the pre-BK
`programs-*` styles.

Seth's ruling on "Create workout": nobody uses it. Park it, but keep it visible
and greyed out so he doesn't forget it exists. Existing saved workouts keep
working; the smoke regression item is that saved workouts keep "Set as current".

Visual language: the BK block surfaces. See `docs/specs/blocks-v2.md` section 10,
the `--bk-*` aliases and primitives in `client/src/styles/blocks/bk-ui.css` and
`client/src/components/blocks/ui/*`, and the reference sheet
`docs/design/recovery-logbook-reference.css` (a reference only - never import it).
This is a judgment-heavy visual unit; the structure below is the spec, and the
exact styling is yours within it.

FILES TO TOUCH:
- client/src/pages/MyTemplatesPage.jsx
- client/src/components/library/* (NEW, optional - split the page into
  components here if it helps)
- client/src/styles/blocks/bk-library.css (NEW - import it from the page or its
  components, the way `AsPlannedControl.jsx` imports `bk-log.css`)
Do NOT modify anything outside these files. In particular:
- NOT `client/src/index.css`: leave the old `programs-*` rules in place. Dead
  CSS is cleaned up later, and editing index.css collides with parallel units.
- NOT `bk-ui.css` or `components/blocks/ui/*`: import and reuse them, do not
  edit them.
- NOT any `client/src/api/*` file: use the existing api functions as they are.
- NOT `SessionDetailPage.jsx`, NOT the import page.

CHANGE:
1. **Header**:
   - "Library" in the display face, with one short subtitle line.
   - An actions row, each target at least 44px:
     - **New block** (primary): the existing block-create route.
     - **Import** (secondary): `/blocks/import`.
     - **Create workout**: rendered greyed out with a small "Parked" tag. It is
       NOT a link: no navigation, `aria-disabled="true"`, never the primary
       style. Its title/aria text says it is parked.
2. **Running block strip**:
   - When the user has an active block run, show one compact card above
     everything else: "Running · <block name> · Week n of N", plus a "Go" /
     open affordance to `/blocks/current`.
   - Use the existing active-run API by name (`blockRunApi.js`).
   - No active run: the strip is absent. Show no placeholder and don't reserve
     space for it.
3. **Scope switch** Yours | Community is kept, including the `?area=community`
   deep link that `PublicTemplatesPage` redirects to. Restyle it as a
   segmented control in the BK language.
4. **Yours**:
   - The type tabs are kept with **Blocks as the DEFAULT tab**, then Saved
     workouts, then Custom exercises, each with its count.
   - The visibility filter chips are kept for blocks and workouts.
   - **Block cards**:
     - The name in the display face.
     - A meta line built from fields already on the list payload, e.g. "4 weeks ·
       4 days/wk". Show only what the payload actually has - no new fetches.
     - Chips: Public / Private, Draft when a block is a draft.
     - One primary action: Start. If this block is the running one, show
       "Running" linking to `/blocks/current` instead of Start.
     - Every other existing block action (edit, export, visibility, delete, and
       whatever else the current page offers) is re-homed behind a compact
       secondary row or overflow menu.
     - No action is added or removed.
   - **Saved workout cards**:
     - The same card style.
     - Keep Start, "Set as current", Edit, the visibility toggle and Delete,
       all still working.
   - **Custom exercises**: same card language, and the delete action is kept.
   - **Empty states**: one per tab, each with one clear next step. The blocks
     tab's step is New block / Import. The saved-workouts empty state has NO
     create action, because create is parked.
5. **Community**: the same card language, and all existing actions are kept
   (clone / start / whatever exists today).
6. **Look**:
   - Tokens only, through `--bk-*`.
   - Correct in all 5 palettes x light/dark.
   - No horizontal scroll at 390px.
   - Cards breathe: generous vertical rhythm and no cramped rows. Seth called
     the builder "squished", so don't repeat that here.
   - 44px minimum targets.
   - Calm motion (150-250ms ease-out, `prefers-reduced-motion` respected).
   - Delete keeps its existing confirm behaviour.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` compiles with no errors. `node scripts/check-hex.mjs`
  passes, with no hex values in any touched or new file.
- DELIVERY.md contains an **action inventory table**. It lists every
  user-facing action on the page BEFORE the change (read from the current
  `MyTemplatesPage.jsx`, with file:line) and where it lives AFTER (file:line).
  No action may be missing.
- "Create workout" appears exactly once. It is not an `<a>` / `<Link>` and has no
  `to`/`href`, it carries `aria-disabled="true"`, and clicking it does not
  navigate (show the element in DELIVERY.md).
- The default tab with no query string is Blocks (show the state
  initialiser). `/templates?area=community` still opens Community.
- The running strip renders only when the active-run call returns a run (show the
  condition).
- `grep` shows `bk-library.css` is imported by the page or its components, and
  `client/src/index.css` is untouched (`git diff --stat` in DELIVERY.md lists
  only the allowed files).

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
