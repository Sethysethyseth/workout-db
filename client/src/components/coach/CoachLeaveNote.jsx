import { useEffect, useState } from "react";

const STORAGE_KEY = "workoutdb-coach-keeps-working";

/* Once means once (Seth, Oct 10): a device-local marker like
   whatsNewStorage.js, written the moment the note is SHOWN - leaving without
   tapping "Got it" does not bring it back, and logout never clears it
   (AuthContext removes only authToken). */
function alreadySeen() {
  try {
    return localStorage.getItem(STORAGE_KEY) != null;
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "seen");
  } catch {
    /* ignore */
  }
}

/** First open of /coach on this device. In flow under the title, never over the composer. */
export function CoachLeaveNote() {
  const [open, setOpen] = useState(() => !alreadySeen());

  useEffect(() => {
    if (open) markSeen();
    // Mark on first show only; dismiss just hides it for this visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;

  return (
    <div className="coach-leave-note" role="status">
      <p className="coach-leave-note__copy">
        Ask a question, then leave this page. The coach keeps working and lets you know when it is done.
      </p>
      <button type="button" className="coach-leave-note__dismiss" onClick={() => setOpen(false)}>
        Got it
      </button>
    </div>
  );
}
