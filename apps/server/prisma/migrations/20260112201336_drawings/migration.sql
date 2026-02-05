-- CreateTable
CREATE TABLE "Drawings" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drawings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drawings_room_id_user_id_idx" ON "Drawings"("room_id", "user_id");

-- AddForeignKey
ALTER TABLE "Drawings" ADD CONSTRAINT "Drawings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drawings" ADD CONSTRAINT "Drawings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
