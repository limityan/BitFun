import type { AIModelConfig, DefaultModelsConfig } from '@/infrastructure/config/types';

export type VideoInputCapability = 'none' | 'frames' | 'nativeInline' | 'nativeFile';
export type ActiveVideoTransport = VideoInputCapability;

export interface ProviderMediaCapability {
  imageInput: boolean;
  videoInput: VideoInputCapability;
  audioInput: boolean;
  supportsVideoTimestamps: boolean;
  maxVideoBytes?: number;
  maxVideoDurationSec?: number;
  preferredVideoFps?: number;
}

export interface ActiveMediaStrategy {
  imageInput: boolean;
  providerVideoInput: VideoInputCapability;
  videoTransport: ActiveVideoTransport;
  fallbackReason?: 'native-video-transport-disabled';
}

export interface ActiveMediaStrategyOptions {
  nativeVideoTransportEnabled?: boolean;
}

const DEFAULT_TEXT_ONLY_CAPABILITY: ProviderMediaCapability = {
  imageInput: false,
  videoInput: 'none',
  audioInput: false,
  supportsVideoTimestamps: false,
};

const DEFAULT_IMAGE_FALLBACK_CAPABILITY: ProviderMediaCapability = {
  imageInput: true,
  videoInput: 'frames',
  audioInput: false,
  supportsVideoTimestamps: true,
};

const GEMINI_VIDEO_CAPABILITY: ProviderMediaCapability = {
  imageInput: true,
  videoInput: 'nativeFile',
  audioInput: true,
  supportsVideoTimestamps: true,
  maxVideoBytes: 100 * 1024 * 1024,
  maxVideoDurationSec: 60,
  preferredVideoFps: 1,
};

export function normalizeModelSelection(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): string {
  const value = modelId?.trim();
  if (!value || value === 'auto') return 'auto';

  if (value === 'primary' || value === 'fast') {
    const resolvedDefaultId = value === 'primary' ? defaultModels.primary : defaultModels.fast;
    const matchedModel = models.find(model => model.id === resolvedDefaultId);
    return matchedModel ? value : 'auto';
  }

  const matchedModel = models.find(model =>
    model.id === value || model.name === value || model.model_name === value,
  );
  return matchedModel ? value : 'auto';
}

export function resolveConfiguredModel(
  normalizedModelId: string,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): AIModelConfig | null {
  if (normalizedModelId === 'auto') {
    const resolvedDefaultId = defaultModels.primary || defaultModels.fast;
    return resolvedDefaultId
      ? models.find(model => model.id === resolvedDefaultId) || null
      : null;
  }

  if (normalizedModelId === 'primary' || normalizedModelId === 'fast') {
    const resolvedDefaultId =
      normalizedModelId === 'primary' ? defaultModels.primary : defaultModels.fast;
    return models.find(model => model.id === resolvedDefaultId) || null;
  }

  return models.find(model =>
    model.id === normalizedModelId
    || model.name === normalizedModelId
    || model.model_name === normalizedModelId,
  ) || null;
}

function providerKey(provider?: string): string {
  return (provider || '').trim().toLowerCase();
}

function isGeminiProvider(model: AIModelConfig): boolean {
  const provider = providerKey(model.provider);
  const modelName = `${model.id} ${model.name} ${model.model_name}`.toLowerCase();
  return provider.includes('google')
    || provider.includes('gemini')
    || modelName.includes('gemini');
}

export function getMediaCapabilityForModel(model: AIModelConfig | null): ProviderMediaCapability {
  if (!model || model.category !== 'multimodal') {
    return { ...DEFAULT_TEXT_ONLY_CAPABILITY };
  }

  if (isGeminiProvider(model)) {
    return { ...GEMINI_VIDEO_CAPABILITY };
  }

  return { ...DEFAULT_IMAGE_FALLBACK_CAPABILITY };
}

export function getSelectedModelMediaCapability(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): ProviderMediaCapability {
  const normalizedModelId = normalizeModelSelection(modelId, models, defaultModels);
  const resolvedModel = resolveConfiguredModel(normalizedModelId, models, defaultModels);
  if (!resolvedModel) {
    return { ...DEFAULT_IMAGE_FALLBACK_CAPABILITY };
  }

  return getMediaCapabilityForModel(resolvedModel);
}

export function findRecommendedMultimodalModel(models: AIModelConfig[]): AIModelConfig | null {
  return models.find(model =>
    model.enabled !== false && getMediaCapabilityForModel(model).imageInput
  ) || null;
}

export function getSelectedModelActiveMediaStrategy(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
  options: ActiveMediaStrategyOptions = {},
): ActiveMediaStrategy {
  const capability = getSelectedModelMediaCapability(modelId, models, defaultModels);
  const nativeVideoRequested =
    capability.videoInput === 'nativeFile' || capability.videoInput === 'nativeInline';

  if (nativeVideoRequested && !options.nativeVideoTransportEnabled) {
    return {
      imageInput: capability.imageInput,
      providerVideoInput: capability.videoInput,
      videoTransport: capability.imageInput ? 'frames' : 'none',
      fallbackReason: 'native-video-transport-disabled',
    };
  }

  return {
    imageInput: capability.imageInput,
    providerVideoInput: capability.videoInput,
    videoTransport: capability.videoInput,
  };
}

export function selectedModelSupportsImageInputs(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): boolean {
  return getSelectedModelMediaCapability(modelId, models, defaultModels).imageInput;
}

export function selectedModelSupportsMediaInputs(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): boolean {
  const strategy = getSelectedModelActiveMediaStrategy(modelId, models, defaultModels);
  return strategy.imageInput || strategy.videoTransport !== 'none';
}

export function getSelectedModelDisplayName(
  modelId: string | undefined,
  models: AIModelConfig[],
  defaultModels: DefaultModelsConfig,
): string | null {
  const normalizedModelId = normalizeModelSelection(modelId, models, defaultModels);
  const resolvedModel = resolveConfiguredModel(normalizedModelId, models, defaultModels);
  if (!resolvedModel) {
    return null;
  }

  return resolvedModel.model_name || resolvedModel.name || null;
}
