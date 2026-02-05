/*
  Warnings:

  - A unique constraint covering the columns `[room_id,timestamp]` on the table `Snapshots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Snapshots_room_id_timestamp_key" ON "Snapshots"("room_id", "timestamp");
