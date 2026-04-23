import type { CompanionCharacter } from './types';

export interface CompanionCharacterOption {
  id: CompanionCharacter;
  labelKey: string;
  shortLabel: string;
}

export const DEFAULT_COMPANION_CHARACTER: CompanionCharacter = 'red-panda';

export const COMPANION_CHARACTER_OPTIONS: readonly CompanionCharacterOption[] = [
  {
    id: 'red-panda',
    labelKey: 'nav.agentCompanionCharacterRedPanda',
    shortLabel: 'RP',
  },
  {
    id: 'fox',
    labelKey: 'nav.agentCompanionCharacterFox',
    shortLabel: 'FX',
  },
] as const;

export function isCompanionCharacter(value: unknown): value is CompanionCharacter {
  return COMPANION_CHARACTER_OPTIONS.some(option => option.id === value);
}

export function resolveCompanionCharacter(
  value: unknown,
  fallback: CompanionCharacter = DEFAULT_COMPANION_CHARACTER,
): CompanionCharacter {
  return isCompanionCharacter(value) ? value : fallback;
}
