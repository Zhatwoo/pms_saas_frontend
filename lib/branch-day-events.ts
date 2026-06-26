/** Dispatched after a branch End Day completes (same browser — tabs refresh session state). */
export const BRANCH_DAY_ENDED_EVENT = "branch_day_ended";

export const BRANCH_DAY_END_LOGOUT_MESSAGE =
  "End Day was completed for your branch. Please sign in again to start the next branch day.";

/** Cross-tab signal for same-browser employee sessions (storage event). */
export const BRANCH_DAY_END_STORAGE_KEY = "pms_branch_day_ended";

export function broadcastBranchDayEndedForBranch(branchId: string) {
  if (typeof window === "undefined" || !branchId) return;

  try {
    localStorage.setItem(
      BRANCH_DAY_END_STORAGE_KEY,
      JSON.stringify({ branchId, at: Date.now() }),
    );
  } catch {
    /* ignore quota / private mode */
  }

  window.dispatchEvent(new CustomEvent(BRANCH_DAY_ENDED_EVENT));
}
