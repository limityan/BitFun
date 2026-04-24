import { configAPI } from '@/infrastructure/api/service-api/ConfigAPI';
import {
  SubagentAPI,
  type SubagentInfo,
  type SubagentSource,
} from '@/infrastructure/api/service-api/SubagentAPI';

export const DEFAULT_REVIEW_TEAM_ID = 'default-review-team';
export const DEFAULT_REVIEW_TEAM_CONFIG_PATH = 'ai.review_teams.default';
export const DEFAULT_REVIEW_TEAM_MODEL = 'fast';
export const DEFAULT_REVIEW_TEAM_EXECUTION_POLICY = {
  reviewerTimeoutSeconds: 300,
  judgeTimeoutSeconds: 240,
  autoFixEnabled: false,
  autoFixMaxRounds: 2,
  autoFixMaxStalledRounds: 1,
} as const;

export type ReviewTeamCoreRoleKey =
  | 'businessLogic'
  | 'performance'
  | 'security'
  | 'judge';

export interface ReviewTeamCoreRoleDefinition {
  key: ReviewTeamCoreRoleKey;
  subagentId: string;
  funName: string;
  roleName: string;
  description: string;
  responsibilities: string[];
  accentColor: string;
}

export interface ReviewTeamStoredConfig {
  extra_subagent_ids: string[];
  reviewer_timeout_seconds: number;
  judge_timeout_seconds: number;
  auto_fix_enabled: boolean;
  auto_fix_max_rounds: number;
  auto_fix_max_stalled_rounds: number;
}

export interface ReviewTeamExecutionPolicy {
  reviewerTimeoutSeconds: number;
  judgeTimeoutSeconds: number;
  autoFixEnabled: boolean;
  autoFixMaxRounds: number;
  autoFixMaxStalledRounds: number;
}

export interface ReviewTeamMember {
  id: string;
  subagentId: string;
  definitionKey?: ReviewTeamCoreRoleKey;
  displayName: string;
  roleName: string;
  description: string;
  responsibilities: string[];
  model: string;
  enabled: boolean;
  available: boolean;
  locked: boolean;
  source: 'core' | 'extra';
  subagentSource: SubagentSource;
  accentColor: string;
}

export interface ReviewTeam {
  id: string;
  name: string;
  description: string;
  warning: string;
  executionPolicy: ReviewTeamExecutionPolicy;
  members: ReviewTeamMember[];
  coreMembers: ReviewTeamMember[];
  extraMembers: ReviewTeamMember[];
}

export interface ReviewTeamManifestMember {
  subagentId: string;
  displayName: string;
  roleName: string;
  model: string;
  locked: boolean;
  source: ReviewTeamMember['source'];
  subagentSource: ReviewTeamMember['subagentSource'];
  reason?: 'disabled' | 'unavailable';
}

export interface ReviewTeamRunManifest {
  reviewMode: 'deep';
  workspacePath?: string;
  policySource: 'default-review-team-config';
  executionPolicy: ReviewTeamExecutionPolicy;
  coreReviewers: ReviewTeamManifestMember[];
  qualityGateReviewer?: ReviewTeamManifestMember;
  enabledExtraReviewers: ReviewTeamManifestMember[];
  skippedReviewers: ReviewTeamManifestMember[];
}

const EXTRA_MEMBER_DEFAULTS = {
  roleName: 'Additional Specialist Reviewer',
  description:
    'User-added Sub-Agent that joins the deep review lineup with its own instructions, tools, and perspective.',
  responsibilities: [
    'Bring an extra independent review perspective into the same target scope.',
    'Stay tightly focused on the requested diff, commit, or workspace changes.',
    'Return concrete findings with clear fix suggestions or follow-up steps.',
  ],
  accentColor: '#64748b',
};

