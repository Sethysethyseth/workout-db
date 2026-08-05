const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const routes = require("./routes");
const attachAuthUser = require("./middleware/attachAuthUser");
const connectorAuth = require("./middleware/connectorAuth");
const { handleMcpRequest } = require("./ai/mcpServer");
const {
  ipRateLimitKey,
  connectorRateLimitKey,
  aiRateLimitKey,
} = require("./ai/rateLimitKeys");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

/** Connector surface rate limit - generous for normal assistant use. */
const CONNECTOR_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const CONNECTOR_RATE_LIMIT_MAX = 300;

// Pre-auth ceiling for /mcp, per IP, counting FAILED requests only. This number
// is a deliberate scale-dependent choice, not a security threshold: it is a
// flood ceiling against a misbehaving client retrying a rejected token in a
// loop. It is NOT a credential-guessing defence (guessing a JWT signature is
// infeasible, so that is not the threat) and NOT a usage budget - the budget is
// CONNECTOR_RATE_LIMIT_MAX, keyed per identity behind connectorAuth. A 401 is a
// normal part of an OAuth expiry cycle, so revisit this if the connector ever
// has many concurrent users behind one egress IP.
const CONNECTOR_AUTH_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const CONNECTOR_AUTH_FAILURE_MAX = 600;

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

// Render terminates TLS at the proxy/load balancer. This is required so:
// - req.secure is correct
// - secure cookies are allowed to be set
if (isProduction) {
  app.set("trust proxy", 1);
}

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

function normalizeOrigin(origin) {
  if (!origin) return origin;
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** Comma-separated env values for production (and any other explicit) frontend origins. */
function originsFromEnv(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
}

function isAllowedVercelPreviewOrigin(origin) {
  try {
    const u = new URL(normalizeOrigin(origin));
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".vercel.app") &&
      u.hostname.startsWith("workout-")
    );
  } catch {
    return false;
  }
}

const allowedOrigins = [
  ...originsFromEnv(process.env.CLIENT_ORIGIN),
  ...originsFromEnv(process.env.CLIENT_ORIGIN_MOBILE),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function isConnectorCorsPath(path) {
  return (
    path.startsWith("/.well-known/") ||
    path === "/mcp" ||
    path.startsWith("/mcp/")
  );
}

// Narrow CORS for the Bearer-protected connector surface only. Any origin,
// no credentials (wildcard + credentials is a cross-origin data leak).
app.use((req, res, next) => {
  if (!isConnectorCorsPath(req.path)) return next();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, Accept, MCP-Protocol-Version"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  return next();
});

// Existing app CORS (cookie-authenticated surface). Options object is
// unchanged; wrapper skips the connector paths so arbitrary MCP client
// origins are not rejected by the allowlist after connector CORS runs.
const appCors = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(normalizeOrigin(origin)))
      return callback(null, true);
    if (isAllowedVercelPreviewOrigin(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});

app.use((req, res, next) => {
  if (isConnectorCorsPath(req.path)) return next();
  return appCors(req, res, next);
});

app.use(express.json());

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required — server cannot start without a persistent session store."
  );
}

const sessionStore = process.env.DATABASE_URL
  ? new PgSession({
      pool: new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ...(isProduction
          ? { ssl: { rejectUnauthorized: false } }
          : undefined),
      }),
      // Avoid creating a separate migrations system for sessions; pg-simple will
      // auto-create the table when needed.
      createTableIfMissing: true,
    })
  : undefined;

app.use(
  session({
    name: "workoutdb.sid",
    secret: process.env.SESSION_SECRET,
    ...(isProduction ? { proxy: true } : undefined),
    resave: false,
    saveUninitialized: false,
    ...(sessionStore ? { store: sessionStore } : undefined),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      // Cross-site cookie required for Vercel (frontend) -> Render (API) over HTTPS.
      sameSite: isProduction ? "none" : "lax",
      partitioned: isProduction ? true : undefined,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Attach req.authUserId from Bearer token (or session fallback).
app.use(attachAuthUser);

// Runs before connectorAuth, where no connector identity exists yet, so it can
// only key by IP. skipSuccessfulRequests keeps that tolerable: legitimate
// connector traffic returns 200 and consumes nothing here, so Anthropic's shared
// egress IPs do not land every user in one bucket.
const connectorAuthFailureRateLimit = rateLimit({
  windowMs: CONNECTOR_AUTH_FAILURE_WINDOW_MS,
  limit: CONNECTOR_AUTH_FAILURE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: ipRateLimitKey,
});

// The real connector budget. Mounted after connectorAuth so req.connectorUserId
// is populated when the key is derived.
const connectorRateLimit = rateLimit({
  windowMs: CONNECTOR_RATE_LIMIT_WINDOW_MS,
  limit: CONNECTOR_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: connectorRateLimitKey,
});

// Separate instance, so a connector flood cannot consume the /ai allowance.
const aiRateLimit = rateLimit({
  windowMs: CONNECTOR_RATE_LIMIT_WINDOW_MS,
  limit: CONNECTOR_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: aiRateLimitKey,
});

app.use("/mcp", connectorAuthFailureRateLimit);
app.use("/ai", aiRateLimit);

// MCP Streamable HTTP (2025-11-25): POST messages + GET SSE channel.
// connectorAuth sets req.connectorUserId; a fresh server is built per request.
app.all("/mcp", connectorAuth, connectorRateLimit, handleMcpRequest);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", routes);

app.use(errorHandler);

module.exports = app;
