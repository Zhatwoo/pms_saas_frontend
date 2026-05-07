"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatTimeWithAmPm } from "@/lib/time";
import { LoadingSpinnerLabel } from "./loading-spinner-label";
import { StatusBadge } from "./status-badge";

interface QRReplacementRequest {
  id: string;
  pawned_item_id: string;
  requested_by: string;
  branch_id: string;
  reason: "damaged" | "lost" | "torn";
  description: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function QRReplacementRequestsDashboard() {
  const [requests, setRequests] = useState<QRReplacementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<QRReplacementRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("pending");

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const url = filterStatus === "all" 
        ? "/api/qr-replacement-requests"
        : `/api/qr-replacement-requests?status=${filterStatus}`;
      
      const response = await api.get<any>(url);
      setRequests(response?.data ?? response ?? []);
    } catch (error: any) {
      toast.error("Failed to fetch QR replacement requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    try {
      await api.put(`/api/qr-replacement-requests/${requestId}/approve`, {});
      toast.success("Request approved successfully!");
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error("Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      await api.put(`/api/qr-replacement-requests/${requestId}/reject`, {
        rejection_reason: rejectionReason,
      });
      toast.success("Request rejected successfully!");
      setRejectionReason("");
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error("Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "completed":
        return "purple";
      default:
        return "gray";
    }
  };

  const getReasonEmoji = (reason: string) => {
    switch (reason) {
      case "damaged":
        return "🔨";
      case "lost":
        return "❌";
      case "torn":
        return "📄";
      default:
        return "❓";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "pending", "approved", "rejected", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              filterStatus === status
                ? "bg-emerald-600 text-white"
                : "bg-surface-secondary text-text-primary hover:bg-surface-tertiary"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-emerald-900 text-amber-400">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Item ID
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Reason
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                  Requested
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-t border-border-subtle bg-surface-secondary">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-full rounded-md bg-zinc-200/60 dark:bg-zinc-800/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-text-tertiary">
                    No QR replacement requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-border-subtle bg-surface-secondary hover:bg-emerald-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-text-secondary">
                      {request.pawned_item_id.slice(0, 8)}...
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium">
                      {getReasonEmoji(request.reason)} {request.reason}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge label={request.status} variant={getStatusColor(request.status) as any} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary">
                      {formatTimeWithAmPm(request.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                        }}
                        className="rounded-lg px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold text-xs transition-all"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border-main bg-surface shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-border-subtle bg-emerald-50 px-6 py-4 sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    QR Replacement Request Details
                  </h3>
                  <p className="text-sm text-text-secondary">ID: {selectedRequest.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                  className="rounded-lg p-1 text-text-muted hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">Status:</span>
                  <StatusBadge label={selectedRequest.status} variant={getStatusColor(selectedRequest.status) as any} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">Reason:</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {getReasonEmoji(selectedRequest.reason)} {selectedRequest.reason.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-secondary">Requested:</span>
                  <span className="text-sm text-text-primary">{formatTimeWithAmPm(selectedRequest.created_at)}</span>
                </div>
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div className="rounded-lg bg-surface-secondary border border-border-subtle p-4">
                  <p className="text-xs font-semibold text-text-secondary mb-2">Description:</p>
                  <p className="text-sm text-text-primary">{selectedRequest.description}</p>
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedRequest.status === "rejected" && selectedRequest.rejection_reason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-xs font-semibold text-red-900 mb-2">Rejection Reason:</p>
                  <p className="text-sm text-red-900">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Approval Info (if approved) */}
              {selectedRequest.status === "approved" && selectedRequest.approved_at && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-xs font-semibold text-green-900 mb-2">Approved on:</p>
                  <p className="text-sm text-green-900">{formatTimeWithAmPm(selectedRequest.approved_at)}</p>
                </div>
              )}

              {/* Action Buttons - Only show for pending requests */}
              {selectedRequest.status === "pending" && (
                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  {/* Rejection Reason Input */}
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Rejection Reason (if rejecting):
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why you're rejecting this request..."
                      className="w-full px-3 py-2 border border-border-main rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-text-primary resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-100 text-red-800 font-semibold hover:bg-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <span className="anim-loading h-4 w-4 border-2 border-red-300 border-t-red-800 rounded-full" />
                          Processing...
                        </>
                      ) : (
                        "❌ Reject"
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <span className="anim-loading h-4 w-4 border-2 border-emerald-300 border-t-white rounded-full" />
                          Processing...
                        </>
                      ) : (
                        "✅ Approve"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
