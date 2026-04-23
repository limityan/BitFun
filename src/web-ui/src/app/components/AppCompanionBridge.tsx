import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/infrastructure/i18n/hooks/useI18n';
import { configManager } from '@/infrastructure/config/services/ConfigManager';
import { flowChatStore } from '@/flow_chat/store/FlowChatStore';
import { useAnnouncementStore } from '@/shared/announcement-system';
import {
  useAgentCompanionEnabled,
  useCompanionScenario,
  type CompanionScenario,
} from '@/shared/companion-system';
import { useCompanionBurst } from '@/shared/companion-system/hooks/useCompanionBurst';
import { useCompanionPulse } from '@/shared/companion-system/hooks/useCompanionPulse';
import { useSceneStore } from '../stores/sceneStore';

const SETTINGS_ENTRY_SELECTOR = '[data-companion-anchor="nav-more-actions"]';
const SESSION_CREATE_SELECTOR = '[data-companion-anchor="nav-create-code-session"]';
const SESSION_LIST_SELECTOR = '[data-companion-anchor="nav-session-list"]';
const ANNOUNCEMENT_TOAST_SELECTOR = '.announcement-toast-stack';
const FEATURE_MODAL_SELECTOR = '.feature-modal';
const GENERIC_MODAL_SELECTOR = '.modal, .confirm-dialog, .ssh-remote-confirm-dialog';

const NO_MODEL_INTERVAL_MS = 62_000;
const NO_MODEL_VISIBLE_MS = 12_000;
const NO_MODEL_DELAY_MS = 7_000;

const NO_SESSION_INTERVAL_MS = 56_000;
const NO_SESSION_VISIBLE_MS = 11_000;
const NO_SESSION_DELAY_MS = 14_000;

const TIP_BURST_MS = 8_500;
const MODAL_BURST_MS = 9_500;

type MinimalModelConfig = {
  id?: string;
  enabled?: boolean;
};

function useSelectorPresence(selector: string): boolean {
  const [present, setPresent] = useState(false);

  useEffect(() => {
    const checkPresence = () => {
      setPresent(document.querySelector(selector) !== null);
    };

    checkPresence();

    const observer = new MutationObserver(() => {
      checkPresence();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', checkPresence);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkPresence);
    };
  }, [selector]);

  return present;
}

function usePrimaryModelConfigured(): boolean {
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let disposed = false;

    const loadConfigState = async () => {
      try {
        const [models, defaultModels] = await Promise.all([
          configManager.getConfig<MinimalModelConfig[]>('ai.models'),
          configManager.getConfig<Record<string, unknown>>('ai.default_models'),
        ]);

        if (disposed) {
          return;
        }

        const enabledModels = (Array.isArray(models) ? models : []).filter(model => (
          Boolean(model?.id) && model.enabled !== false
        ));

        const primaryModelId = typeof defaultModels?.primary === 'string'
          ? defaultModels.primary.trim()
          : '';

        setConfigured(
          primaryModelId.length > 0
          && enabledModels.some(model => model.id === primaryModelId),
        );
      } catch {
        if (!disposed) {
          setConfigured(true);
        }
      }
    };

    void loadConfigState();
    const unsubscribeModels = configManager.watch('ai.models', () => {
      void loadConfigState();
    });
    const unsubscribeDefaultModels = configManager.watch('ai.default_models', () => {
      void loadConfigState();
    });

    return () => {
      disposed = true;
      unsubscribeModels();
      unsubscribeDefaultModels();
    };
  }, []);

  return configured;
}

