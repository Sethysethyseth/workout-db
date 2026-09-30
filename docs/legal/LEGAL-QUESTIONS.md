# LogChamp - legal briefing and open questions

> **Purpose:** a living document to hand to a lawyer. Part 1 says what the
> app does, from the code, so the lawyer isn't guessing. Part 2 is the
> running question log - anyone (Seth, an agent) appends questions here as
> the app grows. Part 3 tracks the draft privacy/ToS pages (unit BK0).
>
> **Status:** NOT legal advice; nothing here has been reviewed by a lawyer.
> No privacy policy or terms page is live yet. Last facts check against the
> code: Sept 29, 2026. When the app changes in a way that touches data
> (new provider, new stored field, new feature), update Part 1 and add a
> dated line to the change log at the bottom.

---

## Part 1 - What the app does (facts, not opinions)

**Product.** LogChamp: a weightlifting tracker for adults who lift, with an
analytics layer (volume, personal records, estimated 1RM, trends) and an AI
coach. Sole operator: Seth Knisel (operator legal entity: NOT YET DECIDED -
see Q1). Web app (React on Vercel), API (Express on Render), database
(PostgreSQL on Neon). Separate production and staging environments.

**Who the users are.** Public signup with email + password. No age gate or
age question exists today (see Q6). Users are not verified.

**Personal data stored on our servers** (Prisma schema):
- Account: email, optional display name, optional username, password hash.
- Training data: workouts, sets (weight, reps, effort), exercise notes,
  templates, training blocks and block runs, custom exercises, free-text
  notes on all of these.
- In-app feedback messages users send (category, message, page path, theme).
- AI records: consent (scope, granted/revoked timestamps, whether draft
  blocks are allowed) and a per-question coach usage log (user id +
  timestamp only, used for the 7-per-week hosted-coach cap - no question or
  answer text is stored).
- Session cookie `workoutdb.sid` (login session) and an optional JWT bearer.
- Not stored: payment details (there are no payments), precise location,
  device identifiers, coach conversation text.

**Stored only in the user's browser:** theme, palette, weight unit,
analytics range, and (if used) a bring-your-own Anthropic API key, kept in
`sessionStorage` (cleared when the tab closes) and sent to our server in a
request header only when the user asks the coach a question. The server
does not persist that key.

**AI features - the data flow.** Off until the user grants consent
(revocable). What leaves LogChamp for AI processing: a computed summary
(totals, trends, personal records, how complete effort data is). What does
not: individual sets, notes, account details. Processors: Anthropic (coach
via API), Cursor (hosted coach agent runtime), and WorkOS (AuthKit identity
for the Claude connector sign-in). The Claude connector lets a user's own
Claude read the same summary; an opt-in extension lets it create DRAFT
training blocks (create-only; never edits or deletes).

**Other third parties that see data:** Vercel (hosting/edge), Render (API
host and logs), Neon (database). Server logs include request metadata; we
have not audited exactly what personal data reaches Render logs (see Q9).

**Deletion today.** There is no in-app "delete my account". Deletion would
be a manual database operation by the operator. Cascading deletes exist on
the schema (deleting a user removes their sessions, templates, blocks,
feedback, consent and usage rows).

**No selling of data, no advertising, no analytics/tracking SDKs**
(none found in client or server code Sept 29 - re-verify before publishing).

---

## Part 2 - Open questions for a lawyer

> Add new questions at the bottom of the right section. Format:
> `Qn. [date, who] question - why it matters - status (OPEN / ANSWERED: ...)`.
> When a lawyer answers, record the answer and the date here; if the answer
> changes a page or a behavior, note the follow-up unit.

### A. Entity and liability
- **Q1.** [Sept 29] Should the operator be Seth personally, or should he form
  an LLC before publishing? The policy/ToS must name the operator, and a
  personal name means personal liability for a data incident or a claim
  from an injury. - OPEN
- **Q2.** [Sept 29] Which state's law should govern, and does that need to be
  where Seth lives or where the entity is registered? - OPEN

### B. Privacy law
- **Q3.** [Sept 29] At what size or user profile do CCPA/CPRA (California),
  other US state laws, or GDPR/UK GDPR start to apply to us, and what do we
  have to add at that point (data-request process, "do not sell" language,
  a DPO/representative, cross-border transfer terms)? We do not currently
  restrict signup by country. - OPEN
