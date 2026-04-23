import { describe, expect, it } from 'vitest';
import { resolveCompanionMotion, resolveCompanionPresentation } from './presentation';
import type { CompanionPresentation } from './types';

describe('resolveCompanionPresentation', () => {
  it('resolves a semantic action into a runtime motion', () => {
    const presentation: CompanionPresentation = {
      action: 'guiding',
      size: 'sm',
      label: 'Look here',
    };

    expect(resolveCompanionMotion(presentation, 'red-panda')).toBe('point');

    expect(resolveCompanionPresentation(presentation, 'fox')).toMatchObject({
      character: 'fox',
      action: 'guiding',
      motion: 'point',
      size: 'sm',
      label: 'Look here',
    });
  });

  it('preserves explicit runtime motion overrides', () => {
    const presentation: CompanionPresentation = {
      action: 'guiding',
      motion: 'peek',
    };

    expect(resolveCompanionMotion(presentation, 'red-panda')).toBe('peek');
    expect(resolveCompanionPresentation(presentation, 'red-panda').action).toBe('guiding');
  });
});
