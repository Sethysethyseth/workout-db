const request = require("supertest");
const app = require("../src/app");
const { registerAndLogin } = require("./helpers/authTestHelpers");

const BENCH = "Barbell Bench Press - Medium Grip";

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
      catalogId: "Barbell_Bench_Press_-_Medium_Grip",
      canonicalName: BENCH,
    });

    expect(res.body.results[1]).toEqual({
      name: "zzz not real zzz",
      resolved: false,
      catalogId: null,
      canonicalName: null,
    });
  });
});
