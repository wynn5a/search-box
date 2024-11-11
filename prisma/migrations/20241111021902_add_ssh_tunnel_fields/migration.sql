-- AlterTable
ALTER TABLE "Cluster" ADD COLUMN     "localPort" INTEGER,
ADD COLUMN     "remoteHost" TEXT,
ADD COLUMN     "remotePort" INTEGER,
ADD COLUMN     "sshEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sshHost" TEXT,
ADD COLUMN     "sshKeyFile" TEXT,
ADD COLUMN     "sshPassword" TEXT,
ADD COLUMN     "sshPort" INTEGER DEFAULT 22,
ADD COLUMN     "sshUser" TEXT,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
