# WorkoutDB Client (React + Vite)

This folder contains the frontend for WorkoutDB.

## Quick start

From `client/`:

- `npm install`
- `npm run dev`

By default, the client calls the API at `http://localhost:3000`.

## Mobile dev (phone on same Wi‑Fi)

Create `client/.env.local` (not committed):

- `VITE_API_URL=http://<your-lan-ip>:3000`

Run:

- `npm run dev:mobile`

Then open `http://<your-lan-ip>:5173` on your phone.

## More docs

See the root `README.md` for full setup (server + database + env vars).