export const DEFAULT_REVIEW_TEAM_CORE_ROLES: ReviewTeamCoreRoleDefinition[] = [
  {
    key: 'businessLogic',
    subagentId: 'ReviewBusinessLogic',
    funName: 'Logic Detective Locke',
    roleName: 'Business Logic Reviewer',
    description:
      'A workflow sleuth that inspects business rules, state transitions, recovery paths, and real-user correctness.',
    responsibilities: [
      'Verify workflows, state transitions, and domain rules still behave correctly.',
      'Check boundary cases, rollback paths, and data integrity assumptions.',
      'Focus on issues that can break user outcomes or product intent.',
    ],
    accentColor: '#2563eb',
  },
  {
    key: 'performance',
    subagentId: 'ReviewPerformance',
    funName: 'Turbo Trace Bolt',
    roleName: 'Performance Reviewer',
    description:
      'A speed-focused profiler that hunts hot paths, unnecessary work, blocking calls, and scale-sensitive regressions.',
    responsibilities: [
      'Inspect hot paths, large loops, and unnecessary allocations or recomputation.',
      'Flag blocking work, N+1 patterns, and wasteful data movement.',
      'Keep performance advice practical and aligned with the existing architecture.',
    ],
    accentColor: '#d97706',
  },
  {
    key: 'security',
    subagentId: 'ReviewSecurity',
    funName: 'Aegis Sentinel Nova',
    roleName: 'Security Reviewer',
    description:
      'A boundary guardian that scans for injection risks, trust leaks, privilege mistakes, and unsafe file or command handling.',
    responsibilities: [
      'Review trust boundaries, auth assumptions, and sensitive data handling.',
      'Look for injection, unsafe command execution, and exposure risks.',
      'Highlight concrete fixes that reduce risk without broad rewrites.',
    ],
    accentColor: '#dc2626',
  },
  {
    key: 'judge',
    subagentId: 'ReviewJudge',
    funName: 'Quality Judge Echo',
    roleName: 'Review Quality Inspector',
    description:
      'A calm final arbiter that checks other reviewers for false positives, risky advice, and evidence quality before reporting.',
    responsibilities: [
      'Validate, merge, downgrade, or reject reviewer findings before they reach the final report.',
      'Filter out false positives and directionally-wrong optimization advice.',
      'Ensure every surviving issue has an actionable fix or follow-up plan.',
    ],
    accentColor: '#7c3aed',
  },
];

const CORE_ROLE_IDS = new Set(
  DEFAULT_REVIEW_TEAM_CORE_ROLES.map((role) => role.subagentId),
);
const DISALLOWED_REVIEW_TEAM_MEMBER_IDS = new Set<string>([
  ...CORE_ROLE_IDS,
  'DeepReview',
  'ReviewFixer',
]);

function dedupeIds(ids: string[]): string[] {
  return Array.from(
    new Set(
      ids
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(numeric)));
}

function normalizeExecutionPolicy(
  raw: unknown,
): Pick<
  ReviewTeamStoredConfig,
  | 'reviewer_timeout_seconds'
  | 'judge_timeout_seconds'
  | 'auto_fix_enabled'
  | 'auto_fix_max_rounds'
  | 'auto_fix_max_stalled_rounds'
> {
  const config = raw as Partial<ReviewTeamStoredConfig> | undefined;

  return {
    reviewer_timeout_seconds: clampInteger(
      config?.reviewer_timeout_seconds,
      0,
      3600,
      DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.reviewerTimeoutSeconds,
    ),
    judge_timeout_seconds: clampInteger(
      config?.judge_timeout_seconds,
      0,
      3600,
      DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.judgeTimeoutSeconds,
    ),
    auto_fix_enabled:
      typeof config?.auto_fix_enabled === 'boolean'
        ? config.auto_fix_enabled
        : DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixEnabled,
    auto_fix_max_rounds: clampInteger(
      config?.auto_fix_max_rounds,
      1,
      5,
      DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxRounds,
    ),
    auto_fix_max_stalled_rounds: clampInteger(
      config?.auto_fix_max_stalled_rounds,
      1,
      5,
      DEFAULT_REVIEW_TEAM_EXECUTION_POLICY.autoFixMaxStalledRounds,
    ),
  };
}

function executionPolicyFromStoredConfig(
  config: ReviewTeamStoredConfig,
): ReviewTeamExecutionPolicy {
  return {
    reviewerTimeoutSeconds: config.reviewer_timeout_seconds,
    judgeTimeoutSeconds: config.judge_timeout_seconds,
    autoFixEnabled: config.auto_fix_enabled,
    autoFixMaxRounds: config.auto_fix_max_rounds,
    autoFixMaxStalledRounds: config.auto_fix_max_stalled_rounds,
  };
}

function normalizeStoredConfig(raw: unknown): ReviewTeamStoredConfig {
  const extraIds = Array.isArray((raw as { extra_subagent_ids?: unknown })?.extra_subagent_ids)
    ? (raw as { extra_subagent_ids: unknown[] }).extra_subagent_ids
      .map((value) => String(value))
    : [];
  const executionPolicy = normalizeExecutionPolicy(raw);

  return {
    extra_subagent_ids: dedupeIds(extraIds).filter((id) => !DISALLOWED_REVIEW_TEAM_MEMBER_IDS.has(id)),
    ...executionPolicy,
  };
}

