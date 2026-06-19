import { Outlet } from "react-router-dom";
import wordmark from "../assets/brand/wordmark.png";

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card-wrap">
        <img
          src={wordmark}
          alt="LogChamp"
          style={{ maxWidth: "240px", display: "block", margin: "0 auto" }}
        />
        <p className="muted small" style={{ textAlign: "center" }}>
          Log your shit dog
        </p>
        <Outlet />
      </div>
    </div>
  );
}
