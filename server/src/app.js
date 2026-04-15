const express = require("express");
const session = require("express-session");
const cors = require("cors");
const pg = require("pg");
const PgSession = require("connect-pg-simple")(session);
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is required in production");
}

// Render terminates TLS at the proxy/load balancer. This is required so:
// - req.secure is correct
// - secure cookies are allowed to be set
if (isProduction) {
  app.set("trust proxy", 1);
}

function normalizeOrigin(origin) {
  if (!origin) return origin;
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

const allowedOrigins = [
  normalizeOrigin(process.env.CLIENT_ORIGIN),
  normalizeOrigin(process.env.CLIENT_ORIGIN_MOBILE),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(normalizeOrigin(origin)))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

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
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/", routes);

app.use(errorHandler);

module.exports = app;