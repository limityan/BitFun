// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createVideoContextFromFile,
  validateImageFile,
  validateVideoFile,
} from './imageUtils';

describe('createVideoContextFromFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps browser video files usable when no local path is available', async () => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => {
        throw new Error('object urls unavailable in this test');
      }),
    });

    const file = new File(['video-content'], 'clip.webm', { type: 'video/webm' });

    const context = await createVideoContextFromFile(file);

    expect(context.videoPath).toBe('');
    expect(context.isLocal).toBe(false);
    expect(context.dataUrl).toMatch(/^data:video\/webm;base64,/);
  });
});

describe('media file validation', () => {
  it('rejects images at or above the 10MB per-file limit', () => {
    const justUnderLimit = {
      type: 'image/png',
      size: 10 * 1024 * 1024 - 1,
    } as File;
    const atLimit = {
      type: 'image/png',
      size: 10 * 1024 * 1024,
    } as File;

    expect(validateImageFile(justUnderLimit).valid).toBe(true);
    expect(validateImageFile(atLimit).valid).toBe(false);
  });

  it('allows videos up to 50MB and rejects larger or unsupported videos', () => {
    const atLimit = {
      type: 'video/webm',
      size: 50 * 1024 * 1024,
    } as File;
    const overLimit = {
      type: 'video/webm',
      size: 50 * 1024 * 1024 + 1,
    } as File;
    const unsupported = {
      type: 'video/avi',
      size: 1024,
    } as File;

    expect(validateVideoFile(atLimit).valid).toBe(true);
    expect(validateVideoFile(overLimit).valid).toBe(false);
    expect(validateVideoFile(unsupported).valid).toBe(false);
  });
});
