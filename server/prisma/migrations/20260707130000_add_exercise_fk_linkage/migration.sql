-- AlterTable
ALTER TABLE "TemplateExercise" ADD COLUMN "exerciseId" TEXT;
ALTER TABLE "TemplateExercise" ADD COLUMN "userExerciseId" INTEGER;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN "exerciseId" TEXT;
ALTER TABLE "SessionExercise" ADD COLUMN "userExerciseId" INTEGER;

-- AlterTable
ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "exerciseId" TEXT;
ALTER TABLE "BlockWorkoutExercise" ADD COLUMN "userExerciseId" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN "blockWorkoutSetId" INTEGER;

-- CreateIndex
CREATE INDEX "TemplateExercise_exerciseId_idx" ON "TemplateExercise"("exerciseId");
CREATE INDEX "TemplateExercise_userExerciseId_idx" ON "TemplateExercise"("userExerciseId");
CREATE INDEX "SessionExercise_exerciseId_idx" ON "SessionExercise"("exerciseId");
CREATE INDEX "SessionExercise_userExerciseId_idx" ON "SessionExercise"("userExerciseId");
CREATE INDEX "BlockWorkoutExercise_exerciseId_idx" ON "BlockWorkoutExercise"("exerciseId");
CREATE INDEX "BlockWorkoutExercise_userExerciseId_idx" ON "BlockWorkoutExercise"("userExerciseId");
CREATE INDEX "WorkoutSet_blockWorkoutSetId_idx" ON "WorkoutSet"("blockWorkoutSetId");

-- AddForeignKey
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "UserExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "UserExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlockWorkoutExercise" ADD CONSTRAINT "BlockWorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlockWorkoutExercise" ADD CONSTRAINT "BlockWorkoutExercise_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "UserExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkoutSet" ADD CONSTRAINT "WorkoutSet_blockWorkoutSetId_fkey" FOREIGN KEY ("blockWorkoutSetId") REFERENCES "BlockWorkoutSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- At-most-one identity per exercise-carrying row (raw SQL only; Prisma cannot express).
ALTER TABLE "TemplateExercise" ADD CONSTRAINT "TemplateExercise_one_identity_chk"
  CHECK ("exerciseId" IS NULL OR "userExerciseId" IS NULL);
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_one_identity_chk"
  CHECK ("exerciseId" IS NULL OR "userExerciseId" IS NULL);
ALTER TABLE "BlockWorkoutExercise" ADD CONSTRAINT "BlockWorkoutExercise_one_identity_chk"
  CHECK ("exerciseId" IS NULL OR "userExerciseId" IS NULL);
