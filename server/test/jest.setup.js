process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret";

const prisma = require("../src/lib/prisma");

async function resetDb() {
  // Keep ordering explicit to avoid FK issues.
  await prisma.workoutSet.deleteMany();
  await prisma.sessionExercise.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.templateSet.deleteMany();
  await prisma.templateExercise.deleteMany();
  await prisma.workoutTemplate.deleteMany();
  await prisma.user.deleteMany();
}

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

