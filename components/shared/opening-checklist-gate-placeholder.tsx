"use client";

export function OpeningChecklistGatePlaceholder() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-main bg-surface-secondary/50 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-text-primary">
        Branch opening checklist required
      </p>
      <p className="max-w-md text-sm text-text-tertiary">
        Confirm starting cash and complete the inventory audit using the prompt
        above to access this module.
      </p>
    </div>
  );
}
