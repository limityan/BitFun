/**
 * Helper utilities for workspace operations in e2e tests.
 */

import { browser, $, $$ } from '@wdio/globals';
import * as path from 'path';

export interface WorkspaceState {
  currentWorkspacePath: string | null;
  openedWorkspacePaths: string[];
  workspaceLabels: string[];
}

/**
 * Open a workspace through the frontend state layer so the UI stays in sync.
 */
export async function openWorkspaceThroughFrontend(workspacePath: string): Promise<void> {
  await browser.execute(async (targetWorkspacePath: string) => {
    const { workspaceManager } = await import('/src/infrastructure/services/business/workspaceManager.ts');
    await workspaceManager.openWorkspace(targetWorkspacePath);
  }, workspacePath);
}

/**
 * Read the current frontend-visible workspace state.
 */
export async function getWorkspaceState(): Promise<WorkspaceState> {
  return browser.execute(async () => {
    const { globalStateAPI } = await import('/src/shared/types/global-state.ts');
    const currentWorkspace = await globalStateAPI.getCurrentWorkspace();
    const openedWorkspaces = await globalStateAPI.getOpenedWorkspaces();
    const workspaceLabels = Array.from(document.querySelectorAll('.bitfun-nav-panel__workspace-item-label'))
      .map(element => element.textContent?.trim() || '')
      .filter(Boolean);

    return {
      currentWorkspacePath: currentWorkspace?.rootPath || null,
      openedWorkspacePaths: openedWorkspaces.map(workspace => workspace.rootPath),
      workspaceLabels,
    };
  });
}

/**
 * Wait until both frontend state and nav DOM reflect the target workspace.
 */
export async function waitForWorkspaceReady(
  workspacePath: string,
  projectName: string = path.basename(workspacePath),
  timeout: number = 15000,
): Promise<WorkspaceState> {
  await browser.waitUntil(async () => {
    const state = await getWorkspaceState();
    return state.currentWorkspacePath === workspacePath
      && state.openedWorkspacePaths.includes(workspacePath)
      && state.workspaceLabels.some(label => label.includes(projectName));
  }, {
    timeout,
    interval: 500,
    timeoutMsg: `Workspace did not become active in frontend state: ${workspacePath}`,
  });

  return getWorkspaceState();
}

/**
 * Open a workspace and wait until the frontend is ready to interact with it.
 */
export async function openWorkspace(
  workspacePath: string = process.env.E2E_TEST_WORKSPACE || process.cwd(),
): Promise<boolean> {
  try {
    await openWorkspaceThroughFrontend(workspacePath);
    await waitForWorkspaceReady(workspacePath);
    return true;
  } catch (error) {
    console.error('[WorkspaceHelper] Failed to open workspace through frontend state:', error);
    return false;
  }
}

/**
 * Ensure a Code session is open for the active workspace.
 */
export async function ensureCodeSessionOpen(): Promise<void> {
  await browser.waitUntil(async () => {
    const chatInput = await $('[data-testid="chat-input-container"]');
    if (await chatInput.isExisting()) {
      return true;
    }

    const launchers = [
      '[data-testid="nav-new-code-session-btn"]',
      '.bitfun-nav-panel__workspace-create-main--split-left',
      '.bitfun-nav-panel__workspace-create-main',
      '//button[contains(@aria-label, "New Code session")]',
      '//button[contains(@aria-label, "New Code Session")]',
      '//button[contains(@aria-label, "新建 Code 会话")]',
      '//button[contains(normalize-space(.), "Code Session")]',
      '//button[contains(normalize-space(.), "编码会话")]',
      '//button[contains(normalize-space(.), "Code")]',
    ];

    for (const selector of launchers) {
      const element = await $(selector);
      if (await element.isExisting()) {
        return true;
      }
    }

    return false;
  }, {
    timeout: 15000,
    interval: 500,
    timeoutMsg: 'Code session launcher did not become available',
  });

  const chatInput = await $('[data-testid="chat-input-container"]');
  if (await chatInput.isExisting()) {
    return;
  }

  const selectors = [
    '[data-testid="nav-new-code-session-btn"]',
    '.bitfun-nav-panel__workspace-create-main--split-left',
    '.bitfun-nav-panel__workspace-create-main',
    '//button[contains(@aria-label, "New Code session")]',
    '//button[contains(@aria-label, "New Code Session")]',
    '//button[contains(@aria-label, "新建 Code 会话")]',
    '//button[contains(normalize-space(.), "Code Session")]',
    '//button[contains(normalize-space(.), "编码会话")]',
    '//button[contains(normalize-space(.), "Code")]',
  ];

  let launcherFound = false;
  for (const selector of selectors) {
    const element = await $(selector);
    if (await element.isExisting()) {
      await element.click();
      launcherFound = true;
      break;
    }
  }

  if (!launcherFound) {
    throw new Error('Code session launcher was not found');
  }

  await browser.waitUntil(async () => {
    const input = await $('[data-testid="chat-input-container"]');
    return input.isExisting();
  }, {
    timeout: 15000,
    interval: 500,
    timeoutMsg: 'Code session did not open',
  });
}

/**
 * Checks if any workspace is currently active in the frontend.
 */
export async function isWorkspaceOpen(): Promise<boolean> {
  const state = await getWorkspaceState();
  if (state.currentWorkspacePath) {
    return true;
  }

  const chatInput = await $('[data-testid="chat-input-container"]');
  return await chatInput.isExisting();
}

export default {
  openWorkspaceThroughFrontend,
  getWorkspaceState,
  waitForWorkspaceReady,
  openWorkspace,
  ensureCodeSessionOpen,
  isWorkspaceOpen,
};
