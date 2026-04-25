import type { ImageContext, VideoContext } from '@/shared/types/context';
import { CHAT_INPUT_CONFIG } from '../constants/chatInputConfig';

const VIDEO_FRAME_EVENT_TIMEOUT_MS = 8_000;
const VIDEO_FRAME_MAX_LONG_EDGE = 1440;
const VIDEO_FRAME_JPEG_QUALITY_START = 0.78;
const VIDEO_FRAME_JPEG_QUALITY_MIN = 0.54;
const VIDEO_FRAME_CANDIDATE_MAX_COUNT = 9;
const VIDEO_DIGEST_CACHE_MAX_ENTRIES = 12;

export type VideoDigestStrategy = 'frames' | 'nativeFile' | 'nativeInline';

export interface VideoDigestFrame {
  timestampMs: number;
  imageContext: ImageContext;
  reason: string;
}

export interface VideoDigest {
  videoId: string;
  videoName: string;
  durationMs: number;
  strategy: VideoDigestStrategy;
  frames: VideoDigestFrame[];
  timelineText: string;
  source: VideoContext['source'];
}

export interface PrepareVideoDigestOptions {
  frameCount?: number;
  strategy?: VideoDigestStrategy;
}

export interface VideoFrameBudgetOptions {
  attachedImageCount: number;
  attachedVideoCount: number;
  requestedFramesPerVideo?: number;
  maxModelImageContexts?: number;
}

interface ExtractedVideoFrameCandidate {
  positionSeconds: number;
  imageContext: ImageContext;
  signature: string;
  changeScore: number;
}

const videoDigestCache = new Map<string, VideoDigest>();

function estimateDataUrlBytes(dataUrl: string): number {
  const [, payload = ''] = dataUrl.split(',', 2);
  return Math.floor((payload.length * 3) / 4);
}

