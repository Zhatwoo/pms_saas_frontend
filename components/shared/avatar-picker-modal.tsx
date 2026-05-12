"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

    let cancelled = false;

    async function generatePreview() {
      try {
        const preview = await cropImageWithMath(
          sourceImageUrl,
          zoom,
          positionX,
          positionY,
          144, // Preview size: h-36 w-36 = 144px
          0.85, // Slightly higher quality for preview
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

  if (!isOpen) return null;

  const activeAvatarUrl = croppedPreviewUrl || currentAvatarUrl || null;
  const canSave = Boolean(sourceImageUrl || previewUrl);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-5 sm:px-7">
          <div>
            <h3 className="text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-white">
              Change Avatar
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Upload, capture and customize your new profile picture.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        <div className="border-t border-zinc-200 px-5 py-5 dark:border-zinc-800 sm:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div
                role="img"
                aria-label={activeAvatarUrl ? "Avatar crop preview" : "No avatar selected"}
                title={activeAvatarUrl ? "Drag to adjust avatar" : "No avatar selected"}
                className={`relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-8 border-emerald-50 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-950/40 dark:bg-emerald-950/40 dark:text-emerald-300 ${
                  canSave ? "cursor-grab active:cursor-grabbing" : ""
                }`}
                onPointerDown={beginAvatarDrag}
                onPointerMove={updateAvatarDrag}
                onPointerUp={endAvatarDrag}
                onPointerCancel={endAvatarDrag}
                style={{ touchAction: "none" }}
              >
                {activeAvatarUrl ? (
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <img
                      src={activeAvatarUrl}
                      alt="Avatar preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-emerald-50">
                      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 stroke-current" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <button
              type="button"
              onClick={() => setMode("camera")}
              disabled={isSaving}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l1.5-2h2l1.5 2h3A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              </svg>
              Take Photo
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-200 px-5 py-5 dark:border-zinc-800 sm:px-6">
          {mode === "camera" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[22px] border-2 border-dashed border-emerald-300 bg-zinc-50 p-3 dark:border-emerald-900/70 dark:bg-zinc-950/30">
                <div className="overflow-hidden rounded-[20px] border border-zinc-200 bg-black dark:border-zinc-700">
                  <video ref={videoRef} autoPlay playsInline muted className="h-60 w-full object-cover" />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => void handleCapture()}
                  disabled={isStartingCamera}
                  className="rounded-full bg-emerald-600 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
              className={`cursor-pointer rounded-[24px] border-2 border-dashed px-5 py-8 text-center transition-colors ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20"
                  : "border-emerald-200 bg-white hover:bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-zinc-900 dark:hover:bg-emerald-950/10"
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

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-12 w-12 stroke-current" strokeWidth="1.9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m7.5 8.5 4.5-4.5 4.5 4.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 13.5A4.5 4.5 0 0 1 9 9h6a4.5 4.5 0 0 1 0 9H9a4.5 4.5 0 0 1-4.5-4.5Z" />
                </svg>
              </div>

              <h4 className="mt-4 text-xl font-extrabold text-zinc-900 dark:text-white">
                Drag &amp; drop your image here
              </h4>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                or click to browse
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                PNG, JPG or WEBP • Max size 5MB
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </p>
          )}
        </div>

        <div className="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                Drag the avatar above to adjust placement. Use zoom to change the crop size.
              </p>

              <div className="flex items-center gap-4">
                <label htmlFor="avatar-zoom" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Zoom
                </label>
                <input
                  id="avatar-zoom"
                  type="range"
                  min="1"
                  max="2"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  disabled={!canSave}
                  className="w-full max-w-md accent-emerald-600 disabled:opacity-50"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setSourceImageUrl(null);
                  setZoom(1);
                  setPositionX(0);
                  setPositionY(0);
                  setMode("upload");
                  setError(null);
                }}
                disabled={isSaving || !canSave}
                className="w-fit text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Reset current avatar
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !canSave}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Avatar"}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
