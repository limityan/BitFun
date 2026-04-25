import { BasePage } from '../BasePage';
import { browser, $ } from '@wdio/globals';

export class ConfirmDialog extends BasePage {
  private selectors = {
    container: '[data-testid="confirm-dialog"]',
    confirmButton: '[data-testid="confirm-dialog-confirm-btn"]',
    cancelButton: '[data-testid="confirm-dialog-cancel-btn"]',
  };

  async waitForVisible(timeout?: number): Promise<void> {
    await this.waitForElement(this.selectors.container, timeout);
  }

  async waitForHidden(timeout = 5000): Promise<void> {
    await browser.waitUntil(async () => !(await this.isVisible()), {
      timeout,
      interval: 100,
      timeoutMsg: 'Confirm dialog did not close',
    });
  }

  async isVisible(): Promise<boolean> {
    return this.isElementVisible(this.selectors.container);
  }

  async confirm(): Promise<void> {
    await this.safeClick(this.selectors.confirmButton);
  }

  async waitForConfirmEnabled(timeout = 5000): Promise<void> {
    await browser.waitUntil(async () => {
      const button = await $(this.selectors.confirmButton);
      if (!(await button.isExisting())) {
        return false;
      }
      return button.isEnabled();
    }, {
      timeout,
      interval: 200,
      timeoutMsg: 'Confirm dialog confirm button did not become enabled',
    });
  }

  async cancel(): Promise<void> {
    await this.safeClick(this.selectors.cancelButton);
  }
}

export default ConfirmDialog;
