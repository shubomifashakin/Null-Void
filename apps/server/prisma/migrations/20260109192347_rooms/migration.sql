-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Rooms" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "description" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMembers" (
    "id" TEXT NOT NULL,
    "role" "Roles" NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invites" (
    "id" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "email" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "role" "Roles" NOT NULL,
    "room_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomMembers_room_id_user_id_key" ON "RoomMembers"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "invites_email_idx" ON "Invites"("email", "room_id", "status");

-- AddForeignKey
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMembers" ADD CONSTRAINT "RoomMembers_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMembers" ADD CONSTRAINT "RoomMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invites" ADD CONSTRAINT "Invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invites" ADD CONSTRAINT "Invites_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
