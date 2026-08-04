# TASK AIR2: RECON (REPORT ONLY) - where consent, settings, and connector UI would live

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the AI connector wave (`docs/specs/ai-layer.md`). Section 6
of that spec requires that explicit, opt-in, revocable data-sharing consent
ships WITH the first AI feature - recorded server-side with a timestamp and the
scope consented to, off by default. Section 4.3 requires a server-side
entitlement check on the connector token from day one. Section 4.4 (AI4) needs
an in-app "connect to Claude/ChatGPT" surface. None of this exists. This block
produces a REPORT the frontier seat authors those contracts FROM: where in the
existing client the surfaces belong, and which existing patterns they must
follow BY NAME.

FILES TO TOUCH:
- DELIVERY.md   (the report - this is the ONLY file you may create or modify)
Make NO changes to any other file, and NO git operations of any kind.

CHANGE:
Produce a REPORT ONLY. Read the client tree and answer each question below with
FILE:LINE evidence and short verbatim excerpts. Where the answer is "does not
exist", say so explicitly. Do not propose designs, do not pick a location, do
not write code - the frontier seat makes those calls. Facts and citations only.

Answer these, in this order, with a heading per section:

1. **Route map.** Every route in `client/src/App.jsx` (or wherever the router
   lives): path -> component -> file. One line each, with line numbers. Flag
   which routes are auth-gated and by what mechanism.

2. **The Profile / settings surface.** There is a profile hub (see
   `docs/tasks/n2-profile-hub.md`). Find it: which file, what sections it
   renders today, and what the markup/class idiom for a settings ROW is. Quote
   one complete existing settings row verbatim (JSX + the class names it uses),
   because any new consent toggle must match it.

3. **Existing toggle/switch controls.** Every reusable toggle, switch, or
   checkbox component in `client/src/components/`. For each: file, prop
   contract (exact prop names), and one call site. If the codebase has no
   reusable toggle and every screen hand-rolls one, say that plainly and show
   two examples of the hand-rolled idiom.

4. **Preference persistence patterns - the two kinds.**
   (a) DEVICE-LOCAL: list every module under `client/src/` that reads/writes
   localStorage (e.g. `weightUnitPref.js`, `effortSignalPref.js`,
   `quickWorkoutLogPrefs.js`). For each: file, exported function names, the
   exact storage KEY string, and the shape stored. Quote ONE such module in
   full - it is the pattern any new pref module would follow.
   (b) SERVER-PERSISTED: is there ANY user setting today that round-trips to
   the server rather than localStorage? If yes, trace it end to end (component
   -> api call -> route -> controller -> Prisma). If no, state that explicitly
   - it means a consent record is the first of its kind and there is no
   pattern to follow.

5. **The client API layer.** How does the client call the server - is there a
   central `api.js`/fetch wrapper? Quote it. How is the base URL resolved
   (`VITE_API_URL`?), how are credentials/cookies sent, and how are errors
   surfaced? Give file:line for each.

6. **Modal / dialog / sheet infrastructure.** Every modal, dialog, bottom-sheet
   or overlay component that exists, with its prop contract. A consent flow may
   need one. Note explicitly whether a toast/snackbar system exists (prior
   waves recorded that it does NOT - confirm or correct that against the tree).

7. **Copy constants.** Where does long-form product copy live today - inline in
   components, or in shared constant modules? Find every module that exports
   user-facing copy strings. Specifically locate the four known effort-copy
   variants of the "two sets of 10 can be worlds apart" sentence
   (`RirRpeToggleRow`'s nudge, `HOW_EFFORT_MATTERS`, `EFFORT_RATIONALE_SHORT`,
   `EFFORT_SIGNAL_REQUIRED_CHOICE_HINT`) and report which file each lives in.

8. **The "What's New" / release-notes surface.** Does it exist? Where, and how
   is content added to it? (A new user-visible AI feature would need an entry.)

9. **CSS token inventory for a new surface.** List the CSS custom properties
   defined in `client/src/index.css` that a new settings/consent surface would
   plausibly need - surfaces, borders, text, interactive, and any warn/danger
   token. Give the property name and its line number. Also confirm whether a
   `field-hint-warn` class exists and quote it.

10. **Anything already AI-shaped.** Grep the whole repo (client AND server) for
    `mcp`, `oauth`, `openai`, `anthropic`, `claude`, `coach`, `consent`,
    `entitle`. Report every hit with file:line, or state that there are none
    outside `docs/`. This exists to catch any half-built AI scaffolding nobody
    remembers.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain --untracked-files=all` is EMPTY when you finish
  (`DELIVERY.md` is gitignored). Paste the verbatim output in the report.
- All TEN numbered sections above are present as headings in DELIVERY.md, each
  with at least one `file:line` citation or an explicit "does not exist"
  statement.
- Section 4(a) quotes one complete localStorage pref module verbatim.
- Section 4(b) gives an unambiguous YES (with the end-to-end trace) or NO.
- Section 10 reports the grep results for all eight terms, each term named
  explicitly even when it has zero hits.
- Zero code changes; zero git commands other than the `git status` above.

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
