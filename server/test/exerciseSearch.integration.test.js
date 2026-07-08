const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers/authTestHelpers");

const BENCH = "Barbell Bench Press - Medium Grip";
const BENCH_CATALOG_ID = "Barbell_Bench_Press_-_Medium_Grip";
const CUSTOM_NAME = "Bulgarian Split Squat Custom";

describe("GET /exercises/search", () => {
  jest.setTimeout(30000);

  test("401 when unauthenticated", async () => {
    const res = await request(app).get("/exercises/search").query({ q: "bench" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "Authentication required",
    });
  });

  test("400 when q is missing or not a string", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-search-400@example.com",
      password: "password123",
    });

    const res = await agent.get("/exercises/search");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/q is required/);
  });

  test("happy path returns catalog and userExercise rows", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-search-happy@example.com",
      password: "password123",
    });

    const created = await agent.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.status).toBe(201);

    const res = await agent.get("/exercises/search").query({ q: "bench" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);

    const catalogRow = res.body.results.find((row) => row.source === "catalog");
    expect(catalogRow).toMatchObject({
      source: "catalog",
      exerciseId: BENCH_CATALOG_ID,
      userExerciseId: null,
      name: BENCH,
    });

    const customRes = await agent.get("/exercises/search").query({ q: "bulgarian" });
    expect(customRes.status).toBe(200);
    expect(customRes.body.results[0]).toMatchObject({
      source: "userExercise",
      exerciseId: null,
      userExerciseId: created.body.userExercise.id,
      name: CUSTOM_NAME,
    });
  });
});

describe("session exercise identity writes", () => {
  jest.setTimeout(30000);

  test("400 when both exerciseId and userExerciseId are sent", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "session-identity-both@example.com",
      password: "password123",
    });

    const sessionRes = await agent.post("/sessions").send({});
    expect(sessionRes.status).toBe(201);

    const res = await agent
      .post(`/sessions/${sessionRes.body.session.id}/exercises`)
      .send({
        exerciseName: "bench press",
        exerciseId: BENCH_CATALOG_ID,
        userExerciseId: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot both be set/);
  });

  test("400 when userExerciseId belongs to another user", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await registerAndLogin(agentA, {
      email: "session-identity-owner@example.com",
      password: "password123",
    });
    await registerAndLogin(agentB, {
      email: "session-identity-foreign@example.com",
      password: "password123",
    });

    const created = await agentA.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.status).toBe(201);

    const sessionRes = await agentB.post("/sessions").send({});
    expect(sessionRes.status).toBe(201);

    const res = await agentB
      .post(`/sessions/${sessionRes.body.session.id}/exercises`)
      .send({
        exerciseName: CUSTOM_NAME,
        userExerciseId: created.body.userExercise.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userExerciseId not found/);
  });

  test("session write with a valid exerciseId persists it", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "session-identity-catalog-id@example.com",
      password: "password123",
    });

    const sessionRes = await agent.post("/sessions").send({});
    expect(sessionRes.status).toBe(201);

    const res = await agent
      .post(`/sessions/${sessionRes.body.session.id}/exercises`)
      .send({
        exerciseName: BENCH,
        exerciseId: BENCH_CATALOG_ID,
      });

    expect(res.status).toBe(201);
    expect(res.body.sessionExercise).toMatchObject({
      exerciseName: BENCH,
      exerciseId: BENCH_CATALOG_ID,
      userExerciseId: null,
    });
  });
});
