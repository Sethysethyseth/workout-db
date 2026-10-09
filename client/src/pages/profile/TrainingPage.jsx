import { Link } from "react-router-dom";
import { TrainingPrefsForm } from "../../components/prefs/TrainingPrefsForm.jsx";

export function TrainingPage() {
  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">Training</h1>
        <p className="settings-page-subtitle muted small">
          How LogChamp logs your workouts on this phone.
        </p>
      </header>
      <TrainingPrefsForm variant="page" />
    </div>
  );
}
