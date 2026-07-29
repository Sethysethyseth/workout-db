# Spec: AI-generated palettes (theming)

*Authored July 29, 2026 (Opus frontier seat) from Seth's AI-personalization
brainstorm. SPEC ONLY - no task blocks authored, no code this pass (his
decision 4). Companion to `ai-layer.md`; independent of it in build order.*

## 1. What this is

The user describes a look in words ("a 90s basement gym", "cold and clinical",
"sunrise") and LogChamp generates a palette that reskins the whole app. It
becomes a user-owned palette on the existing `data-palette` axis, alongside
champ / iron / forest / crimson.

Why it earns a place in the premium story: it is one generation call with tiny
output, so it is nearly free to serve; the value is visually self-evident in a
way "better insights" never is; and it has **zero dependency on effort data or
the analytics engine**, so it is not blocked behind the E-wave or `ai-layer.md`.

## 2. The core rule: generate a token object, never CSS

**The model emits a fixed-shape record of hex values. It never emits CSS, class
names, selectors, or markup.**

Letting a model author CSS would forfeit the tokens-only discipline AGENTS.md
calls load-bearing and the 8-combo guarantee (4 palettes x 2 modes) that every
surface is held to. A constrained object keeps generation on the safe side of
that line: the worst a bad generation can produce is an ugly-but-valid palette,
never broken layout, never an injected selector, never an unstyled surface.

This is the whole safety argument for the feature. Do not relax it.

## 3. The token contract (from `client/src/index.css`)

The existing palette blocks are unusually well-suited to this, because a
palette overrides only a handful of hand-authored hexes and everything
accent-adjacent derives via `color-mix`. Per `index.css:140-186`, one palette
defines:

**Light (`html[data-palette="<name>"]`)** - 8 tokens:
`--color-interactive`, `--color-interactive-hover`, `--color-bg`,
`--color-surface-1`, `--color-surface-2`, `--color-surface-3`,
`--color-border`, `--color-input-border`

**Dark (`html[data-theme="dark"][data-palette="<name>"]`)** - the same 8, plus
4 button tokens: `--color-btn-primary-bg`, `--color-btn-primary-fg`,
`--color-btn-primary-hover-bg`, `--color-btn-primary-active-bg`

So a generated palette is roughly **20 hex values**, and nothing else. Rings,
nav-active, pills, and success backgrounds already derive from
`--color-interactive` via `color-mix`, so they follow for free - which is
exactly why this feature is cheap.

Two invariants carried from `index.css:140-144`, both machine-checkable:

- **Text tokens are NEVER overridden.** A generated palette may not touch them.
  This is what makes contrast validation both necessary and tractable: text
  colors are fixed, so generated surfaces must be validated against known
  values rather than against each other.
- **Cascade parity:** every token the light block sets must be re-set in the
  dark block, which out-specifies it. A generated palette missing a dark
  counterpart would leak light surfaces into dark mode.

## 4. Validation - a runtime validator, not `check-hex.mjs`

**Correction worth recording:** `scripts/check-hex.mjs` cannot serve as this
gate. It scans a **git diff** for raw colors added under `client/src/`
(`check-hex.mjs:23`), so a palette generated at runtime never passes through it.
It remains the right tripwire for the feature's own authored code - the UI must
not hardcode colors while building this - but it cannot validate generated
output.

Generated palettes need a **shared, pure, fixture-tested validator module**,
following the `server/src/analytics/` house style (pure functions, no DB, no
Prisma). It must reject, not repair:

1. **Shape** - exactly the section 3 token set, no extra keys, no missing keys.
2. **Format** - every value a valid hex; no `rgb()`, no `hsl()`, no
   `color-mix`, no `var()`, no CSS functions of any kind. This is the injection
   boundary.
3. **Cascade parity** - every light token has its dark counterpart.
4. **Contrast** - each surface token meets the WCAG AA threshold against the
   FIXED text tokens, checked in light AND dark independently. This is the
   check that stops "unreadable but pretty."
5. **Separation** - surface-1/2/3 must be mutually distinguishable, and
   `--color-border` distinguishable from its adjacent surface, or the depth
   cues the UI relies on collapse.

A palette that fails validation is never applied. The user sees a "that didn't
work, try describing it differently" state and the previous palette stands.
Never partially apply, never fall back to a half-generated set.

**Server-side validation is authoritative.** Even if a client-side check exists
for responsiveness, the stored palette must be validated on the server - a
client-only gate is bypassable, and this writes to persisted user state.

## 5. Open design questions (resolve before authoring)

- **Storage.** A generated palette is per-user persisted state, so it is a
  schema addition and therefore lands on Seth's manual migration track. Decide:
  one active generated palette per user, or a small saved library. Recommend
  **one active plus a bounded history** - a library invites a management UI
  this feature does not need.
- **Injection mechanism.** Tokens must reach the document without authoring
  CSS text. Options: inline style properties set on the root element from the
  validated object (preferred - no stylesheet parsing, no string
  interpolation), or a generated `<style>` block (rejected: string
  interpolation into CSS is the one place an injection could hide).
  `ThemeContext` (`client/src/context/`) already owns both axes and is the
  natural home.
- **Palette name collision.** A user palette must not shadow `champ` / `iron` /
  `forest` / `crimson`, and unknown palettes already fall back to champ
  (`index.css:143`) - so the generated palette needs a reserved namespace value
  rather than an arbitrary name.
- **Scene layer.** Each shipped palette has a scene raster
  (`client/src/assets/scenes`). Generated palettes have no raster. Decide
  whether they render with no scene, a neutral scene, or the nearest shipped
  palette's scene. Recommend **no scene** for v1 - generating imagery is a much
  larger feature with its own cost and moderation surface.
- **Entitlement.** Same gate-designed-in posture as `ai-layer.md` section 4.3.

## 6. Model / escalation

Generation is a small prompt with a rigid output schema, so the interesting work
is the validator and the storage design, not the prompt.

**Frontier seat owns:** the storage schema (migration-carrying, so gated
regardless) and the validator contract, since contrast and injection are the
two places a mistake actually hurts.

Cursor blocks: the validator module and its fixtures, the generation adapter,
the `ThemeContext` wiring, and the request UI - each contract-first, with the
section 2 rule ("token object, never CSS") restated in every unit's acceptance
criteria.
