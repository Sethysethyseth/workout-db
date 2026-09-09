import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../api/http.js";
import { coachErrorMessage, generatePalette, getCoachStatus } from "../../api/coachApi.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import { CUSTOM_PALETTE_ID } from "../../lib/customPalette.js";
import { loadCoachKey } from "../../lib/coachKeyPref.js";

const PALETTE_OPTIONS = [
  { value: "champ", label: "Champ" },
  { value: "iron", label: "Iron" },
  { value: "forest", label: "Forest" },
  { value: "crimson", label: "Crimson" },
  { value: "chill", label: "Chill" },
];

/* Starting points for the studio; each is a mood, not a colour name, so the
   result is a whole environment rather than "blue". */
const STUDIO_IDEAS = [
  "90s basement gym",
  "cold and clinical",
  "sunrise before work",
  "deep sea",
  "neon arcade",
  "old library",
];

const STUDIO_UNAVAILABLE = {
  no_consent: {
    title: "AI access is off",
    body: "Turn it on to describe a look. Only your words are sent, nothing about your training.",
    link: { to: "/profile/ai", label: "Open AI access" },
  },
  no_key: {
    title: "Not set up on this server yet",
    body: "You can use your own Anthropic key from Profile, AI access. It stays in this browser tab.",
    link: { to: "/profile/ai", label: "Add a key" },
  },
  not_entitled: {
    title: "Not included for your account yet",
    body: "You can still use your own Anthropic key from Profile, AI access.",
    link: { to: "/profile/ai", label: "Add a key" },
  },
  bad_key_format: {
    title: "Your saved key doesn't look right",
    body: "Anthropic keys start with sk-ant-. Check it under Profile, AI access.",
    link: { to: "/profile/ai", label: "Check the key" },
  },
};

function paletteErrorMessage(err) {
  if (err instanceof ApiError) {
    const body = err.body || {};
    if (body.error === "palette_invalid") {
      return "That one didn't come out readable. Try describing it a different way.";
    }
    if (body.error === "palette_refused") return "The model passed on that one. Try different words.";
    if (body.reason === "no_consent") return coachErrorMessage("no_consent");
    if (body.reason) return coachErrorMessage(body.reason);
    if (body.error) return coachErrorMessage(body.error);
    if (err.status === 429) return coachErrorMessage("rate_limited");
  }
  if (err && err.name === "TypeError") return coachErrorMessage("network");
  return coachErrorMessage("provider_error", "Couldn't make that palette. Try again.");
}

/** Six-chip strip showing a palette's light and dark halves side by side. */
function PaletteStrip({ palette, label }) {
  const rows = [
    ["light", palette.light],
    ["dark", palette.dark],
  ];
  return (
    <div className="palette-strip" aria-label={label}>
      {rows.map(([mode, values]) => (
        <div key={mode} className="palette-strip__row" data-mode={mode}>
          <span className="palette-strip__chip" style={{ background: values.bg }} />
          <span className="palette-strip__chip" style={{ background: values.surface1 }} />
          <span className="palette-strip__chip" style={{ background: values.surface3 }} />
          <span
            className="palette-strip__chip palette-strip__chip--accent"
            style={{ background: values.interactive }}
          />
          <span className="palette-strip__mode">{mode}</span>
        </div>
      ))}
    </div>
  );
}

