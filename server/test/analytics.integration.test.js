const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers/authTestHelpers");

// Resolves against the exercise catalog (same fixture name the unit tests use).
const BENCH = "Barbell Bench Press - Medium Grip";

const SUMMARY_KEYS = [
  "range",
  "perMuscle",
  "perExercise",
  "prs",
  "balance",
  "execution",
  "meta",
];

/**
 * Log an ad-hoc session through the public API: create session, add one
 * exercise, add sets, then patch performedAt so the session lands at a known
 * point in the query range. Sessions are left incomplete - the summary
 * endpoint does not filter on completion.
 */
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

describe("GET /analytics/summary", () => {
  jest.setTimeout(30000);

  test("401 when unauthenticated", async () => {
    const res = await request(app)
      .get("/analytics/summary")
      .query({ from: "2026-06-01", to: "2026-07-01" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: "Authentication required",
    });
  });

  test("400 for missing/invalid from/to and from > to", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "analytics-400@example.com",
      password: "password123",
    });

    // missing from
    {
      const res = await agent
        .get("/analytics/summary")
        .query({ to: "2026-07-01" });
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error).toMatch(/from/);
    }

    // missing to
    {
      const res = await agent
        .get("/analytics/summary")
        .query({ from: "2026-06-01" });
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error).toMatch(/to/);
    }

    // unparseable date
    {
      const res = await agent
        .get("/analytics/summary")
        .query({ from: "not-a-date", to: "2026-07-01" });
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error).toMatch(/valid date/);
    }

    // from > to
    {
      const res = await agent
        .get("/analytics/summary")
        .query({ from: "2026-07-02", to: "2026-07-01" });
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe("string");
      expect(res.body.error).toMatch(/from must not be after to/);
    }
  });

  test("cross-user isolation: user A's summary contains none of user B's data", async () => {
    const agentA = request.agent(app);
    const agentB = request.agent(app);

    await registerAndLogin(agentA, {
      email: "analytics-iso-a@example.com",
      password: "password123",
    });
    await registerAndLogin(agentB, {
      email: "analytics-iso-b@example.com",
      password: "password123",
    });

    await logSession(agentB, {
      performedAt: "2026-06-10T10:00:00.000Z",
      exerciseName: BENCH,
      sets: [{ weight: 100, reps: 5, rir: 2 }],
    });

    const range = { from: "2026-06-01", to: "2026-07-01" };

    // Sanity check so an empty result cannot pass vacuously: B sees B's data.
    {
      const res = await agentB.get("/analytics/summary").query(range);
      expect(res.status).toBe(200);
      expect(res.body.perExercise.length).toBeGreaterThan(0);
      expect(res.body.perMuscle.length).toBeGreaterThan(0);
    }

    // The critical assertion: A sees zero of B's data over the same range.
    {
      const res = await agentA.get("/analytics/summary").query(range);
      expect(res.status).toBe(200);
      expect(res.body.perMuscle).toEqual([]);
      expect(res.body.perExercise).toEqual([]);
    }
  });

  test("happy path: known set produces the section-6 summary shape with exact numbers", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "analytics-happy@example.com",
      password: "password123",
    });

    await logSession(agent, {
      performedAt: "2026-06-10T10:00:00.000Z",
      exerciseName: BENCH,
      sets: [{ weight: 100, reps: 5, rir: 2 }],
    });

    const res = await agent.get("/analytics/summary").query({
      from: "2026-06-01T00:00:00.000Z",
      to: "2026-06-15T00:00:00.000Z",
    });

    expect(res.status).toBe(200);
    for (const key of SUMMARY_KEYS) {
      expect(res.body).toHaveProperty(key);
    }

    expect(res.body.range.from).toBe("2026-06-01T00:00:00.000Z");
    expect(res.body.range.to).toBe("2026-06-15T00:00:00.000Z");
    expect(res.body.range.weeks).toBe(2);

    expect(res.body.perExercise).toHaveLength(1);
    const exercise = res.body.perExercise[0];
    expect(exercise.name).toBe(BENCH);

    // Epley e1rm for 100 x 5: 100 * (1 + 5/30). Exact float match - the
    // engine computes it with the same expression.
    const expectedE1rm = 100 * (1 + 5 / 30);
    expect(exercise.bestSet.e1rm.epley).toBe(expectedE1rm);
    expect(exercise.e1rmTrend.best).toBe(expectedE1rm);
    expect(exercise.bestSet.weight).toBeCloseTo(100, 8);
    expect(exercise.bestSet.reps).toBeCloseTo(5, 8);

    // Bench is attributed, so chest volume must show up.
    const chest = res.body.perMuscle.find((m) => m.muscle === "chest");
    expect(chest).toBeDefined();
    expect(chest.effectiveSets).toBeGreaterThan(0);

    expect(res.body.prs).toEqual([]);
    expect(res.body.execution).toEqual([]);
    expect(Array.isArray(res.body.meta.honestyNotes)).toBe(true);
    // The single set carries RIR, so coverage is complete.
    expect(res.body.meta.rirCoverage).toBe(1);
  });

  test("execution fidelity: template-started session compares actual vs planned sets", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "analytics-execution@example.com",
      password: "password123",
    });

    // Plan: 3 x 100 kg x 8 @ RIR 2.
    const createdTemplate = await agent.post("/templates").send({
      name: "Push Day",
      exercises: [
        {
          exerciseName: BENCH,
          sets: [
            { order: 1, reps: 8, weight: 100, rir: 2 },
            { order: 2, reps: 8, weight: 100, rir: 2 },
            { order: 3, reps: 8, weight: 100, rir: 2 },
          ],
        },
      ],
    });
    expect(createdTemplate.status).toBe(201);
    const templateId = createdTemplate.body.template.id;

    const started = await agent.post(`/sessions/start/${templateId}`).send({});
    expect(started.status).toBe(201);
    const sessionId = started.body.session.id;
    const sessionExerciseId = started.body.session.sessionExercises[0].id;

    // Actual: only 2 sets, lighter, one RIR above plan (sandbagging).
    const actualSets = [
      { weight: 95, reps: 8, rir: 3 },
      { weight: 95, reps: 8, rir: 3 },
    ];
    let order = 1;
    for (const set of actualSets) {
      const res = await agent.post(`/sessions/${sessionId}/sets`).send({
        sessionExerciseId,
        order: order++,
        ...set,
      });
      expect(res.status).toBe(201);
    }

    const patched = await agent.patch(`/sessions/${sessionId}`).send({
      performedAt: "2026-06-10T10:00:00.000Z",
    });
    expect(patched.status).toBe(200);

    const res = await agent.get("/analytics/summary").query({
      from: "2026-06-01",
      to: "2026-06-15",
    });

    expect(res.status).toBe(200);
    expect(res.body.execution).toHaveLength(1);
    const row = res.body.execution[0];
    expect(row.name).toBe(BENCH);
    expect(row.loadAdherence).toBe(0.95); // 95 / 100
    expect(row.volumeAdherence).toBe(0.67); // 2 / 3
    expect(row.effortDrift).toBe(1); // rir 3 actual vs 2 planned
    expect(row.sessions).toBe(1);
  });

  test("date-only `to` is inclusive: a session at 18:00 on the `to` date is counted", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "analytics-inclusive@example.com",
      password: "password123",
    });

    await logSession(agent, {
      performedAt: "2026-06-15T18:00:00.000Z",
      exerciseName: BENCH,
      sets: [{ weight: 80, reps: 8, rir: 1 }],
    });

    const res = await agent.get("/analytics/summary").query({
      from: "2026-06-01",
      to: "2026-06-15",
    });

    expect(res.status).toBe(200);
    expect(res.body.range.to).toBe("2026-06-15T23:59:59.999Z");
    expect(res.body.perExercise).toHaveLength(1);
    expect(res.body.perExercise[0].name).toBe(BENCH);
  });
});
