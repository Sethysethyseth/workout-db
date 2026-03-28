-- CreateTable BlockWeek
CREATE TABLE "BlockWeek" (
    "id" SERIAL NOT NULL,
    "order" INTEGER NOT NULL,
    "blockTemplateId" INTEGER NOT NULL,

    CONSTRAINT "BlockWeek_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlockWeek_blockTemplateId_idx" ON "BlockWeek"("blockTemplateId");

CREATE UNIQUE INDEX "BlockWeek_blockTemplateId_order_key" ON "BlockWeek"("blockTemplateId", "order");

ALTER TABLE "BlockWeek" ADD CONSTRAINT "BlockWeek_blockTemplateId_fkey" FOREIGN KEY ("blockTemplateId") REFERENCES "BlockTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prepare BlockWorkout for BlockWeek parent (column added before data backfill)
ALTER TABLE "BlockWorkout" ADD COLUMN "blockWeekId" INTEGER;

-- One training week per existing block; all current workouts move under it (Week 1).
INSERT INTO "BlockWeek" ("order", "blockTemplateId")
SELECT 1, "id" FROM "BlockTemplate";

UPDATE "BlockWorkout" AS bw
SET "blockWeekId" = w."id"
FROM "BlockWeek" AS w
WHERE w."blockTemplateId" = bw."blockTemplateId" AND w."order" = 1;

-- Remove BlockWorkout → BlockTemplate
ALTER TABLE "BlockWorkout" DROP CONSTRAINT "BlockWorkout_blockTemplateId_fkey";

DROP INDEX "BlockWorkout_blockTemplateId_order_key";
DROP INDEX "BlockWorkout_blockTemplateId_idx";

ALTER TABLE "BlockWorkout" DROP COLUMN "blockTemplateId";

ALTER TABLE "BlockWorkout" ALTER COLUMN "blockWeekId" SET NOT NULL;

CREATE UNIQUE INDEX "BlockWorkout_blockWeekId_order_key" ON "BlockWorkout"("blockWeekId", "order");
CREATE INDEX "BlockWorkout_blockWeekId_idx" ON "BlockWorkout"("blockWeekId");

ALTER TABLE "BlockWorkout" ADD CONSTRAINT "BlockWorkout_blockWeekId_fkey" FOREIGN KEY ("blockWeekId") REFERENCES "BlockWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
