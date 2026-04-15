# WorkoutDB

WorkoutDB is a mobile‑first workout tracker built for **fast logging**, **reusable templates/programs**, and a clean “workout session” history.

## Tech stack

- **Client**: React + Vite (`client/`)
- **Server**: Express + sessions (`server/`)
- **DB**: Postgres via Prisma

## Repo structure

- `client/`: frontend app
- `server/`: API, auth, Prisma schema/migrations

## Local development

You run **two** processes (server + client).

### 1) Server

From `server/`:

- `npm install`
- Create `server/.env` from `server/.env.example`
- Run migrations/generate:
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
- Start the API:
  - `npm run dev`

By default the API runs on `http://localhost:3000`.

### 2) Client

From `client/`:

- `npm install`
- `npm run dev`

Desktop dev defaults to calling the API at `http://localhost:3000` (do **not** set `VITE_API_URL` unless you need mobile/LAN or prod).

## Mobile dev (phone on same Wi‑Fi)

1. Find your PC’s LAN IPv4 (Windows: `ipconfig`).
2. Create `client/.env.local` (not committed):

   `VITE_API_URL=http://<your-ip>:3000`

3. In `server/.env`, set:

   `CLIENT_ORIGIN_MOBILE=http://<your-ip>:5173`

4. Run Vite on the LAN from `client/`:

   `npm run dev:mobile`

5. On your phone, open `http://<your-ip>:5173`.

When your LAN IP changes, update `client/.env.local` and `CLIENT_ORIGIN_MOBILE`. Desktop dev stays on localhost.

## Environment variables

- **Client**: see `client/.env.example`
- **Server**: see `server/.env.example`

## Scripts (common)

- `client`: `npm run dev`, `npm run dev:mobile`, `npm run build`
- `server`: `npm run dev`, `npm run start`, `npm run prisma:studio`
