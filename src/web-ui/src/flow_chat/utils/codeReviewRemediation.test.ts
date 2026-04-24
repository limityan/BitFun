import { describe, expect, it } from 'vitest';
import {
  buildReviewRemediationItems,
  buildSelectedRemediationPrompt,
  getDefaultSelectedRemediationIds,
} from './codeReviewRemediation';

const reviewData = {
  summary: {
    overall_assessment: 'Fix the risky parts first.',
    risk_level: 'medium' as const,
    recommended_action: 'request_changes' as const,
  },
  issues: [
    {
      severity: 'high' as const,
      certainty: 'confirmed' as const,
      category: 'correctness',
      file: 'src/risky.ts',
      line: 12,
      title: 'High risk branch',
      description: 'The high risk branch is inverted.',
      suggestion: 'Invert the branch.',
    },
    {
      severity: 'low' as const,
      certainty: 'possible' as const,
      category: 'style',
      file: 'src/style.ts',
      line: null,
      title: 'Optional style cleanup',
      description: 'This is a nice-to-have cleanup.',
      suggestion: 'Rename the helper.',
    },
    {
      severity: 'medium' as const,
      certainty: 'likely' as const,
      category: 'performance',
      file: 'src/cache.ts',
      line: 4,
      title: 'Repeated cache scan',
      description: 'Cache entries are scanned repeatedly.',
      suggestion: null,
    },
  ],
  positive_points: [],
  review_mode: 'deep' as const,
  remediation_plan: [
    'Fix the risky branch.',
    'Rename the helper if desired.',
    'Avoid repeated cache scans.',
  ],
};

describe('codeReviewRemediation', () => {
  it('selects medium and higher remediation items by default', () => {
    const items = buildReviewRemediationItems(reviewData);

    expect(getDefaultSelectedRemediationIds(items)).toEqual([
      'remediation-0',
      'remediation-2',
    ]);
  });

  it('also selects confirmed low-priority items when they have a concrete fix suggestion', () => {
    const items = buildReviewRemediationItems({
      ...reviewData,
      issues: [{
        severity: 'low',
        certainty: 'confirmed',
        category: 'maintainability',
        file: 'src/helper.ts',
        line: 2,
        title: 'Confirmed helper bug',
        description: 'The helper returns the wrong fallback.',
        suggestion: 'Return the safe fallback.',
      }],
      remediation_plan: ['Return the safe fallback.'],
    });

    expect(getDefaultSelectedRemediationIds(items)).toEqual(['remediation-0']);
  });

  it('builds a fix prompt with only selected remediation items and findings', () => {
    const prompt = buildSelectedRemediationPrompt({
      reviewData,
      selectedIds: new Set(['remediation-2']),
      rerunReview: true,
    });

    expect(prompt).toContain('Avoid repeated cache scans.');
    expect(prompt).toContain('Repeated cache scan');
    expect(prompt).not.toContain('Fix the risky branch.');
    expect(prompt).not.toContain('Optional style cleanup');
    expect(prompt).toContain('follow-up review of the fix diff');
  });

  it('does not build a fix prompt when no remediation items are selected', () => {
    expect(buildSelectedRemediationPrompt({
      reviewData,
      selectedIds: new Set(),
      rerunReview: false,
    })).toBe('');
  });
});
