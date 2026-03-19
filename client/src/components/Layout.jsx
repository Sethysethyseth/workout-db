import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar.jsx";

export function Layout() {
  return (
    <div className="app">
      <NavBar />
      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}

