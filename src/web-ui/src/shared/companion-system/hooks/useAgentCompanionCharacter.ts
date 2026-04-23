import { useEffect, useState } from 'react';
import { aiExperienceConfigService } from '@/infrastructure/config/services/AIExperienceConfigService';
import { DEFAULT_COMPANION_CHARACTER, resolveCompanionCharacter } from '../characters';
import type { CompanionCharacter } from '../types';

export function useAgentCompanionCharacter(): CompanionCharacter {
  const [character, setCharacter] = useState<CompanionCharacter>(
    () => resolveCompanionCharacter(
      aiExperienceConfigService.getSettings().agent_companion_character,
      DEFAULT_COMPANION_CHARACTER,
    ),
  );

  useEffect(() => {
    setCharacter(resolveCompanionCharacter(
      aiExperienceConfigService.getSettings().agent_companion_character,
      DEFAULT_COMPANION_CHARACTER,
    ));
    return aiExperienceConfigService.addChangeListener((settings) => {
      setCharacter(resolveCompanionCharacter(settings.agent_companion_character));
    });
  }, []);

  return character;
}
