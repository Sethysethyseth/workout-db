const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const routes = require("./routes");
const attachAuthUser = require("./middleware/attachAuthUser");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

/** Connector surface rate limit - generous for normal assistant use. */
const CONNECTOR_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const CONNECTOR_RATE_LIMIT_MAX = 300;

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

const connectorRateLimit = rateLimit({
  windowMs: CONNECTOR_RATE_LIMIT_WINDOW_MS,
  limit: CONNECTOR_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req) {
    const identity = req.connectorUserId ?? req.authUserId;
    if (identity) return `id:${identity}`;
    return `ip:${ipKeyGenerator(req.ip)}`;
  },
});

app.use("/mcp", connectorRateLimit);
app.use("/ai", connectorRateLimit);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", routes);

app.use(errorHandler);

module.exports = app;
