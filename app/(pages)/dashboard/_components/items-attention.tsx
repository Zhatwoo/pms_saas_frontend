import { StatusBadge } from "@/components/shared/status-badge";

interface AttentionItem {
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

export function ItemsAttention({ items = [] }: ItemsAttentionProps) {
  return (
    <div className="rounded-lg border border-border-main bg-surface p-5 transition-colors duration-300">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Items Requiring Attention
        </h3>
        <p className="text-xs text-text-tertiary">
          Contracts near expiration or overdue
        </p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-text-tertiary py-4 text-center">No items require attention</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border border-border-subtle bg-surface-secondary p-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.contract}
                  </p>
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  {item.amount}
                </span>
              </div>
              <div className="mt-2">
                <StatusBadge label={item.badge.label} variant={item.badge.variant} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
