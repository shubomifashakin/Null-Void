-- DropIndex
DROP INDEX "snapshots_room_id_idx";

-- CreateIndex
CREATE INDEX "snapshots_room_id_idx" ON "Snapshots"("room_id", "timestamp");
