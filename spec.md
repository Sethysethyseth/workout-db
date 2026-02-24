# WorkoutDB — SPEC (v1) — Vanilla JS + Express + Postgres

## 1) Product vision
WorkoutDB is a workout tracking app + public database where users can:
- Create workout templates (programs)
- Log workout sessions (sets, reps, weight, RPE/RIR)
- Browse/share public templates and sessions
- Reuse/clone other people’s templates

Primary goal of v1: ship a reliable **create → log → browse → clone** loop with explicit public sharing.

## 2) Principles
- Keep v1 simple and shippable
- One source of truth for the data model (Postgres schema + migrations)
- Public sharing is explicit opt-in (default private)
- RPE/RIR supported but optional
- Exercise library exists from day 1 (seeded + custom per user)
- Build for web first; mobile later

## 3) Scope

### In scope (v1)
- Authentication (email + password)
- Exercise library:
  - seeded global exercises
  - user-created custom exercises
  - optional YouTube link per exercise
- Workout templates:
  - create/edit/delete
  - ordered list of exercises
  - store defaults (sets/reps/RPE notes optional)
- Workout sessions:
  - log from a template or ad-hoc
  - performed date/time
  - per-exercise sets
- Set logging:
  - reps, weight, optional RPE or RIR, warmup flag, notes
- History:
  - sessions list, session detail
- Public browsing:
  - search public templates and sessions
  - view public detail
- Clone template:
  - copy someone’s public template into your account

### Out of scope (v1)
- “Excel-sheet fully customizable” UI (v1 uses a clean table/form UI)
- Real-time collaboration
- Complex analytics dashboards
- Video ingestion (store optional YouTube URLs only)
- Offline-first mobile support

## 4) Roles & permissions

### User
- Can CRUD their own templates and sessions
- Can mark templates/sessions as public
- Can view public templates/sessions from anyone
- Can clone public templates

### Admin (later)
- Manage reported content / abuse tools (v2+)

### Sharing rules
- Default is PRIVATE.
- Public templates/sessions are readable by anyone.
- Only owner can edit/delete.
- Cloning creates a new private copy owned by the cloner.

## 5) Architecture

### 5.1 High-level components
- **Client (Vanilla Web App)**
  - HTML/CSS/JS served as static files
  - Uses `fetch()` to call backend API
  - Simple router (hash-based `#/templates`, `#/sessions`, etc.)
- **Server (Express API)**
  - REST API
  - Auth via secure cookies (httpOnly)
  - Validation + authorization
- **Database (PostgreSQL)**
  - relational schema, migrations
  - enforce constraints where sensible

### 5.2 Environments
- Local dev:
  - Client served by Express (static) or separate static server
  - Postgres local (Docker recommended)
- Production:
  - Express deployed (Render/Fly/Railway)
  - Postgres hosted (Neon/Supabase/Railway)

## 6) Core entities (data model)

### 6.1 Entity overview
- users
- exercises
- workout_templates
- template_exercises (join for ordering + defaults)
- workout_sessions
- session_exercises
- set_entries

### 6.2 Fields (suggested)

#### users
- id (uuid, pk)
- email (text, unique, not null)
- password_hash (text, not null)
- display_name (text)
- created_at (timestamptz)
- updated_at (timestamptz)

#### exercises
- id (uuid, pk)
- name (text, not null)
- primary_muscle_group (text, nullable)
- equipment (text, nullable)
- youtube_url (text, nullable)
- owner_user_id (uuid, nullable)  
  - null = global/seeded exercise
  - not null = user custom exercise
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:
- Unique index recommended:
  - (owner_user_id, lower(name)) unique
  - For seeded/global, owner_user_id is null, so handle uniqueness via a partial index or normalize seeded names carefully.

