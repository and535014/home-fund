# Editable Ledger Record Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓既有單筆收支編輯流程可在「成員支出／收入／基金支出」間切換，並由 server-side Fund Ledger correction 原子地重建正確類型、專屬欄位與退款資格。

**Architecture:** 抽出 app-layer 共用的 record entry kind 與 Tabs，新增與編輯表單各自維持生命週期。更新 command 改為目標類型 discriminated union；Fund Ledger 先驗證原 record 的權限與狀態，再依目標類型建立合法 record，既有 Prisma transaction 更新同一 record ID，因此 recurring occurrence 與 CSV import row 關聯不變。

**Tech Stack:** Next.js App Router、React、TypeScript、Prisma/PostgreSQL、Vitest、Testing Library、Playwright、pnpm。

## Global Constraints

- 主要介面與錯誤訊息使用繁體中文；中文與英文／數字之間保留半形空格。
- 僅處理單筆 active、尚未退款且原本可編輯的 ledger record；不新增批次類型修改或 reimbursement reversal。
- mutation 必須在 server boundary 重新驗證登入、household scope、權限、record state、category 與目標類型專屬欄位。
- Ledger correction 與 persistence 維持既有 transaction；不信任 client 傳入的 type、category ID、member ID 或 UI state。
- 不修改 Prisma schema、不新增 migration、不手動修改 `src/generated/prisma/`。
- 不改寫 recurring rule、future occurrences、原始 CSV 或 import batch 結果；只保留同一 record ID 的來源關聯。
- 不新增完整 correction history；沿用最新狀態與 `updatedAt`。
- 不平行執行會呼叫 `prisma generate` 的命令。
- 開發採 TDD；每個 task 先確認測試會因缺少該行為而失敗，再加入最小實作。

## File Map

- Create `src/app/ledger-record-entry-kind.ts`：entry kind 常數、型別、`type / paymentSource` 映射，以及由既有 record 推導初始 kind。
- Create `src/app/ledger-record-entry-kind.test.ts`：純 mapping 與初始 kind 單元測試。
- Create `src/app/ledger-record-entry-kind-tabs.tsx`：共用「成員支出／收入／基金支出」Tabs。
- Create `src/app/ledger-record-entry-kind-tabs.test.tsx`：Tabs value、disabled 與 change callback 測試。
- Modify `src/app/record-entry-panel.tsx`：移除本地重複常數／Tabs，改用共用 entry kind；保留週期事件流程。
- Modify `src/app/record-entry-panel.test.tsx`：保護新增流程提交的 `recordType / paymentSource`。
- Modify `src/modules/fund-ledger/ledger-record-corrections.ts`：目標類型 command union 與明確 record reconstruction。
- Modify `src/modules/fund-ledger/ledger-record-corrections.test.ts`：收入／支出雙向轉換、欄位清除、退款資格與阻擋條件。
- Modify `src/modules/fund-ledger/ledger-record-command.ts`：在 transaction 內載入 active household member IDs，並與 category、record 一起交給 Domain 驗證。
- Modify `src/app/ledger-record-form.ts`：update parser 保留目標 type 與完整類型專屬欄位。
- Modify `src/app/ledger-record-form.test.ts`：3 種 update command 與錯誤解析。
- Modify `src/modules/fund-ledger/ledger-record-command.test.ts`：transaction persistence 更新 type 與 null-cleared 欄位。
- Modify `src/app/ledger-record-actions.ts`：將不屬於 household 的來源／付款成員錯誤映射到對應欄位。
- Create `src/app/ledger-record-actions.test.ts`：直接驗證 update action 的 household member 錯誤訊息與欄位映射。
- Modify `src/app/ledger-record-form-fields.tsx`：member select 可選擇性顯示空白 placeholder，要求切換後重新選擇。
- Modify `src/app/_record-detail/record-detail-dialog.tsx`：編輯 Dialog 的 entry kind state、重設規則、提示與 hidden fields。
- Modify `src/app/_record-detail/record-detail-dialog.test.tsx`：初始化、切換清除／保留、切回不恢復、server error 保留輸入。
- Modify `e2e/record-edit-delete.spec.ts`：兩個方向的主要使用流程、摘要與待退款 read models。
- Modify `.ai/requirements/edit-ledger-record-type.md`：實作完成後將 status 改為 done 並補上實際驗證摘要。

---

### Task 1: Extract The Shared Ledger Record Entry Kind

**Files:**
- Create: `src/app/ledger-record-entry-kind.ts`
- Create: `src/app/ledger-record-entry-kind.test.ts`
- Create: `src/app/ledger-record-entry-kind-tabs.tsx`
- Create: `src/app/ledger-record-entry-kind-tabs.test.tsx`
- Modify: `src/app/record-entry-panel.tsx:40-63,117-169,250-268,371-403`
- Modify: `src/app/record-entry-panel.test.tsx:34-88`

**Interfaces:**
- Produces: `LEDGER_RECORD_ENTRY_KIND`, `LedgerRecordEntryKind`, `ledgerRecordFieldsForEntryKind(kind)`, `ledgerRecordEntryKindForRecord(record)`, `LedgerRecordEntryKindTabs`.
- Consumes: `LedgerRecord` type and existing `Tabs`, `TabsList`, `TabsTrigger` components.

- [ ] **Step 1: Write failing mapping tests**

Create `src/app/ledger-record-entry-kind.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  LEDGER_RECORD_ENTRY_KIND,
  ledgerRecordEntryKindForRecord,
  ledgerRecordFieldsForEntryKind,
} from "./ledger-record-entry-kind";

describe("ledger record entry kind", () => {
  it.each([
    [LEDGER_RECORD_ENTRY_KIND.income, { recordType: "income", paymentSource: null }],
    [LEDGER_RECORD_ENTRY_KIND.memberExpense, { recordType: "expense", paymentSource: "member" }],
    [LEDGER_RECORD_ENTRY_KIND.fundExpense, { recordType: "expense", paymentSource: "fund" }],
  ] as const)("maps %s to submitted ledger fields", (kind, expected) => {
    expect(ledgerRecordFieldsForEntryKind(kind)).toEqual(expected);
  });

  it("derives the initial kind from a persisted ledger record", () => {
    expect(ledgerRecordEntryKindForRecord({ type: "income" })).toBe("income");
    expect(ledgerRecordEntryKindForRecord({
      type: "expense",
      paymentSource: "member",
    })).toBe("member-expense");
    expect(ledgerRecordEntryKindForRecord({
      type: "expense",
      paymentSource: "fund",
    })).toBe("fund-expense");
  });
});
```

