import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  Gauge,
  GitBranch,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  ConfigPageLoading,
  NumberInput,
  Select,
  Switch,
} from '@/component-library';
import {
  ConfigPageContent,
  ConfigPageHeader,
  ConfigPageLayout,
  ConfigPageRow,
  ConfigPageSection,
} from '@/infrastructure/config/components/common';
import { ModelSelectionRadio } from '@/infrastructure/config/components/ModelSelectionRadio';
import type { AIModelConfig } from '@/infrastructure/config/types';
import { getModelDisplayName } from '@/infrastructure/config/services/modelConfigs';
import { configAPI } from '@/infrastructure/api/service-api/ConfigAPI';
import {
  SubagentAPI,
  type SubagentInfo,
  type SubagentSource,
} from '@/infrastructure/api/service-api/SubagentAPI';
import { useNotification } from '@/shared/notification-system';
import { useCurrentWorkspace } from '@/infrastructure/contexts/WorkspaceContext';
import { useAgentsStore } from '../agentsStore';
import {
  addDefaultReviewTeamMember,
  canAddSubagentToReviewTeam,
  DEFAULT_REVIEW_TEAM_EXECUTION_POLICY,
  DEFAULT_REVIEW_TEAM_MODEL,
  loadDefaultReviewTeam,
  removeDefaultReviewTeamMember,
  saveDefaultReviewTeamExecutionPolicy,
  type ReviewTeam,
  type ReviewTeamExecutionPolicy,
  type ReviewTeamMember,
} from '@/shared/services/reviewTeamService';
import '../AgentsView.scss';
import './ReviewTeamPage.scss';

function getMemberIcon(member: ReviewTeamMember) {
  switch (member.definitionKey) {
    case 'businessLogic':
      return GitBranch;
    case 'performance':
      return Gauge;
    case 'security':
      return Shield;
    case 'judge':
      return BadgeCheck;
    default:
      return Bot;
  }
}

function getSourceVariant(source: SubagentSource): 'neutral' | 'info' | 'purple' {
  if (source === 'user') {
    return 'info';
  }
  if (source === 'project') {
    return 'purple';
  }
  return 'neutral';
}

