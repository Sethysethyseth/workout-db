const { loadCatalog, resolveExercise } = require("../analytics");
const { buildUserExerciseIndex } = require("../analytics/userExercises");

function stampExerciseIdentityWithIndex(
  exerciseName,
  userIndex,
  catalog = loadCatalog()
) {
  const resolution = resolveExercise({ exerciseName }, catalog, userIndex);

  if (!resolution.resolved) {
    return { exerciseId: null, userExerciseId: null };
  }

  if (resolution.source === "userExercise" && resolution.userExercise) {
    return { exerciseId: null, userExerciseId: resolution.userExercise.id };
  }

  if (resolution.catalogEntry) {
    return { exerciseId: resolution.catalogEntry.id, userExerciseId: null };
  }

  return { exerciseId: null, userExerciseId: null };
}

function stampExerciseIdentity(exerciseName, userExerciseRows, catalog = loadCatalog()) {
  const userIndex = buildUserExerciseIndex(userExerciseRows);
  return stampExerciseIdentityWithIndex(exerciseName, userIndex, catalog);
}

function stampExercisesArray(exercises, userExerciseRows, catalog = loadCatalog()) {
  const userIndex = buildUserExerciseIndex(userExerciseRows);
  return exercises.map((exercise) => ({
    ...exercise,
    ...stampExerciseIdentityWithIndex(exercise.exerciseName, userIndex, catalog),
  }));
}

function stampBlockWeeksArray(weeks, userExerciseRows, catalog = loadCatalog()) {
  const userIndex = buildUserExerciseIndex(userExerciseRows);
  return weeks.map((week) => ({
    ...week,
    workouts: {
      create: week.workouts.create.map((workout) => ({
        ...workout,
        exercises: {
          create: workout.exercises.create.map((exercise) => ({
            ...exercise,
            ...stampExerciseIdentityWithIndex(
              exercise.exerciseName,
              userIndex,
              catalog
            ),
          })),
        },
      })),
    },
  }));
}

module.exports = {
  stampExerciseIdentity,
  stampExerciseIdentityWithIndex,
  stampExercisesArray,
  stampBlockWeeksArray,
};