- [ ] **Step 2: Run the mapping test and confirm red**

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-entry-kind.test.ts
```

Expected: FAIL because `src/app/ledger-record-entry-kind.ts` does not exist.

- [ ] **Step 3: Implement the pure entry kind mapping**

Create `src/app/ledger-record-entry-kind.ts`:

```ts
export const LEDGER_RECORD_ENTRY_KIND = {
  fundExpense: "fund-expense",
  income: "income",
  memberExpense: "member-expense",
} as const;

export type LedgerRecordEntryKind =
  (typeof LEDGER_RECORD_ENTRY_KIND)[keyof typeof LEDGER_RECORD_ENTRY_KIND];

export type LedgerRecordEntryFields =
  | { recordType: "income"; paymentSource: null }
  | { recordType: "expense"; paymentSource: "fund" | "member" };

export function ledgerRecordFieldsForEntryKind(
  kind: LedgerRecordEntryKind,
): LedgerRecordEntryFields {
  if (kind === LEDGER_RECORD_ENTRY_KIND.income) {
    return { recordType: "income", paymentSource: null };
  }

  return {
    recordType: "expense",
    paymentSource:
      kind === LEDGER_RECORD_ENTRY_KIND.fundExpense ? "fund" : "member",
  };
}

export function ledgerRecordEntryKindForRecord(
  record:
    | { type: "income" }
    | { type: "expense"; paymentSource: "fund" | "member" },
): LedgerRecordEntryKind {
  if (record.type === "income") {
    return LEDGER_RECORD_ENTRY_KIND.income;
  }

  return record.paymentSource === "fund"
    ? LEDGER_RECORD_ENTRY_KIND.fundExpense
    : LEDGER_RECORD_ENTRY_KIND.memberExpense;
}
```

- [ ] **Step 4: Run the mapping test and confirm green**

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-entry-kind.test.ts
```

Expected: PASS with 4 cases.

- [ ] **Step 5: Write the failing shared Tabs component test**

Create `src/app/ledger-record-entry-kind-tabs.test.tsx`:

```tsx
// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedgerRecordEntryKindTabs } from "./ledger-record-entry-kind-tabs";

afterEach(cleanup);

describe("LedgerRecordEntryKindTabs", () => {
  it("renders the three shared choices and reports a change", () => {
    const onEntryKindChange = vi.fn();
    render(
      <LedgerRecordEntryKindTabs
        entryKind="member-expense"
        onEntryKindChange={onEntryKindChange}
      />,
    );

    expect(screen.getByRole("tab", { name: "成員支出" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.click(screen.getByRole("tab", { name: "收入" }));
    expect(onEntryKindChange).toHaveBeenCalledWith("income");
  });

  it("disables every choice while a mutation is pending", () => {
    render(
      <LedgerRecordEntryKindTabs
        disabled
        entryKind="income"
        onEntryKindChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("tab")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ disabled: true }),
        expect.objectContaining({ disabled: true }),
        expect.objectContaining({ disabled: true }),
      ]),
    );
  });
});
```

- [ ] **Step 6: Run the Tabs test and confirm red**

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-entry-kind-tabs.test.tsx
```

Expected: FAIL because `LedgerRecordEntryKindTabs` does not exist.

- [ ] **Step 7: Implement the shared Tabs and refactor the create form**

Create `src/app/ledger-record-entry-kind-tabs.tsx`:

```tsx
"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LEDGER_RECORD_ENTRY_KIND,
  type LedgerRecordEntryKind,
} from "./ledger-record-entry-kind";

export function LedgerRecordEntryKindTabs({
  disabled = false,
  entryKind,
  onEntryKindChange,
}: {
  disabled?: boolean;
  entryKind: LedgerRecordEntryKind;
  onEntryKindChange: (entryKind: LedgerRecordEntryKind) => void;
}) {
  return (
    <Tabs
      className="gap-0"
      onValueChange={(value) => onEntryKindChange(value as LedgerRecordEntryKind)}
      value={entryKind}
    >
      <TabsList aria-label="紀錄類型" className="w-full" variant="line">
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.memberExpense}>
          成員支出
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.income}>
          收入
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={LEDGER_RECORD_ENTRY_KIND.fundExpense}>
          基金支出
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

In `src/app/record-entry-panel.tsx`, import the new helpers, delete the local constants/types and local `RecordKindTabs`, then derive fields centrally:

```tsx
const [entryKind, setEntryKind] = useState<LedgerRecordEntryKind>(
  initialMode === "income"
    ? LEDGER_RECORD_ENTRY_KIND.income
    : LEDGER_RECORD_ENTRY_KIND.memberExpense,
);
const { paymentSource, recordType } =
  ledgerRecordFieldsForEntryKind(entryKind);
```

Render the shared component and only submit `paymentSource` for expenses:

```tsx
<LedgerRecordEntryKindTabs
  disabled={isPending}
  entryKind={entryKind}
  onEntryKindChange={onEntryKindChange}
/>

<input name="recordType" type="hidden" value={recordType} />
{paymentSource ? (
  <input name="paymentSource" type="hidden" value={paymentSource} />
) : null}
```

Keep `RecordEntryForm`, recurrence state and both Server Actions otherwise unchanged.

- [ ] **Step 8: Protect the create flow and run focused tests**

Add to `src/app/record-entry-panel.test.tsx`:

