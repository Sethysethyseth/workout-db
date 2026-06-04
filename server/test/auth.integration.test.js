const bcrypt = require("bcrypt");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { register, login } = require("./helpers/authTestHelpers");

function uniqueEmail() {
  const name = (expect.getState().currentTestName || "test")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${name}@example.com`;
}

describe("Auth integration", () => {
  test("register user successfully", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";
    const username = "Test_User-1";

    const res = await register(agent, { email, password, username });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", email);
    expect(res.body.user).toHaveProperty("displayName", username);
    expect(res.body.user).toHaveProperty("usernameKey", "test_user-1");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  test("login user successfully with email", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const logoutRes = await agent.post("/auth/logout").send();
    expect(logoutRes.status).toBe(204);

    const res = await login(agent, { email, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", email);
  });

  test("login user successfully with username", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";
    const username = "LiftKing";

    const registerRes = await register(agent, { email, password, username });
    expect(registerRes.status).toBe(201);

    await agent.post("/auth/logout").send();

    const res = await login(agent, { login: "liftking", password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  test("logout user successfully", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const res = await agent.post("/auth/logout").send();
    expect(res.status).toBe(204);

    const meRes = await agent.get("/auth/me").send();
    expect(meRes.status).toBe(401);
    expect(meRes.body).toEqual({ error: "Authentication required" });
  });

  test("get current user with GET /auth/me after login", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const res = await agent.get("/auth/me").send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", email);
    expect(res.body.user.usernameKey).toBeTruthy();
  });

  test("POST /auth/username backfills legacy account without usernameKey", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();
    const password = "password123";
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, passwordHash },
    });

    const loginRes = await login(agent, { email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.usernameKey).toBeNull();

    const setRes = await agent.post("/auth/username").send({ username: "LegacyUser" });
    expect(setRes.status).toBe(200);
    expect(setRes.body.user.displayName).toBe("LegacyUser");
    expect(setRes.body.user.usernameKey).toBe("legacyuser");
  });

  test("verify unauthenticated access fails where expected (protected endpoint returns 401)", async () => {
    const unauthenticated = request.agent(app);

    const res = await unauthenticated.get("/templates/mine").send();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  test("PATCH /auth/password updates password when current password is correct", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const patchRes = await agent.patch("/auth/password").send({
      currentPassword: password,
      newPassword: "newpassword456",
    });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toEqual({ ok: true });

    await agent.post("/auth/logout").send();

    const oldLogin = await login(agent, { email, password: password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(agent, { email, password: "newpassword456" });
    expect(newLogin.status).toBe(200);
  });

  test("PATCH /auth/password rejects wrong current password", async () => {
    const agent = request.agent(app);
    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const patchRes = await agent.patch("/auth/password").send({
      currentPassword: "wrong",
      newPassword: "newpassword456",
    });
    expect(patchRes.status).toBe(400);
    expect(patchRes.body).toEqual({ error: "Current password is incorrect" });
  });

  test("PATCH /auth/password requires authentication", async () => {
    const agent = request.agent(app);
    const patchRes = await agent.patch("/auth/password").send({
      currentPassword: "x",
      newPassword: "yyyyyyyy",
    });
    expect(patchRes.status).toBe(401);
  });
});