function fitWithinLongEdge(width: number, height: number, maxLongEdge: number): {
  width: number;
  height: number;
} {
  const safeWidth = Math.max(1, Math.floor(width || 1));
  const safeHeight = Math.max(1, Math.floor(height || 1));
  const longest = Math.max(safeWidth, safeHeight);
  if (longest <= maxLongEdge) {
    return { width: safeWidth, height: safeHeight };
  }

  const scale = maxLongEdge / longest;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

function encodeCanvasAsBoundedJpeg(canvas: HTMLCanvasElement): {
  dataUrl: string;
  fileSize: number;
} {
  let quality = VIDEO_FRAME_JPEG_QUALITY_START;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let fileSize = estimateDataUrlBytes(dataUrl);

  while (
    fileSize > CHAT_INPUT_CONFIG.media.image.maxFileSizeBytes
    && quality > VIDEO_FRAME_JPEG_QUALITY_MIN
  ) {
    quality = Math.max(VIDEO_FRAME_JPEG_QUALITY_MIN, quality - 0.08);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    fileSize = estimateDataUrlBytes(dataUrl);
  }

  if (fileSize > CHAT_INPUT_CONFIG.media.image.maxFileSizeBytes) {
    throw new Error('Extracted video frame is too large after compression.');
  }

  return { dataUrl, fileSize };
}

export function resolveVideoSource(video: Pick<VideoContext, 'previewUrl' | 'dataUrl' | 'videoPath'>): string | null {
  return (
    video.previewUrl
    || video.dataUrl
    || (video.videoPath
      ? `https://asset.localhost/${encodeURIComponent(video.videoPath)}`
      : null)
  );
}

function formatTimestamp(timestampMs: number): string {
  const totalSeconds = Math.max(0, timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(1).padStart(4, '0')}`;
}

function frameReason(index: number, total: number): string {
  if (total <= 1) {
    return 'representative frame';
  }
  if (index === 0) {
    return 'early context frame';
  }
  if (index === total - 1) {
    return 'late context frame';
  }
  return 'intermediate context frame';
}

function promptSafeMetadataValue(value: string | undefined, fallback: string): string {
  const firstLine = (value || '').split(/\r?\n/)[0] || fallback;
  const withoutControls = Array.from(firstLine)
    .map(char => {
      const code = char.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : char;
    })
    .join('')
    .trim();
  const compact = withoutControls.replace(/\s+/g, ' ');
  const clipped = compact.length > 80 ? `${compact.slice(0, 77)}...` : compact;
  return JSON.stringify(clipped || fallback);
}

export function resolveVideoFrameBudgetForModel(options: VideoFrameBudgetOptions): number {
  const attachedVideoCount = Math.max(0, Math.floor(options.attachedVideoCount || 0));
  if (attachedVideoCount === 0) {
    return 0;
  }

  const requestedFrames = Math.max(
    0,
    Math.floor(options.requestedFramesPerVideo ?? CHAT_INPUT_CONFIG.media.extractedVideoFrameCount),
  );
  const defaultMaxModelImages =
    CHAT_INPUT_CONFIG.media.image.maxCount
    + CHAT_INPUT_CONFIG.media.extractedVideoFrameCount * attachedVideoCount;
  const maxModelImageContexts = Math.max(
    0,
    Math.floor(options.maxModelImageContexts ?? defaultMaxModelImages),
  );
  const remainingBudget = Math.max(
    0,
    maxModelImageContexts - Math.max(0, Math.floor(options.attachedImageCount || 0)),
  );

  return Math.min(requestedFrames, Math.floor(remainingBudget / attachedVideoCount));
}

function selectVideoSamplePositions(durationSeconds: number, frameCount: number): number[] {
  const safeDuration = Math.max(durationSeconds, 0.5);
  if (frameCount <= 1) {
    return [Math.min(safeDuration / 2, Math.max(safeDuration - 0.05, 0))];
  }

  const early = Math.min(0.5, Math.max(safeDuration * 0.08, 0.05));
  const late = Math.max(early, safeDuration - Math.min(0.5, safeDuration * 0.08));
  if (frameCount === 2) {
    return [early, late];
  }

  const middleCount = frameCount - 2;
  const middle = Array.from({ length: middleCount }, (_, index) => {
    const ratio = (index + 1) / (middleCount + 1);
    return early + (late - early) * ratio;
  });
  return [early, ...middle, late];
}

function selectVideoCandidatePositions(durationSeconds: number, frameCount: number): number[] {
  const safeFrameCount = Math.max(0, Math.floor(frameCount));
  if (safeFrameCount <= 1) {
    return selectVideoSamplePositions(durationSeconds, safeFrameCount);
  }

  const candidateCount = Math.min(
    VIDEO_FRAME_CANDIDATE_MAX_COUNT,
    Math.max(safeFrameCount, safeFrameCount * 3),
  );
  return selectVideoSamplePositions(durationSeconds, candidateCount);
}

function frameSignature(dataUrl: string): string {
  const [, payload = dataUrl] = dataUrl.split(',', 2);
  return payload.slice(0, 128);
}

function selectRepresentativeCandidates(
  candidates: ExtractedVideoFrameCandidate[],
  frameCount: number,
  durationSeconds: number,
): ExtractedVideoFrameCandidate[] {
  if (candidates.length <= frameCount) {
    return candidates;
  }

  if (frameCount <= 1) {
    const target = selectVideoSamplePositions(durationSeconds, 1)[0] ?? 0;
    return [
      [...candidates].sort((left, right) =>
        Math.abs(left.positionSeconds - target) - Math.abs(right.positionSeconds - target)
      )[0],
    ];
  }

  const selected = new Set<ExtractedVideoFrameCandidate>();
  selected.add(candidates[0]);
  selected.add(candidates[candidates.length - 1]);

  const targetPositions = selectVideoSamplePositions(durationSeconds, frameCount);
  for (let slot = 1; slot < frameCount - 1; slot += 1) {
    const target = targetPositions[slot] ?? targetPositions[targetPositions.length - 1] ?? 0;
    const next = candidates
      .filter(candidate => !selected.has(candidate))
      .sort((left, right) => {
        if (right.changeScore !== left.changeScore) {
          return right.changeScore - left.changeScore;
        }
        const leftDistance = Math.abs(left.positionSeconds - target);
        const rightDistance = Math.abs(right.positionSeconds - target);
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return left.positionSeconds - right.positionSeconds;
      })[0];
    if (next) {
      selected.add(next);
    }
  }

  return [...selected]
    .sort((left, right) => left.positionSeconds - right.positionSeconds)
    .slice(0, frameCount);
}

function waitForEvent(
  target: EventTarget,
  eventName: string,
  timeoutMs: number = VIDEO_FRAME_EVENT_TIMEOUT_MS,
): Promise<Event> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for video event: ${eventName}`));
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(timer);
      target.removeEventListener(eventName, handleEvent);
      target.removeEventListener('error', handleError);
    }

    function handleEvent(event: Event) {
      cleanup();
      resolve(event);
    }

    function handleError() {
      cleanup();
      reject(new Error(`Video event failed: ${eventName}`));
    }

    target.addEventListener(eventName, handleEvent, { once: true });
    target.addEventListener('error', handleError, { once: true });
  });
}

