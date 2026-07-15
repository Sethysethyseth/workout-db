# TASK CW3: cursor-watch frontier visuals - cooler page, unmistakable DONE

STATUS: QUEUED
MODEL: auto   <!-- deliberate: the named rung is exhausted until the 7/17
                   reset; quality is protected by fully specifying the
                   design below (visual-unit exception in author-task-block) -->
MODE: 1-relay

CONTEXT:
Third unit on `scripts/cursor-watch.mjs` (CW1 dashboard, CW2 auto-open -
read the shipped script first; every existing flag and behavior must
survive). Seth's ask: the visuals should feel like a frontier agent
product, not a debug page, and DONE must be unmissable - including when
the browser tab is hidden or closed. This block fully specifies the
design direction (distilled from the current generation of agent UIs:
Cursor's agent panel, Claude, Devin/Codex-class dashboards); implement
it faithfully. Same hard constraints as CW1/CW2: `node:` built-ins only,
127.0.0.1 only, everything inline (no CDN/fonts/external URLs), zero
LLM anywhere.

FILES TO TOUCH:
- scripts/cursor-watch.mjs   (extend - no new files)
Do NOT modify anything outside these files.

CHANGE:

### A. Design direction (this IS the spec - the shared language of
frontier agent UIs, stated as requirements):

1. **Depth, not flatness.** Layered surfaces: a near-black base with a
   slow, subtle background gradient wash; panels elevated above it with
   a 1px low-contrast inner stroke, soft shadow, and rounded corners
   (6-10px). Consistent spacing rhythm (multiples of 4px). The current
   hard table-borders look is replaced by this layering.
2. **One phase-driven accent runs the whole page.** A single CSS accent
   variable keyed to phase - dim slate (WAITING), signal green
   (WORKING), cool blue (DELIVERY) - and every colored element (status
   pill, glows, bars, feed highlights, caret) derives from it.
   Phase changes crossfade the accent ~250ms ease-out.
3. **Agent presence.** While WORKING, a living indicator in the header -
   a pulsing orb or waveform whose intensity/tempo tracks the recent
   event rate (compute from event timestamps client-side). Idle =
   slow calm pulse; busy = visibly alive. This is the "something to
   look at" centerpiece; it may animate continuously.
4. **Activity as a tool-call-style card stream.** Feed items become
   small cards: a glyph per kind (add / change / unlink / delivery),
   filename prominent, dimmed directory + timestamp, ~180ms slide-in
   ease-out for new arrivals, brief accent flash on entry.
5. **Header lockup.** CURSOR wordmark + the unit name parsed from the
   lane branch (`cursor/<unit>` -> `<unit>`), the status pill with an
   animated activity dot, elapsed timer in tabular numerals, and a
   totals chip (`+X / -Y across N files`) that updates live.
6. **Event-rate sparkline.** A tiny bar sparkline of activity over the
   last ~2 minutes in the header (agent activity-meter idiom).
7. **Diff-stat panel.** Rows sorted most-recently-touched first, bars
   animate growth (~200ms), pinned totals row at top.
8. **Now-writing pane.** Keep the typing reveal; add a file-tab-style
   header showing the current file, auto-follow scroll pinned to the
   caret, existing diff colorization retained.
9. **Reduced motion.** All continuous/entrance animation gated behind
   `prefers-reduced-motion: no-preference`; static equivalents remain
   legible.

### B. The DONE moment (page-side):

On the WORKING -> DELIVERY transition, exactly once per run:
- A one-time full-page accent sweep (~600ms wash, then settles into the
  blue delivery treatment; never loops).
- The header becomes a large DELIVERY READY lockup with the run
  summary: total elapsed, files touched, aggregate +/-.
- `document.title` tracks state at all times ("● CURSOR WORKING -
  <unit>" / "✓ DELIVERY READY - <unit>" / "CURSOR WATCH - waiting"),
  so a background tab shows the state.
- Favicon swaps by state via inline data-URI (generated in-page, e.g.
  canvas/SVG data URI - no asset files): accent dot while working,
  check while delivered.
- Optional chime: WebAudio only (no audio files), OFF by default,
  toggled by a small mute/unmute control persisted in localStorage
  (key prefix `cursor-watch-`), and only ever played after the user
  has interacted with the page (browser autoplay rules).

### C. The DONE signal (OS-side - works with the tab hidden or closed):

- New flag `--notify`: when phase transitions into DELIVERY, the SERVER
  fires an OS notification, once per run (re-arm mirrors CW2's rule:
  DELIVERY.md removal or branch change). Windows default: spawn a
  detached PowerShell one-liner that shows a tray balloon/toast saying
  the unit is done (implementer's choice of mechanism, no dependencies,
  no files written). Failure logs and never kills the server.
- New flag `--notify-cmd <command>`: override - the command runs via
  shell with a short message appended as the final argument (the CW2
  `--open-cmd` idiom, exists so the behavior is machine-testable).
  `--notify-cmd` alone (without `--notify`) never fires.
- Add `--notify` to the startup/help text alongside the CW2 flags.

Testing note (CW1/CW2 rule): drive everything against a THROWAWAY dir
under `os.tmpdir()`; use `--notify-cmd` pointed at a marker-append
command so "a toast fired" becomes "the marker gained a line". Do not
create test dirs or fixtures inside the repo.

ACCEPTANCE CRITERIA (machine-checkable):
- `--notify` + `--notify-cmd` marker override: creating `DELIVERY.md`
  in the watched tmpdir fires the marker exactly once within 5s;
  further writes while DELIVERY do not fire; remove `DELIVERY.md`,
  write a file, re-create it -> fires a second time. Evidence: marker
  line counts at each step.
- `--notify --notify-cmd <nonexistent>`: error logged, server still
  serves 200 at `/`. Evidence: log line + status.
- Default run (no new flags): marker never fires even with
  `--notify-cmd` set. Evidence: empty marker.
- CW2 regression: the `--open-on-activity` once-per-run + re-arm cycle
  still passes (atStart=0, afterFirst=1, afterSecond=1, after
  DELIVERY-removal + write=2). Evidence: marker counts.
- Page-source greps (evidence: matching lines): `prefers-reduced-motion`;
  `document.title` assignment; a favicon data-URI mechanism
  (`data:image` or `toDataURL`); a `localStorage` key starting
  `cursor-watch-`; and the external-URL grep from CW1 still finds only
  `127.0.0.1`/`localhost` self-references.
- `git diff --stat` shows only `scripts/cursor-watch.mjs`; every import
  still a `node:` built-in; `package.json`/lockfiles byte-identical.
- Tripwires: `npm run test:unit` green from `server/`; `npm run build`
  clean from `client/`.
- Visual sign-off is Seth's, on a live run (stated here so the reviewer
  records it as owed, not skipped).

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
