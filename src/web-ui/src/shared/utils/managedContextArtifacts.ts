import { contextCaptureAPI } from '@/infrastructure/api/service-api/ContextCaptureAPI';
import type { ContextItem } from '@/shared/types/context';
import { createLogger } from './logger';

const log = createLogger('ManagedContextArtifacts');

export function isManagedCaptureArtifact(context: ContextItem): boolean {
  return (
    (context.type === 'image' || context.type === 'video')
    && context.metadata?.managedArtifact === true
  );
}

export function getManagedCaptureArtifactPath(context: ContextItem): string | null {
  if (!isManagedCaptureArtifact(context)) {
    return null;
  }

  if (context.type === 'image') {
    return context.imagePath || null;
  }
  if (context.type === 'video') {
    return context.videoPath || null;
  }
  return null;
}

export async function deleteManagedCaptureArtifact(context: ContextItem): Promise<void> {
  const artifactPath = getManagedCaptureArtifactPath(context);
  if (!artifactPath) {
    return;
  }

  const metadata = context.metadata ?? {};
  const readText = (key: string): string | undefined => {
    const value = metadata[key];
    return typeof value === 'string' && value.trim() ? value : undefined;
  };

  await contextCaptureAPI.deleteManagedArtifact({
    artifactPath,
    sessionId: readText('sessionId'),
    workspacePath: readText('workspacePath'),
    remoteConnectionId: readText('remoteConnectionId'),
    remoteSshHost: readText('remoteSshHost'),
  });
}

export function releaseContextObjectUrl(context: ContextItem): void {
  if (context.type === 'video' && context.previewUrl?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(context.previewUrl);
    } catch (error) {
      log.warn('Failed to revoke temporary video preview URL', { error, contextId: context.id });
    }
  }
}
