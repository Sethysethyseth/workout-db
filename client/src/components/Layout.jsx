import { Outlet } from "react-router-dom";
import { BottomNav } from "./layout/BottomNav.jsx";
import { Navbar } from "./layout/Navbar.jsx";
import { PersistentWorkoutBar } from "./workout/PersistentWorkoutBar.jsx";
import { WhatsNewGate } from "./whatsnew/WhatsNewGate.jsx";

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
      <BottomNav />
      <WhatsNewGate />
    </div>
  );
}

