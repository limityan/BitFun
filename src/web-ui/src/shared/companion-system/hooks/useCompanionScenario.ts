import { useEffect } from 'react';
import type { CompanionScenario } from '../types';
import { useCompanionStore } from '../store/companionStore';

export function useCompanionScenario(scenario: CompanionScenario | null | undefined): void {
  useEffect(() => {
    if (!scenario) {
      return;
    }

    useCompanionStore.getState().upsertScenario(scenario);

    return () => {
      useCompanionStore.getState().removeScenario(scenario.id);
    };
  }, [scenario]);
}
