"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface QRReplacementRequestModalProps {
  isOpen: boolean;
  pawnedItemId: string;
  itemCode?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type ReplacementReason = "damaged" | "lost" | "torn";

export function QRReplacementRequestModal({
  isOpen,
  pawnedItemId,
  itemCode,
  onClose,
  onSuccess,
}: QRReplacementRequestModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReplacementReason>("damaged");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason for the replacement");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/qr-replacement-requests", {
        pawned_item_id: pawnedItemId,
        reason,
        description: description || undefined,
      });

      toast.success("QR Code Replacement Request submitted successfully!");
      setDescription("");
      setReason("damaged");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit replacement request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-100 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Request QR Code Replacement
              </h3>
              {itemCode && (
                <p className="text-sm text-text-secondary">Item: {itemCode}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-text-muted hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Reason for Replacement <span className="text-red-600">*</span>
            </label>
            <div className="space-y-2">
              {["damaged", "lost", "torn"].map((r) => (
                <label key={r} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value as ReplacementReason)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-text-primary capitalize font-medium">
                    {r === "damaged" && "🔨 Damaged"}
                    {r === "lost" && "❌ Lost"}
                    {r === "torn" && "📄 Torn"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-text-primary mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the damage, loss, or issue with the QR code..."
              className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-text-primary resize-none"
              rows={4}
            />
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
            <p className="font-semibold mb-1">⚠️ Important:</p>
            <p>
              Your request will be reviewed and approved by a Super Admin before a new QR code can be generated. This ensures inventory security.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 text-text-primary hover:bg-zinc-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="anim-loading h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
