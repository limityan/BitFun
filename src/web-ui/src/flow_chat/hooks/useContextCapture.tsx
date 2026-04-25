import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageContext, VideoContext } from '@/shared/types/context';
import { createLogger } from '@/shared/utils/logger';
import { notificationService } from '@/shared/notification-system';
import { announcementService, useAnnouncementStore } from '@/shared/announcement-system';
import {
  contextCaptureAPI,
  type CaptureSessionRequest,
  type ContextCaptureImage,
  type ContextCaptureStartRecordingRequest,
  type ContextCaptureStatus,
  type ContextCaptureVideo,
} from '@/infrastructure/api/service-api/ContextCaptureAPI';
import { confirmWarning } from '@/component-library/components/ConfirmDialog/confirmService';
import { configManager } from '@/infrastructure/config/services/ConfigManager';

const log = createLogger('useContextCapture');
const CONTEXT_CAPTURE_PRIVACY_VERSION = 1;
const CONTEXT_CAPTURE_RECORDING_NOTICE_VERSION = 1;
const CONTEXT_CAPTURE_FEATURE_CARD_ID = 'feature_context_capture_v0_2_3';
const CONTEXT_CAPTURE_RECORDING_LIMITATIONS_DELAY_MS = 3000;

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const candidate = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  };

  return '__TAURI__' in candidate || '__TAURI_INTERNALS__' in candidate;
}

function toImageContext(frame: ContextCaptureImage): ImageContext {
  return {
    id: frame.id,
    type: 'image',
    imagePath: frame.imagePath,
    imageName: frame.imageName,
    width: frame.width,
    height: frame.height,
    fileSize: frame.fileSize,
    mimeType: frame.mimeType,
    thumbnailUrl: frame.thumbnailDataUrl || undefined,
    source: 'file',
    isLocal: true,
    timestamp: Date.now(),
    metadata: frame.metadata ?? {},
  };
}

function toVideoContext(video: ContextCaptureVideo): VideoContext {
  return {
    id: video.id,
    type: 'video',
    videoPath: video.videoPath,
    videoName: video.videoName,
    width: video.width,
    height: video.height,
    durationMs: video.durationMs,
    fileSize: video.fileSize,
    mimeType: video.mimeType,
    thumbnailUrl: video.thumbnailDataUrl || undefined,
    source: 'file',
    isLocal: true,
    timestamp: Date.now(),
    metadata: video.metadata ?? {},
  };
}

export interface UseContextCaptureOptions {
  sessionId?: string;
  workspacePath?: string;
  remoteConnectionId?: string;
  remoteSshHost?: string;
}

export interface ContextCaptureActionOptions {
  minimizeBeforeCapture?: boolean;
}

export interface UseContextCaptureResult {
  status: ContextCaptureStatus | null;
  isSupportedEnvironment: boolean;
  isTakingScreenshot: boolean;
  isRecording: boolean;
  isProcessingRecordingFrames: boolean;
  countdownMs: number;
  refreshStatus: () => Promise<ContextCaptureStatus | null>;
  takeScreenshot: (actionOptions?: ContextCaptureActionOptions) => Promise<ImageContext | null>;
  startRecording: (actionOptions?: ContextCaptureActionOptions) => Promise<boolean>;
  stopRecording: () => Promise<VideoContext | null>;
}

interface ContextCaptureConsentResult {
  accepted: boolean;
  confirmedForRequest: boolean;
}

