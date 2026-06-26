"use client";

export function OpeningChecklistGatePlaceholder() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-main bg-surface-secondary/50 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-text-primary">
        Branch opening checklist required
      </p>
      <p className="max-w-md text-sm text-text-tertiary">
        Kailangan munang mag-Start Day at kumpletuhin ang opening checklist
        (starting cash at inventory audit) bago magamit ang module na ito.
      </p>
    </div>
  );
}
