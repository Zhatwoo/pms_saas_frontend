"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type PickerMode = "upload" | "camera";

interface AvatarPickerModalProps {
  isOpen: boolean;
  isSaving?: boolean;
  currentAvatarUrl?: string;
  onClose: () => void;
  onSave: (avatarDataUrl: string) => Promise<void> | void;
}

const MAX_OUTPUT_SIZE = 512;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

async function cropImageWithMath(
  sourceDataUrl: string,
  zoom = 1,
  positionX = 0,
  positionY = 0,
  outputSize: number,
  quality: number = 0.82,
): Promise<string> {
  const image = await loadImage(sourceDataUrl);

  const cropSize = Math.min(image.width, image.height) / Math.max(zoom, 1);
  const maxOffsetX = (image.width - cropSize) / 2;
  const maxOffsetY = (image.height - cropSize) / 2;
  const sx = maxOffsetX + maxOffsetX * Math.max(-1, Math.min(1, positionX));
  const sy = maxOffsetY + maxOffsetY * Math.max(-1, Math.min(1, positionY));

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process image.");
  }

  context.drawImage(
    image,
    sx,
    sy,
    cropSize,
    cropSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL("image/jpeg", quality);
}

async function normalizeToAvatarDataUrl(
  sourceDataUrl: string,
  zoom = 1,
  positionX = 0,
  positionY = 0,
): Promise<string> {
  return cropImageWithMath(sourceDataUrl, zoom, positionX, positionY, MAX_OUTPUT_SIZE, 0.82);
}

