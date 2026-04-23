import { describe, expect, it } from 'vitest';
import { isCompanionPulseWindowActive } from './companionTiming';

describe('isCompanionPulseWindowActive', () => {
  it('stays hidden before the initial delay elapses', () => {
    expect(isCompanionPulseWindowActive(4_000, 0, {
      intervalMs: 20_000,
      visibleMs: 5_000,
      initialDelayMs: 6_000,
    })).toBe(false);
  });

  it('becomes active inside the visible window', () => {
    expect(isCompanionPulseWindowActive(8_500, 0, {
      intervalMs: 20_000,
      visibleMs: 5_000,
      initialDelayMs: 6_000,
    })).toBe(true);
  });

  it('turns inactive once the current pulse window ends', () => {
    expect(isCompanionPulseWindowActive(12_500, 0, {
      intervalMs: 20_000,
      visibleMs: 5_000,
      initialDelayMs: 6_000,
    })).toBe(false);
  });

  it('caps the visible window to the interval length', () => {
    expect(isCompanionPulseWindowActive(14_000, 0, {
      intervalMs: 10_000,
      visibleMs: 16_000,
      initialDelayMs: 0,
    })).toBe(true);
    expect(isCompanionPulseWindowActive(20_001, 0, {
      intervalMs: 10_000,
      visibleMs: 16_000,
      initialDelayMs: 0,
    })).toBe(true);
  });
});
