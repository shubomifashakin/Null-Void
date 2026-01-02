/*
  Warnings:

  - A unique constraint covering the columns `[token_id]` on the table `RefreshTokens` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokens_token_id_key" ON "RefreshTokens"("token_id");
