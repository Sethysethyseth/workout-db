import * as sessionApi from "../api/sessionApi.js";

/**
 * Creates an empty session and opens it. Used from Home (Start Workout) and /log-workout (deep link).
 */
export async function startAdHocWorkoutAndNavigate(navigate, { replace = true } = {}) {
  const data = await sessionApi.createAdHocSession();
  if (data?.session?.id == null) {
    throw new Error("Could not start workout. Try again.");
  }
  navigate(`/sessions/${data.session.id}`, { replace });
}
