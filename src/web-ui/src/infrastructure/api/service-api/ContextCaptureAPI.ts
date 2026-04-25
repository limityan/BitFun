import { api } from './ApiClient';
import { createTauriCommandError } from '../errors/TauriCommandError';

export interface ContextCaptureStatus {
  enabled: boolean;
  screenCaptureGranted: boolean;
  consentRequired: boolean;
  recordingActive: boolean;
  platformNote?: string | null;
}

export interface ContextCaptureAckPrivacyConsentRequest {
  version: number;
}

export interface CaptureSessionRequest {
  sessionId: string;
  workspacePath: string;
  remoteConnectionId?: string;
  remoteSshHost?: string;
  minimizeBeforeCapture?: boolean;
  privacyConsentConfirmed?: boolean;
}

export interface ContextCaptureStartRecordingRequest extends CaptureSessionRequest {
  maxDurationMs?: number;
  intervalMs?: number;
}

export interface ContextCaptureStartRecordingResponse {
  recordingId: string;
  startedAtMs: number;
  expiresAtMs: number;
}

export interface ContextCaptureStopRecordingRequest {
  recordingId: string;
}

export interface ContextCaptureStopRecordingResponse {
  recordingId: string;
  captureGroupId: string;
  durationMs: number;
  rawFrameCount: number;
  video: ContextCaptureVideo;
}

export interface ContextCaptureImage {
  id: string;
  imagePath: string;
  imageName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  thumbnailDataUrl?: string | null;
  source: 'file';
  metadata: Record<string, unknown>;
}

export interface ContextCaptureVideo {
  id: string;
  videoPath: string;
  videoName: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  durationMs: number;
  thumbnailDataUrl?: string | null;
  source: 'file';
  metadata: Record<string, unknown>;
}

export interface ContextCaptureDeleteManagedArtifactRequest {
  artifactPath: string;
  sessionId?: string;
  workspacePath?: string;
  remoteConnectionId?: string;
  remoteSshHost?: string;
}

export class ContextCaptureAPI {
  async getStatus(): Promise<ContextCaptureStatus> {
    try {
      return await api.invoke<ContextCaptureStatus>('context_capture_get_status');
    } catch (error) {
      throw createTauriCommandError('context_capture_get_status', error);
    }
  }

  async takeScreenshot(
    request: CaptureSessionRequest
  ): Promise<ContextCaptureImage> {
    try {
      return await api.invoke<ContextCaptureImage>('context_capture_take_screenshot', { request });
    } catch (error) {
      throw createTauriCommandError('context_capture_take_screenshot', error, request);
    }
  }

  async ackPrivacyConsent(
    request: ContextCaptureAckPrivacyConsentRequest
  ): Promise<void> {
    try {
      await api.invoke<void>('context_capture_ack_privacy_consent', { request });
    } catch (error) {
      throw createTauriCommandError('context_capture_ack_privacy_consent', error, request);
    }
  }

  async startRecording(
    request: ContextCaptureStartRecordingRequest
  ): Promise<ContextCaptureStartRecordingResponse> {
    try {
      return await api.invoke<ContextCaptureStartRecordingResponse>('context_capture_start_recording', { request });
    } catch (error) {
      throw createTauriCommandError('context_capture_start_recording', error, request);
    }
  }

  async stopRecording(
    request: ContextCaptureStopRecordingRequest
  ): Promise<ContextCaptureStopRecordingResponse> {
    try {
      return await api.invoke<ContextCaptureStopRecordingResponse>('context_capture_stop_recording', { request });
    } catch (error) {
      throw createTauriCommandError('context_capture_stop_recording', error, request);
    }
  }

  async deleteManagedArtifact(
    request: ContextCaptureDeleteManagedArtifactRequest
  ): Promise<void> {
    try {
      await api.invoke<void>('context_capture_delete_managed_artifact', { request });
    } catch (error) {
      throw createTauriCommandError('context_capture_delete_managed_artifact', error, request);
    }
  }
}

export const contextCaptureAPI = new ContextCaptureAPI();
