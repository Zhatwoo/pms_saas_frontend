"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { TransactionConfirmModal } from "@/components/shared/transaction-confirm-modal";
import { TabHint } from "./ui";

const STORAGE_KEY = "pms.moa.uploads.v1";
const MAX_UPLOADS = 50;

export type MoaUploadedImage = {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: number;
};

function loadUploads(): MoaUploadedImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MoaUploadedImage[]) : [];
  } catch {
    return [];
  }
}

function saveUploads(items: MoaUploadedImage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_UPLOADS)));
  } catch {
    // storage full — silently fail
  }
}

export function MoaUploadsTab({
  enabled,
  onUseImage,
}: {
  enabled: boolean;
  onUseImage: (dataUrl: string) => void;
}) {
  const [uploads, setUploads] = useState<MoaUploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUploads(loadUploads());
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const remaining = MAX_UPLOADS - uploads.length;
      const batch = fileArray.slice(0, Math.max(0, remaining));

      batch.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          const newItem: MoaUploadedImage = {
            id: `upl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            dataUrl: reader.result,
            createdAt: Date.now(),
          };
          setUploads((prev) => {
            const next = [newItem, ...prev].slice(0, MAX_UPLOADS);
            saveUploads(next);
            return next;
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [uploads.length],
  );

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const next = prev.filter((item) => item.id !== id);
      saveUploads(next);
      return next;
    });
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (!enabled) return;
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div>
        <TabHint>
          Upload images to reuse across your MOA designs. Click an image to apply it to the selected element.
        </TabHint>
      </div>

      {/* Upload zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => enabled && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          !enabled
            ? "cursor-not-allowed border-zinc-200 opacity-50"
            : dragOver
              ? "border-emerald-500 bg-emerald-50"
              : "border-zinc-300 bg-zinc-50 hover:border-emerald-400 hover:bg-emerald-50/60"
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-zinc-800">Upload images</p>
          <p className="mt-0.5 text-[9px] text-zinc-500">
            Click or drag & drop · PNG, JPG, SVG
          </p>
        </div>
      </div>

      {/* Gallery */}
      {uploads.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
              Your uploads ({uploads.length})
            </p>
            {uploads.length > 1 ? (
              <button
                type="button"
                disabled={!enabled}
                onClick={() => setShowClearConfirm(true)}
                className="text-[9px] font-semibold text-red-500 hover:underline disabled:opacity-40"
              >
                Clear all
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {uploads.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="h-full w-full cursor-pointer object-cover transition hover:opacity-80"
                  title={`Click to use "${item.name}"`}
                  onClick={() => {
                    if (!enabled) return;
                    onUseImage(item.dataUrl);
                  }}
                />
                <button
                  type="button"
                  title="Delete"
                  disabled={!enabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeUpload(item.id);
                  }}
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded bg-red-500 text-white shadow-sm hover:bg-red-600 group-hover:flex disabled:hidden"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-zinc-200 py-6 text-center">
          <ImagePlus className="h-6 w-6 text-zinc-300" />
          <p className="text-[10px] text-zinc-400">No images uploaded yet</p>
        </div>
      )}

      <TransactionConfirmModal
        isOpen={showClearConfirm}
        title="Clear all uploads"
        message="Delete all uploaded images? This action cannot be undone."
        confirmLabel="Delete all"
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setUploads([]);
          saveUploads([]);
          setShowClearConfirm(false);
        }}
      />
    </div>
  );
}
