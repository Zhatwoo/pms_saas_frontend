"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  DEFAULT_NOTIFICATION_SOUND,
  NOTIFICATION_SOUNDS,
  resolveNotificationSoundPath,
} from "@/lib/notification-sounds";
import { useAuth } from "@/contexts/auth-context";

type NotificationSoundSettingsProps = {
  deferSave?: boolean;
  onSoundChange?: (sound: string) => void;
};

export function NotificationSoundSettings({
  deferSave = false,
  onSoundChange,
}: NotificationSoundSettingsProps) {
  const { user, refreshProfile } = useAuth();
  const [selectedSound, setSelectedSound] = useState(
    user?.notificationSound ?? DEFAULT_NOTIFICATION_SOUND,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSound(user?.notificationSound ?? DEFAULT_NOTIFICATION_SOUND);
  }, [user?.notificationSound]);

  const playPreview = async (sound = selectedSound) => {
    try {
      const audio = new Audio(resolveNotificationSoundPath(sound));
      audio.volume = 0.6;
      await audio.play();
    } catch (error) {
      console.warn("Notification sound preview failed:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      await api.patch("/auth/profile", { notificationSound: selectedSound });
      await refreshProfile();
      setStatus("Notification sound saved.");
      window.setTimeout(() => setStatus(null), 2500);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Failed to save notification sound.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    selectedSound !== (user?.notificationSound ?? DEFAULT_NOTIFICATION_SOUND);

  return (
    <section className="w-full rounded-xl border border-border-main bg-surface p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-text-primary">
            Notification Sound
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Choose the sound this account uses for new realtime notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void playPreview()}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border-main px-3 py-2 text-xs font-bold text-text-primary transition hover:bg-surface-hover"
        >
          <Volume2 className="h-4 w-4" />
          Preview
        </button>
      </div>

      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
        {NOTIFICATION_SOUNDS.map((sound) => {
          const isSelected = selectedSound === sound.id;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => {
                setSelectedSound(sound.id);
                onSoundChange?.(sound.id);
                void playPreview(sound.id);
              }}
              className={`min-w-0 rounded-lg border px-3 py-3 text-left text-sm transition ${
                isSelected
                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                  : "border-border-main bg-surface-subtle text-text-secondary hover:border-emerald-500/60 hover:text-text-primary"
              }`}
            >
              <span className="block truncate font-bold">{sound.label}</span>
              <span className="mt-1 block truncate text-xs opacity-75">{sound.id}</span>
            </button>
          );
        })}
      </div>

      {!deferSave ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Sound"}
          </button>
          {status ? (
            <span className="text-xs font-medium text-emerald-400">{status}</span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
