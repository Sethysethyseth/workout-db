-- CreateTable
CREATE TABLE "CoachUsage" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachUsage_userId_createdAt_idx" ON "CoachUsage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachUsage" ADD CONSTRAINT "CoachUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