function isMissingDefaultReviewTeamConfigError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes(DEFAULT_REVIEW_TEAM_CONFIG_PATH.toLowerCase()) &&
    normalized.includes('not found')
  );
}

export async function loadDefaultReviewTeamConfig(): Promise<ReviewTeamStoredConfig> {
  let raw: unknown;
  try {
    raw = await configAPI.getConfig(DEFAULT_REVIEW_TEAM_CONFIG_PATH);
  } catch (error) {
    if (!isMissingDefaultReviewTeamConfigError(error)) {
      throw error;
    }
  }
  return normalizeStoredConfig(raw);
}

export async function saveDefaultReviewTeamConfig(
  config: ReviewTeamStoredConfig,
): Promise<void> {
  const normalizedConfig = normalizeStoredConfig(config);

  await configAPI.setConfig(DEFAULT_REVIEW_TEAM_CONFIG_PATH, {
    extra_subagent_ids: dedupeIds(normalizedConfig.extra_subagent_ids)
      .filter((id) => !DISALLOWED_REVIEW_TEAM_MEMBER_IDS.has(id)),
    reviewer_timeout_seconds: normalizedConfig.reviewer_timeout_seconds,
    judge_timeout_seconds: normalizedConfig.judge_timeout_seconds,
    auto_fix_enabled: normalizedConfig.auto_fix_enabled,
    auto_fix_max_rounds: normalizedConfig.auto_fix_max_rounds,
    auto_fix_max_stalled_rounds: normalizedConfig.auto_fix_max_stalled_rounds,
  });
}

export async function addDefaultReviewTeamMember(subagentId: string): Promise<void> {
  const current = await loadDefaultReviewTeamConfig();
  await saveDefaultReviewTeamConfig({
    ...current,
    extra_subagent_ids: [...current.extra_subagent_ids, subagentId],
  });
}

export async function removeDefaultReviewTeamMember(subagentId: string): Promise<void> {
  const current = await loadDefaultReviewTeamConfig();
  await saveDefaultReviewTeamConfig({
    ...current,
    extra_subagent_ids: current.extra_subagent_ids.filter((id) => id !== subagentId),
  });
}

export async function saveDefaultReviewTeamExecutionPolicy(
  policy: ReviewTeamExecutionPolicy,
): Promise<void> {
  const current = await loadDefaultReviewTeamConfig();
  await saveDefaultReviewTeamConfig({
    ...current,
    reviewer_timeout_seconds: policy.reviewerTimeoutSeconds,
    judge_timeout_seconds: policy.judgeTimeoutSeconds,
    auto_fix_enabled: policy.autoFixEnabled,
    auto_fix_max_rounds: policy.autoFixMaxRounds,
    auto_fix_max_stalled_rounds: policy.autoFixMaxStalledRounds,
  });
}

function buildCoreMember(
  definition: ReviewTeamCoreRoleDefinition,
  info: SubagentInfo | undefined,
): ReviewTeamMember {
  return {
    id: `core:${definition.subagentId}`,
    subagentId: definition.subagentId,
    definitionKey: definition.key,
    displayName: definition.funName,
    roleName: definition.roleName,
    description: definition.description,
    responsibilities: definition.responsibilities,
    model: info?.model || DEFAULT_REVIEW_TEAM_MODEL,
    enabled: info?.enabled ?? true,
    available: Boolean(info),
    locked: true,
    source: 'core',
    subagentSource: info?.subagentSource ?? 'builtin',
    accentColor: definition.accentColor,
  };
}

function buildExtraMember(info: SubagentInfo): ReviewTeamMember {
  return {
    id: `extra:${info.id}`,
    subagentId: info.id,
    displayName: info.name,
    roleName: EXTRA_MEMBER_DEFAULTS.roleName,
    description: info.description?.trim() || EXTRA_MEMBER_DEFAULTS.description,
    responsibilities: EXTRA_MEMBER_DEFAULTS.responsibilities,
    model: info.model || DEFAULT_REVIEW_TEAM_MODEL,
    enabled: info.enabled,
    available: true,
    locked: false,
    source: 'extra',
    subagentSource: info.subagentSource ?? 'builtin',
    accentColor: EXTRA_MEMBER_DEFAULTS.accentColor,
  };
}

