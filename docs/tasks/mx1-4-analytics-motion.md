# TASK MX1-MX4: Leave the roadmap, then build motion primitives + Analytics

STATUS: QUEUED
MODEL: claude-fable-5-1-thinking-high   <!-- dispatched as a RESUME of the MX0 chat -->
MODE: 1-relay (lane worktree)

CONTEXT:
MX0 was yours and it landed: `docs/design/mocks/motion/MOTION-DIRECTION.md`
plus the four previews. Seth looked at `analytics-in-motion.html` and said
"looks beautiful" - now take it into the real app. Your section 6 numbering
(MX1-MX12) IS the wave's numbering. This block covers your MX1 (motion
tokens + primitives) and the Analytics units MX2-MX4, as far as budget
allows. Variants: Seth has said he will go with your suggestions, so use
your top recommendations (Analytics = Cascade A; the others are recorded in
ROADMAP.md for when their units come up).
Cursor usage is limited this month, so this run may be cut off at any
point. The FIRST job is to leave a stable roadmap behind, so whoever picks
up next (you next month, or a cheaper model with none of this chat's
context) can continue cleanly. Design calls stay yours; this block only
fixes the guardrails.

CRITIC INPUT (read this - it is the most recent outside look at the app):
Every frontend wave gets screenshot-scored 0-10 by a separate critic agent;
the app sits at 5/10 for look and feel ("competent but assembled, not
designed as one system"). Seth's feel bar for every pass: nothing cramped,
lists easy to scroll, the phone keypad or fixed bars never cover what you
are typing. The latest round is `docs/tasks/qol-critic-round-2-FINDINGS.md`
- read Part B (from "## Part B" to "## Cleanup confirmation"). The current
Analytics page in all 10 palette x mode combos, plus its tabs, is in
`.playwright-mcp/qol-critic/round-2/` (`B-analytics-*.png`,
`B-pal-analytics-*.png`). What it says about Analytics:
- KEEP: the weeks picker that selects instantly and dims the body while
  loading; the Muscles nested effective / stimulating bars; small live
  feedback like the rest bar's depleting line and the held-card glow.
- In-card headings at 28px ("Execution", "Data quality", "Strength
  trends") fight the page title and sit next to 11px caps labels - it wants
  a 4-5 step type scale with card titles one step below the page title.
- Exercises rows truncate names ("Standing Calf Rai...") because three stat
  columns squeeze them; Best E1RM is orphaned on its own line; each row is
  a 120px card - it wants name + one hero number, the rest on demand.
- The Analytics body loads as a blank scene - it wants one skeleton
  language, shown at once, that reserves the final layout.
- Number formats disagree (14.8k lbs next to 5780 lbs); "->" arrows in
  links; the "selected" look drifts across the app (Analytics tabs use an
  accent tint - it wants one selected token).
- Palette problems that hit charts directly: crimson's accent IS the
  danger red, so rising strength trends draw in alarm red; forest's "good"
  green equals its accent, so gains don't pop; iron light's amber on cream
  is low contrast; chill dark is the flattest combo; light modes bleach the
  scene. Charts likely need up/down meaning-tokens distinct from the
  accent, per palette.
- Long text straight on the busy scene art is unreadable - content sits on
  a surface or scrim; the scene shows where nothing is being read.
- Its three app-wide levers (one type system, one component state system,
  one logger) are bigger than this block. Where your direction agrees,
  make them ROADMAP units; apply them inside Analytics where they touch it.
After MX1 lands, the Claude Code seat runs one critic round on the new
Analytics page and folds the fixes back in - build for that score.

BACKGROUNDS (Seth's ask, "for funsies" - preview only, no app change):
Your MX0 previews draw one code skyline for every palette, so every palette
reads as the city. In the app each palette is its own environment - look
at the real art in `client/src/assets/scenes/` (champ, iron, chill, forest,
crimson .jpg; wired in `client/src/index.css` around lines 296-470 as the
fixed `body::before` scene plus the `#root::before` glow). Seth wants them
independent and wants you to have some fun with them:
- Fix the MX0 previews so switching palette switches the environment
  (embedding the five real JPGs as `data:` URIs is fine - about 210 KB
  total - or draw per-palette scenes in code).
- Build `docs/design/mocks/motion/scenes.html`: all five environments
  brought to life, each with its OWN ambient motion that fits its world
  (your call what - weather, light, parallax, particles, time of day), in
  both modes. Keep the scene a stage, not a distraction: subtle under
  content, louder where nothing is being read (headers, empty states,
  login).
- The critic's scene notes apply: long text on the busy art is
  unreadable; crimson dark floods the viewport red and reads as an error;
  chill dark's scene is nearly invisible; light modes bleach the scene to a
  grey haze.
- Shipping living scenes to the app is your MX10 - rewrite MX10 in
  ROADMAP.md as per-palette scene life (it currently assumes a skyline
  everywhere). Not this block.
- ORDER: Step 0 (ROADMAP + IDEAS) first, then MX1 and Analytics (MX2+) to
  at least one green checkpoint, then backgrounds. If budget runs short,
  record the backgrounds as PARTIAL in ROADMAP.md rather than skipping
  Step 0.

IDEAS (Seth's ask - be ambitious here):
Come up with cool ideas as you go - things that would make LogChamp's
analytics and motion genuinely stand out. Anything outside this block's
scope (another surface, new server data, a new package, a whole new
feature) goes in `docs/design/mocks/motion/IDEAS.md`, NOT into code. One
entry each: the idea, why it's cool for a lifter, what it needs (client
only / server data / package / new surface), rough size (S/M/L), status
PARKED. Seth reads it and picks. Start IDEAS.md in Step 0 and add to it as
you go, so it survives a cutoff.

STEP 0 - the roadmap (BEFORE any code):
Write `docs/design/mocks/motion/ROADMAP.md`: the whole motion wave as
ordered units, expanded from your section 6 (keep its MX1-MX12 ids; add
units if you need them). Per unit:
- id, one-line goal, surface, chosen variant (where there is one)
- files / directories it touches
- what "done" looks like, written so it can be checked
- dependencies on earlier units; new packages it would need (if any)
- status: TODO | IN PROGRESS | DONE | PARTIAL, plus a "pick up here" note
  for anything PARTIAL
Write it for a reader with NO chat history - it must stand on its own next
to MOTION-DIRECTION.md. Keep a "Last checkpoint" line at the top.

STEP 1+ - MX1, then MX2 -> MX3 -> MX4, in small checkpoints:
MX1 first (tokens + primitives), then bring `AnalyticsPage` and
`client/src/components/analytics/` toward your analytics preview. Work in
steps where each one leaves the app building and usable. After EVERY step:
run `npm run build` from `client/` (must pass), then update ROADMAP.md
(status + "Last checkpoint"). If you run low on budget, stop at the last
green checkpoint and make sure ROADMAP.md says exactly where things stand.
Note on "unit-tested hooks" (your MX1 line): the client has NO test runner,
and adding one (vitest etc.) is a package - Seth's call under the
dependency gate. Keep the hooks small and pure-logic-separable instead;
put "client test runner" in IDEAS.md if you want it. Existing client hooks
live in `client/src/lib/` (e.g. `useGuardedNav.js`) - follow that.

GUARDRAILS (non-negotiable):
- Zero new dependencies. No package.json / lockfile changes, no installs.
  CSS, Web Animations API, View Transitions API, canvas/SVG are all fine.
- Client only. Use the existing analytics API responses as they are. If
  the direction needs data the API doesn't return, write it into ROADMAP.md
  as a later server unit - do not build it here.
- Tokens-only: every color through CSS custom properties in
  `client/src/index.css` (new tokens welcome, including motion tokens for
  duration/easing). All 5 palettes x light/dark must render correctly.
  `card--live` keeps its one meaning (a live workout) - don't reuse it.
- Nothing the page does today goes missing: every metric stays, every
  metric keeps its insufficient-data warning (Seth's standing rule), the
  "how is this calculated" explanations stay, and the chart/table toggle
  stays (it is the accessible view of each chart).
- `prefers-reduced-motion: reduce` gets a complete, calm version.
- Phone first (390px), no horizontal scroll; smooth on a mid-range phone
  (animate transform/opacity; no layout thrash on scroll).
- Scene layer: `#root` is `z-index: 1` over the fixed `body::before` scene -
  anything you portal outside `#root` must be checked against it.

FILES TO TOUCH:
- `docs/design/mocks/motion/ROADMAP.md` (new)
- `docs/design/mocks/motion/IDEAS.md` (new)
- `docs/design/mocks/motion/scenes.html` (new) and the MX0 preview `.html`
  files (scene fix only, plus anything ROADMAP.md explains)
- `client/src/pages/AnalyticsPage.jsx`
- `client/src/components/analytics/` (edit, add or split components)
- `client/src/styles/analytics-*.css` (edit or add; import from the
  analytics components/page)
- `client/src/index.css` (analytics rules, the `--mx-*` tokens and the
  skeleton/ghost base styles only)
- `client/src/lib/` (new motion hooks/helpers only - no edits to existing
  modules)
- `client/src/components/motion/` (new - shared primitives such as
  `SlidingIndicator`; adopt them in Analytics only, other surfaces are
  later units)
Do NOT modify anything outside these files.

ACCEPTANCE CRITERIA (machine-checkable):
- `docs/design/mocks/motion/ROADMAP.md` exists, lists the wave's units with
  every field above, and its "Last checkpoint" matches the tree.
- `docs/design/mocks/motion/IDEAS.md` exists with at least 5 PARKED
  entries, each with all the fields above.
- DELIVERY.md names which critic points (CRITIC INPUT bullets) the rework
  addresses and which it leaves for later units.
- `scenes.html` exists, follows MX0's PREVIEW RULES (title first, no
  doctype/html/head/body tags, allowed CDN hosts only, reduced-motion rule,
  5 palettes + light/dark, under 2 MB), and shows five visibly different
  environments; every MX0 preview switches environment with the palette.
- `npm run build` from `client/` passes (verbatim output in DELIVERY.md).
- `node scripts/check-hex.mjs` from the repo root exits 0, or DELIVERY.md
  justifies each hit.
- `git status --porcelain --untracked-files=all` lists only paths inside
  FILES TO TOUCH (plus MX0's untouched preview files if still untracked).
- No change to `client/package.json` or `client/package-lock.json`.
- DELIVERY.md lists: which roadmap steps are DONE / PARTIAL, what Seth
  should look at on the Analytics page (on a phone, in at least two
  palettes and both modes), and anything you would do next.

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
