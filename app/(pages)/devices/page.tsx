"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { ActionButton } from "@/components/shared/action-button";
import { ConfirmActionModal } from "@/components/shared/confirm-action-modal";
import { subscribeToDeviceAuthorizationNotifications } from "@/lib/notification-stream";
import { DeleteDeviceModal } from "./_components/delete-device-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentUser {
  id?: string;
  full_name?: string;
  email?: string;
  role?: string;
  last_login?: string;
}

interface Device {
  id: string;
  deviceName: string;
  device_name: string;
  deviceType: string;
  device_type: string;
  deviceFingerprint: string;
  device_fingerprint: string;
  ipAddress: string | null;
  ip_address: string | null;
  status: "AUTHORIZED" | "PENDING" | "BLOCKED";
  lastLogin: string | null;
  last_login: string | null;
  createdAt: string;
  created_at: string;
  employee: { id: string; full_name: string; email: string; role: string; branch_id?: string | null } | null;
  branch: { id: string; name: string } | null;
  recent_users?: RecentUser[];
}

interface Employee {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  role: string;
  branchId?: string;
  branch_id?: string;
  branchName?: string;
  branch_name?: string;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AUTHORIZED: "bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green",
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    BLOCKED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-badge-muted-bg text-badge-muted-text"}`}>
      {status}
    </span>
  );
}

const fieldClassName =
  "w-full rounded border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-green";
const labelClassName = "mb-1 block text-xs font-bold text-text-secondary";

function getDeviceBranchId(device: Device) {
  if (device.employee?.role === "super_admin") return "__all__";
  return device.branch?.id ?? device.employee?.branch_id ?? null;
}

function getDeviceBranchName(device: Device) {
  if (device.employee?.role === "super_admin") return "All Branches";
  return device.branch?.name ?? null;
}

// ── Add Device Modal (Super Admin manually registers a device) ────────────────

