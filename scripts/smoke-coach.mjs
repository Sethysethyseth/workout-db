// Live proof of the in-app coach (Lane B) against a running API.
// Usage: node scripts/smoke-coach.mjs --help
//        node scripts/smoke-coach.mjs --run [--base <url>] [--email <email>]
//        [--password <password>] [--key sk-ant-...]
//
// No DB connection (so no dbHostGuard needed) - talks only to the HTTP API.
// Default host is the staging Render service already hardcoded in
// seed-staging-smoke.mjs. Credentials default to that script's smoke_b8
// account (override via flags or COACH_SMOKE_EMAIL / COACH_SMOKE_PASSWORD).
// Optional --key / COACH_SMOKE_KEY is sent as the x-coach-key BYO header.
//
// Logs in, then exercises GET /coach/status, two POST /coach/ask calls
// (range + session debrief), and POST /coach/palette. A stopReason of
// max_tokens is FAIL. No hosted key and no --key prints
// SKIPPED - coach unavailable (no_key) and exits 0.

const DEFAULT_BASE = "https://workout-db-staging.onrender.com";
const DEFAULT_EMAIL = "smoke-b8@example.com";
const DEFAULT_PASSWORD = "SmokeTest-B8-2026";
const BYO_KEY_HEADER = "x-coach-key";
const RANGE = { from: "2026-05-11", to: "2026-07-03" };

function usage() {
  const text = `Usage: node scripts/smoke-coach.mjs --run [options]
       node scripts/smoke-coach.mjs --help

Lane B live proof. Logs in, then GET /coach/status, POST /coach/ask
(range), POST /coach/ask (session debrief), POST /coach/palette.

Options:
  --run                Run the probe (required unless another option is set)
  --base <url>         API origin (default: ${DEFAULT_BASE})
  --email <email>      Smoke account (default: COACH_SMOKE_EMAIL or ${DEFAULT_EMAIL})
  --password <pw>      Smoke password (default: COACH_SMOKE_PASSWORD)
  --key sk-ant-...     Optional BYO Anthropic key, sent as ${BYO_KEY_HEADER}
                       (default: COACH_SMOKE_KEY)
  --help, -h           Print this usage and exit (no network)

No hosted key and no --key: SKIPPED - coach unavailable (no_key).
A stopReason of max_tokens is FAIL, not PASS.`;
  console.log(text);
}

function parseArgs(argv) {
  const out = {
    help: false,
    run: false,
    base: null,
    email: null,
    password: null,
    key: null,
  };
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
    else if (a === "--email") out.email = next();
    else if (a.startsWith("--email=")) out.email = a.slice("--email=".length);
    else if (a === "--password") out.password = next();
    else if (a.startsWith("--password=")) out.password = a.slice("--password=".length);
    else if (a === "--key") out.key = next();
    else if (a.startsWith("--key=")) out.key = a.slice("--key=".length);
    else {
      console.error(`Unknown option: ${a}`);
      usage();
      process.exit(1);
    }
  }
  return out;
}

function shouldRun(args) {
  return Boolean(
    args.run || args.base || args.email || args.password || args.key
  );
}

function parseSseBlock(raw) {
  let event = null;
  const dataLines = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (!event || dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

function parseSseBody(raw) {
  const events = [];
  const chunks = String(raw || "").split(/\r?\n\r?\n/);
  for (const chunk of chunks) {
    const evt = parseSseBlock(chunk);
    if (evt) events.push(evt);
  }
  return events;
}

async function api(base, method, path, { token, byoKey, body, accept } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(accept ? { Accept: accept } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(byoKey ? { [BYO_KEY_HEADER]: byoKey } : {}),
  };
  let res;
  try {
    res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      networkError: err && err.message ? err.message : String(err),
      json: null,
      text: "",
    };
  }
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text, networkError: null };
}

function printStep(status, name, detail) {
  console.log(`${status} ${name}`);
  if (detail) console.log(`  ${detail}`);
}

function askEvidence(events, jsonFallback) {
  const metaEvt = events.find((e) => e.event === "meta");
  const doneEvt = events.find((e) => e.event === "done");
  const errorEvt = events.find((e) => e.event === "error");
  const text = events
    .filter((e) => e.event === "delta" && e.data && typeof e.data.text === "string")
    .map((e) => e.data.text)
    .join("");
  const stopReason =
    doneEvt && doneEvt.data ? (doneEvt.data.stopReason ?? null) : null;
  return {
    meta: metaEvt ? metaEvt.data : jsonFallback,
    stopReason,
    chars: text.length,
    bytes: Buffer.byteLength(text, "utf8"),
    error: errorEvt ? errorEvt.data : null,
    text,
  };
}

async function consumeAsk(base, token, byoKey, body) {
  const res = await api(base, "POST", "/coach/ask", {
    token,
    byoKey,
    body,
    accept: "text/event-stream",
  });
  if (res.networkError) {
    return { fail: `network: ${res.networkError}`, evidence: null, skipped: null };
  }
  if (!res.ok) {
    const reason = res.json && (res.json.reason || res.json.error);
    if (reason === "no_key" || (res.json && res.json.error === "coach_unavailable")) {
      return { fail: null, evidence: null, skipped: "no_key" };
    }
    return {
      fail: `HTTP ${res.status}: ${JSON.stringify(res.json || res.text)}`,
      evidence: null,
      skipped: null,
    };
  }
  const events = parseSseBody(res.text);
  return { fail: null, evidence: askEvidence(events, res.json), skipped: null, events };
}

