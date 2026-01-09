/*
  Warnings:

  - Made the column `description` on table `Rooms` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Rooms" ALTER COLUMN "description" SET NOT NULL;
