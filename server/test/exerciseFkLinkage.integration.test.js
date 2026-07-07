const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");
const { registerAndLogin } = require("./helpers/authTestHelpers");

const BENCH_CATALOG_ID = "Barbell_Bench_Press_-_Medium_Grip";

describe("Exercise FK linkage integration", () => {
  jest.setTimeout(30000);

  test("template create stamps catalog exerciseId from resolved name", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "fk-template-stamp@example.com",
      password: "password123",
    });

    const res = await agent.post("/templates").send({
      name: "FK Stamp Template",
      description: "A4 linkage test",
      isPublic: false,
      exercises: [
        {
          order: 1,
          exerciseName: "bench press",
          targetSets: 3,
          targetReps: "8",
        },
      ],
    });

    expect(res.status).toBe(201);
    const exercise = res.body.template.exercises[0];
    expect(exercise.exerciseName).toBe("bench press");
    expect(exercise.exerciseId).toBe(BENCH_CATALOG_ID);
    expect(exercise.userExerciseId).toBeNull();
  });

  test("session start copies template exercise identity columns verbatim", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "fk-session-copy@example.com",
      password: "password123",
    });

    const templateRes = await agent.post("/templates").send({
      name: "Copy-through Template",
      isPublic: false,
      exercises: [
        {
          order: 1,
          exerciseName: "squat",
          targetSets: 3,
          targetReps: "5",
        },
      ],
    });
    expect(templateRes.status).toBe(201);
    const templateExercise = templateRes.body.template.exercises[0];
    expect(templateExercise.exerciseId).toBe("Barbell_Squat");

    const sessionRes = await agent
      .post(`/sessions/start/${templateRes.body.template.id}`)
      .send({});
    expect(sessionRes.status).toBe(201);

    const sessionExercise = sessionRes.body.session.sessionExercises[0];
    expect(sessionExercise.exerciseName).toBe("squat");
    expect(sessionExercise.exerciseId).toBe(templateExercise.exerciseId);
    expect(sessionExercise.userExerciseId).toBe(templateExercise.userExerciseId);
  });

  test("ad-hoc session exercise stamps identity on create", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "fk-adhoc-session@example.com",
      password: "password123",
    });

    const sessionRes = await agent.post("/sessions").send({});
    expect(sessionRes.status).toBe(201);

    const addRes = await agent
      .post(`/sessions/${sessionRes.body.session.id}/exercises`)
      .send({ exerciseName: "deadlift" });
    expect(addRes.status).toBe(201);

    expect(addRes.body.sessionExercise.exerciseId).toBe("Barbell_Deadlift");
    expect(addRes.body.sessionExercise.userExerciseId).toBeNull();
  });

  test("CHECK constraint rejects rows with both exerciseId and userExerciseId set", async () => {
    const agent = request.agent(app);
    const user = await registerAndLogin(agent, {
      email: "fk-check-constraint@example.com",
      password: "password123",
    });

    const template = await prisma.workoutTemplate.create({
      data: {
        name: "CHECK test template",
        userId: user.id,
      },
    });

    const userExercise = await prisma.userExercise.create({
      data: {
        userId: user.id,
        name: "Custom Move",
        normalizedName: "custom move",
        muscles: { chest: "primary" },
      },
    });

    await expect(
      prisma.templateExercise.create({
        data: {
          order: 1,
          exerciseName: "Custom Move",
          exerciseId: BENCH_CATALOG_ID,
          userExerciseId: userExercise.id,
          workoutTemplateId: template.id,
        },
      })
    ).rejects.toThrow();

    await prisma.workoutTemplate.delete({ where: { id: template.id } });
  });
});
