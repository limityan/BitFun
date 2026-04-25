// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useContextCapture, type UseContextCaptureOptions, type UseContextCaptureResult } from './useContextCapture';

const mocks = vi.hoisted(() => ({
  ackPrivacyConsent: vi.fn(),
  confirmWarning: vi.fn(),
  getConfig: vi.fn(),
  getStatus: vi.fn(),
  setConfig: vi.fn(),
  startRecording: vi.fn(),
  takeScreenshot: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
  }),
}));

vi.mock('@/shared/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('@/shared/notification-system', () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/shared/announcement-system', () => ({
  announcementService: {
    triggerCard: vi.fn(),
  },
  useAnnouncementStore: (selector: (state: { enqueueCards: () => void }) => unknown) =>
    selector({ enqueueCards: vi.fn() }),
}));

vi.mock('@/infrastructure/api/service-api/ContextCaptureAPI', () => ({
  contextCaptureAPI: {
    ackPrivacyConsent: mocks.ackPrivacyConsent,
    getStatus: mocks.getStatus,
    startRecording: mocks.startRecording,
    takeScreenshot: mocks.takeScreenshot,
  },
}));

vi.mock('@/component-library/components/ConfirmDialog/confirmService', () => ({
  confirmWarning: mocks.confirmWarning,
}));

vi.mock('@/infrastructure/config/services/ConfigManager', () => ({
  configManager: {
    getConfig: mocks.getConfig,
    setConfig: mocks.setConfig,
  },
}));

let latestHookResult: UseContextCaptureResult | null = null;

function Harness({ options }: { options: UseContextCaptureOptions }) {
  latestHookResult = useContextCapture(options);
  return null;
}

function triggerCheckbox(node: React.ReactNode, checked: boolean): boolean {
  if (!React.isValidElement(node)) {
    return false;
  }

  if (node.type === 'input' && node.props?.type === 'checkbox') {
    node.props.onChange?.({ target: { checked } });
    return true;
  }

  return React.Children.toArray(node.props?.children).some((child) =>
    triggerCheckbox(child, checked)
  );
}

function createStatus(overrides: Record<string, unknown> = {}) {
  return {
    enabled: true,
    screenCaptureGranted: true,
    consentRequired: false,
    recordingActive: false,
    platformNote: null,
    ...overrides,
  };
}

describe('useContextCapture consent handling', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    latestHookResult = null;

    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

    mocks.ackPrivacyConsent.mockReset();
    mocks.confirmWarning.mockReset();
    mocks.getConfig.mockReset();
    mocks.getStatus.mockReset();
    mocks.setConfig.mockReset();
    mocks.startRecording.mockReset();
    mocks.takeScreenshot.mockReset();

    mocks.getConfig.mockImplementation(async (key: string) => {
      if (key === 'app.context_capture.feature_intro_seen') {
        return true;
      }
      return null;
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  async function renderHook() {
    await act(async () => {
      root.render(
        <Harness
          options={{
            sessionId: 'session-1',
            workspacePath: 'C:\\workspace',
          }}
        />
      );
    });
    expect(latestHookResult).not.toBeNull();
    return latestHookResult!;
  }

  it('does not persist privacy consent when the user checks skip but closes the prompt', async () => {
    mocks.getStatus.mockResolvedValue(createStatus({ consentRequired: true }));
    mocks.confirmWarning.mockImplementation(async (_title: string, body: React.ReactNode) => {
      expect(triggerCheckbox(body, true)).toBe(true);
      return false;
    });

    const hook = await renderHook();
    let result: Awaited<ReturnType<UseContextCaptureResult['takeScreenshot']>> = null;
    await act(async () => {
      result = await hook.takeScreenshot();
    });

    expect(result).toBeNull();
    expect(mocks.ackPrivacyConsent).not.toHaveBeenCalled();
    expect(mocks.takeScreenshot).not.toHaveBeenCalled();
  });

  it('passes one-time privacy consent without persisting it when skip is unchecked', async () => {
    mocks.getStatus.mockResolvedValue(createStatus({ consentRequired: true }));
    mocks.confirmWarning.mockResolvedValue(true);
    mocks.takeScreenshot.mockResolvedValue({
      id: 'capture-1',
      imagePath: 'C:\\workspace\\.bitfun\\sessions\\session-1\\artifacts\\context-capture\\screenshots\\shot.jpg',
      imageName: 'shot.jpg',
      mimeType: 'image/jpeg',
      fileSize: 100,
      width: 640,
      height: 360,
      source: 'file',
      metadata: {},
    });

    const hook = await renderHook();
    let result: Awaited<ReturnType<UseContextCaptureResult['takeScreenshot']>> = null;
    await act(async () => {
      result = await hook.takeScreenshot();
    });

    expect(result?.id).toBe('capture-1');
    expect(mocks.ackPrivacyConsent).not.toHaveBeenCalled();
    expect(mocks.takeScreenshot).toHaveBeenCalledWith(expect.objectContaining({
      privacyConsentConfirmed: true,
    }));
  });

  it('does not persist recording notice when the user checks skip but closes the prompt', async () => {
    mocks.getStatus.mockResolvedValue(createStatus());
    mocks.confirmWarning.mockImplementation(async (_title: string, body: React.ReactNode) => {
      expect(triggerCheckbox(body, true)).toBe(true);
      return false;
    });

    const hook = await renderHook();
    let result = false;
    await act(async () => {
      result = await hook.startRecording();
    });

    expect(result).toBe(false);
    expect(mocks.setConfig).not.toHaveBeenCalledWith(
      'app.context_capture.recording_notice_acknowledged_at',
      expect.any(Number),
    );
    expect(mocks.startRecording).not.toHaveBeenCalled();
  });
});
