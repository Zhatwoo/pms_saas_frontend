"use client";

import { TabHint } from "./ui";

export function MoaTermsTab({
  enabled,
  termsText,
  onTermsChange,
  termsHeading,
  onTermsHeadingChange,
  termsPreamble,
  onTermsPreambleChange,
}: {
  enabled: boolean;
  termsText: string;
  onTermsChange: (value: string) => void;
  termsHeading: string;
  onTermsHeadingChange: (value: string) => void;
  termsPreamble: string;
  onTermsPreambleChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-bold text-zinc-800">Terms & labels</h3>
        <TabHint>
          Edit reverse-side terms used by the classic slip (and kept when you Save).
          Canvas design print uses your layout pages only.
        </TabHint>
      </div>

      <label className="block space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          Terms heading
        </span>
        <input
          value={termsHeading}
          disabled={!enabled}
          onChange={(e) => onTermsHeadingChange(e.target.value)}
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-emerald-500 disabled:opacity-50"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          Terms preamble (optional)
        </span>
        <textarea
          value={termsPreamble}
          disabled={!enabled}
          onChange={(e) => onTermsPreambleChange(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] leading-snug outline-none focus:border-emerald-500 disabled:opacity-50"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-500">
          Numbered terms
        </span>
        <textarea
          value={termsText}
          disabled={!enabled}
          onChange={(e) => onTermsChange(e.target.value)}
          rows={14}
          className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[10px] leading-snug outline-none focus:border-emerald-500 disabled:opacity-50"
          placeholder="1. …"
        />
      </label>
    </div>
  );
}
