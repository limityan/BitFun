export interface SubagentEditorToolInfo {
  name: string;
  isReadonly: boolean;
}

export const REVIEW_SUBAGENT_REQUIRED_TOOLS = ['GetFileDiff', 'Read'] as const;
export const REVIEW_SUBAGENT_RECOMMENDED_TOOLS = [
  'GetFileDiff',
  'Read',
  'Grep',
  'Glob',
  'LS',
] as const;
export const REVIEW_SUBAGENT_OPTIONAL_TOOLS = ['Git'] as const;

export type ReviewSubagentToolReadiness = 'ready' | 'degraded' | 'invalid';

export interface ReviewSubagentToolReadinessResult {
  readiness: ReviewSubagentToolReadiness;
  requiredTools: string[];
  recommendedTools: string[];
  optionalTools: string[];
  missingRequiredTools: string[];
  missingRecommendedTools: string[];
}

export function filterToolsForReviewMode(
  tools: SubagentEditorToolInfo[],
  review: boolean,
): SubagentEditorToolInfo[] {
  return review ? tools.filter((tool) => tool.isReadonly) : tools;
}

export function evaluateReviewSubagentToolReadiness(
  selectedTools: Iterable<string>,
): ReviewSubagentToolReadinessResult {
  const selectedToolNames = new Set(selectedTools);
  const missingRequiredTools = REVIEW_SUBAGENT_REQUIRED_TOOLS.filter(
    (toolName) => !selectedToolNames.has(toolName),
  );
  const missingRecommendedTools = REVIEW_SUBAGENT_RECOMMENDED_TOOLS.filter(
    (toolName) => !selectedToolNames.has(toolName),
  );
  const readiness: ReviewSubagentToolReadiness =
    missingRequiredTools.length > 0
      ? 'invalid'
      : missingRecommendedTools.length > 0
        ? 'degraded'
        : 'ready';

  return {
    readiness,
    requiredTools: [...REVIEW_SUBAGENT_REQUIRED_TOOLS],
    recommendedTools: [...REVIEW_SUBAGENT_RECOMMENDED_TOOLS],
    optionalTools: [...REVIEW_SUBAGENT_OPTIONAL_TOOLS],
    missingRequiredTools,
    missingRecommendedTools,
  };
}

export interface NormalizeReviewModeStateInput {
  review: boolean;
  readonly: boolean;
  selectedTools: Set<string>;
  availableTools: SubagentEditorToolInfo[];
}

export interface NormalizeReviewModeStateResult {
  readonly: boolean;
  selectedTools: Set<string>;
  removedToolNames: string[];
}

export function normalizeReviewModeState(
  input: NormalizeReviewModeStateInput,
): NormalizeReviewModeStateResult {
  if (!input.review) {
    return {
      readonly: input.readonly,
      selectedTools: new Set(input.selectedTools),
      removedToolNames: [],
    };
  }

  const readonlyToolNames = new Set(
    input.availableTools
      .filter((tool) => tool.isReadonly)
      .map((tool) => tool.name),
  );
  const selectedTools = new Set<string>();
  const removedToolNames: string[] = [];

  input.selectedTools.forEach((toolName) => {
    if (readonlyToolNames.has(toolName)) {
      selectedTools.add(toolName);
    } else {
      removedToolNames.push(toolName);
    }
  });

  return {
    readonly: true,
    selectedTools,
    removedToolNames,
  };
}
