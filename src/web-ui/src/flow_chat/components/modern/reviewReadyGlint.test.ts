import { describe, expect, it } from 'vitest';
import { shouldTriggerReviewReadyGlint } from './reviewReadyGlint';

describe('shouldTriggerReviewReadyGlint', () => {
  it('triggers once when reviewable file count crosses the bulk threshold after loading', () => {
    expect(shouldTriggerReviewReadyGlint({
      previousReviewableCount: 0,
      nextReviewableCount: 9,
      loadingStats: false,
      threshold: 8,
    })).toBe(true);
  });

  it('does not trigger while stats are still loading', () => {
    expect(shouldTriggerReviewReadyGlint({
      previousReviewableCount: 0,
      nextReviewableCount: 9,
      loadingStats: true,
      threshold: 8,
    })).toBe(false);
  });

  it('does not retrigger when the count was already above threshold', () => {
    expect(shouldTriggerReviewReadyGlint({
      previousReviewableCount: 9,
      nextReviewableCount: 10,
      loadingStats: false,
      threshold: 8,
    })).toBe(false);
  });
});
