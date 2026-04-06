import * as sessionApi from "../api/sessionApi.js";
import { pickLatestActiveSession } from "./activeSession.js";

export const ACTIVE_WORKOUT_ERROR = "ACTIVE_WORKOUT";

/**
 * Creates an empty session and opens it. Used for a blank “quick” log (e.g. /log-workout).
 */
export async function startAdHocWorkoutAndNavigate(navigate, { replace = true } = {}) {
  const mine = await sessionApi.getMySessions();
  const sessions = Array.isArray(mine.sessions) ? mine.sessions : [];
  const active = pickLatestActiveSession(sessions);
  if (active) {
    const err = new Error(
      "You already have a workout in progress. Finish or delete it before starting a blank workout."
    );
    err.code = ACTIVE_WORKOUT_ERROR;
    err.activeSessionId = active.id;
    throw err;
  }

  const data = await sessionApi.createAdHocSession();
  if (data?.session?.id == null) {
    throw new Error("Could not start workout. Try again.");
  }
  navigate(`/sessions/${data.session.id}`, { replace });
}