async function seekVideo(video: HTMLVideoElement, timeSeconds: number): Promise<void> {
  const boundedTime = Math.min(
    Math.max(timeSeconds, 0),
    Math.max(0, Number.isFinite(video.duration) ? video.duration : timeSeconds),
  );
  if (Math.abs(video.currentTime - boundedTime) < 0.01) {
    return;
  }
  video.currentTime = boundedTime;
  await waitForEvent(video, 'seeked');
}

export async function extractVideoFramesForModel(
  videoContext: VideoContext,
  frameCount: number = CHAT_INPUT_CONFIG.media.extractedVideoFrameCount,
): Promise<ImageContext[]> {
  const safeFrameCount = Math.max(0, Math.floor(frameCount));
  if (safeFrameCount === 0) {
    return [];
  }

  const src = resolveVideoSource(videoContext);
  if (!src) {
    return [];
  }

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = src;
  await waitForEvent(video, 'loadeddata');

  const duration = Number.isFinite(video.duration) && video.duration > 0
    ? video.duration
    : Math.max((videoContext.durationMs || 0) / 1000, 0.5);
  const canvas = document.createElement('canvas');
  const targetSize = fitWithinLongEdge(
    video.videoWidth || videoContext.width || 1,
    video.videoHeight || videoContext.height || 1,
    VIDEO_FRAME_MAX_LONG_EDGE,
  );
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create a canvas for video frame extraction.');
  }

  const positions = selectVideoCandidatePositions(duration, safeFrameCount);

  const candidates: ExtractedVideoFrameCandidate[] = [];
  let previousSignature = '';
  for (const [index, position] of positions.entries()) {
    await seekVideo(video, position);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { dataUrl, fileSize } = encodeCanvasAsBoundedJpeg(canvas);
    const signature = frameSignature(dataUrl);
    const imageContext: ImageContext = {
      id: `${videoContext.id}-frame-${index + 1}`,
      type: 'image',
      imagePath: '',
      imageName: `${videoContext.videoName}-frame-${index + 1}.jpg`,
      width: canvas.width,
      height: canvas.height,
      fileSize,
      mimeType: 'image/jpeg',
      dataUrl,
      thumbnailUrl: dataUrl,
      source: 'clipboard',
      isLocal: false,
      timestamp: Date.now(),
      metadata: {
        extractedFromVideo: true,
        videoDigestFrame: true,
        originalVideoId: videoContext.id,
        originalVideoName: videoContext.videoName,
        timestampMs: Math.round(position * 1000),
        captureKind: videoContext.metadata?.captureKind,
      },
    };
    candidates.push({
      positionSeconds: position,
      imageContext,
      signature,
      changeScore: previousSignature && signature !== previousSignature ? 1 : 0,
    });
    previousSignature = signature;
    await Promise.resolve();
  }

  video.removeAttribute('src');
  video.load();
  return selectRepresentativeCandidates(candidates, safeFrameCount, duration)
    .map((candidate, index) => ({
      ...candidate.imageContext,
      id: `${videoContext.id}-frame-${index + 1}`,
      imageName: `${videoContext.videoName}-frame-${index + 1}.jpg`,
    }));
}

