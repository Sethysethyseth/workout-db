import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { LATEST_RELEASE } from "../../data/whatsNew.js";
import { loadLastSeenRelease, saveLastSeenRelease } from "../../lib/whatsNewStorage.js";
import { isProdEnv } from "../../lib/appEnv.js";
import { WhatsNewModal } from "./WhatsNewModal.jsx";

/**
 * Shows the What's New modal once per device per release: only in prod
 * (never staging or local dev), only when logged in, and only while the
 * latest release id differs from the stored last-seen id. Dismissing
 * (button, backdrop, Escape, or the see-all link) marks the release seen.
 */
export function WhatsNewGate() {
  const { currentUser } = useAuth();
  const [lastSeen, setLastSeen] = useState(() => loadLastSeenRelease());

  if (!isProdEnv()) return null;
  if (!currentUser || !LATEST_RELEASE) return null;
  if (lastSeen === LATEST_RELEASE.id) return null;

  const dismiss = () => {
    saveLastSeenRelease(LATEST_RELEASE.id);
    setLastSeen(LATEST_RELEASE.id);
  };

  return <WhatsNewModal release={LATEST_RELEASE} onDismiss={dismiss} />;
}
