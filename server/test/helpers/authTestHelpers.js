const crypto = require("crypto");

/** Derive a unique, valid username from the test email (avoids collisions on shared DBs). */
function usernameFromEmail(email) {
  const hash = crypto.createHash("sha256").update(String(email)).digest("hex").slice(0, 6);
  const local = (String(email).split("@")[0] || "user")
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .slice(0, 18);
  return `u_${local}_${hash}`.slice(0, 30);
}

async function register(agent, { email, password, username }) {
  const res = await agent.post("/auth/register").send({
    email,
    password,
    username: username ?? usernameFromEmail(email),
  });
  return res;
}

async function login(agent, { login, password, email }) {
  const res = await agent.post("/auth/login").send({
    login: login ?? email,
    password,
  });
  return res;
}

async function registerAndLogin(agent, { email, password, username }) {
  const res = await register(agent, { email, password, username });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("user");
  expect(res.body.user).toHaveProperty("id");
  if (email) expect(res.body.user).toHaveProperty("email", email);
  return res.body.user;
}

module.exports = {
  usernameFromEmail,
  register,
  login,
  registerAndLogin,
};
