-- AlterTable
ALTER TABLE "User" ADD COLUMN "aiConnectorEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "AiConsent" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiConsent_userId_key" ON "AiConsent"("userId");

-- CreateIndex
CREATE INDEX "AiConsent_userId_idx" ON "AiConsent"("userId");

-- AddForeignKey
ALTER TABLE "AiConsent" ADD CONSTRAINT "AiConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
