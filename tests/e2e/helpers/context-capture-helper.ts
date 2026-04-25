import { browser } from '@wdio/globals';

export async function installContextCaptureMock(): Promise<void> {
  await browser.execute(async () => {
    const win = window as Window & {
      __BITFUN_E2E_CONTEXT_CAPTURE__?: {
        consentAccepted: boolean;
        screenshotCount: number;
        recordingCount: number;
        recordingActive: boolean;
        currentRecordingId: string | null;
        getStatusCalls: number;
        startRecordingCalls: number;
        stopRecordingCalls: number;
        deleteArtifactCalls: number;
        lastDeletedArtifactPath: string | null;
      };
      __TAURI__?: unknown;
    };

    win.__TAURI__ = win.__TAURI__ ?? {};
    win.__BITFUN_E2E_CONTEXT_CAPTURE__ = {
      consentAccepted: false,
      screenshotCount: 0,
      recordingCount: 0,
      recordingActive: false,
      currentRecordingId: null,
      getStatusCalls: 0,
      startRecordingCalls: 0,
      stopRecordingCalls: 0,
      deleteArtifactCalls: 0,
      lastDeletedArtifactPath: null,
    };

    const [{ contextCaptureAPI }, { configManager }, { useContextStore }] = await Promise.all([
      import('/src/infrastructure/api/service-api/ContextCaptureAPI.ts'),
      import('/src/infrastructure/config/services/ConfigManager.ts'),
      import('/src/shared/context-system/index.ts'),
    ]);

    const getState = () => {
      const state = win.__BITFUN_E2E_CONTEXT_CAPTURE__;
      if (!state) {
        throw new Error('Context capture mock state was not initialized');
      }
      return state;
    };

    const makeFrame = (
      id: string,
      imageName: string,
      metadata: Record<string, unknown>,
    ) => ({
      id,
      imagePath: `mock/context-capture/${imageName}`,
      imageName,
      mimeType: 'image/jpeg',
      fileSize: 1024,
      width: 320,
      height: 200,
      thumbnailDataUrl:
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      source: 'file' as const,
      metadata,
    });

    const makeVideo = (
      id: string,
      videoName: string,
      metadata: Record<string, unknown>,
    ) => ({
      id,
      videoPath: `mock/context-capture/${videoName}`,
      videoName,
      mimeType: 'video/webm',
      fileSize: 2048,
      width: 480,
      height: 320,
      durationMs: 1600,
      thumbnailDataUrl:
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
      source: 'file' as const,
      metadata,
    });

    contextCaptureAPI.getStatus = async () => {
      const state = getState();
      state.getStatusCalls += 1;
      return {
        enabled: true,
        screenCaptureGranted: true,
        consentRequired: !state.consentAccepted,
        recordingActive: state.recordingActive,
        platformNote: null,
      };
    };

    contextCaptureAPI.ackPrivacyConsent = async () => {
      const state = getState();
      state.consentAccepted = true;
    };

    contextCaptureAPI.takeScreenshot = async () => {
      const state = getState();
      state.screenshotCount += 1;
      return makeFrame(
        `mock-screenshot-${state.screenshotCount}`,
        `mock-screenshot-${state.screenshotCount}.jpg`,
        {
          captureKind: 'screenshot',
          capturedAt: Date.now(),
        },
      );
    };

    contextCaptureAPI.startRecording = async () => {
      const state = getState();
      state.startRecordingCalls += 1;
      state.recordingCount += 1;
      state.recordingActive = true;
      state.currentRecordingId = `mock-recording-${state.recordingCount}`;
      return {
        recordingId: state.currentRecordingId,
        startedAtMs: Date.now(),
        expiresAtMs: Date.now() + 10_000,
      };
    };

    contextCaptureAPI.stopRecording = async ({ recordingId }) => {
      const state = getState();
      state.stopRecordingCalls += 1;
      state.recordingActive = false;
      state.currentRecordingId = null;

      const captureGroupId = `mock-group-${recordingId}`;
      const video = makeVideo(
        `${captureGroupId}-video`,
        `${captureGroupId}.webm`,
        {
          captureKind: 'recording',
          captureGroupId,
          capturedAt: Date.now(),
          recordingDurationMs: 1600,
          managedArtifact: true,
        },
      );

      return {
        recordingId,
        captureGroupId,
        durationMs: 1600,
        rawFrameCount: 4,
        video,
      };
    };

    contextCaptureAPI.deleteManagedArtifact = async ({ artifactPath }: { artifactPath?: string }) => {
      const state = getState();
      state.deleteArtifactCalls += 1;
      state.lastDeletedArtifactPath = artifactPath || null;
    };

    await configManager.setConfig('app.context_capture.enabled', true);
    await configManager.setConfig('app.context_capture.feature_intro_seen', true);
    await configManager.setConfig('app.context_capture.capture_privacy_acknowledged_at', null);
    await configManager.setConfig('app.context_capture.recording_notice_acknowledged_at', null);
    useContextStore.getState().clearContexts();
  });
}

export async function resetContextCaptureMockForInteraction(): Promise<void> {
  await browser.execute(async () => {
    const win = window as Window & {
      __BITFUN_E2E_CONTEXT_CAPTURE__?: {
        consentAccepted: boolean;
        screenshotCount: number;
        recordingCount: number;
        recordingActive: boolean;
        currentRecordingId: string | null;
        getStatusCalls: number;
        startRecordingCalls: number;
        stopRecordingCalls: number;
        deleteArtifactCalls: number;
        lastDeletedArtifactPath: string | null;
      };
    };

    const { useContextStore } = await import('/src/shared/context-system/index.ts');
    const state = win.__BITFUN_E2E_CONTEXT_CAPTURE__;
    if (!state) {
      throw new Error('Context capture mock state was not installed');
    }

    state.recordingActive = false;
    state.currentRecordingId = null;
    state.startRecordingCalls = 0;
    state.stopRecordingCalls = 0;
    state.deleteArtifactCalls = 0;
    state.lastDeletedArtifactPath = null;
    useContextStore.getState().clearContexts();
  });
}

export interface ContextCaptureMockState {
  consentAccepted: boolean;
  screenshotCount: number;
  recordingCount: number;
  recordingActive: boolean;
  currentRecordingId: string | null;
  getStatusCalls: number;
  startRecordingCalls: number;
  stopRecordingCalls: number;
  deleteArtifactCalls: number;
  lastDeletedArtifactPath: string | null;
}

export async function getContextCaptureMockState(): Promise<ContextCaptureMockState> {
  return browser.execute(() => {
    const win = window as Window & {
      __BITFUN_E2E_CONTEXT_CAPTURE__?: ContextCaptureMockState;
    };

    const state = win.__BITFUN_E2E_CONTEXT_CAPTURE__;
    if (!state) {
      throw new Error('Context capture mock state was not installed');
    }

    return { ...state };
  });
}
