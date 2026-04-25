import { browser, expect, $ } from '@wdio/globals';
import { Header } from '../page-objects/components/Header';
import { StartupPage } from '../page-objects/StartupPage';
import { ChatInput } from '../page-objects/components/ChatInput';
import { ensureCodeSessionOpen, openWorkspace } from '../helpers/workspace-helper';
import { saveFailureScreenshot, saveStepScreenshot } from '../helpers/screenshot-utils';

async function openKeyboardSettingsTab(): Promise<void> {
  await browser.execute(() => {
    window.dispatchEvent(new CustomEvent('scene:open', {
      detail: { sceneId: 'settings' },
    }));
  });

  await browser.waitUntil(async () => {
    const scene = await $('.bitfun-settings-scene');
    const keyboardTabButton = await $('[data-testid="settings-nav-item-keyboard"]');
    return (await scene.isExisting()) && (await keyboardTabButton.isExisting());
  }, {
    timeout: 10000,
    interval: 250,
    timeoutMsg: 'Keyboard settings scene did not open',
  });

  const keyboardTabButton = await $('[data-testid="settings-nav-item-keyboard"]');
  await keyboardTabButton.click();
}

describe('L1 Context Capture UI', () => {
  let header: Header;
  let startupPage: StartupPage;
  let chatInput: ChatInput;
  let hasWorkspace = false;

  before(async () => {
    header = new Header();
    startupPage = new StartupPage();
    chatInput = new ChatInput();

    await browser.pause(3000);
    await header.waitForLoad();

    const startupVisible = await startupPage.isVisible();
    hasWorkspace = !startupVisible;

    if (!hasWorkspace) {
      hasWorkspace = await openWorkspace();
    }

    if (hasWorkspace) {
      await ensureCodeSessionOpen();
      await saveStepScreenshot('l1-context-capture-ui-workspace-ready');
    }
  });

  it('should show screenshot and recording entry buttons in the chat input', async function () {
    if (!hasWorkspace) {
      this.skip();
      return;
    }

    await chatInput.waitForLoad();

    expect(await chatInput.isScreenshotButtonVisible()).toBe(true);
    expect(await chatInput.isRecordingButtonVisible()).toBe(true);
    expect(await chatInput.isScreenshotButtonEnabled()).toBe(true);
    expect(await chatInput.isRecordingButtonEnabled()).toBe(true);
  });

  it('should list context capture shortcuts in keyboard settings', async function () {
    if (!hasWorkspace) {
      this.skip();
      return;
    }

    await openKeyboardSettingsTab();

    await browser.waitUntil(async () => {
      const list = await $('[data-testid="keyboard-shortcuts-list"]');
      return await list.isExisting();
    }, {
      timeout: 10000,
      interval: 250,
      timeoutMsg: 'Keyboard shortcuts tab did not render',
    });

    await browser.waitUntil(async () => {
      const screenshotItem = await $('[data-testid="kb-shortcut-item-chat.captureScreenshot"]');
      const screenshotMinimizedItem = await $('[data-testid="kb-shortcut-item-chat.captureScreenshotMinimized"]');
      const recordingItem = await $('[data-testid="kb-shortcut-item-chat.toggleRecording"]');
      const recordingMinimizedItem = await $('[data-testid="kb-shortcut-item-chat.toggleRecordingMinimized"]');
      return (
        (await screenshotItem.isExisting())
        && (await screenshotMinimizedItem.isExisting())
        && (await recordingItem.isExisting())
        && (await recordingMinimizedItem.isExisting())
      );
    }, {
      timeout: 10000,
      interval: 250,
      timeoutMsg: 'Keyboard shortcuts list did not render the context capture shortcuts',
    });

    const screenshotText = await $('[data-testid="kb-shortcut-item-chat.captureScreenshot"] .kb-shortcuts__item-name').getText();
    const screenshotMinimizedText = await $('[data-testid="kb-shortcut-item-chat.captureScreenshotMinimized"] .kb-shortcuts__item-name').getText();
    const recordingText = await $('[data-testid="kb-shortcut-item-chat.toggleRecording"] .kb-shortcuts__item-name').getText();
    const recordingMinimizedText = await $('[data-testid="kb-shortcut-item-chat.toggleRecordingMinimized"] .kb-shortcuts__item-name').getText();

    expect(screenshotText.trim().length).toBeGreaterThan(0);
    expect(screenshotMinimizedText.trim().length).toBeGreaterThan(0);
    expect(recordingText.trim().length).toBeGreaterThan(0);
    expect(recordingMinimizedText.trim().length).toBeGreaterThan(0);
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await saveFailureScreenshot(`l1-context-capture-ui-${this.currentTest.title}`);
    }
  });
});
