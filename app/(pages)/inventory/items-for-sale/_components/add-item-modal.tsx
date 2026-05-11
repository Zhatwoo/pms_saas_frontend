"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useBranch } from "@/contexts/branch-context";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const { branches } = useBranch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listingDate = new Date().toISOString().split("T")[0];
  const listingDateLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const [form, setForm] = useState({
    item_name: "",
    category: "",
    price: "",
    branch_id: "",
    stock_level: "1",
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generatedItemId, setGeneratedItemId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setGeneratedItemId(`SALE-${Date.now().toString().slice(-6)}`);
    } else {
      setForm({
        item_name: "",
        category: "",
        price: "",
        branch_id: "",
        stock_level: "1",
      });
      setPhotoUrl(null);
      setQrUrl(null);
    }
  }, [isOpen]);

  const handleGenerateQR = () => {
    if (!form.item_name || !form.category || !form.price || !form.branch_id) {
      toast.error("Please fill in all details before generating QR.");
      return;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const publicViewUrl = `${baseUrl}/view-ticket/${encodeURIComponent(generatedItemId)}`;
    const encoded = encodeURIComponent(publicViewUrl);
    const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&size=250x250&color=065f46&bgcolor=f0fdf4&margin=2`;
    setQrUrl(url);
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingRef.current) return;
    
    if (!form.item_name || !form.category || !form.price || !form.branch_id) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (!photoUrl) {
      toast.error("Please add a photo of the item.");
      return;
    }

    if (!qrUrl) {
      toast.error("Please generate a QR code for the item.");
      return;
    }

    isProcessingRef.current = true;
    setIsSubmitting(true);

    try {
      const selectedBranch = branches.find(b => String(b.id) === String(form.branch_id));

      await api.post("/inventory/for-sale", {
        item_id: generatedItemId,
        item_name: form.item_name,
        category: form.category,
        price: Number(form.price),
        branch_id: form.branch_id,
        branch: selectedBranch?.name || "Unknown Branch",
        stock_level: Number(form.stock_level),
        status: "Available",
        image_url: photoUrl
      });

      toast.success("Item added for sale successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add item.");
    } finally {
      setIsSubmitting(false);
      isProcessingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-text-primary dark:text-text-primary">
      <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border-main bg-surface shadow-2xl transition-colors dark:border-white/10 dark:bg-zinc-950">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black text-white">Add Item For Sale</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
             <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-text-primary">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-emerald-700 tracking-wider dark:text-emerald-400">Item Details</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Item Name</label>
                <input required name="item_name" value={form.item_name} onChange={handleChange} className="w-full h-10 rounded-xl border border-border-main bg-surface-secondary px-3 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Category</label>
                <select 
                  required 
                  name="category" 
                  value={form.category} 
                  onChange={handleChange} 
                  className="w-full h-10 rounded-xl border border-border-main bg-surface-secondary px-3 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-emerald-500 cursor-pointer appearance-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">-- Select Category --</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Smartphone">Smartphone</option>
                  <option value="Laptop & PC">Laptop & PC</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Gaming Console">Gaming Console</option>
                  <option value="Camera">Camera</option>
                  <option value="Smartwatch">Smartwatch</option>
                  <option value="Audio and Earphone">Audio and Earphone</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Price (₱)</label>
                <input required type="number" name="price" value={form.price} onChange={handleChange} className="w-full h-10 rounded-xl border border-border-main bg-surface-secondary px-3 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Assign to Branch</label>
                <select required name="branch_id" value={form.branch_id} onChange={handleChange} className="w-full h-10 rounded-xl border border-border-main bg-surface-secondary px-3 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-emerald-500 cursor-pointer dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
                  <option value="">-- Select Branch --</option>
                  {branches.filter(b => b.id !== "__all__").map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                <label className="text-[10px] font-bold uppercase text-text-muted">Date Listed</label>
                <div className="mt-1 text-sm font-semibold text-text-primary">{listingDateLabel}</div>
                <input type="hidden" value={listingDate} readOnly />
                <p className="text-[10px] leading-relaxed text-text-muted">This is the date the item will be shown as added to Items For Sale.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-emerald-700 tracking-wider dark:text-emerald-400">Media & QR</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-muted">Item Photo</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 transition-colors hover:bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:hover:bg-emerald-400/10"
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Item" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">Click to upload photo</span>
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-text-muted">QR Code</label>
                  <button type="button" onClick={handleGenerateQR} className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 dark:hover:bg-emerald-400/25">Generate QR</button>
                </div>
                <div className="flex h-32 w-full items-center justify-center rounded-2xl border border-border-main bg-surface-secondary dark:border-white/10 dark:bg-zinc-900">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR" className="h-28 w-28 object-contain" />
                  ) : (
                    <span className="text-xs font-medium text-text-muted">QR not generated</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-border-subtle pt-4 dark:border-white/10">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-black uppercase text-text-muted hover:bg-surface-secondary dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white hover:bg-emerald-700 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
