import { describe, expect, it, vi } from 'vitest';
import type { DialogTurn } from '../../types/flow-chat';
import { convertDialogTurnToBackendFormat } from './PersistenceModule';

vi.mock('../../utils/sessionMetadata', () => ({
  buildSessionMetadata: vi.fn(),
}));

vi.mock('../../utils/dialogTurnStability', () => ({
  settleInterruptedDialogTurn: vi.fn(),
}));

function createCompletedTurn(overrides: Partial<DialogTurn> = {}): DialogTurn {
  return {
    id: 'turn-1',
    sessionId: 'session-1',
    userMessage: {
      id: 'message-1',
      content: 'Please inspect this media',
      timestamp: 100,
    },
    modelRounds: [],
    status: 'completed',
    startTime: 100,
    endTime: 200,
    ...overrides,
  };
}

describe('convertDialogTurnToBackendFormat media persistence', () => {
  it('omits large transient video data URLs when persisting video-only turns', () => {
    const turn = createCompletedTurn({
      userMessage: {
        id: 'message-1',
        content: 'Please inspect this clip',
        timestamp: 100,
        videos: [
          {
            id: 'video-1',
            name: 'clip.mp4',
            dataUrl: 'data:video/mp4;base64,AAAA',
            previewUrl: 'blob:bitfun-video-preview',
            videoPath: 'C:\\workspace\\.bitfun\\sessions\\session-1\\artifacts\\context-capture\\recordings\\rec-1\\recording-rec-1.mp4',
            thumbnailUrl: 'data:image/jpeg;base64,thumb',
            mimeType: 'video/mp4',
            durationMs: 1000,
            metadata: { managedArtifact: true },
          },
        ],
      },
    });

    const backendTurn = convertDialogTurnToBackendFormat(turn, 0);
    const [video] = backendTurn.userMessage.metadata.videos;

    expect(video).not.toHaveProperty('data_url');
    expect(video).not.toHaveProperty('preview_url');
    expect(video).toMatchObject({
      id: 'video-1',
      name: 'clip.mp4',
      video_path: turn.userMessage.videos?.[0].videoPath,
      thumbnail_url: 'data:image/jpeg;base64,thumb',
      mime_type: 'video/mp4',
      duration_ms: 1000,
      metadata: { managedArtifact: true },
    });
  });

  it('keeps image persistence unchanged while sanitizing co-attached videos', () => {
    const turn = createCompletedTurn({
      userMessage: {
        id: 'message-1',
        content: 'Please inspect these files',
        timestamp: 100,
        images: [
          {
            id: 'image-1',
            name: 'shot.jpg',
            dataUrl: 'data:image/jpeg;base64,BBBB',
            imagePath: 'C:\\workspace\\.bitfun\\sessions\\session-1\\artifacts\\context-capture\\screenshots\\shot.jpg',
            mimeType: 'image/jpeg',
          },
        ],
        videos: [
          {
            id: 'video-1',
            name: 'clip.mp4',
            dataUrl: 'data:video/mp4;base64,AAAA',
            previewUrl: 'blob:bitfun-video-preview',
            thumbnailUrl: 'data:image/jpeg;base64,thumb',
            mimeType: 'video/mp4',
            durationMs: 1000,
          },
        ],
      },
    });

    const backendTurn = convertDialogTurnToBackendFormat(turn, 0);

    expect(backendTurn.userMessage.metadata.images[0]).toHaveProperty(
      'data_url',
      'data:image/jpeg;base64,BBBB',
    );
    expect(backendTurn.userMessage.metadata.videos[0]).not.toHaveProperty('data_url');
    expect(backendTurn.userMessage.metadata.videos[0]).not.toHaveProperty('preview_url');
  });
});
