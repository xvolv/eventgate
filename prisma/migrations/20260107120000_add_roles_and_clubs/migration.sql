-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'DIRECTOR', 'STUDENT_UNION');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('PRESIDENT', 'VP', 'SECRETARY');

-- CreateTable
CREATE TABLE "SystemRoleGrant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "SystemRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemRoleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRoleGrant" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubRoleGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemRoleGrant_email_role_key" ON "SystemRoleGrant"("email", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClubRoleGrant_clubId_role_key" ON "ClubRoleGrant"("clubId", "role");

-- AddForeignKey
ALTER TABLE "ClubRoleGrant" ADD CONSTRAINT "ClubRoleGrant_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
