import { Outlet } from "react-router-dom";
import { Navbar } from "./layout/Navbar.jsx";

export function Layout() {
  return (
    <div className="app">
      <Navbar />
      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}

