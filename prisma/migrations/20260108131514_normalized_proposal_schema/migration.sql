/*
  Warnings:

  - You are about to drop the column `collaboratingOrgs` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `directorApproval` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `directorApprovedAt` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `directorApprovedBy` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `directorComments` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventDates` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventDescription` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventEndTime` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventLocation` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventStartTime` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `eventTitle` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `invitedGuests` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `presidentMobile` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `presidentName` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `secretaryName` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `suApprovedAt` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `suApprovedBy` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `suComments` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `suRecommendation` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `vpName` on the `Proposal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId]` on the table `Proposal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY');

-- CreateEnum
CREATE TYPE "ReviewRole" AS ENUM ('STUDENT_UNION', 'DIRECTOR');

-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "collaboratingOrgs",
DROP COLUMN "directorApproval",
DROP COLUMN "directorApprovedAt",
DROP COLUMN "directorApprovedBy",
DROP COLUMN "directorComments",
DROP COLUMN "eventDates",
DROP COLUMN "eventDescription",
DROP COLUMN "eventEndTime",
DROP COLUMN "eventLocation",
DROP COLUMN "eventStartTime",
DROP COLUMN "eventTitle",
DROP COLUMN "invitedGuests",
DROP COLUMN "presidentMobile",
DROP COLUMN "presidentName",
DROP COLUMN "secretaryName",
DROP COLUMN "suApprovedAt",
DROP COLUMN "suApprovedBy",
DROP COLUMN "suComments",
DROP COLUMN "suRecommendation",
DROP COLUMN "vpName",
ADD COLUMN     "eventId" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalContact" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalCollaborator" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalGuest" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "affiliation" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalReview" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerRole" "ReviewRole" NOT NULL,
    "reviewerEmail" TEXT NOT NULL,
    "recommendation" TEXT,
    "comments" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_proposalId_key" ON "Event"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalContact_proposalId_role_key" ON "ProposalContact"("proposalId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalReview_proposalId_reviewerRole_key" ON "ProposalReview"("proposalId", "reviewerRole");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_eventId_key" ON "Proposal"("eventId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalContact" ADD CONSTRAINT "ProposalContact_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalCollaborator" ADD CONSTRAINT "ProposalCollaborator_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalGuest" ADD CONSTRAINT "ProposalGuest_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReview" ADD CONSTRAINT "ProposalReview_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
