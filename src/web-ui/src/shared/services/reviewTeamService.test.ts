import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configAPI } from '@/infrastructure/api/service-api/ConfigAPI';
import {
  DEFAULT_REVIEW_TEAM_EXECUTION_POLICY,
  DEFAULT_REVIEW_TEAM_STRATEGY_LEVEL,
  REVIEW_STRATEGY_DEFINITIONS,
  buildEffectiveReviewTeamManifest,
  buildReviewTeamPromptBlock,
  canUseSubagentAsReviewTeamMember,
  loadDefaultReviewTeamConfig,
  prepareDefaultReviewTeamForLaunch,
  resolveDefaultReviewTeam,
  type ReviewTeamStoredConfig,
} from './reviewTeamService';
import {
  SubagentAPI,
  type SubagentInfo,
} from '@/infrastructure/api/service-api/SubagentAPI';
import {
  classifyReviewTargetFromFiles,
  createUnknownReviewTargetClassification,
} from './reviewTargetClassifier';

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

  const WORKSPACE_PATH = '/test-fixtures/project-a';

  const storedConfigWithExtra = (
    extraSubagentIds: string[] = [],
    overrides: Partial<ReviewTeamStoredConfig> = {},
  ): ReviewTeamStoredConfig => ({
    extra_subagent_ids: extraSubagentIds,
    strategy_level: DEFAULT_REVIEW_TEAM_STRATEGY_LEVEL,
    member_strategy_overrides: {},
    reviewer_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerTimeoutSeconds,
    judge_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.judgeTimeoutSeconds,
    reviewer_file_split_threshold: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerFileSplitThreshold,
    max_same_role_instances: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.maxSameRoleInstances,
    ...overrides,
  });

  const subagent = (
    id: string,
    enabled = true,
    subagentSource: SubagentInfo['subagentSource'] = 'builtin',
    model = 'fast',
    isReadonly = true,
    isReview = id.startsWith('Review'),
    defaultTools = ['GetFileDiff', 'Read', 'Grep', 'Glob', 'LS'],
  ): SubagentInfo => ({
    id,
    name: id,
    description: `${id} description`,
    isReadonly,
    isReview,
    toolCount: defaultTools.length,
    defaultTools,
    enabled,
    subagentSource,
    model,
  });

  const coreSubagents = (enabled = true): SubagentInfo[] => [
    subagent('ReviewBusinessLogic', enabled),
    subagent('ReviewPerformance', enabled),
    subagent('ReviewSecurity', enabled),
    subagent('ReviewArchitecture', enabled),
    subagent('ReviewFrontend', enabled),
    subagent('ReviewJudge', enabled),
  ];

  it('falls back to defaults when the persisted review team path is missing', async () => {
    vi.mocked(configAPI.getConfig).mockRejectedValueOnce(
      new Error("Config path 'ai.review_teams.default' not found"),
    );

    await expect(loadDefaultReviewTeamConfig()).resolves.toEqual({
      extra_subagent_ids: [],
      strategy_level: 'normal',
      member_strategy_overrides: {},
      reviewer_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerTimeoutSeconds,
      judge_timeout_seconds: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.judgeTimeoutSeconds,
      reviewer_file_split_threshold: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerFileSplitThreshold,
      max_same_role_instances: DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.maxSameRoleInstances,
    });
  });

  it('defaults deep review launches to read-only mode without automatic fixing', async () => {
    vi.mocked(configAPI.getConfig).mockRejectedValueOnce(
      new Error("Config path 'ai.review_teams.default' not found"),
    );

    const config = await loadDefaultReviewTeamConfig();

    expect(config.strategy_level).toBe('normal');
  });

  it('normalizes team strategy and member strategy overrides', async () => {
    vi.mocked(configAPI.getConfig).mockResolvedValueOnce({
      extra_subagent_ids: ['ExtraOne'],
      strategy_level: 'deep',
      member_strategy_overrides: {
        ReviewSecurity: 'quick',
        ReviewJudge: 'deep',
        ExtraOne: 'normal',
        ExtraTwo: 'invalid',
      },
    });

    await expect(loadDefaultReviewTeamConfig()).resolves.toMatchObject({
      strategy_level: 'deep',
      member_strategy_overrides: {
        ReviewSecurity: 'quick',
        ReviewJudge: 'deep',
        ExtraOne: 'normal',
      },
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
      subagent('ExtraEnabled', true, 'user', 'fast', true, true),
      subagent('ExtraDisabled', false, 'project', 'fast', true, true),
    ]);

    await prepareDefaultReviewTeamForLaunch(WORKSPACE_PATH);

    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledTimes(6);
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewBusinessLogic',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewPerformance',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewSecurity',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewArchitecture',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewFrontend',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
    });
    expect(SubagentAPI.updateSubagentConfig).toHaveBeenCalledWith({
      subagentId: 'ReviewJudge',
      enabled: true,
      workspacePath: WORKSPACE_PATH,
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
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
        subagent('ExtraDisabled', false, 'project', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const promptBlock = buildReviewTeamPromptBlock(team);

    expect(promptBlock).toContain('subagent_type: ExtraEnabled');
    expect(promptBlock).not.toContain('subagent_type: ExtraDisabled');
    expect(promptBlock).toContain('Always run the four locked core reviewer roles');
    expect(promptBlock).not.toContain('Always run the three locked reviewer roles');
  });

  it('keeps invalid configured extra members explainable in the run manifest', () => {
    const readonlyReviewExtra = subagent('ExtraReadonlyReview', true, 'user', 'fast', true, true);
    const readonlyPlainExtra = subagent('ExtraReadonlyPlain', true, 'user', 'fast', true, false);
    const writableReviewExtra = subagent('ExtraWritableReview', true, 'project', 'fast', false, true);

    expect(canUseSubagentAsReviewTeamMember(readonlyReviewExtra)).toBe(true);
    expect(canUseSubagentAsReviewTeamMember(readonlyPlainExtra)).toBe(false);
    expect(canUseSubagentAsReviewTeamMember(writableReviewExtra)).toBe(false);

    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        readonlyReviewExtra,
        readonlyPlainExtra,
        writableReviewExtra,
      ],
      storedConfigWithExtra([
        'ExtraReadonlyReview',
        'ExtraReadonlyPlain',
        'ExtraWritableReview',
        'ExtraMissingReviewer',
      ]),
    );

    expect(
      team.extraMembers
        .filter((member) => member.available)
        .map((member) => member.subagentId),
    ).toEqual(['ExtraReadonlyReview']);

    const manifest = buildEffectiveReviewTeamManifest(team);

    expect(manifest.skippedReviewers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subagentId: 'ExtraReadonlyPlain',
          reason: 'invalid_tooling',
        }),
        expect.objectContaining({
          subagentId: 'ExtraWritableReview',
          reason: 'invalid_tooling',
        }),
        expect.objectContaining({
          subagentId: 'ExtraMissingReviewer',
          reason: 'unavailable',
        }),
      ]),
    );

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('subagent_type: ExtraReadonlyReview');
    expect(promptBlock).toContain('- ExtraReadonlyPlain: invalid_tooling');
    expect(promptBlock).toContain('- ExtraWritableReview: invalid_tooling');
    expect(promptBlock).toContain('- ExtraMissingReviewer: unavailable');
    expect(promptBlock).not.toContain('subagent_type: ExtraReadonlyPlain');
    expect(promptBlock).not.toContain('subagent_type: ExtraWritableReview');
    expect(promptBlock).not.toContain('subagent_type: ExtraMissingReviewer');
  });

  it('requires extra review members to have the minimum review tools', () => {
    const readyReviewExtra = subagent('ExtraReadyReview', true, 'user', 'fast', true, true);
    const missingDiffExtra = subagent(
      'ExtraMissingDiff',
      true,
      'user',
      'fast',
      true,
      true,
      ['Read', 'Grep'],
    );
    const missingReadExtra = subagent(
      'ExtraMissingRead',
      true,
      'project',
      'fast',
      true,
      true,
      ['GetFileDiff', 'Grep'],
    );

    expect(canUseSubagentAsReviewTeamMember(readyReviewExtra)).toBe(true);
    expect(canUseSubagentAsReviewTeamMember(missingDiffExtra)).toBe(false);
    expect(canUseSubagentAsReviewTeamMember(missingReadExtra)).toBe(false);

    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        readyReviewExtra,
        missingDiffExtra,
        missingReadExtra,
      ],
      storedConfigWithExtra(['ExtraReadyReview', 'ExtraMissingDiff', 'ExtraMissingRead']),
    );

    expect(
      team.extraMembers
        .filter((member) => member.available)
        .map((member) => member.subagentId),
    ).toEqual(['ExtraReadyReview']);

    const manifest = buildEffectiveReviewTeamManifest(team);

    expect(manifest.enabledExtraReviewers.map((member) => member.subagentId)).toEqual([
      'ExtraReadyReview',
    ]);
    expect(manifest.skippedReviewers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subagentId: 'ExtraMissingDiff',
          reason: 'invalid_tooling',
        }),
        expect.objectContaining({
          subagentId: 'ExtraMissingRead',
          reason: 'invalid_tooling',
        }),
      ]),
    );

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('- ExtraMissingDiff: invalid_tooling');
    expect(promptBlock).toContain('- ExtraMissingRead: invalid_tooling');
    expect(promptBlock).not.toContain('subagent_type: ExtraMissingDiff');
    expect(promptBlock).not.toContain('subagent_type: ExtraMissingRead');
  });

  it('builds an explicit run manifest for enabled, skipped, and quality-gate reviewers', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
        subagent('ExtraDisabled', false, 'project', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      workspacePath: WORKSPACE_PATH,
      policySource: 'default-review-team-config',
    });

    expect(manifest.reviewMode).toBe('deep');
    expect(manifest.strategyLevel).toBe('normal');
    expect(manifest.workspacePath).toBe(WORKSPACE_PATH);
    expect(manifest.policySource).toBe('default-review-team-config');
    expect(manifest.coreReviewers.map((member) => member.subagentId)).toEqual([
      'ReviewBusinessLogic',
      'ReviewPerformance',
      'ReviewSecurity',
      'ReviewArchitecture',
      'ReviewFrontend',
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

  it('generates structured work packets for active reviewers and the judge', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled']),
    );
    const target = classifyReviewTargetFromFiles(
      ['src/web-ui/src/components/ReviewPanel.tsx'],
      'session_files',
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      workspacePath: WORKSPACE_PATH,
      target,
    });

    const logicPacket = manifest.workPackets?.find(
      (packet) => packet.subagentId === 'ReviewBusinessLogic',
    );
    const judgePacket = manifest.workPackets?.find(
      (packet) => packet.subagentId === 'ReviewJudge',
    );

    expect(logicPacket).toMatchObject({
      packetId: 'reviewer:ReviewBusinessLogic',
      phase: 'reviewer',
      subagentId: 'ReviewBusinessLogic',
      roleName: 'Business Logic Reviewer',
      assignedScope: {
        kind: 'review_target',
        fileCount: 1,
        files: ['src/web-ui/src/components/ReviewPanel.tsx'],
      },
      allowedTools: ['GetFileDiff', 'Read', 'Grep', 'Glob', 'LS', 'Git'],
      timeoutSeconds: manifest.executionPolicy.reviewerTimeoutSeconds,
      requiredOutputFields: expect.arrayContaining([
        'packet_id',
        'status',
        'findings',
      ]),
    });
    expect(judgePacket).toMatchObject({
      packetId: 'judge:ReviewJudge',
      phase: 'judge',
      subagentId: 'ReviewJudge',
      timeoutSeconds: manifest.executionPolicy.judgeTimeoutSeconds,
      requiredOutputFields: expect.arrayContaining([
        'packet_id',
        'status',
        'validated_findings',
      ]),
    });
    expect(manifest.workPackets?.map((packet) => packet.subagentId)).not.toContain(
      'ExtraDisabled',
    );

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('Review work packets:');
    expect(promptBlock).toContain('"packet_id": "reviewer:ReviewBusinessLogic"');
    expect(promptBlock).toContain('"allowed_tools"');
    expect(promptBlock).toContain('Each reviewer Task prompt must include the matching work packet verbatim.');
    expect(promptBlock).toContain('If the reviewer omits packet_id but the Task was launched from a packet, infer the packet_id from the Task description or work packet and mark packet_status_source as inferred.');
  });

  it('splits reviewer work packets across file groups for large targets', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra([], {
        reviewer_file_split_threshold: 10,
        max_same_role_instances: 3,
      }),
    );
    const target = classifyReviewTargetFromFiles(
      Array.from(
        { length: 25 },
        (_, index) => `src/web-ui/src/components/ReviewPanel${index}.tsx`,
      ),
      'session_files',
    );

    const manifest = buildEffectiveReviewTeamManifest(team, { target });
    const logicPackets = manifest.workPackets?.filter(
      (packet) => packet.subagentId === 'ReviewBusinessLogic',
    );
    const judgePackets = manifest.workPackets?.filter(
      (packet) => packet.subagentId === 'ReviewJudge',
    );

    expect(logicPackets).toHaveLength(3);
    expect(logicPackets?.map((packet) => packet.packetId)).toEqual([
      'reviewer:ReviewBusinessLogic:group-1-of-3',
      'reviewer:ReviewBusinessLogic:group-2-of-3',
      'reviewer:ReviewBusinessLogic:group-3-of-3',
    ]);
    expect(logicPackets?.map((packet) => packet.assignedScope.fileCount)).toEqual([
      9,
      8,
      8,
    ]);
    expect(logicPackets?.[0].assignedScope).toMatchObject({
      groupIndex: 1,
      groupCount: 3,
    });
    expect(logicPackets?.[0].assignedScope.files.slice(0, 2)).toEqual([
      'src/web-ui/src/components/ReviewPanel0.tsx',
      'src/web-ui/src/components/ReviewPanel1.tsx',
    ]);
    expect(logicPackets?.[0].assignedScope.files.at(-1)).toBe(
      'src/web-ui/src/components/ReviewPanel8.tsx',
    );
    expect(judgePackets).toHaveLength(1);
    expect(judgePackets?.[0].assignedScope).toMatchObject({
      fileCount: 25,
    });
    expect(judgePackets?.[0].assignedScope.groupCount).toBeUndefined();
    expect(manifest.tokenBudget).toMatchObject({
      estimatedReviewerCalls: 16,
      maxFilesPerReviewer: 10,
      largeDiffSummaryFirst: true,
    });

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('"packet_id": "reviewer:ReviewBusinessLogic:group-1-of-3"');
    expect(promptBlock).toContain('"group_index": 1');
    expect(promptBlock).toContain('"group_count": 3');
  });

  it('skips the frontend reviewer when the resolved target has no frontend tags', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      target: classifyReviewTargetFromFiles(
        ['src/crates/core/src/service/config/types.rs'],
        'session_files',
      ),
    });

    expect(manifest.target.resolution).toBe('resolved');
    expect(manifest.target.tags).toEqual(['backend_core']);
    expect(manifest.coreReviewers.map((member) => member.subagentId)).toEqual([
      'ReviewBusinessLogic',
      'ReviewPerformance',
      'ReviewSecurity',
      'ReviewArchitecture',
    ]);
    expect(manifest.skippedReviewers).toEqual([
      expect.objectContaining({
        subagentId: 'ReviewFrontend',
        reason: 'not_applicable',
      }),
    ]);
  });

  it('runs the frontend reviewer for frontend and contract targets', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      target: classifyReviewTargetFromFiles(
        ['src/apps/desktop/src/api/agentic_api.rs'],
        'session_files',
      ),
    });

    expect(manifest.target.tags).toEqual(
      expect.arrayContaining(['desktop_contract', 'frontend_contract']),
    );
    expect(manifest.coreReviewers.map((member) => member.subagentId)).toContain(
      'ReviewFrontend',
    );
    expect(manifest.skippedReviewers).not.toEqual([
      expect.objectContaining({ subagentId: 'ReviewFrontend' }),
    ]);
  });

  it('runs conditional reviewers conservatively for unknown targets', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      target: createUnknownReviewTargetClassification('manual_prompt'),
    });

    expect(manifest.target.resolution).toBe('unknown');
    expect(manifest.coreReviewers.map((member) => member.subagentId)).toContain(
      'ReviewFrontend',
    );
  });

  it('adds a balanced token budget to the run manifest by default', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled']),
    );

    const manifest = buildEffectiveReviewTeamManifest(team);

    expect(manifest.tokenBudget).toMatchObject({
      mode: 'balanced',
      estimatedReviewerCalls: 7,
      maxExtraReviewers: 1,
      skippedReviewerIds: [],
    });
  });

  it('predicts manifest timeouts from resolved target size', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );
    const target = classifyReviewTargetFromFiles(
      Array.from(
        { length: 25 },
        (_, index) => `src/web-ui/src/components/ReviewPanel${index}.tsx`,
      ),
      'session_files',
    );

    const manifest = buildEffectiveReviewTeamManifest(team, { target });

    expect(manifest.changeStats).toMatchObject({
      fileCount: 25,
      lineCountSource: 'unknown',
    });
    expect(manifest.executionPolicy).toMatchObject({
      reviewerTimeoutSeconds: 675,
      judgeTimeoutSeconds: 1350,
    });

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('- target_file_count: 25');
    expect(promptBlock).toContain('- target_line_count: unknown');
    expect(promptBlock).toContain('- reviewer_timeout_seconds: 675');
    expect(promptBlock).toContain('- judge_timeout_seconds: 1350');
  });

  it('includes diff line stats in predictive manifest timeouts', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );
    const target = classifyReviewTargetFromFiles(
      Array.from(
        { length: 25 },
        (_, index) => `src/web-ui/src/components/ReviewPanel${index}.tsx`,
      ),
      'workspace_diff',
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      target,
      changeStats: {
        fileCount: 25,
        totalLinesChanged: 800,
        lineCountSource: 'diff_stat',
      },
    });

    expect(manifest.changeStats).toMatchObject({
      fileCount: 25,
      totalLinesChanged: 800,
      lineCountSource: 'diff_stat',
    });
    expect(manifest.executionPolicy).toMatchObject({
      reviewerTimeoutSeconds: 915,
      judgeTimeoutSeconds: 1830,
    });

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('- target_line_count: 800');
    expect(promptBlock).toContain('- target_line_count_source: diff_stat');
    expect(promptBlock).toContain('- reviewer_timeout_seconds: 915');
    expect(promptBlock).toContain('- judge_timeout_seconds: 1830');
  });

  it('preserves explicit zero timeout policy when predicting manifest timeouts', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra([], {
        reviewer_timeout_seconds: 0,
        judge_timeout_seconds: 0,
      }),
    );
    const target = classifyReviewTargetFromFiles(
      ['src/web-ui/src/components/ReviewPanel.tsx'],
      'session_files',
    );

    const manifest = buildEffectiveReviewTeamManifest(team, { target });

    expect(manifest.executionPolicy).toMatchObject({
      reviewerTimeoutSeconds: 0,
      judgeTimeoutSeconds: 0,
    });
  });

  it('marks excess extra reviewers as budget-limited in economy mode', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraOne', true, 'user', 'fast', true, true),
        subagent('ExtraTwo', true, 'user', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraOne', 'ExtraTwo']),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      tokenBudgetMode: 'economy',
    });

    expect(manifest.enabledExtraReviewers).toEqual([]);
    expect(manifest.skippedReviewers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subagentId: 'ExtraOne',
          reason: 'budget_limited',
        }),
        expect.objectContaining({
          subagentId: 'ExtraTwo',
          reason: 'budget_limited',
        }),
      ]),
    );
    expect(manifest.tokenBudget).toMatchObject({
      mode: 'economy',
      maxExtraReviewers: 0,
      skippedReviewerIds: ['ExtraOne', 'ExtraTwo'],
    });
  });

  it('applies per-member strategy overrides in the launch manifest and prompt', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled'], {
        strategy_level: 'quick',
        member_strategy_overrides: {
          ReviewSecurity: 'deep',
          ExtraEnabled: 'normal',
        },
      }),
    );

    const manifest = buildEffectiveReviewTeamManifest(team, {
      workspacePath: WORKSPACE_PATH,
    });

    expect(manifest.strategyLevel).toBe('quick');
    expect(manifest.coreReviewers).toEqual([
      expect.objectContaining({
        subagentId: 'ReviewBusinessLogic',
        strategyLevel: 'quick',
        strategySource: 'team',
        defaultModelSlot: 'fast',
        strategyDirective: REVIEW_STRATEGY_DEFINITIONS.quick.roleDirectives.ReviewBusinessLogic,
      }),
      expect.objectContaining({
        subagentId: 'ReviewPerformance',
        strategyLevel: 'quick',
        strategySource: 'team',
        defaultModelSlot: 'fast',
        strategyDirective: REVIEW_STRATEGY_DEFINITIONS.quick.roleDirectives.ReviewPerformance,
      }),
      expect.objectContaining({
        subagentId: 'ReviewSecurity',
        strategyLevel: 'deep',
        strategySource: 'member',
        model: 'primary',
        defaultModelSlot: 'primary',
        strategyDirective: REVIEW_STRATEGY_DEFINITIONS.deep.roleDirectives.ReviewSecurity,
      }),
      expect.objectContaining({
        subagentId: 'ReviewArchitecture',
        strategyLevel: 'quick',
        strategySource: 'team',
        defaultModelSlot: 'fast',
        strategyDirective: REVIEW_STRATEGY_DEFINITIONS.quick.roleDirectives.ReviewArchitecture,
      }),
      expect.objectContaining({
        subagentId: 'ReviewFrontend',
        strategyLevel: 'quick',
        strategySource: 'team',
        defaultModelSlot: 'fast',
        strategyDirective: REVIEW_STRATEGY_DEFINITIONS.quick.roleDirectives.ReviewFrontend,
      }),
    ]);
    expect(manifest.enabledExtraReviewers[0]).toMatchObject({
      subagentId: 'ExtraEnabled',
      strategyLevel: 'normal',
      strategySource: 'member',
      defaultModelSlot: 'fast',
      strategyDirective: REVIEW_STRATEGY_DEFINITIONS.normal.promptDirective,
    });

    const promptBlock = buildReviewTeamPromptBlock(team, manifest);
    expect(promptBlock).toContain('- team_strategy: quick');
    expect(promptBlock).toContain('subagent_type: ReviewSecurity');
    expect(promptBlock).toContain('strategy: deep');
    expect(promptBlock).toContain('model_id: primary');
    expect(promptBlock).toContain(`prompt_directive: ${REVIEW_STRATEGY_DEFINITIONS.deep.roleDirectives.ReviewSecurity}`);
    expect(promptBlock).toContain('pass model_id with that value to the matching Task call');
    expect(promptBlock).toContain('Token/time impact: approximately 1.8-2.5x token usage and 1.5-2.5x runtime.');
  });

  it('falls back removed concrete reviewer models to the strategy default model slot', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraDeletedModel', true, 'user', 'deleted-model', true, true),
        subagent('ExtraCustomModel', true, 'user', 'model-kept', true, true),
      ],
      storedConfigWithExtra(['ExtraDeletedModel', 'ExtraCustomModel'], {
        strategy_level: 'deep',
      }),
      { availableModelIds: ['model-kept'] },
    );

    const manifest = buildEffectiveReviewTeamManifest(team);
    const deletedModelMember = manifest.enabledExtraReviewers.find(
      (member) => member.subagentId === 'ExtraDeletedModel',
    );
    const customModelMember = manifest.enabledExtraReviewers.find(
      (member) => member.subagentId === 'ExtraCustomModel',
    );

    expect(deletedModelMember).toMatchObject({
      model: 'primary',
      configuredModel: 'deleted-model',
      modelFallbackReason: 'model_removed',
      strategyLevel: 'deep',
    });
    expect(customModelMember).toMatchObject({
      model: 'model-kept',
      configuredModel: 'model-kept',
      modelFallbackReason: undefined,
    });
  });

  it('renders the run manifest without scheduling disabled extra reviewers', () => {
    const team = resolveDefaultReviewTeam(
      [
        ...coreSubagents(),
        subagent('ExtraEnabled', true, 'user', 'fast', true, true),
        subagent('ExtraDisabled', false, 'project', 'fast', true, true),
      ],
      storedConfigWithExtra(['ExtraEnabled', 'ExtraDisabled']),
    );

    const promptBlock = buildReviewTeamPromptBlock(
      team,
      buildEffectiveReviewTeamManifest(team, {
        workspacePath: WORKSPACE_PATH,
      }),
    );

    expect(promptBlock).toContain('Run manifest:');
    expect(promptBlock).toContain('target_resolution: unknown');
    expect(promptBlock).toContain('- team_strategy: normal');
    expect(promptBlock).toContain(`- workspace_path: ${WORKSPACE_PATH}`);
    expect(promptBlock).toContain('quality_gate_reviewer: ReviewJudge');
    expect(promptBlock).toContain('enabled_extra_reviewers: ExtraEnabled');
    expect(promptBlock).toContain('skipped_reviewers:');
    expect(promptBlock).toContain('- ExtraDisabled: disabled');
    expect(promptBlock).not.toContain('subagent_type: ExtraDisabled');
    expect(promptBlock).toContain('Run only reviewers listed in core_reviewers and enabled_extra_reviewers.');
    expect(promptBlock).not.toContain('run it in parallel with the locked reviewers whenever the change contains frontend files');
  });

  it('tells DeepReview to wait for user approval before running ReviewFixer', () => {
    const team = resolveDefaultReviewTeam(
      coreSubagents(),
      storedConfigWithExtra(),
    );

    const promptBlock = buildReviewTeamPromptBlock(team);

    expect(promptBlock).toContain('Do not run ReviewFixer during the review pass.');
    expect(promptBlock).toContain('Wait for explicit user approval before starting any remediation.');
  });
});
