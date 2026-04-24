import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configAPI } from '@/infrastructure/api/service-api/ConfigAPI';
import {
  DEFAULT_REVIEW_TEAM_EXECUTION_POLICY,
  buildEffectiveReviewTeamManifest,
  buildReviewTeamPromptBlock,
  loadDefaultReviewTeamConfig,
  prepareDefaultReviewTeamForLaunch,
  resolveDefaultReviewTeam,
  type ReviewTeamStoredConfig,
} from './reviewTeamService';
import {
  SubagentAPI,
  type SubagentInfo,
} from '@/infrastructure/api/service-api/SubagentAPI';

vi.mock('@/infrastructure/api/service-api/ConfigAPI', () => ({
  configAPI: {
    getConfig: vi.fn(),
    setConfig: vi.fn(),
  },
}));

vi.mock('@/infrastructure/api/service-api/SubagentAPI', () => ({
  SubagentAPI: {
    listSubagents: vi.fn(),
    updateSubagentConfig: vi.fn(),
  },
}));

describe('reviewTeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const storedConfigWithExtra = (
    extraSubagentIds: string[] = [],
  ): ReviewTeamStoredConfig => ({
    extra_subagent_ids: extraSubagentIds,
    reviewer_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerTimeoutSeconds,
    judge_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.judgeTimeoutSeconds,
    auto_fix_enabled: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixEnabled,
    auto_fix_max_rounds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxRounds,
    auto_fix_max_stalled_rounds:
      DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxStalledRounds,
  });

  const subagent = (
    id: string,
    enabled = true,
    subagentSource: SubagentInfo['subagentSource'] = 'builtin',
  ): SubagentInfo => ({
    id,
    name: id,
    description: `${id} description`,
    isReadonly: true,
    toolCount: 1,
    defaultTools: ['Read'],
    enabled,
    subagentSource,
    model: 'fast',
  });

  const coreSubagents = (enabled = true): SubagentInfo[] => [
    subagent('ReviewBusinessLogic', enabled),
    subagent('ReviewPerformance', enabled),
    subagent('ReviewSecurity', enabled),
    subagent('ReviewJudge', enabled),
  ];

  it('falls back to defaults when the persisted review team path is missing', async () => {
    vi.mocked(configAPI.getConfig).mockRejectedValueOnce(
      new Error("Config path 'ai.review_teams.default' not found"),
    );

    await expect(loadDefaultReviewTeamConfig()).resolves.toEqual({
      extra_subagent_ids: [],
      reviewer_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerTimeoutSeconds,
      judge_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.judgeTimeoutSeconds,
      auto_fix_enabled: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixEnabled,
      auto_fix_max_rounds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxRounds,
      auto_fix_max_stalled_rounds:
        DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxStalledRounds,
    });
  });

  it('propagates config errors that are not missing review team config paths', async () => {
    const error = new Error('Config service unavailable');
    vi.mocked(configAPI.getConfig).mockRejectedValueOnce(error);

    await expect(loadDefaultReviewTeamConfig()).rejects.toThrow(error.message);
  });

  it('only force-enables locked core members before launch', async () => {
    vi.mocked(configAPI.getConfig).mockResolvedValue(
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );
    vi.mocked(SubagentAPI.listSubagents).mockResolvedValue([
      ...coreSubagents(false),
      subagent('ExtraEnabled', true, 'user'),
      subagent('ExtraDisabled', false, 'project'),
    ]);

    await prepareDefaultReviewTeamForLaunch('D:/workspace/project-a');

    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledTimes(4);
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewBusinessLogic',
      enabled: true,
      workspacePath: 'D:/workspace/project-a',
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewPerformance',
      enabled: true,
      workspacePath: 'D:/workspace/project-a',
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewSecurity',
      enabled: true,
      workspacePath: 'D:/workspace/project-a',
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewJudge',
      enabled: true,
      workspacePath: 'D:/workspace/project-a',
    });
    expect(SubagentAPI.updateSubagentConfig).not.toHaveBeenCalledWith(
      expect.objectContaining({ subagentId: 'ExtraEnabled' }),
    );
    expect(SubagentAPI.updateSubagentConfig).not.toHaveBeenCalledWith(
      expect.objectContaining({ subagentId: 'ExtraDisabled' }),
    );
  });

  it('excludes disabled extra members from the launch prompt', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user'),
        subagent('ExtraDisabled', false, 'project'),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const promptBlock = buildReviewTeamPromptBlock(team);

    expect(promptBlock).toContain('subagent_type: ExtraEnabled');
    expect(promptBlock).not.toContain('subagent_type: ExtraDisabled');
    expect(promptBlock).toContain('Always run the three locked reviewer roles');
    expect(promptBlock).not.toContain('Always run the four locked core reviewers');
  });

  it('builds an explicit run manifest for enabled, skipped, and quality-gate reviewers', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user'),
        subagent('ExtraDisabled', false, 'project'),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      workspacePath: 'D:/workspace/project-a',
      policySource: 'default-review-team-config',
    });

    expect(manifest.reviewMode).toBe('deep');
    expect(manifest.workspacePath).toBe('D:/workspace/project-a');
    expect(manifest.policySource).toBe('default-review-team-config');
    expect(manifest.coreReviewers.map((member) => member.subagentId)).toEqual([
      'ReviewBusinessLogic',
      'ReviewPerformance',
      'ReviewSecurity',
    ]);
    expect(manifest.qualityGateReviewer?.subagentId).toBe('ReviewJudge');
    expect(manifest.enabledExtraReviewers.map((member) => member.subagentId)).toEqual([
      'ExtraEnabled',
    ]);
    expect(manifest.skippedReviewers).toEqual([
      expect.objectContaining({
        subagentId: 'ExtraDisabled',
        reason: 'disabled',
      }),
    ]);
  });

  it('renders the run manifest without scheduling disabled extra reviewers', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user'),
        subagent('ExtraDisabled', false, 'project'),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const promptBlock = buildReviewTeamPromptBlock(
      team,
      buildEffectiveReviewTeamManifest(team, {
        workspacePath: 'D:/workspace/project-a',
      }),
    );

    expect(promptBlock).toContain('Run manifest:');
    expect(promptBlock).toContain('- workspace_path: D:/workspace/project-a');
    expect(promptBlock).toContain('quality_gate_reviewer: ReviewJudge');
    expect(promptBlock).toContain('enabled_extra_reviewers: ExtraEnabled');
    expect(promptBlock).toContain('skipped_reviewers:');
    expect(promptBlock).toContain('- ExtraDisabled: disabled');
    expect(promptBlock).not.toContain('subagent_type: ExtraDisabled');
  });
});
