import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Eye, Video } from 'lucide-react';
import { Modal, Button } from '@/component-library';
import type { VideoContext, ValidationResult, RenderOptions } from '../../../types/context';
import type {
  ContextTransformer,
  ContextValidator,
  ContextCardRenderer,
} from '../../../services/ContextRegistry';
import { i18nService } from '@/infrastructure/i18n';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('VideoContextValidator');
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];

function resolveVideoSource(context: VideoContext): string | null {
  return (
    context.previewUrl
    || context.dataUrl
    || (context.videoPath
      ? `https://asset.localhost/${encodeURIComponent(context.videoPath)}`
      : null)
  );
}

export class VideoContextTransformer implements ContextTransformer<'video'> {
  readonly type = 'video' as const;

  transform(context: VideoContext): unknown {
    return {
      type: 'video',
      id: context.id,
      video_path: context.videoPath || null,
      data_url: context.dataUrl || null,
      mime_type: context.mimeType,
      metadata: {
        name: context.videoName,
        width: context.width,
        height: context.height,
        duration_ms: context.durationMs,
        file_size: context.fileSize,
        source: context.source,
        is_local: context.isLocal,
      }
    };
  }

  estimateSize(context: VideoContext): number {
    if (context.dataUrl) {
      return context.dataUrl.length;
    }
    return context.videoPath?.length || 100;
  }
}

export class VideoContextValidator implements ContextValidator<'video'> {
  readonly type = 'video' as const;

  async validate(context: VideoContext): Promise<ValidationResult> {
    try {
      if (!context.videoPath && !context.dataUrl && !context.previewUrl) {
        return {
          valid: false,
          error: 'Video path or preview data must not be empty.'
        };
      }

      if (!SUPPORTED_VIDEO_FORMATS.includes(context.mimeType)) {
        return {
          valid: false,
          error: `Unsupported video format: ${context.mimeType}`
        };
      }

      if (context.fileSize && context.fileSize > MAX_VIDEO_BYTES) {
        return {
          valid: false,
          error: `Video is too large (${(context.fileSize / 1024 / 1024).toFixed(2)}MB). Max supported size is 50MB.`
        };
      }

      if (context.isLocal && context.videoPath) {
        try {
          const exists = await invoke<boolean>('check_path_exists', {
            request: {
              path: context.videoPath
            }
          });

          if (!exists) {
            return {
              valid: false,
              error: 'Video file does not exist.'
            };
          }
        } catch (error) {
          log.error('Failed to check video file existence', error as Error);
          return {
            valid: false,
            error: 'Unable to check video file.'
          };
        }
      }

      return {
        valid: true,
        metadata: {
          size: context.fileSize,
          format: context.mimeType,
          durationMs: context.durationMs,
        }
      };
    } catch (error) {
      log.error('Video validation failed', error as Error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed.'
      };
    }
  }
}

export class VideoCardRenderer implements ContextCardRenderer<'video'> {
  readonly type = 'video' as const;

  render(context: VideoContext, options?: RenderOptions): React.ReactElement {
    const { compact = false, interactive = true } = options || {};

    const [showPlayer, setShowPlayer] = React.useState(false);
    const src = resolveVideoSource(context);

    return (
      <div className="context-card image-context-card" data-compact={compact}>
        <div className="context-card__header">
          <div className="context-card__icon">
            <Video size={16} />
          </div>
          <div className="context-card__info">
            <div className="context-card__title">{context.videoName}</div>
            {!compact && (
              <div className="context-card__meta">
                {context.durationMs ? (
                  <span>{Math.max(1, Math.round(context.durationMs / 1000))}s</span>
                ) : null}
                {context.fileSize ? (
                  <>
                    <span className="context-card__meta-separator">•</span>
                    <span>{formatFileSize(context.fileSize)}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {!compact && src && (
          <div className="context-card__preview">
            <div
              className="image-context-card__thumbnail"
              onClick={() => interactive && setShowPlayer(true)}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              <video
                src={src}
                poster={context.thumbnailUrl}
                muted
                playsInline
                preload="metadata"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain'
                }}
              />
            </div>
            {interactive && (
              <div className="image-context-card__actions">
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setShowPlayer(true)}
                >
                  <Eye size={14} />
                  <span>{i18nService.t('components:contextSystem.contextCard.viewLargeImage')}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={showPlayer && !!src}
          onClose={() => setShowPlayer(false)}
          title={context.videoName}
          size="large"
        >
          <div className="image-context-card__modal-content">
            {src ? (
              <video
                src={src}
                poster={context.thumbnailUrl}
                controls
                playsInline
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            ) : null}
          </div>
        </Modal>
      </div>
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
