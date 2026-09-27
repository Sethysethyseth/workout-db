// Live proof of the Cursor-hosted coach adapter (CP1 / CP2).
// Usage: node scripts/smoke-cursor-coach.mjs --help
//        node scripts/smoke-cursor-coach.mjs [--key <CURSOR_API_KEY>]
//
// Calls cursorProvider.js directly - no HTTP server, no DB. Reads the key
// from CURSOR_API_KEY or --key. Streams the coach answer twice in one
// process (same inputs), then one palette completion through validatePalette.

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const coachDir = path.resolve(here, "..", "server", "src", "coach");
const serverRoot = path.resolve(here, "..", "server");
const { streamCursor, extractFirstJsonObject } = require(path.join(coachDir, "cursorProvider.js"));
const { validatePalette } = require(path.join(coachDir, "palette.js"));

function loadRealSdk() {
  const resolved = require.resolve("@cursor/sdk", { paths: [serverRoot] });
  return require(resolved);
}

function wrapSdk(realSdk) {
  let createCount = 0;
  const sdk = {
    ...realSdk,
    Agent: {
      ...realSdk.Agent,
      create: async (...args) => {
        createCount += 1;
        return realSdk.Agent.create(...args);
      },
    },
  };
  return {
    sdk,
    get createCount() {
      return createCount;
    },
  };
}

function usage() {
  const text = `Usage: node scripts/smoke-cursor-coach.mjs [options]

Live proof of server/src/coach/cursorProvider.js against a real Cursor key.
No HTTP server, no DB.

Options:
  --key <key>     Cursor user API key (default: CURSOR_API_KEY)
  --help, -h      Print this usage and exit (no network)

Streams the coach answer twice over a tiny fixture prompt (same inputs, one
process), prints deltas as they arrive, then a one-line verdict (systemPrompt
accepted vs inline fallback, model, total chars) and a RUN timing line per
coach run. Then one palette completion through validatePalette, with its own
RUN line.`;
  console.log(text);
}

function parseArgs(argv) {
  const out = { help: false, key: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--key") {
      i += 1;
      out.key = argv[i];
    } else if (a.startsWith("--key=")) {
      out.key = a.slice("--key=".length);
    } else {
      console.error(`Unknown option: ${a}`);
      usage();
      process.exit(1);
    }
  }
  return out;
}

function promptNote(systemPromptMode) {
  return systemPromptMode === "inline"
    ? "inline-fallback"
    : systemPromptMode === "accepted"
      ? "accepted"
      : systemPromptMode;
}

async function runCoachStream({ apiKey, sdk, system, messages, wrapper }) {
  const createsBefore = wrapper.createCount;
  const startedAt = Date.now();
  let ttftMs = null;
  let chars = 0;
  let systemPromptMode = "unknown";
  let model = "auto";
  let stopReason = null;
  let streamError = null;

  process.stdout.write("STREAM ");
  try {
    for await (const item of streamCursor({
      apiKey,
      model: "auto",
      system,
      messages,
      sdk,
    })) {
      if (item.type === "start") {
        if (item.model) model = item.model;
        if (item.systemPromptMode) systemPromptMode = item.systemPromptMode;
      } else if (item.type === "text") {
        if (ttftMs == null) ttftMs = Date.now() - startedAt;
        chars += item.text.length;
        process.stdout.write(item.text);
      } else if (item.type === "stop") {
        stopReason = item.stopReason;
        if (item.systemPromptMode) systemPromptMode = item.systemPromptMode;
      } else if (item.type === "error") {
        streamError = item;
      }
    }
  } catch (err) {
    console.log("");
    console.error(
      "FAIL stream:",
      err && err.message ? err.message : String(err),
      err && err.code ? `code=${err.code}` : ""
    );
    process.exit(1);
  }
  process.stdout.write("\n");
  if (streamError) {
    console.error("FAIL stream item:", JSON.stringify(streamError));
    process.exit(1);
  }

  return {
    systemPromptMode,
    model,
    chars,
    stopReason,
    agentRuns: wrapper.createCount - createsBefore,
    ttftMs,
    totalMs: Date.now() - startedAt,
  };
}

