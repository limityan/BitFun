import { useEffect, useState } from 'react';
import { aiExperienceConfigService } from '@/infrastructure/config/services/AIExperienceConfigService';

export function useAgentCompanionEnabled(): boolean {
  const [enabled, setEnabled] = useState(
    () => aiExperienceConfigService.getSettings().enable_agent_companion,
  );

  useEffect(() => {
    setEnabled(aiExperienceConfigService.getSettings().enable_agent_companion);
    return aiExperienceConfigService.addChangeListener((settings) => {
      setEnabled(settings.enable_agent_companion);
    });
  }, []);

  return enabled;
}
