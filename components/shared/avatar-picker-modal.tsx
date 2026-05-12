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

async function normalizeToAvatarDataUrl(sourceDataUrl: string): Promise<string> {
  const image = await loadImage(sourceDataUrl);

  const cropSize = Math.min(image.width, image.height);
  const sx = (image.width - cropSize) / 2;
  const sy = (image.height - cropSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MAX_OUTPUT_SIZE;
  canvas.height = MAX_OUTPUT_SIZE;

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
    MAX_OUTPUT_SIZE,
    MAX_OUTPUT_SIZE,
  );

  return canvas.toDataURL("image/jpeg", 0.82);
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
  const [error, setError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
      setIsViewerOpen(false);
      return;
    }

    setPreviewUrl(null);
    setError(null);
    setMode("upload");
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

  const handleSelectFile = async (file: File | null) => {
    if (!file) return;
    setError(null);

    try {
      const dataUrl = await fileToDataUrl(file);
      const normalized = await normalizeToAvatarDataUrl(dataUrl);
      setPreviewUrl(normalized);
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
      setPreviewUrl(capturedDataUrl);
      setMode("upload");
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Failed to capture image.",
      );
    }
  };

  const handleSave = async () => {
    if (!previewUrl) {
      setError("Please select or capture a photo first.");
      return;
    }

    setError(null);
    await onSave(previewUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Change Avatar</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            disabled={isSaving}
          >
            Close
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              mode === "upload"
                ? "bg-emerald-700 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Upload Photo
          </button>
          <button
            type="button"
            onClick={() => setMode("camera")}
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
              mode === "camera"
                ? "bg-emerald-700 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            Take Photo
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
          {mode === "upload" ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void handleSelectFile(file);
                  event.currentTarget.value = "";
                }}
                className="block w-full text-xs text-zinc-700 file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-700 hover:file:bg-zinc-100 dark:text-zinc-300 dark:file:border-zinc-600 dark:file:bg-zinc-700 dark:file:text-zinc-300 dark:hover:file:bg-zinc-600"
              />
              {!previewUrl && currentAvatarUrl && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Current avatar is shown below.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-zinc-300 bg-black dark:border-zinc-600">
                <video ref={videoRef} autoPlay playsInline muted className="h-56 w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => void handleCapture()}
                disabled={isStartingCamera}
                className="mx-auto block rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingCamera ? "Starting camera..." : "Capture"}
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (displayImage) {
                  setIsViewerOpen(true);
                }
              }}
              disabled={!displayImage}
              className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200 shadow-sm disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-700"
              title={displayImage ? "View avatar" : "No image to view"}
            >
              {hasPreview || currentAvatarUrl ? (
                <img
                  src={previewUrl || currentAvatarUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  No image
                </div>
              )}
            </button>
            <div className="flex flex-col items-center space-y-2 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Recommended: square photo, face centered.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (displayImage) {
                    setIsViewerOpen(true);
                  }
                }}
                disabled={!displayImage}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                View Avatar
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !previewUrl}
            className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Avatar"}
          </button>
        </div>
      </div>

      {isViewerOpen && displayImage && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-4">
          <div className="relative w-full max-w-2xl rounded-xl border border-zinc-700 bg-zinc-900 p-3">
            <button
              type="button"
              onClick={() => setIsViewerOpen(false)}
              className="absolute right-3 top-3 rounded-md border border-zinc-500 bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-100 hover:bg-zinc-700"
            >
              Close
            </button>
            <div className="flex items-center justify-center pt-8">
              <img
                src={displayImage}
                alt="Avatar full preview"
                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
