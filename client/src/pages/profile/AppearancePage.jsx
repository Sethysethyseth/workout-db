import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";

const PALETTE_OPTIONS = [
  { value: "champ", label: "Champ" },
  { value: "iron", label: "Iron" },
  { value: "forest", label: "Forest" },
  { value: "crimson", label: "Crimson" },
  { value: "chill", label: "Chill" },
];

export function AppearancePage() {
  const { theme, setTheme, palette, setPalette } = useTheme();

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back muted small">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">Appearance</h1>
      </header>

      <section className="settings-section" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="settings-section-heading">
          Appearance
        </h2>
        <div className="settings-group settings-group--tight">
          <p className="settings-group-hint muted small">Applies to this device only.</p>
          <div className="settings-theme-list" role="radiogroup" aria-label="Theme">
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">Light</span>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
              />
            </label>
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">Dark</span>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
              />
            </label>
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">System</span>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === "system"}
                onChange={() => setTheme("system")}
              />
            </label>
          </div>
          <div className="settings-palette-block">
            <span className="settings-palette-block__label muted small">Accent color</span>
            <div className="settings-palette-grid" role="radiogroup" aria-label="Accent color">
              {PALETTE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={
                    "settings-palette-option" +
                    (palette === option.value ? " settings-palette-option--selected" : "")
                  }
                >
                  <span
                    className={`settings-palette-swatch settings-palette-swatch--${option.value}`}
                    aria-hidden="true"
                  />
                  <span className="settings-palette-option__label">{option.label}</span>
                  <input
                    type="radio"
                    name="palette"
                    value={option.value}
                    checked={palette === option.value}
                    onChange={() => setPalette(option.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
