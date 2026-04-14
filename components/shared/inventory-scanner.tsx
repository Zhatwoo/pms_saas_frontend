"use client";

import { useState, useRef, useEffect } from "react";

interface InventoryScannerProps {
  onComplete: () => void;
  isLocked?: boolean;
  title?: string;
}

export function InventoryScanner({ onComplete, isLocked = false, title = "Inventory Mandatory Scan" }: InventoryScannerProps) {
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  // Auto-focus input for scanning
  useEffect(() => {
    if (!showCompletionConfirm) {
      inputRef.current?.focus();
    }
  }, [showCompletionConfirm]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentScan.trim()) {
      if (!scannedItems.includes(currentScan.trim())) {
        setScannedItems([currentScan.trim(), ...scannedItems]);
      }
      setCurrentScan("");
    }
  };

  const removeItem = (id: string) => {
    setScannedItems(scannedItems.filter(item => item !== id));
  };

  if (showCompletionConfirm) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-lg p-4">
        <div className="w-full max-w-sm scale-in-center rounded-3xl bg-surface p-8 shadow-2xl border border-emerald-500/20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-text-primary mb-2">Audit Complete!</h2>
          <p className="text-sm text-text-tertiary mb-8">
            You have successfully scanned {scannedItems.length} items. All items in the physical display are accounted for.
          </p>
          <button
            onClick={onComplete}
            className="w-full rounded-2xl bg-emerald-700 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-700/20 transition-all hover:bg-emerald-800 hover:scale-[1.02] active:scale-95"
          >
            Finish & Grant Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface rounded-3xl border border-border-main p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8 text-left">
        <div>
          <h2 className="text-2xl font-black text-emerald-900 leading-tight">{title}</h2>
          <p className="text-sm text-text-tertiary">Scan all physical items (Pawned or Retail) to verify stock.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-100 px-6 py-3 border border-emerald-200">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-black text-emerald-800">{scannedItems.length} ITEMS ACCOUNTED</span>
        </div>
      </div>

      <form onSubmit={handleScan} className="mb-8">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 transition-transform group-focus-within:scale-110">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Awaiting Barcode Input..."
            value={currentScan}
            onChange={(e) => setCurrentScan(e.target.value)}
            className="w-full rounded-2xl border-2 border-border-main bg-surface-secondary py-6 pl-16 pr-36 text-xl font-bold text-text-primary outline-none focus:border-emerald-500 focus:bg-surface transition-all shadow-inner"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-emerald-700 px-8 py-3 text-sm font-black text-white transition-all hover:bg-emerald-800 shadow-lg shadow-emerald-700/20"
          >
            ADD
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 mb-8 pr-4 custom-scrollbar min-h-[300px]">
        {scannedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30 select-none">
            <div className="mb-6 rounded-full bg-surface-tertiary p-10 border-4 border-dashed border-border-main">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
                <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="text-lg font-bold text-text-primary">System is Locked</p>
            <p className="text-xs uppercase tracking-[0.2em] mt-2">Scan first item to begin verification</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scannedItems.map((id, index) => (
              <div 
                key={id} 
                className="flex items-center justify-between rounded-2xl border border-border-subtle bg-surface-secondary p-5 hover:border-emerald-500/40 transition-all group animate-slide-up"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/50 text-xs font-black text-emerald-700">
                    {scannedItems.length - index}
                  </div>
                  <div>
                    <p className="text-sm font-black text-text-primary tracking-tight uppercase">{id}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Verified Accounted</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeItem(id)}
                  className="rounded-xl p-2.5 text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border-main">
        <div className="flex items-center gap-4 text-amber-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-xs font-bold leading-relaxed max-w-sm">
            Access to pawn tickets, transactions, and settings is temporarily suspended until this audit is submitted.
          </p>
        </div>
        <button
          onClick={() => setShowCompletionConfirm(true)}
          disabled={scannedItems.length === 0}
          className="rounded-2xl bg-zinc-900 px-12 py-5 text-sm font-black text-pawn-gold shadow-2xl transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pawn-gold/10"
        >
          COMPLETE & UNLOCK
        </button>
      </div>
    </div>
  );
}
