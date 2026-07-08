import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "server");
const require = createRequire(path.join(serverRoot, "package.json"));

require("dotenv").config({ path: path.join(serverRoot, ".env") });
const { PrismaClient } = require("@prisma/client");
const { assertRecognizedHost } = require("./src/lib/dbHostGuard");
const { loadCatalog } = require("./src/analytics");
const { buildUserExerciseIndex } = require("./src/analytics/userExercises");
const { stampExerciseIdentityWithIndex } = require("./src/lib/exerciseIdentity");

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function emptyReport() {
  return {
    scanned: 0,
    resolvedExerciseId: 0,
    resolvedUserExerciseId: 0,
    unresolved: 0,
    unresolvedNames: new Map(),
    wouldUpdate: 0,
    updated: 0,
  };
}

function recordUnresolved(report, exerciseName) {
  report.unresolved += 1;
  const key = String(exerciseName ?? "").trim() || "(blank)";
  report.unresolvedNames.set(key, (report.unresolvedNames.get(key) || 0) + 1);
}

function sortedUnresolvedNames(unresolvedNames) {
  return Array.from(unresolvedNames.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function getUserIndex(userId, userRowsByUserId, userIndexCache) {
  if (!userIndexCache.has(userId)) {
    userIndexCache.set(
      userId,
      buildUserExerciseIndex(userRowsByUserId.get(userId) || [])
    );
  }
  return userIndexCache.get(userId);
}

function resolveStamp(exerciseName, userId, catalog, userRowsByUserId, userIndexCache) {
  const userIndex = getUserIndex(userId, userRowsByUserId, userIndexCache);
  return stampExerciseIdentityWithIndex(exerciseName, userIndex, catalog);
}

async function loadUserRowsByUserId() {
  const rows = await prisma.userExercise.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
      normalizedName: true,
      muscles: true,
    },
  });

  const byUserId = new Map();
  for (const row of rows) {
    if (!byUserId.has(row.userId)) {
      byUserId.set(row.userId, []);
    }
    byUserId.get(row.userId).push(row);
  }
  return byUserId;
}

async function processTemplateExercises(catalog, userRowsByUserId, userIndexCache) {
  const report = emptyReport();

  const rows = await prisma.templateExercise.findMany({
    where: {
      exerciseId: null,
      userExerciseId: null,
    },
    select: {
      id: true,
      exerciseName: true,
      workoutTemplate: {
        select: {
          userId: true,
        },
      },
    },
  });

  report.scanned = rows.length;
  const updates = [];

  for (const row of rows) {
    const userId = row.workoutTemplate.userId;
    const stamp = resolveStamp(
      row.exerciseName,
      userId,
      catalog,
      userRowsByUserId,
      userIndexCache
    );

    if (stamp.exerciseId) {
      report.resolvedExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: stamp.exerciseId,
        userExerciseId: null,
      });
    } else if (stamp.userExerciseId) {
      report.resolvedUserExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: null,
        userExerciseId: stamp.userExerciseId,
      });
    } else {
      recordUnresolved(report, row.exerciseName);
    }
  }

  report.wouldUpdate = updates.length;

  if (apply && updates.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.templateExercise.update({
          where: { id: update.id },
          data: {
            exerciseId: update.exerciseId,
            userExerciseId: update.userExerciseId,
          },
        });
      }
    });
    report.updated = updates.length;
  }

  return report;
}

async function processSessionExercises(catalog, userRowsByUserId, userIndexCache) {
  const report = emptyReport();

  const rows = await prisma.sessionExercise.findMany({
    where: {
      exerciseId: null,
      userExerciseId: null,
    },
    select: {
      id: true,
      exerciseName: true,
      workoutSession: {
        select: {
          userId: true,
        },
      },
    },
  });

  report.scanned = rows.length;
  const updates = [];

  for (const row of rows) {
    const userId = row.workoutSession.userId;
    const stamp = resolveStamp(
      row.exerciseName,
      userId,
      catalog,
      userRowsByUserId,
      userIndexCache
    );

    if (stamp.exerciseId) {
      report.resolvedExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: stamp.exerciseId,
        userExerciseId: null,
      });
    } else if (stamp.userExerciseId) {
      report.resolvedUserExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: null,
        userExerciseId: stamp.userExerciseId,
      });
    } else {
      recordUnresolved(report, row.exerciseName);
    }
  }

  report.wouldUpdate = updates.length;

  if (apply && updates.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.sessionExercise.update({
          where: { id: update.id },
          data: {
            exerciseId: update.exerciseId,
            userExerciseId: update.userExerciseId,
          },
        });
      }
    });
    report.updated = updates.length;
  }

  return report;
}

