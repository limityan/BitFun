import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Checkbox } from '@/component-library';
import type { ReviewRemediationItem } from '../../utils/codeReviewRemediation';
import { REMEDIATION_GROUP_ORDER } from '../../utils/codeReviewRemediation';
import type { RemediationGroupId } from '../../utils/codeReviewReport';
import { globalEventBus } from '@/infrastructure/event-bus';
import { DEEP_REVIEW_SCROLL_TO_EVENT } from '../../events/flowchatNavigation';

interface RemediationSelectionPanelProps {
  remediationItems: ReviewRemediationItem[];
  selectedRemediationIds: Set<string>;
  completedRemediationIds: Set<string>;
  decisionSelections: Record<string, number>;
  showRemediationList: boolean;
  expandedDecisionIds: Set<string>;
  onToggleRemediation: (id: string) => void;
  onToggleAll: () => void;
  onToggleGroup: (groupId: string) => void;
  onToggleList: () => void;
  onToggleDecisionExpansion: (id: string) => void;
  onSetDecisionSelection: (id: string, optionIndex: number) => void;
}

const GROUP_PRIORITY_META: Record<RemediationGroupId, { color: string }> = {
  must_fix: { color: 'var(--color-error, #ef4444)' },
  should_improve: { color: 'var(--color-warning, #f59e0b)' },
  needs_decision: { color: 'var(--color-accent-500, #60a5fa)' },
  verification: { color: 'var(--color-success, #22c55e)' },
};

const stopNestedScrollPropagation = (event: React.WheelEvent | React.TouchEvent) => {
  event.stopPropagation();
  if ('nativeEvent' in event && typeof event.nativeEvent.stopImmediatePropagation === 'function') {
    event.nativeEvent.stopImmediatePropagation();
  }
};

