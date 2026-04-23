CREATE TABLE "ExpenseGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Expense" ADD COLUMN "groupId" TEXT;

CREATE INDEX "ExpenseGroup_ownerId_createdAt_idx" ON "ExpenseGroup"("ownerId", "createdAt");
CREATE UNIQUE INDEX "ExpenseGroup_ownerId_name_key" ON "ExpenseGroup"("ownerId", "name");
CREATE INDEX "Expense_groupId_idx" ON "Expense"("groupId");

ALTER TABLE "ExpenseGroup" ADD CONSTRAINT "ExpenseGroup_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Expense" ADD CONSTRAINT "Expense_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "ExpenseGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
