# TASK qol10: Coach history - conversations saved, browsable in Library under Coach, continue or delete

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth, Sept 29: there is no way to view past coach conversations. He ruled
on Oct 8 (`docs/specs/quality-of-life-wave.md` ruling 5): save them, show
them in Library under a new Coach tab, and keep them until the user
deletes them (delete-one and delete-all).

Tables from qol1, applied to staging before this unit dispatches:
`CoachConversation` (`userId`, `title`, `focus` Json, timestamps) and
`CoachMessage` (`conversationId`, `role` "user" | "coach", `content`).

The ask path:
- `POST /coach/ask` streams SSE (`server/src/controllers/coachController.js`
  ~260-410, marker stripping and refunds ~338-407).
- The client sends history itself, up to 12 turns
  (`server/src/coach/coachRequest.js`).

qol6 added the `/coach` page and the `help` / `general` focus types. This
is a CROSS-USER ISOLATION surface (standing frontier escalation): every
query is owner-scoped in its WHERE clause.

FILES TO TOUCH:
- server/src/coach/conversationStore.js        (new - Prisma access)
- server/src/coach/conversationTitle.js        (new, pure)
- server/test/lib/coachConversationTitle.test.js (new)
- server/src/coach/coachRequest.js             (optional `conversationId`)
- server/src/controllers/coachController.js    (ask persistence + 4 handlers)
- server/src/routes/coachRoutes.js
- client/src/api/coachApi.js
- client/src/components/coach/CoachPanel.jsx
- client/src/pages/CoachPage.jsx
- client/src/components/library/CoachConversationList.jsx (new)
- client/src/pages/MyTemplatesPage.jsx         (a fourth tab)
- client/src/pages/profile/AiConnectorPage.jsx (one sentence)
- client/src/styles/coach-history.css          (new)
Do NOT modify anything outside these files.

CHANGE:
**Server**
1. **`conversationTitle.js`** exports `deriveConversationTitle(question)`:
   the question trimmed and whitespace-collapsed, cut at a word boundary
   to at most 80 characters, with "..." when cut. An empty input gives
   "Coach conversation".
2. **`coachRequest.js`** accepts an optional `conversationId` (a positive
   integer) on asks.
3. **Persistence on `POST /coach/ask`.** After the stream completes
   SUCCESSFULLY:
   - Store the user's question and the final coach answer (marker
     stripped, exactly as streamed to the client) as two `CoachMessage`
     rows, then bump the conversation's `updatedAt`.
   - With no `conversationId`: create the conversation at that moment,
     with `title = deriveConversationTitle(question)` and `focus` = the
     validated focus.
   - With a `conversationId` that is not this user's: 404 BEFORE any
     provider call.
   - Off-topic declines are stored like any answer. Errored or aborted
     streams store nothing.
   - Before `done`, emit one SSE event, `event: meta` with data
     `{"conversationId": <id>}`. The client keeps it for follow-ups.
   - Every focus type persists, `help` included (it is user-owned
     content).
4. **Routes** (all owner-scoped in the WHERE clause; another user's id
   returns 404):
   - `GET /coach/conversations?before=<iso>` lists newest `updatedAt`
     first, 20 per page: `{ items: [{ id, title, focusType, updatedAt,
     messageCount }], nextBefore }`.
   - `GET /coach/conversations/:id` returns `{ id, title, focus,
     messages: [{ role, content, createdAt }] }` oldest first.
   - `DELETE /coach/conversations/:id` returns 204.
   - `DELETE /coach/conversations` deletes ALL of this user's
     conversations and returns 204.
   - These routes do NOT require AI consent. They read the user's own
     stored text and make no provider call.

**Client**
5. **`CoachPanel` / `CoachPage`**
   - `CoachPanel` stores `conversationId` from the `meta` event and sends
     it on follow-ups.
   - `CoachPage` accepts `?c=<id>`: it loads that conversation and renders
     its messages, the composer continues it, and the last 12 turns go as
     history.
   - The `CoachPage` header gets a "New conversation" action that clears
     the thread and the id.
6. **Library tab.** `MyTemplatesPage` gets a fourth type tab, "Coach",
   after Exercises, in the yours area only. It renders
   `CoachConversationList`:
   - Each row shows the title, a relative date, and a context label from
     `focusType`: "Analytics", "Workout debrief", "Block", "Help",
     "General".
   - Tapping a row opens `/coach?c=<id>`. Each row's "..." offers Delete
     via `ConfirmPanel` (qol4): "Delete this conversation?" / "Delete" /
     "Keep".
   - The list footer has "Delete all conversations" (`ConfirmPanel`,
     danger): "Delete all coach conversations?" / "Delete all" / "Keep".
   - Load more pages as the user scrolls.
   - Empty state: "Your coach conversations show up here." plus an "Ask
     the coach" button leading to `/coach`.
   - The tab loads independently, the same as qol8's per-tab loading.
   - **This surface's one memorable element is the list's typographic
     rhythm** (title weight vs. quiet meta). No cards-in-cards.
7. **`AiConnectorPage`:** one sentence in the coach section: "Your coach
   conversations are saved to your account. Find or delete them in
   Library, under Coach."
8. Styles go in `coach-history.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- `npm run test:unit` green from `server/`, with title tests:
  - 120-character question -> at most 80 characters plus "...", ending on
    a word boundary
  - `"  how   do I  "` -> "how do I"
  - `""` -> "Coach conversation"
- Client `npm run build` clean. `node scripts/check-hex.mjs` passes.
- `grep -n "where" server/src/coach/conversationStore.js`: every query
  includes `userId`. Quote them.
- Live checks the reviewer runs (mock coach, two staging accounts):
  - an ask creates a conversation and the stream carries `meta`
  - a follow-up with that id appends rather than creating a new one
  - the Library Coach tab lists it, and the row reopens and continues it
  - user B's GET, DELETE and ask with user A's `conversationId` all 404
  - delete-all empties the list

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
