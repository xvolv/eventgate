-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "EventOccurrence" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "EventOccurrence_locationId_startTime_endTime_idx" ON "EventOccurrence"("locationId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOccurrence" ADD CONSTRAINT "EventOccurrence_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
