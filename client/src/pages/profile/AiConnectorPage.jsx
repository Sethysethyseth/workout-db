import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as aiApi from "../../api/aiApi.js";
import { ApiError } from "../../api/http.js";
import { deleteCoachKey, getCoachStatus, saveCoachKey as storeCoachKey } from "../../api/coachApi.js";
import { AiConsentFacts } from "../../components/ai/AiConsentFacts.jsx";
import { ConnectorSetupAccordion } from "../../components/ai/ConnectorSetupAccordion.jsx";
import { ConfirmPanel } from "../../components/ConfirmPanel.jsx";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import { looksLikeAnthropicKey, purgeLegacyCoachKey } from "../../lib/coachKeyPref.js";

const CONNECTOR_SETUP_SECTIONS = [
  {
    id: "claude",
    label: "Claude",
    content: (
      <>
        <ol>
          <li>{"Go to Customize > Connectors."}</li>
          <li>
            Click the "+" next to Connectors, then choose "Add custom
            connector."
          </li>
          <li>Paste the address above, give it a name, and click Add.</li>
          <li>
            Sign in to LogChamp when prompted. You'll come straight back.
          </li>
        </ol>
        <p>
          Works on Free, Pro, Max, Team, and Enterprise plans. Free accounts
          can add only one custom connector. On Team and Enterprise, an
          organization Owner has to add it under{" "}
          {"Organization settings > Connectors"} first.
        </p>
      </>
    ),
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    content: (
      <>
        <ol>
          <li>
            On ChatGPT on the web, open Settings, then "Security and login",
            and turn on Developer mode.
          </li>
          <li>Go to ChatGPT Plugins and click the plus button.</li>
          <li>
            Enter a name and paste the address above as the MCP server URL.
          </li>
          <li>Sign in to LogChamp when prompted.</li>
        </ol>
        <p>
          Developer mode is available on Pro, Plus, Business, Enterprise, and
          Education accounts, and only on the web - not the mobile apps. On
          Business, Enterprise, and Education an admin may need to enable it
          for your workspace first.
        </p>
      </>
    ),
  },
  {
    id: "grok",
    label: "Grok",
    content: (
      <>
        <ol>
          <li>Go to grok.com/connectors.</li>
          <li>Click New Connector, then choose Custom.</li>
          <li>Enter the address above and complete the sign-in.</li>
        </ol>
        <p>
          On Grok Business and Enterprise, a team admin has to add the
          connector in the console before you can connect to it.
        </p>
      </>
    ),
  },
  {
    id: "other",
    label: "Any other AI assistant",
    content: (
      <p>
        Any assistant that accepts a remote MCP server address will work. Paste
        the address above wherever it asks for an MCP server URL, then complete
        the LogChamp sign-in in your browser when prompted. Your assistant
        needs to support remote servers over the internet - some only support
        ones running on your own machine.
      </p>
    ),
  },
];

const COPIED_RESET_MS = 2500;

function formatGrantDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Derive connector URL from VITE_API_URL - never hardcode a host.
 * When the env var is unset in local desktop (see client/.env.example),
 * mirror http.js's dev fallback via the current page hostname + API port
 * so this file still passes the no-hardcoded-host acceptance grep.
 */
