"use client";

import { useState, useMemo, useEffect, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { 
  X, 
  Search, 
  ArrowRight, 
  Package, 
  ShieldCheck, 
  Hash, 
  Smartphone,
  Info,
  Undo2,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle
} from "lucide-react";

interface BuyBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
}

interface ForSaleItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  amount: number; // Original loan or cost
  price: number; // Added for buyback price
  status: string;
  pawnDate?: string;
  customers?: {
    full_name: string;
    contact_number: string;
  };
}

export function BuyBackModal({ isOpen, onClose, branchId, branchName }: BuyBackModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ForSaleItem | null>(null);
  const [buyBackPrice, setBuyBackPrice] = useState<string>("");
  const [adminForm, setAdminForm] = useState({
    processedBy: "",
    password: "",
  });

  const [items, setItems] = useState<ForSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // Search items that are Expired or For Sale
        const response = await api.get<{ items: any[] }>(`/inventory/pawned?status=Expired&search=${searchQuery}`);
        
        const mapped = (response.items || []).map(item => ({
          id: item.id,
          itemId: item.itemId,
          itemName: item.itemName,
          category: item.category,
          amount: Number(item.amount || 0),
          price: Number(item.amount || 0), // Default to original amount
          status: item.status,
          pawnDate: item.pawnDate,
          customers: item.customers
        }));
        
        setItems(mapped);
      } catch (err) {
        console.error("Failed to fetch items for buy back:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeout);
  }, [isOpen, searchQuery]);

  const handleConfirmBuyBack = async () => {
    if (!selectedItem) return;
    setError(null);

    const price = Number(buyBackPrice);
    if (!buyBackPrice || isNaN(price) || price <= 0) {
      setError("Please enter a valid Buy Back (Repurchase) price.");
      return;
    }

    if (!adminForm.password) {
      setError("Please enter password to verify.");
      return;
    }

    setIsConfirming(true);
    try {
      // 1. Verify Password
      await api.post("/auth/verify-password", { password: adminForm.password });

      // 2. Create Sale Transaction
      await api.post("/transactions", {
        purpose: "Buy Back",
        transaction_date: new Date().toISOString().split('T')[0],
        branch_id: branchId,
        branch: branchName,
        cash_in: price,
        cash_out: 0,
        unit: selectedItem.itemName,
        unit_code: selectedItem.itemId,
        pawn_amount: selectedItem.amount,
        details: `Repurchased by ${selectedItem.customers?.full_name || 'Original Owner'} | Status before sale: ${selectedItem.status}`,
        related_pawned_item_id: selectedItem.id
      });

      // 3. Mark Item as Redeemed (or Sold)
      await api.patch(`/inventory/pawned/${selectedItem.id}`, { status: 'Redeemed' });

      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 text-zinc-900">
      <div 
        className="relative w-full max-w-7xl h-[90vh] overflow-hidden rounded-2xl border border-zinc-800 bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-zinc-900 px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Buy Back / Repurchase</h2>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{branchName} | Expired Inventory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Side: Search & Selection */}
          <div className="w-full lg:w-[400px] border-r border-zinc-100 bg-zinc-50 flex flex-col shrink-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Search className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider">Search Expired Item</h3>
              </div>
              
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Name, Unit Code, Serial..."
                  className="w-full h-12 pl-12 pr-4 bg-white border-2 border-zinc-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Scanning Inventory...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-6 bg-white rounded-2xl border-2 border-dashed border-zinc-200">
                  <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-zinc-300" />
                  </div>
                  <p className="text-sm font-bold text-zinc-400">No expired items found</p>
                  <p className="text-[10px] text-zinc-400/60 uppercase mt-1 tracking-tighter">Try different unit code or name</p>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setBuyBackPrice(String(item.amount)); // Default price as original loan
                    }}
                    className={`w-full p-4 mb-3 rounded-2xl border-2 transition-all flex flex-col gap-2 text-left relative group ${
                      selectedItem?.id === item.id 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-white border-transparent hover:border-blue-200 hover:shadow-xl hover:shadow-zinc-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.itemId}</p>
                      <span className="bg-zinc-900 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-black text-zinc-800 leading-tight pr-8">{item.itemName}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 capitalize">{item.customers?.full_name || 'Unknown'}</p>
                      <p className="font-black text-zinc-900 text-xs">₱ {item.amount.toLocaleString()}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Details & Repurchase Price */}
          <div className="flex-1 bg-white overflow-y-auto custom-scrollbar">
            {selectedItem ? (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-[2px]">Expiration Buy Back</p>
                    <h2 className="text-4xl font-black text-zinc-950 tracking-tighter leading-none">
                      {selectedItem.itemName}
                    </h2>
                    <p className="text-zinc-500 font-bold flex items-center gap-2">
                      Owner: {selectedItem.customers?.full_name || 'Original Pawner'} • {selectedItem.customers?.contact_number || 'No Contact'}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Item Terminated</p>
                      <p className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Requires Negotiated Sale</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <DetailSection title="Record Details" icon={Smartphone}>
                    <DetailRow label="Original Loan" value={`₱ ${selectedItem.amount.toLocaleString()}`} />
                    <DetailRow label="Unit Code" value={selectedItem.itemId} />
                    <DetailRow label="Pawn Date" value={selectedItem.pawnDate || '---'} />
                    <DetailRow label="Category" value={selectedItem.category} />
                  </DetailSection>

                  <DetailSection title="Repurchase Agreement" icon={DollarSign}>
                    <div className="p-4 bg-zinc-50 rounded-xl space-y-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Agreed Buy Back Price</p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-400">₱</span>
                        <input 
                          type="number"
                          className="w-full h-14 pl-10 pr-4 bg-white border-2 border-zinc-200 rounded-xl text-2xl font-black text-zinc-900 outline-none focus:border-blue-500 transition-all"
                          placeholder="0"
                          value={buyBackPrice}
                          onChange={(e) => setBuyBackPrice(e.target.value)}
                        />
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 leading-tight">
                        Note: Repurchase happens after expiration. This price may be different from the original loan + interest.
                      </p>
                    </div>
                  </DetailSection>
                </div>

                {/* Confirm Section */}
                <div className="p-8 rounded-3xl bg-zinc-900 text-white relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 space-y-8">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-blue-500" />
                        <h4 className="text-xl font-black uppercase">Authorize Repurchase</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Admin Password</label>
                          <input 
                            type="password"
                            placeholder="••••••••"
                            className="w-full h-12 px-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-medium"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          />
                        </div>
                      </div>

                      {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <p className="text-xs font-bold text-red-200">{error}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-[320px] bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Repurchase</p>
                          <p className="text-3xl font-black text-white leading-none">₱ {Number(buyBackPrice || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmBuyBack}
                        disabled={isConfirming}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                      >
                        {isConfirming ? "Processing..." : (
                          <>
                            Finalize Buy Back
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 rounded-3xl bg-zinc-50 flex items-center justify-center mb-6">
                  <Package className="w-12 h-12 text-zinc-200" />
                </div>
                <h3 className="text-2xl font-black text-zinc-300 uppercase tracking-tight">Select Item to Repurchase</h3>
                <p className="text-zinc-400 font-bold max-w-xs mt-2 leading-relaxed italic">
                  "Only items with Expired or For Sale status are eligible for a Buy Back arrangement."
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function DetailSection({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4 text-zinc-400" />
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px]">{title}</h4>
      </div>
      <div className="divide-y divide-zinc-50 border-t border-zinc-100">
        {children}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{label}</span>
      <span className="text-xs font-black text-zinc-900">{value}</span>
    </div>
  );
}