function reportAsk(name, result) {
  if (result.skipped === "no_key") {
    printStep("SKIPPED", name, "coach unavailable (no_key)");
    return "skipped";
  }
  if (result.fail) {
    printStep("FAIL", name, result.fail);
    return "fail";
  }
  const e = result.evidence;
  const bits = [
    `meta=${JSON.stringify(e.meta)}`,
    `stopReason=${JSON.stringify(e.stopReason)}`,
    `chars=${e.chars}`,
    `bytes=${e.bytes}`,
  ];
  if (e.error) bits.push(`error=${JSON.stringify(e.error)}`);
  if (e.stopReason === "max_tokens") {
    printStep("FAIL", name, `${bits.join(" ")} (truncated)`);
    return "fail";
  }
  if (e.error) {
    printStep("FAIL", name, bits.join(" "));
    return "fail";
  }
  printStep("PASS", name, bits.join(" "));
  return "pass";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !shouldRun(args)) {
    usage();
    process.exit(0);
  }

  const base = (args.base || DEFAULT_BASE).replace(/\/$/, "");
  const email = args.email || process.env.COACH_SMOKE_EMAIL || DEFAULT_EMAIL;
  const password =
    args.password || process.env.COACH_SMOKE_PASSWORD || DEFAULT_PASSWORD;
  const byoKey = args.key || process.env.COACH_SMOKE_KEY || null;

  let failures = 0;
  let skippedNoKey = false;

  const login = await api(base, "POST", "/auth/login", {
    body: { email, password },
  });
  if (login.networkError) {
    printStep("FAIL", "login", `network: ${login.networkError}`);
    process.exit(1);
  }
  if (!login.ok || !login.json || !login.json.token) {
    printStep(
      "FAIL",
      "login",
      `HTTP ${login.status}: ${JSON.stringify(login.json || login.text)}`
    );
    process.exit(1);
  }
  const token = login.json.token;
  printStep("PASS", "login", `user=${email}`);

  const status = await api(base, "GET", "/coach/status", { token, byoKey });
  if (status.networkError) {
    printStep("FAIL", "GET /coach/status", `network: ${status.networkError}`);
    process.exit(1);
  }
  if (!status.ok) {
    printStep(
      "FAIL",
      "GET /coach/status",
      `HTTP ${status.status}: ${JSON.stringify(status.json || status.text)}`
    );
    process.exit(1);
  }
  const st = status.json || {};
  const statusBits = `available=${st.available} reason=${JSON.stringify(st.reason)} source=${JSON.stringify(st.source)} model=${JSON.stringify(st.model)}`;
  if (st.available === false && st.reason === "no_key") {
    printStep("SKIPPED", "GET /coach/status", `coach unavailable (no_key) ${statusBits}`);
    skippedNoKey = true;
  } else if (st.available) {
    printStep("PASS", "GET /coach/status", statusBits);
  } else {
    printStep("FAIL", "GET /coach/status", statusBits);
    failures += 1;
  }

  if (skippedNoKey) {
    printStep("SKIPPED", "POST /coach/ask (range)", "coach unavailable (no_key)");
    printStep("SKIPPED", "POST /coach/ask (session)", "coach unavailable (no_key)");
    printStep("SKIPPED", "POST /coach/palette", "coach unavailable (no_key)");
    process.exit(0);
  }

  const rangeAsk = await consumeAsk(base, token, byoKey, {
    question: "How is my overall volume trending, and where am I strongest?",
    range: RANGE,
    unit: "lbs",
  });
  if (reportAsk("POST /coach/ask (range)", rangeAsk) === "fail") failures += 1;
  if (rangeAsk.skipped === "no_key") {
    printStep("SKIPPED", "POST /coach/ask (session)", "coach unavailable (no_key)");
    printStep("SKIPPED", "POST /coach/palette", "coach unavailable (no_key)");
    process.exit(0);
  }

  const mine = await api(base, "GET", "/sessions/mine", { token });
  const sessions =
    mine.ok && mine.json && Array.isArray(mine.json.sessions) ? mine.json.sessions : [];
  const sessionId = sessions.length > 0 ? sessions[0].id : null;
  if (!sessionId) {
    printStep("FAIL", "POST /coach/ask (session)", "no sessions on the smoke account");
    failures += 1;
  } else {
    const sessionAsk = await consumeAsk(base, token, byoKey, {
      question: "How did this workout go against my recent training?",
      focus: { type: "session", sessionId },
      unit: "lbs",
    });
    if (reportAsk("POST /coach/ask (session)", sessionAsk) === "fail") failures += 1;
    if (sessionAsk.skipped === "no_key") {
      printStep("SKIPPED", "POST /coach/palette", "coach unavailable (no_key)");
      process.exit(0);
    }
  }

  const palette = await api(base, "POST", "/coach/palette", {
    token,
    byoKey,
    body: { description: "a quiet forest gym at dusk" },
  });
  if (palette.networkError) {
    printStep("FAIL", "POST /coach/palette", `network: ${palette.networkError}`);
    failures += 1;
  } else if (!palette.ok) {
    const code = palette.json && palette.json.error;
    if (code === "coach_unavailable" || (palette.json && palette.json.reason === "no_key")) {
      printStep("SKIPPED", "POST /coach/palette", "coach unavailable (no_key)");
    } else {
      printStep(
        "FAIL",
        "POST /coach/palette",
        `HTTP ${palette.status} error=${JSON.stringify(code)} body=${JSON.stringify(palette.json || palette.text)}`
      );
      failures += 1;
    }
  } else {
    const record = palette.json && palette.json.palette;
    printStep(
      "PASS",
      "POST /coach/palette",
      `source=${JSON.stringify(palette.json && palette.json.source)} palette=${JSON.stringify(record)}`
    );
  }

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("FAIL uncaught:", err && err.message ? err.message : String(err));
  process.exit(1);
});