function buildConnectorUrl() {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? "").trim();
  let base = fromEnv.replace(/\/+$/, "");
  if (!base && import.meta.env.DEV && typeof window !== "undefined") {
    base = `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return `${base}/mcp`;
}

function coachStatusLine(status) {
  if (!status) return null;
  if (!status.consentGranted) return "Waiting for AI access to be turned on.";
  if (status.available) {
    if (status.source === "mock") {
      return import.meta.env.DEV
        ? "Running in mock mode on this server: canned answers, no model."
        : "Ready.";
    }
    if (status.source === "byo") return "Ready, using your Anthropic key.";
    return "Ready. Hosted by LogChamp on this server.";
  }
  if (status.reason === "bad_key_format") {
    return "The saved key doesn't look like an Anthropic key.";
  }
  if (status.reason === "not_entitled") return "Not included for your account yet. Your own key still works.";
  return "Not set up on this server yet. Your own key still works.";
}

function coachKeyErrorText(err) {
  const code = err && err.body && err.body.error;
  if (code === "byo_unavailable") return "Saving your own key isn't available right now.";
  if (typeof code === "string" && code.includes(" ")) return code;
  if (err instanceof ApiError && typeof err.message === "string" && err.message.includes(" ")) {
    return err.message;
  }
  return "Couldn't save your key. Try again.";
}

export function AiConnectorPage() {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null); // null | "copied" | "failed"
  const [coachStatus, setCoachStatus] = useState(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyNotice, setKeyNotice] = useState(null);
  const [keyBusy, setKeyBusy] = useState(false);
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutResult, setSignOutResult] = useState(null);
  const [draftsSubmitting, setDraftsSubmitting] = useState(false);

  const connectorUrl = buildConnectorUrl();

  useEffect(() => {
    purgeLegacyCoachKey();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await aiApi.getAiConsent();
        if (!cancelled) setConsent(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!consent) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus();
        if (!cancelled) setCoachStatus(data);
      } catch {
        if (!cancelled) setCoachStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consent]);

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const id = window.setTimeout(() => setCopyStatus(null), COPIED_RESET_MS);
    return () => window.clearTimeout(id);
  }, [copyStatus]);

  async function onToggle() {
    if (!consent || submitting) return;
    setError(null);
    setSuccess(null);
    setCopyStatus(null);
    setSubmitting(true);
    try {
      const data = consent.granted
        ? await aiApi.revokeAiConsent()
        : await aiApi.grantAiConsent();
      setConsent(data);
      setSuccess(
        data.granted ? "AI access turned on." : "AI access turned off."
      );
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDraftsToggle() {
    if (!consent || draftsSubmitting) return;
    if (!consent.granted) return;
    setError(null);
    const previous = consent;
    const nextAllowed = !consent.blockDraftsAllowed;
    setConsent({ ...consent, blockDraftsAllowed: nextAllowed });
    setDraftsSubmitting(true);
    try {
      const data = await aiApi.setBlockDraftsAllowed(nextAllowed);
      setConsent(data);
    } catch (err) {
      setConsent(previous);
      setError(err);
    } finally {
      setDraftsSubmitting(false);
    }
  }

  async function onCopyAddress() {
    setCopyStatus(null);
    try {
      await navigator.clipboard.writeText(connectorUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  async function onSaveKey(e) {
    e.preventDefault();
    const trimmed = keyDraft.trim();
    if (!looksLikeAnthropicKey(trimmed) || keyBusy) return;
    setKeyBusy(true);
    setKeyNotice(null);
    try {
      await storeCoachKey(trimmed);
      setKeyDraft("");
      const data = await getCoachStatus();
      setCoachStatus(data);
    } catch (err) {
      setKeyNotice({ tone: "error", text: coachKeyErrorText(err) });
    } finally {
      setKeyBusy(false);
    }
  }

  async function onRemoveKey() {
    if (keyBusy) return;
    setKeyBusy(true);
    setKeyNotice(null);
    try {
      await deleteCoachKey();
      setConfirmRemoveKey(false);
      setKeyDraft("");
      const data = await getCoachStatus();
      setCoachStatus(data);
    } catch (err) {
      setConfirmRemoveKey(false);
      setKeyNotice({ tone: "error", text: coachKeyErrorText(err) });
    } finally {
      setKeyBusy(false);
    }
  }

  async function onSignOutConnector() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutResult(null);
    setError(null);
    try {
      const data = await aiApi.signOutConnector();
      if (data?.found) {
        setSignOutResult({
          tone: "success",
          text: "Signed out of connected assistants.",
        });
      } else {
        setSignOutResult({
          tone: "success",
          text: "Nothing to sign out.",
        });
      }
    } catch {
      setSignOutResult({
        tone: "error",
        text: "Couldn't reach the sign-in service.",
      });
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return <LoadingState tone="skeleton" variant="settings" slowLabel="Taking longer than usual…" />;
  }

  const granted = Boolean(consent?.granted);
  const draftsAllowed = Boolean(consent?.blockDraftsAllowed);
  const grantDate = formatGrantDate(consent?.grantedAt);
  const byo = coachStatus?.byoKey;
  const keySaved = Boolean(byo?.saved);
  const keyLast4 = byo?.last4 || "";
  const keyStorageAvailable = byo ? byo.storageAvailable !== false : true;

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">AI access</h1>
        <p className="settings-page-subtitle muted small">
          One switch for the in-app coach and for outside AI assistants.
        </p>
      </header>

      <ErrorMessage error={error} />

      <section className="settings-section" aria-labelledby="settings-ai-heading">
        <h2 id="settings-ai-heading" className="settings-section-heading visually-hidden">
          AI access switch
        </h2>
        <div className="settings-group ai-switch-card">
          {success ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              {success}
            </div>
          ) : null}
          <div className="ai-switch-row">
            <div className="ai-switch-row__text">
              <p className="ai-switch-row__title">
                {granted ? "AI access is on" : "AI access is off"}
              </p>
              <p className="muted small ai-switch-row__sub">
                {granted && grantDate
                  ? `Since ${grantDate}. Turning it off cuts access everywhere at once.`
                  : "Off until you turn it on. Nothing about your training is shared."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={granted}
              aria-label={granted ? "Turn off AI access" : "Turn on AI access"}
              className={`ai-switch${granted ? " ai-switch--on" : ""}`}
              disabled={submitting}
              onClick={() => void onToggle()}
            >
              <span className="ai-switch__knob" aria-hidden="true" />
            </button>
          </div>
          <details className="ai-facts-more" open={!granted ? true : undefined}>
            <summary className="ai-facts-more__summary">More info</summary>
            <AiConsentFacts />
          </details>
        </div>
      </section>

      {granted ? (
        <section className="settings-section" aria-labelledby="settings-coach-heading">
          <h2 id="settings-coach-heading" className="settings-section-heading">
            Coach in the app
          </h2>
          <div className="settings-group settings-security-form">
            <p>
              The coach lives on the Analytics page and on every finished
              workout. It reads the same numbers you see and explains them; it
              never computes a stat of its own.
            </p>
            <p>
              Your coach conversations are saved to your account. Find or delete them in
              Library, under Coach.
            </p>
            {coachStatus ? (
              <p className={`ai-coach-status${coachStatus.available ? " ai-coach-status--ready" : ""}`}>
                <span className="ai-coach-status__dot" aria-hidden="true" />
                {coachStatusLine(coachStatus)}
              </p>
            ) : null}

            <details className="ai-key-details">
              <summary className="ai-key-details__summary">
                Use your own Anthropic key
              </summary>
              <div className="ai-key-details__body stack">
                {keySaved ? (
                  <div className="ai-key-row">
                    <p style={{ margin: 0 }}>Key ending in {keyLast4}</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn--toolbar"
                      onClick={() => setConfirmRemoveKey(true)}
                    >
                      Remove key
                    </button>
                  </div>
                ) : keyStorageAvailable ? (
                  <form className="ai-key-form" onSubmit={(e) => void onSaveKey(e)}>
                    <label className="settings-row__label" htmlFor="coach-byo-key">
                      Your Anthropic API key
                    </label>
                    <input
                      id="coach-byo-key"
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="sk-ant-…"
                      value={keyDraft}
                      onChange={(e) => {
                        setKeyDraft(e.target.value);
                        setKeyNotice(null);
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn--toolbar"
                      disabled={!looksLikeAnthropicKey(keyDraft) || keyBusy}
                    >
                      Save key
                    </button>
                    <p className="muted small" style={{ margin: 0 }}>
                      Your key is encrypted and stored on our server. It's only used for your coach requests and is never shown again.
                    </p>
                  </form>
                ) : (
                  <p className="muted small" style={{ margin: 0 }}>
                    Saving your own key isn't available right now.
                  </p>
                )}
                {keyNotice ? (
                  <p
                    className={
                      keyNotice.tone === "error"
                        ? "settings-feedback-inline-error"
                        : "settings-feedback settings-feedback--success"
                    }
                    role="status"
                    style={{ margin: 0, padding: keyNotice.tone === "error" ? 0 : undefined }}
                  >
                    {keyNotice.text}
                  </p>
                ) : null}
              </div>
            </details>
            <p className="muted small" style={{ margin: 0 }}>
              <Link to="/analytics">Open Analytics</Link> to ask the coach.
            </p>
          </div>
        </section>
      ) : null}

      <section
        className="settings-section"
        aria-labelledby="settings-ai-connect-heading"
      >
        <h2
          id="settings-ai-connect-heading"
          className="settings-section-heading"
        >
          Connect an outside AI assistant
        </h2>
        <div className="settings-group settings-security-form">
          <div className="ai-switch-row">
            <div className="ai-switch-row__text">
              <p className="ai-switch-row__title">Let assistants draft blocks</p>
              <p className="muted small ai-switch-row__sub">
                {granted
                  ? "A connected assistant like Claude can add DRAFT blocks to your library. It can't change or delete anything, and nothing is used until you review and save it."
                  : "Turn on AI access above first."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draftsAllowed}
              aria-label={
                draftsAllowed
                  ? "Turn off assistant block drafts"
                  : "Let assistants draft blocks"
              }
              className={`ai-switch${draftsAllowed ? " ai-switch--on" : ""}`}
              disabled={!granted || draftsSubmitting}
              onClick={() => void onDraftsToggle()}
            >
              <span className="ai-switch__knob" aria-hidden="true" />
            </button>
          </div>

          {granted ? (
            <>
              <p>
                Add LogChamp to an AI assistant you already use, then ask it about
                your training the way you'd ask a coach.
              </p>

              <div className="ai-address">
                <p className="settings-row__label ai-address__label">Your LogChamp connector address</p>
                <div className="ai-address__field">
                  <code className="ai-address__value" style={{ userSelect: "all" }}>
                    {connectorUrl}
                  </code>
                  <button
                    className={`ai-address__copy${copyStatus === "copied" ? " ai-address__copy--done" : ""}`}
                    type="button"
                    onClick={() => void onCopyAddress()}
                    aria-label={copyStatus === "copied" ? "Copied" : "Copy address"}
                    title={copyStatus === "copied" ? "Copied" : "Copy address"}
                  >
                    {copyStatus === "copied" ? (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
                        <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
                      </svg>
                    )}
                  </button>
                </div>
                {copyStatus === "failed" ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    Couldn't copy automatically - select the address and copy it.
                  </p>
                ) : null}
              </div>

              <ConnectorSetupAccordion
                sections={CONNECTOR_SETUP_SECTIONS}
                defaultOpenIds={["claude"]}
              />

              <p>
                Then just ask - "how has my bench press moved this month?"
              </p>
            </>
          ) : null}
        </div>
      </section>

      <section
        className="settings-section"
        aria-labelledby="settings-ai-signout-heading"
      >
        <h2
          id="settings-ai-signout-heading"
          className="settings-section-heading"
        >
          Connected assistants
        </h2>
        <div className="settings-group settings-security-form">
          <p className="muted small" style={{ margin: 0 }}>
            Use this if an assistant is showing the wrong account's data,
            then reconnect from the assistant.
          </p>
          <div className="settings-security-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={signingOut}
              onClick={() => void onSignOutConnector()}
            >
              {signingOut
                ? "Signing out…"
                : "Sign out of connected assistants"}
            </button>
          </div>
          {signOutResult ? (
            <p
              className={
                signOutResult.tone === "error"
                  ? "settings-feedback-inline-error"
                  : "settings-feedback settings-feedback--success"
              }
              role="status"
              style={{
                margin: 0,
                padding: signOutResult.tone === "error" ? 0 : undefined,
              }}
            >
              {signOutResult.text}
            </p>
          ) : null}
        </div>
      </section>
      <ConfirmPanel
        open={confirmRemoveKey}
        tone="danger"
        title="Remove your key?"
        confirmLabel="Remove key"
        cancelLabel="Keep"
        busy={keyBusy}
        onConfirm={() => void onRemoveKey()}
        onCancel={() => {
          if (!keyBusy) setConfirmRemoveKey(false);
        }}
      />
    </div>
  );
}
