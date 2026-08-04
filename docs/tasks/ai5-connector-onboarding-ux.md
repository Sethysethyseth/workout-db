# TASK AI5: connector onboarding - the in-app "connect your AI assistant" surface

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Final unit of the AI connector wave (`docs/specs/ai-layer.md`, phase AI4 in that
spec's numbering). AI1 built the consent record and a bare `/profile/ai` page;
AI2-AI4 built the server side. This unit turns that page into something a
person can actually use: the URL to paste, what to do with it, and an honest
account of what happens next.

This is the unit where the wave either lands or doesn't. **A prior wave's
lesson, worth re-reading before writing a line: E3 met every acceptance
criterion in its block and still failed, because the criteria asserted that an
element rendered while the actual requirement was that a human NOTICE it.**
Machine-checkable criteria cannot express "discoverable" - that gap is what
Seth's smoke exists to catch. Write this unit as if the criteria below are the
floor rather than the goal.

Grounding from the AIR2/AIR3 recon (August 4):

- **The client has NO toast or snackbar system.** Grep-confirmed. Success
  feedback follows `SecurityPage.jsx:57-60`: an inline
  `settings-feedback settings-feedback--success` div. Do not add a toast library
  and do not hand-roll a floating notification.
- **The API base URL is already available client-side** as
  `import.meta.env.VITE_API_URL` (`client/src/api/http.js:1-4`), with a
  `http://localhost:3000` fallback in dev. The connector URL is that base plus
  `/mcp`. Derive it - do not hardcode a host, and do not add a server endpoint
  just to hand the client a string it can already build.
- **Custom connectors are available on Claude's Free tier** (limited to one),
  as well as Pro, Max, Team, and Enterprise. **ChatGPT is different:** custom
  MCP connectors there are limited to Business, Enterprise, and Edu workspaces -
  they are NOT available on free or personal ChatGPT. The copy below reflects
  that asymmetry, and it is the honest version. Do not "simplify" it into
  promising both.
- **What's New is prod-gated** via `isProdEnv()` and its content lives in
  `client/src/data/whatsNew.js` - prepend to `RELEASES`, newest first; a changed
  `id` re-triggers the modal on every device.
- **`field-hint-warn` exists** at `client/src/index.css:2563-2569` and is the
  established idiom for a cautionary inline hint.

FILES TO TOUCH:
- `client/src/pages/profile/AiConnectorPage.jsx`  (extend AI1's page)
- `client/src/data/whatsNew.js`                   (one new release entry)
- `client/src/index.css`                          (ONLY if a new class is truly needed - see below)
Do NOT modify anything outside these files. In particular do NOT touch
`client/src/api/aiApi.js` or any server file - this unit adds no new endpoint.

CHANGE:

**1. Extend `AiConnectorPage.jsx`.** AI1's version shows the consent statement
and the on/off control. Keep all of that unchanged - the consent copy is smoke-
approved product voice and this unit does not rewrite it. Add, BELOW it, a
connection section that renders **only when consent is granted**. Before consent
there is nothing to connect, and showing setup steps the user cannot complete
yet is how a settings page becomes noise.

The connection section contains, in order:

a. **The connector URL, displayed and copyable.** Show the full URL as
   selectable text (not truncated, not behind a tooltip) plus a copy button.
   On copy, show the inline
   `settings-feedback settings-feedback--success` confirmation - the same idiom
   `SecurityPage.jsx` uses. `navigator.clipboard` can reject (insecure context,
   permissions); handle the failure by leaving the URL selectable and saying so,
   rather than showing a success message for a copy that did not happen.

b. **The steps**, as a short ordered list. Copy is specified verbatim below.

c. **The tier note**, using the existing `field-hint-warn` class.

**2. Copy - VERBATIM. This is product voice, not Cursor's call.**

> Section heading: `Connect your AI assistant`
>
> Intro: `Add LogChamp to an AI assistant you already use, then ask it about
> your training the way you'd ask a coach.`
>
> URL label: `Your LogChamp connector address`
>
> Copy button, idle: `Copy address`
> Copy button, after success: `Copied`
> Copy failure line: `Couldn't copy automatically - select the address above and
> copy it.`
>
> Steps heading: `In Claude`
> Step 1: `Open Settings, then Connectors.`
> Step 2: `Choose Add custom connector.`
> Step 3: `Paste the address above and connect.`
> Step 4: `Sign in to LogChamp when prompted. You'll come straight back.`
>
> Closing line: `Then just ask - "how has my bench press moved this month?"`
>
> Tier note (`field-hint-warn`): `Custom connectors work on every Claude plan,
> including the free one, though free accounts can add only one. In ChatGPT
> they're currently limited to Business, Enterprise, and Edu workspaces.`

Do not add screenshots, do not add an embedded video, and do not add a link out
to Anthropic's or OpenAI's documentation - those rot, and a four-step list the
user can follow without leaving the page is the better artefact.

**3. `client/src/index.css`.** Touch this ONLY if the layout genuinely needs a
class that does not exist. Before adding anything, check what is already there:
`settings-page`, `settings-section`, `settings-group`, `settings-row`,
`settings-feedback`, `field-hint-warn`. If you do add a rule, it must be
tokens-only - **no hex literals anywhere**, colours via the existing custom
properties (`--color-surface-2`, `--color-border`, `--color-text-secondary`,
`--color-interactive`, ...). `scripts/check-hex.mjs` is run at review and a hex
literal fails the unit.

**One layout trap, from a prior wave: adding a child to a CSS grid silently
reflows it.** E4 shipped a line that had to be a SIBLING of `.coverage-row` (a
`1fr 120px` grid) - as a child it became a third grid item squeezed into the
narrow first column, with a green build and a wrong layout. If you place the new
section inside any existing grid container, check the container's rule before
assuming it will flow.

**4. `client/src/data/whatsNew.js`.** Prepend ONE new release entry, newest
first, following the shape of the existing entries and the comment block at
`:1-16`. **Release copy is plain language for lifters, not developers** - no
"MCP", no "OAuth", no "connector protocol". Verbatim:

> Title: `Ask your AI assistant about your training`
>
> Body: `You can now connect LogChamp to Claude and ask about your own
> training - what's moving, what's stalled, how hard you've actually been
> working. Only your computed summary is shared, never your individual sets, and
> it stays off until you turn it on. Find it under Profile, then AI access.`

Give it a new `id` following the existing convention. Changing the `id` is what
re-triggers the modal, so this is the mechanism, not an afterthought.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` compiles with no errors.
- `node scripts/check-hex.mjs` exits 0 - zero hex literals added.
- `grep -rn "localhost:3000\|onrender.com\|workout-db" client/src/pages/profile/AiConnectorPage.jsx`
  returns NOTHING - the connector URL is derived from `import.meta.env.VITE_API_URL`,
  never hardcoded. Paste the grep.
- `grep -rn "toast\|Toast\|snackbar\|Snackbar" client/src/pages/profile/AiConnectorPage.jsx`
  returns NOTHING.
- The connection section is gated on consent: show the JSX condition and confirm
  by reading that with consent absent, nothing in step 1 renders.
- The four copy strings for the steps, the tier note, and the What's New body
  match the text above CHARACTER FOR CHARACTER. Diff them; do not eyeball them.
  ASCII hyphens as written - do not substitute em-dashes.
- `client/src/data/whatsNew.js` gained exactly one entry, at the TOP of
  `RELEASES`, with an `id` not used by any existing entry.
- The AI1 consent copy on this page is UNCHANGED - show that those lines do not
  appear in the diff.

**SMOKE IS THE REAL TEST HERE, and the criteria above cannot substitute for
it.** Every string in this unit is read by a human under time pressure inside a
settings page they opened for another reason. State in the delivery report which
of these you could not verify by any lane - and resist the temptation to phrase
a green build as though it validated the copy.

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