export const RemediationSelectionPanel: React.FC<RemediationSelectionPanelProps> = ({
  remediationItems,
  selectedRemediationIds,
  completedRemediationIds,
  decisionSelections,
  showRemediationList,
  expandedDecisionIds,
  onToggleRemediation,
  onToggleAll,
  onToggleGroup,
  onToggleList,
  onToggleDecisionExpansion,
  onSetDecisionSelection,
}) => {
  const { t } = useTranslation('flow-chat');

  const selectedCount = selectedRemediationIds.size;
  const totalCount = remediationItems.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  const groupedItems = useMemo(() => {
    const groups: Record<string, ReviewRemediationItem[]> = {};
    for (const item of remediationItems) {
      const gid = item.groupId ?? 'ungrouped';
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(item);
    }
    return groups;
  }, [remediationItems]);

  const groupOrder = useMemo(() => {
    const ordered: string[] = [];
    for (const gid of REMEDIATION_GROUP_ORDER) {
      if (groupedItems[gid]?.length) ordered.push(gid);
    }
    if (groupedItems.ungrouped?.length) ordered.push('ungrouped');
    return ordered;
  }, [groupedItems]);

  return (
    <div className="deep-review-action-bar__remediation">
      <button
        type="button"
        className="deep-review-action-bar__remediation-toggle"
        onClick={onToggleList}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={!allSelected && selectedCount > 0}
          onChange={onToggleAll}
          size="small"
        />
        <span className="deep-review-action-bar__remediation-label">
          {t('toolCards.codeReview.remediationActions.selectionCount', {
            selected: selectedCount,
            total: totalCount,
            defaultValue: '{{selected}}/{{total}} selected',
          })}
        </span>
        {showRemediationList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showRemediationList && (
        <div
          className="deep-review-action-bar__remediation-list"
          onWheel={stopNestedScrollPropagation}
          onTouchMove={stopNestedScrollPropagation}
        >
          {groupOrder.map((groupId) => {
            const items = groupedItems[groupId]!;
            const groupSelectedCount = items.filter((i) => selectedRemediationIds.has(i.id)).length;
            const groupAllSelected = groupSelectedCount === items.length;
            const groupPartial = groupSelectedCount > 0 && !groupAllSelected;
            const groupTitle = groupId === 'ungrouped'
              ? t('toolCards.codeReview.remediationActions.ungrouped', { defaultValue: 'Other' })
              : t(`toolCards.codeReview.groups.${groupId}`, { defaultValue: groupId });
            const groupMeta = groupId !== 'ungrouped' ? GROUP_PRIORITY_META[groupId as RemediationGroupId] : undefined;

            return (
              <div key={groupId} className="deep-review-action-bar__remediation-group">
                <button
                  type="button"
                  className="deep-review-action-bar__remediation-group-header"
                  onClick={() => onToggleGroup(groupId)}
                >
                  <Checkbox
                    checked={groupAllSelected}
                    indeterminate={groupPartial}
                    onChange={() => onToggleGroup(groupId)}
                    size="small"
                  />
                  <span
                    className="deep-review-action-bar__remediation-group-title"
                    style={groupMeta ? { color: groupMeta.color } : undefined}
                  >
                    {groupTitle}
                  </span>
                  <span className="deep-review-action-bar__remediation-group-count">
                    {groupSelectedCount}/{items.length}
                  </span>
                </button>
                <div className="deep-review-action-bar__remediation-group-items">
                  {items.map((item) => {
                    const isCompleted = completedRemediationIds.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`deep-review-action-bar__remediation-item ${
                          isCompleted ? 'deep-review-action-bar__remediation-item--completed' : ''
                        }`}
                      >
                        <Checkbox
                          checked={selectedRemediationIds.has(item.id)}
                          onChange={() => !isCompleted && onToggleRemediation(item.id)}
                          disabled={isCompleted}
                          size="small"
                        />
                        <span
                          className="deep-review-action-bar__remediation-text"
                          title={item.decisionContext ? item.plan : undefined}
                        >
                          {isCompleted && (
                            <CheckCircle size={12} className="deep-review-action-bar__completed-icon" />
                          )}
                          {item.requiresDecision && (
                            <span className="deep-review-action-bar__remediation-tag">
                              {t('reviewActionBar.needsDecisionTag', { defaultValue: 'Decision' })}
                            </span>
                          )}
                          {item.groupId === 'verification' ? (
                            <span className="deep-review-action-bar__remediation-text-plain">
                              {item.decisionContext?.question ?? item.plan}
                            </span>
                          ) : (
                            <a
                              className="deep-review-action-bar__remediation-link"
                              href={`#review-remediation-${item.groupId ?? 'ungrouped'}-${item.groupIndex}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                if (item.groupId != null) {
                                  globalEventBus.emit(DEEP_REVIEW_SCROLL_TO_EVENT, {
                                    groupId: item.groupId,
                                    groupIndex: item.groupIndex,
                                    issueIndex: item.issueIndex ?? -1,
                                  });
                                }
                              }}
                            >
                              {item.decisionContext?.question ?? item.plan}
                            </a>
                          )}
                          {item.decisionContext?.tradeoffs && (
                            <span className="deep-review-action-bar__remediation-tradeoffs">
                              {item.decisionContext.tradeoffs}
                            </span>
                          )}
                          {item.decisionContext?.options && item.decisionContext.options.length > 0 && (
                            <button
                              type="button"
                              className="deep-review-action-bar__decision-toggle"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onToggleDecisionExpansion(item.id);
                              }}
                            >
                              {expandedDecisionIds.has(item.id)
                                ? t('toolCards.codeReview.remediationActions.collapseOptions', { defaultValue: 'Hide options' })
                                : t('toolCards.codeReview.remediationActions.expandOptions', { defaultValue: 'Show options' })}
                            </button>
                          )}
                          {expandedDecisionIds.has(item.id) && item.decisionContext?.options && (
                            <ul className="deep-review-action-bar__decision-options">
                              {item.decisionContext.options.map((opt, oi) => {
                                const isSelected = decisionSelections[item.id] === oi;
                                const isRecommended = item.decisionContext?.recommendation === oi;
                                return (
                                  <li key={oi} className={`deep-review-action-bar__decision-option ${isSelected ? 'is-selected' : ''} ${isRecommended ? 'is-recommended' : ''}`}>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        onSetDecisionSelection(item.id, oi);
                                      }}
                                    >
                                      <span className="deep-review-action-bar__decision-option-marker">
                                        {isSelected ? '\u25CF' : '\u25CB'}
                                      </span>
                                      <span className="deep-review-action-bar__decision-option-text">
                                        {opt}
                                        {isRecommended ? ` (${t('toolCards.codeReview.remediationActions.recommended', { defaultValue: 'recommended' })})` : ''}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCount === 0 && (
        <div className="deep-review-action-bar__empty-selection" role="note">
          <Info size={14} className="deep-review-action-bar__empty-selection-icon" />
          <span>
            {t('toolCards.codeReview.remediationActions.noSelectionHint', {
              defaultValue: 'Select at least one remediation item to start fixing.',
            })}
          </span>
        </div>
      )}
    </div>
  );
};
