/**
 * ChatInput configuration constants
 */

export const CHAT_INPUT_CONFIG = {
  largePaste: {
    thresholdChars: 1000,
    maxMessageChars: 1 << 20,
  },

  // Shared media input constraints.
  media: {
    image: {
      maxCount: 5,
      maxFileSizeBytes: 10 * 1024 * 1024,
      acceptedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'] as const,
    },
    video: {
      maxCount: 1,
      maxFileSizeBytes: 50 * 1024 * 1024,
      acceptedTypes: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
    },
    extractedVideoFrameCount: 3,
  },
  
  // Mode sync delay in milliseconds.
  mode: {
    syncDelay: 200,
  },
} as const;
