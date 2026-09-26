// Repeatable connector probe (the August 14 live handshake, minus the
// browser OAuth step).
// Usage: node scripts/smoke-connector.mjs --help
//        node scripts/smoke-connector.mjs --run [--base <url>] [--token <jwt>]
//
// No DB connection (so no dbHostGuard needed) - talks only to the HTTP API.
// Default host is the staging Render service already hardcoded in
// seed-staging-smoke.mjs. Pass a WorkOS access token the operator already
// holds via --token or COACH_SMOKE_BEARER. This script does NOT drive the
// OAuth handshake (needs a browser).
//
// Unauthenticated first: GET /mcp must 401 with WWW-Authenticate carrying
// resource_metadata, and GET /.well-known/oauth-protected-resource must
// return the document. Then with the Bearer: initialize (protocol
// 2025-11-25, serverInfo.name logchamp), tools/list (exactly four tools),
// and one tools/call per tool. RateLimit-* headers are printed on the
// authenticated calls. No token: unauthenticated half, then
// SKIPPED - no bearer token.

const DEFAULT_BASE = "https://workout-db-staging.onrender.com";
const PROTOCOL = "2025-11-25";
const EXPECTED_TOOLS = [
  "get_training_summary",
  "get_exercise_detail",
  "list_exercises",
  "get_recent_sessions",
];
const RANGE = { from: "2026-05-11", to: "2026-07-03" };

function usage() {
  const text = `Usage: node scripts/smoke-connector.mjs --run [options]
       node scripts/smoke-connector.mjs --help

Lane A connector probe. Does not drive OAuth (needs a browser).

Options:
  --run                Run the probe (required unless another option is set)
  --base <url>         API origin (default: ${DEFAULT_BASE})
  --token <jwt>        WorkOS access token (default: COACH_SMOKE_BEARER)
  --help, -h           Print this usage and exit (no network)

No token: runs the unauthenticated half, then SKIPPED - no bearer token.`;
  console.log(text);
}

function parseArgs(argv) {
  const out = { help: false, run: false, base: null, token: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      i += 1;
      return argv[i];
    };
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--run") out.run = true;
    else if (a === "--base") out.base = next();
    else if (a.startsWith("--base=")) out.base = a.slice("--base=".length);
    else if (a === "--token") out.token = next();
    else if (a.startsWith("--token=")) out.token = a.slice("--token=".length);
    else {
      console.error(`Unknown option: ${a}`);
      usage();
      process.exit(1);
    }
  }
  return out;
}

function shouldRun(args) {
  return Boolean(args.run || args.base || args.token);
}

function printStep(status, name, detail) {
  console.log(`${status} ${name}`);
  if (detail) console.log(`  ${detail}`);
}

function collectRateLimitHeaders(res) {
  const found = {};
  for (const [key, value] of res.headers) {
    if (key.toLowerCase().startsWith("ratelimit")) found[key] = value;
  }
  return found;
}

async function httpGet(base, path, { token } = {}) {
  let res;
  try {
    res = await fetch(base + path, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      networkError: err && err.message ? err.message : String(err),
      json: null,
      text: "",
      headers: {},
      wwwAuthenticate: null,
    };
  }
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    json,
    text,
    networkError: null,
    headers: collectRateLimitHeaders(res),
    wwwAuthenticate: res.headers.get("www-authenticate"),
  };
}

let rpcId = 0;

async function mcpRpc(base, token, method, params) {
  rpcId += 1;
  const payload = { jsonrpc: "2.0", id: rpcId, method, params: params || {} };
  let res;
  try {
    res = await fetch(base + "/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
        "MCP-Protocol-Version": PROTOCOL,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      networkError: err && err.message ? err.message : String(err),
      json: null,
      headers: {},
    };
  }
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    json,
    text,
    networkError: null,
    headers: collectRateLimitHeaders(res),
  };
}

