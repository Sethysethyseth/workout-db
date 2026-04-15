const request = require("supertest");
const app = require("../src/app");
const { defaultWorkoutSessionName } = require("../src/lib/defaultWorkoutSessionName");

async function registerAndLogin(agent, { email, password }) {
  const res = await agent.post("/auth/register").send({ email, password });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("user");
  expect(res.body.user).toHaveProperty("id");
  expect(res.body.user).toHaveProperty("email", email);
  return res.body.user;
}

async function createTemplate(agent) {
  const res = await agent.post("/templates").send({
    name: "Test Template",
    description: "Template for lifecycle tests",
    isPublic: false,
    exercises: [
      {
        order: 1,
        exerciseName: "Bench Press",
        targetSets: 3,
        targetReps: "8",
        notes: "Work up to top set",
      },
    ],
  });

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("template");
  expect(res.body.template).toHaveProperty("id");
  expect(Array.isArray(res.body.template.exercises)).toBe(true);
  expect(res.body.template.exercises.length).toBe(1);
  return res.body.template;
}

async function startSessionFromTemplate(agent, templateId) {
  const res = await agent.post(`/sessions/start/${templateId}`).send({});
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("session");
  expect(res.body.session).toHaveProperty("id");
  expect(Array.isArray(res.body.session.sessionExercises)).toBe(true);
  expect(res.body.session.sessionExercises.length).toBeGreaterThan(0);
  return res.body.session;
}

describe("Session lifecycle + completed-session locking", () => {
  test("happy path: start -> update -> create/update/delete set -> complete -> locked mutations; DELETE session still works", async () => {
    const agent = request.agent(app);

    await registerAndLogin(agent, {
      email: "owner@example.com",
      password: "password123",
    });

    const template = await createTemplate(agent);
    const session = await startSessionFromTemplate(agent, template.id);

    // 2. authenticated user can update an incomplete session
    {
      const res = await agent.patch(`/sessions/${session.id}`).send({
        notes: "Updated session notes",
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("session");
      expect(res.body.session).toHaveProperty("id", session.id);
      expect(res.body.session).toHaveProperty("notes", "Updated session notes");
    }

    const sessionExerciseId = session.sessionExercises[0].id;

    // 3. authenticated user can create a set for an incomplete session
    let set;
    {
      const res = await agent.post(`/sessions/${session.id}/sets`).send({
        sessionExerciseId,
        order: 1,
        reps: 8,
        weight: 100,
        rpe: 8,
        rir: 2,
        notes: "Felt good",
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("set");
      expect(res.body.set).toHaveProperty("id");
      expect(res.body.set).toHaveProperty("workoutSessionId", session.id);
      expect(res.body.set).toHaveProperty("sessionExerciseId", sessionExerciseId);
      expect(res.body.set).toHaveProperty("order", 1);
      set = res.body.set;
    }

    // 4. authenticated user can update a set for an incomplete session
    {
      const res = await agent.patch(`/sessions/sets/${set.id}`).send({
        reps: 9,
        weight: 102.5,
        notes: "Last set, pushed harder",
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("set");
      expect(res.body.set).toHaveProperty("id", set.id);
      expect(res.body.set).toHaveProperty("reps", 9);
      expect(res.body.set).toHaveProperty("weight", 102.5);
      expect(res.body.set).toHaveProperty("notes", "Last set, pushed harder");
    }

    // 5. authenticated user can delete a set for an incomplete session
    {
      const res = await agent.delete(`/sessions/sets/${set.id}`).send();
      expect(res.status).toBe(204);
    }

    // Re-create a set so we can assert locked set mutation endpoints after completion.
    let setAfterRecreate;
    {
      const res = await agent.post(`/sessions/${session.id}/sets`).send({
        sessionExerciseId,
        order: 1,
        reps: 8,
        weight: 100,
      });
      expect(res.status).toBe(201);
      setAfterRecreate = res.body.set;
      expect(setAfterRecreate).toHaveProperty("id");
    }

    // 6. authenticated user can complete a session
    {
      const res = await agent.post(`/sessions/${session.id}/complete`).send();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("session");
      expect(res.body.session).toHaveProperty("id", session.id);
      expect(res.body.session.completedAt).toBeTruthy();
      expect(res.body.session.name).toBeNull();
    }

    // 7. after completion, PATCH /sessions/:id returns 400 with error
    {
      const res = await agent.patch(`/sessions/${session.id}`).send({
        notes: "should fail",
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Completed sessions cannot be modified",
      });
    }

    // 8. after completion, POST /sessions/:id/sets returns 400 with error
    {
      const res = await agent.post(`/sessions/${session.id}/sets`).send({
        sessionExerciseId,
        order: 2,
        reps: 10,
        weight: 105,
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Completed sessions cannot be modified",
      });
    }

    // 9. after completion, PATCH /sessions/sets/:id returns 400 with error
    {
      const res = await agent.patch(`/sessions/sets/${setAfterRecreate.id}`).send({
        reps: 9,
      });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Completed sessions cannot be modified",
      });
    }

    // 10. after completion, DELETE /sessions/sets/:id returns 400 with error
    {
      const res = await agent.delete(`/sessions/sets/${setAfterRecreate.id}`).send();
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Completed sessions cannot be modified",
      });
    }

    // 11. DELETE /sessions/:id still works for an owned completed session (current behavior)
    {
      const res = await agent.delete(`/sessions/${session.id}`).send();
      expect(res.status).toBe(204);
    }
  });

  test("non-owner cannot mutate another user’s session", async () => {
    const owner = request.agent(app);
    const nonOwner = request.agent(app);

    await registerAndLogin(owner, {
      email: "owner2@example.com",
      password: "password123",
    });
    await registerAndLogin(nonOwner, {
      email: "other@example.com",
      password: "password123",
    });

    const template = await createTemplate(owner);
    const session = await startSessionFromTemplate(owner, template.id);
    const sessionExerciseId = session.sessionExercises[0].id;

    // updateSession uses (id + userId) lookup, so non-owner sees 404
    {
      const res = await nonOwner.patch(`/sessions/${session.id}`).send({
        notes: "should not be allowed",
      });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: "Session not found",
      });
    }

    // createSetForSession explicitly checks ownership and returns 403
    {
      const res = await nonOwner.post(`/sessions/${session.id}/sets`).send({
        sessionExerciseId,
        order: 1,
        reps: 5,
        weight: 60,
      });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: "You do not have permission to add sets to this session",
      });
    }

    // create a set as owner, then assert non-owner cannot update/delete it
    const set = (
      await owner.post(`/sessions/${session.id}/sets`).send({
        sessionExerciseId,
        order: 1,
        reps: 8,
        weight: 100,
      })
    ).body.set;

    {
      const res = await nonOwner.patch(`/sessions/sets/${set.id}`).send({
        reps: 9,
      });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: "You do not have permission to modify this set",
      });
    }

    {
      const res = await nonOwner.delete(`/sessions/sets/${set.id}`).send();
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: "You do not have permission to delete this set",
      });
    }
  });
});

