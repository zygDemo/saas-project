-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "fuelType" INTEGER,
ADD COLUMN     "insuranceExpirationDate" TIMESTAMP(3),
ADD COLUMN     "isFault" INTEGER,
ADD COLUMN     "isInsurance" INTEGER,
ADD COLUMN     "loanAmount" DECIMAL(15,2),
ADD COLUMN     "loanTerm" INTEGER,
ADD COLUMN     "monthlyPayment" DECIMAL(15,2),
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "purchaseType" INTEGER;
