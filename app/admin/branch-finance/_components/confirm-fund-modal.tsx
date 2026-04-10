"use client";

import { useState, useRef } from "react";

interface ConfirmFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File | null) => void;
  amount: number;
}

export function ConfirmFundModal({ isOpen, onClose, onConfirm, amount }: ConfirmFundModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(file);
    // Reset state after confirm
    setFile(null);
    setPreview(null);
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border-main px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Confirm Fund Receipt</h2>
              <p className="text-xs text-text-secondary">Please upload proof of transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Amount to Confirm
            </p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-800">
              ₱{amount.toLocaleString("en-PH")}
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Upload Proof <span className="text-red-500">*</span>
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                preview
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-border-main bg-surface-secondary hover:border-emerald-400 hover:bg-surface"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              
              {preview ? (
                <div className="absolute inset-2 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Proof preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <p className="text-sm font-semibold text-white">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center px-4">
                  <div className="mb-3 rounded-full bg-surface p-3 shadow-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    Click or drag image here
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    PNG, JPG, or JPEG (max 5MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-primary">
              Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password to confirm"
                className="w-full rounded-lg border border-input-border bg-input-bg py-2.5 pl-10 pr-4 text-sm text-text-secondary outline-none transition-colors focus:border-pawn-gold focus:ring-1 focus:ring-pawn-gold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input-border px-5 py-2.5 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !password}
              className="flex items-center gap-2 rounded-lg bg-pawn-gold px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pawn-gold-hover focus:outline-none focus:ring-2 focus:ring-pawn-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Confirm Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
