"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { BranchOption } from "@/contexts/branch-context";

interface ItemTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  branchId: string;
  branchName: string;
  branches: BranchOption[];
  incomingPendingCount?: number;
}

interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  branch?: string;
  branchId?: string;
  price?: number | string;
  status?: string;
}

interface BranchApiItem {
  id: string;
  branch_code?: string;
  name: string;
  location?: string;
  contact_number?: string;
  environment?: string;
  status?: string;
}

interface TransferItem {
  id: string;
  saleItemId: string;
  itemId: string;
  itemName: string;
  sourceBranchId: string;
  sourceBranchName: string;
  targetBranchId: string;
  targetBranchName: string;
  status: string;
  itemIncluded?: string;
  notes?: string;
  requestedAt?: string;
}

const transferIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="m15 15 6 6" />
  </svg>
);

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ItemTransferModal({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  branchName,
  branches,
  incomingPendingCount = 0,
}: ItemTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [destinationBranchOptions, setDestinationBranchOptions] = useState<BranchOption[]>([]);
  const [targetBranchId, setTargetBranchId] = useState("");
  const [itemIncluded, setItemIncluded] = useState("");
  const [notes, setNotes] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAllBranches = branchId === "__all__";
  const activeBranches = destinationBranchOptions.length > 0
    ? destinationBranchOptions
    : branches.filter((branch) => branch.id !== "__all__");

  const destinationBranches = useMemo(() => {
    const sourceBranchId = selectedItem?.branchId || branchId;

    return activeBranches.filter((branch) => branch.id !== sourceBranchId);
  }, [activeBranches, branchId, selectedItem]);

  const pendingTransfers = useMemo(
    () => transfers.filter((transfer) => transfer.status === "pending"),
    [transfers],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const branchParam = isAllBranches ? "" : `&branch=${encodeURIComponent(branchId)}`;
      const [itemsResponse, transfersResponse, branchResponse] = await Promise.all([
        api.get<{ items: SaleItem[] }>(`/inventory/for-sale?status=Available&search=${encodeURIComponent(searchQuery)}&limit=100${branchParam}`),
        api.get<{ transfers: TransferItem[] }>(`/inventory/transfers${isAllBranches ? "" : `?branch=${encodeURIComponent(branchId)}`}`),
        api.get<BranchApiItem[]>("/branches/transfer-destinations"),
      ]);

      setItems(itemsResponse.items || []);
      setTransfers(transfersResponse.transfers || []);
      setDestinationBranchOptions(
        (Array.isArray(branchResponse) ? branchResponse : []).map((branch) => ({
          id: branch.id,
          name: branch.name,
          location: branch.location,
          phone: branch.contact_number,
          code: branch.branch_code,
        })),
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load transfer data."));
    } finally {
      setIsLoading(false);
    }
  }, [branchId, isAllBranches, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = window.setTimeout(() => {
      void loadData();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [isOpen, loadData]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setTargetBranchId("");
      setItemIncluded("");
      setNotes("");
      setPassword("");
    }
  }, [isOpen]);

  const handleSubmitTransfer = async () => {
    if (!selectedItem || !targetBranchId || !password || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/auth/verify-password", { password });
      await api.post(`/inventory/for-sale/${selectedItem.id}/transfer-request`, {
        target_branch_id: targetBranchId,
        item_included: itemIncluded,
        notes,
      });

      toast.success("Transfer request created. Destination branch must receive the item.");
      setSelectedItem(null);
      setTargetBranchId("");
      setItemIncluded("");
      setNotes("");
      setPassword("");
      await loadData();
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to request item transfer."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceive = async (transfer: TransferItem) => {
    if (!password || isSubmitting) {
      toast.error("Enter your password before receiving a transfer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/verify-password", { password });
      await api.post(`/inventory/transfers/${transfer.id}/receive`, {});
      toast.success(`${transfer.itemName} received by ${transfer.targetBranchName}.`);
      setPassword("");
      await loadData();
      onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to receive transferred item."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (name === "itemIncluded") setItemIncluded(value);
    if (name === "notes") setNotes(value);
    if (name === "password") setPassword(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 text-zinc-900 dark:text-white">
      <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border-main bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-main bg-emerald-950 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-amber-300">
              {transferIcon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">{branchName}</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight">Transfer Items</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close transfer modal"
          >
            x
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="min-h-0 overflow-y-auto border-r border-border-main p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">Available Items</p>
                <h3 className="mt-1 text-sm font-bold text-text-primary">Select an item to send to another branch</h3>
              </div>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search item name or code"
                className="h-10 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none focus:border-emerald-500 sm:w-72"
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border-main">
              <div className="max-h-[330px] overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-emerald-900 text-amber-300">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-black uppercase">Item Code</th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase">Item</th>
                      <th className="px-3 py-2 text-[10px] font-black uppercase">Branch</th>
                      <th className="px-3 py-2 text-right text-[10px] font-black uppercase">SRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-surface-secondary">
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-sm text-text-muted">Loading items...</td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-sm text-text-muted">No available items found.</td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer transition hover:bg-emerald-500/10 ${selectedItem?.id === item.id ? "bg-emerald-600 text-white" : ""}`}
                        >
                          <td className="whitespace-nowrap px-3 py-2 text-xs font-black">{item.itemId}</td>
                          <td className="px-3 py-2 text-xs font-bold">{item.itemName}</td>
                          <td className="px-3 py-2 text-xs">{item.branch || "-"}</td>
                          <td className="px-3 py-2 text-right text-xs font-bold">PHP {Number(item.price || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 grid gap-4 rounded-xl border border-border-main bg-surface-secondary p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Selected Item</label>
                  <div className="rounded-lg border border-border-main bg-surface px-3 py-2 text-sm font-bold text-text-primary">
                    {selectedItem ? `${selectedItem.itemId} - ${selectedItem.itemName}` : "Select an item"}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-muted">Destination Branch</label>
                  <select
                    value={targetBranchId}
                    onChange={(event) => setTargetBranchId(event.target.value)}
                    className="h-10 w-full rounded-lg border border-border-main bg-surface px-3 text-sm font-bold text-text-primary outline-none focus:border-emerald-500"
                  >
                    <option value="">Select branch</option>
                    {destinationBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <input
                name="itemIncluded"
                value={itemIncluded}
                onChange={handleTextChange}
                placeholder="Included items / accessories"
                className="h-10 rounded-lg border border-border-main bg-surface px-3 text-sm text-text-primary outline-none focus:border-emerald-500"
              />
              <textarea
                name="notes"
                value={notes}
                onChange={handleTextChange}
                placeholder="Transfer notes"
                className="min-h-20 rounded-lg border border-border-main bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">Pending Receipts</p>
                <h3 className="mt-1 text-sm font-bold text-text-primary">Confirm items received by the destination branch</h3>
              </div>
              {incomingPendingCount > 0 ? (
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-900">
                  {incomingPendingCount} to receive
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {pendingTransfers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-main bg-surface-secondary p-6 text-center text-sm text-text-muted">
                  No transfer items are waiting for confirmation.
                </div>
              ) : (
                pendingTransfers.map((transfer) => (
                  <div key={transfer.id} className="rounded-xl border border-border-main bg-surface-secondary p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-text-primary">{transfer.itemName}</p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">{transfer.itemId}</p>
                      </div>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase text-amber-500">Pending</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-text-secondary">
                      <p><span className="font-bold text-text-muted">From:</span> {transfer.sourceBranchName}</p>
                      <p><span className="font-bold text-text-muted">To:</span> {transfer.targetBranchName}</p>
                      {transfer.itemIncluded ? <p><span className="font-bold text-text-muted">Included:</span> {transfer.itemIncluded}</p> : null}
                      {transfer.notes ? <p><span className="font-bold text-text-muted">Notes:</span> {transfer.notes}</p> : null}
                      <p><span className="font-bold text-text-muted">Requested:</span> {formatDateTime(transfer.requestedAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReceive(transfer)}
                      disabled={isSubmitting || (!isAllBranches && transfer.targetBranchId !== branchId)}
                      className="mt-4 h-10 w-full rounded-lg bg-emerald-600 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                    >
                      Receive Item
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border-main bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            name="password"
            value={password}
            onChange={handleTextChange}
            type="password"
            placeholder="Password for transfer / receive"
            className="h-11 w-full rounded-lg border border-border-main bg-surface-secondary px-3 text-sm text-text-primary outline-none focus:border-emerald-500 sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg px-5 text-xs font-black uppercase tracking-wider text-text-muted transition hover:text-text-primary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmitTransfer}
              disabled={!selectedItem || !targetBranchId || !password || isSubmitting}
              className="h-11 rounded-lg bg-emerald-700 px-6 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
            >
              {isSubmitting ? "Processing..." : "Create Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
