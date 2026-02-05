/*
  Warnings:

  - You are about to drop the `Drawings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Drawings" DROP CONSTRAINT "Drawings_room_id_fkey";

-- DropForeignKey
ALTER TABLE "Drawings" DROP CONSTRAINT "Drawings_user_id_fkey";

-- DropTable
DROP TABLE "Drawings";

-- CreateTable
CREATE TABLE "Snapshots" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "room_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "snapshots_room_id_idx" ON "Snapshots"("room_id");

-- AddForeignKey
ALTER TABLE "Snapshots" ADD CONSTRAINT "Snapshots_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
