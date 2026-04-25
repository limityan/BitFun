import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImageContext, VideoContext } from '@/shared/types/context';
import {
  deleteManagedCaptureArtifact,
  releaseContextObjectUrl,
} from './managedContextArtifacts';
import { contextCaptureAPI } from '@/infrastructure/api/service-api/ContextCaptureAPI';

vi.mock('@/infrastructure/api/service-api/ContextCaptureAPI', () => ({
  contextCaptureAPI: {
    deleteManagedArtifact: vi.fn(),
  },
}));

describe('deleteManagedCaptureArtifact', () => {
  beforeEach(() => {
    vi.mocked(contextCaptureAPI.deleteManagedArtifact).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes session identity so the desktop side can enforce the managed root', async () => {
    const context: ImageContext = {
      id: 'img-1',
      type: 'image',
      imagePath: 'C:\\workspace\\.bitfun\\sessions\\s1\\artifacts\\context-capture\\shot.jpg',
      imageName: 'shot.jpg',
      fileSize: 100,
      mimeType: 'image/jpeg',
      source: 'file',
      isLocal: true,
      timestamp: Date.now(),
      metadata: {
        managedArtifact: true,
        sessionId: 's1',
        workspacePath: 'C:\\workspace',
        remoteConnectionId: 'remote-1',
        remoteSshHost: 'host',
      },
    };

    await deleteManagedCaptureArtifact(context);

    expect(contextCaptureAPI.deleteManagedArtifact).toHaveBeenCalledWith({
      artifactPath: context.imagePath,
      sessionId: 's1',
      workspacePath: 'C:\\workspace',
      remoteConnectionId: 'remote-1',
      remoteSshHost: 'host',
    });
  });

  it('deletes managed recording videos by video path', async () => {
    const context: VideoContext = {
      id: 'video-1',
      type: 'video',
      videoPath: 'C:\\workspace\\.bitfun\\sessions\\s1\\artifacts\\context-capture\\recording.webm',
      videoName: 'recording.webm',
      fileSize: 100,
      mimeType: 'video/webm',
      source: 'file',
      isLocal: true,
      timestamp: Date.now(),
      metadata: {
        managedArtifact: true,
        sessionId: 's1',
        workspacePath: 'C:\\workspace',
      },
    };

    await deleteManagedCaptureArtifact(context);

    expect(contextCaptureAPI.deleteManagedArtifact).toHaveBeenCalledWith({
      artifactPath: context.videoPath,
      sessionId: 's1',
      workspacePath: 'C:\\workspace',
      remoteConnectionId: undefined,
      remoteSshHost: undefined,
    });
  });

  it('does not delete user-uploaded videos from disk', async () => {
    const context: VideoContext = {
      id: 'video-1',
      type: 'video',
      videoPath: 'C:\\Users\\me\\Videos\\clip.webm',
      videoName: 'clip.webm',
      fileSize: 100,
      mimeType: 'video/webm',
      source: 'file',
      isLocal: true,
      timestamp: Date.now(),
      metadata: {},
    };

    await deleteManagedCaptureArtifact(context);

    expect(contextCaptureAPI.deleteManagedArtifact).not.toHaveBeenCalled();
  });

  it('revokes temporary video preview URLs without touching stable paths', () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      revokeObjectURL,
    });

    releaseContextObjectUrl({
      id: 'video-1',
      type: 'video',
      videoPath: '',
      videoName: 'clip.webm',
      previewUrl: 'blob:bitfun-video',
      fileSize: 100,
      mimeType: 'video/webm',
      source: 'file',
      isLocal: false,
      timestamp: Date.now(),
      metadata: {},
    });

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:bitfun-video');
  });
});
