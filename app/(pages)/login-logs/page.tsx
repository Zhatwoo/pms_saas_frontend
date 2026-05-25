"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface LoginLog {
  id: string;
  deviceFingerprint: string | null;
  device_fingerprint: string | null;
  ipAddress: string | null;
  ip_address: string | null;
  loginStatus: string;
  login_status: string;
  failureReason: string | null;
  failure_reason: string | null;
  createdAt: string;
  created_at: string;
  employee: { id: string; full_name: string; email: string; role: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-red-100 text-red-800",
    BLOCKED: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
}

const REASON_LABELS: Record<string, string> = {
  INVALID_CREDENTIALS: "Invalid credentials",
  UNKNOWN_DEVICE: "Unauthorized device",
  DEVICE_BLOCKED: "Device blocked",
  DEVICE_PENDING: "Device pending approval",
  DEVICE_EMPLOYEE_MISMATCH: "Device belongs to different employee",
  OUTSIDE_BRANCH_NETWORK: "Outside branch network",
};

export default function LoginLogsPage() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<LoginLog[]>("/devices/logs?limit=500");
      setLogs(data);
    } catch {
      toast.error("Failed to load login logs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((log) => {
    const status = log.login_status ?? log.loginStatus;
    const empName = (log.employee?.full_name ?? "").toLowerCase();
    const ip = (log.ip_address ?? log.ipAddress ?? "").toLowerCase();
    const matchStatus = statusFilter === "ALL" || status === statusFilter;
    const matchSearch =
      !search ||
      empName.includes(search.toLowerCase()) ||
      ip.includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL: logs.length,
    SUCCESS: logs.filter((l) => (l.login_status ?? l.loginStatus) === "SUCCESS").length,
    FAILED: logs.filter((l) => (l.login_status ?? l.loginStatus) === "FAILED").length,
    BLOCKED: logs.filter((l) => (l.login_status ?? l.loginStatus) === "BLOCKED").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Login Logs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          All login attempts — successful, failed, and blocked
        </p>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "SUCCESS", "FAILED", "BLOCKED"] as const).map((s) => (
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
      <input
        type="text"
        placeholder="Search by employee or IP..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500"
      />

      {isLoading ? (
        <div className="py-12 text-center text-sm text-zinc-400">Loading logs...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400">No logs found</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-zinc-500">Device Fingerprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((log) => {
                  const status = log.login_status ?? log.loginStatus;
                  const reason = log.failure_reason ?? log.failureReason;
                  const ip = log.ip_address ?? log.ipAddress;
                  const fp = log.device_fingerprint ?? log.deviceFingerprint;
                  const ts = log.created_at ?? log.createdAt;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                        {new Date(ts).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        {log.employee ? (
                          <>
                            <div className="font-medium text-zinc-800">{log.employee.full_name}</div>
                            <div className="text-xs text-zinc-400">{log.employee.email}</div>
                          </>
                        ) : (
                          <span className="text-zinc-400 text-xs">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">
                        {reason ? (REASON_LABELS[reason] ?? reason) : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                        {ip ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 break-all">
                        {fp ? `${fp.slice(0, 16)}…` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
