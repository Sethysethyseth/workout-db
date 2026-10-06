# DELIVERY — bkr-d3: DIAGNOSIS - Login screen flashes on a hard load of a deep link

## Files touched

- `DELIVERY.md` only (this report). No source changes. No git operations.

## Test evidence

No test / build lanes named in the block (diagnosis / report-only). None run.

## Answers (CHANGE questions)

### 1. What renders while the session check is pending?

Auth boot: `AuthProvider` starts with `authLoading=true`, `currentUser=null`, and fires `/auth/me` (`AuthContext.jsx:46-48`, `86-88`).

**Every `ProtectedRoute` child uses the same gate** (`ProtectedRoute.jsx:11-26`). There is no special case for `/` vs `/blocks/import`.

| Boot hint | While `authLoading` | After settle, signed in | After settle, signed out |
|---|---|---|---|
| `localStorage.authToken` present | `LoadingState` tone=`page`, label "Loading session…" (`ProtectedRoute.jsx:19-25`; delayed 400ms so fast boots show nothing) | Page children | n/a |
| No stored token | Immediate `<Navigate to={`/login?next=...`}>` (`ProtectedRoute.jsx:16-17`) → `LoginPage` paints the Login form | `LoginPage` `useEffect` navigates to `next` (`LoginPage.jsx:22-25`) | Stay on Login (correct) |

**Why `/` can look like "Loading workout" while `/blocks/import` shows Login**

- Same gate for both. Difference is the **post-auth** page, and whether the no-token short-circuit fired.
- With a stored token: hard load of `/` shows (optional delayed) "Loading session…", then `DashboardPage` → `StartWorkoutHero` with `loading` → skeleton with `aria-label="Loading workout"` (`StartWorkoutHero.jsx:26-37`, wired from `DashboardPage.jsx:297`). That is **session-data** loading, not auth pending.
- With **no** stored token but a still-valid `workoutdb.sid` cookie: hard load of any protected URL (including `/blocks/import`) hits the short-circuit, mounts `LoginPage`, and the form ("Email or username", "Password") is visible until `/auth/me` succeeds and the `next=` self-heal runs. `ImportBlockPage` has no auth-pending UI of its own.
- `LoginPage` never reads `authLoading` — it always renders the form until `currentUser` appears (`LoginPage.jsx:9`, `41-79`).

### 2. Root cause (file:line + state sequence)

**Mechanism:** `ProtectedRoute` treats "no `authToken` in localStorage" as "will only ever land on login," and redirects **while `/auth/me` is still in flight**. Cookie-primary sessions (valid `workoutdb.sid`, empty/missing `localStorage.authToken`) are the documented exception the Login self-heal was written for (`ProtectedRoute.jsx:12-15`, `LoginPage.jsx:20-21`; landed as the cold-start skip in QUEUE notes around `3a530a7`).

**Component that paints Login during pending:** `LoginPage` — form JSX at `client/src/pages/LoginPage.jsx:41-79`.

**Gate that sends the user there during pending:** `ProtectedRoute` — `client/src/components/ProtectedRoute.jsx:16-17` (`if (!hasStoredAuthToken()) return <Navigate to={/login?next=...} />` inside the `authLoading` branch).

**State sequence (matches the smoke: signed in via cookie, hard load `/blocks/import`):**

1. Hard load → `authLoading=true`, `currentUser=null`.
2. `hasStoredAuthToken()` false → Navigate to `/login?next=%2Fblocks%2Fimport`.
3. `AuthLayout` + `LoginPage` mount; Login form is visible immediately.
4. `/auth/me` succeeds with the cookie → `setCurrentUser(user)`, `authLoading=false` (`AuthContext.jsx:59-64`, `79-82`).
5. `LoginPage` effect sees `currentUser` → `navigate(nextUrl)` → `/blocks/import` (`LoginPage.jsx:22-25`).
6. `ProtectedRoute` now has `currentUser` → renders `ImportBlockPage`.

No user action; reads as a brief logout on PWA.

### 3. Every route affected

Any route wrapped in `<ProtectedRoute>` in `client/src/App.jsx`, when `authLoading && !hasStoredAuthToken()`:

- `/`
- `/templates`
- `/templates/public`
- `/create-template`
- `/templates/:id/edit`
- `/blocks/:id/edit`
- `/blocks/import`
- `/blocks/current`
- `/log-workout`
- `/sessions`
- `/analytics`
- `/sessions/:id`
- `/profile`
- `/profile/appearance`
- `/profile/security`
- `/profile/ai`
- `/profile/feedback`
- `/profile/whats-new`
- `/hello`
- `/dev/feedback`

Not caused by this gate (already public under `AuthLayout`): `/login`, `/register`, `/connector/login`.

### 4. Smallest correct fix (prose + sketch — not applied)

**Do not Navigate to `/login` while `authLoading`.** Always show the existing page-tone `LoadingState` during the session check (delay-before-show already avoids a flash on fast `/auth/me`). Keep `next=` only for the settled signed-out case.

Sketch (`ProtectedRoute.jsx`):

```jsx
export function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  if (authLoading) {
    return (
      <LoadingState
        tone="page"
        label="Loading session…"
        slowLabel="Taking longer than usual…"
      />
    );
  }
  if (!currentUser) {
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  // username gate + children unchanged
}
```

- Drop the `hasStoredAuthToken()` branch inside `authLoading` (and the import if unused).
- Genuinely signed-out users: `/auth/me` 401 → `authLoading=false`, `currentUser=null` → same `Navigate` to `/login?next=...` as today.
- Cookie-only signed-in users: stay on the deep link under delayed `LoadingState` (often null <400ms) → page appears; no Login form.
- Trade-off vs the old cold-start skip: first-time visitors wait for `/auth/me` before seeing Login (usually covered by the 400ms delay). That is the intended LoadingState pattern.

Optional belt: also gate `LoginPage` on `authLoading` with the same `LoadingState` so a direct `/login` visit with a live cookie does not paint the form first — not required if ProtectedRoute never redirects early.

## Acceptance criteria

1. **`git status --porcelain` shows no change except the untracked DELIVERY.md.**

   Evidence (verbatim after writing this file):

   ```
   git status --porcelain --untracked-files=all
   ```
   (empty — no modified/staged tracked files)

   ```
   git check-ignore -v DELIVERY.md
   .gitignore:48:/DELIVERY.md	DELIVERY.md
   ```

   `DELIVERY.md` exists on disk (`Test-Path` → True) and is gitignored, so porcelain stays empty. No source files changed.

2. **DELIVERY.md names the component and file:line that renders Login during the pending state, and lists the affected routes.**

   - Component / paint site: `LoginPage` at `client/src/pages/LoginPage.jsx:41-79`.
   - Redirect during pending: `ProtectedRoute` at `client/src/components/ProtectedRoute.jsx:16-17`.
   - Affected routes: listed in §3 above.

## Deviations

None. Report-only; no code changes; no git operations; no HANDOFF / tasks edits.
