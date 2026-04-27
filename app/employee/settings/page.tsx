"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/theme-context";
import { PasswordChangeRequestCard } from "@/components/shared/password-change-request-card";
import { AvatarPickerModal } from "@/components/shared/avatar-picker-modal";

export default function EmployeeSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { selectedBranch } = useBranch();
  const [activeTab, setActiveTab] = useState("Profile");
  const [toast, setToast] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<any[]>([]);
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null);
  const { theme, toggleTheme, isDark } = useTheme();

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
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setToast(null);
    try {
      await api.patch("/auth/profile", { fullName });
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
    <div className="space-y-6">
      {toast && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl">
            {toast}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary leading-tight">Settings</h1>
      </div>

      <div className="flex gap-1 rounded-lg border border-border-main bg-surface p-1 max-w-fit overflow-hidden">
        {["Profile", "Appearance", "Branch Config"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setToast(null);
            }}
            className={`px-6 py-2 text-xs font-bold transition-all rounded-md ${activeTab === tab
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {activeTab === "Profile" && (
            <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
              <h3 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border-main">My Account Profile</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-wide">Full Name</label>
                    <input
                      className="rounded-lg border border-input-border px-3 py-2 text-sm text-text-primary focus:border-emerald-500 outline-none transition-colors"
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

          {activeTab === "Appearance" && (
            <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
              <h3 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border-main">Theme Preferences</h3>
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">Choose how the application looks for you.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { if (isDark) toggleTheme(); }}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                      !isDark
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                        : "border-border-main bg-surface hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                      <span className="text-sm font-bold text-text-primary">Light</span>
                    </div>
                  </button>
                  <button
                    onClick={() => { if (!isDark) toggleTheme(); }}
                    className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
                      isDark
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
                        : "border-border-main bg-surface hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <span className="text-sm font-bold text-text-primary">Dark</span>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-text-muted">Current theme: <span className="font-bold capitalize">{theme}</span></p>
              </div>
            </div>
          )}

          {activeTab === "Branch Config" && (
            <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
              <h3 className="text-base font-bold text-emerald-800 mb-4 pb-2 border-b">Current Location: {branchName}</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-text-muted tracking-wide">Opening Time</label>
                    <p className="text-sm text-text-primary pt-1">08:00 AM</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-text-muted tracking-wide">Closing Time</label>
                    <p className="text-sm text-text-primary pt-1">06:00 PM</p>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 col-span-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wide mb-1 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                      Security Restriction
                    </p>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
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
              disabled={isSaving || fullName === user?.fullName}
              className="rounded-lg bg-emerald-700 px-6 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="space-y-6">
          <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-emerald-50 bg-emerald-800">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <h4 className="text-lg font-bold text-text-primary truncate px-2">{fullName || "Employee"}</h4>
            <p className="text-xs text-text-tertiary mb-4">{branchName}</p>
            <button
              onClick={() => setIsAvatarModalOpen(true)}
              className="w-full rounded-lg border border-emerald-100 bg-emerald-50 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              Change Avatar
            </button>
            <PasswordChangeRequestCard />
          </div>
        </div>
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
