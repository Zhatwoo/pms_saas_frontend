import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { StatusBadge } from "./status-badge";
import Image from "next/image";

interface InventoryAuditModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

interface ScannedItemDetails {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  branch: string;
  pawnDate: string;
  status: string;
  originalPhoto?: string;
}

export function InventoryAuditModal({ isOpen, onConfirm }: InventoryAuditModalProps) {
  const [scannedItems, setScannedItems] = useState<ScannedItemDetails[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const [pendingItem, setPendingItem] = useState<ScannedItemDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  // Auto-focus input for scanning
  useEffect(() => {
    if (isOpen && !showCompletionConfirm && !pendingItem) {
      inputRef.current?.focus();
    }
  }, [isOpen, showCompletionConfirm, pendingItem]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = currentScan.trim().toUpperCase();
    if (!cleanId) return;

    if (scannedItems.some(i => i.itemId === cleanId)) {
      setError("Item already scanned and verified.");
      setCurrentScan("");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const data = await api.get<ScannedItemDetails>(`/inventory/item/${cleanId}`);
      if (data) {
        setPendingItem(data);
        setCurrentScan("");
      }
    } catch (err: any) {
      setError(err.message || "Item not found in system.");
      setCurrentScan("");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyItem = () => {
    if (pendingItem) {
      setScannedItems([pendingItem, ...scannedItems]);
      setPendingItem(null);
    }
  };

  const removeItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item.id !== id));
  };

  if (!isOpen) return null;

  if (showCompletionConfirm) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-lg">
        <div className="w-full max-w-sm scale-in-center rounded-3xl bg-surface p-8 shadow-2xl border border-emerald-500/20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-2">Audit Complete!</h2>
          <p className="text-sm text-text-tertiary mb-8">
            You have successfully scanned {scannedItems.length} items. All items are accounted for.
          </p>
          <button
            onClick={onConfirm}
            className="w-full rounded-2xl bg-emerald-700 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-700/20 transition-all hover:bg-emerald-800 hover:scale-[1.02] active:scale-95"
          >
            Finish & Open Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
      <div className="w-full max-w-2xl scale-in-center rounded-3xl bg-surface p-8 shadow-2xl border border-border-main overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-text-primary leading-tight">Inventory Mandatory Scan</h2>
            <p className="text-xs text-text-tertiary">Daily physical inventory audit required to open operations.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">{scannedItems.length} Verified</span>
          </div>
        </div>

        {pendingItem ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-emerald-50/50 rounded-3xl mb-8 border border-emerald-100 scale-in-center">
             <div className="relative h-40 w-40 mb-6 group">
                <div className="absolute inset-0 rounded-2xl bg-emerald-200 animate-ping opacity-20" />
                <div className="relative h-full w-full rounded-2xl bg-white p-2 shadow-xl border border-emerald-200">
                   {pendingItem.originalPhoto ? (
                      <Image src={pendingItem.originalPhoto} alt={pendingItem.itemName} width={160} height={160} className="rounded-xl object-cover h-full w-full" />
                   ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-emerald-300">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <p className="text-[10px] font-bold uppercase mt-2">No Photo</p>
                      </div>
                   )}
                </div>
             </div>
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">{pendingItem.itemId}</p>
             <h3 className="text-xl font-black text-text-primary mb-1">{pendingItem.itemName}</h3>
             <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-bold text-text-tertiary">{pendingItem.category}</span>
                <span className="h-1 w-1 rounded-full bg-text-muted" />
                <span className="text-xs font-bold text-text-tertiary">{pendingItem.branch}</span>
             </div>
             
             <div className="flex gap-4 w-full max-w-sm">
                <button 
                  onClick={() => setPendingItem(null)}
                  className="flex-1 py-3 rounded-2xl border border-border-main text-xs font-bold text-text-secondary hover:bg-white transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={verifyItem}
                  className="flex-1 py-3 rounded-2xl bg-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-all active:scale-95"
                >
                  Complete & Verify
                </button>
             </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleScan} className="mb-6 relative">
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan Barcode or Type Item ID..."
                  value={currentScan}
                  onChange={(e) => setCurrentScan(e.target.value)}
                  disabled={isLoading}
                  className={`w-full rounded-2xl border-2 ${error ? "border-rose-500 bg-rose-50/50" : "border-border-main bg-surface-secondary"} py-5 pl-14 pr-32 text-lg font-bold text-text-primary outline-none focus:border-emerald-500 transition-all shadow-inner`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !currentScan.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-black disabled:opacity-50"
                >
                  {isLoading ? "Searching..." : "Scan Item"}
                </button>
              </div>
              {error && <p className="absolute -bottom-6 left-2 text-[10px] font-bold text-rose-600 italic">{error}</p>}
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar">
              {scannedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <div className="mb-4 rounded-full bg-surface-tertiary p-6 border-2 border-dashed border-border-main">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" /><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold">Waiting for input...</p>
                  <p className="text-[10px] font-medium uppercase tracking-widest mt-1">Ready to receive barcode signal</p>
                </div>
              ) : (
                scannedItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-secondary p-4 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-emerald-600/50 w-6 text-center">{scannedItems.length - index}</span>
                      <div>
                        <p className="text-sm font-bold text-text-primary tracking-tight uppercase">{item.itemId}</p>
                        <p className="text-[10px] text-text-tertiary font-medium">{item.itemName}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCompletionConfirm(true)}
                disabled={scannedItems.length === 0}
                className="flex-1 rounded-2xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-xl transition-all hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Inventory Count
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
