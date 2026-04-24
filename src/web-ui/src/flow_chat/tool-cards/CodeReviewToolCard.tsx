/**
 * CodeReview tool display component
 * Displays structured code review results with collapsible/expandable details
 * Refactored based on BaseToolCard
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Tooltip } from '@/component-library';
import type { ToolCardProps } from '../types/flow-chat';
import { BaseToolCard, ToolCardHeader } from './BaseToolCard';
import { createLogger } from '@/shared/utils/logger';
import { useToolCardHeightContract } from './useToolCardHeightContract';
import { flowChatManager } from '../services/FlowChatManager';
import { notificationService } from '@/shared/notification-system';
import {
  buildReviewRemediationItems,
  buildSelectedRemediationPrompt,
  getDefaultSelectedRemediationIds,
} from '../utils/codeReviewRemediation';
import './CodeReviewToolCard.scss';

const log = createLogger('CodeReviewToolCard');

interface CodeReviewSummary {
  overall_assessment: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_action: 'approve' | 'approve_with_suggestions' | 'request_changes' | 'block';
  confidence_note?: string;
}

interface CodeReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  certainty: 'confirmed' | 'likely' | 'possible';
  category: string;
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestion: string | null;
  source_reviewer?: string;
  validation_note?: string;
}

interface CodeReviewReviewer {
  name: string;
  specialty: string;
  status: string;
  summary: string;
  issue_count?: number;
}

interface CodeReviewResult {
  summary: CodeReviewSummary;
  issues: CodeReviewIssue[];
  positive_points: string[];
  review_mode?: 'standard' | 'deep';
  review_scope?: string;
  reviewers?: CodeReviewReviewer[];
  remediation_plan?: string[];
}

const riskLevelColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export const CodeReviewToolCard: React.FC<ToolCardProps> = React.memo(({
  toolItem,
  sessionId,
}) => {
  const { t } = useTranslation('flow-chat');
  const { toolResult, status } = toolItem;
  const [isExpanded, setIsExpanded] = useState(false);
  const [remediationActionsDismissed, setRemediationActionsDismissed] = useState(false);
  const [activeRemediationAction, setActiveRemediationAction] = useState<'fix' | 'fix-review' | null>(null);
  const [selectedRemediationIds, setSelectedRemediationIds] = useState<Set<string>>(new Set());
  const [expandedRemediationIds, setExpandedRemediationIds] = useState<Set<string>>(new Set());
  const autoExpandedResultRef = useRef<string | null>(null);
  const toolId = toolItem.id ?? toolItem.toolCall?.id;
  const { cardRootRef, applyExpandedState } = useToolCardHeightContract({
    toolId,
    toolName: toolItem.toolName,
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
      case 'streaming':
        return <Loader2 className="animate-spin" size={12} />;
      case 'completed':
        return null;
      case 'pending':
      default:
        return <Clock size={12} />;
    }
  };

  const reviewData = useMemo<CodeReviewResult | null>(() => {
    if (!toolResult?.result) return null;

    try {
      const result = toolResult.result;

      if (typeof result === 'string') {
        const parsed = JSON.parse(result);
        return parsed;
      }

      if (typeof result === 'object' && result.summary) {
        return result as CodeReviewResult;
      }

      return null;
    } catch (error) {
      log.error('Failed to parse result', error);
      return null;
    }
  }, [toolResult?.result]);

  useEffect(() => {
    setRemediationActionsDismissed(false);
    setExpandedRemediationIds(new Set());
    if (!reviewData) {
      setSelectedRemediationIds(new Set());
      return;
    }
    const remediationItems = buildReviewRemediationItems(reviewData);
    setSelectedRemediationIds(new Set(getDefaultSelectedRemediationIds(remediationItems)));
  }, [reviewData, toolResult?.result]);

  const issueStats = useMemo(() => {
    if (!reviewData) return null;

    const stats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      total: 0,
    };

    reviewData.issues.forEach(issue => {
      stats[issue.severity]++;
      stats.total++;
    });

    return stats;
  }, [reviewData]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={14} style={{ color: riskLevelColors.critical }} />;
      case 'high':
        return <AlertTriangle size={14} style={{ color: riskLevelColors.high }} />;
      case 'medium':
        return <AlertTriangle size={14} style={{ color: riskLevelColors.medium }} />;
      case 'low':
        return <Info size={14} style={{ color: riskLevelColors.low }} />;
      case 'info':
        return <Info size={14} style={{ color: '#6b7280' }} />;
      default:
        return <Info size={14} style={{ color: '#6b7280' }} />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      case 'info':
      default:
        return 'info';
    }
  };

  const hasIssues = issueStats && issueStats.total > 0;
  const hasData = reviewData !== null;
  const remediationItems = useMemo(
    () => reviewData ? buildReviewRemediationItems(reviewData) : [],
    [reviewData],
  );
  const selectedRemediationCount = selectedRemediationIds.size;
  const allRemediationSelected =
    remediationItems.length > 0 &&
    selectedRemediationCount === remediationItems.length;
  const someRemediationSelected =
    selectedRemediationCount > 0 &&
    selectedRemediationCount < remediationItems.length;

  useEffect(() => {
    const resultKey = typeof toolResult?.result === 'string'
      ? toolResult.result
      : JSON.stringify(toolResult?.result ?? null);
    const shouldAutoExpand =
      status === 'completed' &&
      reviewData?.review_mode === 'deep' &&
      (reviewData.remediation_plan ?? []).length > 0 &&
      autoExpandedResultRef.current !== resultKey;

    if (shouldAutoExpand) {
      autoExpandedResultRef.current = resultKey;
      setIsExpanded(true);
    }
  }, [reviewData, status, toolResult?.result]);

  const buildFixPrompt = useCallback((rerunReview: boolean) => {
    if (!reviewData) return '';
    return buildSelectedRemediationPrompt({
      reviewData,
      selectedIds: selectedRemediationIds,
      rerunReview,
    });
  }, [reviewData, selectedRemediationIds]);

  const handleStartFixing = useCallback(async (
    event: React.MouseEvent,
    rerunReview: boolean,
  ) => {
    event.stopPropagation();
    if (!reviewData) return;

    if (!sessionId) {
      notificationService.error(
        t('toolCards.codeReview.remediationActions.fixUnavailable', {
          defaultValue: 'Unable to start remediation because the review session is unavailable.',
        }),
      );
      return;
    }

    const action = rerunReview ? 'fix-review' : 'fix';
    const prompt = buildFixPrompt(rerunReview);
    if (!prompt) {
      return;
    }

    setActiveRemediationAction(action);
    try {
      await flowChatManager.sendMessage(
        prompt,
        sessionId,
        rerunReview
          ? t('toolCards.codeReview.remediationActions.fixAndReviewRequestDisplay', {
              defaultValue: 'Fix Deep Review findings and re-review',
            })
          : t('toolCards.codeReview.remediationActions.fixRequestDisplay', {
              defaultValue: 'Start fixing Deep Review findings',
            }),
        'ReviewFixer',
        'agentic',
      );
      setRemediationActionsDismissed(true);
    } catch (error) {
      log.error('Failed to start Deep Review remediation', { sessionId, rerunReview, error });
      notificationService.error(
        error instanceof Error
          ? error.message
          : t('toolCards.codeReview.reviewFailed', {
              error: t('toolCards.codeReview.unknownError'),
            }),
        { duration: 5000 },
      );
    } finally {
      setActiveRemediationAction(null);
    }
  }, [buildFixPrompt, reviewData, sessionId, t]);

  const toggleExpanded = useCallback(() => {
    applyExpandedState(isExpanded, !isExpanded, setIsExpanded);
  }, [applyExpandedState, isExpanded]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.preview-toggle-btn')) {
      return;
    }

    if (hasData) {
      toggleExpanded();
    }
  }, [hasData, toggleExpanded]);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded();
  }, [toggleExpanded]);

  const handleToggleAllRemediation = useCallback((checked: boolean) => {
    setSelectedRemediationIds(
      checked
        ? new Set(remediationItems.map((item) => item.id))
        : new Set(),
    );
  }, [remediationItems]);

  const handleToggleRemediation = useCallback((itemId: string, checked: boolean) => {
    setSelectedRemediationIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const handleToggleRemediationDetails = useCallback((itemId: string) => {
    setExpandedRemediationIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const renderContent = () => {
    if (status === 'completed' && reviewData) {
      const { risk_level } = reviewData.summary;
      const reviewLabel = reviewData.review_mode === 'deep'
        ? t('toolCards.codeReview.deepReviewResult', { defaultValue: 'Deep Review Result' })
        : t('toolCards.codeReview.reviewResult');

      if (hasIssues) {
        const parts: React.ReactNode[] = [];
        if (issueStats!.critical > 0) {
          parts.push(
            <span key="critical" style={{ color: riskLevelColors.critical }}>
              {issueStats!.critical} {t('toolCards.codeReview.severities.critical')}
            </span>,
          );
        }
        if (issueStats!.high > 0) {
          parts.push(
            <span key="high" style={{ color: riskLevelColors.high }}>
              {issueStats!.high} {t('toolCards.codeReview.severities.high')}
            </span>,
          );
        }
        if (issueStats!.medium > 0) {
          parts.push(
            <span key="medium" style={{ color: riskLevelColors.medium }}>
              {issueStats!.medium} {t('toolCards.codeReview.severities.medium')}
            </span>,
          );
        }
        if (issueStats!.low > 0) {
          parts.push(
            <span key="low" style={{ color: riskLevelColors.low }}>
              {issueStats!.low} {t('toolCards.codeReview.severities.low')}
            </span>,
          );
        }

        return (
          <>
            {reviewLabel} -{' '}
            {parts.reduce<React.ReactNode[]>((acc, part, i) => {
              if (i > 0) acc.push(<span key={`sep-${i}`}>, </span>);
              acc.push(part);
              return acc;
            }, [])}
          </>
        );
      }

      return (
        <>
          {reviewLabel} - {t(`toolCards.codeReview.riskLevels.${risk_level}`)}
        </>
      );
    }

    if (status === 'running' || status === 'streaming') {
      return <>{t('toolCards.codeReview.reviewingCode')}</>;
    }

    if (status === 'pending') {
      return <>{t('toolCards.codeReview.preparingReview')}</>;
    }

    if (status === 'error') {
      return <>{t('toolCards.codeReview.reviewFailed', { error: toolResult?.error || t('toolCards.codeReview.unknownError') })}</>;
    }

    return null;
  };

  const renderHeader = () => {
    return (
      <ToolCardHeader
        icon={null}
        iconClassName="code-review-icon"
        content={renderContent()}
        extra={(
          <>
            {hasData && (
              <Tooltip
                content={isExpanded ? t('toolCards.codeReview.collapseDetails') : t('toolCards.codeReview.expandDetails')}
                placement="top"
              >
                <button
                  className="preview-toggle-btn"
                  onClick={handleToggleExpand}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </Tooltip>
            )}
          </>
        )}
        statusIcon={getStatusIcon()}
      />
    );
  };

  const expandedContent = useMemo(() => {
    if (!reviewData) return null;

    const {
      summary,
      issues,
      positive_points,
      review_mode,
      review_scope,
    } = reviewData;
    const reviewers = reviewData.reviewers ?? [];
    const isFixActionDisabled = activeRemediationAction !== null || selectedRemediationCount === 0;

    return (
      <div className="code-review-details">
        <div className="review-summary">
          <div className="summary-header">{t('toolCards.codeReview.overallAssessment')}</div>
          <div className="summary-rows">
            <div className="summary-row">
              <span className="summary-label">{t('toolCards.codeReview.riskLevel')}</span>
              <span
                className="summary-value risk-level"
                style={{ color: riskLevelColors[summary.risk_level] }}
              >
                {getSeverityIcon(summary.risk_level)}
                <span>{t(`toolCards.codeReview.riskLevels.${summary.risk_level}`)}</span>
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">{t('toolCards.codeReview.recommendedAction')}</span>
              <span className="summary-value">{t(`toolCards.codeReview.actions.${summary.recommended_action}`)}</span>
            </div>
            {review_mode && (
              <div className="summary-row">
                <span className="summary-label">{t('toolCards.codeReview.reviewMode', { defaultValue: 'Review Mode' })}</span>
                <span className="summary-value">{t(`toolCards.codeReview.reviewModes.${review_mode}`, { defaultValue: review_mode })}</span>
              </div>
            )}
            {review_scope && (
              <div className="summary-row summary-row--full">
                <span className="summary-label">{t('toolCards.codeReview.reviewScope', { defaultValue: 'Scope' })}</span>
                <span className="summary-value">{review_scope}</span>
              </div>
            )}
            <div className="summary-row summary-row--full">
              <span className="summary-label">{t('toolCards.codeReview.overallAssessment')}</span>
              <span className="summary-value">{summary.overall_assessment}</span>
            </div>
            {summary.confidence_note && (
              <div className="summary-row summary-row--full">
                <span className="summary-label">{t('toolCards.codeReview.contextLimitations')}</span>
                <span className="summary-value note">{summary.confidence_note}</span>
              </div>
            )}
          </div>
        </div>

        {reviewers.length > 0 && (
          <div className="review-team">
            <div className="team-header">{t('toolCards.codeReview.reviewerTeam', { defaultValue: 'Review Team' })}</div>
            <div className="team-list">
              {reviewers.map((reviewer, index) => (
                <div key={`${reviewer.name}-${index}`} className="reviewer-item">
                  <div className="reviewer-topline">
                    <div className="reviewer-identity">
                      <span className="reviewer-name">{reviewer.name}</span>
                      <span className="reviewer-specialty">{reviewer.specialty}</span>
                    </div>
                    <div className="reviewer-metrics">
                      <span className="reviewer-status">{reviewer.status}</span>
                      <span className="reviewer-issues">
                        {typeof reviewer.issue_count === 'number'
                          ? t('toolCards.codeReview.reviewerIssues', {
                              count: reviewer.issue_count,
                              defaultValue: '{{count}} issues',
                            })
                          : t('toolCards.codeReview.reviewerIssuesUnknown', {
                              defaultValue: 'Issue count unavailable',
                            })}
                      </span>
                    </div>
                  </div>
                  <div className="reviewer-summary">{reviewer.summary}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="review-issues">
            <div className="issues-header">
              {t('toolCards.codeReview.issuesCount', { count: issues.length })}
            </div>
            <div className="issues-list">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`review-issue-item severity-${getSeverityClass(issue.severity)}`}
                >
                  <div className="issue-header">
                    <div className="issue-left">
                      {getSeverityIcon(issue.severity)}
                      <span className="issue-category">[{issue.category}]</span>
                      {issue.source_reviewer && (
                        <span className="issue-source">{issue.source_reviewer}</span>
                      )}
                      <span className="issue-location">
                        {issue.file}{issue.line ? `:${issue.line}` : ''}
                      </span>
                    </div>
                    <span className="issue-certainty">
                      {t(`toolCards.codeReview.certainties.${issue.certainty}`)}
                    </span>
                  </div>
                  <div className="issue-title">{issue.title}</div>
                  <div className="issue-description">{issue.description}</div>
                  {issue.validation_note && (
                    <div className="issue-validation-note">
                      {issue.validation_note}
                    </div>
                  )}
                  {issue.suggestion && (
                    <div className="issue-suggestion">
                      <span className="suggestion-label">{t('toolCards.codeReview.suggestion')}:</span>
                      <span className="suggestion-text">{issue.suggestion}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {remediationItems.length > 0 && (
          <div className="review-remediation">
            <div className="remediation-header-row">
              <div>
                <div className="remediation-header">
                  {t('toolCards.codeReview.remediationPlan', { defaultValue: 'Remediation Plan' })}
                </div>
                <div className="remediation-selection-count">
                  {t('toolCards.codeReview.remediationActions.selectionCount', {
                    selected: selectedRemediationCount,
                    total: remediationItems.length,
                    defaultValue: '{{selected}}/{{total}} selected',
                  })}
                </div>
              </div>
              {review_mode === 'deep' && !remediationActionsDismissed && (
                <Checkbox
                  className="remediation-select-all"
                  size="small"
                  checked={allRemediationSelected}
                  indeterminate={someRemediationSelected}
                  onChange={(event) => handleToggleAllRemediation(event.target.checked)}
                  label={t('toolCards.codeReview.remediationActions.selectAll', {
                    defaultValue: 'Select all',
                  })}
                />
              )}
            </div>
            <div className="remediation-list">
              {remediationItems.map((item) => {
                const issue = item.issue;
                const expanded = expandedRemediationIds.has(item.id);
                const selected = selectedRemediationIds.has(item.id);
                const location = issue?.file
                  ? `${issue.file}${issue.line ? `:${issue.line}` : ''}`
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`remediation-item ${selected ? 'is-selected' : ''}`}
                  >
                    <div className="remediation-item__topline">
                      {review_mode === 'deep' && !remediationActionsDismissed ? (
                        <Checkbox
                          className="remediation-item__checkbox"
                          size="small"
                          checked={selected}
                          onChange={(event) => handleToggleRemediation(item.id, event.target.checked)}
                          label={(
                            <span className="remediation-item__label">
                              <span className="remediation-index">{item.index + 1}</span>
                              <span>{item.plan}</span>
                            </span>
                          )}
                        />
                      ) : (
                        <span className="remediation-item__label">
                          <span className="remediation-index">{item.index + 1}</span>
                          <span>{item.plan}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        className="remediation-item__expand"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleRemediationDetails(item.id);
                        }}
                        aria-expanded={expanded}
                      >
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        <span>
                          {expanded
                            ? t('toolCards.codeReview.remediationActions.collapsePlan', {
                                defaultValue: 'Collapse',
                              })
                            : t('toolCards.codeReview.remediationActions.expandPlan', {
                                defaultValue: 'Details',
                              })}
                        </span>
                      </button>
                    </div>
                    {expanded && (
                      <div className="remediation-item__details">
                        {issue ? (
                          <>
                            <div className="remediation-detail-row">
                              <span>{t('toolCards.codeReview.remediationActions.relatedIssue', { defaultValue: 'Related issue' })}</span>
                              <strong>{issue.title}</strong>
                            </div>
                            <div className="remediation-detail-grid">
                              {issue.severity && (
                                <div>
                                  <span>{t('toolCards.codeReview.remediationActions.severity', { defaultValue: 'Severity' })}</span>
                                  <strong>{t(`toolCards.codeReview.severities.${issue.severity}`, { defaultValue: issue.severity })}</strong>
                                </div>
                              )}
                              {issue.certainty && (
                                <div>
                                  <span>{t('toolCards.codeReview.remediationActions.certainty', { defaultValue: 'Certainty' })}</span>
                                  <strong>{t(`toolCards.codeReview.certainties.${issue.certainty}`, { defaultValue: issue.certainty })}</strong>
                                </div>
                              )}
                              {location && (
                                <div>
                                  <span>{t('toolCards.codeReview.remediationActions.location', { defaultValue: 'Location' })}</span>
                                  <strong>{location}</strong>
                                </div>
                              )}
                            </div>
                            {issue.description && (
                              <p>{issue.description}</p>
                            )}
                            {issue.suggestion && (
                              <p className="remediation-item__suggestion">
                                <span>{t('toolCards.codeReview.suggestion')}:</span>
                                {issue.suggestion}
                              </p>
                            )}
                            {issue.validation_note && (
                              <p className="remediation-item__validation">{issue.validation_note}</p>
                            )}
                          </>
                        ) : (
                          <p>
                            {t('toolCards.codeReview.remediationActions.noRelatedIssue', {
                              defaultValue: 'No directly-linked issue was provided for this remediation item. Use the plan text itself as the implementation scope.',
                            })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {review_mode === 'deep' && !remediationActionsDismissed && selectedRemediationCount === 0 && (
              <div className="review-remediation-actions__empty-selection">
                {t('toolCards.codeReview.remediationActions.noSelectionHint', {
                  defaultValue: 'Select at least one remediation item to start fixing.',
                })}
              </div>
            )}
            {review_mode === 'deep' && !remediationActionsDismissed && (
              <div className="review-remediation-actions" onClick={(event) => event.stopPropagation()}>
                <div className="review-remediation-actions__copy">
                  <div className="review-remediation-actions__title">
                    {t('toolCards.codeReview.remediationActions.title', { defaultValue: 'Next steps' })}
                  </div>
                  <div className="review-remediation-actions__hint">
                    {t('toolCards.codeReview.remediationActions.hint', {
                      defaultValue: 'Deep Review is read-only by default. Select the remediation items to fix.',
                    })}
                  </div>
                </div>
                <div className="review-remediation-actions__buttons">
                  <Button
                    variant="primary"
                    size="small"
                    isLoading={activeRemediationAction === 'fix'}
                    disabled={isFixActionDisabled}
                    onClick={(event) => void handleStartFixing(event, false)}
                  >
                    {t('toolCards.codeReview.remediationActions.startFix', { defaultValue: 'Start fixing' })}
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    isLoading={activeRemediationAction === 'fix-review'}
                    disabled={isFixActionDisabled}
                    onClick={(event) => void handleStartFixing(event, true)}
                  >
                    {t('toolCards.codeReview.remediationActions.fixAndReview', { defaultValue: 'Fix and re-review' })}
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    disabled={activeRemediationAction !== null}
                    onClick={(event) => {
                      event.stopPropagation();
                      setRemediationActionsDismissed(true);
                    }}
                  >
                    {t('toolCards.codeReview.remediationActions.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {positive_points.length > 0 && (
          <div className="review-positive">
            <div className="positive-header">{t('toolCards.codeReview.codeStrengths')}</div>
            <div className="positive-list">
              {positive_points.map((point, index) => (
                <div key={index} className="positive-item">
                  <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    activeRemediationAction,
    allRemediationSelected,
    expandedRemediationIds,
    handleToggleAllRemediation,
    handleToggleRemediation,
    handleToggleRemediationDetails,
    handleStartFixing,
    remediationItems,
    remediationActionsDismissed,
    reviewData,
    selectedRemediationCount,
    selectedRemediationIds,
    someRemediationSelected,
    t,
  ]);

  const normalizedStatus = status === 'analyzing' ? 'running' : status;

  return (
    <div ref={cardRootRef} data-tool-card-id={toolId ?? ''}>
      <BaseToolCard
        status={normalizedStatus as 'pending' | 'preparing' | 'streaming' | 'running' | 'completed' | 'error' | 'cancelled'}
        isExpanded={isExpanded}
        onClick={handleCardClick}
        className="code-review-card"
        header={renderHeader()}
        expandedContent={expandedContent ?? undefined}
      />
    </div>
  );
});
