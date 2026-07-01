import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Standalone catalog/curation validator. Reads the vendored JSON off disk only -
// it never connects to a database and must not import Prisma. Run with:
//   node scripts/validate-catalog.mjs
// Exit 0 on success (prints OK), non-zero if any assertion fails.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "server", "data");
const exercisesPath = path.join(dataDir, "exercises.json");
const weightsPath = path.join(dataDir, "muscle-weights.json");

const SUM_TOLERANCE = 0.001;
const TRACKABLE_CATEGORIES = new Set([
  "strength",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
]);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const exercises = readJson(exercisesPath);
const weights = readJson(weightsPath);

const idSet = new Set(exercises.map((e) => e.id));
const weightKeys = Object.keys(weights);

let failed = false;

// Assertion 1: every curated key resolves to a catalog id.
const missingKeys = weightKeys.filter((k) => !idSet.has(k));
if (missingKeys.length > 0) {
  failed = true;
  console.error(
    `FAIL: ${missingKeys.length} curated key(s) not present in exercises.json:`
  );
  for (const k of missingKeys) console.error(`  - ${k}`);
}

// Assertion 2: every curated entry's values sum to 1.0 (+/- tolerance).
const badSums = [];
for (const [key, muscles] of Object.entries(weights)) {
  const sum = Object.values(muscles).reduce((acc, v) => acc + v, 0);
  if (Math.abs(sum - 1.0) > SUM_TOLERANCE) {
    badSums.push({ key, sum });
  }
}
if (badSums.length > 0) {
  failed = true;
  console.error(`FAIL: ${badSums.length} curated entry/entries do not sum to 1.0:`);
  for (const { key, sum } of badSums) {
    console.error(`  - ${key}: ${sum.toFixed(4)}`);
  }
}

// Informational report (does not affect exit code).
const trackable = exercises.filter((e) =>
  TRACKABLE_CATEGORIES.has(e.category)
);
const secondaryLessCompounds = trackable
  .filter(
    (e) =>
      e.mechanic === "compound" &&
      (!Array.isArray(e.secondaryMuscles) || e.secondaryMuscles.length === 0)
  )
  .map((e) => e.id);

console.log("--- Catalog validation report ---");
console.log(`Curated entries:          ${weightKeys.length}`);
console.log(`Catalog exercises:        ${exercises.length}`);
console.log(`Trackable subset:         ${trackable.length}`);
console.log(
  `Missing curated keys:     ${missingKeys.length}`
);
console.log(`Entries failing sum rule: ${badSums.length}`);
console.log(
  `Secondary-less compounds in trackable subset (${secondaryLessCompounds.length}) - attribution gaps for later review:`
);
for (const id of secondaryLessCompounds) console.log(`  - ${id}`);
console.log("---------------------------------");

if (failed) {
  console.error("VALIDATION FAILED");
  process.exit(1);
}

console.log("OK");
process.exit(0);