export function AppearancePage() {
  const {
    theme,
    setTheme,
    palette,
    setPalette,
    resolved,
    customPalette,
    setCustomPalette,
    preview,
    previewPalette,
  } = useTheme();

  const inputId = useId();
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastDescription, setLastDescription] = useState("");
  const abortRef = useRef(false);
  const byoKey = loadCoachKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus({ byoKey });
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatusFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [byoKey]);

  /* Leaving the page drops any unsaved preview so the app never stays
     dressed in a palette the lifter never kept. */
  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
      previewPalette(null);
    };
  }, [previewPalette]);

  const generate = useCallback(
    async (text) => {
      const trimmed = String(text ?? "").trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setError(null);
      setLastDescription(trimmed);
      try {
        const data = await generatePalette({ description: trimmed, byoKey });
        if (abortRef.current) return;
        if (data && data.palette) previewPalette(data.palette);
      } catch (err) {
        if (!abortRef.current) setError(paletteErrorMessage(err));
      } finally {
        if (!abortRef.current) setBusy(false);
      }
    },
    [busy, byoKey, previewPalette]
  );

  const onSubmit = (event) => {
    event.preventDefault();
    generate(description);
  };

  const keepPreview = () => {
    if (!preview) return;
    setCustomPalette(preview);
    previewPalette(null);
    setDescription("");
  };

  const discardPreview = () => {
    previewPalette(null);
  };

  const forgetCustom = () => {
    setCustomPalette(null);
  };

  const unavailable =
    status && !status.available ? STUDIO_UNAVAILABLE[status.reason || "no_key"] : null;
  const studioReady = Boolean(status && status.available);
  const customSwatch = customPalette
    ? (resolved === "dark" ? customPalette.dark : customPalette.light).interactive
    : null;

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">Appearance</h1>
      </header>

      <section className="settings-section" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="settings-section-heading">
          Theme
        </h2>
        <div className="settings-group settings-group--tight">
          <p className="settings-group-hint muted small">Applies to this device only.</p>
          <div className="settings-theme-seg" role="radiogroup" aria-label="Theme">
            {[
              ["light", "Light"],
              ["dark", "Dark"],
              ["system", "System"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                className={`settings-theme-seg__btn${theme === value ? " settings-theme-seg__btn--active" : ""}`}
                onClick={() => setTheme(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="settings-palette-block">
            <span className="settings-palette-block__label muted small">Accent color</span>
            <div className="settings-palette-grid" role="radiogroup" aria-label="Accent color">
              {PALETTE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={
                    "settings-palette-option" +
                    (palette === option.value && !preview ? " settings-palette-option--selected" : "")
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
                    checked={palette === option.value && !preview}
                    onChange={() => {
                      previewPalette(null);
                      setPalette(option.value);
                    }}
                  />
                </label>
              ))}
              {customPalette ? (
                <label
                  className={
                    "settings-palette-option settings-palette-option--custom" +
                    (palette === CUSTOM_PALETTE_ID && !preview
                      ? " settings-palette-option--selected"
                      : "")
                  }
                >
                  <span
                    className="settings-palette-swatch"
                    style={{ background: customSwatch }}
                    aria-hidden="true"
                  />
                  <span className="settings-palette-option__label">
                    {customPalette.name}
                    <span className="settings-palette-option__tag">Yours</span>
                  </span>
                  <input
                    type="radio"
                    name="palette"
                    value={CUSTOM_PALETTE_ID}
                    checked={palette === CUSTOM_PALETTE_ID && !preview}
                    onChange={() => {
                      previewPalette(null);
                      setPalette(CUSTOM_PALETTE_ID);
                    }}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-studio-heading">
        <h2 id="settings-studio-heading" className="settings-section-heading">
          Make your own
        </h2>
        <div className="settings-group palette-studio" data-busy={busy ? "true" : undefined}>
          <div className="palette-studio__intro">
            <p className="palette-studio__lede">
              Describe a look and the whole app takes it on: surfaces, accent, and the scene
              behind them. You see it live before you keep it.
            </p>
          </div>

          {unavailable ? (
            <div className="palette-studio__blocked">
              <p className="palette-studio__blocked-title">{unavailable.title}</p>
              <p className="muted small">{unavailable.body}</p>
              <Link to={unavailable.link.to} className="btn btn-secondary btn--compact">
                {unavailable.link.label}
              </Link>
            </div>
          ) : null}

          {statusFailed ? (
            <p className="palette-studio__blocked muted small">
              Couldn't check whether the studio is available. Reload to try again.
            </p>
          ) : null}

          {status && !unavailable ? (
            <form className="palette-studio__form" onSubmit={onSubmit}>
              <label htmlFor={inputId} className="palette-studio__label">
                Describe a look
              </label>
              <div className="palette-studio__row">
                <input
                  id={inputId}
                  type="text"
                  className="palette-studio__input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="a 90s basement gym"
                  maxLength={200}
                  autoComplete="off"
                  disabled={busy}
                />
                <button
                  type="submit"
                  className="btn btn-primary palette-studio__go"
                  disabled={busy || !description.trim()}
                >
                  {busy ? (
                    <>
                      <span className="palette-studio__spinner" aria-hidden="true" />
                      Mixing
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
              <div className="palette-studio__ideas" aria-label="Ideas">
                {STUDIO_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    className="palette-studio__idea"
                    disabled={busy}
                    onClick={() => {
                      setDescription(idea);
                      generate(idea);
                    }}
                  >
                    {idea}
                  </button>
                ))}
              </div>
              {status.source === "mock" && import.meta.env.DEV ? (
                <p className="muted small palette-studio__note">
                  This server is in mock mode: palettes come from a formula, not a model.
                </p>
              ) : null}
            </form>
          ) : null}

          {!status && !statusFailed ? (
            <p className="palette-studio__blocked muted small">Checking availability...</p>
          ) : null}

          {error ? (
            <p className="palette-studio__error" role="alert">
              {error}
            </p>
          ) : null}

          {preview ? (
            <div className="palette-studio__result" role="status">
              <div className="palette-studio__result-head">
                <div className="palette-studio__result-title">
                  <span className="palette-studio__result-kicker">Previewing</span>
                  <strong>{preview.name}</strong>
                  {lastDescription ? (
                    <span className="muted small">from &ldquo;{lastDescription}&rdquo;</span>
                  ) : null}
                </div>
                <PaletteStrip palette={preview} label={`${preview.name} swatches`} />
              </div>
              <p className="muted small palette-studio__result-hint">
                Look around the app while it's on. Keep it and it joins your accent colors on
                this device; discard and everything goes back.
              </p>
              <div className="palette-studio__actions">
                <button type="button" className="btn btn-primary" onClick={keepPreview}>
                  Keep this look
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || !lastDescription}
                  onClick={() => generate(lastDescription)}
                >
                  Try another
                </button>
                <button type="button" className="btn btn-ghost" onClick={discardPreview}>
                  Discard
                </button>
              </div>
            </div>
          ) : null}

          {customPalette && !preview && studioReady ? (
            <div className="palette-studio__saved">
              <PaletteStrip palette={customPalette} label={`${customPalette.name} swatches`} />
              <div className="palette-studio__saved-text">
                <strong>{customPalette.name}</strong>
                <span className="muted small">Saved on this device</span>
              </div>
              <button type="button" className="btn btn-ghost btn--compact" onClick={forgetCustom}>
                Forget
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
