# TASK MX0: Motion + visuals direction, with clickable previews (NO app changes)

STATUS: QUEUED
MODEL: claude-fable-5-1-thinking-high
MODE: 1-relay (lane worktree, report + preview files only)

CONTEXT:
Seth wants the next frontend wave to make LogChamp look and move like
something people stop and stare at - "I don't want it to be overbearing but
I want this to be wicked." Motion, graphics and transitions, pushed as far as
the app can handle. Analytics is the headline surface (it is the product's
wedge), but every surface is fair game. This block is deliberately a BRIEF,
not a spec: you are the designer. The thinking, the direction and the plan
are yours, and Seth has said he will go with your suggestions. Nothing in the
app changes in this block - you produce a direction doc and standalone HTML
previews that Seth clicks through on his phone before any build work is
authored.

The old "no over-built motion / restraint" anti-goal is GONE - read the new
motion stance in AGENTS.md (Anti-goals section). Its bounds are the only
limits on ambition here.

READ FIRST (recon - you decide how deep):
- `AGENTS.md` - especially "UI architecture - palettes/tokens" (tokens-only,
  5 palettes x light/dark, `card--live` semantics, the scene layer).
- `client/src/index.css` - the real tokens (top ~470 lines: base tokens,
  per-palette surfaces, scene layer) and the fonts (`--font-display` Chakra
  Petch, `--font-block` Barlow Condensed).
- `client/src/pages/AnalyticsPage.jsx`, `client/src/components/analytics/`,
  `client/src/styles/analytics-strength.css` - what analytics shows today.
- `client/src/pages/DashboardPage.jsx` (Home), the workout logger
  (`client/src/components/workout/`, `client/src/styles/logger.css`), the
  block run page, `client/src/components/layout/` (nav, routing shell).
- `docs/tasks/qol-critic-round-2-FINDINGS.md` Part B - the most recent
  app-wide look-and-feel critique (what to keep, what reads as "assembled,
  not designed"). `docs/design/critic-brief.md` for how screens get judged.
- `docs/design/mocks/*.png` - the palette scene references.

WHAT TO PRODUCE (all under `docs/design/mocks/motion/`):

1. `MOTION-DIRECTION.md` - your design direction. At minimum:
   - the motion language: principles, timing + easing tokens, choreography
     rules, where motion is loud and where it is quiet, and why
   - per-surface plan: what changes on each surface you touch (analytics
     REQUIRED; others your call - Home, navigation/page transitions, the
     logger, PR / milestone moments, empty states, the block run page, ...)
   - implementation approach per effect: CSS, Web Animations API, View
     Transitions API, canvas/WebGL, or a library. Say for each whether it
     ships with ZERO new dependencies or needs a package (name + rough
     gzipped size). Adding a package to the app is Seth's call later
     (dependency gate), so make the trade visible.
   - performance plan (what keeps it smooth on a mid-range phone) and the
     reduced-motion plan
   - a proposed wave breakdown: a rough list of build units in a sensible
     order, each one line. This becomes the input for authoring the wave's
     task blocks.

2. Clickable previews - standalone `.html` files, as many as the direction
   needs (guide: 3-6). One MUST be analytics. If you have more than one
   strong idea for a surface, show them as switchable options (A / B) so
   Seth can pick. Make them interactive: replay controls, tap-through
   states, real-feeling transitions - Seth judges FEEL, so a static mock
   does not do the job. Use plausible FAKE lifting data (lb, sets x reps,
   e1RM, RIR/RPE, weekly volume by muscle, PRs) - never real user data.

3. `DELIVERY.md` at the lane root (see STOP CONDITION): files produced, one
   paragraph per preview on what to look at, and your top recommendation.

PREVIEW RULES (non-negotiable - the previews get published as private
claude.ai Artifacts and opened on a phone, which enforces these):
- One self-contained file per preview: inline all CSS and JS; images or
  textures as `data:` URIs or drawn in code. Do NOT write `<!doctype>`,
  `<html>`, `<head>` or `<body>` tags - a wrapper adds them. Start the file
  with a `<title>` (a 2-4 word name, e.g. "Analytics in Motion") then
  `<style>`.
- External scripts ONLY from `https://cdnjs.cloudflare.com`,
  `https://cdn.jsdelivr.net/npm/` or `https://unpkg.com`, UMD builds, pinned
  to an exact version (e.g. `.../gsap/3.12.5/gsap.min.js`), never a bare
  name, range or `@latest`. External stylesheets ONLY from Google Fonts
  (Chakra Petch and Barlow Condensed are there). Nothing else loads - no
  fetch/XHR to any host, no iframes, no external images.
- Real tokens: copy the actual token values from `client/src/index.css` into
  each preview and use the same mechanism the app uses (`data-palette` and
  `data-theme` on `<html>`). Every preview has a palette switcher (champ,
  iron, chill, forest, crimson) and a light/dark toggle, and must look right
  in all 10 combos. Default to dark if `prefers-color-scheme: dark` (or a
  `data-theme="dark"` already on `<html>`), else light. No color literal
  outside the copied token blocks. `body` sets an explicit token background.
- Phone first: designed at 390px wide, no horizontal page scroll at any
  width, 16px minimum side gutter. Fine on desktop too.
- `prefers-reduced-motion: reduce` is honored in every preview (state what
  the reduced version does in the direction doc).
- No `alert()` / `confirm()` / `prompt()`; no download links.
- Each file under 2 MB.

FILES TO TOUCH:
- `docs/design/mocks/motion/` (new directory: `MOTION-DIRECTION.md` + the
  preview `.html` files)
- `DELIVERY.md` at the lane root (gitignored)
Do NOT modify anything outside these files. No changes under `client/`,
`server/`, `docs/tasks/`, or any package/lockfile. No npm installs.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain --untracked-files=all` lists ONLY paths under
  `docs/design/mocks/motion/` (DELIVERY.md is gitignored).
- `docs/design/mocks/motion/MOTION-DIRECTION.md` exists and has sections
  for: motion language, per-surface plan, implementation approach (with a
  zero-dep vs package call per effect), performance, reduced motion,
  proposed wave breakdown.
- At least 3 `.html` previews exist; at least one is analytics.
- Every preview: begins with a `<title>`; contains no `<!doctype`, `<html`,
  `<head` or `<body` tag; every `<script src>` host is cdnjs.cloudflare.com,
  cdn.jsdelivr.net/npm/ or unpkg.com with an exact pinned version; every
  `<link rel="stylesheet">` host is fonts.googleapis.com; contains a
  `prefers-reduced-motion` rule; offers all 5 palettes + light/dark.
- Every preview is under 2 MB.
- DELIVERY.md shows the evidence for each criterion above (a listing, the
  grep output for script/link hosts, file sizes).

STOP CONDITION (standing footer - keep verbatim in every block):
Stop when the acceptance criteria are met. If a criterion cannot be met,
stop and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test
  output; each acceptance criterion with the evidence that proved it; any
  deviations from this block, with reasons). Do not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree
  for review.
