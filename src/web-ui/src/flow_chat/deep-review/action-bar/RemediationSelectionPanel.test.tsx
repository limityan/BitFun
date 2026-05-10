import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RemediationSelectionPanel } from './RemediationSelectionPanel';
import type { ReviewRemediationItem } from '../../utils/codeReviewRemediation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: Record<string, unknown> & { defaultValue?: string }) => {
      const template = options?.defaultValue ?? _key;
      return template.replace(/{{(\w+)}}/g, (_match, token: string) => String(options?.[token] ?? _match));
    },
  }),
}));

vi.mock('@/component-library', () => ({
  Button: ({
    children,
    disabled,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
  }) => <button type="button" disabled={disabled}>{children}</button>,
  Checkbox: ({
    checked,
    disabled,
  }: {
    checked?: boolean;
    disabled?: boolean;
  }) => <input type="checkbox" checked={checked} disabled={disabled} readOnly />,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/infrastructure/event-bus', () => ({
  globalEventBus: {
    emit: vi.fn(),
  },
}));

const baseProps = {
  showRemediationList: true,
  onToggleRemediation: vi.fn(),
  onToggleAll: vi.fn(),
  onToggleGroup: vi.fn(),
  onToggleList: vi.fn(),
  onToggleDecisionExpansion: vi.fn(),
  onSetDecisionSelection: vi.fn(),
};

describe('RemediationSelectionPanel', () => {
  it('renders grouped remediation counts and the empty-selection hint', () => {
    const remediationItems: ReviewRemediationItem[] = [
      {
        id: 'must-fix-1',
        index: 0,
        groupIndex: 0,
        plan: 'Fix critical issue',
        issueIndex: 0,
        groupId: 'must_fix',
        defaultSelected: true,
      },
    ];

    const html = renderToStaticMarkup(
      <RemediationSelectionPanel
        {...baseProps}
        remediationItems={remediationItems}
        selectedRemediationIds={new Set()}
        completedRemediationIds={new Set()}
        decisionSelections={{}}
        expandedDecisionIds={new Set()}
      />,
    );

    expect(html).toContain('0/1 selected');
    expect(html).toContain('must_fix');
    expect(html).toContain('0/1');
    expect(html).toContain('Select at least one remediation item to start fixing.');
  });

  it('renders completed and expanded decision remediation items', () => {
    const remediationItems: ReviewRemediationItem[] = [
      {
        id: 'decision-1',
        index: 0,
        groupIndex: 0,
        plan: 'Choose a migration strategy',
        issueIndex: 0,
        groupId: 'needs_decision',
        requiresDecision: true,
        decisionContext: {
          question: 'Which migration strategy should we use?',
          tradeoffs: 'Fast path is risky; staged path is safer.',
          options: ['Fast path', 'Staged path'],
          recommendation: 1,
        },
        defaultSelected: true,
      },
    ];

    const html = renderToStaticMarkup(
      <RemediationSelectionPanel
        {...baseProps}
        remediationItems={remediationItems}
        selectedRemediationIds={new Set(['decision-1'])}
        completedRemediationIds={new Set(['decision-1'])}
        decisionSelections={{ 'decision-1': 1 }}
        expandedDecisionIds={new Set(['decision-1'])}
      />,
    );

    expect(html).toContain('Decision');
    expect(html).toContain('Which migration strategy should we use?');
    expect(html).toContain('Fast path is risky; staged path is safer.');
    expect(html).toContain('Staged path (recommended)');
    expect(html).toContain('deep-review-action-bar__remediation-item--completed');
  });
});
