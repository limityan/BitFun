export const REVIEW_READY_GLINT_THRESHOLD = 8;
export const REVIEW_READY_GLINT_DURATION_MS = 1400;

export interface ReviewReadyGlintInput {
  previousReviewableCount: number;
  nextReviewableCount: number;
  loadingStats: boolean;
  threshold?: number;
}

export function shouldTriggerReviewReadyGlint({
  previousReviewableCount,
  nextReviewableCount,
  loadingStats,
  threshold = REVIEW_READY_GLINT_THRESHOLD,
}: ReviewReadyGlintInput): boolean {
  return (
    !loadingStats &&
    previousReviewableCount < threshold &&
    nextReviewableCount >= threshold
  );
}
