const express = require("express");
const session = require("express-session");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.use(
  session({
    name: "workoutdb.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use("/", routes);

app.use(errorHandler);

module.exports = app;const express = require("express");
const session = require("express-session");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

app.use(
  session({
    name: "workoutdb.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use("/", routes);

app.use(errorHandler);

module.exports = app;