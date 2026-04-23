-- CreateTable
CREATE TABLE "ExpenseGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseGroupMember_groupId_userId_key" ON "ExpenseGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "ExpenseGroupMember_userId_createdAt_idx" ON "ExpenseGroupMember"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ExpenseGroupMember"
ADD CONSTRAINT "ExpenseGroupMember_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "ExpenseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseGroupMember"
ADD CONSTRAINT "ExpenseGroupMember_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill owners as members for existing groups
INSERT INTO "ExpenseGroupMember" ("id", "groupId", "userId", "role", "createdAt")
SELECT "id" || '-' || "ownerId", "id", "ownerId", 'owner', CURRENT_TIMESTAMP
FROM "ExpenseGroup"
ON CONFLICT ("groupId", "userId") DO NOTHING;
