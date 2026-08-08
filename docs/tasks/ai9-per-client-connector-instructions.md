# TASK AI9: per-client connector setup instructions (Claude, ChatGPT, Grok, generic)

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
AI5 shipped the connect surface with a single hardcoded "In Claude" step list
(`AiConnectorPage.jsx:204-224`) and a tier note whose only mention of ChatGPT
tells those users their workspace probably cannot do it. Users on any other
assistant have no path. Seth's August 8 ruling: every frontier assistant that
can actually take a remote MCP URL gets its own instructions, in an accordion
with Claude open by default. This unit replaces that one hardcoded list with
four sourced ones.

**All copy in this block is VERBATIM SPEC.** It comes from recon lane RECON-R2
(August 8), which sourced every menu path to a primary vendor doc with a quote
and a date. Do NOT rewrite, paraphrase, modernise, or "improve" these steps
from your own knowledge - these UIs change constantly and a wrong menu path
shipped to a real user is the exact failure this unit exists to prevent. If you
believe a step is wrong, STOP and say so in DELIVERY.md rather than editing it.

Two specific traps RECON-R2 called out, so they are not reintroduced:
- ChatGPT's path is **Settings -> Security and login -> Developer mode**, then
  Plugins. It is NOT "Settings -> Connectors" - that path appears only in
  third-party blogs, never in OpenAI's own docs.
- Claude's path is **Customize > Connectors**. It is NOT "Settings >
  Integrations" - that is a stale path from third-party READMEs.

FILES TO TOUCH:
- `client/src/pages/profile/AiConnectorPage.jsx`
- `client/src/components/ai/ConnectorSetupAccordion.jsx`  (NEW)
- `client/src/index.css`
Do NOT modify anything outside these files.

CHANGE:

**1. NEW `client/src/components/ai/ConnectorSetupAccordion.jsx`.** A small
disclosure component. There is NO existing accordion pattern in this codebase
to copy - `HowCalculatedButton.jsx` and `MetricInfoButton.jsx` are portal
popovers, and the `.session-live-options-details` CSS is orphaned with no JSX
using it. So this unit introduces the pattern, and its accessibility contract
is part of the spec:

- Each section header is a real `<button type="button">` - not a div, not a
  bare `<summary>` - carrying `aria-expanded={open}` and `aria-controls={panelId}`.
- The panel is a plain element with `id={panelId}`, not rendered (or hidden)
  when closed. Generate ids with React's `useId()`, the way
  `HowCalculatedButton.jsx:14-15` already does.
- Sections open and close INDEPENDENTLY. Do not implement one-at-a-time
  behaviour - collapsing a section the user did not touch is surprising when
  they are following steps.
- Claude's section starts OPEN; the other three start closed.
- Keyboard support comes free from using a real button; do not hand-roll key
  handlers.

Props are your call, but the component must be driven by DATA (an array of
`{ id, label, content }`), not by four hardcoded copies of the same markup.

**2. `client/src/pages/profile/AiConnectorPage.jsx`.** Replace the
`<p><strong>In Claude</strong></p>` + `<ol>` block and the trailing
`field-hint-warn` tier note (`:204-224`) with the accordion. Everything above
it stays exactly as it is - the consent toggle, the copyable connector address,
`buildConnectorUrl()`, and the copy-status handling are all working and out of
scope. The accordion renders only inside the existing `granted` branch, where
the current steps already live.

**VERBATIM COPY - use exactly this.**

Intro line above the accordion (replaces nothing; keep the existing "Add
LogChamp to an AI assistant you already use..." paragraph as-is).

Section 1 label: `Claude`
> 1. Go to Customize > Connectors.
> 2. Click the "+" next to Connectors, then choose "Add custom connector."
> 3. Paste the address above, give it a name, and click Add.
> 4. Sign in to LogChamp when prompted. You'll come straight back.
>
> Works on Free, Pro, Max, Team, and Enterprise plans. Free accounts can add
> only one custom connector. On Team and Enterprise, an organisation Owner has
> to add it under Organization settings > Connectors first.

Section 2 label: `ChatGPT`
> 1. On ChatGPT on the web, open Settings, then "Security and login", and turn
>    on Developer mode.
> 2. Go to ChatGPT Plugins and click the plus button.
> 3. Enter a name and paste the address above as the MCP server URL.
> 4. Sign in to LogChamp when prompted.
>
> Developer mode is available on Pro, Plus, Business, Enterprise, and Education
> accounts, and only on the web - not the mobile apps. On Business, Enterprise,
> and Education an admin may need to enable it for your workspace first.

Section 3 label: `Grok`
> 1. Go to grok.com/connectors.
> 2. Click New Connector, then choose Custom.
> 3. Enter the address above and complete the sign-in.
>
> On Grok Business and Enterprise, a team admin has to add the connector in the
> console before you can connect to it.

Section 4 label: `Any other AI assistant`
> Any assistant that accepts a remote MCP server address will work. Paste the
> address above wherever it asks for an MCP server URL, then complete the
> LogChamp sign-in in your browser when prompted. Your assistant needs to
> support remote servers over the internet - some only support ones running on
> your own machine.

Keep the existing closing line after the accordion:
> Then just ask - "how has my bench press moved this month?"

**3. `client/src/index.css`.** Styles for the accordion. TOKENS ONLY - every
colour must come from the existing custom properties (`--color-border`,
`--color-surface-2`, `--color-text`, `--color-text-secondary`, and the
`--color-interactive` family). No hex literals; `scripts/check-hex.mjs` is run
as an acceptance criterion. Follow the visual weight of the surrounding
`settings-section` / `settings-group` surfaces rather than inventing a new card
idiom, and keep motion restrained per the AGENTS.md anti-goal (~150-250ms,
ease-out, or none at all - a disclosure does not need to animate).

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` compiles with no errors from `client/`.
- `node scripts/check-hex.mjs` passes (tokens-only tripwire).
- `grep -c "aria-expanded" client/src/components/ai/ConnectorSetupAccordion.jsx`
  is at least 1, and `grep -c "aria-controls"` is at least 1.
- `grep -n "Security and login" client/src/pages/profile/AiConnectorPage.jsx`
  MATCHES (the correct ChatGPT path shipped).
- `grep -n "grok.com/connectors" client/src/pages/profile/AiConnectorPage.jsx`
  MATCHES.
- `grep -n "Customize > Connectors" client/src/pages/profile/AiConnectorPage.jsx`
  MATCHES.
- `grep -rn "Settings > Integrations\|Settings -> Connectors" client/src`
  returns NO matches (neither stale/wrong path was introduced).
- `grep -n "In Claude" client/src/pages/profile/AiConnectorPage.jsx` returns NO
  matches (the old single-client block is gone).
- The four section labels `Claude`, `ChatGPT`, `Grok`, and
  `Any other AI assistant` all appear in the rendered source.
- State in DELIVERY.md that no automated lane renders this page (the client has
  no test lane) - the build passing is NOT evidence the accordion opens,
  closes, or reads correctly. That is Seth's smoke.

NOT IN SCOPE (do not do these):
- Do NOT change the consent toggle, `buildConnectorUrl()`, the copyable address
  block, or the copy-status handling - all working, all out of scope.
- Do NOT hardcode the connector host anywhere; the address comes from
  `buildConnectorUrl()` and that stays as it is.
- Do NOT add a client-side test framework or any dependency.
- Do NOT add Cursor, VS Code, or other developer-tool clients. Seth's August 8
  scope ruling is these four; those clients configure MCP by JSON config rather
  than by pasting a URL into a settings page, which is a different instruction
  shape and a different unit if it is ever wanted.

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