function printRunLine(label, result) {
  const ttft = result.ttftMs == null ? "none" : String(result.ttftMs);
  console.log(
    `RUN ${label} systemPrompt=${result.systemPromptMode} agentRuns=${result.agentRuns} ttft_ms=${ttft} total_ms=${result.totalMs}`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  const apiKey = (args.key || process.env.CURSOR_API_KEY || "").trim();
  if (!apiKey) {
    console.error("FAIL no key: pass --key or set CURSOR_API_KEY");
    process.exit(1);
  }

  const wrapper = wrapSdk(loadRealSdk());
  const sdk = wrapper.sdk;

  const system = [
    {
      type: "text",
      text: "You are a terse test coach. Reply in one short sentence. Invent nothing.",
    },
  ];
  const messages = [{ role: "user", content: "Reply with the single word pong." }];

  const first = await runCoachStream({ apiKey, sdk, system, messages, wrapper });
  console.log(
    `VERDICT systemPrompt=${promptNote(first.systemPromptMode)} model=${first.model} chars=${first.chars} stopReason=${first.stopReason}`
  );
  printRunLine("1", first);

  const second = await runCoachStream({ apiKey, sdk, system, messages, wrapper });
  console.log(
    `VERDICT systemPrompt=${promptNote(second.systemPromptMode)} model=${second.model} chars=${second.chars} stopReason=${second.stopReason}`
  );
  printRunLine("2", second);

  const paletteSystem = [
    {
      type: "text",
      text: [
        "You design colour palettes. Return ONLY one JSON object.",
        "Required keys: name (string), scene (one of champ, iron, forest, crimson, chill),",
        "light {interactive, interactiveHover, bg, surface1, surface2, surface3, border, inputBorder},",
        "dark {those eight plus btnPrimaryBg, btnPrimaryFg, btnPrimaryHoverBg, btnPrimaryActiveBg}.",
        "Every colour is a six-digit lowercase hex like #1a2b3c.",
        "Light surfaces near white (readable under #0f172a); dark surfaces near black (readable under #f1f5f9).",
        "No prose.",
      ].join(" "),
    },
  ];
  const paletteMessages = [{ role: "user", content: "Design a palette for: a quiet forest gym at dusk" }];
  const createsBeforePalette = wrapper.createCount;
  const paletteStartedAt = Date.now();
  let raw = "";
  let paletteMode = "unknown";
  let paletteTtftMs = null;
  try {
    for await (const item of streamCursor({
      apiKey,
      model: "auto",
      system: paletteSystem,
      messages: paletteMessages,
      sdk,
    })) {
      if (item.type === "start" && item.systemPromptMode) paletteMode = item.systemPromptMode;
      if (item.type === "text") {
        if (paletteTtftMs == null) paletteTtftMs = Date.now() - paletteStartedAt;
        raw += item.text;
      }
      if (item.type === "stop" && item.systemPromptMode) paletteMode = item.systemPromptMode;
      if (item.type === "error") {
        console.error("FAIL palette item:", JSON.stringify(item));
        process.exit(1);
      }
    }
  } catch (err) {
    console.error(
      "FAIL palette:",
      err && err.message ? err.message : String(err),
      err && err.code ? `code=${err.code}` : ""
    );
    process.exit(1);
  }

  const palette = {
    systemPromptMode: paletteMode,
    agentRuns: wrapper.createCount - createsBeforePalette,
    ttftMs: paletteTtftMs,
    totalMs: Date.now() - paletteStartedAt,
  };
  printRunLine("palette", palette);

  const extracted = extractFirstJsonObject(raw);
  if (!extracted) {
    console.log(`PALETTE validatePalette=fail errors=["The model did not return a palette."] chars=${raw.length}`);
    process.exit(1);
  }
  const validated = validatePalette(extracted);
  if (!validated.ok) {
    console.log(
      `PALETTE validatePalette=fail errors=${JSON.stringify(validated.errors.slice(0, 6))}`
    );
    process.exit(1);
  }
  console.log(
    `PALETTE validatePalette=pass name=${JSON.stringify(validated.palette.name)} scene=${validated.palette.scene}`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("FAIL uncaught:", err && err.message ? err.message : String(err));
  process.exit(1);
});
