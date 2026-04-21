import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  mode?: "default" | "edge-pairs";
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  mode = "edge-pairs",
}: PaginationProps) {
  const pages: Array<number | "ellipsis"> = [];

  if (mode === "edge-pairs" && totalPages > 5) {
    const numericPages = new Set<number>([1, totalPages]);

    if (currentPage <= 3) {
      numericPages.add(2);
      numericPages.add(3);
    } else if (currentPage >= totalPages - 2) {
      numericPages.add(totalPages - 2);
      numericPages.add(totalPages - 1);
    } else {
      numericPages.add(currentPage - 1);
      numericPages.add(currentPage);
      numericPages.add(currentPage + 1);
    }

    const orderedPages = Array.from(numericPages).sort((a, b) => a - b);

    orderedPages.forEach((page, index) => {
      if (index > 0 && page - orderedPages[index - 1] > 1) {
        pages.push("ellipsis");
      }
      pages.push(page);
    });
  } else {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30"
      >
        &lt;
      </button>
      {pages.map((p, index) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-8 min-w-8 items-center justify-center px-1 text-text-muted"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
              p === currentPage
                ? "bg-emerald-700 font-bold text-white"
                : "text-text-secondary hover:bg-surface-hover"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30"
      >
        &gt;
      </button>
    </div>
  );
}

interface PaginationFooterProps extends PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function PaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  mode = "edge-pairs",
  className,
}: PaginationFooterProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={cn(
        "border-t border-border-subtle bg-surface-secondary/50 p-4",
        "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <span className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
        SHOWING {startItem}-{endItem} OF {totalItems} RECORDS
      </span>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        mode={mode}
      />
    </div>
  );
}
