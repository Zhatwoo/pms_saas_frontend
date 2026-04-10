import { ActionButton } from "@/components/shared/action-button";

const downloadIcon = (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const printerIcon = (
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
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

type FilterType = "All" | "Renew" | "Redeem" | "New Pawn" | "Sales / Transfer" | "Buy Back";

interface TransactionActionsProps {
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
  onExportCSV?: () => void;
  onPrintReport?: () => void;
  onManualInput?: () => void;
}

const filters: FilterType[] = ["Renew", "Redeem", "New Pawn", "Sales / Transfer", "Buy Back"];

const filterVariantMap: Record<string, string> = {
  "Renew": "renew",
  "Redeem": "redeem",
  "New Pawn": "pawn",
  "Sales / Transfer": "sales",
  "Buy Back": "buyback",
};

export function TransactionActions({ 
  activeFilter = "All", 
  onFilterChange, 
  onExportCSV, 
  onPrintReport, 
  onManualInput
}: TransactionActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <ActionButton
            key={f}
            variant={filterVariantMap[f] as any}
            className={activeFilter === f ? "ring-2 ring-offset-1 ring-emerald-600 opacity-100" : "opacity-70 hover:opacity-100"}
            onClick={() => onFilterChange?.(activeFilter === f ? "All" : f)}
          >
            {f}
          </ActionButton>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ActionButton variant="outline" onClick={onManualInput} className="border-emerald-600 text-emerald-700 bg-emerald-50">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Cash Transfer
          </span>
        </ActionButton>
        <ActionButton variant="outline" onClick={onExportCSV}>
          <span className="flex items-center gap-1.5">
            {downloadIcon}
            Export CSV
          </span>
        </ActionButton>
        <ActionButton variant="primary" className="bg-emerald-700 border-pawn-gold text-pawn-gold" onClick={onPrintReport}>
          <span className="flex items-center gap-1.5">
            {printerIcon}
            Print Report
          </span>
        </ActionButton>
      </div>
    </div>
  );
}

