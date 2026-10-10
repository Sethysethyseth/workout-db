# TASK MX5-MX6: App shell transitions + list -> detail container transform

STATUS: QUEUED
MODEL: claude-fable-5-1-thinking-high   <!-- dispatched as a RESUME of the MX0/MX1-4 chat -->
MODE: 1-relay (lane worktree)

CONTEXT:
MX1-4 landed (`2cdeee0`): the motion primitives exist and Analytics is in
motion. Seth's checks passed so far - nothing was half-finished. This block
is your ROADMAP.md units MX5 (app shell transitions, Shared axis A) and MX6
(History row -> session detail container transform), as written there. The
design calls stay yours. Read "Seth's rulings" at the top of
`MOTION-DIRECTION.md` first (they were added after your MX0 run: rare PR
celebration, milestones at 100/1,000/10,000 workouts, per-palette scenes).
Cursor usage is still capped: keep ROADMAP.md current after every green
step, exactly as in MX1-4, so a cutoff loses nothing.

CRITIC INPUT that touches the shell (from
`docs/tasks/qol-critic-round-2-FINDINGS.md` Part B - fix it where your
files reach it, otherwise make sure ROADMAP.md carries it):
- Loading states differ by page (blank scene on the logger/builder, an
  empty bordered card on Home, shimmer skeletons on Library and the block
  run page; Library tab counts read "0" until loaded and the Running card
  pops in ~80px down). It wants ONE skeleton language, shown at once, that
  reserves the final layout - your MX5 "per-page skeleton" work.
- The desktop shell: phone nav is Home / Analytics / History / Library /
  Profile, desktop nav is Workout / Library / History / Analytics with
  Profile as a bare top-right link with no active state; column widths
  change per page (948 / 720 / 672); the wordmark sits 15px left of the
  content column. It wants one shell grid and the same nav names and order.
- Known: the bottom nav sits under the Finish dock on a live workout
  (qol12).

GUARDRAILS (same as MX1-4, plus the logger rule):
- Zero new dependencies; no package.json / lockfile changes, no installs.
  View Transitions API as progressive enhancement only, with a CSS/WAAPI
  fallback.
- Client only. Tokens-only (check-hex clean); all 5 palettes x light/dark.
  `card--live` keeps its one meaning.
- Navigation must never wait on an animation: a tap navigates at once, the
  transition decorates it. A tap mid-transition wins.
- THE LOGGER IS THE FLOOR: `SessionDetailPage` also hosts live workout
  logging. MX6 animates the completed-session detail header only. A live
  in-progress session renders and accepts input exactly as it does today -
  no transition on set entry, no delay on any input.
- Nothing a page does today goes missing (content, warnings, buttons).
- `prefers-reduced-motion: reduce`: transitions become short crossfades,
  the nav indicator jumps.
- Phone first (390px), no horizontal scroll; animate transform/opacity.
- Scene layer: `#root` is `z-index: 1` over the fixed `body::before`
  scene - a View Transition snapshot or anything portalled outside `#root`
  must be checked against it.

STEPS:
1. MX5 to a green checkpoint (build passes, ROADMAP updated).
2. MX6 to a green checkpoint.
3. Add any new ideas to IDEAS.md (PARKED), and anything out of scope to
   ROADMAP.md as units.
If budget runs short, stop at the last green checkpoint and make sure
ROADMAP.md says exactly where things stand (PARTIAL + "pick up here").

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md`, `docs/design/mocks/motion/IDEAS.md`
- `client/src/components/layout/` (bottom nav, top/desktop nav, shell)
- `client/src/components/motion/` (new primitives such as
  `RouteTransition.jsx`, `useFlip`; edits to the MX1 primitives only if a
  shell need requires it)
- `client/src/App.jsx` (the route-transition wrapper around the outlet)
- `client/src/components/LoadingState.jsx` (the one skeleton language)
- `client/src/pages/*.jsx` - ONLY each page's loading/skeleton branch and
  the transition wrapper; no data or logic changes. MX6 additionally edits
  `SessionsPage.jsx` and `SessionDetailPage.jsx` for the container
  transform (completed-session view only - see the logger rule).
- `client/src/index.css` (shell, nav, skeleton and MX rules only) and new
  `client/src/styles/*-motion.css` files if you want them
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` from the repo root exits 0, or DELIVERY.md
  justifies each hit.
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (gitignored `.playwright-mcp/` aside).
- No change to `client/package.json` or `client/package-lock.json`.
- ROADMAP.md: MX5 and MX6 statuses and "Last checkpoint" match the tree;
  anything not DONE is PARTIAL with a "pick up here" note.
- DELIVERY.md shows, for `SessionDetailPage.jsx`, the diff hunks and why
  none of them touches the live-logging path (the reviewer checks this by
  hand).
- DELIVERY.md lists: DONE / PARTIAL per unit, the critic points addressed
  vs left, what Seth should look at on a phone (two palettes, both modes),
  and what you would do next.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
