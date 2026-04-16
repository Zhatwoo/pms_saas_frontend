export type FundTransferStatus =
  | "pending"
  | "approved"
  | "pending_source_confirmation"
  | "pending_confirmation"
  | "rejected"
  | "transferred"
  | "cancelled";

export type FundTransferMode =
  | "cash"
  | "bank_transfer"
  | "ewallet"
  | "check"
  | "other";

export interface FundBranchSummary {
  id: string;
  name: string;
  branchCode: string | null;
  location?: string | null;
}

export interface FundPersonSummary {
  id: string;
  fullName: string | null;
  email: string | null;
}

export interface FundRequestRecord {
  id: string;
  requestNo: string;
  branchId: string;
  amountRequested: number;
  purpose: string;
  notes: string | null;
  status: FundTransferStatus;
  approvedAmount: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  amountTransferred: number | null;
  transferredAt: string | null;
  transferReference: string | null;
  transferNotes: string | null;
  transferMode: FundTransferMode | null;
  flowType?: "request_based" | "direct_push";
  receiverUserId?: string | null;
  sourceBranchId?: string | null;
  sourceBranch?: FundBranchSummary | null;
  sourceConfirmedBy?: FundPersonSummary | null;
  sourceConfirmedAt?: string | null;
  sourceConfirmationNotes?: string | null;
  sourceConfirmedAmount?: number | null;
  sourceConfirmationProofUrl?: string | null;
  receiverRole?: "admin" | "employee" | null;
  confirmedReceivedAmount?: number | null;
  confirmationNote?: string | null;
  transferReferenceNo?: string | null;
  confirmedBy?: FundPersonSummary | null;
  confirmedAt?: string | null;
  confirmationNotes?: string | null;
  confirmationProofUrl?: string | null;
  destinationConfirmedBy?: FundPersonSummary | null;
  destinationConfirmedAt?: string | null;
  destinationConfirmationNotes?: string | null;
  destinationReceivedAmount?: number | null;
  destinationConfirmationProofUrl?: string | null;
  relatedTransactionId?: string | null;
  createdAt: string;
  updatedAt?: string;
  branch: FundBranchSummary | null;
  requestedBy: FundPersonSummary | null;
  reviewedBy?: FundPersonSummary | null;
  transferredBy?: FundPersonSummary | null;
}

export interface FinanceQueues {
  pendingReview: FundRequestRecord[];
  sourceConfirmation: FundRequestRecord[];
  destinationConfirmation: FundRequestRecord[];
  transferred: FundRequestRecord[];
}

export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFinanceDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getRequestAmount(request: FundRequestRecord): number {
  return (
    request.confirmedReceivedAmount ??
    request.destinationReceivedAmount ??
    request.sourceConfirmedAmount ??
    request.amountTransferred ??
    request.approvedAmount ??
    request.amountRequested
  );
}

export function buildFinanceQueues(
  requests: FundRequestRecord[],
  branchId?: string,
): FinanceQueues {
  const scoped = branchId
    ? requests.filter(
        (request) =>
          request.branchId === branchId || request.sourceBranchId === branchId,
      )
    : requests;

  return {
    pendingReview: scoped.filter((request) => request.status === "pending"),
    sourceConfirmation: scoped.filter(
      (request) =>
        request.status === "pending_source_confirmation" &&
        (!branchId || request.sourceBranchId === branchId),
    ),
    destinationConfirmation: scoped.filter(
      (request) =>
        request.status === "pending_confirmation" &&
        (!branchId || request.branchId === branchId),
    ),
    transferred: scoped.filter((request) => request.status === "transferred"),
  };
}

export function getConfirmationLabel(request: FundRequestRecord): string {
  return request.status === "pending_source_confirmation"
    ? "Confirm Source Deduction"
    : "Confirm Fund";
}