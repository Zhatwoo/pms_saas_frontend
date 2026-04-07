import { StatusBadge } from "@/components/shared/status-badge";

const items = [
  {
    id: 1,
    name: "Diamond Ring",
    contract: "C-2398",
    amount: "₱2,500",
    badge: { label: "1 day left", variant: "yellow" as const },
  },
  {
    id: 2,
    name: "Camera Canon EOS R5",
    contract: "C-2334",
    amount: "₱1,800",
    badge: { label: "Overdue 5 days", variant: "red" as const },
  },
];

export function ItemsAttention() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Items Requiring Attention
        </h3>
        <p className="text-xs text-zinc-500">
          Contracts near expiration or overdue
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-800">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {item.contract}
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-900">
                {item.amount}
              </span>
            </div>
            <div className="mt-2">
              <StatusBadge label={item.badge.label} variant={item.badge.variant} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