function useSessionCount(): number {
  const [sessionCount, setSessionCount] = useState(() => flowChatStore.getState().sessions.size);

  useEffect(() => {
    const unsubscribe = flowChatStore.subscribe((state) => {
      const nextCount = state.sessions.size;
      setSessionCount(currentCount => (
        currentCount === nextCount ? currentCount : nextCount
      ));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return sessionCount;
}

export const AppCompanionBridge: React.FC = () => {
  const { t } = useI18n('common');
  const companionEnabled = useAgentCompanionEnabled();
  const activeTabId = useSceneStore(state => state.activeTabId);
  const sessionCount = useSessionCount();
  const primaryModelConfigured = usePrimaryModelConfigured();
  const toastVisible = useAnnouncementStore(state => state.toastVisible);
  const modalVisible = useAnnouncementStore(state => state.modalVisible);
  const genericModalVisible = useSelectorPresence(GENERIC_MODAL_SELECTOR);

  const showModelGuide = useCompanionPulse(
    companionEnabled && !primaryModelConfigured && activeTabId !== 'settings',
    {
      intervalMs: NO_MODEL_INTERVAL_MS,
      visibleMs: NO_MODEL_VISIBLE_MS,
      initialDelayMs: NO_MODEL_DELAY_MS,
    },
  );

  const showSessionGuide = useCompanionPulse(
    companionEnabled && activeTabId !== 'session',
    {
      intervalMs: NO_SESSION_INTERVAL_MS,
      visibleMs: NO_SESSION_VISIBLE_MS,
      initialDelayMs: NO_SESSION_DELAY_MS,
    },
  );

  const showTipCompanion = useCompanionBurst(companionEnabled && toastVisible, TIP_BURST_MS);
  const showFeatureModalCompanion = useCompanionBurst(
    companionEnabled && modalVisible,
    MODAL_BURST_MS,
  );
  const showGenericModalCompanion = useCompanionBurst(
    companionEnabled && !modalVisible && genericModalVisible,
    MODAL_BURST_MS,
  );

  const modelGuideScenario = useMemo<CompanionScenario>(() => ({
    id: 'app:missing-model-companion',
    enabled: showModelGuide,
    priority: 28,
    target: {
      kind: 'floating',
      anchor: {
        type: 'selector',
        selector: SETTINGS_ENTRY_SELECTOR,
        placement: 'top-right',
        offsetX: 8,
        offsetY: -10,
      },
      fallbackAnchor: {
        type: 'viewport',
        position: 'bottom-left',
        offsetX: 18,
        offsetY: -84,
      },
    },
    presentation: {
      action: 'guiding',
      size: 'sm',
      emphasis: 'pulse',
      direction: 'up',
      label: t('nav.agentCompanionHints.modelSetup'),
    },
    behavior: {
      roam: {
        enabled: true,
        radiusX: 18,
        radiusY: 10,
        speed: 'slow',
      },
      interaction: {
        hover: 'dodge',
        click: ['emote', 'tease'],
        emotes: ['?!', '>_<'],
      },
    },
  }), [showModelGuide, t]);
  useCompanionScenario(modelGuideScenario);

  const sessionGuideScenario = useMemo<CompanionScenario>(() => {
    const hasExistingSessions = sessionCount > 0;

    return {
      id: 'app:no-session-companion',
      enabled: showSessionGuide,
      priority: 24,
      target: {
        kind: 'floating',
        anchor: hasExistingSessions
          ? {
            type: 'selector',
            selector: SESSION_LIST_SELECTOR,
            placement: 'right',
            offsetX: 10,
            offsetY: -6,
          }
          : {
            type: 'selector',
            selector: SESSION_CREATE_SELECTOR,
            placement: 'right',
            offsetX: 8,
            offsetY: -6,
          },
        fallbackAnchor: {
          type: 'viewport',
          position: 'center-left',
          offsetX: 24,
          offsetY: -12,
        },
      },
      presentation: {
        action: hasExistingSessions ? 'watching' : 'encouraging',
        size: 'sm',
        emphasis: 'pulse',
        direction: 'right',
        label: hasExistingSessions
          ? t('nav.agentCompanionHints.openSession')
          : t('nav.agentCompanionHints.createSession'),
      },
      behavior: {
        roam: {
          enabled: true,
          radiusX: 22,
          radiusY: 12,
          speed: hasExistingSessions ? 'slow' : 'medium',
        },
        interaction: {
          hover: 'dodge',
          click: ['emote', 'hide'],
          emotes: ['?!', '...'],
        },
      },
    };
  }, [sessionCount, showSessionGuide, t]);
  useCompanionScenario(sessionGuideScenario);

  const tipScenario = useMemo<CompanionScenario>(() => ({
    id: 'app:announcement-tip-companion',
    enabled: showTipCompanion,
    priority: 58,
    target: {
      kind: 'floating',
      anchor: {
        type: 'selector',
        selector: ANNOUNCEMENT_TOAST_SELECTOR,
        placement: 'top-right',
        offsetX: 8,
        offsetY: -12,
      },
      fallbackAnchor: {
        type: 'viewport',
        position: 'bottom-left',
        offsetX: 28,
        offsetY: -110,
      },
    },
    presentation: {
      action: 'watching',
      size: 'sm',
      emphasis: 'pulse',
      label: t('nav.agentCompanionHints.tip'),
    },
    behavior: {
      roam: {
        enabled: true,
        radiusX: 26,
        radiusY: 14,
        speed: 'medium',
      },
      interaction: {
        hover: 'dodge',
        click: ['emote', 'hide', 'tease'],
        emotes: ['?!', '>_<', '...'],
      },
    },
  }), [showTipCompanion, t]);
  useCompanionScenario(tipScenario);

  const featureModalScenario = useMemo<CompanionScenario>(() => ({
    id: 'app:feature-modal-companion',
    enabled: showFeatureModalCompanion,
    priority: 62,
    target: {
      kind: 'floating',
      anchor: {
        type: 'selector',
        selector: FEATURE_MODAL_SELECTOR,
        placement: 'top-right',
        offsetX: 10,
        offsetY: -8,
      },
      fallbackAnchor: {
        type: 'viewport',
        position: 'center-right',
        offsetX: -28,
        offsetY: -18,
      },
    },
    presentation: {
      action: 'keeping-company',
      size: 'md',
      emphasis: 'pulse',
      label: t('nav.agentCompanionHints.dialog'),
    },
    behavior: {
      roam: {
        enabled: true,
        radiusX: 24,
        radiusY: 16,
        speed: 'slow',
      },
      interaction: {
        hover: 'dodge',
        click: ['emote', 'tease'],
        emotes: ['?!', '*'],
      },
    },
  }), [showFeatureModalCompanion, t]);
  useCompanionScenario(featureModalScenario);

  const genericModalScenario = useMemo<CompanionScenario>(() => ({
    id: 'app:modal-companion',
    enabled: showGenericModalCompanion,
    priority: 56,
    target: {
      kind: 'floating',
      anchor: {
        type: 'selector',
        selector: GENERIC_MODAL_SELECTOR,
        placement: 'top-right',
        offsetX: 10,
        offsetY: -10,
      },
      fallbackAnchor: {
        type: 'viewport',
        position: 'center-right',
        offsetX: -22,
        offsetY: -12,
      },
    },
    presentation: {
      action: 'checking-in',
      size: 'sm',
      emphasis: 'pulse',
      label: t('nav.agentCompanionHints.dialog'),
    },
    behavior: {
      roam: {
        enabled: true,
        radiusX: 20,
        radiusY: 12,
        speed: 'medium',
      },
      interaction: {
        hover: 'dodge',
        click: ['emote', 'hide'],
        emotes: ['?!', '...'],
      },
    },
  }), [showGenericModalCompanion, t]);
  useCompanionScenario(genericModalScenario);

  return null;
};

AppCompanionBridge.displayName = 'AppCompanionBridge';