```tsx
it("submits the shared entry kind fields without changing recurrence behavior", async () => {
  await renderRecordEntryPanel();
  fireEvent.click(screen.getByRole("tab", { name: "基金支出" }));
  fillExpenseForm();
  fireEvent.submit(getRecordEntryForm());

  await waitFor(() => expect(createLedgerRecordAction).toHaveBeenCalled());
  const formData = vi.mocked(createLedgerRecordAction).mock.calls[0]?.[1];
  expect(formData).toBeInstanceOf(FormData);
  expect(formData?.get("recordType")).toBe("expense");
  expect(formData?.get("paymentSource")).toBe("fund");
});
```

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-entry-kind.test.ts src/app/ledger-record-entry-kind-tabs.test.tsx src/app/record-entry-panel.test.tsx
```

Expected: PASS for all focused files; existing recurring action tests remain green.

- [ ] **Step 9: Commit the shared entry kind**

```bash
git add src/app/ledger-record-entry-kind.ts src/app/ledger-record-entry-kind.test.ts src/app/ledger-record-entry-kind-tabs.tsx src/app/ledger-record-entry-kind-tabs.test.tsx src/app/record-entry-panel.tsx src/app/record-entry-panel.test.tsx
git commit -m "refactor: share ledger record entry kind"
```

---

### Task 2: Carry The Target Type Through Domain, Server Boundary And Transaction

**Files:**
- Modify: `src/modules/fund-ledger/ledger-record-corrections.ts:13-22,61-97,147-225`
- Modify: `src/modules/fund-ledger/ledger-record-corrections.test.ts:1-180`
- Modify: `src/modules/fund-ledger/ledger-record-command.ts:20-169,232-245`
- Modify: `src/modules/fund-ledger/ledger-record-command.test.ts:60-175`
- Modify: `src/app/ledger-record-form.ts:122-212`
- Modify: `src/app/ledger-record-form.test.ts:87-145`
- Modify: `src/app/ledger-record-actions.ts:20-60,250-420`
- Create: `src/app/ledger-record-actions.test.ts`

**Interfaces:**
- Produces: target-type `UpdateLedgerRecordCommand` union, `updateLedgerRecord(...)` returning a structurally valid `LedgerRecord`, and `UpdateLedgerRecordInDatabaseCommand` preserving the target through the transaction.
- Consumes: existing authorization, active/voided state, reimbursement block, `LedgerCategory[]` and active household member IDs.

- [ ] **Step 1: Replace partial-update expectations with failing conversion tests**

Add command builders and tests to `src/modules/fund-ledger/ledger-record-corrections.test.ts`:

```ts
const commonUpdate = {
  name: "修正後紀錄",
  amountCents: 3_500,
  occurredOn: "2026-06-10",
  note: "補正",
};

const correctionContext = {
  categories,
  householdMemberIds: new Set(["member-mei", "member-kai", "member-fin"]),
};

it("converts refundable expense to income and clears expense-only fields", () => {
  expect(updateLedgerRecord(owner, memberPaidExpense, {
    ...commonUpdate,
    type: "income",
    categoryId: "income-rent",
    sourceMemberId: "member-kai",
  }, correctionContext)).toEqual({
    ok: true,
    record: {
      id: "expense-1",
      type: "income",
      name: "修正後紀錄",
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "income-rent",
      createdByMemberId: "member-mei",
      sourceMemberId: "member-kai",
      note: "補正",
      reimbursementStatus: "not_applicable",
      status: "active",
    },
    events: ["Ledger record corrected"],
  });
});

it.each([
  ["fund", undefined, "not_refundable"],
  ["member", "member-kai", "refundable"],
] as const)("converts income to %s-paid expense", (paymentSource, payerMemberId, reimbursementStatus) => {
  const income = {
    ...memberPaidExpense,
    id: "income-1",
    type: "income" as const,
    categoryId: "income-rent",
    sourceMemberId: "member-mei",
    reimbursementStatus: "not_applicable" as const,
  };
  const command = paymentSource === "fund"
    ? {
        ...commonUpdate,
        type: "expense" as const,
        categoryId: "expense-internet",
        paymentSource: "fund" as const,
      }
    : {
        ...commonUpdate,
        type: "expense" as const,
        categoryId: "expense-internet",
        paymentSource: "member" as const,
        payerMemberId,
      };

  expect(updateLedgerRecord(owner, income, command, correctionContext))
    .toMatchObject({
      ok: true,
      record: {
        type: "expense",
        paymentSource,
        payerMemberId,
        reimbursementStatus,
      },
    });
});
```

Update existing permission, voided and reimbursed tests so every update command includes a complete target type and target-specific fields.

- [ ] **Step 2: Run the domain test and confirm red**

Run:

```bash
corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-corrections.test.ts
```

Expected: FAIL because `UpdateLedgerRecordCommand` has no target `type` and `mergeRecord` branches on the original record.

- [ ] **Step 3: Define a full target-type command union**

Replace `UpdateLedgerRecordCommand` with:

```ts
type UpdateLedgerRecordCommonFields = {
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  note?: string;
};

export type UpdateLedgerRecordCommand = UpdateLedgerRecordCommonFields & (
  | {
      type: "income";
      sourceMemberId: string;
    }
  | {
      type: "expense";
      paymentSource: "fund";
    }
  | {
      type: "expense";
      paymentSource: "member";
      payerMemberId: string;
    }
);
```

This makes invalid combinations unrepresentable before runtime validation.

Extend `UpdateLedgerRecordContext` so target member IDs are never trusted from the client:

```ts
export type UpdateLedgerRecordContext = {
  categories: LedgerCategory[];
  householdMemberIds: ReadonlySet<string>;
};
```

- [ ] **Step 4: Reconstruct rather than cast the corrected record**

Replace `mergeRecord` with explicit target-type construction:

```ts
function mergeRecord(
  record: LedgerRecord,
  command: UpdateLedgerRecordCommand,
): LedgerRecord {
  const base = {
    id: record.id,
    name: command.name,
    amountCents: command.amountCents,
    occurredOn: command.occurredOn,
    categoryId: command.categoryId,
    createdByMemberId: record.createdByMemberId,
    ...(command.note ? { note: command.note } : {}),
    ...(record.recurringEventLabel
      ? { recurringEventLabel: record.recurringEventLabel }
      : {}),
    status: record.status,
  };

  if (command.type === "income") {
    return {
      ...base,
      type: "income",
      sourceMemberId: command.sourceMemberId,
      reimbursementStatus: "not_applicable",
    };
  }

  if (command.paymentSource === "fund") {
    return {
      ...base,
      type: "expense",
      paymentSource: "fund",
      reimbursementStatus: "not_refundable",
    };
  }

  return {
    ...base,
    type: "expense",
    paymentSource: "member",
    payerMemberId: command.payerMemberId,
    reimbursementStatus: "refundable",
  };
}
```

Keep the ordering in `updateLedgerRecord`: authorize original owner → reject voided/reimbursed original record → reconstruct target record → validate target category and fields → return success. Do not move validation ahead of the original-state block.

Change the validation call and signature together:

```ts
const validation = validateUpdatedRecord(nextRecord, context);

