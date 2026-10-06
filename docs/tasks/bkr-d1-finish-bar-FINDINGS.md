# DELIVERY — bkr-d1 DIAGNOSIS: "Finish workout" bar disappears during a block workout

MODE: diagnosis only (no source edits)

## 1. Root cause

**Hide/show condition (file:line + quote)**

`html.bk-log-kbd` is toggled from the live-block keyboard effect in
`client/src/pages/SessionDetailPage.jsx`, and CSS uses that class to unmount the
Finish dock from layout via `display: none`:

```2468:2478:client/src/pages/SessionDetailPage.jsx
    function onFocusIn(e) {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") return;
      document.documentElement.classList.add("bk-log-kbd");
    }
    function onFocusOut() {
      // Defer so focus moving between fields does not flicker the chrome.
      requestAnimationFrame(() => {
        if (isLoggerField(document.activeElement)) return;
        document.documentElement.classList.remove("bk-log-kbd");
      });
    }
```

```587:591:client/src/styles/blocks/bk-log.css
/* Phone keyboard: hide every fixed bottom overlay while typing. */
html.bk-log-kbd .bottom-nav,
html.bk-log-kbd .persistent-workout-bar-wrap,
html.bk-log-kbd .session-finish-dock {
  display: none !important;
}
```

The dock itself is always mounted for any incomplete session (`SessionDetailPage.jsx:3819-3820`);
it is not conditionally unrendered by React for block vs quick-log. The only
hide path that matches "gone, then back after a touch" is this CSS class.

**Mechanism**

1. Gate: effect runs only when `liveBlockDay` is true
   (`session && !session.completedAt && session.blockContext`,
   `SessionDetailPage.jsx:2443`, effect at `:2458-2491`).
2. Any `focusin` on an `INPUT`/`TEXTAREA` adds `bk-log-kbd` on `<html>`.
3. CSS then forces `.session-finish-dock { display: none !important; }`.
4. Class is removed only on `focusout`, and only if after one rAF the
   `activeElement` is no longer a logger field inside
   `.session-detail-page--block`. There is **no** `visualViewport` listener
   that clears the class when the soft keyboard closes.

**Why this matches the exact symptom (gone without touch; back after touch)**

On iOS Safari, dismissing the soft keyboard (scroll, viewport chrome, tapping
outside the keypad accessory) often leaves focus on the input — **no `blur` /
`focusout`**. The Finish dock stays hidden even though the keyboard is gone.
A later touch on non-field workout chrome blurs the field → `focusout` →
`bk-log-kbd` removed → dock returns. That is exactly Seth's report.

This hide was intentional (bksf1a / critic R1 P1-2: dock covered the field under
a simulated keypad). The bug is that hide is keyed to **focus**, not to
**keyboard geometry**, so sticky focus after the keypad closes leaves Finish
missing.

`html.bk-log-focus` (`:2447-2456` + CSS `:581-584`) only hides bottom nav +
persistent Resume bar; it does **not** hide the Finish dock.

## 2. Event order for the reported sequence

| Step | User / system | What toggles | Finish dock |
|------|---------------|--------------|-------------|
| 1. Open block day | navigate to live block session | `liveBlockDay` true → add `bk-log-focus`; mount `.session-finish-dock` | **visible** |
| 2. Tap a set / note field | `focusin` on INPUT/TEXTAREA | add `bk-log-kbd` | **hidden** (`display:none`) |
| 3. Soft keyboard closes without blur (scroll / iOS dismiss / leave caret in field) | no `focusout` | `bk-log-kbd` **sticks** | **stays hidden** ← reported "gone" |
| 4. Touch the workout (non-field) | blur → `focusout` → rAF | remove `bk-log-kbd` | **visible again** |

If the user never focuses a field, the dock should stay visible on open. The
failure mode starts at first field focus and becomes a P1 when focus sticks
after the keypad is gone.

## 3. Quick-log / saved-workout — shared cause?

**No.** Same Finish dock markup (`!isCompleted` → `.session-finish-dock`), but:

- `liveBlockDay` requires `session.blockContext` (`:2443`).
- Quick-log (`isQuickLog`, `:3143`) and template/saved workouts without
  `blockContext` never install the focusin/focusout listeners and never get
  `bk-log-kbd`.
- Builder uses a sibling pattern (`bk-builder-kbd`) that hides nav / in-progress
  bar only — **not** `.session-finish-dock` (`bk-builder.css:14-16`).

