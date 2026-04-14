import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ActiveSessionProvider } from "./context/ActiveSessionContext.jsx";
import { SessionLiveLoggingGuardProvider } from "./context/SessionLiveLoggingGuardContext.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionLiveLoggingGuardProvider>
        <ThemeProvider>
          <AuthProvider>
            <ActiveSessionProvider>
              <App />
            </ActiveSessionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionLiveLoggingGuardProvider>
    </BrowserRouter>
  </StrictMode>,
)
