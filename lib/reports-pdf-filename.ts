export function slugPart(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
  return slug || "report";
}

export function buildReportsPdfFilename(params: {
  isAllBranches: boolean;
  branchName: string;
  period: string;
  generatedAt?: Date;
}): string {
  const scope = params.isAllBranches
    ? "all_branches"
    : slugPart(params.branchName);
  const period = slugPart(params.period);
  const dateLabel = (params.generatedAt ?? new Date()).toISOString().slice(0, 10);
  return `system_report_${scope}_${period}_${dateLabel}.pdf`;
}
