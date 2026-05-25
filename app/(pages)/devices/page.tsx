"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  employee: { id: string; full_name: string; email: string; role: string } | null;
  branch: { id: string; name: string } | null;
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
    AUTHORIZED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    BLOCKED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Add Authorized Device</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Manually register a device for an employee</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* How to get fingerprint tip */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <p className="font-bold">How to get the Device Fingerprint:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              <li>Have the employee try to log in from that device</li>
              <li>They will see the &quot;Unauthorized Device&quot; screen showing the Device ID</li>
              <li>Copy that Device ID and paste it here</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1">
              DEVICE FINGERPRINT / ID <span className="text-red-500">*</span>
            </label>
            <input
              value={deviceFingerprint}
              onChange={(e) => setDeviceFingerprint(e.target.value)}
              required
              placeholder="Paste the device fingerprint here..."
              className="w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1">
              ASSIGN EMPLOYEE <span className="text-red-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
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
              <label className="block text-xs font-bold text-zinc-600 mb-1">
                DEVICE NICKNAME <span className="text-red-500">*</span>
              </label>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
                placeholder="e.g. QC_COUNTER_1"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 mb-1">DEVICE TYPE</label>
              <select
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
              >
                {["DESKTOP", "LAPTOP", "TABLET", "MANAGER_PC", "COUNTER_PC"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1">IP ADDRESS <span className="text-zinc-400 font-normal">(optional)</span></label>
            <input
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g. 192.168.1.10"
              className="w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
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
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Authorize Device</h2>
            <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-400">{fp}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1">ASSIGN EMPLOYEE</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
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
            <label className="block text-xs font-bold text-zinc-600 mb-1">DEVICE NICKNAME</label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required
              placeholder="e.g. QC_COUNTER_1"
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-600 mb-1">DEVICE TYPE</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500"
            >
              {["DESKTOP", "LAPTOP", "TABLET", "MANAGER_PC", "COUNTER_PC"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-zinc-300 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded bg-emerald-700 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [authorizeTarget, setAuthorizeTarget] = useState<Device | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  const handleBlock = async (id: string) => {
    if (!confirm("Block this device? It will be immediately denied login access.")) return;
    try {
      await api.patch(`/devices/${id}/block`, {});
      toast.success("Device blocked");
      load();
    } catch {
      toast.error("Failed to block device");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this device permanently?")) return;
    try {
      await api.delete(`/devices/${id}`);
      toast.success("Device removed");
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

  const filtered = devices.filter((d) => {
    const name = (d.device_name ?? d.deviceName ?? "").toLowerCase();
    const fp = (d.device_fingerprint ?? d.deviceFingerprint ?? "").toLowerCase();
    const empName = (d.employee?.full_name ?? "").toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      fp.includes(search.toLowerCase()) ||
      empName.includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: devices.length,
    AUTHORIZED: devices.filter((d) => d.status === "AUTHORIZED").length,
    PENDING: devices.filter((d) => d.status === "PENDING").length,
    BLOCKED: devices.filter((d) => d.status === "BLOCKED").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Device Management</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage authorized devices for branch employees
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Device
          </button>
        )}
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "AUTHORIZED", "PENDING", "BLOCKED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-emerald-700 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, fingerprint, or employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {/* Empty state with guidance */}
      {!isLoading && devices.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7 text-zinc-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" />
            </svg>
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-700">No devices registered yet</h3>
          <p className="mt-2 text-xs text-zinc-500 max-w-sm mx-auto">
            Add a device manually using the <strong>Add Device</strong> button, or have an employee log in from their device and click &quot;Request Authorization&quot;.
          </p>
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Device
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Loading devices...</div>
      ) : filtered.length === 0 && devices.length > 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No devices match your search</div>
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Device</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Fingerprint</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Last Login</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((device) => {
                  const name = device.device_name ?? device.deviceName;
                  const type = device.device_type ?? device.deviceType;
                  const fp = device.device_fingerprint ?? device.deviceFingerprint;
                  const ip = device.ip_address ?? device.ipAddress;
                  const lastLogin = device.last_login ?? device.lastLogin;
                  const createdAt = device.created_at ?? device.createdAt;

                  return (
                    <tr key={device.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900">{name}</div>
                        <div className="text-xs text-zinc-400">{type}</div>
                        <div className="text-[10px] text-zinc-400">{new Date(createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-zinc-500">{fp?.slice(0, 16)}…</span>
                      </td>
                      <td className="px-4 py-3">
                        {device.employee ? (
                          <>
                            <div className="font-medium text-zinc-800">{device.employee.full_name}</div>
                            <div className="text-xs text-zinc-400">{device.employee.email}</div>
                            <div className="text-xs text-zinc-400 capitalize">{device.employee.role}</div>
                          </>
                        ) : (
                          <span className="text-zinc-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {device.branch?.name ?? <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 font-mono">{ip ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {lastLogin ? new Date(lastLogin).toLocaleString() : "Never"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {device.status === "PENDING" && (
                              <button
                                onClick={() => setAuthorizeTarget(device)}
                                className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                              >
                                Authorize
                              </button>
                            )}
                            {device.status === "AUTHORIZED" && (
                              <button
                                onClick={() => handleBlock(device.id)}
                                className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                              >
                                Block
                              </button>
                            )}
                            {device.status === "BLOCKED" && (
                              <button
                                onClick={() => handleUnblock(device.id)}
                                className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                              >
                                Unblock
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="rounded bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
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
      ) : null}

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
    </div>
  );
}