#### workout_templates
- id (uuid, pk)
- owner_user_id (uuid, fk users, not null)
- title (text, not null)
- description (text, nullable)
- is_public (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

#### template_exercises
- id (uuid, pk)
- template_id (uuid, fk workout_templates, not null)
- exercise_id (uuid, fk exercises, not null)
- sort_order (int, not null)
- default_sets (int, nullable)
- default_reps (int, nullable)
- default_rpe (numeric(3,1), nullable)
- notes (text, nullable)

Constraints:
- unique (template_id, sort_order)

#### workout_sessions
- id (uuid, pk)
- owner_user_id (uuid, fk users, not null)
- template_id (uuid, fk workout_templates, nullable)
- performed_at (timestamptz, not null)
- title (text, nullable)  
  - default: template title or “Workout”
- notes (text, nullable)
- is_public (boolean, default false)
- created_at (timestamptz)
- updated_at (timestamptz)

#### session_exercises
- id (uuid, pk)
- session_id (uuid, fk workout_sessions, not null)
- exercise_id (uuid, fk exercises, not null)
- sort_order (int, not null)
- notes (text, nullable)

Constraints:
- unique (session_id, sort_order)

#### set_entries
- id (uuid, pk)
- session_exercise_id (uuid, fk session_exercises, not null)
- set_number (int, not null)  (starts at 1)
- reps (int, not null, >= 0)
- weight (numeric(8,2), not null, >= 0)
- rpe (numeric(3,1), nullable)
- rir (int, nullable)
- is_warmup (boolean, default false)
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

Validation rules (server):
- Only one of rpe or rir may be set (v1).
- If rpe: 1.0–10.0 (allow halves).
- If rir: 0–10.
- reps and weight must be non-negative.
- set_number increments per exercise; enforce in app logic.

## 7) Pages / UX (v1)

### 7.1 Routes (hash router)
- `#/login`
- `#/signup`
- `#/templates`
- `#/templates/new`
- `#/templates/:id`
- `#/sessions`
- `#/sessions/new`
- `#/sessions/:id`
- `#/public/templates`
- `#/public/templates/:id`
- `#/public/sessions`
- `#/public/sessions/:id`

### 7.2 Templates UI
- List: my templates (private/public badges)
- Builder:
  - add exercises (search library)
  - reorder exercises
  - set default sets/reps/RPE notes per exercise
- Toggle public/private

### 7.3 Logging sessions UI
Flow:
1) choose template or ad-hoc
2) session page shows ordered exercises
3) each exercise has a sets table:
   - add set row
   - reps/weight + optional RPE or RIR
   - warmup toggle
4) save updates frequently (manual save v1 or auto-save later)

If session from template:
- server creates session_exercises from template_exercises ordering.

### 7.4 Public browse UI
- Search + list:
  - templates
  - sessions
- Detail view:
  - template detail shows exercises
  - session detail shows exercises + sets
- Clone template button on template detail

Search filters (v1 minimal):
- text search by title / exercise name
- sort: most recent

## 8) API (Express, v1)

### 8.1 Auth approach (recommended)
- Session cookie (httpOnly, secure in prod)
- Server stores session records in DB (sessions table) OR signed cookie session (choose one)
- v1 recommendation: **DB-backed sessions** for simplicity and invalidation.

Suggested tables:
- sessions: id (uuid), user_id, expires_at, created_at

### 8.2 Endpoints

#### Auth
- POST `/api/auth/signup`
  - body: { email, password, displayName }
  - creates user, sets session cookie
- POST `/api/auth/login`
  - body: { email, password }
  - sets session cookie
- POST `/api/auth/logout`
  - clears session cookie
- GET `/api/auth/me`
  - returns current user profile (or 401)

#### Exercises
- GET `/api/exercises?query=`
  - returns:
    - global exercises
    - + user custom exercises
- POST `/api/exercises`
  - create custom exercise (auth required)
- (Seed exercises are read-only in v1)

#### Templates (private)
- GET `/api/templates` (auth)
- POST `/api/templates` (auth)
- GET `/api/templates/:id` (auth, must own)
- PATCH `/api/templates/:id` (auth, must own)
- DELETE `/api/templates/:id` (auth, must own)

#### Templates (public)
- GET `/api/public/templates?query=`
- GET `/api/public/templates/:id`
- POST `/api/public/templates/:id/clone` (auth)
  - creates a new private template for the caller
  - copies template_exercises

#### Sessions (private)
- GET `/api/sessions` (auth)
- POST `/api/sessions` (auth)
  - body may include templateId
- GET `/api/sessions/:id` (auth, must own)
- PATCH `/api/sessions/:id` (auth, must own)
- DELETE `/api/sessions/:id` (auth, must own)

#### Sessions (public)
- GET `/api/public/sessions?query=`
- GET `/api/public/sessions/:id`

### 8.3 Request/response conventions
- JSON only
- Standard errors:
  - 400 validation error
  - 401 unauthenticated
  - 403 unauthorized
  - 404 not found
- Pagination later (v2); v1 can return limited list (e.g., 50)

## 9) Non-functional requirements
- Security:
  - password hashing with bcrypt
  - httpOnly cookies
  - CORS locked down in prod
  - protect all write endpoints
- Validation:
  - server-side input validation (Zod or manual checks)
- Performance:
  - basic indexes for search fields (title, performed_at)
- Reliability:
  - consistent error responses
- Code quality:
  - ESLint + Prettier
  - clear module separation (routes/services/db)

## 10) Seed data (v1)
Seed a starter exercise list, e.g.:
- Squat, Bench Press, Deadlift, Overhead Press, Barbell Row
- Pull-up, Lat Pulldown, Leg Press, Leg Extension, Leg Curl
- Dumbbell Press, Incline Press, Bicep Curl, Tricep Extension, Calf Raise

Seed fields:
- name
- optional muscle group / equipment
- optional YouTube URL (can be blank)

## 11) Repo structure (recommended)
