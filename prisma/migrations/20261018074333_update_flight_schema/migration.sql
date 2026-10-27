/*
  Warnings:

  - Made the column `airline` on table `Flight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `departureAirport` on table `Flight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `arrivalAirport` on table `Flight` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Flight` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Flight" ALTER COLUMN "airline" SET NOT NULL,
ALTER COLUMN "departureAirport" SET NOT NULL,
ALTER COLUMN "arrivalAirport" SET NOT NULL,
ALTER COLUMN "arrivalDate" DROP NOT NULL,
ALTER COLUMN "status" SET NOT NULL;
