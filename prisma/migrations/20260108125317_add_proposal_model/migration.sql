-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'SU_APPROVED', 'SU_REJECTED', 'DIRECTOR_APPROVED', 'DIRECTOR_REJECTED', 'RESUBMISSION_REQUIRED');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "eventDates" TEXT NOT NULL,
    "eventStartTime" TEXT NOT NULL,
    "eventEndTime" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "collaboratingOrgs" TEXT,
    "invitedGuests" TEXT,
    "presidentName" TEXT NOT NULL,
    "presidentMobile" TEXT,
    "vpName" TEXT,
    "secretaryName" TEXT,
    "suRecommendation" TEXT,
    "suComments" TEXT,
    "suApprovedBy" TEXT,
    "suApprovedAt" TIMESTAMP(3),
    "directorApproval" TEXT,
    "directorComments" TEXT,
    "directorApprovedBy" TEXT,
    "directorApprovedAt" TIMESTAMP(3),
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "resubmissionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_clubId_status_idx" ON "Proposal"("clubId", "status");

-- CreateIndex
CREATE INDEX "Proposal_submittedBy_idx" ON "Proposal"("submittedBy");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
