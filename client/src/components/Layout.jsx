import { Outlet } from "react-router-dom";
import { Navbar } from "./layout/Navbar.jsx";
import { PersistentWorkoutBar } from "./workout/PersistentWorkoutBar.jsx";

export function Layout() {
  return (
    <div className="app">
      <Navbar />
      <div className="persistent-workout-bar-wrap container">
        <PersistentWorkoutBar />
      </div>
      <main className="container main">
        <Outlet />
      </main>
    </div>
  );
}

