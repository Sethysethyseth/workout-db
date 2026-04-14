/* eslint-disable react-refresh/only-export-components -- provider + hook pair */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const SessionLiveLoggingGuardContext = createContext({
  isActive: false,
  setActive: () => {},
});

export function SessionLiveLoggingGuardProvider({ children }) {
  const [active, setActiveState] = useState(false);
  const setActive = useCallback((next) => {
    setActiveState(Boolean(next));
  }, []);
  const value = useMemo(() => ({ isActive: active, setActive }), [active, setActive]);
  return (
    <SessionLiveLoggingGuardContext.Provider value={value}>{children}</SessionLiveLoggingGuardContext.Provider>
  );
}

export function useSessionLiveLoggingGuard() {
  return useContext(SessionLiveLoggingGuardContext);
}
