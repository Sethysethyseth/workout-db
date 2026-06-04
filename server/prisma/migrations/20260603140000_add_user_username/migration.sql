-- Add nullable username fields (existing rows remain valid).
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
ALTER TABLE "User" ADD COLUMN "usernameKey" TEXT;
CREATE UNIQUE INDEX "User_usernameKey_key" ON "User"("usernameKey");
