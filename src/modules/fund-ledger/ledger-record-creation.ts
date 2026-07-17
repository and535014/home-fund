import { getPrismaClient } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { authorize } from "@/modules/identity-access/authorization";
import {
  findDisabledHouseholdMember,
  findFinancialAttributionMember,
} from "@/modules/identity-access/household-member-query";
import type { HouseholdScopedAuthenticatedMember } from "@/modules/identity-access/session-access";
import type { RecurringPostingSystemActor } from "@/modules/identity-access/system-actor";

export type LedgerCreationMemberActor = {
  kind: "member";
  member: HouseholdScopedAuthenticatedMember;
};

export type LedgerRecordDraft =
  | {
      type: "income";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      sourceMemberId: string;
      note?: string;
    }
  | {
      type: "expense";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      paymentSource: "fund" | "member";
      payerMemberId?: string;
      note?: string;
    };

export type CreateManualRecordResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "missing_name"
        | "invalid_amount"
        | "invalid_date"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "missing_member_payer"
        | "fund_paid_expense_cannot_have_member_payer"
        | "member_outside_household"
        | "disabled_member";
    };

type KernelRequest = {
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor;
  createdByMemberId: string;
  draft: LedgerRecordDraft;
  authorize: (input: {
    attributionMemberId: string;
    createdByMemberId: string;
  }) => { allowed: true } | { allowed: false; reason: string };
};

type KernelResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason: Extract<CreateManualRecordResult, { ok: false }>['reason'];
    };

export async function createManualRecord(
  actor: LedgerCreationMemberActor,
  draft: LedgerRecordDraft,
): Promise<CreateManualRecordResult> {
  return getPrismaClient().$transaction(async (tx) =>
    createLedgerRecordWithinTransaction(tx, {
      actor,
      createdByMemberId: actor.member.id,
      draft,
      authorize: ({ attributionMemberId }) => authorize(actor.member, {
        type:
          draft.type === "income"
            ? "create_income_record"
            : "create_expense_record",
        targetMemberId: attributionMemberId,
      }),
    }),
  );
}

async function createLedgerRecordWithinTransaction(
  tx: Prisma.TransactionClient,
  request: KernelRequest,
): Promise<KernelResult> {
  const householdId = householdIdFor(request.actor);
  const category = await tx.category.findFirst({
    where: { id: request.draft.categoryId, householdId },
    select: { id: true, status: true, type: true },
  });

  const attribution = await resolveAttributionMember({
    tx,
    householdId,
    draft: request.draft,
    createdByMemberId: request.createdByMemberId,
  });

  const validation = validateDraft(request.draft, category, attribution);
  if (!validation.ok) {
    return validation;
  }
  if (!attribution.ok) {
    return attribution;
  }

  const authorization = request.authorize({
    attributionMemberId: attribution.memberId,
    createdByMemberId: request.createdByMemberId,
  });
  if (!authorization.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const recordId = crypto.randomUUID();
  await tx.ledgerRecord.create({
    data: toPrismaLedgerRecordCreateData({
      id: recordId,
      householdId,
      createdByMemberId: request.createdByMemberId,
      draft: request.draft,
    }),
  });

  return { ok: true, recordId };
}

function householdIdFor(
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor,
): string {
  return actor.kind === "member" ? actor.member.householdId : actor.householdId;
}

type AttributionResolution =
  | { ok: true; memberId: string }
  | { ok: false; reason: "missing_member_payer" | "member_outside_household" | "disabled_member" };

async function resolveAttributionMember({
  tx,
  householdId,
  draft,
  createdByMemberId,
}: {
  tx: Prisma.TransactionClient;
  householdId: string;
  draft: LedgerRecordDraft;
  createdByMemberId: string;
}): Promise<AttributionResolution> {
  const memberId = draft.type === "income"
    ? draft.sourceMemberId
    : draft.paymentSource === "member"
      ? draft.payerMemberId
      : createdByMemberId;

  if (!memberId) {
    return { ok: false, reason: "missing_member_payer" };
  }

  if (draft.type === "expense" && draft.paymentSource === "fund") {
    return { ok: true, memberId };
  }

  const availableMember = await findFinancialAttributionMember({
    householdId,
    memberId,
    prisma: tx,
  });
  if (availableMember) {
    return { ok: true, memberId: availableMember.id };
  }

  const disabledMember = await findDisabledHouseholdMember({
    householdId,
    memberId,
    prisma: tx,
  });
  return disabledMember
    ? { ok: false, reason: "disabled_member" }
    : { ok: false, reason: "member_outside_household" };
}

function validateDraft(
  draft: LedgerRecordDraft,
  category: { id: string; status: "active" | "archived"; type: "income" | "expense" } | null,
  attribution: AttributionResolution,
): { ok: true } | Extract<KernelResult, { ok: false }> {
  if (!draft.name.trim()) {
    return { ok: false, reason: "missing_name" };
  }
  if (!Number.isInteger(draft.amountCents) || draft.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (!isIsoDate(draft.occurredOn)) {
    return { ok: false, reason: "invalid_date" };
  }
  if (!category) {
    return { ok: false, reason: "missing_category" };
  }
  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }
  if (category.type !== draft.type) {
    return { ok: false, reason: "category_type_mismatch" };
  }
  if (draft.type === "expense" && draft.paymentSource === "fund" && draft.payerMemberId) {
    return { ok: false, reason: "fund_paid_expense_cannot_have_member_payer" };
  }
  return attribution;
}

function toPrismaLedgerRecordCreateData({
  id,
  householdId,
  createdByMemberId,
  draft,
}: {
  id: string;
  householdId: string;
  createdByMemberId: string;
  draft: LedgerRecordDraft;
}): Prisma.LedgerRecordCreateInput {
  const base = {
    id,
    household: { connect: { id: householdId } },
    type: draft.type,
    name: draft.name,
    amountCents: draft.amountCents,
    occurredOn: new Date(`${draft.occurredOn}T00:00:00.000Z`),
    category: { connect: { id: draft.categoryId } },
    createdByMember: { connect: { id: createdByMemberId } },
    status: "active" as const,
    ...(draft.note ? { note: draft.note } : {}),
  };

  if (draft.type === "income") {
    return {
      ...base,
      sourceMember: { connect: { id: draft.sourceMemberId } },
      reimbursementStatus: "not_applicable",
    };
  }

  if (draft.paymentSource === "fund") {
    return {
      ...base,
      paymentSource: "fund",
      reimbursementStatus: "not_refundable",
    };
  }

  return {
    ...base,
    paymentSource: "member",
    payerMember: { connect: { id: draft.payerMemberId } },
    reimbursementStatus: "refundable",
  };
}

function isIsoDate(value: string): boolean {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u.exec(value);
  if (!match?.groups) {
    return false;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
