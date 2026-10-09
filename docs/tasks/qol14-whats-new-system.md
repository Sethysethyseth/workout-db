# TASK qol14: What's New - concise first, in depth on demand, latest update card on Profile, staging preview

STATUS: QUEUED
MODEL: auto
MODE: 1-relay

CONTEXT:
Seth's ask 2: describe what's new concisely, give users the option of a
more in-depth look, and let the most recent update live on Profile so it
can be read (and used as a guide) any time. This unit builds the DISPLAY
side.

The content pipeline (a ledger file plus a What's New Cursor lane) is
process, defined in `docs/specs/quality-of-life-wave.md` section 4. qol15
writes the first content through it.

Today:
- `RELEASES` in `client/src/data/whatsNew.js` has the shape `id`, `date`,
  `title`, an optional `tagline`, and `sections: [{ heading, items }]`.
- `WhatsNewContent` renders every section open.
- The modal shows the latest release once per device (`WhatsNewGate`,
  `whatsNewStorage.js`).
- `WhatsNewPage` (`/profile/whats-new`) lists every release fully open.
- A plain "What's new" link row sits on Profile.
- ALL of it is prod-only via `isProdEnv()` (Seth's July 10 ruling - keep
  it).

Recon: `docs/tasks/qol-r2-...-FINDINGS.md` section B. Design rules: spec
section 2.

FILES TO TOUCH:
- client/src/data/whatsNew.js           (header comment documents the new
                                         optional field; NO content changes)
- client/src/components/whatsnew/WhatsNewContent.jsx
- client/src/components/whatsnew/WhatsNewModal.jsx
- client/src/components/whatsnew/LatestUpdateCard.jsx  (new)
- client/src/pages/profile/WhatsNewPage.jsx
- client/src/pages/ProfilePage.jsx
- client/src/lib/appEnv.js              (a preview helper)
- client/src/styles/whats-new.css       (new)
Do NOT modify anything outside these files. Do not edit `.whats-new-*`
rules in `index.css`; override or extend them from the new file if needed.

CHANGE:
1. **Shape.** Each release gains an optional in-depth layer:
   `details: [{ heading, body: string[], where?: string }]`. `body` holds
   short paragraphs. `where` is a plain tap path such as "Profile, then
   Training".
   - Existing `sections` remain the CONCISE layer: 5 bullets or fewer
     across the release. Document this in the header comment, including
     the plain-language copy rule already there.
   - Releases without `details` render exactly as today.
2. **`WhatsNewContent`** renders the concise sections first. When
   `details` exist, a "See the details" disclosure follows. Reuse the
   `Disclosure` primitive from `components/blocks/ui`, or match its
   behavior and a11y. Expanded, each detail shows its heading, its
   paragraphs, and, when `where` is set, one quiet line, "Where to find
   it: Profile, then Training". The expand animation follows the spec's
   motion rule.
3. **Modal:** concise only. When the latest release has `details`, add a
   secondary "See the details" button that saves the seen id (as dismiss
   does) and navigates to `/profile/whats-new#<id>`. The primary is "Got
   it".
4. **`WhatsNewPage`**
   - The latest release is at the top: title, date, tagline, concise
     sections, and its details disclosure.
   - Older releases follow as collapsed rows (title + date) that expand
     in place.
   - A `#<id>` hash scrolls to and expands that release.
   - **The one memorable element is the latest release's title set
     large** with the date quiet beside it - a page that reads like a
     short note from the team, not a changelog dump.
5. **`LatestUpdateCard` on Profile** replaces the plain "What's new" link
   row and sits directly under the stats tiles. It shows:
   - the latest release's title
   - its date
   - its tagline, if any
   - a "See what's new" action leading to the page

   It is quiet: no accent fill and no `card--live`. It stays prod-gated.
6. **Staging preview** (Seth smokes the copy without breaking the
   prod-only ruling). `appEnv.js` gains `isWhatsNewPreview(search)`: true
   when NOT prod and the URL has `preview=1`.
   - `/profile/whats-new?preview=1` renders off-prod, with one small note
     at the top: "Preview. Only visible on staging."
   - `/profile?preview=1` shows the card off-prod.
   - Without the param, off-prod behavior is unchanged (redirect / hidden).
   - The MODAL stays strictly prod-only, with no preview path.
   - In preview, nothing writes the seen id.
7. Styles go in `whats-new.css`, tokens only.

ACCEPTANCE CRITERIA (machine-checkable):
- Client `npm run build` clean. `npm run test:unit` green from `server/`.
- `node scripts/check-hex.mjs` passes.
- `whatsNew.js` diff touches ONLY the header comment (no `RELEASES` content
  change) - quote the diff stat.
- `WhatsNewGate.jsx` still returns null off-prod and has no preview path
  (grep `isProdEnv` there, unchanged).
- Real-app items for the reviewer (local client against the staging API =
  off-prod):
  - `/profile/whats-new` redirects to `/profile`
  - `/profile/whats-new?preview=1` renders with the preview note
  - a release with no `details` shows no disclosure
  - `/profile?preview=1` shows the Latest update card
  - the modal never appears off-prod
  - to test a release with `details`, temporarily add one in local devtools
    or a scratch copy - never commit content

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