export function isReviewTeamCoreSubagent(subagentId: string): boolean {
  return CORE_ROLE_IDS.has(subagentId);
}

export function canAddSubagentToReviewTeam(subagentId: string): boolean {
  return !DISALLOWED_REVIEW_TEAM_MEMBER_IDS.has(subagentId);
}

export function resolveDefaultReviewTeam(
  subagents: SubagentInfo[],
  storedConfig: ReviewTeamStoredConfig,
): ReviewTeam {
  const byId = new Map(subagents.map((subagent) => [subagent.id, subagent]));
  const coreMembers = DEFAULT_REVIEW_TEAM_CORE_ROLES.map((definition) =>
    buildCoreMember(definition, byId.get(definition.subagentId)),
  );
  const extraMembers = storedConfig.extra_subagent_ids
    .map((subagentId) => byId.get(subagentId))
    .filter((subagent): subagent is SubagentInfo => Boolean(subagent))
    .filter((subagent) => canAddSubagentToReviewTeam(subagent.id))
    .map(buildExtraMember);

  return {
    id: DEFAULT_REVIEW_TEAM_ID,
    name: 'Default Review Team',
    description:
      'A local multi-reviewer team for deep code review with mandatory logic, performance, security, and quality-gate roles.',
    warning:
      'Deep review runs locally, may take longer, and usually consumes more tokens than a standard review.',
    executionPolicy: executionPolicyFromStoredConfig(storedConfig),
    members: [...coreMembers, ...extraMembers],
    coreMembers,
    extraMembers,
  };
}

export async function loadDefaultReviewTeam(
  workspacePath?: string,
): Promise<ReviewTeam> {
  const [storedConfig, subagents] = await Promise.all([
    loadDefaultReviewTeamConfig(),
    SubagentAPI.listSubagents({ workspacePath }),
  ]);

  return resolveDefaultReviewTeam(subagents, storedConfig);
}

export async function prepareDefaultReviewTeamForLaunch(
  workspacePath?: string,
): Promise<ReviewTeam> {
  const team = await loadDefaultReviewTeam(workspacePath);
  const missingCoreMembers = team.coreMembers.filter((member) => !member.available);

  if (missingCoreMembers.length > 0) {
    throw new Error(
      `Required review team members are unavailable: ${missingCoreMembers
        .map((member) => member.subagentId)
        .join(', ')}`,
    );
  }

  await Promise.all(
    team.coreMembers
      .filter((member) => member.available)
      .map((member) =>
        SubagentAPI.updateSubagentConfig({
          subagentId: member.subagentId,
          enabled: true,
          workspacePath,
        }),
      ),
  );

  return loadDefaultReviewTeam(workspacePath);
}

function toManifestMember(
  member: ReviewTeamMember,
  reason?: ReviewTeamManifestMember['reason'],
): ReviewTeamManifestMember {
  return {
    subagentId: member.subagentId,
    displayName: member.displayName,
    roleName: member.roleName,
    model: member.model || DEFAULT_REVIEW_TEAM_MODEL,
    locked: member.locked,
    source: member.source,
    subagentSource: member.subagentSource,
    ...(reason ? { reason } : {}),
  };
}

export function buildEffectiveReviewTeamManifest(
  team: ReviewTeam,
  options: {
    workspacePath?: string;
    policySource?: ReviewTeamRunManifest['policySource'];
  } = {},
): ReviewTeamRunManifest {
  const availableCoreMembers = team.coreMembers.filter((member) => member.available);
  const unavailableCoreMembers = team.coreMembers.filter((member) => !member.available);
  const coreReviewers = availableCoreMembers
    .filter((member) => member.definitionKey !== 'judge')
    .map((member) => toManifestMember(member));
  const qualityGateReviewer = availableCoreMembers.find(
    (member) => member.definitionKey === 'judge',
  );
  const enabledExtraReviewers = team.extraMembers
    .filter((member) => member.available && member.enabled)
    .map((member) => toManifestMember(member));
  const skippedReviewers = [
    ...team.extraMembers
      .filter((member) => !member.available || !member.enabled)
      .map((member) =>
        toManifestMember(member, member.available ? 'disabled' : 'unavailable'),
      ),
    ...unavailableCoreMembers.map((member) =>
      toManifestMember(member, 'unavailable'),
    ),
  ];

  return {
    reviewMode: 'deep',
    ...(options.workspacePath ? { workspacePath: options.workspacePath } : {}),
    policySource: options.policySource ?? 'default-review-team-config',
    executionPolicy: team.executionPolicy,
    coreReviewers,
    ...(qualityGateReviewer
      ? { qualityGateReviewer: toManifestMember(qualityGateReviewer) }
      : {}),
    enabledExtraReviewers,
    skippedReviewers,
  };
}