function stopMediaTracks(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/* ────────────────────────────────────────────────────────────────────
   Vertical Draggable Zoom Slider
   A custom vertical range slider that supports both click and drag.
   Top = max zoom, Bottom = min zoom.
   ──────────────────────────────────────────────────────────────────── */
function VerticalZoomSlider({
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  // Percent filled from the bottom (min at bottom, max at top)
  const percent = ((value - min) / (max - min)) * 100;

  const computeValue = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return value;
      const rect = track.getBoundingClientRect();
      // Invert: top of track = max, bottom = min
      const ratio = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      const raw = min + ratio * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step, value],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      onChange(computeValue(e.clientY));
    };

    const handleUp = () => {
      isDraggingRef.current = false;
      setDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, computeValue, onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setDragging(true);
    onChange(computeValue(e.clientY));
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      className={`relative w-2 cursor-pointer rounded-full ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
      style={{ touchAction: "none", height: "100%" }}
    >
      {/* Track background */}
      <div className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
      {/* Filled portion (from bottom) */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-full bg-emerald-500 transition-[height] duration-75"
        style={{ height: `${percent}%` }}
      />
      {/* Thumb */}
      <div
        className={`absolute left-1/2 h-4.5 w-4.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-emerald-500 bg-white shadow-md transition-shadow dark:bg-zinc-200 ${
          dragging ? "scale-110 shadow-lg shadow-emerald-500/30" : "hover:shadow-emerald-500/20"
        }`}
        style={{ bottom: `${percent}%` }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Avatar Picker Modal
   ──────────────────────────────────────────────────────────────────── */
export function AvatarPickerModal({
  isOpen,
  isSaving = false,
  currentAvatarUrl,
  onClose,
  onSave,
}: AvatarPickerModalProps) {
  const [mode, setMode] = useState<PickerMode>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAvatarDragging, setIsAvatarDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const avatarDragStateRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasPreview = Boolean(previewUrl);
  const displayImage = previewUrl || currentAvatarUrl || null;

  const subtitle = useMemo(() => {
    if (mode === "camera") {
      return "Use your camera to capture a new avatar.";
    }
    return "Upload a photo from your device.";
  }, [mode]);

  useEffect(() => {
    if (!isOpen) {
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
      setIsDragging(false);
      setIsAvatarDragging(false);
      setCroppedPreviewUrl(null);
      return;
    }

    setPreviewUrl(null);
    setSourceImageUrl(null);
    setCroppedPreviewUrl(null);
    setError(null);
    setMode("upload");
    setZoom(1);
    setPositionX(0);
    setPositionY(0);
    setIsDragging(false);
    setIsAvatarDragging(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "camera") {
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
      return;
    }

    let canceled = false;

    async function startCamera() {
      setIsStartingCamera(true);
      setError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera is not supported on this browser/device.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (canceled) {
          stopMediaTracks(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (cameraError) {
        setError(
          cameraError instanceof Error
            ? cameraError.message
            : "Unable to start camera.",
        );
      } finally {
        if (!canceled) {
          setIsStartingCamera(false);
        }
      }
    }

    void startCamera();

    return () => {
      canceled = true;
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
    };
  }, [isOpen, mode]);

  // Generate preview canvas that matches the exact crop
  useEffect(() => {
    if (!sourceImageUrl) {
      setCroppedPreviewUrl(null);
      return;
    }

    const imageUrlForPreview = sourceImageUrl;
    let cancelled = false;

    async function generatePreview() {
      try {
        const preview = await cropImageWithMath(
          imageUrlForPreview,
          zoom,
          positionX,
          positionY,
          256, // Higher res preview for the larger preview area
          0.85,
        );
        if (!cancelled) {
          setCroppedPreviewUrl(preview);
        }
      } catch {
        // Silently ignore preview generation errors
      }
    }

    void generatePreview();

    return () => {
      cancelled = true;
    };
  }, [sourceImageUrl, zoom, positionX, positionY]);

  const handleSelectFile = async (file: File | null) => {
    if (!file) return;
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(file);
      setSourceImageUrl(dataUrl);
      setPreviewUrl(dataUrl);
      setMode("upload");
      setZoom(1);
      setPositionX(0);
      setPositionY(0);
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Invalid image file.");
    }
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        throw new Error("Camera is not ready yet.");
      }

      const cropSize = Math.min(width, height);
      const sx = (width - cropSize) / 2;
      const sy = (height - cropSize) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = MAX_OUTPUT_SIZE;
      canvas.height = MAX_OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to capture image.");
      }

      context.drawImage(
        video,
        sx,
        sy,
        cropSize,
        cropSize,
        0,
        0,
        MAX_OUTPUT_SIZE,
        MAX_OUTPUT_SIZE,
      );

      const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      setSourceImageUrl(capturedDataUrl);
      setPreviewUrl(capturedDataUrl);
      setMode("upload");
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
      setZoom(1);
      setPositionX(0);
      setPositionY(0);
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Failed to capture image.",
      );
    }
  };

  const handleSave = async () => {
    const sourceImage = sourceImageUrl || previewUrl;

    if (!sourceImage) {
      setError("Please select or capture a photo first.");
      return;
    }

    setError(null);
    const finalAvatar = await normalizeToAvatarDataUrl(
      sourceImage,
      zoom,
      positionX,
      positionY,
    );
    await onSave(finalAvatar);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileDrop = async (files: FileList | null) => {
    const file = files?.[0] ?? null;
    setIsDragging(false);
    await handleSelectFile(file);
  };

  const beginAvatarDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canSave) return;

    avatarDragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: positionX,
      originY: positionY,
    };
    setIsAvatarDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateAvatarDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = avatarDragStateRef.current;
    if (!dragState) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const dragScale = 240;

    setPositionX(Math.max(-1, Math.min(1, dragState.originX - deltaX / dragScale)));
    setPositionY(Math.max(-1, Math.min(1, dragState.originY - deltaY / dragScale)));
  };

  const endAvatarDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    avatarDragStateRef.current = null;
    setIsAvatarDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release errors when pointer capture is already gone.
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setSourceImageUrl(null);
    setZoom(1);
    setPositionX(0);
    setPositionY(0);
    setMode("upload");
    setError(null);
  };

  if (!isOpen) return null;

  const activeAvatarUrl = croppedPreviewUrl || currentAvatarUrl || null;
  const canSave = Boolean(sourceImageUrl || previewUrl);
  const zoomPercent = Math.round((zoom - 1) * 100);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700/80 dark:bg-zinc-900 sm:rounded-3xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-white sm:text-xl">
              Change Avatar
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              Upload, capture and customize your new profile picture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-60 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">

          {/* ── Avatar Preview + Vertical Zoom ── */}
          <div className="relative mx-auto w-fit">
            {/* Fixed-size avatar container — centered by mx-auto, not influenced by the absolute slider */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-emerald-200 dark:border-emerald-800/60" />
                <div
                  role="img"
                  aria-label={activeAvatarUrl ? "Avatar crop preview" : "No avatar selected"}
                  title={activeAvatarUrl ? "Drag to reposition" : "No avatar selected"}
                  className={`relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-lg ring-1 ring-zinc-200/60 dark:border-zinc-800 dark:bg-emerald-950/40 dark:ring-zinc-700/40 sm:h-44 sm:w-44 ${
                    canSave ? "cursor-grab active:cursor-grabbing" : ""
                  }`}
                  onPointerDown={beginAvatarDrag}
                  onPointerMove={updateAvatarDrag}
                  onPointerUp={endAvatarDrag}
                  onPointerCancel={endAvatarDrag}
                  style={{ touchAction: "none" }}
                >
                  {activeAvatarUrl ? (
                    <img
                      src={activeAvatarUrl}
                      alt="Avatar preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-900">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-emerald-50 sm:h-16 sm:w-16">
                        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 stroke-current sm:h-9 sm:w-9" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Drag indicator overlay */}
                  {isAvatarDragging && (
                    <div className="absolute inset-0 rounded-full bg-black/10 dark:bg-black/20" />
                  )}
                </div>
              </div>

              {/* Always reserve space to prevent layout shift */}
              <p className={`mt-2 text-[11px] font-medium ${canSave ? "text-zinc-400 dark:text-zinc-500" : "text-transparent"}`}>
                Drag to reposition
              </p>
            </div>

            {/* Vertical zoom slider — absolutely positioned to the right, outside the flow */}
            <div
              className="absolute top-0 flex flex-col items-center gap-1"
              style={{ left: "calc(100% + 12px)", height: "calc(100% - 24px)" }}
            >
              {/* Zoom in button (top) */}
              <button
                type="button"
                disabled={!canSave || zoom >= 2}
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                aria-label="Zoom in"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>

              {/* Vertical slider track */}
              <div className="flex-1">
                <VerticalZoomSlider
                  value={zoom}
                  min={1}
                  max={2}
                  step={0.01}
                  disabled={!canSave}
                  onChange={setZoom}
                />
              </div>

              {/* Zoom out button (bottom) */}
              <button
                type="button"
                disabled={!canSave || zoom <= 1}
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                aria-label="Zoom out"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Zoom percentage label — fixed width to prevent shifting */}
              <span className="min-w-[38px] rounded-md bg-emerald-50 px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {zoomPercent}%
              </span>
            </div>
          </div>

          {/* ── Quick Action Buttons ── */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMode("camera")}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 stroke-current" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l1.5-2h2l1.5 2h3A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              </svg>
              Camera
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving || !canSave}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 stroke-current" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Reset
            </button>
          </div>

          {/* ── Upload / Camera Area ── */}
          <div className="mt-4">
            {mode === "camera" ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black dark:border-zinc-700">
                  <video ref={videoRef} autoPlay playsInline muted className="h-48 w-full object-cover sm:h-56" />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleCapture()}
                    disabled={isStartingCamera}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 stroke-current" strokeWidth="2">
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                    {isStartingCamera ? "Starting camera..." : "Capture Photo"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={openFilePicker}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async (event) => {
                  event.preventDefault();
                  await handleFileDrop(event.dataTransfer.files);
                }}
                className={`group cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all sm:py-6 ${
                  isDragging
                    ? "border-emerald-400 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/20"
                    : "border-zinc-200 bg-zinc-50/50 hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-zinc-700 dark:bg-zinc-800/30 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleSelectFile(file);
                    event.currentTarget.value = "";
                  }}
                  className="sr-only"
                />

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:group-hover:bg-emerald-900/40">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 16.7V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.3" />
                  </svg>
                </div>

                <p className="mt-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
                  Drag &amp; drop your image here
                </p>
                <p className="mt-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  or click to browse
                </p>
                <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                  PNG, JPG or WEBP • Max size 5MB
                </p>
              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !canSave}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