async function processBlockWorkoutExercises(catalog, userRowsByUserId, userIndexCache) {
  const report = emptyReport();

  const rows = await prisma.blockWorkoutExercise.findMany({
    where: {
      exerciseId: null,
      userExerciseId: null,
    },
    select: {
      id: true,
      exerciseName: true,
      blockWorkout: {
        select: {
          blockWeek: {
            select: {
              blockTemplate: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  report.scanned = rows.length;
  const updates = [];

  for (const row of rows) {
    const userId = row.blockWorkout.blockWeek.blockTemplate.userId;
    const stamp = resolveStamp(
      row.exerciseName,
      userId,
      catalog,
      userRowsByUserId,
      userIndexCache
    );

    if (stamp.exerciseId) {
      report.resolvedExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: stamp.exerciseId,
        userExerciseId: null,
      });
    } else if (stamp.userExerciseId) {
      report.resolvedUserExerciseId += 1;
      updates.push({
        id: row.id,
        exerciseId: null,
        userExerciseId: stamp.userExerciseId,
      });
    } else {
      recordUnresolved(report, row.exerciseName);
    }
  }

  report.wouldUpdate = updates.length;

  if (apply && updates.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.blockWorkoutExercise.update({
          where: { id: update.id },
          data: {
            exerciseId: update.exerciseId,
            userExerciseId: update.userExerciseId,
          },
        });
      }
    });
    report.updated = updates.length;
  }

  return report;
}

function printTableReport(tableName, report) {
  console.log(`\n=== ${tableName} ===`);
  console.log(`scanned: ${report.scanned}`);
  console.log(`resolved exerciseId: ${report.resolvedExerciseId}`);
  console.log(`resolved userExerciseId: ${report.resolvedUserExerciseId}`);
  console.log(`unresolved: ${report.unresolved}`);

  if (apply) {
    console.log(`updated: ${report.updated}`);
  } else {
    console.log(`would update: ${report.wouldUpdate}`);
  }

  const unresolvedList = sortedUnresolvedNames(report.unresolvedNames);
  console.log("unresolved names (name x count):");
  if (unresolvedList.length === 0) {
    console.log("  (none)");
  } else {
    for (const [name, count] of unresolvedList) {
      console.log(`  ${count}x ${name}`);
    }
  }
}

function printSummary(reports) {
  const totals = {
    scanned: 0,
    resolvedExerciseId: 0,
    resolvedUserExerciseId: 0,
    unresolved: 0,
    wouldUpdate: 0,
    updated: 0,
  };

  for (const report of Object.values(reports)) {
    totals.scanned += report.scanned;
    totals.resolvedExerciseId += report.resolvedExerciseId;
    totals.resolvedUserExerciseId += report.resolvedUserExerciseId;
    totals.unresolved += report.unresolved;
    totals.wouldUpdate += report.wouldUpdate;
    totals.updated += report.updated;
  }

  console.log("\n=== TOTAL ===");
  console.log(`mode: ${apply ? "APPLY" : "DRY-RUN"}`);
  console.log(`scanned: ${totals.scanned}`);
  console.log(`resolved exerciseId: ${totals.resolvedExerciseId}`);
  console.log(`resolved userExerciseId: ${totals.resolvedUserExerciseId}`);
  console.log(`unresolved: ${totals.unresolved}`);
  if (apply) {
    console.log(`updated: ${totals.updated}`);
  } else {
    console.log(`would update: ${totals.wouldUpdate}`);
  }
}

async function main() {
  // Backfill only fills null-identity rows (never overwrites) and must run on
  // prod for historical rows, so it uses the recognized-host guard, not the
  // reset (staging-only) guard.
  assertRecognizedHost(process.env.DATABASE_URL);

  const catalog = loadCatalog();
  const userRowsByUserId = await loadUserRowsByUserId();
  const userIndexCache = new Map();

  const reports = {
    TemplateExercise: await processTemplateExercises(
      catalog,
      userRowsByUserId,
      userIndexCache
    ),
    SessionExercise: await processSessionExercises(
      catalog,
      userRowsByUserId,
      userIndexCache
    ),
    BlockWorkoutExercise: await processBlockWorkoutExercises(
      catalog,
      userRowsByUserId,
      userIndexCache
    ),
  };

  for (const [tableName, report] of Object.entries(reports)) {
    printTableReport(tableName, report);
  }

  printSummary(reports);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
