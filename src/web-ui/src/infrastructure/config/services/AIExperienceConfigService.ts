 
import {
  DEFAULT_COMPANION_CHARACTER,
  resolveCompanionCharacter,
} from '@/shared/companion-system/characters';
import type { CompanionCharacter } from '@/shared/companion-system/types';
import { configManager } from './ConfigManager';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('AIExperienceConfig');

export interface AIExperienceSettings {
  enable_session_title_generation: boolean;
  enable_visual_mode: boolean;
  /** BitFun companion in supported chat scenes and overlays. */
  enable_agent_companion: boolean;
  /** User-selected character rendered by the BitFun companion system. */
  agent_companion_character: CompanionCharacter;
}

const CONFIG_PATH = 'app.ai_experience';

const defaultSettings: AIExperienceSettings = {
  enable_session_title_generation: true,
  enable_visual_mode: false,
  enable_agent_companion: true,
  agent_companion_character: DEFAULT_COMPANION_CHARACTER,
};

function normalizeSettings(
  settings: Partial<AIExperienceSettings> | null | undefined,
): AIExperienceSettings {
  const mergedSettings = {
    ...defaultSettings,
    ...(settings ?? {}),
  };

  return {
    ...mergedSettings,
    agent_companion_character: resolveCompanionCharacter(
      mergedSettings.agent_companion_character,
      DEFAULT_COMPANION_CHARACTER,
    ),
  };
}

 
export class AIExperienceConfigService {
  private static instance: AIExperienceConfigService;
  private cachedSettings: AIExperienceSettings | null = null;
  private listeners: Set<(settings: AIExperienceSettings) => void> = new Set();
  private unwatchConfig: (() => void) | null = null;

  private constructor() {
    // Defer configManager access to avoid circular dependency TDZ at module evaluation time.
    // By the next microtask, all ESM modules have finished evaluating and configManager is available.
    Promise.resolve().then(() => {
      this.unwatchConfig = configManager.watch(CONFIG_PATH, () => {
        this.reload();
      });
      this.loadSettings();
    });
  }

   
  static getInstance(): AIExperienceConfigService {
    if (!AIExperienceConfigService.instance) {
      AIExperienceConfigService.instance = new AIExperienceConfigService();
    }
    return AIExperienceConfigService.instance;
  }

   
  private async loadSettings(): Promise<void> {
    try {
      const settings = await configManager.getConfig<AIExperienceSettings>(CONFIG_PATH);
      this.cachedSettings = normalizeSettings(settings);
    } catch (error) {
      log.warn('Failed to load config, using defaults', error);
      this.cachedSettings = { ...defaultSettings };
    }
  }

   
  getSettings(): AIExperienceSettings {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }
    
    return { ...defaultSettings };
  }

   
  async getSettingsAsync(): Promise<AIExperienceSettings> {
    try {
      const settings = await configManager.getConfig<AIExperienceSettings>(CONFIG_PATH);
      this.cachedSettings = normalizeSettings(settings);
      return this.cachedSettings;
    } catch (error) {
      log.error('Failed to get config', error);
      return this.getSettings(); 
    }
  }

   
  async saveSettings(settings: AIExperienceSettings): Promise<void> {
    try {
      const normalizedSettings = normalizeSettings(settings);
      await configManager.setConfig(CONFIG_PATH, normalizedSettings);
      this.cachedSettings = normalizedSettings;
      this.notifyListeners();
    } catch (error) {
      log.error('Failed to save config', error);
      throw error;
    }
  }

   
  isSessionTitleGenerationEnabled(): boolean {
    return this.getSettings().enable_session_title_generation;
  }

  addChangeListener(listener: (settings: AIExperienceSettings) => void): () => void {
    this.listeners.add(listener);
    
    
    return () => {
      this.listeners.delete(listener);
    };
  }

   
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getSettings());
      } catch (error) {
        log.error('Listener execution failed', error);
      }
    });
  }

   
  async reload(): Promise<void> {
    await this.loadSettings();
    this.notifyListeners();
  }

   
  dispose(): void {
    if (this.unwatchConfig) {
      this.unwatchConfig();
      this.unwatchConfig = null;
    }
    this.listeners.clear();
  }
}

 
export const aiExperienceConfigService = AIExperienceConfigService.getInstance();

