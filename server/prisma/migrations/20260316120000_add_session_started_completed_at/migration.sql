-- AddColumn
ALTER TABLE "WorkoutSession" ADD COLUMN "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddColumn
ALTER TABLE "WorkoutSession" ADD COLUMN "completedAt" TIMESTAMP(3);

