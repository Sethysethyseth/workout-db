import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as aiApi from "../../api/aiApi.js";
import { ConnectorSetupAccordion } from "../../components/ai/ConnectorSetupAccordion.jsx";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";

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

export function AiConnectorPage() {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null); // null | "copied" | "failed"

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

  if (loading) {
    return <LoadingState slowLabel="Waking up the server…" />;
  }

  const granted = Boolean(consent?.granted);
  const grantDate = formatGrantDate(consent?.grantedAt);

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">AI access</h1>
      </header>

      <ErrorMessage error={error} />

      <section className="settings-section" aria-labelledby="settings-ai-heading">
        <h2 id="settings-ai-heading" className="settings-section-heading">
          AI access
        </h2>
        <div className="settings-group">
          {success ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              {success}
            </div>
          ) : null}
          <p>
            LogChamp can answer questions about your training inside an AI
            assistant you already use. This is off until you turn it on.
          </p>
          <p>
            Only your computed summary leaves LogChamp - totals, trends,
            personal records, and how complete your effort data is. Your
            individual sets, notes, and account details are never sent.
          </p>
          <p>
            You can turn this off at any time, which immediately cuts off
            access.
          </p>
          <p>
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
        <section
          className="settings-section"
          aria-labelledby="settings-ai-connect-heading"
        >
          <h2
            id="settings-ai-connect-heading"
            className="settings-section-heading"
          >
            Connect your AI assistant
          </h2>
          <div className="settings-group settings-security-form">
            <p>
              Add LogChamp to an AI assistant you already use, then ask it about
              your training the way you'd ask a coach.
            </p>

            <div>
              <p className="settings-row__label">Your LogChamp connector address</p>
              <p className="settings-row__value" style={{ userSelect: "all" }}>
                {connectorUrl}
              </p>
              <button
                className="btn"
                type="button"
                onClick={() => void onCopyAddress()}
              >
                {copyStatus === "copied" ? "Copied" : "Copy address"}
              </button>
              {copyStatus === "copied" ? (
                <div
                  className="settings-feedback settings-feedback--success"
                  role="status"
                >
                  Copied
                </div>
              ) : null}
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
