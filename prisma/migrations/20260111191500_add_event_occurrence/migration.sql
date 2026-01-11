-- CreateTable
CREATE TABLE "EventOccurrence" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventOccurrence_eventId_startTime_idx" ON "EventOccurrence"("eventId", "startTime");

-- AddForeignKey
ALTER TABLE "EventOccurrence" ADD CONSTRAINT "EventOccurrence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing single-range events into a single occurrence
INSERT INTO "EventOccurrence" (
    "id",
    "eventId",
    "startTime",
    "endTime",
    "location",
    "createdAt",
    "updatedAt"
)
SELECT
    md5("id" || '-' || "startTime"::text || '-' || "endTime"::text),
    "id",
    "startTime",
    "endTime",
    "location",
    "createdAt",
    "updatedAt"
FROM "Event";
