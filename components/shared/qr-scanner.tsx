"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

type ZXingDecodeResult = {
  getText: () => string;
};

type ZXingControls = Awaited<ReturnType<BrowserQRCodeReader["decodeFromConstraints"]>>;

export function QrScanner({ onScan, onClose, isOpen }: QrScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<ZXingControls | null>(null);

  const clearCameraLoop = useCallback(() => {
    if (controlsRef.current) {
      void controlsRef.current.stop();
      controlsRef.current = null;
    }
    readerRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearCameraLoop();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setIsInitializing(true);
      setCameraError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera not supported in this browser.");
          setIsInitializing(false);
          return;
        }

        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: { facingMode: { ideal: "environment" } },
          },
          videoRef.current!,
          (result: ZXingDecodeResult | undefined) => {
            if (cancelled || !result) return;
            const text = result.getText().trim();
            if (text) {
              onScan(text);
              onClose();
            }
          }
        );

        if (!cancelled) {
          controlsRef.current = controls;
          setIsInitializing(false);
        } else {
          void controls.stop();
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(err.message || "Could not start camera.");
          setIsInitializing(false);
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      clearCameraLoop();
    };
  }, [isOpen, onScan, onClose, clearCameraLoop]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-surface rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-emerald-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <rect x="7" y="7" width="3" height="3"/>
                <rect x="14" y="7" width="3" height="3"/>
                <rect x="7" y="14" width="3" height="3"/>
                <path d="M14 14h3v3h-3z"/>
              </svg>
            </div>
            <h3 className="text-white font-black text-sm uppercase tracking-widest">QR Code Scanner</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-emerald-400 rounded-3xl relative shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400 animate-scan-line" />
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            </div>
          </div>

          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Initializing Camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-8 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/50">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-sm font-bold text-red-200">{cameraError}</p>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>

        <div className="bg-surface px-6 py-8 text-center">
          <p className="text-sm font-bold text-text-primary">Position the QR code within the frame</p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Scanning will happen automatically</p>
        </div>
      </div>
    </div>
  );
}
