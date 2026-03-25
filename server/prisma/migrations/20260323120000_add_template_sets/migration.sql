-- CreateTable
CREATE TABLE "TemplateSet" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "rir" INTEGER,
    "notes" TEXT,
    "templateExerciseId" INTEGER NOT NULL,

    CONSTRAINT "TemplateSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateSet_templateExerciseId_idx" ON "TemplateSet"("templateExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSet_templateExerciseId_order_key" ON "TemplateSet"("templateExerciseId", "order");

-- AddForeignKey
ALTER TABLE "TemplateSet" ADD CONSTRAINT "TemplateSet_templateExerciseId_fkey" FOREIGN KEY ("templateExerciseId") REFERENCES "TemplateExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
