import { describe, expect, it, vi } from 'vitest';
import {
  DEEP_REVIEW_SLASH_COMMAND,
  buildDeepReviewPromptFromSlashCommand,
  isDeepReviewSlashCommand,
} from './DeepReviewService';

vi.mock('@/infrastructure/api', () => ({
  agentAPI: {
    deleteSession: vi.fn(),
  },
}));

vi.mock('./BtwThreadService', () => ({
  createBtwChildSession: vi.fn(),
}));

vi.mock('./openBtwSession', () => ({
  closeBtwSessionInAuxPane: vi.fn(),
  openBtwSessionInAuxPane: vi.fn(),
}));

vi.mock('./FlowChatManager', () => ({
  FlowChatManager: {
    getInstance: vi.fn(),
  },
}));

vi.mock('../store/FlowChatStore', () => ({
  flowChatStore: {
    getState: () => ({ sessions: new Map() }),
  },
}));

vi.mock('./ReviewSessionMarkerService', () => ({
  insertReviewSessionSummaryMarker: vi.fn(),
}));

vi.mock('@/shared/services/reviewTeamService', () => ({
  prepareDefaultReviewTeamForLaunch: vi.fn(async () => ({ members: [] })),
  buildEffectiveReviewTeamManifest: vi.fn(() => ({ reviewers: [] })),
  buildReviewTeamPromptBlock: vi.fn(() => 'Review team manifest.'),
}));

describe('DeepReviewService slash command', () => {
  it('uses /DeepReview as the canonical command', () => {
    expect(DEEP_REVIEW_SLASH_COMMAND).toBe('/DeepReview');
  });

  it('recognizes canonical deep review commands and rejects near matches', () => {
    expect(isDeepReviewSlashCommand('/DeepReview')).toBe(true);
    expect(isDeepReviewSlashCommand('/DeepReview review commit abc123')).toBe(true);
    expect(isDeepReviewSlashCommand('/deepreview review commit abc123')).toBe(true);
    expect(isDeepReviewSlashCommand('/DeepReviewer review commit abc123')).toBe(false);
  });

  it('strips the canonical command before building the focus block', async () => {
    const prompt = await buildDeepReviewPromptFromSlashCommand(
      '/DeepReview review commit abc123 for security',
      'D:\\workspace\\repo',
    );

    expect(prompt).toContain('Original command:\n/DeepReview review commit abc123 for security');
    expect(prompt).toContain('User-provided focus or target:\nreview commit abc123 for security');
    expect(prompt).not.toContain('User-provided focus or target:\n/DeepReview');
  });
});
