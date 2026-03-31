const request = require("supertest");
const app = require("../src/app");

function uniqueEmail(suffix) {
  const base = (expect.getState().currentTestName || "test")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${suffix}@example.com`;
}

async function registerAndLogin(agent, { email, password }) {
  const res = await agent.post("/auth/register").send({ email, password });
  expect(res.status).toBe(201);
  return res.body.user;
}

function sampleBlockPayload(overrides = {}) {
  return {
    name: "Test Block",
    description: "Block integration",
    isPublic: false,
    durationWeeks: 4,
    weeks: [
      {
        order: 1,
        workouts: [
          {
            order: 1,
            name: "Day A",
            exercises: [
              {
                order: 1,
                exerciseName: "Squat",
                sets: [{ order: 1, reps: 5, weight: 100, rir: 1, rpe: 8 }],
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("Block template integration", () => {
  test("create block template as authenticated user", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const res = await agent.post("/block-templates").send(sampleBlockPayload());

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("blockTemplate");
    expect(res.body.blockTemplate).toHaveProperty("id");
    expect(res.body.blockTemplate.name).toBe("Test Block");
    expect(res.body.blockTemplate.durationWeeks).toBe(4);
    expect(Array.isArray(res.body.blockTemplate.weeks)).toBe(true);
    expect(res.body.blockTemplate.weeks.length).toBe(1);
    expect(res.body.blockTemplate.weeks[0].workouts.length).toBe(1);
    const ex = res.body.blockTemplate.weeks[0].workouts[0].exercises[0];
    expect(ex.exerciseName).toBe("Squat");
    expect(Array.isArray(ex.blockWorkoutSets)).toBe(true);
    expect(ex.blockWorkoutSets.length).toBe(1);
  });

  test("GET /block-templates/mine lists owner blocks", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const created = await agent.post("/block-templates").send(sampleBlockPayload({ name: "Mine" }));
    expect(created.status).toBe(201);
    const id = created.body.blockTemplate.id;

    const res = await agent.get("/block-templates/mine").send();
    expect(res.status).toBe(200);
    expect(res.body.blockTemplates.some((b) => b.id === id)).toBe(true);
  });

  test("GET /block-templates/public and clone flow", async () => {
    const owner = request.agent(app);
    await registerAndLogin(owner, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const pub = await owner
      .post("/block-templates")
      .send(sampleBlockPayload({ name: "Public Block", isPublic: true }));
    expect(pub.status).toBe(201);
    const publicId = pub.body.blockTemplate.id;

    const anon = request(app);
    const list = await anon.get("/block-templates/public").send();
    expect(list.status).toBe(200);
    expect(list.body.blockTemplates.some((b) => b.id === publicId)).toBe(true);

    const cloner = request.agent(app);
    await registerAndLogin(cloner, {
      email: uniqueEmail("cloner"),
      password: "password123",
    });

    const cloneRes = await cloner.post(`/block-templates/${publicId}/clone`).send();
    expect(cloneRes.status).toBe(201);
    expect(cloneRes.body.blockTemplate.isPublic).toBe(false);
    expect(cloneRes.body.blockTemplate.name).toContain("Copy");

    const ownerPub = await owner.get("/block-templates/public").send();
    expect(ownerPub.body.blockTemplates.some((b) => b.id === publicId)).toBe(false);
  });

  test("PATCH and DELETE block template for owner", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const created = await agent.post("/block-templates").send(sampleBlockPayload());
    const id = created.body.blockTemplate.id;

    const patch = await agent.patch(`/block-templates/${id}`).send({
      name: "Renamed",
      isPublic: true,
    });
    expect(patch.status).toBe(200);
    expect(patch.body.blockTemplate.name).toBe("Renamed");
    expect(patch.body.blockTemplate.isPublic).toBe(true);

    const del = await agent.delete(`/block-templates/${id}`).send();
    expect(del.status).toBe(204);

    const again = await agent.get(`/block-templates/${id}`).send();
    expect(again.status).toBe(404);
  });

  test("create rejects when week count exceeds durationWeeks", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("dur"),
      password: "password123",
    });

    const week = sampleBlockPayload().weeks[0];
    const res = await agent.post("/block-templates").send(
      sampleBlockPayload({
        useDuration: true,
        durationWeeks: 1,
        weeks: [
          { ...week, order: 1 },
          { ...week, order: 2 },
        ],
      })
    );

    expect(res.status).toBe(400);
    expect(String(res.body.error || "")).toMatch(/2 weeks/);
  });
});
