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
  expect(res.body).toHaveProperty("user");
  expect(res.body.user).toHaveProperty("id");
  expect(res.body.user).toHaveProperty("email", email);
  return res.body.user;
}

async function createTemplate(agent, { name, isPublic, exerciseName }) {
  const res = await agent.post("/templates").send({
    name,
    description: "Integration test template",
    isPublic,
    exercises: [
      {
        order: 1,
        exerciseName,
        targetSets: 3,
        targetReps: "8",
      },
    ],
  });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("template");
  expect(res.body.template).toHaveProperty("id");
  expect(res.body.template).toHaveProperty("name", name);
  expect(Array.isArray(res.body.template.exercises)).toBe(true);
  expect(res.body.template.exercises.length).toBe(1);
  return res.body.template;
}

describe("Template integration", () => {
  test("create template successfully as authenticated user", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const template = await createTemplate(agent, {
      name: "My Template",
      isPublic: false,
      exerciseName: "Bench Press",
    });

    expect(template).toHaveProperty("isPublic", false);
  });

  test("list authenticated user’s templates with GET /templates/mine", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const created = await createTemplate(agent, {
      name: "Owner Private Template",
      isPublic: false,
      exerciseName: "Squat",
    });

    const res = await agent.get("/templates/mine").send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("templates");
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.some((t) => t.id === created.id)).toBe(true);
  });

  test("list public templates with GET /templates/public", async () => {
    const owner = request.agent(app);
    await registerAndLogin(owner, {
      email: uniqueEmail("owner"),
      password: "password123",
    });

    const publicTemplate = await createTemplate(owner, {
      name: "Shared Template",
      isPublic: true,
      exerciseName: "Deadlift",
    });

    // Unauthenticated can list public templates, including this one.
    const res = await request(app).get("/templates/public").send();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("templates");
    expect(Array.isArray(res.body.templates)).toBe(true);
    const match = res.body.templates.find((t) => t.id === publicTemplate.id);
    expect(match).toBeTruthy();
    expect(match).toHaveProperty("isPublic", true);
    expect(match).toHaveProperty("user");
    expect(match.user).toHaveProperty("id");
    expect(match.user).toHaveProperty("email");

    // When logged in as the owner, getPublicTemplates excludes your own templates.
    const ownerRes = await owner.get("/templates/public").send();
    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body).toHaveProperty("templates");
    expect(ownerRes.body.templates.some((t) => t.id === publicTemplate.id)).toBe(
      false
    );
  });

  test("clone a public template successfully", async () => {
    const owner = request.agent(app);
    const cloner = request.agent(app);

    await registerAndLogin(owner, {
      email: uniqueEmail("owner"),
      password: "password123",
    });
    const clonerUser = await registerAndLogin(cloner, {
      email: uniqueEmail("cloner"),
      password: "password123",
    });

    const publicTemplate = await createTemplate(owner, {
      name: "Public Template",
      isPublic: true,
      exerciseName: "Overhead Press",
    });

    const res = await cloner.post(`/templates/${publicTemplate.id}/clone`).send();
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("template");
    expect(res.body.template).toHaveProperty("id");
    expect(res.body.template).toHaveProperty(
      "name",
      `${publicTemplate.name} (Copy)`
    );
    expect(res.body.template).toHaveProperty("isPublic", false);
    expect(res.body.template).toHaveProperty("userId", clonerUser.id);
    expect(Array.isArray(res.body.template.exercises)).toBe(true);
    expect(res.body.template.exercises.length).toBe(1);
    expect(res.body.template.exercises[0]).toHaveProperty(
      "exerciseName",
      "Overhead Press"
    );
  });

  test("verify ownership/visibility rules: cannot clone another user’s private template; private templates do not appear as public; other user’s templates do not appear in /mine", async () => {
    const owner = request.agent(app);
    const other = request.agent(app);

    await registerAndLogin(owner, {
      email: uniqueEmail("owner"),
      password: "password123",
    });
    await registerAndLogin(other, {
      email: uniqueEmail("other"),
      password: "password123",
    });

    const privateTemplate = await createTemplate(owner, {
      name: "Owner Private",
      isPublic: false,
      exerciseName: "Row",
    });

    // Other user cannot clone a private template they don't own.
    const cloneRes = await other
      .post(`/templates/${privateTemplate.id}/clone`)
      .send();
    expect(cloneRes.status).toBe(403);
    expect(cloneRes.body).toEqual({
      error: "You do not have permission to clone this template",
    });

    // Private templates never appear in public listing.
    const publicRes = await request(app).get("/templates/public").send();
    expect(publicRes.status).toBe(200);
    expect(publicRes.body).toHaveProperty("templates");
    expect(publicRes.body.templates.some((t) => t.id === privateTemplate.id)).toBe(
      false
    );

    // Other user's /mine should not include owner's private template.
    const mineRes = await other.get("/templates/mine").send();
    expect(mineRes.status).toBe(200);
    expect(mineRes.body).toHaveProperty("templates");
    expect(mineRes.body.templates.some((t) => t.id === privateTemplate.id)).toBe(
      false
    );
  });
});

