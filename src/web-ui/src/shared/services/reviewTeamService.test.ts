import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configAPI } from '@/infrastructure/api/service-api/ConfigAPI';
import {
  DEFAULT_REVIEW_TEAM_EXECUTION_POLICY,
  loadDefaultReviewTeamConfig,
} from './reviewTeamService';

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
});
