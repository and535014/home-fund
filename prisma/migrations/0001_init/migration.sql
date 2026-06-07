-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('invited', 'active', 'disabled');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'finance_manager', 'general_member');

-- CreateEnum
CREATE TYPE "MemberCapability" AS ENUM ('manage_categories', 'manage_recurring');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "LedgerRecordType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "PaymentSource" AS ENUM ('fund', 'member');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('not_applicable', 'not_refundable', 'refundable', 'reimbursed');

-- CreateEnum
CREATE TYPE "RecurringPostingMode" AS ENUM ('immediate', 'reminder');

-- CreateEnum
CREATE TYPE "RecurringOccurrenceStatus" AS ENUM ('pending', 'posted', 'skipped');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "googleAccountEmail" TEXT,
    "googleSubject" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'invited',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberRoleAssignment" (
    "memberId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberRoleAssignment_pkey" PRIMARY KEY ("memberId","role")
);

-- CreateTable
CREATE TABLE "MemberCapabilityAssignment" (
    "memberId" TEXT NOT NULL,
    "capability" "MemberCapability" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberCapabilityAssignment_pkey" PRIMARY KEY ("memberId","capability")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CategoryStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerRecord" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "LedgerRecordType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "occurredOn" DATE NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "sourceMemberId" TEXT,
    "paymentSource" "PaymentSource",
    "payerMemberId" TEXT,
    "reimbursementStatus" "ReimbursementStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringRule" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "LedgerRecordType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sourceMemberId" TEXT,
    "paymentSource" "PaymentSource",
    "payerMemberId" TEXT,
    "postingMode" "RecurringPostingMode" NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringOccurrence" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "recurringRuleId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "RecurringOccurrenceStatus" NOT NULL,
    "ledgerRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReimbursementBatch" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "reimbursedById" TEXT NOT NULL,
    "reimbursedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReimbursementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReimbursementBatchItem" (
    "reimbursementBatchId" TEXT NOT NULL,
    "ledgerRecordId" TEXT NOT NULL,

    CONSTRAINT "ReimbursementBatchItem_pkey" PRIMARY KEY ("reimbursementBatchId","ledgerRecordId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_googleAccountEmail_key" ON "Member"("googleAccountEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Member_googleSubject_key" ON "Member"("googleSubject");

-- CreateIndex
CREATE INDEX "Member_householdId_idx" ON "Member"("householdId");

-- CreateIndex
CREATE INDEX "Category_householdId_type_name_idx" ON "Category"("householdId", "type", "name");

-- CreateIndex
CREATE INDEX "Category_householdId_type_status_idx" ON "Category"("householdId", "type", "status");

-- CreateIndex
CREATE INDEX "LedgerRecord_householdId_occurredOn_idx" ON "LedgerRecord"("householdId", "occurredOn");

-- CreateIndex
CREATE INDEX "LedgerRecord_householdId_type_occurredOn_idx" ON "LedgerRecord"("householdId", "type", "occurredOn");

-- CreateIndex
CREATE INDEX "LedgerRecord_householdId_reimbursementStatus_occurredOn_idx" ON "LedgerRecord"("householdId", "reimbursementStatus", "occurredOn");

-- CreateIndex
CREATE INDEX "LedgerRecord_payerMemberId_reimbursementStatus_idx" ON "LedgerRecord"("payerMemberId", "reimbursementStatus");

-- CreateIndex
CREATE INDEX "RecurringRule_householdId_active_idx" ON "RecurringRule"("householdId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringOccurrence_ledgerRecordId_key" ON "RecurringOccurrence"("ledgerRecordId");

-- CreateIndex
CREATE INDEX "RecurringOccurrence_householdId_month_status_idx" ON "RecurringOccurrence"("householdId", "month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringOccurrence_recurringRuleId_month_key" ON "RecurringOccurrence"("recurringRuleId", "month");

-- CreateIndex
CREATE INDEX "ReimbursementBatch_householdId_reimbursedAt_idx" ON "ReimbursementBatch"("householdId", "reimbursedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReimbursementBatchItem_ledgerRecordId_key" ON "ReimbursementBatchItem"("ledgerRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRoleAssignment" ADD CONSTRAINT "MemberRoleAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberCapabilityAssignment" ADD CONSTRAINT "MemberCapabilityAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRecord" ADD CONSTRAINT "LedgerRecord_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRecord" ADD CONSTRAINT "LedgerRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRecord" ADD CONSTRAINT "LedgerRecord_createdByMemberId_fkey" FOREIGN KEY ("createdByMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRecord" ADD CONSTRAINT "LedgerRecord_sourceMemberId_fkey" FOREIGN KEY ("sourceMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerRecord" ADD CONSTRAINT "LedgerRecord_payerMemberId_fkey" FOREIGN KEY ("payerMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_ledgerRecordId_fkey" FOREIGN KEY ("ledgerRecordId") REFERENCES "LedgerRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementBatch" ADD CONSTRAINT "ReimbursementBatch_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementBatch" ADD CONSTRAINT "ReimbursementBatch_reimbursedById_fkey" FOREIGN KEY ("reimbursedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementBatchItem" ADD CONSTRAINT "ReimbursementBatchItem_reimbursementBatchId_fkey" FOREIGN KEY ("reimbursementBatchId") REFERENCES "ReimbursementBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementBatchItem" ADD CONSTRAINT "ReimbursementBatchItem_ledgerRecordId_fkey" FOREIGN KEY ("ledgerRecordId") REFERENCES "LedgerRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