function formatResponsibilities(items: string[]): string {
  return items.map((item) => `    - ${item}`).join('\n');
}

function formatManifestList(
  members: ReviewTeamManifestMember[],
  emptyValue: string,
): string {
  if (members.length === 0) {
    return emptyValue;
  }

  return members
    .map((member) =>
      member.reason
        ? `${member.subagentId}: ${member.reason}`
        : member.subagentId,
    )
    .join(', ');
}

export function buildReviewTeamPromptBlock(
  team: ReviewTeam,
  manifest = buildEffectiveReviewTeamManifest(team),
): string {
  const activeSubagentIds = new Set([
    ...manifest.coreReviewers.map((member) => member.subagentId),
    ...manifest.enabledExtraReviewers.map((member) => member.subagentId),
    ...(manifest.qualityGateReviewer
      ? [manifest.qualityGateReviewer.subagentId]
      : []),
  ]);
  const members = team.members
    .filter((member) => member.available && activeSubagentIds.has(member.subagentId))
    .map((member) => [
      `- ${member.displayName}`,
      `  - subagent_type: ${member.subagentId}`,
      `  - preferred_task_label: ${member.displayName}`,
      `  - role: ${member.roleName}`,
      `  - locked_core_role: ${member.locked ? 'yes' : 'no'}`,
      `  - model: ${member.model || DEFAULT_REVIEW_TEAM_MODEL}`,
      '  - responsibilities:',
      formatResponsibilities(member.responsibilities),
    ].join('\n'))
    .join('\n');
  const executionPolicy = [
    `- reviewer_timeout_seconds: ${team.executionPolicy.reviewerTimeoutSeconds}`,
    `- judge_timeout_seconds: ${team.executionPolicy.judgeTimeoutSeconds}`,
    `- auto_fix_enabled: ${team.executionPolicy.autoFixEnabled ? 'true' : 'false'}`,
    `- auto_fix_max_rounds: ${team.executionPolicy.autoFixMaxRounds}`,
    `- auto_fix_max_stalled_rounds: ${team.executionPolicy.autoFixMaxStalledRounds}`,
  ].join('\n');
  const manifestBlock = [
    'Run manifest:',
    `- review_mode: ${manifest.reviewMode}`,
    `- workspace_path: ${manifest.workspacePath || 'inherited from current session'}`,
    `- policy_source: ${manifest.policySource}`,
    `- core_reviewers: ${formatManifestList(manifest.coreReviewers, 'none')}`,
    `- quality_gate_reviewer: ${manifest.qualityGateReviewer?.subagentId || 'none'}`,
    `- enabled_extra_reviewers: ${formatManifestList(manifest.enabledExtraReviewers, 'none')}`,
    '- skipped_reviewers:',
    ...(manifest.skippedReviewers.length > 0
      ? manifest.skippedReviewers.map(
        (member) => `  - ${member.subagentId}: ${member.reason || 'skipped'}`,
      )
      : ['  - none']),
  ].join('\n');

  return [
    manifestBlock,
    'Configured review team:',
    members || '- No team members available.',
    'Execution policy:',
    executionPolicy,
    'Team execution rules:',
    '- Always run the three locked reviewer roles first: ReviewBusinessLogic, ReviewPerformance, and ReviewSecurity.',
    '- Run ReviewJudge only after the reviewer batch finishes, as the quality-gate pass.',
    '- If extra reviewers are configured and enabled, run them in parallel with the three locked reviewers whenever possible.',
    '- If reviewer_timeout_seconds is greater than 0, pass timeout_seconds with that value to every reviewer Task call.',
    '- If judge_timeout_seconds is greater than 0, pass timeout_seconds with that value to the ReviewJudge Task call.',
    '- Do not run ReviewFixer during the initial review pass.',
    '- Wait for explicit user approval before starting any remediation.',
    '- If auto_fix_enabled is true and validated findings remain, run ReviewFixer and then rerun the team incrementally on the fix diff.',
    '- Stop the auto-fix loop when findings stop shrinking, when the same issues recur, or when the configured round limits are reached.',
    '- The Review Quality Inspector must validate findings from every reviewer before the final report.',
  ].join('\n');
}
