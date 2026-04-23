import React, { useMemo } from 'react';
import { useActiveNotifications } from '../hooks/useNotificationState';
import { useAgentCompanionEnabled, useCompanionScenario } from '@/shared/companion-system';
import type { CompanionScenario } from '@/shared/companion-system';

const NOTIFICATION_COMPANION_ID = 'notification:important-companion';

export const NotificationCompanionBridge: React.FC = () => {
  const companionEnabled = useAgentCompanionEnabled();
  const activeNotifications = useActiveNotifications();

  const importantNotification = useMemo(() => {
    const candidates = activeNotifications.filter(notification => (
      notification.status === 'active' &&
      notification.variant !== 'silent' &&
      notification.variant !== 'progress' &&
      notification.variant !== 'loading' &&
      (notification.type === 'error' || notification.type === 'warning')
    ));

    if (candidates.length === 0) {
      return null;
    }

    return candidates.reduce((latest, current) => (
      current.timestamp > latest.timestamp ? current : latest
    ));
  }, [activeNotifications]);

  const scenario = useMemo<CompanionScenario>(() => ({
    id: NOTIFICATION_COMPANION_ID,
    enabled: companionEnabled && !!importantNotification,
    priority: importantNotification?.type === 'error' ? 100 : 85,
    target: {
      kind: 'floating',
      anchor: {
        type: 'selector',
        selector: '.notification-container',
        placement: 'right',
        offsetX: 8,
        offsetY: importantNotification?.type === 'error' ? -6 : 0,
      },
    },
    presentation: {
      action: 'alerting',
      size: importantNotification?.type === 'error' ? 'lg' : 'md',
      emphasis: importantNotification?.type === 'error' ? 'dramatic' : 'pulse',
    },
  }), [companionEnabled, importantNotification]);

  useCompanionScenario(scenario);

  return null;
};

NotificationCompanionBridge.displayName = 'NotificationCompanionBridge';
