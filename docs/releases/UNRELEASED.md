# UNRELEASED - What's New ledger (single writer: Claude Code)

Shipped work waiting for release notes. The What's New lane
(`docs/tasks/_WHATS_NEW.md`) turns this into `RELEASES` entries at wave end.
Then Claude Code moves the consumed sections VERBATIM to
`docs/releases/RELEASED.md` (newest first) and resets this file to its
header. Process of record: `docs/specs/quality-of-life-wave.md` section 4.

Entry format, one per user-facing landing (`land-unit` section 5 appends
it):

`- [<unit>] <what changed, plain words> | Where: <tap path> | Files: <1-3 key UI files the writer should read>`

Write what a lifter would notice. Internal-only work gets no entry.

---

## Motion wave (MX) - motion-wave

- [mx1-4] Analytics comes alive: cards rise in, numbers roll up, bars and trend lines draw themselves, gains show in a clear "up" color in every theme, and exercise names no longer get cut off | Where: Analytics (all four tabs) | Files: client/src/pages/AnalyticsPage.jsx, client/src/styles/analytics-motion.css, client/src/components/analytics/ExercisesView.jsx
- [mx5-6] Moving between tabs now slides pages left or right in tab order, the tab bar's highlight glides to the tab you tapped, pages show their shape while loading, and a finished workout in History grows into its summary | Where: bottom tabs, desktop top bar, History | Files: client/src/components/motion/RouteTransition.jsx, client/src/components/layout/BottomNav.jsx, client/src/pages/SessionsPage.jsx
- [mxf1] Opening a past workout now grows its card into the page, Analytics only plays its full intro once per visit, loading screens match the page, and crimson no longer shows progress in red | Where: History, Analytics, workout summary | Files: client/src/components/motion/useFlip.js, client/src/pages/AnalyticsPage.jsx, client/src/components/workout/CompletedSessionSummary.jsx
