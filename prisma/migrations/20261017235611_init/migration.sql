/*
  Warnings:

  - The required column `id` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "airline" TEXT,
    "departureDate" TEXT NOT NULL,
    "departureTime" TEXT,
    "departureAirport" TEXT,
    "arrivalAirport" TEXT,
    "arrivalDate" TEXT NOT NULL,
    "arrivalTime" TEXT,
    "status" TEXT,
    "tripId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