export function useContextCapture(
  options: UseContextCaptureOptions
): UseContextCaptureResult {
  const { t } = useTranslation('flow-chat');
  const enqueueAnnouncementCards = useAnnouncementStore((state) => state.enqueueCards);
  const [status, setStatus] = useState<ContextCaptureStatus | null>(null);
  const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);
  const [recordingSession, setRecordingSession] = useState<{
    recordingId: string;
    expiresAtMs: number;
  } | null>(null);
  const [isProcessingRecordingFrames, setIsProcessingRecordingFrames] = useState(false);
  const [countdownMs, setCountdownMs] = useState(0);
  const featureIntroHandledRef = useRef(false);

  const isSupportedEnvironment = useMemo(() => isTauriRuntime(), []);
  const isRecording = !!recordingSession;

  const refreshStatus = useCallback(async (): Promise<ContextCaptureStatus | null> => {
    if (!isSupportedEnvironment) {
      setStatus(null);
      return null;
    }

    try {
      const nextStatus = await contextCaptureAPI.getStatus();
      setStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      log.warn('Failed to load context capture status', { error });
      return null;
    }
  }, [isSupportedEnvironment]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const maybeQueueFeatureIntro = useCallback(async (currentStatus?: ContextCaptureStatus | null) => {
    if (!isSupportedEnvironment || featureIntroHandledRef.current) {
      return;
    }

    const effectiveStatus = currentStatus ?? status ?? await refreshStatus();
    if (!effectiveStatus?.enabled) {
      return;
    }

    featureIntroHandledRef.current = true;

    try {
      const featureIntroSeen =
        await configManager.getConfig<boolean>('app.context_capture.feature_intro_seen');
      if (featureIntroSeen) {
        return;
      }

      const card = await announcementService.triggerCard(CONTEXT_CAPTURE_FEATURE_CARD_ID);
      if (!card) {
        log.warn('Context capture feature intro card was not registered', {
          cardId: CONTEXT_CAPTURE_FEATURE_CARD_ID,
        });
        return;
      }

      enqueueAnnouncementCards([card]);
      await configManager.setConfig('app.context_capture.feature_intro_seen', true);
    } catch (error) {
      log.warn('Failed to queue context capture feature intro', { error });
    }
  }, [enqueueAnnouncementCards, isSupportedEnvironment, refreshStatus, status]);

  useEffect(() => {
    if (!status?.enabled) {
      return;
    }

    void maybeQueueFeatureIntro(status);
  }, [maybeQueueFeatureIntro, status]);

  useEffect(() => {
    if (!recordingSession) {
      setCountdownMs(0);
      return;
    }

    const updateCountdown = () => {
      setCountdownMs(Math.max(0, recordingSession.expiresAtMs - Date.now()));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 200);
    return () => window.clearInterval(timer);
  }, [recordingSession]);

  const ensureConsent = useCallback(async (
    currentStatus: ContextCaptureStatus
  ): Promise<ContextCaptureConsentResult> => {
    const [acknowledgedAt, acknowledgedVersion] = await Promise.all([
      configManager.getConfig<number | null>('app.context_capture.capture_privacy_acknowledged_at'),
      configManager.getConfig<number>('app.context_capture.capture_privacy_version'),
    ]);
    if (
      !currentStatus.consentRequired
      && !!acknowledgedAt
      && (acknowledgedVersion || 0) >= CONTEXT_CAPTURE_PRIVACY_VERSION
    ) {
      return { accepted: true, confirmedForRequest: false };
    }

    let rememberChoice = false;

    const agreed = await confirmWarning(
      t('contextCapture.consentTitle', { defaultValue: 'Allow screenshots or recordings to be attached to chat?' }),
      (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0 }}>
            {t('contextCapture.consentIntro', {
              defaultValue: 'Screenshots and recordings may contain passwords, notifications, customer data, or other sensitive information.'
            })}
          </p>
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            <li>
              {t('contextCapture.consentItemProvider', {
                defaultValue: 'Captured media can be sent to the currently selected model provider after you send the message.'
              })}
            </li>
            <li>
              {t('contextCapture.consentItemLocalStorage', {
                defaultValue: 'BitFun stores managed screenshots and recordings locally in the current session artifacts for preview and history.'
              })}
            </li>
            <li>
              {t('contextCapture.consentItemReview', {
                defaultValue: 'You can remove the media before sending.'
              })}
            </li>
            <li>
              {t('contextCapture.consentItemNoBackgroundRecording', {
                defaultValue: 'BitFun will not capture your screen in the background or send screenshots or recordings automatically.'
              })}
            </li>
          </ul>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              defaultChecked={false}
              onChange={(event) => {
                rememberChoice = event.target.checked;
              }}
            />
            <span>
              {t('contextCapture.skipPromptLabel', {
                defaultValue: 'I understand, do not show this again',
              })}
            </span>
          </label>
        </div>
      ),
      {
        confirmText: t('contextCapture.consentAccept', { defaultValue: 'Continue' }),
        cancelText: t('contextCapture.consentDecline', { defaultValue: 'Close' }),
      }
    );

    if (agreed && rememberChoice) {
      await contextCaptureAPI.ackPrivacyConsent({
        version: CONTEXT_CAPTURE_PRIVACY_VERSION,
      });
      await refreshStatus();
    }

    return {
      accepted: agreed,
      confirmedForRequest: agreed,
    };
  }, [refreshStatus, t]);

  const ensureRecordingLimitationsAcknowledged = useCallback(async (): Promise<boolean> => {
    const [acknowledgedAt, acknowledgedVersion] = await Promise.all([
      configManager.getConfig<number | null>('app.context_capture.recording_notice_acknowledged_at'),
      configManager.getConfig<number>('app.context_capture.recording_notice_version'),
    ]);
    if (
      !!acknowledgedAt
      && (acknowledgedVersion || 0) >= CONTEXT_CAPTURE_RECORDING_NOTICE_VERSION
    ) {
      return true;
    }

    let rememberChoice = false;

    const acknowledged = await confirmWarning(
      t('contextCapture.recordingLimitationsTitle', {
        defaultValue: 'Recording has a few capture limitations',
      }),
      (
        <div style={{ display: 'grid', gap: 8 }}>
          <p style={{ margin: 0 }}>
            {t('contextCapture.recordingLimitationsIntro', {
              defaultValue: 'Before you start: recording in chat is intentionally lightweight and has a few limits. After 3 seconds, you can either close this prompt or continue recording.',
            })}
          </p>
          <ul style={{ margin: 0, paddingInlineStart: 20 }}>
            <li>
              {t('contextCapture.recordingLimitationsItemDuration', {
                defaultValue: 'Recording lasts up to 10 seconds and is saved as one short video.',
              })}
            </li>
            <li>
              {t('contextCapture.recordingLimitationsItemAudio', {
                defaultValue: 'Audio is not recorded, and some protected or DRM surfaces may not be captured.',
              })}
            </li>
            <li>
              {t('contextCapture.recordingLimitationsItemCompression', {
                defaultValue: 'The video is compressed locally, and BitFun samples frames for analysis before sending it to a multimodal model.',
              })}
            </li>
            <li>
              {t('contextCapture.recordingLimitationsItemMinimize', {
                defaultValue: 'If you choose the minimize option, BitFun will restore the app after the capture ends.',
              })}
            </li>
          </ul>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              defaultChecked={false}
              onChange={(event) => {
                rememberChoice = event.target.checked;
              }}
            />
            <span>
              {t('contextCapture.skipPromptLabel', {
                defaultValue: 'I understand, do not show this again',
              })}
            </span>
          </label>
        </div>
      ),
      {
        confirmText: t('contextCapture.recordingLimitationsConfirm', {
          defaultValue: 'Continue recording',
        }),
        cancelText: t('contextCapture.recordingLimitationsCancel', {
          defaultValue: 'Close',
        }),
        confirmDelayMs: CONTEXT_CAPTURE_RECORDING_LIMITATIONS_DELAY_MS,
      },
    );

    if (acknowledged && rememberChoice) {
      await Promise.all([
        configManager.setConfig(
          'app.context_capture.recording_notice_version',
          CONTEXT_CAPTURE_RECORDING_NOTICE_VERSION,
        ),
        configManager.setConfig(
          'app.context_capture.recording_notice_acknowledged_at',
          Date.now(),
        ),
      ]);
    }

    return acknowledged;
  }, [t]);

  const takeScreenshot = useCallback(async (
    actionOptions: ContextCaptureActionOptions = {},
  ): Promise<ImageContext | null> => {
    if (!isSupportedEnvironment) {
      notificationService.warning(
        t('contextCapture.desktopOnly', {
          defaultValue: 'Screenshot capture is only available in the desktop app.'
        }),
        { duration: 4000 }
      );
      return null;
    }

    if (recordingSession || isProcessingRecordingFrames) {
      notificationService.warning(
        t('contextCapture.finishRecordingFirst', {
          defaultValue: 'Finish the current recording before taking a screenshot.'
        }),
        { duration: 4000 }
      );
      return null;
    }

    if (!options.sessionId || !options.workspacePath) {
      notificationService.warning(
        t('contextCapture.sessionRequired', {
          defaultValue: 'Open a session before capturing a screenshot.'
        }),
        { duration: 4000 }
      );
      return null;
    }

    setIsTakingScreenshot(true);
    try {
      const currentStatus = await refreshStatus() ?? status;
      if (!currentStatus) {
        throw new Error(
          t('contextCapture.statusUnavailable', {
            defaultValue: 'Unable to check screenshot availability right now.'
          })
        );
      }

      if (!currentStatus.enabled) {
        notificationService.warning(
          t('contextCapture.disabled', {
            defaultValue: 'Screenshot capture is disabled in the current configuration.'
          }),
          { duration: 4000 }
        );
        return null;
      }

      if (!currentStatus.screenCaptureGranted) {
        notificationService.warning(
          currentStatus.platformNote || t('contextCapture.permissionRequired', {
            defaultValue: 'Screen capture permission is required before taking a screenshot.'
          }),
          { duration: 5000 }
        );
        return null;
      }

      void maybeQueueFeatureIntro(currentStatus);

      const consentResult = await ensureConsent(currentStatus);
      if (!consentResult.accepted) {
        return null;
      }

      const request: CaptureSessionRequest = {
        sessionId: options.sessionId,
        workspacePath: options.workspacePath,
        remoteConnectionId: options.remoteConnectionId,
        remoteSshHost: options.remoteSshHost,
        minimizeBeforeCapture: actionOptions.minimizeBeforeCapture,
        privacyConsentConfirmed: consentResult.confirmedForRequest || undefined,
      };
      const frame = await contextCaptureAPI.takeScreenshot(request);
      return toImageContext(frame);
    } catch (error) {
      log.error('Failed to take screenshot for chat input', {
        error,
        sessionId: options.sessionId,
        workspacePath: options.workspacePath,
      });
      notificationService.error(
        error instanceof Error ? error.message : t('error.unknown'),
        {
          title: t('contextCapture.captureFailed', { defaultValue: 'Screenshot failed' }),
          duration: 5000,
        }
      );
      return null;
    } finally {
      setIsTakingScreenshot(false);
    }
  }, [
    ensureConsent,
    isSupportedEnvironment,
    options.remoteConnectionId,
    options.remoteSshHost,
    options.sessionId,
    options.workspacePath,
    refreshStatus,
    isProcessingRecordingFrames,
    maybeQueueFeatureIntro,
    recordingSession,
    status,
    t,
  ]);

  const startRecording = useCallback(async (
    actionOptions: ContextCaptureActionOptions = {},
  ): Promise<boolean> => {
    if (!isSupportedEnvironment) {
      notificationService.warning(
        t('contextCapture.desktopOnly', {
          defaultValue: 'Recording is only available in the desktop app.'
        }),
        { duration: 4000 }
      );
      return false;
    }

    if (recordingSession || isProcessingRecordingFrames) {
      return false;
    }

    if (!options.sessionId || !options.workspacePath) {
      notificationService.warning(
        t('contextCapture.sessionRequired', {
          defaultValue: 'Open a session before starting a recording.'
        }),
        { duration: 4000 }
      );
      return false;
    }

    try {
      const currentStatus = await refreshStatus() ?? status;
      if (!currentStatus) {
        throw new Error(
          t('contextCapture.statusUnavailable', {
            defaultValue: 'Unable to check recording availability right now.'
          })
        );
      }

      if (!currentStatus.enabled) {
        notificationService.warning(
          t('contextCapture.disabled', {
            defaultValue: 'Screenshot capture is disabled in the current configuration.'
          }),
          { duration: 4000 }
        );
        return false;
      }

      if (!currentStatus.screenCaptureGranted) {
        notificationService.warning(
          currentStatus.platformNote || t('contextCapture.permissionRequired', {
            defaultValue: 'Screen capture permission is required before recording.'
          }),
          { duration: 5000 }
        );
        return false;
      }

      void maybeQueueFeatureIntro(currentStatus);

      const consentResult = await ensureConsent(currentStatus);
      if (!consentResult.accepted) {
        return false;
      }

      const limitationsAcknowledged = await ensureRecordingLimitationsAcknowledged();
      if (!limitationsAcknowledged) {
        return false;
      }

      const request: ContextCaptureStartRecordingRequest = {
        sessionId: options.sessionId,
        workspacePath: options.workspacePath,
        remoteConnectionId: options.remoteConnectionId,
        remoteSshHost: options.remoteSshHost,
        minimizeBeforeCapture: actionOptions.minimizeBeforeCapture,
        privacyConsentConfirmed: consentResult.confirmedForRequest || undefined,
        maxDurationMs: 10_000,
        intervalMs: 500,
      };
      const response = await contextCaptureAPI.startRecording(request);
      setCountdownMs(Math.max(0, response.expiresAtMs - Date.now()));
      setRecordingSession({
        recordingId: response.recordingId,
        expiresAtMs: response.expiresAtMs,
      });
      await refreshStatus();
      return true;
    } catch (error) {
      log.error('Failed to start context capture recording', {
        error,
        sessionId: options.sessionId,
        workspacePath: options.workspacePath,
      });
      notificationService.error(
        error instanceof Error ? error.message : t('error.unknown'),
        {
          title: t('contextCapture.recordingStartFailed', { defaultValue: 'Recording failed to start' }),
          duration: 5000,
        }
      );
      return false;
    }
  }, [
    ensureConsent,
    ensureRecordingLimitationsAcknowledged,
    isProcessingRecordingFrames,
    isSupportedEnvironment,
    options.remoteConnectionId,
    options.remoteSshHost,
    options.sessionId,
    options.workspacePath,
    maybeQueueFeatureIntro,
    recordingSession,
    refreshStatus,
    status,
    t,
  ]);

  const stopRecording = useCallback(async (): Promise<VideoContext | null> => {
    if (!recordingSession) {
      return null;
    }

    const recordingId = recordingSession.recordingId;
    setIsProcessingRecordingFrames(true);
    try {
      const response = await contextCaptureAPI.stopRecording({ recordingId });
      setRecordingSession(null);
      setCountdownMs(0);
      await refreshStatus();
      return toVideoContext(response.video);
    } catch (error) {
      log.error('Failed to stop context capture recording', {
        error,
        recordingId,
      });
      setRecordingSession(null);
      setCountdownMs(0);
      notificationService.error(
        error instanceof Error ? error.message : t('error.unknown'),
        {
          title: t('contextCapture.recordingStopFailed', { defaultValue: 'Recording failed to stop' }),
          duration: 5000,
        }
      );
      await refreshStatus();
      return null;
    } finally {
      setIsProcessingRecordingFrames(false);
    }
  }, [recordingSession, refreshStatus, t]);

  return {
    status,
    isSupportedEnvironment,
    isTakingScreenshot,
    isRecording,
    isProcessingRecordingFrames,
    countdownMs,
    refreshStatus,
    takeScreenshot,
    startRecording,
    stopRecording,
  };
}
