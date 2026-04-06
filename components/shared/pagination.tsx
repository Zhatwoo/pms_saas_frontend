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
    <div className="flex items-center justify-end gap-3 px-4 py-3 text-xs text-zinc-600">
      <span>
        Showing {showing} out of {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
        >
          &lt;
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
              p === currentPage
                ? "bg-emerald-700 font-bold text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
