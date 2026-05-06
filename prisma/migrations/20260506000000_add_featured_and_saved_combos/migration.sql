-- AlterEnum
ALTER TYPE "ComboStatus" ADD VALUE 'featured';

-- CreateTable
CREATE TABLE "saved_combos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_combos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_combos_userId_savedAt_idx" ON "saved_combos"("userId", "savedAt" DESC);

-- CreateIndex
CREATE INDEX "saved_combos_comboId_idx" ON "saved_combos"("comboId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_combos_userId_comboId_key" ON "saved_combos"("userId", "comboId");

-- AddForeignKey
ALTER TABLE "saved_combos" ADD CONSTRAINT "saved_combos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_combos" ADD CONSTRAINT "saved_combos_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
