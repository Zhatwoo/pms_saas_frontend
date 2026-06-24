export const DEFAULT_NOTIFICATION_SOUND = "sound8.mp3";

export const NOTIFICATION_SOUNDS = [
  { id: "sound1.mp3", label: "Sound 1" },
  { id: "sound2.mp3", label: "Sound 2" },
  { id: "sound3.mp3", label: "Sound 3" },
  { id: "sound4.mp3", label: "Sound 4" },
  { id: "sound5.mp3", label: "Sound 5" },
  { id: "sound6.mp3", label: "Sound 6" },
  { id: "sound7.mp3", label: "Sound 7" },
  { id: "sound8.mp3", label: "Sound 8" },
] as const;

export type NotificationSoundId = (typeof NOTIFICATION_SOUNDS)[number]["id"];

export function resolveNotificationSoundPath(sound?: string | null) {
  const matched = NOTIFICATION_SOUNDS.find((item) => item.id === sound);
  return `/sounds/${matched?.id ?? DEFAULT_NOTIFICATION_SOUND}`;
}
