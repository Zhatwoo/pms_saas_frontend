"use client";

import { useEffect, useState } from "react";
import { PaginationFooter } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";

export interface AttentionItem {
  id: string | number;
  name: string;
  contract: string;
  amount: string;
  badge: {
    label: string;
    variant: "yellow" | "red" | "green" | "blue" | "purple" | "orange" | "black";
  };
}

interface ItemsAttentionProps {
  items?: AttentionItem[];
}

const ITEMS_PER_PAGE = 5;

export function ItemsAttention({ items = [] }: ItemsAttentionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex h-auto flex-col overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300 lg:h-[34rem]">
      <div className="flex h-full min-h-0 flex-col p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Items Requiring Attention
          </h3>
          <p className="text-xs text-text-tertiary">
            Contracts near expiration or overdue
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="space-y-3 pb-4">
            {items.length === 0 ? (
              <div className="py-4 text-center text-sm text-text-tertiary">
                No items require attention
              </div>
            ) : (
              visibleItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-secondary p-3">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-black leading-none text-amber-600">
                    !
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {item.contract}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-text-primary">
                        {item.amount}
                      </span>
                    </div>
                    <div className="mt-2">
                      <StatusBadge label={item.badge.label} variant={item.badge.variant} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      {items.length > ITEMS_PER_PAGE && (
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={items.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          className="mt-4 -mx-5"
        />
      )}
      </div>
    </div>
  );
}
