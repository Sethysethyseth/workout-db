import { Outlet } from "react-router-dom";
import wordmarkWhite from "../assets/brand/wordmark_white.png";

export function AuthLayout() {
  return (
    <div className="auth-page auth-shell">
      <div className="auth-card-wrap">
        <div className="wordmark">
          <img src={wordmarkWhite} alt="LogChamp" />
        </div>
        <p className="muted small auth-tagline">Log your shit dog</p>
        <Outlet />
      </div>
    </div>
  );
}
