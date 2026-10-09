# Session Detail Smoke-Test Critique

On-device smoke shot of a **completed one-time (quick-log) session summary** on
mobile. Seth submitted this via Cursor chat on **July 4, 2026** for Claude Code
review. The cloud agent could not persist the chat attachment as a binary PNG in
this environment; the full visual inventory is archived below so Claude can
review without the original pixels. If Seth still has the file locally, drop it
at:

`docs/smoke-tests/images/session-detail-completed-quick-log-mobile.png`

and uncomment the image embed in the Shots section.

## How to use (for Claude Code)

1. Read the shot inventory below (or open the PNG if Seth added it).
2. Judge against the checklist, not vibes. Note anything that reads as a bug vs.
   a taste call.
3. Write findings under the shot: what works, what's off, and a concrete fix
   (token/value/layout change) if there is one. Display-layer only - no
   infra/env/route renames (see AGENTS.md rename boundary).
4. If Seth's intent was a specific critique he did not type out, ask him - this
   submission was image-only.

## Checklist

- Completed quick-log summary reads as **read-only history**, not an editable live
  log (no affordances that invite mid-session edits).
- Exercise cards: hierarchy, spacing, and field labels feel intentional on a
  narrow viewport.
- One-time session footnote is visible and not redundant with the page subtitle.
- Bottom tab bar + any floating controls do not obscure primary content.
- Tokens-only: no hardcoded colors; palette x dark mode both acceptable.
- Set rows: weight/reps presentation is scannable at a glance.

---

## Shots

### Completed quick-log summary - mobile - History tab

<!-- Uncomment after PNG is added:
![completed quick-log session detail](./images/session-detail-completed-quick-log-mobile.png)
-->

- **Route:** Session detail (`SessionDetailPage`) - completed quick log
- **Page title (expected):** "Workout summary" with subtitle "Read-only · … ·
  finished {date}"
- **Footnote visible:** "One-time session—saved in History only, not as a
  reusable workout."
- **Bottom nav:** History tab active (post N-wave bottom tab bar)
- **Palette / theme:** Dark mode, navy card surfaces (likely champ or iron)
- **Source:** Seth on-device, July 4, 2026 (ui-nav-overhaul era deploy)
- **Critique:** PENDING

#### Visual inventory (from submitted screenshot)

**Header / chrome**

- System status bar (7:16, LTE, 42% battery).
- Page shows the one-time session footnote banner near the top.

**Workout name**

- Label: "Name"
- Read-only field value: **Push Day**

**Exercise 1 - Bench press**

- Card header: "Bench press · 1 set" (+ status dot icon)
- Fields: Exercise name = "Bench press"; Notes (optional) = "—"
- Set 1: Weight **200**, Reps **10**

**Exercise 2 - custom name**

- Card header: "Hsusyehjdjs · 1 set"
- Exercise name = "Hsusyehjdjs" (looks like free-typed / gibberish test entry)
- Notes = "—"
- Set 1: Weight **100**, Reps **10**
- Small FAB on the right edge of the card (list/filter icon)

**Exercise 3**

- Card header: "Exercise 3 · 0 sets"
- Exercise name field visible but empty (placeholder exercise with no sets)

**Bottom navigation (N-wave)**

- Home | Analytics | **History** (active) | Library | Profile

#### Code pointers

- Footnote copy: `SessionDetailPage.jsx` (`isCompleted && isQuickLog` branch)
- Completed layout: read-only `session-log-workout-form` card +
  `session-completed-blocks`
- Live vs completed styling: `.session-detail-page` vs
  `.session-detail-page--live`
