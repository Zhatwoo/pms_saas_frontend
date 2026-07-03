"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { PaginationFooter } from "@/components/shared/pagination";
import { useBranch } from "@/contexts/branch-context";
import { ActionButton } from "@/components/shared/action-button";

interface QrReplacementRequest {
  id: string;
  userId: string;
  userFullName: string;
  userRole: string;
  branchName: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function QrReplacementRequestsPage() {
  const { branches } = useBranch();
  const [requests, setRequests] = useState<QrReplacementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<"small" | "large">("small");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const toolbarLabelClass = "text-[11px] font-bold uppercase tracking-wider text-text-tertiary";
  const toolbarSelectClass = "h-10 rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500";

  const availableBranches = branches.filter((b) => b.id !== "__all__");

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePrint = (itemId: string, qrCode?: string) => {
    const sizeCm = qrSize === "small" ? "2cm" : "3cm";
    const fontSize = qrSize === "small" ? "8px" : "10px";
    
    let qrUrl = "";
    if (qrCode?.startsWith('http') || qrCode?.startsWith('data:')) {
      qrUrl = qrCode;
    } else {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const publicViewUrl = `${baseUrl}/view-ticket/${encodeURIComponent(itemId)}`;
      const encoded = encodeURIComponent(publicViewUrl);
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=250x250&color=065f46&bgcolor=f0fdf4&margin=2`;
    }
    
    const qrHtml = `
      <div style="display:inline-flex; flex-direction:column; align-items:center; margin:3mm; vertical-align:top;">
        <img src="${qrUrl}" style="width:${sizeCm}; height:${sizeCm}; display:block;" />
        <p style="font-family:sans-serif; font-size:${fontSize}; font-weight:bold; margin-top:1mm; color:#333;">${itemId}</p>
      </div>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const html = `<!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; }
        @page { size: auto; margin: 5mm; }
        body { display: flex; flex-wrap: wrap; justify-content: center; padding: 5mm; }
      </style>
      </head>
      <body>
      ${qrHtml}
      </body>
      </html>`;

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(html);
    iframe.contentDocument?.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
    };
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<QrReplacementRequest[]>("/activity-logs?action=QR_REPLACEMENT_REQUEST");
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (requestId: string, decision: "approve" | "reject", details?: any) => {
    setIsProcessing(requestId);
    try {
      await api.post(`/inventory/qr-replacement/${requestId}/review`, { decision });
      toast.success(`Request ${decision}ed successfully.`);
      
      if (decision === "approve" && details) {
        handlePrint(details.itemId, details.qrCode);
      }
      
      await fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to process request.");
    } finally {
      setIsProcessing(null);
    }
  };

  const parseRequestDetails = (rawDetails?: string) => {
    if (!rawDetails) return {};
    try {
      return JSON.parse(rawDetails);
    } catch {
      return {};
    }
  };

  const filteredRequests = requests.filter(req => {
    const details = parseRequestDetails(req.details);
    const selectedBranchName =
      branchFilter === "all"
        ? "all"
        : availableBranches.find((b) => b.id === branchFilter)?.name;
    const matchesSearch = 
      details.itemId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.branchName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBranch =
      selectedBranchName === "all" ||
      (req.branchName || "").toLowerCase() === (selectedBranchName || "").toLowerCase();
    const matchesReason = reasonFilter === "all" || details.reason?.toLowerCase() === reasonFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || details.requestStatus === statusFilter;
    
    return matchesSearch && matchesStatus && matchesBranch && matchesReason;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, branchFilter, reasonFilter]);

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));

  return (
    <div className="space-y-4 pt-2 px-6 pb-6">
      
      <p className="text-[13px] font-medium text-text-secondary/80 mb-1">Comprehensive list of all QR replacement requests across all branches.</p>

      {/* Filters Card */}
      <div className="flex flex-wrap items-end justify-between gap-3 bg-surface p-3 rounded-lg border border-border-main">
        <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className={toolbarLabelClass}>Branch</label>
              <select 
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className={toolbarSelectClass}
              >
                <option value="all">All Branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={toolbarLabelClass}>Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${toolbarSelectClass} w-36`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={toolbarLabelClass}>Search</label>
              <input 
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none transition-colors focus:border-emerald-500"
              />
            </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead>
              <tr className="bg-[#064e3b] text-[#fbbf24] uppercase text-[10px] font-bold tracking-[0.1em]">
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Branch</th>
                <th className="px-4 py-3 whitespace-nowrap">Item ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Item Name</th>
                <th className="px-4 py-3 whitespace-nowrap">Reason</th>
                <th className="px-4 py-3 whitespace-nowrap">Proof</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Requested By</th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <LoadingSpinnerLabel text="Loading requests..." />
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-text-tertiary italic">
                    No matching QR replacement requests found.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => {
                  const details = parseRequestDetails(req.details);

                  return (
                    <tr key={req.id} className="hover:bg-surface-hover/50 transition-colors group">
                      <td className="px-4 py-4 whitespace-nowrap text-[11px] font-medium text-text-secondary">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-[11px] font-bold text-text-secondary">
                        {req.branchName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {details.itemId}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-[11px] text-text-secondary">
                        {details.itemName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">{details.reason}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {details.proofPhoto ? (
                          <ActionButton
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(details.proofPhoto, '_blank')}
                            className="h-8 w-8 rounded-lg border border-border-subtle overflow-hidden shadow-sm"
                            title="View Proof"
                          >
                            <img src={details.proofPhoto} className="h-full w-full object-cover" />
                          </ActionButton>
                        ) : (
                          <span className="text-[10px] text-text-tertiary">No Proof</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          details.requestStatus === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                          details.requestStatus === "approved" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {details.requestStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-text-primary">{req.userFullName}</span>
                          <span className="text-[9px] font-bold uppercase text-text-tertiary">{req.userRole}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {details.requestStatus === "pending" ? (
                            <>
                              <ActionButton
                                variant="success"
                                size="icon"
                                disabled={isProcessing === req.id}
                                onClick={() => handleReview(req.id, "approve", details)}
                                className="h-7 w-7 rounded-lg shadow-md active:scale-90"
                                title="Approve & Print"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                              </ActionButton>
                              <ActionButton
                                variant="danger"
                                size="icon"
                                disabled={isProcessing === req.id}
                                onClick={() => handleReview(req.id, "reject")}
                                className="h-7 w-7 rounded-lg shadow-md active:scale-90"
                                title="Reject"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </ActionButton>
                            </>
                          ) : (
                              <ActionButton
                                variant="success"
                                size="icon"
                                onClick={() => handlePrint(details.itemId, details.qrCode)}
                                className="h-7 w-7 rounded-lg active:scale-90"
                                title="Re-print QR"
                              >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                            </ActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredRequests.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
