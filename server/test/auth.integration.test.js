const request = require("supertest");
const app = require("../src/app");

function uniqueEmail() {
  const name = (expect.getState().currentTestName || "test")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${name}@example.com`;
}

async function register(agent, { email, password }) {
  const res = await agent.post("/auth/register").send({ email, password });
  return res;
}

async function login(agent, { email, password }) {
  const res = await agent.post("/auth/login").send({ email, password });
  return res;
}

describe("Auth integration", () => {
  test("register user successfully", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const res = await register(agent, { email, password });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", email);
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  test("login user successfully", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    // Logout to ensure we're actually testing login behavior.
    const logoutRes = await agent.post("/auth/logout").send();
    expect(logoutRes.status).toBe(204);

    const res = await login(agent, { email, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", email);
  });

  test("logout user successfully", async () => {
    const agent = request.agent(app);

    const email = uniqueEmail();
    const password = "password123";

    const registerRes = await register(agent, { email, password });
    expect(registerRes.status).toBe(201);

    const res = await agent.post("/auth/logout").send();
    expect(res.status).toBe(204);

    // /auth/me is protected by authRequired, so unauth now should be 401.
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
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("email", email);
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

