# TASK bkr-d2: DIAGNOSIS - "Draft with the coach" sits on "Drafting..." forever

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
BK smoke round 2 (Oct 5, `docs/tasks/bk-smoke-FINDINGS.md`). Seth, on a NEW
block, typed a description into "Describe the block you want" and tapped
"Draft with the coach": the button read "Drafting..." and nothing else ever
happened. Staging (hosted Anthropic key, Render) holds `CoachUsage` rows for
his account at 2026-10-06 00:37Z and 01:30Z, so a use was likely charged for
a draft he never received. This is a DIAGNOSIS block - report only.

FILES TO TOUCH:
- DELIVERY.md (repo root, the report) - NOTHING else.
Do NOT modify any source file.

CHANGE:
Trace, make NO code changes. Path: `CoachDraftCard.jsx` -> `coachBlockDraft`
(`client/src/api/coachApi.js`, `client/src/api/http.js`) -> `POST
/coach/block-draft` -> `draftBlock` in
`server/src/controllers/coachController.js` (mode "generate") ->
`completeAnthropic` / provider code under `server/src/coach/` ->
`validateBlockDraft`. Answer:
1. Worst-case duration of a "generate" call: max output tokens, effort
   setting, model, and any server/client/fetch timeout on each hop (client
   fetch, Express, the provider fetch). Is there ANY timeout? What does the
   client show if the request never resolves?
2. What happens to the `CoachUsage` row when (a) the provider is slow and
   the phone gives up / the tab sleeps / the user navigates away, (b) the
   provider errors, (c) validation rejects the draft, (d) the response
   arrives after the client unmounted `CoachDraftCard`. Cite
   `removeUsageRow` and every path that does or does not call it.
3. On success, what `onDrafted` does with the result - could a draft
   arrive but render nothing (e.g. the builder ignores it after a state
   change)?
4. Most likely root cause of Seth's exact symptom, with file:line evidence,
   ranked if more than one is plausible.
5. Smallest correct fix, as prose plus a sketch (not applied): timeouts,
   refund-on-abort rules, and what the user should see at each stage.
   Note any overlap with a shared AI-loader component (a separate unit,
   bkr1, adds one) so the fix can plug into it.

ACCEPTANCE CRITERIA (machine-checkable):
- `git status --porcelain` shows no change except the untracked DELIVERY.md.
- DELIVERY.md gives a number (seconds or "none") for the timeout on each hop.
- DELIVERY.md lists cases (a)-(d) with "refunded" / "charged" for each and a
  file:line for each claim.

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
