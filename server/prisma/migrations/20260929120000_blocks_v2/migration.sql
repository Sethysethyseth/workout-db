-- AlterTable
ALTER TABLE "AiConsent" ADD COLUMN     "blockDraftsAllowedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkoutSession" ADD COLUMN     "blockRunId" INTEGER,
ADD COLUMN     "blockWeekOrder" INTEGER,
ADD COLUMN     "blockWorkoutOrder" INTEGER;

-- AlterTable
ALTER TABLE "WorkoutSet" ADD COLUMN     "durationSec" INTEGER;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "plan" JSONB;

-- AlterTable
ALTER TABLE "BlockTemplate" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceUnit" TEXT;

-- AlterTable
ALTER TABLE "BlockWeek" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "BlockWorkoutExercise" ADD COLUMN     "effortCap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restSec" INTEGER;

-- AlterTable
ALTER TABLE "BlockWorkoutSet" ADD COLUMN     "durationSec" INTEGER,
ADD COLUMN     "repsMax" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "BlockRun" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "blockTemplateId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "BlockRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockRun_userId_idx" ON "BlockRun"("userId");

-- CreateIndex
CREATE INDEX "BlockRun_blockTemplateId_idx" ON "BlockRun"("blockTemplateId");

-- CreateIndex
CREATE INDEX "WorkoutSession_blockRunId_idx" ON "WorkoutSession"("blockRunId");

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_blockRunId_fkey" FOREIGN KEY ("blockRunId") REFERENCES "BlockRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRun" ADD CONSTRAINT "BlockRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockRun" ADD CONSTRAINT "BlockRun_blockTemplateId_fkey" FOREIGN KEY ("blockTemplateId") REFERENCES "BlockTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