- **Q4.** [Sept 29] Is workout data "health data" under any law that applies
  (e.g. Washington My Health My Data Act, Nevada, GDPR special category)?
  It contains no diagnoses, but it includes training-around-injury notes
  that users may type freely. Does that change consent or storage duties? -
  OPEN
- **Q5.** [Sept 29] Deletion promise: is "email us and we delete within 30
  days" adequate while there is no in-app delete? What are we obliged to
  do about backups (Neon retains point-in-time backups) and about data
  already sent to Anthropic/Cursor? - OPEN
- **Q6.** [Sept 29] Minimum age. We have no age gate. Does COPPA (under 13)
  or a state teen-privacy law require one, and what wording/mechanism is
  enough for a fitness app? - OPEN
- **Q7.** [Sept 29] Breach notification: what are our obligations (timing,
  who to notify) if the database is exposed, and should we have a written
  incident process before launch? - OPEN

### C. AI-specific
- **Q8.** [Sept 29] Is our consent flow (plain-language facts, opt-in,
  revocable, separate opt-in for draft-block writes) enough disclosure for
  sending computed summaries to Anthropic/Cursor? Do we need signed
  data-processing agreements with them, and are their standard API terms
  sufficient? - OPEN
- **Q9.** [Sept 29] Logs: our host (Render) keeps server logs. If those can
  contain emails or user ids, do we need to disclose log retention, and
  should we scrub them? (Needs a technical audit first - engineering task.)
  - OPEN
- **Q10.** [Sept 29] AI output and liability: coach advice is informational.
  Is "not medical advice; consult a professional before training around an
  injury" in the ToS enough, or do we also need in-product warnings at the
  point of an answer? - OPEN
- **Q11.** [Sept 29] The Claude connector: does publishing an integration
  used through Anthropic's product put extra terms on us (Anthropic's
  connector/directory terms, WorkOS terms), and do those flow into our
  privacy policy? - OPEN

### D. Terms of service
- **Q12.** [Sept 29] Clickwrap vs browsewrap: should signup require an "I
  agree" checkbox to make the ToS enforceable, and should we re-prompt on
  material changes? Today there is no acceptance step. - OPEN
- **Q13.** [Sept 29] Limitation of liability, warranty disclaimer and
  arbitration/class-waiver clauses: which are enforceable in our state for a
  consumer app, and which are worth including? - OPEN
- **Q14.** [Sept 29] User content: users own their training data; what
  licence, if any, do we need to store/process it and to send summaries to
  AI providers, and can we use anonymised aggregates for product analytics
  or model/algorithm tuning? (We do not today.) - OPEN
- **Q15.** [Sept 29] Account termination and abuse: what grounds and process
  should the ToS state, and what happens to data on termination? - OPEN

### E. Future (park here so they aren't forgotten)
- **Q16.** [Sept 29] If we ever add payments/subscriptions: sales tax,
  auto-renewal disclosure laws, refund terms, card-data handling (via a
  processor). - PARKED
- **Q17.** [Sept 29] If we store coach conversation history (a user-requested
  feature is on the backlog): what changes in the privacy policy, retention
  and deletion duties? - PARKED (product decision first)
- **Q18.** [Sept 29] Trademark: is "LogChamp" clear to use and worth
  registering? (Also appears in `Rename boundary` history from
  "WorkoutDB".) - PARKED
- **Q19.** [Sept 29] Open-sourcing or publishing parts of the repo: licence
  choice and whether any data or prompts in it need scrubbing. - PARKED

---

## Part 3 - Draft page status (unit BK0)

- Unit: `docs/tasks/bk0-privacy-terms-pages.md` - DRAFT, blocked on facts.
- Decided Sept 29 (Seth, defaults to critique later): deletion = email us,
  deleted within 30 days; effective date = go-live date; contact = a
  dedicated address, not personal Gmail.
- Still needed: operator name (depends on Q1), actual contact email, US
  state (Q2).
- **Accuracy flag before BK0 is dispatched:** the BK0 block says
  "bring-your-own keys encrypted at rest and never shown again". The code
  does not do that: the BYO key lives in the browser's `sessionStorage`
  and is sent per request; the server stores no user API key. The block
  and the policy text must describe what actually happens (see Part 1) or
  be changed to match a real design. A privacy policy that overstates
  security is itself a legal risk.
- Suggested flow: Cursor drafts the two pages from Part 1 -> Seth reads ->
  lawyer reviews the drafts together with this file -> publish.

---

## Change log

- Sept 29, 2026 - file created from a code check (schema, consent facts,
  BYO-key storage). Q1-Q19 opened.
