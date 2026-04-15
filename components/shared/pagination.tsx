interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const showing = Math.min(itemsPerPage, totalItems - (currentPage - 1) * itemsPerPage);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <div className="flex items-center justify-end gap-3 px-5 py-4 text-sm text-text-secondary">
      <span>
        Showing {showing} out of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30"
        >
          &lt;
        </button>
        {pages.map((p) => (
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
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 text-text-muted hover:text-text-primary disabled:opacity-30"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
