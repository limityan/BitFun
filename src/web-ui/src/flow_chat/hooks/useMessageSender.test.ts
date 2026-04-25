import { describe, expect, it } from 'vitest';
import type { AIModelConfig, DefaultModelsConfig } from '@/infrastructure/config/types';
import {
  getSelectedModelDisplayName,
  getSelectedModelActiveMediaStrategy,
  getSelectedModelMediaCapability,
  findRecommendedMultimodalModel,
  selectedModelSupportsImageInputs,
} from '../utils/modelImageSupport';

function createModel(overrides: Partial<AIModelConfig>): AIModelConfig {
  return {
    id: overrides.id || 'model-id',
    name: overrides.name || 'Model Name',
    provider: overrides.provider || 'openai',
    base_url: overrides.base_url || 'https://example.com/v1',
    model_name: overrides.model_name || 'model-name',
    enabled: overrides.enabled ?? true,
    category: overrides.category || 'general_chat',
    capabilities: overrides.capabilities || ['text_chat'],
    ...overrides,
  };
}

describe('selectedModelSupportsImageInputs', () => {
  const textModel = createModel({
    id: 'text-model',
    name: 'Text Model',
    model_name: 'text-model',
    category: 'general_chat',
  });
  const multimodalModel = createModel({
    id: 'vision-model',
    name: 'Vision Model',
    model_name: 'vision-model',
    category: 'multimodal',
  });

  const models = [textModel, multimodalModel];
  const defaultModels: DefaultModelsConfig = {
    primary: 'text-model',
    fast: 'vision-model',
  };

  it('resolves auto through the primary default before checking support', () => {
    expect(selectedModelSupportsImageInputs('auto', models, defaultModels)).toBe(false);
    expect(selectedModelSupportsImageInputs(undefined, models, defaultModels)).toBe(false);
    expect(selectedModelSupportsImageInputs('auto', models, {
      primary: 'vision-model',
      fast: 'text-model',
    })).toBe(true);
  });

  it('does not block media before model configuration is available', () => {
    expect(selectedModelSupportsImageInputs('auto', [], {})).toBe(true);
    expect(getSelectedModelMediaCapability('auto', [], {}).videoInput).toBe('frames');
  });

  it('rejects explicit text-only models', () => {
    expect(selectedModelSupportsImageInputs('text-model', models, defaultModels)).toBe(false);
  });

  it('resolves primary and fast aliases before checking support', () => {
    expect(selectedModelSupportsImageInputs('primary', models, defaultModels)).toBe(false);
    expect(selectedModelSupportsImageInputs('fast', models, defaultModels)).toBe(true);
  });

  it('returns the resolved model display name for special aliases', () => {
    expect(getSelectedModelDisplayName('primary', models, defaultModels)).toBe('text-model');
    expect(getSelectedModelDisplayName('vision-model', models, defaultModels)).toBe('vision-model');
  });

  it('routes video support by provider capability instead of assuming native video everywhere', () => {
    const openAiVisionModel = createModel({
      id: 'openai-vision',
      provider: 'openai',
      category: 'multimodal',
    });
    const claudeVisionModel = createModel({
      id: 'claude-vision',
      provider: 'anthropic',
      category: 'multimodal',
    });
    const geminiVisionModel = createModel({
      id: 'gemini-video',
      provider: 'google',
      category: 'multimodal',
    });

    expect(getSelectedModelMediaCapability('openai-vision', [
      openAiVisionModel,
    ], defaultModels).videoInput).toBe('frames');
    expect(getSelectedModelMediaCapability('claude-vision', [
      claudeVisionModel,
    ], defaultModels).videoInput).toBe('frames');
    expect(getSelectedModelMediaCapability('gemini-video', [
      geminiVisionModel,
    ], defaultModels).videoInput).toBe('nativeFile');
  });

  it('keeps active video transport on frames until native video transport is enabled', () => {
    const geminiVisionModel = createModel({
      id: 'gemini-video',
      provider: 'google',
      category: 'multimodal',
    });

    const defaultStrategy = getSelectedModelActiveMediaStrategy('gemini-video', [
      geminiVisionModel,
    ], defaultModels);
    expect(defaultStrategy.providerVideoInput).toBe('nativeFile');
    expect(defaultStrategy.videoTransport).toBe('frames');
    expect(defaultStrategy.fallbackReason).toBe('native-video-transport-disabled');

    const nativeStrategy = getSelectedModelActiveMediaStrategy('gemini-video', [
      geminiVisionModel,
    ], defaultModels, { nativeVideoTransportEnabled: true });
    expect(nativeStrategy.providerVideoInput).toBe('nativeFile');
    expect(nativeStrategy.videoTransport).toBe('nativeFile');
    expect(nativeStrategy.fallbackReason).toBeUndefined();
  });

  it('recommends an enabled multimodal model for media recovery', () => {
    const disabledVisionModel = createModel({
      id: 'disabled-vision',
      name: 'Disabled Vision',
      category: 'multimodal',
      enabled: false,
    });
    const enabledVisionModel = createModel({
      id: 'enabled-vision',
      name: 'Enabled Vision',
      category: 'multimodal',
      enabled: true,
    });

    expect(findRecommendedMultimodalModel([
      textModel,
      disabledVisionModel,
      enabledVisionModel,
    ])?.id).toBe('enabled-vision');
  });
});
