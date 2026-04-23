import {
  DEFAULT_COMPANION_CHARACTER,
  resolveCompanionCharacter,
} from './characters';
import type {
  CompanionAction,
  CompanionCharacter,
  CompanionMotion,
  CompanionPresentation,
  ResolvedCompanionPresentation,
} from './types';

export const DEFAULT_COMPANION_ACTION: CompanionAction = 'idle';

const COMPANION_ACTION_MOTION_MAP: Record<CompanionCharacter, Record<CompanionAction, CompanionMotion>> = {
  'red-panda': {
    idle: 'idle',
    resting: 'doze',
    thinking: 'think',
    guiding: 'point',
    encouraging: 'hop',
    alerting: 'alert',
    'keeping-company': 'amble',
    'checking-in': 'pace',
    watching: 'peek',
    hurrying: 'scurry',
    playful: 'tease',
    hiding: 'hide',
  },
  fox: {
    idle: 'idle',
    resting: 'doze',
    thinking: 'think',
    guiding: 'point',
    encouraging: 'hop',
    alerting: 'alert',
    'keeping-company': 'amble',
    'checking-in': 'pace',
    watching: 'peek',
    hurrying: 'scurry',
    playful: 'tease',
    hiding: 'hide',
  },
};

const COMPANION_MOTION_ACTION_MAP: Record<CompanionCharacter, Partial<Record<CompanionMotion, CompanionAction>>> = Object.fromEntries(
  Object.entries(COMPANION_ACTION_MOTION_MAP).map(([character, actionMap]) => [
    character,
    Object.entries(actionMap).reduce<Partial<Record<CompanionMotion, CompanionAction>>>((motionMap, [action, motion]) => {
      if (!motionMap[motion as CompanionMotion]) {
        motionMap[motion as CompanionMotion] = action as CompanionAction;
      }
      return motionMap;
    }, {}),
  ]),
) as Record<CompanionCharacter, Partial<Record<CompanionMotion, CompanionAction>>>;

export function resolveCompanionAction(
  presentation: Pick<CompanionPresentation, 'action' | 'motion'>,
  selectedCharacter?: CompanionCharacter,
): CompanionAction {
  if (presentation.action) {
    return presentation.action;
  }

  if (presentation.motion) {
    const character = resolveCompanionCharacter(selectedCharacter, DEFAULT_COMPANION_CHARACTER);
    return COMPANION_MOTION_ACTION_MAP[character][presentation.motion] ?? DEFAULT_COMPANION_ACTION;
  }

  return DEFAULT_COMPANION_ACTION;
}

export function resolveCompanionMotion(
  presentation: Pick<CompanionPresentation, 'action' | 'motion' | 'character'>,
  selectedCharacter?: CompanionCharacter,
): CompanionMotion {
  if (presentation.motion) {
    return presentation.motion;
  }

  const character = resolveCompanionCharacter(
    presentation.character ?? selectedCharacter,
    DEFAULT_COMPANION_CHARACTER,
  );
  const action = resolveCompanionAction(presentation, character);

  return COMPANION_ACTION_MOTION_MAP[character][action];
}

export function resolveCompanionPresentation(
  presentation: CompanionPresentation,
  selectedCharacter?: CompanionCharacter,
): ResolvedCompanionPresentation {
  const character = resolveCompanionCharacter(
    presentation.character ?? selectedCharacter,
    DEFAULT_COMPANION_CHARACTER,
  );
  const action = resolveCompanionAction(presentation, character);
  const motion = resolveCompanionMotion(presentation, character);

  return {
    ...presentation,
    character,
    action,
    motion,
  };
}
