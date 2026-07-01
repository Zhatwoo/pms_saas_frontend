/** Shared CUT HERE divider — flex dashed lines on both sides keep label centered. */
export function MoaCutGuide() {
  return (
    <div
      className="moa-cut-guide flex w-full min-w-0 items-center gap-2 py-1"
      aria-hidden="true"
      style={{ display: "flex", width: "100%", alignItems: "center" }}
    >
      <span className="moa-cut-guide__line min-w-0 flex-1 border-t border-dashed border-zinc-400" />
      <span
        className="moa-cut-guide__text shrink-0 whitespace-nowrap bg-white px-1 text-[8px] font-bold tracking-wider text-zinc-400"
        style={{ flexShrink: 0, background: "#fff" }}
      >
        ✂ - - - - - CUT HERE - - - - - ✂
      </span>
      <span className="moa-cut-guide__line min-w-0 flex-1 border-t border-dashed border-zinc-400" />
    </div>
  );
}