function summarizeToolResult(json) {
  if (!json) return { empty: true };
  if (json.error) {
    return { jsonrpcError: json.error };
  }
  const result = json.result || {};
  const block = Array.isArray(result.content) ? result.content[0] : null;
  const raw = block && typeof block.text === "string" ? block.text : null;
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (parsed && typeof parsed === "object") {
    const keys = Object.keys(parsed);
    const extra = {};
    if (Array.isArray(parsed.perExercise)) extra.perExercise = parsed.perExercise.length;
    if (Array.isArray(parsed.perMuscle)) extra.perMuscle = parsed.perMuscle.length;
    if (Array.isArray(parsed.exercises)) extra.exercises = parsed.exercises.length;
    if (Array.isArray(parsed.sessions)) extra.sessions = parsed.sessions.length;
    if (parsed.exerciseName || parsed.name) extra.name = parsed.exerciseName || parsed.name;
    if (parsed.error) extra.payloadError = parsed.error;
    return {
      isError: !!result.isError,
      keys,
      chars: raw.length,
      ...extra,
    };
  }
  return {
    isError: !!result.isError,
    chars: raw ? raw.length : 0,
    preview: raw ? raw.slice(0, 120) : null,
  };
}

function pickExerciseId(listResult) {
  const result = listResult && listResult.json && listResult.json.result;
  const block = result && Array.isArray(result.content) ? result.content[0] : null;
  const raw = block && typeof block.text === "string" ? block.text : null;
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.exercises)
      ? parsed.exercises
      : Array.isArray(parsed.roster)
        ? parsed.roster
        : [];
  for (const row of rows) {
    if (row && typeof row.exerciseId === "string" && row.exerciseId) return row.exerciseId;
    if (row && row.id && typeof row.id === "string" && row.id.startsWith("ex")) return row.id;
  }
  const first = rows[0];
  if (first && first.exerciseId) return String(first.exerciseId);
  if (first && first.userExerciseId != null) return { userExerciseId: first.userExerciseId };
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !shouldRun(args)) {
    usage();
    process.exit(0);
  }

  const base = (args.base || DEFAULT_BASE).replace(/\/$/, "");
  const token = args.token || process.env.COACH_SMOKE_BEARER || null;
  let failures = 0;

  const mcpGet = await httpGet(base, "/mcp");
  if (mcpGet.networkError) {
    printStep("FAIL", "GET /mcp (unauth)", `network: ${mcpGet.networkError}`);
    process.exit(1);
  }
  const www = mcpGet.wwwAuthenticate || "";
  const hasMeta = /resource_metadata/.test(www);
  if (mcpGet.status === 401 && hasMeta) {
    printStep(
      "PASS",
      "GET /mcp (unauth)",
      `HTTP 401 WWW-Authenticate=${www}`
    );
  } else {
    printStep(
      "FAIL",
      "GET /mcp (unauth)",
      `HTTP ${mcpGet.status} WWW-Authenticate=${JSON.stringify(www)} body=${JSON.stringify(mcpGet.json || mcpGet.text)}`
    );
    failures += 1;
  }

  const wellKnown = await httpGet(base, "/.well-known/oauth-protected-resource");
  if (wellKnown.networkError) {
    printStep(
      "FAIL",
      "GET /.well-known/oauth-protected-resource",
      `network: ${wellKnown.networkError}`
    );
    process.exit(1);
  }
  if (wellKnown.ok && wellKnown.json) {
    printStep(
      "PASS",
      "GET /.well-known/oauth-protected-resource",
      JSON.stringify(wellKnown.json)
    );
  } else {
    printStep(
      "FAIL",
      "GET /.well-known/oauth-protected-resource",
      `HTTP ${wellKnown.status} ${JSON.stringify(wellKnown.json || wellKnown.text)}`
    );
    failures += 1;
  }

  if (!token) {
    printStep("SKIPPED", "initialize", "no bearer token");
    printStep("SKIPPED", "tools/list", "no bearer token");
    for (const name of EXPECTED_TOOLS) {
      printStep("SKIPPED", `tools/call ${name}`, "no bearer token");
    }
    process.exit(failures > 0 ? 1 : 0);
  }

  const init = await mcpRpc(base, token, "initialize", {
    protocolVersion: PROTOCOL,
    capabilities: {},
    clientInfo: { name: "smoke-connector", version: "1.0.0" },
  });
  if (init.networkError) {
    printStep("FAIL", "initialize", `network: ${init.networkError}`);
    process.exit(1);
  }
  const initResult = init.json && init.json.result ? init.json.result : {};
  const protocol = initResult.protocolVersion;
  const serverName = initResult.serverInfo && initResult.serverInfo.name;
  const initBits = `protocolVersion=${JSON.stringify(protocol)} serverInfo=${JSON.stringify(initResult.serverInfo)} RateLimit=${JSON.stringify(init.headers)}`;
  if (init.ok && protocol === PROTOCOL && serverName === "logchamp") {
    printStep("PASS", "initialize", initBits);
  } else {
    printStep(
      "FAIL",
      "initialize",
      `HTTP ${init.status} ${initBits} body=${JSON.stringify(init.json || init.text)}`
    );
    failures += 1;
  }

  const listed = await mcpRpc(base, token, "tools/list", {});
  if (listed.networkError) {
    printStep("FAIL", "tools/list", `network: ${listed.networkError}`);
    process.exit(1);
  }
  const tools =
    listed.json && listed.json.result && Array.isArray(listed.json.result.tools)
      ? listed.json.result.tools
      : [];
  const names = tools.map((t) => t && t.name).filter(Boolean).sort();
  const expectedSorted = EXPECTED_TOOLS.slice().sort();
  const listBits = `tools=${JSON.stringify(names)} RateLimit=${JSON.stringify(listed.headers)}`;
  const sameLength = names.length === expectedSorted.length;
  const sameNames =
    sameLength && expectedSorted.every((n) => names.includes(n));
  if (listed.ok && sameNames && names.length === 4) {
    printStep("PASS", "tools/list", listBits);
  } else {
    printStep(
      "FAIL",
      "tools/list",
      `expected exactly ${JSON.stringify(expectedSorted)} ${listBits}`
    );
    failures += 1;
  }

  const listCall = await mcpRpc(base, token, "tools/call", {
    name: "list_exercises",
    arguments: { activeOnly: true },
  });
  if (listCall.networkError) {
    printStep("FAIL", "tools/call list_exercises", `network: ${listCall.networkError}`);
    process.exit(1);
  }
  printStep(
    listCall.ok ? "PASS" : "FAIL",
    "tools/call list_exercises",
    `shape=${JSON.stringify(summarizeToolResult(listCall.json))} RateLimit=${JSON.stringify(listCall.headers)}`
  );
  if (!listCall.ok) failures += 1;

  const picked = pickExerciseId(listCall);
  const detailArgs =
    picked && typeof picked === "object" && picked.userExerciseId != null
      ? { userExerciseId: picked.userExerciseId, ...RANGE }
      : { exerciseId: typeof picked === "string" ? picked : "unknown", ...RANGE };

  const calls = [
    {
      name: "get_training_summary",
      arguments: RANGE,
    },
    {
      name: "get_exercise_detail",
      arguments: detailArgs,
    },
    {
      name: "get_recent_sessions",
      arguments: { limit: 5 },
    },
  ];

  for (const call of calls) {
    const result = await mcpRpc(base, token, "tools/call", call);
    if (result.networkError) {
      printStep("FAIL", `tools/call ${call.name}`, `network: ${result.networkError}`);
      failures += 1;
      continue;
    }
    const ok = result.ok;
    printStep(
      ok ? "PASS" : "FAIL",
      `tools/call ${call.name}`,
      `shape=${JSON.stringify(summarizeToolResult(result.json))} RateLimit=${JSON.stringify(result.headers)}`
    );
    if (!ok) failures += 1;
  }

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FAIL uncaught:", err && err.message ? err.message : String(err));
  process.exit(1);
});