function AddDeviceModal({
  employees,
  onClose,
  onSuccess,
}: {
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("DESKTOP");
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceFingerprint.trim()) {
      toast.error("Device fingerprint is required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/devices/authorize", {
        employeeId,
        deviceFingerprint: deviceFingerprint.trim(),
        deviceName: deviceName.trim(),
        deviceType,
        ...(ipAddress.trim() ? { ipAddress: ipAddress.trim() } : {}),
      });
      toast.success("Device added and authorized successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add device");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border-main bg-surface text-text-primary shadow-2xl dark:shadow-black/50" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Add Authorized Device</h2>
            <p className="mt-0.5 text-xs text-text-tertiary">Manually register a device for an employee</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-surface-hover hover:text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* How to get fingerprint tip */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="font-bold">How to get the Device Fingerprint:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Have the employee try to log in from that device</li>
              <li>They will see the &quot;Unauthorized Device&quot; screen showing the Device ID</li>
              <li>Copy that Device ID and paste it here</li>
            </ol>
          </div>

          <div>
            <label className={labelClassName}>
              DEVICE FINGERPRINT / ID <span className="text-red-500">*</span>
            </label>
            <input
              value={deviceFingerprint}
              onChange={(e) => setDeviceFingerprint(e.target.value)}
              required
              placeholder="Paste the device fingerprint here..."
              className={`${fieldClassName} font-mono`}
            />
          </div>

          <div>
            <label className={labelClassName}>
              ASSIGN EMPLOYEE <span className="text-red-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className={fieldClassName}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName ?? emp.full_name ?? emp.email} — {emp.role}
                  {(emp.branchName ?? emp.branch_name) ? ` (${emp.branchName ?? emp.branch_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClassName}>
                DEVICE NICKNAME <span className="text-red-500">*</span>
              </label>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                placeholder="e.g. QC_COUNTER_1"
                className={fieldClassName}
              />
            </div>

            <div>
              <label className={labelClassName}>DEVICE TYPE</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className={fieldClassName}
              >
                {["DESKTOP", "LAPTOP", "TABLET", "MANAGER_PC", "COUNTER_PC"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClassName}>IP ADDRESS <span className="font-normal text-text-tertiary">(optional)</span></label>
            <input
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g. 192.168.1.10"
              className={`${fieldClassName} font-mono`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border-main py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-hover">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded bg-brand-green py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
              {saving ? "Adding..." : "Add & Authorize Device"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Authorize existing PENDING device modal ───────────────────────────────────

function AuthorizeModal({
  device,
  employees,
  onClose,
  onSuccess,
}: {
  device: Device;
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [employeeId, setEmployeeId] = useState(device.employee?.id ?? "");
  const [deviceName, setDeviceName] = useState(device.device_name ?? device.deviceName ?? "");
  const [deviceType, setDeviceType] = useState(device.device_type ?? device.deviceType ?? "DESKTOP");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/devices/authorize", {
        employeeId,
        deviceFingerprint: device.device_fingerprint ?? device.deviceFingerprint,
        deviceName,
        deviceType,
      });
      toast.success("Device authorized successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to authorize device");
    } finally {
      setSaving(false);
    }
  };

  const fp = device.device_fingerprint ?? device.deviceFingerprint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border-main bg-surface text-text-primary shadow-2xl dark:shadow-black/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Authorize Device</h2>
            <p className="mt-0.5 break-all font-mono text-[10px] text-text-tertiary">{fp}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-tertiary hover:bg-surface-hover hover:text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className={labelClassName}>ASSIGN EMPLOYEE</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className={fieldClassName}
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName ?? emp.full_name ?? emp.email} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>DEVICE NICKNAME</label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
              placeholder="e.g. QC_COUNTER_1"
              className={fieldClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>DEVICE TYPE</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className={fieldClassName}
            >
              {["DESKTOP", "LAPTOP", "TABLET", "MANAGER_PC", "COUNTER_PC"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border-main py-2 text-sm font-semibold text-text-secondary hover:bg-surface-hover">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded bg-brand-green py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50">
              {saving ? "Saving..." : "Authorize"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DevicesPage() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [authorizeTarget, setAuthorizeTarget] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [blockTarget, setBlockTarget] = useState<Device | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devData, empData] = await Promise.all([
        api.get<Device[]>("/devices"),
        isSuperAdmin ? api.get<Employee[]>("/users") : Promise.resolve([]),
      ]);
      setDevices(devData);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch {
      toast.error("Failed to load devices");
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { load(); }, [load]);

  // Subscribe to real-time device authorization notifications
  useEffect(() => {
    if (!isSuperAdmin) return;
    
    const unsubscribe = subscribeToDeviceAuthorizationNotifications(() => {
      void load();
    });

    return () => {
      unsubscribe();
    };
  }, [isSuperAdmin, load]);

  const handleBlock = async (id: string) => {
    try {
      await api.patch(`/devices/${id}/block`, {});
      toast.success("Device blocked");
      load();
    } catch {
      toast.error("Failed to block device");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/devices/${id}`);
      toast.success("Device removed");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to remove device");
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await api.patch(`/devices/${id}`, { status: "AUTHORIZED" });
      toast.success("Device unblocked");
      load();
    } catch {
      toast.error("Failed to unblock device");
    }
  };

  const branchScopedDevices = useMemo(() => {
    if (isAllBranches) return devices;
    return devices.filter((device) => getDeviceBranchId(device) === selectedBranch.id);
  }, [devices, isAllBranches, selectedBranch.id]);

  const filtered = branchScopedDevices.filter((d) => {
    const name = (d.device_name ?? d.deviceName ?? "").toLowerCase();
    const fp = (d.device_fingerprint ?? d.deviceFingerprint ?? "").toLowerCase();
    const empName = (d.employee?.full_name ?? "").toLowerCase();
    const branchName = (getDeviceBranchName(d) ?? "").toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      fp.includes(search.toLowerCase()) ||
      empName.includes(search.toLowerCase()) ||
      branchName.includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    // Priority 1: PENDING status always on top
    if (a.status === "PENDING" && b.status !== "PENDING") return -1;
    if (b.status === "PENDING" && a.status !== "PENDING") return 1;
    
    // Priority 2: Branch name (if showing all branches)
    if (isAllBranches) {
      const branchA = getDeviceBranchName(a) ?? "";
      const branchB = getDeviceBranchName(b) ?? "";
      const branchComparison = branchA.localeCompare(branchB);
      if (branchComparison !== 0) return branchComparison;
    }
    
    // Priority 3: Most recent created_at
    return new Date(b.created_at ?? b.createdAt).getTime() - new Date(a.created_at ?? a.createdAt).getTime();
  });

  const counts = {
    ALL: branchScopedDevices.length,
    AUTHORIZED: branchScopedDevices.filter((d) => d.status === "AUTHORIZED").length,
    PENDING: branchScopedDevices.filter((d) => d.status === "PENDING").length,
    BLOCKED: branchScopedDevices.filter((d) => d.status === "BLOCKED").length,
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4 text-text-primary sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Device Management</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Manage authorized devices for {isAllBranches ? "all branches" : selectedBranch.name}
          </p>
        </div>
        {isSuperAdmin && (
          <ActionButton
            variant="success"
            onClick={() => setShowAddModal(true)}
            size="md"
            fullWidth
            className="w-full shrink-0 sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Device
          </ActionButton>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-1 md:min-w-0">
            <div className="min-w-0 md:flex-1">
              <input
                type="text"
                placeholder="Search by name, fingerprint, or employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-input-border bg-input-bg px-4 py-2 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-green"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand-green md:w-auto lg:hidden"
            >
              {(["ALL", "AUTHORIZED", "PENDING", "BLOCKED"] as const).map((s) => (
                <option key={s} value={s}>
                  {s} ({counts[s]})
                </option>
              ))}
            </select>
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex">
            {(["ALL", "AUTHORIZED", "PENDING", "BLOCKED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-brand-green text-white shadow-sm shadow-brand-green/20"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state with guidance */}
      {!isLoading && devices.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-main bg-surface py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-text-tertiary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-bold text-text-secondary">No devices registered yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-text-tertiary">
            Add a device manually using the <strong>Add Device</strong> button, or have an employee log in from their device and click &quot;Request Authorization&quot;.
          </p>
          {isSuperAdmin && (
            <ActionButton
              variant="success"
              onClick={() => setShowAddModal(true)}
              size="md"
              className="mt-5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Device
            </ActionButton>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-text-tertiary">Loading devices...</div>
      ) : filtered.length === 0 && branchScopedDevices.length > 0 ? (
        <div className="py-12 text-center text-sm text-text-tertiary">No devices match your search</div>
      ) : filtered.length === 0 && devices.length > 0 ? (
        <div className="py-12 text-center text-sm text-text-tertiary">No devices found for {selectedBranch.name}</div>
      ) : filtered.length > 0 ? (
        <>
          <div className="space-y-3 lg:hidden">
            {filtered.map((device) => {
              const name = device.device_name ?? device.deviceName;
              const type = device.device_type ?? device.deviceType;
              const fp = device.device_fingerprint ?? device.deviceFingerprint;
              const ip = device.ip_address ?? device.ipAddress;
              const lastLogin = device.last_login ?? device.lastLogin;
              const createdAt = device.created_at ?? device.createdAt;

              return (
                <div key={device.id} className="overflow-hidden rounded-2xl border border-border-main bg-surface p-4 shadow-sm">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-text-primary">{name}</div>
                        <div className="text-xs text-text-tertiary">{type}</div>
                      </div>
                      <StatusBadge status={device.status} />
                    </div>

                    <div className="grid gap-3 text-xs text-text-tertiary">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-secondary">Fingerprint</p>
                        <p className="mt-0.5 break-all font-mono text-[11px] leading-5 text-text-tertiary">
                          {fp ? `${fp.slice(0, 18)}…` : "—"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-secondary">Registered To</p>
                        <p className="mt-0.5 font-medium text-text-secondary">{device.employee?.full_name ?? "—"}</p>
                        {device.employee?.email && (
                          <p className="mt-0.5 break-all text-[11px] leading-5 text-text-tertiary">
                            {device.employee.email}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-secondary">Branch</p>
                        <p className="mt-0.5 text-text-tertiary">{getDeviceBranchName(device) ?? "—"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-secondary">Last login</p>
                        <p className="mt-0.5 break-words text-text-tertiary">
                          {lastLogin ? new Date(lastLogin).toLocaleString() : "Never"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-text-secondary">IP</p>
                        <p className="mt-0.5 break-all font-mono text-text-tertiary">{ip ?? "—"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
                      {device.status === "PENDING" && (
                        <button
                          onClick={() => setAuthorizeTarget(device)}
                          className="w-full rounded bg-brand-green/10 px-3 py-2 text-xs font-semibold text-brand-green hover:bg-brand-green/20 min-[420px]:w-auto min-[420px]:py-1"
                        >
                          Authorize
                        </button>
                      )}
                      {device.status === "AUTHORIZED" && (
                        <button
                          onClick={() => setBlockTarget(device)}
                          className="w-full rounded bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200 min-[420px]:w-auto min-[420px]:py-1"
                        >
                          Block
                        </button>
                      )}
                      {device.status === "BLOCKED" && (
                        <button
                          onClick={() => handleUnblock(device.id)}
                          className="w-full rounded bg-brand-green/10 px-3 py-2 text-xs font-semibold text-brand-green hover:bg-brand-green/20 min-[420px]:w-auto min-[420px]:py-1"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(device)}
                        className="w-full rounded bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-hover min-[420px]:w-auto min-[420px]:py-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:block overflow-hidden rounded-xl border border-border-main bg-surface shadow-lg shadow-black/10 dark:shadow-black/30">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-secondary">
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Fingerprint</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Registered To</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Recent Users</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Last Login</th>
                    {isSuperAdmin && (
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase text-text-tertiary">Actions</th>
                    )}
                  </tr>
                </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((device) => {
                  const name = device.device_name ?? device.deviceName;
                  const type = device.device_type ?? device.deviceType;
                  const fp = device.device_fingerprint ?? device.deviceFingerprint;
                  const ip = device.ip_address ?? device.ipAddress;
                  const lastLogin = device.last_login ?? device.lastLogin;
                  const createdAt = device.created_at ?? device.createdAt;

                  return (
                    <tr key={device.id} className="transition-colors hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary">{name}</div>
                        <div className="text-xs text-text-tertiary">{type}</div>
                        <div className="text-[10px] text-text-muted">{new Date(createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-tertiary">{fp?.slice(0, 16)}…</span>
                      </td>
                      {/* Registered owner */}
                      <td className="px-4 py-3">
                        {device.employee ? (
                          <>
                            <div className="font-medium text-text-secondary">{device.employee.full_name}</div>
                            <div className="text-xs text-text-tertiary">{device.employee.email}</div>
                            <div className="text-xs text-text-tertiary capitalize">{device.employee.role}</div>
                          </>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </td>
                      {/* Recent users who logged in from this device */}
                      <td className="px-4 py-3">
                        {device.recent_users && device.recent_users.length > 0 ? (
                          <div className="space-y-1.5">
                            {device.recent_users.map((u, i) => (
                              <div key={u.id ?? i} className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-[9px] font-bold text-brand-green dark:bg-brand-green/20">
                                  {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs font-medium leading-tight text-text-secondary">{u.full_name ?? u.email}</div>
                                  <div className="text-[10px] text-text-tertiary capitalize">{u.role}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">No logins yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {getDeviceBranchName(device) ?? <span className="text-text-tertiary">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-tertiary">{ip ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary">
                        {lastLogin ? new Date(lastLogin).toLocaleString() : "Never"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {device.status === "PENDING" && (
                              <button
                                onClick={() => setAuthorizeTarget(device)}
                                className="rounded bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green hover:bg-brand-green/20 dark:bg-brand-green/20 dark:hover:bg-brand-green/30"
                              >
                                Authorize
                              </button>
                            )}
                            {device.status === "AUTHORIZED" && (
                              <button
                                onClick={() => setBlockTarget(device)}
                                className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
                              >
                                Block
                              </button>
                            )}
                            {device.status === "BLOCKED" && (
                              <button
                                onClick={() => handleUnblock(device.id)}
                                className="rounded bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green hover:bg-brand-green/20 dark:bg-brand-green/20 dark:hover:bg-brand-green/30"
                              >
                                Unblock
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteTarget(device)}
                              className="rounded bg-surface-secondary px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-surface-hover"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </> ) : null}

      {/* Modals */}
      {showAddModal && (
        <AddDeviceModal
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSuccess={load}
        />
      )}

      {authorizeTarget && (
        <AuthorizeModal
          device={authorizeTarget}
          employees={employees}
          onClose={() => setAuthorizeTarget(null)}
          onSuccess={load}
        />
      )}

      {deleteTarget && (
        <DeleteDeviceModal
          isOpen={true}
          deviceName={deleteTarget.device_name ?? deleteTarget.deviceName}
          employeeName={deleteTarget.employee?.full_name ?? null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await handleDelete(deleteTarget.id);
          }}
        />
      )}

      <ConfirmActionModal
        isOpen={blockTarget !== null}
        title="Block this device?"
        message="It will be immediately denied login access."
        confirmLabel="Block Device"
        variant="warning"
        onClose={() => setBlockTarget(null)}
        onConfirm={async () => {
          if (!blockTarget) return;
          await handleBlock(blockTarget.id);
        }}
      />
    </div>
  );
}
