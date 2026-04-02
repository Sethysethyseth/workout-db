const express = require("express");
const session = require("express-session");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use((req, res, next) => {
  console.log("[REQ]", req.method, req.headers.origin || "no-origin", req.url);
  next();
});

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN_MOBILE,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    name: "workoutdb.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use("/", routes);

app.use(errorHandler);

module.exports = app;