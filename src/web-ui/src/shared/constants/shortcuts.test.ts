import { describe, expect, it } from 'vitest';
import { CHAT_SHORTCUTS, getShortcutDescriptionI18nKey } from './shortcuts';

describe('CHAT_SHORTCUTS', () => {
  it('registers screenshot and recording shortcuts for chat capture', () => {
    const screenshot = CHAT_SHORTCUTS.find(shortcut => shortcut.id === 'chat.captureScreenshot');
    const minimizedScreenshot = CHAT_SHORTCUTS.find(shortcut => shortcut.id === 'chat.captureScreenshotMinimized');
    const recording = CHAT_SHORTCUTS.find(shortcut => shortcut.id === 'chat.toggleRecording');
    const minimizedRecording = CHAT_SHORTCUTS.find(shortcut => shortcut.id === 'chat.toggleRecordingMinimized');

    expect(screenshot).toBeDefined();
    expect(minimizedScreenshot).toBeDefined();
    expect(recording).toBeDefined();
    expect(minimizedRecording).toBeDefined();

    expect(screenshot?.config.scope).toBe('chat');
    expect(screenshot?.config.allowInInput).toBe(true);
    expect(screenshot?.config.shift).toBe(true);
    expect(screenshot?.config.key.toUpperCase()).toBe('S');
    expect(Boolean(screenshot?.config.ctrl) || Boolean(screenshot?.config.meta)).toBe(true);

    expect(minimizedScreenshot?.config.scope).toBe('chat');
    expect(minimizedScreenshot?.config.allowInInput).toBe(true);
    expect(minimizedScreenshot?.config.shift).toBe(true);
    expect(minimizedScreenshot?.config.alt).toBe(true);
    expect(minimizedScreenshot?.config.key.toUpperCase()).toBe('S');
    expect(Boolean(minimizedScreenshot?.config.ctrl) || Boolean(minimizedScreenshot?.config.meta)).toBe(true);

    expect(recording?.config.scope).toBe('chat');
    expect(recording?.config.allowInInput).toBe(true);
    expect(recording?.config.shift).toBe(true);
    expect(recording?.config.key.toUpperCase()).toBe('R');
    expect(Boolean(recording?.config.ctrl) || Boolean(recording?.config.meta)).toBe(true);

    expect(minimizedRecording?.config.scope).toBe('chat');
    expect(minimizedRecording?.config.allowInInput).toBe(true);
    expect(minimizedRecording?.config.shift).toBe(true);
    expect(minimizedRecording?.config.alt).toBe(true);
    expect(minimizedRecording?.config.key.toUpperCase()).toBe('R');
    expect(Boolean(minimizedRecording?.config.ctrl) || Boolean(minimizedRecording?.config.meta)).toBe(true);
  });

  it('exposes settings labels for the new chat capture shortcuts', () => {
    expect(getShortcutDescriptionI18nKey('chat.captureScreenshot')).toBe(
      'keyboard.shortcuts.chat.captureScreenshot',
    );
    expect(getShortcutDescriptionI18nKey('chat.captureScreenshotMinimized')).toBe(
      'keyboard.shortcuts.chat.captureScreenshotMinimized',
    );
    expect(getShortcutDescriptionI18nKey('chat.toggleRecording')).toBe(
      'keyboard.shortcuts.chat.toggleRecording',
    );
    expect(getShortcutDescriptionI18nKey('chat.toggleRecordingMinimized')).toBe(
      'keyboard.shortcuts.chat.toggleRecordingMinimized',
    );
  });
});
