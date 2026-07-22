"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useBranch } from "@/contexts/branch-context";
import type { BranchOption } from "@/contexts/branch-context";

/* ── Icons ──────────────────────────────────────────────── */
function BuildingIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M12 2 L3 7 L3 12 C3 17.5 7 22.5 12 24 C17 22.5 21 17.5 21 12 L21 7 Z" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────── */
export function BranchSelectorDropdown() {
  const {
    selectedBranch,
    branches,
    setSelectedBranch,
    canSwitchBranch,
    isAllBranches,
  } = useBranch();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSearchQuery("");
      }
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Auto-focus search when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [open]);

  const toggleOpen = useCallback(() => {
    if (!canSwitchBranch) return;
    setOpen((prev) => !prev);
    if (open) setSearchQuery("");
  }, [canSwitchBranch, open]);

  const handleSelect = useCallback(
    (branch: BranchOption) => {
      setSelectedBranch(branch);
      setOpen(false);
      setSearchQuery("");
    },
    [setSelectedBranch],
  );

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  // Don't render for non-superadmins (they see a simpler indicator via the page itself)
  if (!canSwitchBranch) return null;

  return (
    <div ref={containerRef} className="relative" id="branch-selector">
      {/* ── Trigger button ──────────────────────────────── */}
      <button
        onClick={toggleOpen}
        className={
          `group flex items-center gap-2 rounded-xl border transition-all duration-200` +
          ` px-2.5 py-1.5 md:px-3.5 md:py-2 text-sm font-medium` +
          (open
            ? ` border-brand-green/50 bg-emerald-surface text-emerald-text shadow-md shadow-emerald-surface/20`
            : ` border-border-main bg-surface text-text-secondary shadow-sm hover:border-brand-green/40 hover:shadow-md`)
        }
        title="Switch branch view"
      >
        {/* Icon */}
        <span
          className={`
            flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200
            ${
              isAllBranches
                ? "bg-gradient-to-br from-brand-green to-pawn-sidebar text-white"
                : "bg-emerald-surface text-emerald-text"
            }
          `}
        >
          {isAllBranches ? <GlobeIcon /> : <BuildingIcon className="h-3.5 w-3.5" />}
        </span>

        {/* Label: hidden on all mobile sizes; visible only on lg+ */}
        <div className="hidden lg:flex flex-col items-start">
          <span className="flex items-center gap-1.5">
            <span className="max-w-[160px] truncate text-sm font-semibold leading-tight">
              {selectedBranch.name}
            </span>
            {isAllBranches && (
              <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-pawn-gold to-pawn-gold-light px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                <ShieldIcon />
                Admin
              </span>
            )}
          </span>
          <span className="text-xs leading-tight text-text-muted">
            {isAllBranches
              ? `${branches.length - 1} branches`
              : selectedBranch.location ?? "Branch view"}
          </span>
        </div>

        {/* Chevron */}
        <ChevronIcon open={open} />
      </button>

      {/* ── Dropdown panel ──────────────────────────────── */}
      {open && (
        <div
          className="fixed left-2 right-2 top-[57px] z-50 rounded-xl border border-border-main bg-surface p-4 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px] sm:fixed-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pb-2 pt-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Select Branch
            </span>
            <span className="rounded-full bg-emerald-surface px-2 py-0.5 text-xs font-semibold text-emerald-text">
              {branches.length} available
            </span>
          </div>

          {/* Search */}
          {branches.length > 4 && (
            <div className="px-2 pb-2">
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search branches..."
                  className="w-full rounded-lg border border-border-main bg-surface-secondary py-2 pl-8 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand-green/40 focus:bg-surface"
                />
              </div>
            </div>
          )}

          {/* Branch list */}
          <div className="max-h-[60vh] sm:max-h-64 space-y-0.5 overflow-y-auto scrollbar-hide">
            {filteredBranches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="text-xs">No branches found</span>
              </div>
            )}

            {filteredBranches.map((branch) => {
              const isSelected = branch.id === selectedBranch.id;
              const isAll = branch.id === "__all__";

                return (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch)}
                  className={`group/item flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 ${
                    isSelected ? (isAll ? "bg-gradient-to-r from-emerald-surface to-emerald-surface/50 text-emerald-text" : "bg-emerald-surface text-emerald-text") : "text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {/* Icon circle */}
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${isAll ? (isSelected ? "bg-gradient-to-br from-brand-green to-pawn-sidebar text-white shadow-md shadow-brand-green/20" : "bg-emerald-surface text-emerald-text group-hover/item:bg-emerald-border/40") : isSelected ? "bg-brand-green text-white shadow-md shadow-brand-green/20" : "bg-surface-secondary text-text-muted group-hover/item:bg-surface-hover"}`}>
                    {isAll ? <GlobeIcon /> : <BuildingIcon />}
                  </span>

                  {/* Label */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={`truncate text-sm font-medium leading-tight ${
                        isSelected ? "font-semibold" : ""
                      }`}
                    >
                      {branch.name}
                    </span>
                    {branch.location && (
                      <span className="mt-0.5 truncate text-xs leading-tight text-text-muted">
                        {branch.location}
                      </span>
                    )}
                  </div>

                  {/* Check mark */}
                  {isSelected && (
                    <span className="flex-shrink-0 text-brand-green">
                      <CheckIcon />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-1.5 border-t border-border-subtle px-3 py-2">
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text-tertiary">Super Admin</span> —
              Data across pages will reflect the selected branch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