const ReviewTeamPage: React.FC = () => {
  const { t } = useTranslation('scenes/agents');
  const { t: tModel } = useTranslation('settings/default-model');
  const { openHome } = useAgentsStore();
  const { workspacePath } = useCurrentWorkspace();
  const { error: notifyError, success: notifySuccess } = useNotification();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<ReviewTeam | null>(null);
  const [models, setModels] = useState<AIModelConfig[]>([]);
  const [subagents, setSubagents] = useState<SubagentInfo[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState('');
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [savingPolicyKey, setSavingPolicyKey] = useState<keyof ReviewTeamExecutionPolicy | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedTeam, loadedModels, loadedSubagents] = await Promise.all([
        loadDefaultReviewTeam(workspacePath || undefined),
        configAPI.getConfig('ai.models'),
        SubagentAPI.listSubagents({ workspacePath: workspacePath || undefined }),
      ]);

      setTeam(loadedTeam);
      setModels(Array.isArray(loadedModels) ? loadedModels as AIModelConfig[] : []);
      setSubagents(loadedSubagents);
      setSelectedMemberId((currentId) => {
        if (currentId && loadedTeam.members.some((member) => member.id === currentId)) {
          return currentId;
        }
        return loadedTeam.members[0]?.id ?? null;
      });
    } catch (error) {
      setTeam({
        id: 'default-review-team',
        name: 'Default Review Team',
        description: '',
        warning: t('reviewTeams.detail.warning', {
          defaultValue:
            'Deep review runs locally, may take longer, and usually consumes more tokens than a standard review.',
        }),
        executionPolicy: { ...DEFAULT_REVIEW_TEAM_EXECUTION_POLICY },
        members: [],
        coreMembers: [],
        extraMembers: [],
      });
      setModels([]);
      setSubagents([]);
      notifyError(
        error instanceof Error
          ? error.message
          : t('reviewTeams.detail.messages.saveFailed', {
            defaultValue: 'Failed to save the review team configuration.',
          }),
      );
    } finally {
      setLoading(false);
    }
  }, [notifyError, t, workspacePath]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedMember = useMemo(() => {
    if (!team) {
      return null;
    }
    return team.members.find((member) => member.id === selectedMemberId) ?? team.members[0] ?? null;
  }, [selectedMemberId, team]);

  const getLocalizedMemberName = useCallback((member: ReviewTeamMember): string => {
    if (!member.definitionKey) {
      return member.displayName;
    }
    return t(`reviewTeams.members.${member.definitionKey}.funName`, {
      defaultValue: member.displayName,
    });
  }, [t]);

  const getLocalizedMemberRole = useCallback((member: ReviewTeamMember): string => {
    if (!member.definitionKey) {
      return t('reviewTeams.extraReviewer.role', {
        defaultValue: member.roleName,
      });
    }
    return t(`reviewTeams.members.${member.definitionKey}.role`, {
      defaultValue: member.roleName,
    });
  }, [t]);

  const getLocalizedMemberDescription = useCallback((member: ReviewTeamMember): string => {
    if (!member.definitionKey) {
      return t('reviewTeams.extraReviewer.description', {
        defaultValue: member.description,
      });
    }
    return t(`reviewTeams.members.${member.definitionKey}.description`, {
      defaultValue: member.description,
    });
  }, [t]);

  const getLocalizedResponsibilities = useCallback((member: ReviewTeamMember): string[] => {
    if (!member.definitionKey) {
      return member.responsibilities.map((item, index) => t(
        `reviewTeams.extraReviewer.responsibilities.${index}`,
        { defaultValue: item },
      ));
    }

    return member.responsibilities.map((item, index) => t(
      `reviewTeams.members.${member.definitionKey}.responsibilities.${index}`,
      { defaultValue: item },
    ));
  }, [t]);

  const formatModelLabel = useCallback((modelId: string): string => {
    if (!modelId || modelId === DEFAULT_REVIEW_TEAM_MODEL) {
      return tModel('selection.fast', { defaultValue: 'Fast' });
    }
    if (modelId === 'primary') {
      return tModel('selection.primary', { defaultValue: 'Primary' });
    }

    const match = models.find((model) => model.id === modelId);
    return match ? getModelDisplayName(match) : modelId;
  }, [models, tModel]);

  const extraCandidates = useMemo(() => {
    if (!team) {
      return [];
    }
    const existingIds = new Set(team.members.map((member) => member.subagentId));

    return subagents
      .filter((subagent) => !existingIds.has(subagent.id))
      .filter((subagent) => canAddSubagentToReviewTeam(subagent.id))
      .sort((left, right) =>
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
      );
  }, [subagents, team]);

  useEffect(() => {
    if (extraCandidates.length === 0) {
      setCandidateId('');
      return;
    }

    setCandidateId((currentId) => {
      if (currentId && extraCandidates.some((candidate) => candidate.id === currentId)) {
        return currentId;
      }
      return extraCandidates[0]?.id ?? '';
    });
  }, [extraCandidates]);

  const handleModelChange = useCallback(async (member: ReviewTeamMember, modelId: string) => {
    setSavingMemberId(member.id);
    try {
      await SubagentAPI.updateSubagentConfig({
        subagentId: member.subagentId,
        enabled: true,
        model: modelId,
        workspacePath: workspacePath || undefined,
      });
      notifySuccess(
        t('reviewTeams.detail.messages.modelUpdated', {
          name: getLocalizedMemberName(member),
          defaultValue: `Updated ${getLocalizedMemberName(member)} model.`,
        }),
      );
      await loadData();
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : t('reviewTeams.detail.messages.saveFailed', {
            defaultValue: 'Failed to save the review team configuration.',
          }),
      );
    } finally {
      setSavingMemberId(null);
    }
  }, [getLocalizedMemberName, loadData, notifyError, notifySuccess, t, workspacePath]);

  const handleAddMember = useCallback(async () => {
    if (!candidateId) {
      return;
    }

    setAddingMember(true);
    try {
      await addDefaultReviewTeamMember(candidateId);
      await SubagentAPI.updateSubagentConfig({
        subagentId: candidateId,
        enabled: true,
        workspacePath: workspacePath || undefined,
      });
      await loadData();
      setSelectedMemberId(`extra:${candidateId}`);
      notifySuccess(
        t('reviewTeams.detail.messages.memberAdded', {
          defaultValue: 'Added the extra reviewer to the team.',
        }),
      );
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : t('reviewTeams.detail.messages.saveFailed', {
            defaultValue: 'Failed to save the review team configuration.',
          }),
      );
    } finally {
      setAddingMember(false);
    }
  }, [candidateId, loadData, notifyError, notifySuccess, t, workspacePath]);

  const handleRemoveMember = useCallback(async (member: ReviewTeamMember) => {
    if (member.locked) {
      return;
    }

    setRemovingMemberId(member.id);
    try {
      await removeDefaultReviewTeamMember(member.subagentId);
      await loadData();
      setSelectedMemberId((currentId) => (currentId === member.id ? null : currentId));
      notifySuccess(
        t('reviewTeams.detail.messages.memberRemoved', {
          defaultValue: 'Removed the extra reviewer from the team.',
        }),
      );
    } catch (error) {
      notifyError(
        error instanceof Error
          ? error.message
          : t('reviewTeams.detail.messages.saveFailed', {
            defaultValue: 'Failed to save the review team configuration.',
          }),
      );
    } finally {
      setRemovingMemberId(null);
    }
  }, [loadData, notifyError, notifySuccess, t]);

  const handleExecutionPolicyChange = useCallback(async (
    key: keyof ReviewTeamExecutionPolicy,
    value: ReviewTeamExecutionPolicy[keyof ReviewTeamExecutionPolicy],
  ) => {
    if (!team) {
      return;
    }

    const nextPolicy: ReviewTeamExecutionPolicy = {
      ...team.executionPolicy,
      [key]: value,
    };

    setSavingPolicyKey(key);
    setTeam((current) => (current ? { ...current, executionPolicy: nextPolicy } : current));

    try {
      await saveDefaultReviewTeamExecutionPolicy(nextPolicy);
      await loadData();
    } catch (error) {
      await loadData();
      notifyError(
        error instanceof Error
          ? error.message
          : t('reviewTeams.detail.messages.saveFailed', {
            defaultValue: 'Failed to save the review team configuration.',
          }),
      );
    } finally {
      setSavingPolicyKey(null);
    }
  }, [loadData, notifyError, t, team]);

  if (loading || !team) {
    return (
      <ConfigPageLayout className="review-team-page">
        <ConfigPageLoading
          text={t('reviewTeams.detail.loading', {
            defaultValue: 'Loading review team...',
          })}
        />
      </ConfigPageLayout>
    );
  }

  const selectedResponsibilities = selectedMember
    ? getLocalizedResponsibilities(selectedMember)
    : [];
  const selectedIcon = selectedMember ? getMemberIcon(selectedMember) : Bot;
  const SelectedIcon = selectedIcon;

  return (
    <ConfigPageLayout className="review-team-page">
      <ConfigPageHeader
        title={t('reviewTeams.detail.title', {
          defaultValue: 'Default Review Team',
        })}
        subtitle={t('reviewTeams.detail.subtitle', {
          defaultValue:
            'Configure the local deep-review team used by Deep Review and /deepreview. Every reviewer starts on the Fast model unless you change it.',
        })}
        extra={(
          <Button variant="secondary" size="small" onClick={openHome}>
            <ArrowLeft size={14} style={{ marginRight: 6 }} />
            {t('reviewTeams.detail.back', {
              defaultValue: 'Back to Agents',
            })}
          </Button>
        )}
      />

      <ConfigPageContent>
        <ConfigPageSection
          title={t('reviewTeams.detail.summaryTitle', {
            defaultValue: 'Team Overview',
          })}
          description={t('reviewTeams.detail.summaryDescription', {
            defaultValue:
              'The default review team runs locally, launches reviewers in parallel, and always finishes with a quality-gate pass.',
          })}
          titleSuffix={(
            <Badge variant="neutral">
              {t('reviewTeams.detail.membersCount', {
                count: team.members.length,
                defaultValue: `${team.members.length} members`,
              })}
            </Badge>
          )}
        >
          <div className="review-team-page__summary-grid">
            <div className="review-team-page__summary-card">
              <span className="review-team-page__summary-kicker">
                {t('reviewTeams.detail.localOnly', {
                  defaultValue: 'Local only',
                })}
              </span>
              <p className="review-team-page__summary-value">
                {t('reviewTeams.detail.localOnlyDescription', {
                  defaultValue:
                    'All reviewers run inside the local BitFun session. No cloud review workers are involved.',
                })}
              </p>
            </div>

            <div className="review-team-page__summary-card">
              <span className="review-team-page__summary-kicker">
                {t('reviewTeams.detail.parallelLabel', {
                  defaultValue: 'Parallel reviewers',
                })}
              </span>
              <p className="review-team-page__summary-value">
                {t('reviewTeams.detail.parallelDescription', {
                  defaultValue:
                    'Business logic, performance, security, and any extra reviewers run concurrently before the judge verifies them.',
                })}
              </p>
            </div>

            <div className="review-team-page__summary-card review-team-page__summary-card--warning">
              <span className="review-team-page__summary-kicker">
                {t('reviewTeams.detail.warningLabel', {
                  defaultValue: 'Longer and heavier',
                })}
              </span>
              <p className="review-team-page__summary-value">
                {t('reviewTeams.detail.warning', {
                  defaultValue: team.warning,
                })}
              </p>
            </div>
          </div>
        </ConfigPageSection>

        <ConfigPageSection
          title={t('reviewTeams.detail.executionPolicyTitle', {
            defaultValue: 'Execution Policy',
          })}
          description={t('reviewTeams.detail.executionPolicyDescription', {
            defaultValue:
              'Control reviewer timeouts, whether validated issues trigger automatic fixes, and when the review-fix loop should stop instead of spinning forever.',
          })}
        >
          <ConfigPageRow
            label={t('reviewTeams.detail.reviewerTimeout', {
              defaultValue: 'Reviewer timeout',
            })}
            description={t('reviewTeams.detail.reviewerTimeoutDescription', {
              defaultValue:
                'Per-reviewer timeout in seconds. Set 0 to disable and let reviewers run without a hard deadline.',
            })}
            align="center"
            balanced
          >
            <NumberInput
              value={team.executionPolicy.reviewerTimeoutSeconds}
              onChange={(value) => void handleExecutionPolicyChange('reviewerTimeoutSeconds', value)}
              min={0}
              max={3600}
              step={30}
              unit={t('reviewTeams.detail.seconds', {
                defaultValue: 's',
              })}
              size="small"
              disabled={savingPolicyKey === 'reviewerTimeoutSeconds'}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('reviewTeams.detail.judgeTimeout', {
              defaultValue: 'Judge timeout',
            })}
            description={t('reviewTeams.detail.judgeTimeoutDescription', {
              defaultValue:
                'Quality-gate timeout in seconds. Set 0 to disable and wait as long as needed for the judge.',
            })}
            align="center"
            balanced
          >
            <NumberInput
              value={team.executionPolicy.judgeTimeoutSeconds}
              onChange={(value) => void handleExecutionPolicyChange('judgeTimeoutSeconds', value)}
              min={0}
              max={3600}
              step={30}
              unit={t('reviewTeams.detail.seconds', {
                defaultValue: 's',
              })}
              size="small"
              disabled={savingPolicyKey === 'judgeTimeoutSeconds'}
            />
          </ConfigPageRow>

          <ConfigPageRow
            label={t('reviewTeams.detail.autoFixEnabled', {
              defaultValue: 'Auto-fix validated issues',
            })}
            description={t('reviewTeams.detail.autoFixEnabledDescription', {
              defaultValue:
                'When enabled, deep review will attempt minimal safe fixes for validated findings and then rerun the review team incrementally.',
            })}
            align="center"
          >
            <div className="review-team-page__row-control">
              <Switch
                checked={team.executionPolicy.autoFixEnabled}
                onChange={(event) => void handleExecutionPolicyChange('autoFixEnabled', event.target.checked)}
                size="small"
                disabled={savingPolicyKey === 'autoFixEnabled'}
              />
            </div>
          </ConfigPageRow>

          <div className="review-team-page__execution-grid">
            <div className="review-team-page__execution-card">
              <span className="review-team-page__block-label">
                {t('reviewTeams.detail.autoFixRounds', {
                  defaultValue: 'Max fix-review rounds',
                })}
              </span>
              <p className="review-team-page__execution-copy">
                {t('reviewTeams.detail.autoFixRoundsDescription', {
                  defaultValue:
                    'Upper bound for full auto-fix + incremental re-review cycles before the workflow stops and reports back.',
                })}
              </p>
              <NumberInput
                value={team.executionPolicy.autoFixMaxRounds}
                onChange={(value) => void handleExecutionPolicyChange('autoFixMaxRounds', value)}
                min={1}
                max={5}
                step={1}
                size="small"
                disabled={savingPolicyKey === 'autoFixMaxRounds'}
              />
            </div>

            <div className="review-team-page__execution-card">
              <span className="review-team-page__block-label">
                {t('reviewTeams.detail.autoFixStalledRounds', {
                  defaultValue: 'Max stalled rounds',
                })}
              </span>
              <p className="review-team-page__execution-copy">
                {t('reviewTeams.detail.autoFixStalledRoundsDescription', {
                  defaultValue:
                    'How many consecutive incremental review cycles may fail to reduce the issue count before the loop is stopped as non-converging.',
                })}
              </p>
              <NumberInput
                value={team.executionPolicy.autoFixMaxStalledRounds}
                onChange={(value) => void handleExecutionPolicyChange('autoFixMaxStalledRounds', value)}
                min={1}
                max={5}
                step={1}
                size="small"
                disabled={savingPolicyKey === 'autoFixMaxStalledRounds'}
              />
            </div>
          </div>
        </ConfigPageSection>

        <ConfigPageSection
          title={t('reviewTeams.detail.membersTitle', {
            defaultValue: 'Team Members',
          })}
          description={t('reviewTeams.detail.membersDescription', {
            defaultValue:
              'Click a member to inspect its role, responsibilities, and model. Locked roles always stay in the team.',
          })}
          extra={(
            <div className="review-team-page__section-badges">
              <Badge variant="info">
                {t('reviewTeams.detail.lockedCount', {
                  count: team.coreMembers.length,
                  defaultValue: `${team.coreMembers.length} locked roles`,
                })}
              </Badge>
              <Badge variant="neutral">
                {t('reviewTeams.detail.extraCount', {
                  count: team.extraMembers.length,
                  defaultValue: `${team.extraMembers.length} extra Sub-Agents`,
                })}
              </Badge>
            </div>
          )}
        >
          <div className="review-team-page__member-grid">
            {team.members.map((member) => {
              const MemberIcon = getMemberIcon(member);
              const isSelected = selectedMember?.id === member.id;

              return (
                <button
                  key={member.id}
                  type="button"
                  className={`review-team-page__member-card${isSelected ? ' is-selected' : ''}`}
                  style={{ '--member-accent': member.accentColor } as React.CSSProperties}
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div className="review-team-page__member-card-icon">
                    <MemberIcon size={16} strokeWidth={1.9} />
                  </div>

                  <div className="review-team-page__member-card-body">
                    <div className="review-team-page__member-card-top">
                      <span className="review-team-page__member-card-name">
                        {getLocalizedMemberName(member)}
                      </span>
                      <div className="review-team-page__member-card-badges">
                        {member.locked ? (
                          <Badge variant="neutral">
                            <Lock size={10} />
                            {t('reviewTeams.detail.memberTypes.locked', {
                              defaultValue: 'Locked',
                            })}
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            {t('reviewTeams.detail.memberTypes.extra', {
                              defaultValue: 'Extra Sub-Agent',
                            })}
                          </Badge>
                        )}
                        <Badge variant={getSourceVariant(member.subagentSource)}>
                          {t(`reviewTeams.detail.memberTypes.${member.subagentSource}`, {
                            defaultValue: member.subagentSource,
                          })}
                        </Badge>
                      </div>
                    </div>

                    <span className="review-team-page__member-card-role">
                      {getLocalizedMemberRole(member)}
                    </span>
                    <p className="review-team-page__member-card-description">
                      {getLocalizedMemberDescription(member)}
                    </p>
                    <span className="review-team-page__member-card-model">
                      {formatModelLabel(member.model)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </ConfigPageSection>

        {selectedMember ? (
          <ConfigPageSection
            title={t('reviewTeams.detail.memberDetailTitle', {
              defaultValue: 'Member Detail',
            })}
            description={t('reviewTeams.detail.memberDetailDescription', {
              defaultValue:
                'The selected reviewer keeps an isolated context when the review team runs.',
            })}
          >
            <div className="review-team-page__detail-hero">
              <div
                className="review-team-page__detail-icon"
                style={{ '--member-accent': selectedMember.accentColor } as React.CSSProperties}
              >
                <SelectedIcon size={18} strokeWidth={1.9} />
              </div>

              <div className="review-team-page__detail-copy">
                <div className="review-team-page__detail-title-row">
                  <div>
                    <h3 className="review-team-page__detail-name">
                      {getLocalizedMemberName(selectedMember)}
                    </h3>
                    <p className="review-team-page__detail-role">
                      {getLocalizedMemberRole(selectedMember)}
                    </p>
                  </div>

                  <div className="review-team-page__detail-badges">
                    <Badge variant="accent">{formatModelLabel(selectedMember.model)}</Badge>
                    {selectedMember.locked ? (
                      <Badge variant="neutral">
                        {t('reviewTeams.detail.memberTypes.core', {
                          defaultValue: 'Core role',
                        })}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <p className="review-team-page__detail-description">
                  {getLocalizedMemberDescription(selectedMember)}
                </p>
              </div>
            </div>

            <div className="review-team-page__responsibilities">
              <span className="review-team-page__block-label">
                {t('reviewTeams.detail.responsibilities', {
                  defaultValue: 'Responsibilities',
                })}
              </span>
              <ul className="review-team-page__responsibility-list">
                {selectedResponsibilities.map((item) => (
                  <li key={item} className="review-team-page__responsibility-item">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <ConfigPageRow
              label={t('reviewTeams.detail.model', {
                defaultValue: 'Assigned model',
              })}
              description={t('reviewTeams.detail.modelDescription', {
                defaultValue:
                  'Change the model for this reviewer only. Deep review uses Fast by default, and your update applies immediately.',
              })}
              multiline
            >
              <div className="review-team-page__model-picker">
                <ModelSelectionRadio
                  value={selectedMember.model || DEFAULT_REVIEW_TEAM_MODEL}
                  models={models}
                  layout="vertical"
                  size="small"
                  disabled={savingMemberId === selectedMember.id}
                  onChange={(modelId) => void handleModelChange(selectedMember, modelId)}
                />
              </div>
            </ConfigPageRow>

            {!selectedMember.locked ? (
              <ConfigPageRow
                label={t('reviewTeams.detail.remove', {
                  defaultValue: 'Remove member',
                })}
                description={t('reviewTeams.detail.removeDescription', {
                  defaultValue:
                    'Remove this extra Sub-Agent from the review team. Core roles cannot be removed.',
                })}
                align="center"
                balanced
              >
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => void handleRemoveMember(selectedMember)}
                  disabled={removingMemberId === selectedMember.id}
                >
                  <Trash2 size={12} style={{ marginRight: 6 }} />
                  {t('reviewTeams.detail.remove', {
                    defaultValue: 'Remove member',
                  })}
                </Button>
              </ConfigPageRow>
            ) : null}
          </ConfigPageSection>
        ) : null}

        <ConfigPageSection
          title={t('reviewTeams.detail.addTitle', {
            defaultValue: 'Add Extra Sub-Agent',
          })}
          description={t('reviewTeams.detail.addDescription', {
            defaultValue:
              'Bring another Sub-Agent into the deep review team. The four core roles always remain locked in place.',
          })}
        >
          <ConfigPageRow
            label={t('reviewTeams.detail.addLabel', {
              defaultValue: 'Candidate',
            })}
            description={t('reviewTeams.detail.addHint', {
              defaultValue:
                'Extra members join the parallel review pass and are checked by the quality inspector before final reporting.',
            })}
            multiline
          >
            <div className="review-team-page__add-controls">
              <Select
                value={candidateId}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setCandidateId(String(value[0] || ''));
                    return;
                  }
                  setCandidateId(String(value));
                }}
                size="small"
                disabled={extraCandidates.length === 0 || addingMember}
                placeholder={t('reviewTeams.detail.addPlaceholder', {
                  defaultValue: 'Select a Sub-Agent',
                })}
                options={extraCandidates.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.name} · ${t(`reviewTeams.detail.memberTypes.${candidate.subagentSource ?? 'builtin'}`, {
                    defaultValue: candidate.subagentSource ?? 'builtin',
                  })}`,
                }))}
              />

              <Button
                variant="primary"
                size="small"
                onClick={() => void handleAddMember()}
                disabled={!candidateId || extraCandidates.length === 0 || addingMember}
              >
                <Plus size={12} style={{ marginRight: 6 }} />
                {t('reviewTeams.detail.addButton', {
                  defaultValue: 'Add to team',
                })}
              </Button>
            </div>

            {extraCandidates.length === 0 ? (
              <p className="review-team-page__empty-candidate">
                <Sparkles size={14} />
                <span>
                  {t('reviewTeams.detail.emptyCandidates', {
                    defaultValue: 'No additional Sub-Agents are available to add right now.',
                  })}
                </span>
              </p>
            ) : null}
          </ConfigPageRow>
        </ConfigPageSection>
      </ConfigPageContent>
    </ConfigPageLayout>
  );
};

export default ReviewTeamPage;
