-- CreateTable
CREATE TABLE "SessionExercise" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "targetSets" INTEGER,
    "targetReps" TEXT,
    "notes" TEXT,
    "workoutSessionId" INTEGER NOT NULL,
    "templateExerciseId" INTEGER,

    CONSTRAINT "SessionExercise_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "WorkoutSet" ADD COLUMN "sessionExerciseId" INTEGER;

-- CreateIndex
CREATE INDEX "SessionExercise_workoutSessionId_idx" ON "SessionExercise"("workoutSessionId");

-- CreateIndex
CREATE INDEX "SessionExercise_templateExerciseId_idx" ON "SessionExercise"("templateExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionExercise_workoutSessionId_order_key" ON "SessionExercise"("workoutSessionId", "order");

-- CreateIndex
CREATE INDEX "WorkoutSet_sessionExerciseId_idx" ON "WorkoutSet"("sessionExerciseId");

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_workoutSessionId_fkey" FOREIGN KEY ("workoutSessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_templateExerciseId_fkey" FOREIGN KEY ("templateExerciseId") REFERENCES "TemplateExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

