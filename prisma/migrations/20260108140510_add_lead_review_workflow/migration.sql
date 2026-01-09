-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProposalStatus" ADD VALUE 'LEAD_REVIEW';
ALTER TYPE "ProposalStatus" ADD VALUE 'LEAD_APPROVED';
ALTER TYPE "ProposalStatus" ADD VALUE 'LEAD_REJECTED';

-- CreateTable
CREATE TABLE "ProposalLeadApproval" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "leadRole" "ClubRole" NOT NULL,
    "leadEmail" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalLeadApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProposalLeadApproval_proposalId_leadRole_key" ON "ProposalLeadApproval"("proposalId", "leadRole");

-- AddForeignKey
ALTER TABLE "ProposalLeadApproval" ADD CONSTRAINT "ProposalLeadApproval_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
