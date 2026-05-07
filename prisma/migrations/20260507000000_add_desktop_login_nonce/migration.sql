-- CreateTable
CREATE TABLE "desktop_login_nonces" (
    "nonce" TEXT NOT NULL,
    "userId" TEXT,
    "token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desktop_login_nonces_pkey" PRIMARY KEY ("nonce")
);

-- CreateIndex
CREATE INDEX "desktop_login_nonces_createdAt_idx" ON "desktop_login_nonces"("createdAt");
