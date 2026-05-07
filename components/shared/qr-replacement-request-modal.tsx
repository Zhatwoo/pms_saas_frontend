"use client";

import { useState, useEffect, useRef } from "react";
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
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setProofPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason for the replacement");
      return;
    }

    if (!proofPhoto) {
      toast.error("Please take a picture of the damaged/lost sticker as proof.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedReason = reason.charAt(0).toUpperCase() + reason.slice(1) as "Damaged" | "Lost" | "Torn";
      await api.post(`/inventory/pawned/${pawnedItemId}/qr-replacement-request`, {
        reason: formattedReason,
        message: description || undefined,
        proofPhoto: proofPhoto || undefined,
      });

      toast.success("QR Code Replacement Request submitted successfully!");
      setDescription("");
      setProofPhoto(null);
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
              rows={3}
            />
          </div>

          {/* Proof Photo */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-2">
              Proof Photo <span className="text-red-600">*</span>
            </label>
            <div className="flex flex-col gap-3">
              {proofPhoto && !isCameraActive ? (
                <div className="relative h-48 w-full overflow-hidden rounded-xl border border-zinc-200 shadow-inner">
                  <img src={proofPhoto} alt="Proof" className="h-full w-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setProofPhoto(null)}
                    className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black shadow-2xl">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 bg-zinc-800/80 text-white text-[10px] font-bold rounded-full hover:bg-zinc-900 transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-emerald-500"
                    >
                      <div className="h-4 w-4 bg-emerald-500 rounded-full" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 transition-colors hover:bg-emerald-100"
                  >
                    <div className="flex flex-col items-center justify-center text-emerald-600">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      <p className="text-[10px] font-black uppercase tracking-widest">Open Camera</p>
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-text-tertiary uppercase font-bold tracking-tighter">OR</p>
                  <label className="flex py-2 w-full cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-all">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Upload from Files</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
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
