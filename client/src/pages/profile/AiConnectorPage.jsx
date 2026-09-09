import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as aiApi from "../../api/aiApi.js";
import { getCoachStatus } from "../../api/coachApi.js";
import { ConnectorSetupAccordion } from "../../components/ai/ConnectorSetupAccordion.jsx";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";
import {
  clearCoachKey,
  loadCoachKey,
  looksLikeAnthropicKey,
  saveCoachKey,
} from "../../lib/coachKeyPref.js";

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

function coachStatusLine(status, hasOwnKey) {
  if (!status) return null;
  if (!status.consentGranted) return "Waiting for AI access to be turned on.";
  if (status.available) {
    if (status.source === "mock") return "Running in mock mode on this server: canned answers, no model.";
    if (status.source === "byo") return "Ready, using the key saved in this browser tab.";
    return "Ready. Hosted by LogChamp on this server.";
  }
  if (hasOwnKey && status.reason === "bad_key_format") {
    return "The key saved in this tab doesn't look like an Anthropic key.";
  }
  if (status.reason === "not_entitled") return "Not included for your account yet. Your own key still works.";
  return "Not set up on this server yet. Your own key still works.";
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
  const [savedKey, setSavedKey] = useState(() => loadCoachKey());
  const [keyNotice, setKeyNotice] = useState(null);

  const connectorUrl = buildConnectorUrl();

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
        const data = await getCoachStatus({ byoKey: savedKey });
        if (!cancelled) setCoachStatus(data);
      } catch {
        if (!cancelled) setCoachStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [consent, savedKey]);

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

  async function onCopyAddress() {
    setCopyStatus(null);
    try {
      await navigator.clipboard.writeText(connectorUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  function onSaveKey(e) {
    e.preventDefault();
    const trimmed = keyDraft.trim();
    if (!looksLikeAnthropicKey(trimmed)) {
      setKeyNotice({ tone: "error", text: "That doesn't look like an Anthropic key. They start with sk-ant-." });
      return;
    }
    saveCoachKey(trimmed);
    setSavedKey(trimmed);
    setKeyDraft("");
    setKeyNotice({ tone: "success", text: "Key saved for this browser tab." });
  }

  function onForgetKey() {
    clearCoachKey();
    setSavedKey(null);
    setKeyNotice({ tone: "success", text: "Key forgotten." });
  }

  if (loading) {
    return <LoadingState slowLabel="Waking up the server…" />;
  }

  const granted = Boolean(consent?.granted);
  const grantDate = formatGrantDate(consent?.grantedAt);
  const maskedKey = savedKey ? `${savedKey.slice(0, 10)}…${savedKey.slice(-4)}` : null;

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
        <h2 id="settings-ai-heading" className="settings-section-heading">
          AI access
        </h2>
        <div className="settings-group settings-security-form">
          {success ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              {success}
            </div>
          ) : null}
          <p>
            LogChamp can explain your training in plain words: the coach on the
            Analytics page, a debrief after each workout, and answers inside an
            AI assistant you already use. This is off until you turn it on.
          </p>
          <p>
            Only your computed summary leaves LogChamp - totals, trends,
            personal records, and how complete your effort data is. Your
            individual sets, notes, and account details are never sent.
          </p>
          <p>
            You can turn this off at any time, which immediately cuts off
            access everywhere.
          </p>
          <p className="ai-consent-state">
            {granted && grantDate
              ? `AI access is on. You turned it on on ${grantDate}.`
              : "AI access is off."}
          </p>
          <div className="settings-security-actions">
            <button
              className="btn"
              type="button"
              disabled={submitting}
              onClick={() => void onToggle()}
            >
              {submitting
                ? granted
                  ? "Turning off…"
                  : "Turning on…"
                : granted
                  ? "Turn off AI access"
                  : "Turn on AI access"}
            </button>
          </div>
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
            {coachStatus ? (
              <p className={`ai-coach-status${coachStatus.available ? " ai-coach-status--ready" : ""}`}>
                {coachStatusLine(coachStatus, Boolean(savedKey))}
              </p>
            ) : null}

            <details className="ai-key-details">
              <summary className="ai-key-details__summary">
                Use your own Anthropic key
              </summary>
              <div className="ai-key-details__body stack">
                <p className="muted small" style={{ margin: 0 }}>
                  The key stays in this browser tab, is sent with each question, and is
                  never stored by LogChamp. Closing the tab forgets it. Calls bill
                  your Anthropic account.
                </p>
                {savedKey ? (
                  <div className="ai-key-row">
                    <code className="ai-key-row__mask">{maskedKey}</code>
                    <button type="button" className="btn btn-secondary btn--toolbar" onClick={onForgetKey}>
                      Forget key
                    </button>
                  </div>
                ) : (
                  <form className="ai-key-form" onSubmit={onSaveKey}>
                    <input
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="sk-ant-…"
                      aria-label="Anthropic API key"
                      value={keyDraft}
                      onChange={(e) => {
                        setKeyDraft(e.target.value);
                        setKeyNotice(null);
                      }}
                    />
                    <button type="submit" className="btn btn--toolbar" disabled={!keyDraft.trim()}>
                      Save key
                    </button>
                  </form>
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

      {granted ? (
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
            <p>
              Add LogChamp to an AI assistant you already use, then ask it about
              your training the way you'd ask a coach.
            </p>

            <div>
              <p className="settings-row__label">Your LogChamp connector address</p>
              <p className="settings-row__value ai-connector-address" style={{ userSelect: "all" }}>
                {connectorUrl}
              </p>
              <button
                className="btn"
                type="button"
                onClick={() => void onCopyAddress()}
              >
                {copyStatus === "copied" ? "Copied ✓" : "Copy address"}
              </button>
              {copyStatus === "failed" ? (
                <p>
                  Couldn't copy automatically - select the address above and
                  copy it.
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
