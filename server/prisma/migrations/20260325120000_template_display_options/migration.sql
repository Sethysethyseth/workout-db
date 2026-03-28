-- AlterTable
ALTER TABLE "WorkoutTemplate" ADD COLUMN "useRIR" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WorkoutTemplate" ADD COLUMN "useRPE" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BlockTemplate" ADD COLUMN "useRIR" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlockTemplate" ADD COLUMN "useRPE" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlockTemplate" ADD COLUMN "useDuration" BOOLEAN NOT NULL DEFAULT false;

-- Existing blocks with a stored duration should keep the duration field visible in the UI
UPDATE "BlockTemplate" SET "useDuration" = true WHERE "durationWeeks" IS NOT NULL;
