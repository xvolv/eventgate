/*
  Warnings:

  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clubId,email,role]` on the table `ClubRoleGrant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClubRoleGrant_clubId_email_role_key" ON "ClubRoleGrant"("clubId", "email", "role");
