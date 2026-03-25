-- CreateTable
CREATE TABLE "BlockTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "durationWeeks" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BlockTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockWorkout" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "blockTemplateId" INTEGER NOT NULL,

    CONSTRAINT "BlockWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockWorkoutExercise" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "targetSets" INTEGER,
    "targetReps" TEXT,
    "notes" TEXT,
    "blockWorkoutId" INTEGER NOT NULL,

    CONSTRAINT "BlockWorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockWorkoutSet" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "rir" INTEGER,
    "notes" TEXT,
    "blockWorkoutExerciseId" INTEGER NOT NULL,

    CONSTRAINT "BlockWorkoutSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockTemplate_userId_idx" ON "BlockTemplate"("userId");

-- CreateIndex
CREATE INDEX "BlockTemplate_isPublic_idx" ON "BlockTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "BlockWorkout_blockTemplateId_idx" ON "BlockWorkout"("blockTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockWorkout_blockTemplateId_order_key" ON "BlockWorkout"("blockTemplateId", "order");

-- CreateIndex
CREATE INDEX "BlockWorkoutExercise_blockWorkoutId_idx" ON "BlockWorkoutExercise"("blockWorkoutId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockWorkoutExercise_blockWorkoutId_order_key" ON "BlockWorkoutExercise"("blockWorkoutId", "order");

-- CreateIndex
CREATE INDEX "BlockWorkoutSet_blockWorkoutExerciseId_idx" ON "BlockWorkoutSet"("blockWorkoutExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockWorkoutSet_blockWorkoutExerciseId_order_key" ON "BlockWorkoutSet"("blockWorkoutExerciseId", "order");

-- AddForeignKey
ALTER TABLE "BlockTemplate" ADD CONSTRAINT "BlockTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockWorkout" ADD CONSTRAINT "BlockWorkout_blockTemplateId_fkey" FOREIGN KEY ("blockTemplateId") REFERENCES "BlockTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockWorkoutExercise" ADD CONSTRAINT "BlockWorkoutExercise_blockWorkoutId_fkey" FOREIGN KEY ("blockWorkoutId") REFERENCES "BlockWorkout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockWorkoutSet" ADD CONSTRAINT "BlockWorkoutSet_blockWorkoutExerciseId_fkey" FOREIGN KEY ("blockWorkoutExerciseId") REFERENCES "BlockWorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