So Seth not seeing this on normal quick-log is expected: the hide CSS never
applies there.

## 4. Blast radius — what else reads the same state

| Consumer | Effect when `bk-log-kbd` is on |
|----------|--------------------------------|
| `html.bk-log-kbd .session-finish-dock` | Finish bar hidden (the bug surface) |
| `html.bk-log-kbd .bottom-nav` | Bottom nav hidden (already also hidden by `bk-log-focus` on live block days) |
| `html.bk-log-kbd .persistent-workout-bar-wrap` | Resume bar hidden (already hidden by `bk-log-focus`) |
| `html.bk-log-kbd` / `body` scroll-padding (`bk-log.css:594-597`) | Extra bottom scroll padding while class is set |

Writer of the class: only the `liveBlockDay` effect in `SessionDetailPage.jsx`
(`:2471`, `:2477`, `:2484`, cleanup `:2489`). No other JS toggles `bk-log-kbd`.

Related but separate: `BlockSetRow.jsx:355-360` `onFocusField` calls
`scrollIntoView` on focus — can contribute to iOS keyboard dismiss / sticky
focus, but does not itself hide the dock.

## 5. Smallest correct fix (prose + sketch — NOT applied)

**Intent:** keep hiding the Finish dock while the soft keyboard is actually
open (preserve critic R1 keypad safety); restore it as soon as the keyboard
closes, even if an input still has focus.

**Sketch**

In the same `liveBlockDay` effect (`SessionDetailPage.jsx` ~2458):

1. Track `loggerFieldFocused` from the existing focusin/focusout handlers.
2. Add `visualViewport` `resize`/`scroll` listeners (same API already used for
   scroll-assist at `:2394-2395`).
3. Treat keyboard as open when focused **and** geometry says so, e.g.
   `(window.innerHeight - visualViewport.height) > ~120` (tune for iOS
   Safari chrome), or `visualViewport.height / window.innerHeight < ~0.75`.
4. Set `bk-log-kbd` iff `loggerFieldFocused && keyboardOpen` (or split classes:
   keep nav hide on focus if desired; only gate `.session-finish-dock` on
   keyboard geometry — smallest CSS blast: leave the rule, change when the
   class is added/removed).

```text
onFocusIn  -> focused=true;  syncClass()
onFocusOut -> focused=false; syncClass()  // after rAF, same as today
onVvResize -> syncClass()

function syncClass() {
  const kb = focused && viewportKeyboardOpen();
  document.documentElement.classList.toggle("bk-log-kbd", kb);
}
```

Do **not** remove the CSS hide of `.session-finish-dock` under an open
keyboard — that regresses critic R1 P1-2.

**Reviewer verify at 390px (real `visualViewport`, not emulated-only)**

Playwright Chromium's device metrics resize does **not** fully reproduce iOS
sticky-focus-after-keyboard-dismiss. Prefer:

1. **Real iOS Safari** on staging (or Simulator Safari): open a live block day,
   focus a weight/reps field, dismiss the keypad by scrolling the list without
   tapping another control — Finish should reappear when the keypad is gone;
   focusing again should hide it.
2. **Playwright assist (emulated geometry only):** at 390x844, focus a logger
   input, then shrink `window.visualViewport` height (CDP
   `Emulation.setDeviceMetricsOverride` / viewport resize to ~390x450) and
   assert `html` has `bk-log-kbd` and `.session-finish-dock` is not displayed;
   restore full height **without** blurring and assert the class clears and the
   dock is displayed again. That checks the geometry fix path; it does not
   prove iOS sticky focus by itself.

## Files touched

- `DELIVERY.md` only (this report)

## Lanes run

N/A — diagnosis block; no unit/integration/build lane required. No source
changes.

## Acceptance criteria

| Criterion | Evidence |
|-----------|----------|
| `git status --porcelain` shows no change except untracked `DELIVERY.md` | Porcelain empty; `DELIVERY.md` exists and is gitignored (`/.gitignore:48` `/DELIVERY.md`) — no source tree changes. |
| DELIVERY.md names ≥1 file:line for hide/show and quotes the code | `SessionDetailPage.jsx:2468-2478` + `bk-log.css:587-591` quoted above. |
| DELIVERY.md states events in order for open → gone → touch → back | Section 2 table. |

## Deviations

None.