function validateUpdatedRecord(
  record: LedgerRecord,
  context: UpdateLedgerRecordContext,
): { ok: true } | LedgerRecordCorrectionFailure {
  const { categories, householdMemberIds } = context;
  // Keep amount, date, category and target-specific validation below.
}
```

In `validateUpdatedRecord`, reject non-empty but out-of-household IDs after the existing required-field checks:

```ts
if (
  record.type === "income" &&
  !context.householdMemberIds.has(record.sourceMemberId)
) {
  return { ok: false, reason: "income_source_outside_household" };
}

if (
  record.type === "expense" &&
  record.paymentSource === "member" &&
  !context.householdMemberIds.has(record.payerMemberId)
) {
  return { ok: false, reason: "expense_payer_outside_household" };
}
```

Add both reasons to `LedgerRecordCorrectionFailure`; keep `missing_income_source_member` and `missing_member_payer` for malformed runtime input.

- [ ] **Step 5: Add negative target-type tests**

Add tests proving a target-type category mismatch and a forged type change of a reimbursed expense are rejected:

```ts
it("validates the category against the target type", () => {
  expect(updateLedgerRecord(owner, memberPaidExpense, {
    ...commonUpdate,
    type: "income",
    categoryId: "expense-grocery",
    sourceMemberId: "member-mei",
  }, correctionContext)).toEqual({
    ok: false,
    reason: "category_type_mismatch",
  });
});

it("blocks a reimbursed expense before applying a forged income target", () => {
  expect(updateLedgerRecord(owner, reimbursedExpense, {
    ...commonUpdate,
    type: "income",
    categoryId: "income-rent",
    sourceMemberId: "member-mei",
  }, correctionContext)).toEqual({
    ok: false,
    reason: "reimbursed_expense_blocked",
  });
});

it("rejects target members outside the active household", () => {
  expect(updateLedgerRecord(owner, memberPaidExpense, {
    ...commonUpdate,
    type: "income",
    categoryId: "income-rent",
    sourceMemberId: "member-other-household",
  }, {
    categories,
    householdMemberIds: new Set(["member-mei", "member-kai"]),
  })).toEqual({
    ok: false,
    reason: "income_source_outside_household",
  });
});

it("preserves recurring trace while changing the financial type", () => {
  const recurringExpense = {
    ...memberPaidExpense,
    recurringEventLabel: "每月 10 號，馬上入帳",
  };

  expect(updateLedgerRecord(owner, recurringExpense, {
    ...commonUpdate,
    type: "income",
    categoryId: "income-rent",
    sourceMemberId: "member-mei",
  }, correctionContext)).toMatchObject({
    ok: true,
    record: {
      type: "income",
      recurringEventLabel: "每月 10 號，馬上入帳",
    },
  });
});
```

Update every test context in this file to include:

```ts
const correctionContext = {
  categories,
  householdMemberIds: new Set(["member-mei", "member-kai", "member-fin"]),
};
```

- [ ] **Step 6: Run the domain suite and type-check the module**

Run sequentially:

```bash
corepack pnpm exec vitest run src/modules/fund-ledger/ledger-record-corrections.test.ts
corepack pnpm type-check
```

Expected: domain behavior tests PASS. The first type-check is expected to FAIL only at parser, persistence tests and edit UI callers that have not yet adopted the required target type. Do not commit this temporary state.

- [ ] **Step 7: Continue directly to server-boundary integration**

Do not stage or commit a temporarily type-broken API. Continue with the parser and transaction steps below.

#### Server-boundary integration

- [ ] **Step 8: Write failing parser tests for all target kinds**

Replace the single expense parser expectation with table-driven assertions:

```ts
it.each([
  [
    { recordType: "income", sourceMemberId: "member-mei" },
    { type: "income", sourceMemberId: "member-mei" },
  ],
  [
    { recordType: "expense", paymentSource: "fund" },
    { type: "expense", paymentSource: "fund" },
  ],
  [
    {
      recordType: "expense",
      paymentSource: "member",
      payerMemberId: "member-mei",
    },
    {
      type: "expense",
      paymentSource: "member",
      payerMemberId: "member-mei",
    },
  ],
] as const)("parses a target-type update command", (fields, targetFields) => {
  const formData = new FormData();
  formData.set("recordId", "record-1");
  formData.set("recordType", fields.recordType);
  formData.set("name", "修正後紀錄");
  formData.set("amountTwd", "350");
  formData.set("occurredOn", "2026-06-10");
  formData.set(
    "categoryId",
    fields.recordType === "income" ? "income-rent" : "expense-grocery",
  );
  if ("sourceMemberId" in fields) {
    formData.set("sourceMemberId", fields.sourceMemberId);
  }
  if ("paymentSource" in fields) {
    formData.set("paymentSource", fields.paymentSource);
  }
  if ("payerMemberId" in fields) {
    formData.set("payerMemberId", fields.payerMemberId);
  }

  expect(parseUpdateLedgerRecordForm(formData)).toMatchObject({
    ok: true,
    command: {
      recordId: "record-1",
      name: "修正後紀錄",
      amountCents: 35_000,
      occurredOn: "2026-06-10",
      ...targetFields,
    },
  });
});
```

- [ ] **Step 9: Run the parser test and confirm red**

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-form.test.ts
```

