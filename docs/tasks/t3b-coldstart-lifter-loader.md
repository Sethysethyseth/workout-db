# TASK T3B: Cold-start boot loader - animated lifter mark

STATUS: QUEUED
MODEL: fable            <!-- judgment-heavy visual unit; design IS the spec -->
MODE: 1-relay

CONTEXT:
Follow-on to T3 (`t3-dynamic-loading-screens.md`, `de03801`). The page-tone
`LoadingState` is the cold-start boot loader shown while a returning user's
`/auth/me` resolves against a cold Render server (can take 30-60s to wake).
It currently renders a small breathing accent ring. Seth wants that moment to
make it *obvious the server is spinning up* - Discord-spin-up energy, our own
take: the pixel-art lifter sprite doing slow reps (pressing a weight up and
down) while we wait. This is the ONLY `tone="page"` call site in the app
(`client/src/components/ProtectedRoute.jsx`), so the blast radius is exactly
the boot/login loading screen - fast in-app loaders (default/card tone) are
untouched.

This is a judgment-heavy visual unit, so it is fully specified below (the
design detail IS the contract, per the template's visual-unit exception).

FILES TO TOUCH:
- client/src/components/LoadingState.jsx   (page-tone branch: swap the ring
                                            mark for the lifter mark; import
                                            the sprite)
- client/src/index.css                     (lifter mark styles + keyframes;
                                            reduced-motion opt-out. Keep the
                                            existing `.loading-page__ring`
                                            rules in place - they are unused
                                            after this but leave them for now,
                                            do not delete)
The sprite already exists at `client/src/assets/brand/lifter.png` (1024x652
RGBA, transparent padding around a centered barbell+lifter figure). Do NOT add
or re-export any asset.
Do NOT modify anything outside these files.

CHANGE:

1. **Tint via CSS mask, never a raw `<img>`.** The sprite's fill is magenta
   placeholder color and must NOT ship as-is (tokens-only rule; it has to read
   correctly across all 4 palettes x 2 modes). Render it as a mask-image on a
   box filled with `--color-interactive`, exactly the idiom already used by
   `.wordmark::after` in `index.css` (~line 4830: `-webkit-mask-image` +
   `mask-image` + `background: <token>`). Import the PNG in `LoadingState.jsx`
   and pass it to the mask (Vite hashes the URL), OR reference it by relative
   path from `index.css` the way `.wordmark::after` references
   `wordmark_crown_mask.png` - match whichever the crown mask does. Use
   `mask-size: contain`, `mask-repeat: no-repeat`, `mask-position: center`.
   The figure should read ~56-72px tall on screen; because the source has
   generous transparent padding, the mask box will be larger than the visible
   figure - size the box so the *figure* lands in that range (start ~120px
   wide x ~92px tall and tune).

2. **Markup (LoadingState.jsx, `tone === "page"` branch only).** Replace the
   `<span className="loading-page__ring" />` inside `.loading-page__mark` with
   the lifter element, e.g. `<span className="loading-page__lifter" />`. Leave
   the whole `.loading-page__text-wrap` label/cross-fade block exactly as is -
   the "Loading session..." -> "Waking up the server..." swap on the `slow`
   state is doing real honesty work and must survive untouched. The delayed
   reveal (`useDelayedReveal`, 400ms) also stays as is, so fast cached loads
   still never flash the lifter - only genuine cold starts show it.

3. **Motion = a rep, not a bob.** The glyph presses a weight up and lowers it,
   on a loop, so it reads as effort/work-in-progress. Author it with an
   asymmetric rhythm: a quicker concentric drive up, a brief hold at lockout,
   a slower eccentric lower. Use `%`-based translateY (relative to the glyph's
   own height, so it stays padding- and size-robust) and `transform-origin:
   center`. Target loop ~1.8s, looping infinitely. Starting point to tune from:

   ```css
   .loading-page__lifter {
     width: 120px;              /* tune so the visible figure reads ~56-72px tall */
     height: 92px;
     background-color: var(--color-interactive);
     -webkit-mask: url("./assets/brand/lifter.png") center / contain no-repeat;
     mask: url("./assets/brand/lifter.png") center / contain no-repeat;
     animation: coldstart-lift 1.8s ease-in-out infinite,
                coldstart-glow 1.8s ease-in-out infinite;
     will-change: transform, filter;
   }

   @keyframes coldstart-lift {
     0%   { transform: translateY(6%)  scaleY(0.97); }  /* loaded, bottom */
     10%  { transform: translateY(6%)  scaleY(0.96); }  /* brief grind */
     38%  { transform: translateY(-8%) scaleY(1.03); }  /* drive to lockout */
     55%  { transform: translateY(-8%) scaleY(1.02); }  /* hold at top */
     100% { transform: translateY(6%)  scaleY(0.97); }  /* eccentric lower */
   }

   @keyframes coldstart-glow {
     0%, 100% { filter: drop-shadow(0 2px 4px color-mix(in srgb, var(--color-interactive) 0%, transparent)); }
     46%      { filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--color-interactive) 38%, transparent)); }
   }
   ```

   The `scaleY` from `transform-origin: center` gives a subtle stretch at
   lockout (extra "effort"); the glow peaks at ~46% to coincide with the top
   of the rep. Tune the numbers so the motion reads as lifting, not floating -
   but keep it restrained (project anti-goal: flashy motion reads as amateur;
   this is a slow, deliberate rep, not a bounce).

4. **`.loading-page__mark` sizing.** It is currently a fixed 48x48 box built
   for the ring. Let the lifter drive its own size - set the mark box to size
   to its content for the page loader (e.g. `width: auto; height: auto`) or
   widen it to fit the lifter box; the lifter must not be clipped and must stay
   horizontally centered under nothing / above the label (the existing
   `.loading-page__content` column-center layout stays).

5. **Reduced motion.** Under `@media (prefers-reduced-motion: reduce)`, disable
   `coldstart-lift` and `coldstart-glow` (`animation: none`) so the lifter
   renders as a static, centered, accent-tinted glyph - still on-brand, just
   not moving. Do NOT fall back to the old ring.

6. **Tokens only.** No new hex anywhere in the diff. Every color derives from
   `--color-interactive` (mask fill + glow via `color-mix`), same as the ring
   it replaces.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` from `client/` compiles with no errors.
- `grep -nE "#[0-9a-fA-F]{3,8}" ` over the added `index.css` lines returns
  nothing (no raw hex introduced); the mark's color comes from
  `var(--color-interactive)`.
- `LoadingState.jsx` `tone === "page"` branch no longer renders
  `loading-page__ring` and renders the lifter element instead; the
  `.loading-page__text-wrap` label block and the `useDelayedReveal` timing are
  byte-unchanged.
- `index.css` contains `@keyframes coldstart-lift`, `@keyframes coldstart-glow`,
  a `mask`/`-webkit-mask` referencing `lifter.png`,
  `background-color: var(--color-interactive)` (or equivalent token fill) on
  the lifter, and a `prefers-reduced-motion: reduce` block that sets
  `animation: none` on the lifter.
- The existing `.loading-page__ring` rules are still present (not deleted).
- No new dependency; `client/package.json` byte-identical.
- Server untouched.

VISUAL SIGN-OFF (Seth, on the Vercel staging deploy - not a Cursor criterion,
noted so the reviewer knows what is deferred): the lifter reads as lifting a
weight up and down (not bobbing/floating), reads cleanly across the 4 palettes
x dark/light, the figure is a sensible size, and the faint barbell in the
sprite's alpha doesn't render as distracting ghost lines. If the barbell's
low-alpha lines read as junk under the tint, that's a sprite re-export ask for
Gemini (out of scope here) - flag it in DELIVERY.md, don't try to fix the asset.

STOP CONDITION (standing footer - keep verbatim):
Stop when the acceptance criteria are met. If a criterion cannot be met, stop
and explain why instead of guessing.
- Before stopping, run every lane this block allows and write the delivery
  report to DELIVERY.md at the repo root (files touched; verbatim test output
  - here just the client `npm run build`; each acceptance criterion with the
  evidence that proved it; any deviations from this block, with reasons). Do
  not commit it.
- Do NOT commit, push, or touch git in any way - leave the working tree for
  review.
- Do NOT edit docs/HANDOFF.md, AGENTS.md, CLAUDE.md, this task file, or
  anything under docs/tasks/ - state is the reviewer's job.
- Do NOT add dependencies or refactor unrelated code.
- Do NOT start another task file when done - end your turn.
