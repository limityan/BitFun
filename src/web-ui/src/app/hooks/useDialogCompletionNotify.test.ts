import { describe, expect, it } from 'vitest';
import type { AgenticEvent } from '@/infrastructure/api/service-api/AgentAPI';
import type { Session } from '@/flow_chat/types/flow-chat';
import { shouldSendDialogCompletionNotification } from './dialogCompletionNotifyPolicy';

const event = (overrides: Partial<AgenticEvent> = {}): AgenticEvent => ({
  sessionId: 'session-1',
  turnId: 'turn-1',
  ...overrides,
});

const session = (overrides: Partial<Session> = {}): Session => ({
  sessionId: 'session-1',
  title: 'Session',
  titleStatus: 'generated',
  dialogTurns: [],
  status: 'idle',
  config: {
    modelName: 'gpt-test',
    agentType: 'agentic',
  },
  createdAt: 1000,
  lastActiveAt: 1000,
  error: null,
  todos: [],
  maxContextTokens: 128128,
  mode: 'agentic',
  workspacePath: '/workspace',
  parentSessionId: undefined,
  sessionKind: 'normal',
  btwThreads: [],
  btwOrigin: undefined,
  ...overrides,
});

describe('shouldSendDialogCompletionNotification', () => {
  it('suppresses notifications for individual subagent completions', () => {
    expect(
      shouldSendDialogCompletionNotification({
        event: event({
          subagentParentInfo: {
            toolCallId: 'task-1',
            sessionId: 'parent-session',
            dialogTurnId: 'parent-turn',
          },
        }),
        session: session(),
        isBackground: true,
        notificationsEnabled: true,
      }),
    ).toBe(false);
  });

  it('suppresses standard review child session notifications', () => {
    expect(
      shouldSendDialogCompletionNotification({
        event: event(),
        session: session({
          sessionKind: 'review',
          parentSessionId: 'parent-1',
        }),
        isBackground: true,
        notificationsEnabled: true,
      }),
    ).toBe(false);
  });

  it('allows final deep review completion notifications only in the background', () => {
    const deepReviewSession = session({
      sessionKind: 'deep_review',
      parentSessionId: 'parent-1',
    });

    expect(
      shouldSendDialogCompletionNotification({
        event: event(),
        session: deepReviewSession,
        isBackground: false,
        notificationsEnabled: true,
      }),
    ).toBe(false);

    expect(
      shouldSendDialogCompletionNotification({
        event: event(),
        session: deepReviewSession,
        isBackground: true,
        notificationsEnabled: true,
      }),
    ).toBe(true);
  });
});
