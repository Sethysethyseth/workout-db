/**
 * Coach configuration from the server environment. Read at call time (not
 * module load) so tests and the status endpoint always see the live values.
 *
 * COACH_API_KEY is the app's OWN provider key - a deliberate app-billing
 * choice (analytics spec section 8), distinct from any developer tooling
 * credentials. COACH_PROVIDER=mock streams a canned answer with no key.
 */

const DEFAULT_MODEL = "claude-sonnet-5";
const CURSOR_DEFAULT_MODEL = "auto";
const DEFAULT_EFFORT = "medium";
const EFFORT_LEVELS = new Set(["low", "medium", "high", "xhigh", "max"]);
// Adaptive thinking on Sonnet 5 shares this ceiling with the visible
// answer: max_tokens is a hard cap on thinking PLUS response text. An
// unused ceiling costs nothing (billing follows emitted tokens, not the
// cap). Do not lower this to "save" budget - 1500 truncates after thought.
const MAX_TOKENS = 8000;

function resolveProvider(raw) {
  const providerRaw = (raw || "").trim().toLowerCase();
  if (providerRaw === "mock") return "mock";
  if (providerRaw === "cursor") return "cursor";
  return "anthropic";
}

function defaultModelFor(provider) {
  return provider === "cursor" ? CURSOR_DEFAULT_MODEL : DEFAULT_MODEL;
}

function getCoachConfig(env = process.env) {
  const hostedKey = (env.COACH_API_KEY || "").trim() || null;
  const provider = resolveProvider(env.COACH_PROVIDER);
  const modelRaw = (env.COACH_MODEL || "").trim();
  const model = modelRaw || defaultModelFor(provider);
  const effortRaw = (env.COACH_EFFORT || "").trim().toLowerCase();
  const effort = EFFORT_LEVELS.has(effortRaw) ? effortRaw : DEFAULT_EFFORT;
  return {
    provider,
    hostedKey,
    model,
    effort,
    maxTokens: MAX_TOKENS,
    modelExplicit: Boolean(modelRaw),
  };
}

module.exports = {
  getCoachConfig,
  DEFAULT_MODEL,
  CURSOR_DEFAULT_MODEL,
  DEFAULT_EFFORT,
  EFFORT_LEVELS,
  defaultModelFor,
};