Expected: FAIL because `parseUpdateLedgerRecordForm` currently drops `command.type`.

- [ ] **Step 10: Preserve the complete parsed target command**

Replace the branching body after `parsedCreate` with:

```ts
if (!parsedCreate.ok) {
  return parsedCreate;
}

return {
  ok: true,
  command: {
    recordId,
    ...parsedCreate.command,
  },
};
```

The existing create parser already rejects invalid type, missing category, missing source member, invalid payment source and missing payer before the update command reaches the mutation boundary.

- [ ] **Step 11: Write a failing transaction persistence test**

Change the `updateLedgerRecordInDatabase` test command to a full income target and assert exact null-clearing:

```ts
await expect(updateLedgerRecordInDatabase(actor, {
  recordId: "expense-1",
  type: "income",
  name: "支出誤記改收入",
  amountCents: 3_500,
  occurredOn: "2026-06-10",
  categoryId: "income-rent",
  sourceMemberId: "member-mei",
  note: "補正",
}, { householdId: "household-demo", prisma })).resolves.toMatchObject({
  ok: true,
  record: {
    id: "expense-1",
    type: "income",
    reimbursementStatus: "not_applicable",
  },
});

expect(tx.ledgerRecord.update).toHaveBeenCalledWith({
  where: { id: "expense-1" },
  data: expect.objectContaining({
    type: "income",
    categoryId: "income-rent",
    sourceMemberId: "member-mei",
    paymentSource: null,
    payerMemberId: null,
    reimbursementStatus: "not_applicable",
  }),
});
```

Add `income-rent` to the mocked `category.findMany` result. Keep the assertion that `$transaction` encloses read, validation and update.

Use an exact scalar `data` assertion rather than only `expect.objectContaining`, so the test proves the update contains no nested recurring/import relation writes. Add spy-shaped `recurringOccurrence.update` and `ledgerImportRow.update` members to the transaction fixture and assert both remain uncalled; because the update keeps the same `LedgerRecord.id`, recurring occurrence and CSV import row foreign keys continue to point at the corrected record.

Update **every** `updateLedgerRecordInDatabase` command fixture in this test file, including the missing-record case, to provide a complete target union. The missing-record test can use:

```ts
{
  recordId: "missing",
  type: "expense",
  name: "不存在的紀錄",
  amountCents: 3_500,
  occurredOn: "2026-06-10",
  categoryId: "expense-grocery",
  paymentSource: "fund",
}
```

- [ ] **Step 12: Load and validate active household members inside the transaction**

Extend `LedgerRecordMutationTransaction`:

```ts
member: {
  findMany(args: {
    where: { householdId: string; status: "active" };
    select: { id: true };
  }): Promise<{ id: string }[]>;
};
```

Add a matching `member.findMany` stub to every transaction fixture in `ledger-record-command.test.ts`, including void tests, because they share the transaction interface. Only the update flow asserts that it was called.

Load members beside the record and categories:

```ts
const [record, categories, members] = await Promise.all([
  tx.ledgerRecord.findFirst({
    where: { householdId, id: command.recordId, status: "active" },
    select: ledgerRecordSelect(),
  }),
  loadCategoryLookups({ householdId, prisma: tx }),
  tx.member.findMany({
    where: { householdId, status: "active" },
    select: { id: true },
  }),
]);
```

Pass `householdMemberIds: new Set(members.map((member) => member.id))` into `updateLedgerRecord`. In `ledger-record-command.test.ts`, assert the query includes both `householdId` and `status: "active"`, then add separate out-of-household income-source and expense-payer commands; both must return their specific error and leave `ledgerRecord.update` uncalled.

Map new error codes in `src/app/ledger-record-actions.ts`:

```ts
income_source_outside_household: "收入來源不屬於目前家庭。",
expense_payer_outside_household: "代墊成員不屬於目前家庭。",
```

Add both values to `UpdateLedgerRecordActionCode`. Map `income_source_outside_household` to `sourceMemberId` and `expense_payer_outside_household` to `payerMemberId` in `fieldForUpdateError`.

Create `src/app/ledger-record-actions.test.ts` with mocked mutation access, Prisma client and Fund Ledger command. Submit valid FormData while returning each Domain failure from `updateLedgerRecordInDatabase`, then assert the public action state:

```ts
it.each([
  [
    "income_source_outside_household",
    "收入來源不屬於目前家庭。",
    "sourceMemberId",
  ],
  [
    "expense_payer_outside_household",
    "代墊成員不屬於目前家庭。",
    "payerMemberId",
  ],
] as const)("maps %s to the target member field", async (code, message, field) => {
  vi.mocked(updateLedgerRecordInDatabase).mockResolvedValueOnce({
    ok: false,
    reason: code,
  });

  const formData = validMemberExpenseUpdateForm();
  const result = await updateLedgerRecordAction(initialActionState(), formData);

  expect(result).toMatchObject({
    status: "error",
    code,
    message,
    fieldErrors: { [field]: [message] },
  });
});
```

Use a local `validMemberExpenseUpdateForm()` helper that sets `recordId`, `recordType`, `name`, `amountTwd`, `occurredOn`, `categoryId`, `paymentSource` and `payerMemberId`; do not bypass the real parser.

- [ ] **Step 13: Run parser, persistence and action-boundary tests**

Run:

```bash
corepack pnpm exec vitest run src/app/ledger-record-form.test.ts src/modules/fund-ledger/ledger-record-command.test.ts src/app/ledger-record-actions.test.ts
corepack pnpm type-check
```

Expected: all focused tests PASS and type-check PASS. Runtime client IDs are revalidated against active members in the authenticated household before update.

- [ ] **Step 14: Commit the complete Domain and server boundary**

