const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers/authTestHelpers");

const BENCH = "Barbell Bench Press - Medium Grip";
const CUSTOM_NAME = "Bulgarian Split Squat Custom";

async function logSession(agent, { performedAt, exerciseName, sets }) {
  const created = await agent.post("/sessions").send({});
  expect(created.status).toBe(201);
  const sessionId = created.body.session.id;

  const addEx = await agent.post(`/sessions/${sessionId}/exercises`).send({
    exerciseName,
  });
  expect(addEx.status).toBe(201);
  const sessionExerciseId = addEx.body.sessionExercise.id;

  let order = 1;
  for (const set of sets) {
    const res = await agent.post(`/sessions/${sessionId}/sets`).send({
      sessionExerciseId,
      order: order++,
      ...set,
    });
    expect(res.status).toBe(201);
  }

  const patched = await agent.patch(`/sessions/${sessionId}`).send({
    performedAt,
  });
  expect(patched.status).toBe(200);

  return sessionId;
}

describe("POST /exercises/resolve", () => {
  jest.setTimeout(30000);

  test("401 when unauthenticated", async () => {
    const res = await request(app)
      .post("/exercises/resolve")
      .send({ names: [BENCH] });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "Authentication required",
    });
  });

  test("400 when names is an empty array", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-resolve-400@example.com",
      password: "password123",
    });

    const res = await agent.post("/exercises/resolve").send({ names: [] });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error).toMatch(/nonempty array of strings/);
  });

  test("happy path: catalog name resolves; unknown name does not", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-resolve-happy@example.com",
      password: "password123",
    });

    const res = await agent.post("/exercises/resolve").send({
      names: [BENCH, "zzz not real zzz"],
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results).toHaveLength(2);

    expect(res.body.results[0]).toEqual({
      name: BENCH,
      resolved: true,
      source: "catalog",
      catalogId: "Barbell_Bench_Press_-_Medium_Grip",
      userExerciseId: null,
      canonicalName: BENCH,
    });

    expect(res.body.results[1]).toEqual({
      name: "zzz not real zzz",
      resolved: false,
      source: null,
      catalogId: null,
      userExerciseId: null,
      canonicalName: null,
    });
  });

  test("returns userExercise source for a custom library entry", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-resolve-custom@example.com",
      password: "password123",
    });

    const created = await agent.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.status).toBe(201);

    const res = await agent.post("/exercises/resolve").send({
      names: [CUSTOM_NAME],
    });

    expect(res.status).toBe(200);
    expect(res.body.results[0]).toEqual({
      name: CUSTOM_NAME,
      resolved: true,
      source: "userExercise",
      catalogId: null,
      userExerciseId: created.body.userExercise.id,
      canonicalName: CUSTOM_NAME,
    });
  });
});

describe("custom exercises API", () => {
  jest.setTimeout(30000);

  test("GET /exercises/muscles returns the catalog-derived vocabulary", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-muscles@example.com",
      password: "password123",
    });

    const res = await agent.get("/exercises/muscles");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.muscles)).toBe(true);
    expect(res.body.muscles).toContain("chest");
    expect(res.body.muscles).toContain("quadriceps");
    expect(res.body.muscles.length).toBe(17);
  });

  test("custom CRUD happy path", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-custom-crud@example.com",
      password: "password123",
    });

    const created = await agent.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });

    expect(created.status).toBe(201);
    expect(created.body.userExercise).toMatchObject({
      name: CUSTOM_NAME,
      normalizedName: "bulgarian split squat custom",
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.body.userExercise).toHaveProperty("id");

    const listed = await agent.get("/exercises/custom");
    expect(listed.status).toBe(200);
    expect(listed.body.userExercises).toHaveLength(1);
    expect(listed.body.userExercises[0].name).toBe(CUSTOM_NAME);

    const deleted = await agent.delete(
      `/exercises/custom/${created.body.userExercise.id}`
    );
    expect(deleted.status).toBe(204);

    const afterDelete = await agent.get("/exercises/custom");
    expect(afterDelete.body.userExercises).toEqual([]);
  });

  test("POST rejects a catalog-resolvable name", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-custom-reject@example.com",
      password: "password123",
    });

    const res = await agent.post("/exercises/custom").send({
      name: "bench press",
      muscles: { chest: "primary" },
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already tracked as/);
  });

  test("user B cannot see or delete user A's custom exercise", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await registerAndLogin(agentA, {
      email: "exercises-custom-iso-a@example.com",
      password: "password123",
    });
    await registerAndLogin(agentB, {
      email: "exercises-custom-iso-b@example.com",
      password: "password123",
    });

    const created = await agentA.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.status).toBe(201);
    const exerciseId = created.body.userExercise.id;

    const listB = await agentB.get("/exercises/custom");
    expect(listB.status).toBe(200);
    expect(listB.body.userExercises).toEqual([]);

    const deleteB = await agentB.delete(`/exercises/custom/${exerciseId}`);
    expect(deleteB.status).toBe(404);
    expect(deleteB.body).toEqual({ error: "User exercise not found" });

    const listA = await agentA.get("/exercises/custom");
    expect(listA.body.userExercises).toHaveLength(1);
  });

  test("analytics summary includes a custom exercise's volume end-to-end", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "exercises-custom-analytics@example.com",
      password: "password123",
    });

    const created = await agent.post("/exercises/custom").send({
      name: CUSTOM_NAME,
      muscles: { quadriceps: "primary", glutes: "secondary" },
    });
    expect(created.status).toBe(201);

    await logSession(agent, {
      performedAt: "2026-06-10T10:00:00.000Z",
      exerciseName: CUSTOM_NAME,
      sets: [{ weight: 100, reps: 8, rir: 2 }],
    });

    const res = await agent.get("/analytics/summary").query({
      from: "2026-06-01",
      to: "2026-06-15",
    });

    expect(res.status).toBe(200);
    expect(res.body.perExercise).toHaveLength(1);
    expect(res.body.perExercise[0].name).toBe(CUSTOM_NAME);
    expect(res.body.perExercise[0].exerciseId).toMatch(/^user:\d+$/);

    const quads = res.body.perMuscle.find((m) => m.muscle === "quadriceps");
    expect(quads).toBeDefined();
    expect(quads.effectiveSets).toBeGreaterThan(0);
  });
});
