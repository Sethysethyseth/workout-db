# DELIVERY — sr3-d1: DIAGNOSIS — builder "+ Add exercise" first-open wrong

MODE: diagnosis only. No source edits. No git operations.

## Files touched

- `DELIVERY.md` (this report) only.

## Reproduced vs inferred (explicit)

| Claim | Status |
| --- | --- |
| Seth's staging Android Chrome screenshot: header "ADD EXERCISE" sits on the soft keyboard; builder still visible above; no search/list | **Observed** (read `claudefiledrop/smoke-r3-add-exercise-first-open.png`) |
| Empty open collapses the picker sheet to ~header + search (no tall list band) | **Proved from CSS/DOM** (rules below); not measured in a browser this session |
| Autofocus opens the soft keyboard on open | **Proved from code** (`autoFocus`, 30ms `focus()`, `BuilderSheet` focus effect) |
| Keyboard overlays the short bottom sheet so only the header peeks above it | **Inferred** from screenshot + bottom-anchored `position: fixed` sheet + viewport meta with no `interactive-widget` |
| Second open looks normal | **Inferred** (Android cold vs warm keyboard / visualViewport pan); code path is the same every open |
| Soft-keyboard timing on desktop Chromium | **Not reproduced** (no Android soft keyboard here; no local mobile smoke run) |

## Lanes run

None required beyond reading code + the smoke screenshot. No `test:unit` / client build for a report-only diagnosis. `git status` checked for the acceptance criterion only (no commit/push).

---

## 1. Root cause

**Collapsed empty picker + immediate search focus under an overlay keyboard.**

Mechanism, in order:

1. `BlockBuilder` opens the shared picker (`pickerOpen` → `<ExercisePicker open={...} />`) at `BlockBuilder.jsx:1264-1266` from `+ Add exercise` (`BlockBuilder.jsx:1123-1130`).
2. `BuilderSheet` unmounts its DOM while closed (`BuilderSheet.jsx:84` `if (!open) return null`), so every open is a fresh panel. Phone sheet is bottom-anchored (`bk-builder.css:852-858` `.bk-sheet { position: fixed; inset: 0; align-items: flex-end }`).
3. The picker panel only gets a **max**-height, never a height/min-height: `bk-builder.css:798-800` (`.bk-sheet--picker .bk-sheet__panel { max-height: min(88vh, 720px); }`) and the shared panel rule at `bk-builder.css:875`. With an empty query, `ExercisePicker` renders no rows (`ExercisePicker.jsx:103`, `136-170` — no fetch until `query.trim()` is non-empty, `ExercisePicker.jsx:42-44`). `.bk-picker__list { min-height: 60% }` (`bk-builder.css:830-838`) cannot resolve against an indefinite parent height, so the list contributes ~0. The open sheet is only **header + search** tall — matching the screenshot's thin strip over the keyboard with the builder still filling most of the screen.
4. On that same open, the search field is focused three ways: `autoFocus={open}` (`ExercisePicker.jsx:133`), a 30ms `searchRef.focus()` (`ExercisePicker.jsx:31-37`), and `BuilderSheet`'s open effect which focuses the first `input, textarea, button, ...` in the panel (`BuilderSheet.jsx:76-82`) — DOM order hits the close **button** first (`BuilderSheet.jsx:107-114` before the body input), then the 30ms timer wins and focuses search. Soft keyboard comes up.
5. `client/index.html:7` viewport meta is `width=device-width, initial-scale=1.0, viewport-fit=cover` — **no** `interactive-widget=resizes-content`. Default Android Chrome behavior leaves the layout viewport (and bottom-fixed UI) in place while the keyboard overlays. Search sits immediately under the header in the short sheet → under the keyboard. Only the header remains visible. Exact smoke symptom.

Why first-open-only / second open fine (inferred, not re-smoked): each open remounts the same empty UI (no cached list, no measured height retained). The difference is environmental: first cold keyboard overlay often fails to pan a short `position: fixed` bottom sheet; a second open after dismiss usually gets a warm keyboard / visualViewport adjustment that keeps the focused search on-screen. Code does not special-case open #2.

---

## 2. Evidence

**Read**

