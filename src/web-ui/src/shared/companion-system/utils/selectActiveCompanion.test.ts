import { describe, expect, it } from 'vitest';
import { selectActiveCompanionScenario } from './selectActiveCompanion';
import type { RegisteredCompanionScenario } from '../types';

function makeScenario(
  id: string,
  overrides: Partial<RegisteredCompanionScenario> = {},
): RegisteredCompanionScenario {
  return {
    id,
    enabled: true,
    priority: 0,
    updatedAt: 1,
    presentation: {
      motion: 'idle',
    },
    target: {
      kind: 'inline',
      slotId: 'slot-1',
    },
    ...overrides,
  };
}

describe('selectActiveCompanionScenario', () => {
  it('returns null when there are no enabled scenarios', () => {
    expect(selectActiveCompanionScenario({})).toBeNull();
    expect(
      selectActiveCompanionScenario({
        a: makeScenario('a', { enabled: false }),
      }),
    ).toBeNull();
  });

  it('prefers the highest priority scenario', () => {
    const active = selectActiveCompanionScenario({
      low: makeScenario('low', { priority: 10 }),
      high: makeScenario('high', { priority: 50 }),
    });

    expect(active?.id).toBe('high');
  });

  it('breaks ties by latest update time', () => {
    const active = selectActiveCompanionScenario({
      older: makeScenario('older', { priority: 20, updatedAt: 10 }),
      newer: makeScenario('newer', { priority: 20, updatedAt: 20 }),
    });

    expect(active?.id).toBe('newer');
  });
});
