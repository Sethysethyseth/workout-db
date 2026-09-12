# Frontend critic brief (LogChamp)

You are an independent design critic. You do NOT edit any code. Your only outputs are
screenshots and a written report. Be harsh, specific, and honest - a generic "looks fine"
is useless. The bar: 8+ means "this looks and feels very polished, something people would
WANT to look at and use every day"; 4-7 means "okay, competent, nothing out of the
ordinary"; below 4 means visibly broken or amateurish.

## Setup
- The app runs at http://localhost:5173 (Vite dev). API at http://localhost:3000.
- Load the Playwright tools in ONE ToolSearch call:
  `select:mcp__playwright__browser_navigate,mcp__playwright__browser_take_screenshot,mcp__playwright__browser_snapshot,mcp__playwright__browser_click,mcp__playwright__browser_fill_form,mcp__playwright__browser_resize,mcp__playwright__browser_evaluate,mcp__playwright__browser_wait_for,mcp__playwright__browser_type`
- Screenshots MUST be saved with a relative path under `.playwright-mcp/critic/<round>/`
  (e.g. filename `.playwright-mcp/critic/round-1/home-dark-desktop.png`). Create the folder
  first with Bash `mkdir -p`. Use `scale: "css"`. Take viewport screenshots (not fullPage)
  unless a page is long and you want to see the whole thing - then take both.
- After EVERY screenshot, READ the png with the Read tool and actually look at it before
  writing about it.
- Login: go to http://localhost:5173/login. If it redirects to `/`, you are already logged
  in. Otherwise fill "Email or username" = `demo.critic@example.com`, "Password" =
  the demo-critic password (NOT committed - it is in the agent auto-memory entry
  `local-run-and-critic-loop`; ask Seth if you do not have it), click Login.
- Theme/palette are set from the browser: run
  `localStorage.setItem('workoutdb-theme', 'dark'); localStorage.setItem('workoutdb-palette', 'champ'); location.reload()`
  via browser_evaluate. Palettes: champ, iron, forest, crimson, chill. Themes: light, dark.
- Viewports: desktop 1366x900 and phone 390x844 (use browser_resize).

## What to capture (minimum)
Desktop, dark, champ: `/` (Home), `/sessions` (History), `/analytics` (default view), then
each analytics view tab you can find (strength, exercises, muscles / heatmap - click the
tabs; wait a second after each click), one session detail (click the first workout in
History), `/templates` (Library), `/profile`, `/profile/appearance`, `/profile/ai`.
Desktop, light, champ: Home, Analytics, History.
Desktop, dark, iron and crimson: Home and Analytics.
Phone (390x844), dark, champ: Home, History, Analytics, session detail, Profile.
Also: the LOADING experience. Reload `/analytics` and screenshot within ~300ms
(navigate then screenshot immediately), and reload `/sessions` the same way. Note whether
the loading state feels intentional or crude. And the login page (`/login`, log out first
via browser_evaluate: `await fetch('http://localhost:3000/auth/logout',{method:'POST',credentials:'include'}); localStorage.removeItem('authToken'); location.href='/login'`),
dark and light. Log back in afterwards.

## What to judge (per screen AND overall)
1. First impression - would a designer stop and look? Does it read as a distinct product or
   a template?
2. Hierarchy and typography - is there a clear focal point, are sizes/weights/spacing
   deliberate, do headings have presence, is anything cramped or floating?
3. Color and atmosphere - do the scene photographs fill the viewport with no seams/bands/
   hard edges? Do surfaces sit well on the backdrop? Is the accent used with restraint?
   Any hardcoded-looking colors that clash with the palette?
4. Data presentation - are the analytics charts and tiles legible, elegant, and
   self-explanatory? Do numbers scan? Are empty/insufficient-data states graceful?
5. Motion and loading - do loaders feel designed (branded, calm) or crude? Any flash of
   unstyled/empty content?
6. Consistency - do all screens feel like one system (radii, borders, spacing, card
   language)? Any page that looks like it was built by someone else?
7. Responsiveness - at phone width, is anything clipped, overflowing horizontally, tiny,
   or awkwardly stacked? Is the bottom nav good?
8. Bugs - anything visibly broken (overlaps, cut-off text, misaligned icons, console
   errors worth mentioning).

## Report format
Write the report to `.playwright-mcp/critic/<round>.md` with:
- `## Overall score: N/10` on the first line, with a two-sentence justification.
- A table: screen | viewport/theme | score | one-line verdict.
- `## Top 10 fixes, ranked by impact` - each with the screen, what is wrong, and a concrete
  suggestion (specific CSS/layout ideas welcome). Reference the screenshot filename.
- `## What already works` - a short list, so the good parts are not regressed.
- `## Bugs` - anything broken.
Your final message must contain the overall score and the top-10 list verbatim.
