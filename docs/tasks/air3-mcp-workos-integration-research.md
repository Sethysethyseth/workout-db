# TASK AIR3: RECON (REPORT ONLY) - how to actually build a remote MCP server on Express, and what WorkOS Standalone Connect concretely requires

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Authoring recon for the AI connector wave (`docs/specs/ai-layer.md`). The AI0
decision is made: OAuth layered OVER LogChamp's existing cookie/JWT auth,
connector-only, zero user migration, delegated to a vendor - WorkOS Standalone
Connect ranked 1 by `docs/tasks/ai0-recon-oauth-delegation-FINDINGS.md`
(August 2, 2026). What is NOT known is the concrete build: which packages,
which endpoints, which env vars, which dashboard settings, and what the MCP
transport actually looks like on an Express app in 2026. This block answers
that with sourced specifics so the wave's contracts can name real packages and
real endpoints instead of hand-waving.

This is a WEB RESEARCH block. The repo is context, not the subject.

FILES TO TOUCH:
- DELIVERY.md   (the report - this is the ONLY file you may create or modify)
Make NO changes to any other file, and NO git operations of any kind.
Do NOT install any package. Do NOT modify `server/package.json`.

CHANGE:
Produce a REPORT ONLY. Research the web and answer each question below.
**Every factual claim needs a source URL and the date you accessed it.**
Where a source is ambiguous or you could not confirm something, write
UNCONFIRMED explicitly rather than filling the gap - an unconfirmed answer that
says so is useful; a confident wrong one costs a wave. Prefer official docs
(modelcontextprotocol.io, workos.com/docs, npmjs.com) over blog posts.

Answer these, in this order, with a heading per section:

1. **Current MCP specification revision.** What is the LATEST published
   revision of the Model Context Protocol specification as of today, and what
   is the latest AUTHORIZATION spec revision? Give the URLs. If it is newer
   than `2025-11-25`, summarize every change to the authorization requirements
   since that revision - the LogChamp spec is written against 2025-11-25 and
   needs to know if it has drifted.

2. **Remote MCP server transport.** For a remote (not stdio) MCP server, what
   transport is current - "Streamable HTTP", SSE, or something newer? What HTTP
   endpoints must the server expose, what methods, and what headers matter
   (session ids, protocol version, content types)? Cite the spec page.

3. **The official Node/TypeScript SDK.** Exact npm package name, current
   version, last publish date, and weekly downloads. Show a MINIMAL but
   COMPLETE code example of mounting a remote MCP server with two read-only
   tools onto an EXISTING Express app - taken from or adapted from official
   docs, with the source URL. State clearly whether the SDK is ESM-only,
   CommonJS, or dual, and what minimum Node version it requires. (LogChamp's
   server is Express + Node; check `server/package.json` for its module type
   and engines field and report what you find, so any mismatch is visible now.)

4. **Tool definition shape.** How a tool's name, description, and input schema
   are declared in that SDK, and how a tool returns structured content. Show
   one real tool definition. Note whether output schemas are supported.

5. **The resource-server duties.** Concretely, for `/.well-known/
   oauth-protected-resource` (RFC 9728): the exact JSON fields, with an example
   document. And the exact `WWW-Authenticate` header string an MCP server must
   return on a 401. Cite the spec.

6. **Audience / resource binding.** How RFC 8707 resource indicators show up in
   practice: what the client sends, what the token carries, and what the server
   must verify. What does a correct `aud` check look like in Node?

7. **WorkOS Standalone Connect - the concrete integration.** From
   `workos.com/docs` (start at `/authkit/connect/standalone` and the MCP
   guide): the FULL step list to stand this up. Specifically:
   - Which WorkOS npm package, its version and last publish date.
   - The exact "Login URI" contract: what WorkOS sends us (query params -
     name them), what we must do, and the exact completion API call we make
     back (method, endpoint, body fields, response). Quote the docs.
   - Which env vars / credentials are needed (API key, client id, etc.) and
     which are secret.
   - Which settings are configured in the WorkOS DASHBOARD rather than in
     code - enumerate them, because those are a human's manual steps.
   - Where the JWKS lives and how a token is verified against it in Node.
   - Whether staging/dev environments are separate and free.
   - Whether CIMD and DCR are each supported, and whether either needs a
     dashboard toggle.

8. **Scalekit, the ranked-2 fallback.** The same integration outline, briefer -
   enough to judge switching cost if WorkOS disappoints. Package name, the
   BYOA login-completion call, dashboard steps, free tier.

9. **How Claude and ChatGPT actually add a custom connector in 2026.** What the
   user does in the UI, what URL they paste, which plan tiers can do it, and
   any limits (tool count, response size, timeouts). Cite Anthropic and OpenAI
   docs. Note explicitly if custom connectors are unavailable on any consumer
   tier - that would change who the feature is for.

10. **Known failure modes.** Search for real reports of people building remote
    MCP servers with OAuth: the top recurring problems (redirect URI mismatch,
    aud rejection, DCR refusal, CORS, session handling, tool description
    limits). List them with sources. This section is the point of the whole
    block - it is cheaper to read about a trap than to hit it.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain --untracked-files=all` is EMPTY when you finish
  (`DELIVERY.md` is gitignored). Paste the verbatim output in the report.
- All TEN numbered sections present as headings in DELIVERY.md.
- EVERY factual claim carries an inline source URL, and the report states one
  access date at the top.
- Section 3 contains a complete, runnable-shaped Express mounting example and
  names the exact npm package + version + last publish date.
- Section 7 lists the WorkOS dashboard steps as an explicit enumerated list of
  HUMAN actions, separate from the code steps.
- Anything not confirmable is marked UNCONFIRMED in place, and a "Not
  confirmed" list appears at the end of the report collecting them.
- Zero code changes, zero package installs; zero git commands other than the
  `git status` above.

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
