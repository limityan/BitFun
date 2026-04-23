import type { RegisteredCompanionScenario } from '../types';

export function selectActiveCompanionScenario(
  scenarios: Record<string, RegisteredCompanionScenario>,
): RegisteredCompanionScenario | null {
  const candidates = Object.values(scenarios).filter(scenario => scenario.enabled);

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => {
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return right.updatedAt - left.updatedAt;
  });

  return candidates[0] ?? null;
}
