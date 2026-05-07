"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
import { formatPeso } from "@/lib/currency";

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
  const [requests, setRequests] = useState<QrReplacementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState<"small" | "large">("small");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

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
  const filteredRequests = requests.filter(req => {
    const details = JSON.parse(req.details || "{}");
    const matchesSearch = 
      details.itemId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      details.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.branchName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBranch = branchFilter === "all" || req.branchName === branchFilter;
    const matchesReason = reasonFilter === "all" || details.reason?.toLowerCase() === reasonFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || details.requestStatus === statusFilter;
    
    return matchesSearch && matchesStatus && matchesBranch && matchesReason;
  });

  return (
    <div className="space-y-4 pt-2 px-6 pb-6">
      
      <p className="text-[13px] font-medium text-slate-500/80 mb-1">Comprehensive list of all QR replacement requests across all branches.</p>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Branch</label>
              <select 
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-10 w-40 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="all">All Branches</option>
                <option value="Taguig Branch">Taguig Branch</option>
                <option value="Bulacan Branch">Bulacan Branch</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-32 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-64 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-emerald-900 bg-white shadow-xl">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#064e3b] text-[#fbbf24] uppercase text-[10px] font-bold tracking-[0.1em]">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Item ID</th>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <LoadingSpinnerLabel text="Loading requests..." />
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-20 text-center text-text-tertiary italic">
                  No matching QR replacement requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const details = JSON.parse(req.details || "{}");

                return (
                  <tr key={req.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] font-medium text-text-secondary">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] font-bold text-text-secondary">
                      {req.branchName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-[11px] font-bold text-emerald-700">
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
                        <button 
                          onClick={() => window.open(details.proofPhoto, '_blank')}
                          className="h-8 w-8 rounded-lg border border-emerald-100 overflow-hidden hover:scale-110 transition-transform shadow-sm"
                        >
                          <img src={details.proofPhoto} className="h-full w-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-text-tertiary">No Proof</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                        details.requestStatus === "pending" ? "bg-amber-100 text-amber-700" :
                        details.requestStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                        "bg-rose-100 text-rose-700"
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
                            <button
                              disabled={isProcessing === req.id}
                              onClick={() => handleReview(req.id, "approve", details)}
                              className="h-7 w-7 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-90"
                              title="Approve & Print"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            </button>
                            <button
                              disabled={isProcessing === req.id}
                              onClick={() => handleReview(req.id, "reject")}
                              className="h-7 w-7 flex items-center justify-center bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all shadow-md active:scale-90"
                              title="Reject"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handlePrint(details.itemId, details.qrCode)}
                            className="h-7 w-7 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all active:scale-90"
                            title="Re-print QR"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>
                          </button>
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

      {/* Pagination Footer Section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between shadow-sm">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Showing 1-{filteredRequests.length} of {filteredRequests.length} records
        </div>
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-emerald-600 transition-all disabled:opacity-30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-800 text-white text-[11px] font-bold shadow-md shadow-emerald-900/20">1</div>
          <button className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-emerald-600 transition-all disabled:opacity-30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