- Screenshot: `claudefiledrop/smoke-r3-add-exercise-first-open.png` — header on keyboard, builder chrome above, no search/list.
- `ExercisePicker.jsx` — open/focus/search/empty-results behavior (lines cited above).
- `BuilderSheet.jsx` — bottom sheet shell, focus-on-open, `return null` when closed.
- `BlockBuilder.jsx` — `pickerOpen` wiring; `bk-builder-kbd` only hides bottom nav / week strip on input focus (`BlockBuilder.jsx:220-249`, `bk-builder.css:13-25`), does **not** reposition sheets.
- `bk-builder.css` — picker/sheet sizing (`798-842`, `852-885`, `1009-1015`, `1040-1048`).
- `client/index.html:7` — viewport meta; no `interactive-widget`.
- Smoke note: `docs/tasks/bk-smoke-FINDINGS.md` Smoke round 3 item 2.

**Proved**

- Empty first paint has no list rows and does not fetch.
- Sheet height is content-driven under a max-height only; intended “≥60% list” cannot inflate an auto-height panel.
- Search is programmatically focused on every open.

**Inferred**

- Overlay keyboard covering search on Android Chrome (screenshot + viewport defaults).
- Why open #2 recovers (platform pan / warm keyboard), not a second code path.

**Not run**

- Local `npm run dev` mobile-emulation smoke (would not produce a real soft keyboard; `client/.env` absent here so API would default to localhost, but keyboard geometry is the missing piece).

---

## 3. Blast radius

| Surface | Shares mechanism? | Likely same symptom? |
| --- | --- | --- |
| Block builder `ExercisePicker` (add + replace) | Yes — the reported path | Yes (Android Chrome) |
| Import preview `ExercisePicker` (`ImportPreviewStep.jsx:372`) | Same component/CSS/focus | Yes on phone |
| Other `BuilderSheet`s (settings, week/day actions, exercise setting/actions) | Same bottom sheet + `88vh` max-height | **No** for this exact bug — they are not empty-list collapsed + forced search autofocus. Week label input can open the keyboard only after the user focuses it; sheet usually already has more content height. |
| Logger add-exercise / `ExercisePickerSuggestions` / `AddExerciseToLibrarySheet` | **Different** components/CSS | Not this bug. Logger has its own `visualViewport` + `bk-log-kbd` handling (`SessionDetailPage.jsx:2463-2512`); library sheet is separate (`add-exercise-library-sheet*` in `index.css`). |
| Legacy `WorkoutBuilder` “+ Add exercise” | Inline insert, no `ExercisePicker` | No |

---

## 4. Smallest correct fix (described, not applied)

**Primary (fixes the exact geometry):** give the picker panel a definite height so the empty state is a tall sheet and search stays in the upper band above an overlay keyboard.

- File: `client/src/styles/blocks/bk-builder.css`
- Change `.bk-sheet--picker .bk-sheet__panel` from max-height-only to something like `height: min(88dvh, 720px); max-height: min(88dvh, 720px);` (keep width/radius rules). That lets `.bk-picker__list { min-height: 60% }` resolve as the comment at `bk-builder.css:797` already intended.

**Hardening (small, same unit):**

- `ExercisePicker.jsx`: drop redundant `autoFocus={open}`; delay `searchRef.focus()` until after the 180ms sheet animation (or after a `visualViewport` resize settle), so focus/keyboard land on the final layout.
- `BuilderSheet.jsx:76-82`: stop focusing the close button ahead of the search input (e.g. prefer `input, textarea` first, or accept a `initialFocusRef`) — removes the focus fight on open.

**Do not lead with** a global `interactive-widget=resizes-content` on `client/index.html` unless smoked across logger + builder; broader blast radius. Optional follow-up after the picker height fix.

---

## Acceptance criteria

| Criterion | Evidence |
| --- | --- |
| `git status` shows no changes except untracked/ignored `DELIVERY.md` | `git status --porcelain` → `?? claudefiledrop/smoke-r3-add-exercise-first-open.png` only; `DELIVERY.md` is gitignored (`gitignore:48`). No source edits. |
| Four numbered sections; root-cause claims anchored to file:line on this branch | Sections 1–4 above |
| Report states reproduced vs inferred | Table under “Reproduced vs inferred” |

## Deviations

None from the diagnosis block. Soft-keyboard half of the symptom was not re-created locally; root cause ties the screenshot to code/CSS as required.
