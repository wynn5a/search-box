/*
  Warnings:

  - Added the required column `userId` to the `Cluster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `QueryTemplate` table without a default value. This is not possible if the table is not empty.

*/

-- clear data in Cluster and QueryTemplate
DELETE FROM "QueryTemplate";

DELETE FROM "Cluster";

-- AlterTable
ALTER TABLE "Cluster" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QueryTemplate" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryTemplate" ADD CONSTRAINT "QueryTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
