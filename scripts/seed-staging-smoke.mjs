// Seed a smoke account on STAGING via the public HTTP API.
// Usage: node scripts/seed-staging-smoke.mjs
//
// No DB connection (so no dbHostGuard needed) - talks only to the staging
// Render service hardcoded in BASE. Idempotent: wipes the account's existing
// sessions/templates before reseeding, so re-run freely after a staging DB
// reset (`npm test` pretest) nukes the account.
//
// Account: username smoke_b8 (UNDERSCORE - the account predates this script
// and usernames are immutable) / SmokeTest-B8-2026 (smoke-b8@example.com)
// Data: 8 weeks (Mon/Wed/Fri upper/lower), progressive overload, RIR mostly
// logged (gaps on lat pulldown wk1-3 + cable rows odd weeks for the honesty
// states), last 3 "Upper A" sessions template-linked so the execution card
// populates. Weights are lbs-plausible (U6 default display unit).
//
// Gotchas this encodes: set `order` is unique per SESSION (not per exercise);
// the start-session response relation is `sessionExercises`.

const BASE = "https://workout-db-staging.onrender.com";
const USERNAME = "smoke_b8";
const EMAIL = "smoke-b8@example.com";
const PASSWORD = "SmokeTest-B8-2026";

let token = null;

async function api(method, path, body, attempt = 1) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch((err) => ({ networkError: err }));

  if (res.networkError || res.status >= 500) {
    if (attempt >= 4) {
      throw new Error(
        `${method} ${path} failed after ${attempt} tries: ` +
          (res.networkError ? res.networkError.message : `HTTP ${res.status}`)
      );
    }
    await new Promise((r) => setTimeout(r, attempt * 3000));
    return api(method, path, body, attempt + 1);
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

// ---- exercise programs -----------------------------------------------------
// w = week index 0..7. Weights read as lbs (U6 default display).
const round = (n) => Math.round(n * 100) / 100;

function upperA(w) {
  const bench = 185 + 5 * w;
  return {
    name: "Upper A",
    exercises: [
      {
        exerciseName: "Barbell Bench Press - Medium Grip",
        sets: [
          { reps: 5, weight: bench, rir: w === 4 ? 1 : 2 },
          { reps: 5, weight: bench, rir: 2 },
          { reps: 8, weight: round(bench * 0.9), rir: 3 },
        ],
      },
      {
        exerciseName: "Bent Over Barbell Row",
        sets: [2, 2, 3].map((rir) => ({ reps: 8, weight: 155 + 5 * w, rir })),
      },
      {
        exerciseName: "Standing Military Press",
        sets: [2, 2, 2].map((rir) => ({ reps: 6, weight: 95 + 2.5 * w, rir })),
      },
      {
        exerciseName: "Wide-Grip Lat Pulldown",
        // weeks 0-2: RIR not logged yet (honesty/unlock states)
        sets: [0, 1, 2].map(() => ({
          reps: 10,
          weight: 130 + 2.5 * w,
          rir: w < 3 ? null : 2,
        })),
      },
    ],
  };
}

function lower(w) {
  const exercises = [
    {
      exerciseName: "Barbell Squat",
      sets: [
        { reps: 5, weight: 225 + 5 * w, rir: 2 },
        { reps: 5, weight: 225 + 5 * w, rir: 2 },
        { reps: 8, weight: 200 + 5 * w, rir: 3 },
      ],
    },
    {
      exerciseName: "Romanian Deadlift",
      sets: [3, 3, 3].map((rir) => ({ reps: 8, weight: 185 + 5 * w, rir })),
    },
  ];
  if (w % 2 === 0) {
    exercises.push({
      exerciseName: "Barbell Deadlift",
      sets: [2, 2].map((rir) => ({ reps: 3, weight: 315 + 5 * w, rir })),
    });
  }
  return { name: "Lower", exercises };
}

function upperB(w) {
  return {
    name: "Upper B",
    exercises: [
      {
        exerciseName: "Incline Dumbbell Press",
        sets: [2, 2, 3].map((rir) => ({ reps: 8, weight: 65 + 2.5 * w, rir })),
      },
      {
        exerciseName: "Pullups",
        sets: [2, 2, 2].map((rir) => ({ reps: 6, weight: 25 + 2.5 * w, rir })),
      },
      {
        exerciseName: "Seated Cable Rows",
        // RIR only logged on even weeks
        sets: [0, 1, 2].map(() => ({
          reps: 10,
          weight: 140 + 2.5 * w,
          rir: w % 2 === 0 ? 2 : null,
        })),
      },
      {
        exerciseName: "Close-Grip Barbell Bench Press",
        sets: [2, 2, 3].map((rir) => ({ reps: 8, weight: 135 + 5 * w, rir })),
      },
    ],
  };
}

// Template plan for the last 3 Upper A sessions (weeks 5-7): week-5 numbers.
const TEMPLATE_PLAN = {
  name: "Upper A (smoke plan)",
  description: "Seeded plan for execution-fidelity smoke data",
  exercises: [
    {
      exerciseName: "Barbell Bench Press - Medium Grip",
      sets: [
        { reps: 5, weight: 210, rir: 2 },
        { reps: 5, weight: 210, rir: 2 },
        { reps: 8, weight: 189, rir: 3 },
      ],
    },
    {
      exerciseName: "Bent Over Barbell Row",
      sets: [1, 2, 3].map(() => ({ reps: 8, weight: 180, rir: 2 })),
    },
    {
      exerciseName: "Standing Military Press",
      sets: [1, 2, 3].map(() => ({ reps: 6, weight: 107.5, rir: 2 })),
    },
    {
      exerciseName: "Wide-Grip Lat Pulldown",
      sets: [1, 2, 3].map(() => ({ reps: 10, weight: 142.5, rir: 2 })),
    },
  ],
};

// Per-week tweaks to the templated Upper A actuals:
//  w5: on plan. w6: ~97% load + some RIR 3 (mild sandbagging). w7: skip last pulldown set.
function templatedUpperAActuals(w) {
  const plan = upperA(w); // actual weights keep progressing off the real program
  if (w === 6) {
    for (const ex of plan.exercises) {
      for (const s of ex.sets) {
        s.weight = round(s.weight * 0.97);
        if (s.rir === 2) s.rir = 3;
      }
    }
  }
  if (w === 7) {
    const pulldown = plan.exercises.find((e) =>
      e.exerciseName.includes("Pulldown")
    );
    pulldown.sets = pulldown.sets.slice(0, 2);
  }
  return plan;
}

// ---- dates -----------------------------------------------------------------
const MONDAYS = [
  "2026-05-11", "2026-05-18", "2026-05-25", "2026-06-01",
  "2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29",
];
function dayOffset(iso, days, hourUtc) {
  const d = new Date(iso + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 30, 0, 0);
  return d.toISOString();
}

// ---- logging flows ----------------------------------------------------------
// Set order is unique across the whole SESSION, so use a running counter.
async function logSets(sessionId, sessionExerciseId, sets, counter) {
  for (const s of sets) {
    counter.n += 1;
    const body = {
      sessionExerciseId,
      order: counter.n,
      reps: s.reps,
      weight: s.weight,
    };
    if (s.rir !== null && s.rir !== undefined) body.rir = s.rir;
    await api("POST", `/sessions/${sessionId}/sets`, body);
  }
}

async function seedAdHocSession(workout, performedAt) {
  const { session } = await api("POST", "/sessions", {});
  const counter = { n: 0 };
  for (const ex of workout.exercises) {
    const { sessionExercise } = await api(
      "POST",
      `/sessions/${session.id}/exercises`,
      { exerciseName: ex.exerciseName }
    );
    await logSets(session.id, sessionExercise.id, ex.sets, counter);
  }
  await api("PATCH", `/sessions/${session.id}`, {
    performedAt,
    name: workout.name,
  });
  await api("POST", `/sessions/${session.id}/complete`, {});
}

async function seedTemplateSession(templateId, workout, performedAt) {
  const { session } = await api("POST", `/sessions/start/${templateId}`, {});
  const counter = { n: 0 };
  for (const ex of workout.exercises) {
    const se = (session.sessionExercises || []).find(
      (e) => e.exerciseName === ex.exerciseName
    );
    if (!se) throw new Error(`No sessionExercise for ${ex.exerciseName}`);
    await logSets(session.id, se.id, ex.sets, counter);
  }
  await api("PATCH", `/sessions/${session.id}`, {
    performedAt,
    name: workout.name,
  });
  await api("POST", `/sessions/${session.id}/complete`, {});
}

// ---- main -------------------------------------------------------------------
async function main() {
  console.log("Waking staging + registering", USERNAME);
  await api("GET", "/health");

  try {
    const reg = await api("POST", "/auth/register", {
      email: EMAIL,
      password: PASSWORD,
      username: USERNAME,
    });
    token = reg.token;
    console.log("Registered new account");
  } catch (e) {
    console.log("Register failed (may exist), trying login:", e.message);
    const login = await api("POST", "/auth/login", {
      email: EMAIL,
      password: PASSWORD,
    });
    token = login.token;
    console.log("Logged in to existing account");
  }
  if (!token) throw new Error("No auth token returned");

  // Wipe leftovers from prior attempts so the account seeds clean.
  const mine = await api("GET", "/sessions/mine");
  const oldSessions = mine.sessions || mine || [];
  for (const sess of oldSessions) {
    await api("DELETE", `/sessions/${sess.id}`);
  }
  console.log(`Deleted ${oldSessions.length} pre-existing sessions`);
  const myTemplates = await api("GET", "/templates/mine");
  const oldTemplates = myTemplates.templates || [];
  for (const t of oldTemplates) {
    await api("DELETE", `/templates/${t.id}`);
  }
  console.log(`Deleted ${oldTemplates.length} pre-existing templates`);

  const { template } = await api("POST", "/templates", TEMPLATE_PLAN);
  console.log("Template created:", template.id);

  for (let w = 0; w < 8; w++) {
    const mon = MONDAYS[w];
    // Monday: Upper A (templated for weeks 5-7)
    if (w >= 5) {
      await seedTemplateSession(
        template.id,
        templatedUpperAActuals(w),
        dayOffset(mon, 0, 17)
      );
    } else {
      await seedAdHocSession(upperA(w), dayOffset(mon, 0, 17));
    }
    // Wednesday: Lower
    await seedAdHocSession(lower(w), dayOffset(mon, 2, 17));
    // Friday: Upper B (week 7 Friday = Jul 3, keep it early UTC so it's past)
    await seedAdHocSession(upperB(w), dayOffset(mon, 4, w === 7 ? 5 : 17));
    console.log(`Week ${w + 1}/8 seeded (${mon})`);
  }

  const summary = await api(
    "GET",
    "/analytics/summary?from=2026-05-11&to=2026-07-03"
  );
  const s = summary.summary ?? summary;
  console.log("--- verification ---");
  console.log("muscles:", (s.perMuscle || []).length);
  console.log("exercises:", (s.perExercise || []).length);
  console.log("rirCoverage:", s.meta && s.meta.rirCoverage);
  console.log("balance:", JSON.stringify(s.balance));
  console.log("execution rows:", (s.execution || []).length);
  const bench = (s.perExercise || []).find((e) =>
    (e.exerciseName || e.name || "").includes("Bench Press - Medium")
  );
  console.log("bench matchedEffort:", JSON.stringify(bench && (bench.matchedEffortTrend ?? bench.matchedEffort)));
  console.log("DONE. Login:", EMAIL, "/", PASSWORD);
}

main().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});