```bash
git add src/modules/fund-ledger/ledger-record-corrections.ts src/modules/fund-ledger/ledger-record-corrections.test.ts src/modules/fund-ledger/ledger-record-command.ts src/modules/fund-ledger/ledger-record-command.test.ts src/app/ledger-record-form.ts src/app/ledger-record-form.test.ts src/app/ledger-record-actions.ts src/app/ledger-record-actions.test.ts
git commit -m "feat: convert ledger records by target type"
```

---

### Task 3: Add Stateful Type Switching To The Edit Dialog

**Files:**
- Modify: `src/app/ledger-record-form-fields.tsx:147-190`
- Modify: `src/app/_record-detail/record-detail-dialog.tsx:325-450`
- Modify: `src/app/_record-detail/record-detail-dialog.test.tsx:1-105`

**Interfaces:**
- Consumes: `LedgerRecordEntryKindTabs`, `ledgerRecordEntryKindForRecord`, `ledgerRecordFieldsForEntryKind` from Task 1 and target-type form fields from Task 2.
- Produces: edit form submissions containing exactly one target kind and UI state that never restores cleared type-specific values after a switch.

- [ ] **Step 1: Write failing component tests for cross-type clearing**

Add active income and expense categories to the `RecordDetailDialog` test fixture, open an income record for editing, then assert the approved transition:

```tsx
it("clears category and member fields when crossing income and expense", () => {
  renderEditableRecord(incomeRecord);
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));

  expect(screen.getByRole("tab", { name: "收入" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("radio", { name: "房租" })).toBeChecked();

  fireEvent.click(screen.getByRole("tab", { name: "成員支出" }));
  for (const radio of screen.getAllByRole("radio")) {
    expect(radio).not.toBeChecked();
  }
  expect(screen.getByLabelText("支付者")).toHaveValue("");

  fireEvent.click(screen.getByRole("tab", { name: "收入" }));
  for (const radio of screen.getAllByRole("radio")) {
    expect(radio).not.toBeChecked();
  }
  expect(screen.getByLabelText("支付者")).toHaveValue("");
});
```

- [ ] **Step 2: Write failing component tests for expense-source switching and error retention**

Add:

```tsx
it("keeps an expense category but clears the payer when payment source changes", () => {
  renderEditableRecord(memberPaidExpenseRecord);
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();

  fireEvent.click(screen.getByRole("tab", { name: "基金支出" }));
  expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
  fireEvent.click(screen.getByRole("tab", { name: "成員支出" }));
  expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
  expect(screen.getByLabelText("支付者")).toHaveValue("");
});

it("keeps the switched form state after the server rejects submission", async () => {
  vi.mocked(updateLedgerRecordAction).mockResolvedValueOnce({
    status: "error",
    message: "分類類型與紀錄類型不一致。",
    code: "category_type_mismatch",
    fieldErrors: { categoryId: ["分類類型與紀錄類型不一致。"] },
  });
  renderEditableRecord(incomeRecord);
  fireEvent.click(screen.getByRole("button", { name: "編輯" }));
  fireEvent.click(screen.getByRole("tab", { name: "成員支出" }));
  fireEvent.click(screen.getByRole("radio", { name: "日用品" }));
  fireEvent.change(screen.getByLabelText("支付者"), {
    target: { value: "member-b" },
  });
  const editForm = screen.getByRole("region", {
    name: "編輯紀錄表單",
  }).querySelector("form")!;
  fireEvent.change(editForm.elements.namedItem("name")!, {
    target: { value: "錯誤後仍保留" },
  });
  fireEvent.change(editForm.elements.namedItem("amountTwd")!, {
    target: { value: "4321" },
  });
  fireEvent.change(editForm.elements.namedItem("occurredOn")!, {
    target: { value: "2026-06-22" },
  });
  fireEvent.change(editForm.elements.namedItem("note")!, {
    target: { value: "不要被 reset" },
  });
  fireEvent.submit(editForm);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "分類類型與紀錄類型不一致。",
  );
  expect(screen.getByRole("tab", { name: "成員支出" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
  expect(screen.getByLabelText("支付者")).toHaveValue("member-b");
  expect(editForm.elements.namedItem("name")).toHaveValue("錯誤後仍保留");
  expect(editForm.elements.namedItem("amountTwd")).toHaveValue(4321);
  expect(editForm.elements.namedItem("occurredOn")).toHaveValue("2026-06-22");
  expect(editForm.elements.namedItem("note")).toHaveValue("不要被 reset");
});
```

Import `updateLedgerRecordAction` in the test so `vi.mocked(...)` references the mocked function.

- [ ] **Step 3: Run the Dialog test and confirm red**

Run:

```bash
corepack pnpm exec vitest run src/app/_record-detail/record-detail-dialog.test.tsx
```

Expected: FAIL because the edit Dialog has no Tabs and fixes `recordType` to the original record.

- [ ] **Step 4: Allow explicit blank member selection after a switch**

Extend `LedgerRecordMemberSelectField` with an optional placeholder:

```tsx
export function LedgerRecordMemberSelectField({
  canSelectOthers = true,
  defaultMemberId,
  disabledDisplayValue,
  label,
  members,
  name,
  placeholder,
}: {
  canSelectOthers?: boolean;
  defaultMemberId: string;
  disabledDisplayValue?: string;
  label: string;
  members: LedgerRecordFormMember[];
  name: "payerMemberId" | "sourceMemberId";
  placeholder?: string;
}) {
  // Keep the existing disabled fund branch and hidden owner input.
  return (
    <Field>
      {!canSelectOthers ? (
        <input name={name} type="hidden" value={defaultMemberId} />
      ) : null}
      <FieldLabel>{label}</FieldLabel>
      <NativeSelect
        aria-label={label}
        defaultValue={defaultMemberId}
        disabled={!canSelectOthers}
        name={name}
        required
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}
```

Do not pass `placeholder` from the create form, which keeps its current default member behavior.

- [ ] **Step 5: Implement local edit-kind state and irreversible clearing flags**

At the start of `EditRecordDialog`, initialize and derive:

