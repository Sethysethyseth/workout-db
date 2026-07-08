require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { assertRecognizedHost } = require("../src/lib/dbHostGuard");

const prisma = new PrismaClient();

const dataDir = path.join(__dirname, "..", "data");

function loadJson(relativePath) {
  const filePath = path.join(dataDir, relativePath);
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function mapExerciseRecord(exercise, muscleWeightsById) {
  const override = muscleWeightsById[exercise.id];

  return {
    id: exercise.id,
    name: exercise.name,
    force: exercise.force ?? null,
    level: exercise.level ?? null,
    mechanic: exercise.mechanic ?? null,
    equipment: exercise.equipment ?? null,
    category: exercise.category ?? null,
    primaryMuscles: exercise.primaryMuscles ?? [],
    secondaryMuscles: exercise.secondaryMuscles ?? [],
    instructions: exercise.instructions ?? [],
    images: exercise.images ?? [],
    muscleWeights: override ?? null,
  };
}

async function main() {
  // Idempotent catalog upserts are non-destructive and must run on prod too,
  // so this uses the recognized-host guard, not the reset (staging-only) guard.
  assertRecognizedHost(process.env.DATABASE_URL);

  const exercises = loadJson("exercises.json");
  const muscleWeightsById = loadJson("muscle-weights.json");

  if (!Array.isArray(exercises)) {
    throw new Error("exercises.json must contain a JSON array");
  }

  let withMuscleWeights = 0;

  for (const exercise of exercises) {
    const data = mapExerciseRecord(exercise, muscleWeightsById);
    if (data.muscleWeights !== null) {
      withMuscleWeights += 1;
    }

    await prisma.exercise.upsert({
      where: { id: exercise.id },
      create: data,
      update: {
        name: data.name,
        force: data.force,
        level: data.level,
        mechanic: data.mechanic,
        equipment: data.equipment,
        category: data.category,
        primaryMuscles: data.primaryMuscles,
        secondaryMuscles: data.secondaryMuscles,
        instructions: data.instructions,
        images: data.images,
        muscleWeights: data.muscleWeights,
      },
    });
  }

  console.log(
    `Seeded ${exercises.length} exercises (${withMuscleWeights} with muscleWeights overrides)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
