-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('AWS', 'GCP', 'AZURE');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'PENDING', 'ERROR');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('RUNNING', 'IDLE', 'UNDERUTILIZED', 'STOPPED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('BUDGET_BREACH', 'COST_SPIKE', 'IDLE_RESOURCE', 'FORECAST_OVERRUN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "company" TEXT,
    "jobTitle" TEXT,
    "monthlyBudget" DOUBLE PRECISION NOT NULL DEFAULT 25000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "CloudProvider" NOT NULL DEFAULT 'AWS',
    "name" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "roleArn" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "accessKeyHint" TEXT,
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudResource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "instanceType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL,
    "cpuUtilization" DOUBLE PRECISION NOT NULL,
    "memoryUtilization" DOUBLE PRECISION,
    "networkGb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyCost" DOUBLE PRECISION NOT NULL,
    "estimatedSavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendation" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "service" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CostLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "service" TEXT,
    "amount" DOUBLE PRECISION,
    "threshold" DOUBLE PRECISION,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CloudConnection_userId_idx" ON "CloudConnection"("userId");

-- CreateIndex
CREATE INDEX "CloudResource_userId_status_idx" ON "CloudResource"("userId", "status");

-- CreateIndex
CREATE INDEX "CloudResource_userId_service_idx" ON "CloudResource"("userId", "service");

-- CreateIndex
CREATE INDEX "CostLog_userId_date_idx" ON "CostLog"("userId", "date");

-- CreateIndex
CREATE INDEX "CostLog_userId_service_date_idx" ON "CostLog"("userId", "service", "date");

-- CreateIndex
CREATE INDEX "Alert_userId_read_createdAt_idx" ON "Alert"("userId", "read", "createdAt");

-- AddForeignKey
ALTER TABLE "CloudConnection" ADD CONSTRAINT "CloudConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudResource" ADD CONSTRAINT "CloudResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLog" ADD CONSTRAINT "CostLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
