-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Score_game_points_idx" ON "Score"("game", "points");
