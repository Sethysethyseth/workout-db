# workout-db
workout database / app

## Development: desktop vs mobile

**Desktop (default, no env required):** from `server/`, run `npm run dev`. From `client/`, run `npm run dev`. The app calls the API at `http://localhost:3000`. Do not set `VITE_API_URL` for normal desktop work.

**Phone on the same Wi‑Fi (explicit setup):**

1. Find your PC’s current LAN IPv4 (Windows: `ipconfig`; macOS/Linux: `ip addr` or Network settings). Example shape: `192.168.x.x` (yours will differ).
2. Create or edit `client/.env.local` (gitignored via `*.local` in `client/.gitignore`):

   `VITE_API_URL=http://<your-ip>:3000`

3. In `server/.env`, set `CLIENT_ORIGIN_MOBILE=http://<your-ip>:5173` so CORS allows the phone’s browser origin (see `server/.env.example`).
4. From `client/`, run `npm run dev:mobile` (Vite listens on the LAN).
5. On the phone, open `http://<your-ip>:5173`.

When your LAN IP changes, update `.env.local` and `CLIENT_ORIGIN_MOBILE` only for mobile sessions; desktop dev stays on localhost.

See `client/.env.example` and `server/.env.example`.
