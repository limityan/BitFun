import { create } from 'zustand';
import type { CompanionScenario, RegisteredCompanionScenario } from '../types';
import { selectActiveCompanionScenario } from '../utils/selectActiveCompanion';

interface CompanionStoreState {
  scenarios: Record<string, RegisteredCompanionScenario>;
  upsertScenario: (scenario: CompanionScenario) => void;
  removeScenario: (id: string) => void;
}

const DEFAULT_PRIORITY = 0;

export const useCompanionStore = create<CompanionStoreState>((set) => ({
  scenarios: {},

  upsertScenario: (scenario) => {
    set((state) => ({
      scenarios: {
        ...state.scenarios,
        [scenario.id]: {
          ...scenario,
          priority: scenario.priority ?? DEFAULT_PRIORITY,
          updatedAt: Date.now(),
        },
      },
    }));
  },

  removeScenario: (id) => {
    set((state) => {
      if (!(id in state.scenarios)) {
        return state;
      }

      const nextScenarios = { ...state.scenarios };
      delete nextScenarios[id];
      return { scenarios: nextScenarios };
    });
  },
}));

export function useActiveCompanionScenario() {
  return useCompanionStore(state => selectActiveCompanionScenario(state.scenarios));
}

export function useCompanionSlotScenario(slotId: string) {
  return useCompanionStore((state) => {
    const activeScenario = selectActiveCompanionScenario(state.scenarios);
    if (!activeScenario || activeScenario.target.kind !== 'inline') {
      return null;
    }

    return activeScenario.target.slotId === slotId ? activeScenario : null;
  });
}

export function useFloatingCompanionScenario() {
  return useCompanionStore((state) => {
    const activeScenario = selectActiveCompanionScenario(state.scenarios);
    if (!activeScenario || activeScenario.target.kind !== 'floating') {
      return null;
    }

    return activeScenario;
  });
}
