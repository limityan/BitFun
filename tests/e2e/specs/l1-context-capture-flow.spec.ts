import { browser, expect } from '@wdio/globals';
import { Header } from '../page-objects/components/Header';
import { StartupPage } from '../page-objects/StartupPage';
import { ChatInput } from '../page-objects/components/ChatInput';
import { ConfirmDialog } from '../page-objects/components/ConfirmDialog';
import { ensureCodeSessionOpen, openWorkspace } from '../helpers/workspace-helper';
import {
  getContextCaptureMockState,
  installContextCaptureMock,
  resetContextCaptureMockForInteraction,
} from '../helpers/context-capture-helper';
import { saveFailureScreenshot, saveStepScreenshot } from '../helpers/screenshot-utils';

async function confirmVisibleDialogs(confirmDialog: ConfirmDialog, maxDialogs = 2) {
  for (let index = 0; index < maxDialogs; index += 1) {
    const dialogAppeared = await browser.waitUntil(async () => confirmDialog.isVisible(), {
      timeout: 1500,
      interval: 100,
      timeoutMsg: 'No more confirm dialogs appeared',
    }).then(() => true).catch(() => false);

    if (!dialogAppeared) {
      break;
    }

    await confirmDialog.waitForConfirmEnabled(6000);
    await confirmDialog.confirm();
    await confirmDialog.waitForHidden(2000);
  }
}

describe('L1 Context Capture Flow', () => {
  let header: Header;
  let startupPage: StartupPage;
  let chatInput: ChatInput;
  let confirmDialog: ConfirmDialog;
  let hasWorkspace = false;

  before(async () => {
    header = new Header();
    startupPage = new StartupPage();
    chatInput = new ChatInput();
    confirmDialog = new ConfirmDialog();

    await browser.pause(3000);
    await header.waitForLoad();

    const startupVisible = await startupPage.isVisible();
    hasWorkspace = !startupVisible;

    if (!hasWorkspace) {
      hasWorkspace = await openWorkspace();
    }

    if (hasWorkspace) {
      await installContextCaptureMock();
      await ensureCodeSessionOpen();
      await saveStepScreenshot('l1-context-capture-flow-workspace-ready');
    }
  });

  beforeEach(async function () {
    if (!hasWorkspace) {
      this.skip();
      return;
    }

    await resetContextCaptureMockForInteraction();
    await chatInput.waitForLoad();
    await chatInput.waitForImageChipCount(0);
  });

  it('should request consent and attach a screenshot to the chat input', async function () {
    if (!hasWorkspace) {
      this.skip();
      return;
    }

    await chatInput.clickScreenshot();
    await confirmDialog.waitForVisible();
    expect(await confirmDialog.isVisible()).toBe(true);

    await confirmDialog.confirm();
    await chatInput.waitForImageChipCount(1);

    expect(await chatInput.getImageChipCount()).toBe(1);
    expect(await chatInput.getRecordingBadgeCount()).toBe(0);
  });

  it('should attach a mocked recording video and remove it', async function () {
    if (!hasWorkspace) {
      this.skip();
      return;
    }

    await chatInput.clickRecording();
    await confirmVisibleDialogs(confirmDialog, 2);
    await browser.waitUntil(async () => {
      const state = await getContextCaptureMockState();
      return state.startRecordingCalls > 0 && state.recordingActive;
    }, {
      timeout: 3000,
      interval: 200,
      timeoutMsg: 'Mock recording start handler was not invoked',
    });

    await browser.waitUntil(async () => {
      const label = await chatInput.getRecordingButtonAriaLabel();
      return /stop/i.test(label) || /停止录屏/.test(label);
    }, {
      timeout: 5000,
      interval: 200,
      timeoutMsg: 'Recording button did not enter stop state',
    });

    await chatInput.clickRecording();
    await browser.waitUntil(async () => {
      const state = await getContextCaptureMockState();
      return state.stopRecordingCalls > 0 && !state.recordingActive;
    }, {
      timeout: 3000,
      interval: 200,
      timeoutMsg: 'Mock recording stop handler was not invoked',
    });

    await chatInput.waitForVideoChipCount(1);

    expect(await chatInput.getImageChipCount()).toBe(0);
    expect(await chatInput.getRecordingBadgeCount()).toBe(1);
    await chatInput.clickFirstVideoRemove();
    await chatInput.waitForVideoChipCount(0);
    expect(await chatInput.getRecordingBadgeCount()).toBe(0);

    const state = await getContextCaptureMockState();
    expect(state.deleteArtifactCalls).toBeGreaterThan(0);
    expect(state.lastDeletedArtifactPath).toContain('.webm');
  });

  afterEach(async function () {
    if (this.currentTest?.state === 'failed') {
      await saveFailureScreenshot(`l1-context-capture-flow-${this.currentTest.title}`);
    }
  });
});
