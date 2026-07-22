"use client";

interface ActionButtonsProps {
  isAllBranches: boolean;
  onAddFunds: () => void;
  onTransferFunds: () => void;
}

export function ActionButtons({
  isAllBranches,
  onAddFunds,
  onTransferFunds,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Add Funds */}
      <button
        onClick={onAddFunds}
        disabled={isAllBranches}
        title={isAllBranches ? "Select a specific branch to add funds" : "Add funds to this branch"}
        className={`group flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-bold transition-all duration-200 ${
          isAllBranches
            ? "cursor-not-allowed border-border-main bg-surface-secondary text-text-muted opacity-60"
            : "border-pawn-sidebar-light bg-gradient-to-r from-pawn-sidebar to-pawn-sidebar-light text-white shadow-md shadow-pawn-sidebar/20 hover:shadow-lg hover:shadow-pawn-sidebar/30 active:scale-[0.98]"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${!isAllBranches ? "group-hover:scale-110" : ""}`}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Funds
      </button>

      {/* Transfer Funds */}
      <button
        onClick={onTransferFunds}
        disabled={isAllBranches}
        title={isAllBranches ? "Select a specific branch to transfer funds" : "Transfer funds between branches"}
        className={`group flex items-center gap-2.5 rounded-xl border px-5 py-3 text-sm font-bold transition-all duration-200 ${
          isAllBranches
            ? "cursor-not-allowed border-border-main bg-surface-secondary text-text-muted opacity-60"
            : "border-blue-500/40 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 active:scale-[0.98]"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${!isAllBranches ? "group-hover:scale-110" : ""}`}
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        Transfer Funds
      </button>

      {isAllBranches && (
        <span className="ml-1 text-[11px] italic text-text-muted">
          Select a specific branch to perform actions
        </span>
      )}
    </div>
  );
}
