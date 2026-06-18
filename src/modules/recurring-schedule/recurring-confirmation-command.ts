import type { LedgerCategory, LedgerRecord } from "../fund-ledger/ledger-records";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  confirmRecurringOccurrence,
  type RecurringOccurrence,
  type RecurringOccurrenceResult,
  type RecurringRule,
} from "./recurring-rules";

const DEFAULT_HOUSEHOLD_ID = "household-demo";

type RecurringConfirmationFailure =
  | Exclude<RecurringOccurrenceResult, { ok: true }>
  | { ok: false; reason: "missing_occurrence" | "stale_confirmation" };

type RecurringConfirmationResult =
  | Extract<RecurringOccurrenceResult, { ok: true }>
  | RecurringConfirmationFailure;

type RecurringOccurrenceRow = {
  id: string;
  householdId: string;
  recurringRuleId: string;
  month: string;
  status: "pending" | "posted" | "skipped";
  ledgerRecordId: string | null;
  recurringRule: {
    id: string;
    type: "income" | "expense";
    amountCents: number;
    categoryId: string;
    sourceMemberId: string | null;
    paymentSource: "fund" | "member" | null;
    payerMemberId: string | null;
    postingMode: "immediate" | "reminder";
    dayOfMonth: number;
    note: string | null;
    active: boolean;
  };
};

export type RecurringConfirmationPrismaClient = {
  $transaction<T>(
    callback: (tx: RecurringConfirmationTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type RecurringConfirmationTransactionClient = {
  recurringOccurrence: {
    findFirst(args: {
      where: {
        id: string;
        householdId: string;
      };
      select: {
        id: true;
        householdId: true;
        recurringRuleId: true;
        month: true;
        status: true;
        ledgerRecordId: true;
        recurringRule: {
          select: {
            id: true;
            type: true;
            amountCents: true;
            categoryId: true;
            sourceMemberId: true;
            paymentSource: true;
            payerMemberId: true;
            postingMode: true;
            dayOfMonth: true;
            note: true;
            active: true;
          };
        };
      };
    }): Promise<RecurringOccurrenceRow | null>;
    updateMany(args: {
      where: {
        id: string;
        householdId: string;
        status: "pending";
        ledgerRecordId: null;
      };
      data: {
        status: "posted";
        ledgerRecordId: string;
      };
    }): Promise<{ count: number }>;
  };
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        type: true;
        status: true;
      };
    }): Promise<LedgerCategory[]>;
  };
  ledgerRecord: {
    create(args: {
      data: {
        id: string;
        householdId: string;
        type: LedgerRecord["type"];
        name: string;
        amountCents: number;
        occurredOn: Date;
        categoryId: string;
        createdByMemberId: string;
        sourceMemberId: string | null;
        paymentSource: "fund" | "member" | null;
        payerMemberId: string | null;
        reimbursementStatus: LedgerRecord["reimbursementStatus"];
        note: string | null;
      };
    }): Promise<unknown>;
  };
};

export type ConfirmRecurringOccurrenceInDatabaseContext = {
  prisma: RecurringConfirmationPrismaClient;
  householdId?: string;
  generateLedgerRecordId?: () => string;
};

export async function confirmRecurringOccurrenceInDatabase(
  actor: AuthenticatedMember,
  command: { occurrenceId: string },
  context: ConfirmRecurringOccurrenceInDatabaseContext,
): Promise<RecurringConfirmationResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;

  try {
    return await context.prisma.$transaction(async (tx) => {
      const [occurrenceRow, categories] = await Promise.all([
        tx.recurringOccurrence.findFirst({
          where: {
            id: command.occurrenceId,
            householdId,
          },
          select: {
            id: true,
            householdId: true,
            recurringRuleId: true,
            month: true,
            status: true,
            ledgerRecordId: true,
            recurringRule: {
              select: {
                id: true,
                type: true,
                amountCents: true,
                categoryId: true,
                sourceMemberId: true,
                paymentSource: true,
                payerMemberId: true,
                postingMode: true,
                dayOfMonth: true,
                note: true,
                active: true,
              },
            },
          },
        }),
        tx.category.findMany({
          where: { householdId },
          select: {
            id: true,
            type: true,
            status: true,
          },
        }),
      ]);

      if (!occurrenceRow) {
        return { ok: false, reason: "missing_occurrence" };
      }

      const result = confirmRecurringOccurrence(
        actor,
        mapRecurringOccurrence(occurrenceRow),
        mapRecurringRule(occurrenceRow.recurringRule),
        {
          categories,
          generateLedgerRecordId: context.generateLedgerRecordId,
        },
      );

      if (!result.ok) {
        return result;
      }

      if (!result.ledgerRecord) {
        return { ok: false, reason: "ledger_record_creation_failed" };
      }

      await tx.ledgerRecord.create({
        data: toLedgerRecordCreateData(result.ledgerRecord, householdId),
      });

      const updateResult = await tx.recurringOccurrence.updateMany({
        where: {
          id: occurrenceRow.id,
          householdId,
          status: "pending",
          ledgerRecordId: null,
        },
        data: {
          status: "posted",
          ledgerRecordId: result.ledgerRecord.id,
        },
      });

      if (updateResult.count !== 1) {
        throw new StaleConfirmationRollback();
      }

      return result;
    });
  } catch (error) {
    if (error instanceof StaleConfirmationRollback) {
      return { ok: false, reason: "stale_confirmation" };
    }

    throw error;
  }
}

function mapRecurringOccurrence(row: RecurringOccurrenceRow): RecurringOccurrence {
  return {
    id: row.id,
    recurringRuleId: row.recurringRuleId,
    month: row.month,
    status: row.status === "posted" ? "posted" : "pending",
    ...(row.ledgerRecordId ? { ledgerRecordId: row.ledgerRecordId } : {}),
  };
}

function mapRecurringRule(row: RecurringOccurrenceRow["recurringRule"]): RecurringRule {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amountCents,
    categoryId: row.categoryId,
    ...(row.sourceMemberId ? { sourceMemberId: row.sourceMemberId } : {}),
    ...(row.paymentSource ? { paymentSource: row.paymentSource } : {}),
    ...(row.payerMemberId ? { payerMemberId: row.payerMemberId } : {}),
    postingMode: row.postingMode,
    dayOfMonth: row.dayOfMonth,
    ...(row.note ? { note: row.note } : {}),
    active: row.active,
  };
}

function toLedgerRecordCreateData(record: LedgerRecord, householdId: string) {
  return {
    id: record.id,
    householdId,
    type: record.type,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: new Date(`${record.occurredOn}T00:00:00.000Z`),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    sourceMemberId: record.type === "income" ? record.sourceMemberId : null,
    paymentSource: record.type === "expense" ? record.paymentSource : null,
    payerMemberId: record.type === "expense" ? record.payerMemberId ?? null : null,
    reimbursementStatus: record.reimbursementStatus,
    note: record.note ?? null,
  };
}

class StaleConfirmationRollback extends Error {}