```tsx
const initialEntryKind = ledgerRecordEntryKindForRecord(record);
const [entryKind, setEntryKind] = useState(initialEntryKind);
const [hasChangedEntryKind, setHasChangedEntryKind] = useState(false);
const [hasCrossedTypeBoundary, setHasCrossedTypeBoundary] = useState(false);
const { paymentSource, recordType } = ledgerRecordFieldsForEntryKind(entryKind);

function changeEntryKind(nextEntryKind: LedgerRecordEntryKind) {
  if (nextEntryKind === entryKind) {
    return;
  }

  const nextType = ledgerRecordFieldsForEntryKind(nextEntryKind).recordType;
  if (nextType !== recordType) {
    setHasCrossedTypeBoundary(true);
  }
  setHasChangedEntryKind(true);
  setEntryKind(nextEntryKind);
}
```

Filter categories by the current target type. Only allow the original archived category before a cross-type switch:

```tsx
const editableCategories = categories.filter((category) =>
  category.type === recordType &&
  (
    category.status === "active" ||
    (!hasCrossedTypeBoundary && category.id === record.categoryId)
  ),
);
```

Render the shared Tabs above categories and keep the original category only until a cross-type switch:

```tsx
<LedgerRecordEntryKindTabs
  disabled={isPending}
  entryKind={entryKind}
  onEntryKindChange={changeEntryKind}
/>
{hasChangedEntryKind ? (
  <p className="text-caption text-muted-foreground">
    {hasCrossedTypeBoundary
      ? "切換類型後，請重新選擇分類與付款資訊。"
      : "切換付款來源後，請重新確認付款資訊。"}
  </p>
) : null}
<LedgerRecordCategoryField
  categories={editableCategories}
  defaultCategoryId={
    hasCrossedTypeBoundary ? undefined : record.categoryId
  }
/>
```

Use the target fields in hidden inputs:

```tsx
<input name="recordId" type="hidden" value={record.id} />
<input name="recordType" type="hidden" value={recordType} />
{paymentSource ? (
  <input name="paymentSource" type="hidden" value={paymentSource} />
) : null}
```

Render the member field from `recordType / paymentSource`, force remount per kind, and only preserve the original member before any change:

```tsx
const memberDefaultId = !hasChangedEntryKind
  ? record.type === "income"
    ? record.sourceMemberId
    : record.payerMemberId ?? ""
  : "";

const payerField = recordType === "income" ? (
  <LedgerRecordMemberSelectField
    defaultMemberId={memberDefaultId}
    key={entryKind}
    label="支付者"
    members={members}
    name="sourceMemberId"
    placeholder={hasChangedEntryKind ? "請選擇成員" : undefined}
  />
) : paymentSource === "member" ? (
  <LedgerRecordMemberSelectField
    defaultMemberId={memberDefaultId}
    key={entryKind}
    label="支付者"
    members={members}
    name="payerMemberId"
    placeholder={hasChangedEntryKind ? "請選擇成員" : undefined}
  />
) : null;
```

Do not submit the edit form through React's host `<form action={formAction}>`: a resolved error state is still a completed action and may reset uncontrolled form controls. Extend `LedgerRecordFormShellProps` with an exclusive submission union:

```tsx
type LedgerRecordFormSubmissionProps =
  | {
      action: ComponentProps<"form">["action"];
      onSubmit?: never;
    }
  | {
      action?: never;
      onSubmit: ComponentProps<"form">["onSubmit"];
    };

type LedgerRecordFormShellProps = {
  ariaLabel: string;
  children: ReactNode;
  feedbackMessage?: LedgerRecordFormFeedback;
  footer: ReactNode;
  isPending: boolean;
  hiddenFields?: ReactNode;
} & LedgerRecordFormSubmissionProps;
```

Pass both props through and render the form as:

```tsx
<form action={action} className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
```

The create flow keeps its existing `action` prop. In `EditRecordDialog`, import `startTransition` and `type FormEvent`, then submit FormData manually so a Domain error does not trigger host-form reset:

```tsx
function submitEdit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  startTransition(() => {
    formAction(formData);
  });
}
```

Pass `onSubmit={submitEdit}` instead of `action={formAction}` to the edit `LedgerRecordFormShell`. Keep local entry kind flags unchanged when `actionState.status === "error"`; the DOM controls now remain mounted with their entered values.

- [ ] **Step 6: Run component, create regression and accessibility-focused tests**

Run:

```bash
corepack pnpm exec vitest run src/app/_record-detail/record-detail-dialog.test.tsx src/app/ledger-record-form-fields.test.tsx src/app/record-entry-panel.test.tsx src/components/ui/tabs.test.tsx
corepack pnpm type-check
```

Expected: all focused tests PASS; type-check PASS.

- [ ] **Step 7: Commit the edit UI**

```bash
git add src/app/ledger-record-form-fields.tsx src/app/_record-detail/record-detail-dialog.tsx src/app/_record-detail/record-detail-dialog.test.tsx
git commit -m "feat: edit ledger record types"
```

---

### Task 4: Verify The Full Accounting Flow And Close The Requirement

**Files:**
- Modify: `e2e/record-edit-delete.spec.ts:1-85`
- Modify: `.ai/requirements/edit-ledger-record-type.md:1-90`

**Interfaces:**
- Consumes: completed UI → Server Action → Fund Ledger → Prisma transaction flow from Tasks 1–3.
- Produces: browser evidence that dashboard totals, type tabs and reimbursement read models reflect the new persisted type.

- [ ] **Step 0: Repair the existing edit regression selector**

The note field is an `<input>`, not a `<textarea>`. Before adding conversion cases, change the existing selector in `record-edit-delete.spec.ts`:

```ts
await editDialog.locator('input[name="note"]').fill("E2E 編輯後備註");
```

Run the existing spec once to confirm this baseline test is green before adding new failing cases.

- [ ] **Step 1: Add a failing income-to-member-expense E2E**

Add to `e2e/record-edit-delete.spec.ts`:

