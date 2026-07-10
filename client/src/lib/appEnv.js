/**
 * Production-environment detection for display-layer gating (e.g. the
 * What's New release notes: prod users only, never staging or local dev).
 *
 * Keys off the configured API host, NOT the Vite build mode. `import.meta.
 * env.PROD` is true for the STAGING Vercel build too (it is a production
 * build of the branch), so it cannot tell prod from staging. The prod
 * client is the one wired to the prod Render API host (workout-db-l3gc);
 * staging points VITE_API_URL at the staging host; local dev runs on
 * DEV/localhost. Same doctrine as the server's dbHostGuard: trust the host
 * string, not the build flag.
 */
const PROD_API_HOST = "workout-db-l3gc";

export function isProdEnv() {
  if (import.meta.env.DEV) return false;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  return apiUrl.includes(PROD_API_HOST);
}
