# TASK BK0: Privacy policy + Terms of Service pages (plain language)

STATUS: DRAFT            <!-- blocked on Seth's facts below; flip to QUEUED
                              once every OPEN FACT is filled in -->
MODEL: auto
MODE: 1-relay

OPEN FACTS (Seth - fill these in, then this block is QUEUED):
- Operator name as it should appear ("LogChamp, operated by <name>" or a
  business name).
- Contact email to publish for privacy requests.
- Governing law / jurisdiction (US state).
- Effective date to print.
- Account deletion: there is NO in-app "delete my account" today (grep
  Sept 28). Say "email us and we delete within N days" (what N?), or ask for
  an in-app delete first (a separate unit).

CONTEXT:
`docs/specs/ai-layer.md` section 6 required "Privacy policy and ToS updated
in the SAME wave as the first AI feature"; the AI wave shipped without them,
and Seth ruled Sept 26 that they are the first unit of the next wave. The
blocks-v2 wave adds a connector WRITE (draft blocks, opt-in), which the
policy must describe too (`docs/specs/blocks-v2.md` section 8). No privacy
or terms page exists anywhere in the client (grep Sept 28).

FILES TO TOUCH:
- `client/src/pages/PrivacyPage.jsx`      (NEW - public route `/privacy`)
- `client/src/pages/TermsPage.jsx`        (NEW - public route `/terms`)
- `client/src/App.jsx`                    (two public routes, reachable
                                           signed out)
- `client/src/pages/LoginPage.jsx`, `RegisterPage.jsx`,
  `ConnectorLoginPage.jsx`, `client/src/pages/profile/AiConnectorPage.jsx`
                                          (a small "Privacy · Terms" link
                                           line each)
- `client/src/index.css` OR a new `client/src/styles/legal.css` (only the
  rules the two pages need - prefer the new file)
Do NOT modify anything outside these files.

CHANGE:
Two readable pages in plain language (short sections, headings, no legalese
walls), dated with the effective date, contact email at the top and bottom.
Privacy must state, accurately against today's code: what is stored (account
email and password hash; workouts, sets, notes, templates, blocks, custom
exercises; device-only preferences like theme, palette and weight unit live
in the browser); the session cookie (`workoutdb.sid`) and why; the AI
features - off until the user grants consent, revocable, what leaves the app
(the computed training summary, never individual sets, notes or account
details - quote the facts from `client/src/components/ai/AiConsentFacts.jsx`
so the two never disagree), which providers process coach requests
(Anthropic; Cursor for the hosted coach), bring-your-own keys encrypted at
rest and never shown again, the 7-per-week hosted coach cap records only who
and when (no content); the connector draft-block write (opt-in, create-only,
drafts reviewed before use); no selling of data, no ads; how to get data
deleted (per the OPEN FACT). Terms: the service as-is, acceptable use, the
user owns their training data, AI output is informational and not medical
advice (training around injuries: consult a professional), termination,
changes, governing law, contact.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run build` from `client/` compiles with no errors.
- `node scripts/check-hex.mjs` clean.
- Signed out, `/privacy` and `/terms` render (they are not behind the auth
  guard - show the `App.jsx` hunk).
- Every "what leaves" sentence in PrivacyPage matches AiConsentFacts
  verbatim (paste both side by side in DELIVERY.md).
- No placeholder text remains (`rg -n "TODO|TBD|<name>|lorem" client/src/pages/PrivacyPage.jsx client/src/pages/TermsPage.jsx`
  prints nothing).

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