describe("Ad-hoc sessions and session exercises", () => {
  test("POST /sessions creates an empty workout without a template", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "adhoc1@example.com",
      password: "password123",
    });

    const res = await agent.post("/sessions").send({});
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("session");
    expect(res.body.session.workoutTemplateId).toBeNull();
    expect(res.body.session.sessionExercises).toEqual([]);
  });

  test("POST /sessions/:id/exercises then set then complete", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "adhoc2@example.com",
      password: "password123",
    });

    const created = await agent.post("/sessions").send({});
    expect(created.status).toBe(201);
    const sessionId = created.body.session.id;

    const addEx = await agent.post(`/sessions/${sessionId}/exercises`).send({
      exerciseName: "Squat",
    });
    expect(addEx.status).toBe(201);
    expect(addEx.body.sessionExercise.exerciseName).toBe("Squat");

    const sessionExerciseId = addEx.body.sessionExercise.id;

    const rename = await agent
      .patch(`/sessions/${sessionId}/exercises/${sessionExerciseId}`)
      .send({ exerciseName: "Back squat" });
    expect(rename.status).toBe(200);
    expect(rename.body.sessionExercise.exerciseName).toBe("Back squat");

    const setRes = await agent.post(`/sessions/${sessionId}/sets`).send({
      sessionExerciseId,
      order: 1,
      reps: 5,
      weight: 100,
    });
    expect(setRes.status).toBe(201);

    const done = await agent.post(`/sessions/${sessionId}/complete`).send();
    expect(done.status).toBe(200);
    expect(done.body.session.completedAt).toBeTruthy();
    expect(done.body.session.name).toBe(
      defaultWorkoutSessionName(created.body.session.startedAt)
    );

    const blocked = await agent.post(`/sessions/${sessionId}/exercises`).send({
      exerciseName: "Too late",
    });
    expect(blocked.status).toBe(400);
    expect(blocked.body.error).toBe("Completed sessions cannot be modified");
  });

  test("adhoc PATCH name then complete without body keeps stored name", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "adhoc3@example.com",
      password: "password123",
    });

    const created = await agent.post("/sessions").send({});
    expect(created.status).toBe(201);
    const sessionId = created.body.session.id;

    const patch = await agent.patch(`/sessions/${sessionId}`).send({ name: "Push day" });
    expect(patch.status).toBe(200);
    expect(patch.body.session.name).toBe("Push day");

    const addEx = await agent.post(`/sessions/${sessionId}/exercises`).send({
      exerciseName: "Press",
    });
    expect(addEx.status).toBe(201);
    const sessionExerciseId = addEx.body.sessionExercise.id;

    await agent.post(`/sessions/${sessionId}/sets`).send({
      sessionExerciseId,
      order: 1,
      reps: 8,
      weight: 40,
    });

    const done = await agent.post(`/sessions/${sessionId}/complete`).send({});
    expect(done.status).toBe(200);
    expect(done.body.session.name).toBe("Push day");
  });

  test("adhoc complete trims name from POST body", async () => {
    const agent = request.agent(app);
    await registerAndLogin(agent, {
      email: "adhoc4@example.com",
      password: "password123",
    });

    const created = await agent.post("/sessions").send({});
    expect(created.status).toBe(201);
    const sessionId = created.body.session.id;

    const addEx = await agent.post(`/sessions/${sessionId}/exercises`).send({
      exerciseName: "Curl",
    });
    expect(addEx.status).toBe(201);
    const sessionExerciseId = addEx.body.sessionExercise.id;
    await agent.post(`/sessions/${sessionId}/sets`).send({
      sessionExerciseId,
      order: 1,
      reps: 12,
      weight: 15,
    });

    const done = await agent
      .post(`/sessions/${sessionId}/complete`)
      .send({ name: "  Arms finisher  " });
    expect(done.status).toBe(200);
    expect(done.body.session.name).toBe("Arms finisher");
  });
});

