"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RenewalProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoBase64: string) => void;
  isLoading: boolean;
}

export function RenewalProofModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: RenewalProofModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = useCallback(async () => {
    setCameraError("");
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => undefined);
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.warn("Camera access error:", err);
      setCameraError(
        "Camera access denied or not available. Please allow camera permissions or upload an image file instead."
      );
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCameraOpen(false);
    setCameraError("");
  }, []);

  // Open camera when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoto(null);
      void openCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, openCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setPhoto(dataUrl);
      stopCamera();
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhoto(event.target.result as string);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setPhoto(null);
    void openCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-emerald-500/20 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-300">
              Transaction Proof
            </p>
            <h3 className="text-base font-black uppercase tracking-wider mt-0.5">
              Renewal MOA Capture
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center">
          {/* Main View Area */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border-2 border-emerald-500/20 shadow-inner flex items-center justify-center">
            {photo ? (
              // Preview captured/uploaded photo
              <img
                src={photo}
                alt="Captured MOA Proof"
                className="w-full h-full object-cover"
              />
            ) : cameraOpen && !cameraError ? (
              // Live camera stream
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder borders */}
                {isStreaming && (
                  <>
                    <span className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                    <span className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                    <span className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                    <span className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  </>
                )}
              </>
            ) : (
              // Camera Error / Loading state & upload option
              <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-zinc-500 mb-3"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p className="text-xs font-bold text-zinc-500 mb-4 max-w-xs">
                  {cameraError || "Loading camera stream..."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  Upload Signed MOA File
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="w-full mt-5 flex items-center justify-between gap-3">
            {photo ? (
              // After photo captured/selected
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition"
                >
                  Retake Photo
                </button>
                <button
                  type="button"
                  onClick={() => onConfirm(photo)}
                  disabled={isLoading}
                  className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="anim-loading h-4 w-4 border-t-white border-white/30 rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>Confirm & Save Renewal</>
                  )}
                </button>
              </>
            ) : (
              // When camera stream is active
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition"
                >
                  Upload File
                </button>
                {cameraOpen && !cameraError && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={!isStreaming || isLoading}
                    className="w-14 h-14 rounded-full bg-white border-4 border-emerald-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
                    title="Capture signed MOA photo"
                  >
                    <span className="w-10 h-10 rounded-full bg-emerald-600 block hover:bg-emerald-700 transition" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-2xl transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Canvas for rendering captures */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
