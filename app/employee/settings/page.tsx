"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { PasswordChangeRequestCard } from "@/components/shared/password-change-request-card";
import { AvatarPickerModal } from "@/components/shared/avatar-picker-modal";
import { NotificationSoundSettings } from "@/components/shared/notification-sound-settings";
import { DEFAULT_NOTIFICATION_SOUND } from "@/lib/notification-sounds";

export default function EmployeeSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { selectedBranch } = useBranch();
  const [activeTab, setActiveTab] = useState("Profile");
  const [toast, setToast] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notificationSound, setNotificationSound] = useState(DEFAULT_NOTIFICATION_SOUND);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const branchName = selectedBranch?.name || "Bgc Branch";
  const initials = fullName
    ? fullName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "E";

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setNotificationSound(user.notificationSound || DEFAULT_NOTIFICATION_SOUND);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setToast(null);
    try {
      await api.patch("/auth/profile", { fullName, notificationSound });
      await refreshProfile();
      setToast("Profile updated successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  const handleDiscard = () => {
    setFullName(user?.fullName || "");
    setEmail(user?.email || "");
    setNotificationSound(user?.notificationSound || DEFAULT_NOTIFICATION_SOUND);
    setToast(null);
  };

  const handleSaveAvatar = async (avatarDataUrl: string) => {
    if (!user) return;

    setIsSavingAvatar(true);
    setToast(null);

    try {
      await api.patch("/auth/profile", { avatarUrl: avatarDataUrl });
      await refreshProfile();
      setIsAvatarModalOpen(false);
      setToast("Avatar updated successfully!");
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to update avatar");
    } finally {
      setIsSavingAvatar(false);
    }
  };



  return (
    <div className="w-full max-w-none space-y-6 [&_button]:text-sm [&_h3]:text-base [&_h4]:text-xl [&_input]:text-sm [&_label]:text-xs [&_p]:text-sm [&_span]:text-xs">
      {toast && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 px-5 py-3 text-sm font-semibold text-brand-green shadow-xl">
            {toast}
          </div>
        </div>
      )}

      <div className="flex w-full flex-nowrap gap-1 overflow-x-auto rounded-lg border border-border-main bg-surface p-1 sm:w-fit">
        {['Profile', 'Notifications', 'Branch Config'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setToast(null);
            }}
            className={`shrink-0 px-6 py-2 text-xs font-bold transition-all rounded-md whitespace-nowrap ${activeTab === tab
                ? "bg-brand-green text-white shadow-sm"
                : "text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`grid w-full gap-6 ${activeTab === "Profile" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"}`}>
        <div className="min-w-0 space-y-6">
          {activeTab === "Profile" && (
            <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
              <h3 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border-main">My Account Profile</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Full Name</label>
                    <input
                      className="rounded-lg border border-input-border px-3 py-2 text-sm text-text-primary focus:border-brand-green outline-none transition-colors"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Account Role</label>
                    <div className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-text-tertiary capitalize">
                      {user?.role || "Employee"}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Email Address</label>
                  <input
                    className="rounded-lg border border-border-subtle bg-surface-secondary px-3 py-2 text-sm text-zinc-400 outline-none cursor-not-allowed"
                    value={email}
                    readOnly
                    title="Email cannot be changed from this page"
                  />
                  <p className="text-[10px] text-zinc-400 italic">Email updates require administrative verification.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <NotificationSoundSettings
              deferSave
              onSoundChange={setNotificationSound}
            />
          )}

          {activeTab === "Branch Config" && (
            <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
              <h3 className="text-base font-bold text-brand-green mb-4 pb-2 border-b">Current Location: {branchName}</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 gap-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-text-muted tracking-wide">Opening Time</label>
                    <p className="text-sm text-text-primary pt-1">08:00 AM</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-text-muted tracking-wide">Closing Time</label>
                    <p className="text-sm text-text-primary pt-1">06:00 PM</p>
                  </div>
                  <div className="bg-brand-green/5 dark:bg-brand-green/20 p-3 rounded-lg border border-brand-green/10 dark:border-brand-green/40 sm:col-span-2">
                    <p className="text-[10px] font-bold uppercase text-brand-green tracking-wide mb-1 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Security Restriction
                    </p>
                    <p className="text-xs text-text-primary leading-relaxed">
                      Branch associates are restricted to accessing data for their assigned terminal only.
                      Changes to operation hours must be approved by the Super Admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={
                isSaving ||
                (fullName === user?.fullName &&
                  notificationSound ===
                    (user?.notificationSound || DEFAULT_NOTIFICATION_SOUND))
              }
              className="rounded-lg bg-brand-green px-6 py-2 text-xs font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleDiscard}
              className="rounded-lg border border-input-border px-6 py-2 text-xs font-bold text-zinc-600 hover:bg-surface-hover transition-colors"
            >
              Discard
            </button>
          </div>
        </div>

        {activeTab === "Profile" && (
          <div className="min-w-0 space-y-6">
            <div className="rounded-xl border border-border-main bg-surface p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-brand-green/10 bg-white dark:border-brand-green/40 dark:bg-zinc-800">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="Profile avatar"
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-brand-green dark:text-zinc-50">
                    {initials}
                  </div>
                )}
              </div>
              <h4 className="truncate px-2 text-lg font-bold text-text-primary">{fullName || "Employee"}</h4>
              <p className="mb-4 text-xs text-text-secondary">{branchName}</p>
              <button
                onClick={() => setIsAvatarModalOpen(true)}
                className="w-full rounded-lg border border-brand-green/20 bg-brand-green/10 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-green transition-colors hover:bg-brand-green/20 dark:border-brand-green/40 dark:bg-brand-green/20 dark:hover:bg-brand-green/30"
              >
                Change Avatar
              </button>
              <PasswordChangeRequestCard />
            </div>
          </div>
        )}
      </div>

      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        isSaving={isSavingAvatar}
        currentAvatarUrl={user?.avatarUrl}
        onClose={() => {
          if (!isSavingAvatar) {
            setIsAvatarModalOpen(false);
          }
        }}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