```ts
test("converts income to a refundable member expense", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "查看六月房租詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "編輯" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "成員支出" }).click();
  await selectCategory(dialog, "日用品");
  await dialog.getByLabel("支付者").selectOption("member-mei");
  await dialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByText("紀錄已更新", { exact: true })).toBeVisible();
  const summary = page.getByRole("region", { name: "月報摘要" });
  await expect(summary).toContainText("NT$80,000");
  await expect(summary).toContainText("NT$129,199");
  await expect(page.getByRole("region", { name: "支出分類" }))
    .toContainText("$128,300");

  await page.getByRole("tab", { name: "收入紀錄" }).click();
  await expect(page.getByText("六月房租", { exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "支出紀錄" }).click();
  await expect(page.getByText("六月房租", { exact: true })).toBeVisible();

  await page.goto("/refunds?month=2026-06");
  await expect(page.getByRole("region", { name: "未退款支出紀錄" }))
    .toContainText("六月房租");

  await page.goto("/search");
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("六月房租");
  await applyRecordTypeFilter(page, "expense");
  await expect(page.getByRole("button", { name: "查看六月房租詳情" }))
    .toBeVisible();
  await applyRecordTypeFilter(page, "income");
  await expect(page.getByRole("button", { name: "查看六月房租詳情" }))
    .toHaveCount(0);
});
```

- [ ] **Step 2: Add a failing refundable-expense-to-income E2E**

Add:

```ts
test("converts a refundable member expense to income", async ({ page }) => {
  await page.goto("/?month=2026-06");
  await page.getByRole("button", { name: "查看日用品代墊詳情" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "編輯" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "收入" }).click();
  await selectCategory(dialog, "房租");
  await dialog.getByLabel("支付者").selectOption("member-mei");
  await dialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByText("紀錄已更新", { exact: true })).toBeVisible();
  const summary = page.getByRole("region", { name: "月報摘要" });
  await expect(summary).toContainText("NT$206,420");
  await expect(summary).toContainText("NT$2,779");
  await expect(page.getByRole("region", { name: "支出分類" }))
    .toContainText("$1,880");

  await page.goto("/refunds?month=2026-06");
  await expect(page.getByRole("region", { name: "未退款支出紀錄" }))
    .not.toContainText("日用品代墊");

  await page.goto("/search");
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("日用品代墊");
  await applyRecordTypeFilter(page, "income");
  await expect(page.getByRole("button", { name: "查看日用品代墊詳情" }))
    .toBeVisible();
  await applyRecordTypeFilter(page, "expense");
  await expect(page.getByRole("button", { name: "查看日用品代墊詳情" }))
    .toHaveCount(0);
});

test("keeps reimbursed expenses outside the edit flow", async ({ page }) => {
  await page.goto("/?month=2026-05");
  await page.getByRole("button", { name: "查看已退款網路費詳情" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "編輯" }))
    .toHaveCount(0);
});
```

Add this helper beside the existing E2E helpers so every search assertion uses the real filter dialog and apply boundary:

```ts
async function applyRecordTypeFilter(
  page: Page,
  type: "expense" | "income",
) {
  await page.getByRole("button", { name: /開啟篩選/u }).click();
  const filterDialog = page.getByRole("dialog");
  await filterDialog.getByLabel("依類型篩選").selectOption(type);
  await filterDialog.getByRole("button", { name: "套用" }).click();
}
```

The E2E database resets before every test, so both expected totals are calculated from the deterministic `prisma/seed.e2e.sql` baseline independently.

- [ ] **Step 3: Run the focused E2E against the completed Tasks 1–3**

Run:

```bash
corepack pnpm test:e2e e2e/record-edit-delete.spec.ts
```

Expected: all `record-edit-delete.spec.ts` tests PASS, including both type conversions, the reimbursed block and the existing edit/delete regression. Red/green behavior is already established at the Domain, parser and component layers in Tasks 2–3; this step supplies full-flow browser evidence.

- [ ] **Step 4: Run focused unit/integration tests**

Run sequentially:

```bash
corepack pnpm exec vitest run src/app/ledger-record-entry-kind.test.ts src/app/ledger-record-entry-kind-tabs.test.tsx src/app/record-entry-panel.test.tsx src/app/ledger-record-form.test.ts src/app/ledger-record-actions.test.ts src/app/_record-detail/record-detail-dialog.test.tsx src/modules/fund-ledger/ledger-record-corrections.test.ts src/modules/fund-ledger/ledger-record-command.test.ts
corepack pnpm type-check
```

Expected: all focused tests PASS; type-check PASS with zero errors.

- [ ] **Step 5: Run the repository delivery checks sequentially**

Run exactly in this order because each command may generate Prisma client files:

```bash
corepack pnpm test
corepack pnpm type-check
corepack pnpm lint
corepack pnpm build
corepack pnpm test:e2e
```

Expected: every command exits 0. Record the actual Vitest and Playwright test counts; do not describe these local checks as production evidence.

- [ ] **Step 6: Close the historical requirement summary**

In `.ai/requirements/edit-ledger-record-type.md`:

```md
- status: done
```

Append a final result section using the actual verification counts from Step 5:

```md
## 最終結果

- 單筆編輯流程已可在成員支出、收入、基金支出間切換，並依目標類型重設分類、成員欄位與退款資格。
- 首頁與搜尋共用的 record detail flow 均使用相同編輯行為；已退款支出仍維持不可編輯。
- Prisma schema 與來源關聯未變更；更新維持既有 transaction 與同一 record ID。
- 本機驗證：記錄 Step 5 實際完成的 tests、type-check、lint、build 與 E2E 結果。這不是 production 驗證。
```

Replace the last bullet with the exact observed commands and counts before committing; do not copy an estimated number.

- [ ] **Step 7: Commit E2E coverage and completion evidence**

```bash
git add e2e/record-edit-delete.spec.ts .ai/requirements/edit-ledger-record-type.md
git commit -m "test: verify ledger record type editing"
```

- [ ] **Step 8: Final clean-worktree verification**

Run:

```bash
git status --short
git log --oneline --decorate origin/main..HEAD
```

Expected: `git status --short` prints nothing; the branch contains the design commits plus the four implementation commits from this plan. Do not push or create a PR unless the user separately requests it.
