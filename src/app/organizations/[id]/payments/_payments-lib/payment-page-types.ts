export type PaymentCollectionType = "monthly" | "yearly" | "disabled";
export type MemberPaymentStatus = "paid" | "partial" | "unpaid" | "overdue" | "no-plan";
export type StatusFilter = "all" | "paid" | "partial" | "unpaid" | "overdue";
export type RecentPaymentStatusFilter = "all" | "completed" | "cancelled";

export type SettingsFormState = {
  isEnabled: boolean;
  period: "Monthly" | "Yearly";
  startDay: string;
  startMonth: string;
  startYear: string;
};

export type PlanFormState = {
  amount: string;
  currency: "TRY" | "USD" | "EUR";
  isActive: boolean;
};

export type RevisionFormState = {
  effectiveDay: string;
  effectiveMonth: string;
  effectiveYear: string;
  amount: string;
  currency: "TRY" | "USD" | "EUR";
  isActive: boolean;
};

export type MemberRow = {
  memberId: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
  status: MemberPaymentStatus;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalOpenDebt: number;
  lastPaymentDate: string | null;
  currentDueDate: string | null;
  currentDuePeriodLabel: string | null;
  overduePeriods: number;
  totalPaymentCount: number;
};

export type PaymentPeriodRow = {
  id: string;
  periodYear: number;
  periodMonth: number | null;
  periodLabel: string;
  periodStartUtc: string;
  periodType: string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: string;
  isOverdue: boolean;
  isCurrentPeriod: boolean;
  paymentCount: number;
  lastPaidAtUtc: string | null;
};

export type RecentPaymentItem = {
  paymentId: string;
  memberDisplayName: string;
  memberEmail: string;
  amount: number;
  currency: string;
  periodLabel: string;
  paidAt: string;
  markedByDisplayName: string;
  methodLabel: string;
  status: "Completed" | "Cancelled" | string;
  cancelledAtUtc?: string | null;
  cancelledByDisplayName?: string | null;
  cancellationType?: string | null;
  cancellationReasonCode?: string | null;
  cancellationNote?: string | null;
};

export type PendingPaymentConfirm = {
  memberId: string;
  memberDisplayName: string;
  periodId: string;
  periodLabel: string;
  amount: number;
  currency: string;
};

export type PendingPlanDeleteConfirm = {
  year: number;
  period: "Monthly" | "Yearly";
};

export type PlanDeleteMode = "delete" | "rollback";

export type PendingPaymentCancelConfirm = {
  paymentId?: string | null;
  memberId?: string | null;
  periodId?: string | null;
  memberDisplayName: string;
  periodLabel: string;
  amount: number;
  currency: string;
};