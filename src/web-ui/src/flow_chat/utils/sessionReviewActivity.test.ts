import { describe, expect, it } from 'vitest';
import { SessionExecutionState } from '../state-machine/types';
import type { FlowChatState, Session } from '../types/flow-chat';
import {
  deriveSessionReviewActivity,
  isReviewActivityBlocking,
} from './sessionReviewActivity';

function session(
  sessionId: string,
  overrides: Partial<Session> = {},
): Session {
  return {
    sessionId,
    title: sessionId,
    dialogTurns: [],
    status: 'idle',
    config: {},
    createdAt: 1,
    lastActiveAt: 1,
    error: null,
    sessionKind: 'normal',
    ...overrides,
  };
}

function state(sessions: Session[]): FlowChatState {
  return {
    activeSessionId: sessions[0]?.sessionId ?? null,
    sessions: new Map(sessions.map(item => [item.sessionId, item])),
  };
}

describe('deriveSessionReviewActivity', () => {
  it('returns a blocking deep-review activity for a running child review session', () => {
    const activity = deriveSessionReviewActivity(
      state([
        session('parent'),
        session('child-review', {
          sessionKind: 'deep_review',
          parentSessionId: 'parent',
          createdAt: 10,
        }),
      ]),
      'parent',
      () => SessionExecutionState.PROCESSING,
    );

    expect(activity).toMatchObject({
      parentSessionId: 'parent',
      childSessionId: 'child-review',
      kind: 'deep_review',
      lifecycle: 'running',
      isBlocking: true,
    });
    expect(isReviewActivityBlocking(activity)).toBe(true);
  });

  it('does not block new reviews after the child review has failed', () => {
    const activity = deriveSessionReviewActivity(
      state([
        session('parent'),
        session('failed-review', {
          sessionKind: 'review',
          parentSessionId: 'parent',
          createdAt: 20,
          error: 'model failed',
        }),
      ]),
      'parent',
      () => SessionExecutionState.ERROR,
    );

    expect(activity).toMatchObject({
      childSessionId: 'failed-review',
      kind: 'review',
      lifecycle: 'error',
      isBlocking: false,
    });
    expect(isReviewActivityBlocking(activity)).toBe(false);
  });

  it('prefers the latest blocking review child when multiple review sessions exist', () => {
    const activity = deriveSessionReviewActivity(
      state([
        session('parent'),
        session('old-review', {
          sessionKind: 'review',
          parentSessionId: 'parent',
          createdAt: 10,
        }),
        session('new-deep-review', {
          sessionKind: 'deep_review',
          parentSessionId: 'parent',
          createdAt: 30,
        }),
      ]),
      'parent',
      childSessionId =>
        childSessionId === 'new-deep-review'
          ? SessionExecutionState.FINISHING
          : SessionExecutionState.IDLE,
    );

    expect(activity).toMatchObject({
      childSessionId: 'new-deep-review',
      kind: 'deep_review',
      lifecycle: 'finishing',
      isBlocking: true,
    });
  });
});