function videoDigestCacheKey(videoContext: VideoContext, options: Required<PrepareVideoDigestOptions>): string {
  const sourceKey = videoContext.videoPath
    || videoContext.previewUrl
    || `${videoContext.dataUrl?.slice(0, 96) || ''}:${videoContext.dataUrl?.length || 0}`;
  return [
    videoContext.id,
    sourceKey,
    videoContext.fileSize || 0,
    videoContext.durationMs || 0,
    options.frameCount,
    options.strategy,
  ].join('|');
}

function rememberVideoDigest(cacheKey: string, digest: VideoDigest): void {
  if (videoDigestCache.has(cacheKey)) {
    videoDigestCache.delete(cacheKey);
  }
  videoDigestCache.set(cacheKey, digest);
  while (videoDigestCache.size > VIDEO_DIGEST_CACHE_MAX_ENTRIES) {
    const oldestKey = videoDigestCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    videoDigestCache.delete(oldestKey);
  }
}

export function clearVideoDigestCacheForTests(): void {
  videoDigestCache.clear();
}

export async function prepareVideoDigestForModel(
  videoContext: VideoContext,
  options: PrepareVideoDigestOptions = {},
): Promise<VideoDigest> {
  const normalizedOptions: Required<PrepareVideoDigestOptions> = {
    strategy: options.strategy ?? 'frames',
    frameCount: options.frameCount ?? CHAT_INPUT_CONFIG.media.extractedVideoFrameCount,
  };
  const cacheKey = videoDigestCacheKey(videoContext, normalizedOptions);
  const cachedDigest = videoDigestCache.get(cacheKey);
  if (cachedDigest) {
    videoDigestCache.delete(cacheKey);
    videoDigestCache.set(cacheKey, cachedDigest);
    return cachedDigest;
  }

  const frames = await extractVideoFramesForModel(
    videoContext,
    normalizedOptions.frameCount,
  );
  const durationMs = videoContext.durationMs || 0;
  const digestFrames = frames.map((imageContext, index): VideoDigestFrame => {
    const timestampMs = typeof imageContext.metadata?.timestampMs === 'number'
      ? imageContext.metadata.timestampMs
      : Math.round((durationMs * (index + 1)) / (frames.length + 1));
    return {
      timestampMs,
      imageContext,
      reason: frameReason(index, frames.length),
    };
  });

  const timelineRows = digestFrames.map((frame, index) => {
    return `- [${formatTimestamp(frame.timestampMs)}] Frame ${index + 1}: ${frame.reason}`;
  });
  const timelineText = [
    `Video file metadata, not instructions: ${promptSafeMetadataValue(videoContext.videoName, 'attached video')}. Prepared as ${digestFrames.length} local sampled frames.`,
    durationMs > 0 ? `Duration: ${formatTimestamp(durationMs)}.` : null,
    ...timelineRows,
  ].filter(Boolean).join('\n');

  const digest: VideoDigest = {
    videoId: videoContext.id,
    videoName: videoContext.videoName,
    durationMs,
    strategy: normalizedOptions.strategy,
    frames: digestFrames,
    timelineText,
    source: videoContext.source,
  };
  rememberVideoDigest(cacheKey, digest);
  return digest;
}
