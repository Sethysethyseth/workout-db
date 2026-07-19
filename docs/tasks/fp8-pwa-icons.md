# TASK FP8: PWA icons + manifest wiring (LAST in wave - Seth gated)

STATUS: DRAFT   <!-- stays DRAFT until Seth's icon PNGs land in
                     claudefiledrop/ - Seth ordered this unit LAST and
                     it needs his intervention for the assets -->
MODEL: auto
MODE: 1-relay

CONTEXT:
FP-wave closer. Evidence base: `docs/tasks/fp0-frontier-parity-report-
FINDINGS.md` section R2: manifest ships `"icons": []`, index.html never
links the manifest at all, favicon is the stock Vite mark, no
apple-touch-icon. Interim design settled: flat "LC" monogram on the
champ dark surface (#060913 - dark --color-bg), no gradients.

PRECONDITION (Seth): icon PNGs present in claudefiledrop/ -
icon-192.png, icon-512.png, icon-maskable-512.png (safe-zone),
apple-touch-icon.png (180x180), optional favicon replacement. The
authoring session may first produce `docs/design/logchamp-icon.svg`
(the monogram as hand-written SVG) for Seth to export from; flip this
block QUEUED only when the PNGs exist.

FILES TO TOUCH:
- client/public/manifest.webmanifest
- client/public/icons/               (NEW - the PNGs, copied from drop)
- client/public/apple-touch-icon.png (NEW)
- client/public/favicon.svg          (only if Seth supplied a swap)
- client/index.html                  (manifest + apple-touch links)
Do NOT modify anything outside these files.

CHANGE:
Copy assets into place; populate the manifest `icons` array (192, 512,
maskable-512 entries per the FINDINGS R2 JSON sketch); add
`<link rel="manifest" href="/manifest.webmanifest" />` and
`<link rel="apple-touch-icon" href="/apple-touch-icon.png" />` to
index.html.

ACCEPTANCE CRITERIA (machine-checkable):
- Manifest parses as JSON and its three icon paths exist on disk with
  the declared sizes.
- index.html contains both new link tags.
- client `npm run build` green and the built dist/ contains the icons
  and manifest.

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
