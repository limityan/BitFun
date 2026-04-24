/**
 * Session file change badge.
 * Shows compact file change stats in FlowChatHeader.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FileEdit, FilePlus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSnapshotState } from '../../../tools/snapshot_system/hooks/useSnapshotState';
import { createDiffEditorTab } from '../../../shared/utils/tabUtils';
import { snapshotAPI } from '../../../infrastructure/api';
import { useWorkspaceContext } from '../../../infrastructure/contexts/WorkspaceContext';
import { diffService } from '../../../tools/editor/services';
import { notificationService } from '../../../shared/notification-system';
import { createLogger } from '@/shared/utils/logger';
import { createBtwChildSession } from '../../services/BtwThreadService';
import { openBtwSessionInAuxPane } from '../../services/openBtwSession';
import {
  buildDeepReviewPromptFromSessionFiles,
  launchDeepReviewSession,
} from '../../services/DeepReviewService';
import { useDeepReviewConsent } from '../DeepReviewConsentDialog';
import {
  REVIEW_READY_GLINT_DURATION_MS,
  shouldTriggerReviewReadyGlint,
} from './reviewReadyGlint';
import './SessionFilesBadge.scss';

const log = createLogger('SessionFilesBadge');

const REVIEW_EXCLUDED_EXTENSIONS = new Set([
  '.7z', '.avi', '.avif', '.bin', '.bmp', '.class', '.dll', '.doc', '.docx', '.eot', '.exe',
  '.gif', '.gz', '.ico', '.jar', '.jpeg', '.jpg', '.lock', '.map', '.min.js', '.min.css',
  '.mov', '.mp3', '.mp4', '.otf', '.pdf', '.png', '.rar', '.so', '.svg', '.tar', '.tgz',
  '.tiff', '.ttf', '.wav', '.webm', '.webp', '.woff', '.woff2', '.xz', '.zip',
]);

const REVIEW_EXCLUDED_FILENAMES = new Set([
  'bun.lock', 'bun.lockb', 'Cargo.lock', 'composer.lock', 'Gemfile.lock', 'package-lock.json',
  'pnpm-lock.yaml', 'poetry.lock', 'Podfile.lock', 'yarn.lock',
]);

const REVIEW_EXCLUDED_PATH_SEGMENTS = new Set([
  '.cache', '.next', '.nuxt', '.output', '.parcel-cache', '.svelte-kit', '.turbo',
  'build', 'coverage', 'dist', 'node_modules', 'out', 'target',
]);

function shouldReviewFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const segments = normalizedPath
    .split('/')
    .map(segment => segment.trim().toLowerCase())
    .filter(Boolean);

  if (segments.some(segment => REVIEW_EXCLUDED_PATH_SEGMENTS.has(segment))) {
    return false;
  }

  const fileName = normalizedPath.split('/').pop()?.trim() || normalizedPath;
  const lowerFileName = fileName.toLowerCase();

  if (REVIEW_EXCLUDED_FILENAMES.has(fileName) || REVIEW_EXCLUDED_FILENAMES.has(lowerFileName)) {
    return false;
  }

  if (lowerFileName.endsWith('.min.js') || lowerFileName.endsWith('.min.css')) {
    return false;
  }

  const extMatch = lowerFileName.match(/(\.[^.]+)$/);
  const extension = extMatch?.[1];

  if (extension && REVIEW_EXCLUDED_EXTENSIONS.has(extension)) {
    return false;
  }

  return true;
}

export interface SessionFilesBadgeProps {
  /** Session ID. */
  sessionId?: string;
  /** Disabled state. */
  disabled?: boolean;
}

interface FileStats {
  filePath: string;
  fileName: string;
  additions: number;
  deletions: number;
  operationType: 'write' | 'edit' | 'delete';
  loading?: boolean;
  error?: string;
}

interface StatsCache {
  [filePath: string]: {
    stats: FileStats;
    timestamp: number;
  };
}

/**
 * Session file change badge.
 */
export const SessionFilesBadge: React.FC<SessionFilesBadgeProps> = ({
  sessionId,
  disabled = false,
}) => {
  const { t } = useTranslation('flow-chat');
  const { files } = useSnapshotState(sessionId);
  const { currentWorkspace } = useWorkspaceContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReviewMenuOpen, setIsReviewMenuOpen] = useState(false);
  const [showReviewReadyGlint, setShowReviewReadyGlint] = useState(false);
  const [fileStats, setFileStats] = useState<Map<string, FileStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState(false);

  const statsCacheRef = useRef<StatsCache>({});
  const loadingFilesRef = useRef<Set<string>>(new Set());
  const previousSessionIdRef = useRef<string | undefined>(undefined);
  const previousReviewableFileCountRef = useRef(0);
  const reviewReadyGlintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CACHE_TTL = 10000;

  const badgeRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const reviewMenuRef = useRef<HTMLDivElement>(null);
  const { confirmDeepReviewLaunch, deepReviewConsentDialog } = useDeepReviewConsent();

  // Reset cached state when the session changes.
  useEffect(() => {
    if (previousSessionIdRef.current !== sessionId) {
      previousSessionIdRef.current = sessionId;
      statsCacheRef.current = {};
      loadingFilesRef.current.clear();
      setFileStats(new Map());
      setIsExpanded(false);
      setIsReviewMenuOpen(false);
      setShowReviewReadyGlint(false);
      previousReviewableFileCountRef.current = 0;
      if (reviewReadyGlintTimeoutRef.current) {
        clearTimeout(reviewReadyGlintTimeoutRef.current);
        reviewReadyGlintTimeoutRef.current = null;
      }
    }
  }, [sessionId, t]);

  useEffect(() => () => {
    if (reviewReadyGlintTimeoutRef.current) {
      clearTimeout(reviewReadyGlintTimeoutRef.current);
    }
  }, []);

  // Close the popovers when clicking outside.
  useEffect(() => {
    if (!isExpanded && !isReviewMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedBadge = !!badgeRef.current?.contains(target);
      const clickedFilesPopover = !!popoverRef.current?.contains(target);
      const clickedReviewMenu = !!reviewMenuRef.current?.contains(target);
      if (!clickedBadge && !clickedFilesPopover && !clickedReviewMenu) {
        setIsExpanded(false);
        setIsReviewMenuOpen(false);
      }
    };

    // Delay binding to avoid immediate trigger.
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isReviewMenuOpen]);

  /**
   * Fetch per-file diff stats with caching.
   */
  const loadFileStats = useCallback(async (filesToLoad: typeof files) => {
    if (!sessionId || filesToLoad.length === 0) {
      return;
    }

    const now = Date.now();

    const newFilesToLoad = filesToLoad.filter(file => {
      if (loadingFilesRef.current.has(file.filePath)) {
        return false;
      }
      const cached = statsCacheRef.current[file.filePath];
      if (cached && now - cached.timestamp < CACHE_TTL) {
        return false;
      }
      return true;
    });

    if (newFilesToLoad.length === 0) {
      return;
    }

    setLoadingStats(true);

    try {
      newFilesToLoad.forEach(file => {
        loadingFilesRef.current.add(file.filePath);
      });

      await Promise.all(
        newFilesToLoad.map(async (file) => {
          let stats: FileStats | null = null;

          try {
            const diffData = await snapshotAPI.getOperationDiff(sessionId, file.filePath);
            const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;

            let additions = 0;
            let deletions = 0;
            let operationType: 'write' | 'edit' | 'delete' = 'edit';

            if (!diffData.originalContent && diffData.modifiedContent) {
              operationType = 'write';
              additions = diffData.modifiedContent.split('\n').length;
              deletions = 0;
            } else if (diffData.originalContent && !diffData.modifiedContent) {
              operationType = 'delete';
              additions = 0;
              deletions = diffData.originalContent.split('\n').length;
            } else if (diffData.originalContent && diffData.modifiedContent) {
              const result = await diffService.computeDiff(
                diffData.originalContent,
                diffData.modifiedContent,
                { timeout: 3000 }
              );
              additions = result.stats.additions;
              deletions = result.stats.deletions;
            }

            stats = {
              filePath: file.filePath,
              fileName,
              additions,
              deletions,
              operationType,
            };

            statsCacheRef.current[file.filePath] = {
              stats,
              timestamp: now,
            };
          } catch (error) {
            log.warn('Failed to get file stats', { filePath: file.filePath, error });
            const fileName = file.filePath.split(/[/\\]/).pop() || file.filePath;
            stats = {
              filePath: file.filePath,
              fileName,
              additions: 0,
              deletions: 0,
              operationType: 'edit',
              error: t('sessionFilesBadge.loadFailed'),
            };
          } finally {
            loadingFilesRef.current.delete(file.filePath);
          }

          // Keep only files with changes or errors (filter +0/-0).
          if (stats && (stats.additions > 0 || stats.deletions > 0 || stats.error)) {
            setFileStats(prev => {
              const newMap = new Map(prev);
              newMap.set(file.filePath, stats!);
              return newMap;
            });
          }
        })
      );
    } catch (error) {
      log.error('Failed to load file stats', error);
    } finally {
      setLoadingStats(false);
    }
  }, [sessionId, t]);

  // Reload stats when the file list changes.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (files.length > 0) {
        loadFileStats(files);
      } else {
        setFileStats(new Map());
        statsCacheRef.current = {};
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [files, loadFileStats]);

  // Compute totals.
  const totalStats = useMemo(() => {
    let totalAdditions = 0;
    let totalDeletions = 0;

    fileStats.forEach((stat) => {
      totalAdditions += stat.additions;
      totalDeletions += stat.deletions;
    });

    return { totalAdditions, totalDeletions };
  }, [fileStats]);

  const reviewableFileCount = useMemo(() => {
    return Array.from(fileStats.keys()).filter(shouldReviewFile).length;
  }, [fileStats]);

  useEffect(() => {
    const previousReviewableCount = previousReviewableFileCountRef.current;
    if (shouldTriggerReviewReadyGlint({
      previousReviewableCount,
      nextReviewableCount: reviewableFileCount,
      loadingStats,
    })) {
      setShowReviewReadyGlint(true);
      if (reviewReadyGlintTimeoutRef.current) {
        clearTimeout(reviewReadyGlintTimeoutRef.current);
      }
      reviewReadyGlintTimeoutRef.current = setTimeout(() => {
        setShowReviewReadyGlint(false);
        reviewReadyGlintTimeoutRef.current = null;
      }, REVIEW_READY_GLINT_DURATION_MS);
    }
    previousReviewableFileCountRef.current = reviewableFileCount;
  }, [loadingStats, reviewableFileCount]);

  // Open diff for the selected file.
  const handleFileClick = useCallback(async (filePath: string) => {
    if (!sessionId) return;

    try {
      const diffData = await snapshotAPI.getOperationDiff(sessionId, filePath);
      if ((diffData.originalContent || '') === (diffData.modifiedContent || '')) {
        log.debug('Skipping empty session diff', { filePath, sessionId });
        setIsExpanded(false);
        return;
      }
      const fileName = filePath.split(/[/\\]/).pop() || filePath;

      // Expand the right panel.
      window.dispatchEvent(new CustomEvent('expand-right-panel'));

      setTimeout(() => {
        createDiffEditorTab(
          filePath,
          fileName,
          diffData.originalContent || '',
          diffData.modifiedContent || '',
          false,
          'agent',
          currentWorkspace?.rootPath,
          undefined,
          false,
          {
            titleKind: 'diff',
            duplicateKeyPrefix: 'diff'
          }
        );
      }, 250);

      setIsExpanded(false);
    } catch (error) {
      log.error('Failed to open diff', { filePath, error });
    }
  }, [sessionId, currentWorkspace?.rootPath]);

  // Trigger CodeReview agent for the current session's changes.
  const handleReviewClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sessionId || fileStats.size === 0) return;
    setIsReviewMenuOpen(false);

    const filePaths = Array.from(fileStats.keys());
    const reviewableFilePaths = filePaths.filter(shouldReviewFile);
    const skippedCount = filePaths.length - reviewableFilePaths.length;

    if (reviewableFilePaths.length === 0) {
      notificationService.warning(
        t('sessionFilesBadge.review.noEligibleFiles', {
          defaultValue: 'No reviewable files remain after excluded files were filtered out.',
        }),
        { duration: 3500 }
      );
      return;
    }

    if (skippedCount > 0) {
      notificationService.info(
        t('sessionFilesBadge.review.filteredNotice', {
          included: reviewableFilePaths.length,
          skipped: skippedCount,
          defaultValue:
            'Review will analyze {{included}} files and skip {{skipped}} excluded files such as lock, generated, or binary assets.',
        }),
        { duration: 3500 }
      );
    }

    const fileList = reviewableFilePaths.map(p => `- ${p}`).join('\n');
    const displayMessage = skippedCount > 0
      ? t('sessionFilesBadge.review.displayMessageFiltered', {
          files: fileList,
          skipped: skippedCount,
          defaultValue:
            'Review filtered files:\n{{files}}\n\nSkipped {{skipped}} excluded files.',
        })
      : t('sessionFilesBadge.review.displayMessage', { files: fileList });
    const reviewMessage = skippedCount > 0
      ? t('sessionFilesBadge.review.promptFiltered', {
          files: fileList,
          skipped: skippedCount,
          defaultValue:
            'Please review the following modified files in this session:\n\n{{files}}\n\nDo not review the {{skipped}} skipped files because they matched the excluded lock, generated, or binary file rules.',
        })
      : t('sessionFilesBadge.review.prompt', { files: fileList });

    try {
      const { FlowChatManager } = await import('../../services/FlowChatManager');
      const flowChatManager = FlowChatManager.getInstance();
      const { childSessionId } = await createBtwChildSession({
        parentSessionId: sessionId,
        workspacePath: currentWorkspace?.rootPath,
        childSessionName: t('sessionFilesBadge.review.threadTitle', {
          defaultValue: 'Code review',
        }),
        sessionKind: 'review',
        agentType: 'CodeReview',
        enableTools: true,
        safeMode: true,
        autoCompact: true,
        enableContextCompression: true,
        addMarker: false,
      });

      openBtwSessionInAuxPane({
        childSessionId,
        parentSessionId: sessionId,
        workspacePath: currentWorkspace?.rootPath,
        expand: true,
      });

      await flowChatManager.sendMessage(
        reviewMessage,
        childSessionId,
        displayMessage
      );

      setIsExpanded(false);
    } catch (error) {
      log.error('Failed to send review request', {
        sessionId,
        fileCount: reviewableFilePaths.length,
        skippedCount,
        error,
      });
    }
  }, [fileStats, sessionId, t, currentWorkspace?.rootPath]);

  const handleDeepReviewClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sessionId || fileStats.size === 0) return;
    setIsReviewMenuOpen(false);

    const filePaths = Array.from(fileStats.keys());
    const reviewableFilePaths = filePaths.filter(shouldReviewFile);
    const skippedCount = filePaths.length - reviewableFilePaths.length;

    if (reviewableFilePaths.length === 0) {
      notificationService.warning(
        t('sessionFilesBadge.review.noEligibleFiles', {
          defaultValue: 'No reviewable files remain after excluded files were filtered out.',
        }),
        { duration: 3500 }
      );
      return;
    }

    const confirmed = await confirmDeepReviewLaunch();
    if (!confirmed) {
      return;
    }

    if (skippedCount > 0) {
      notificationService.info(
        t('sessionFilesBadge.review.filteredNotice', {
          included: reviewableFilePaths.length,
          skipped: skippedCount,
          defaultValue:
            'Review will analyze {{included}} files and skip {{skipped}} excluded files such as lock, generated, or binary assets.',
        }),
        { duration: 3500 }
      );
    }

    const fileList = reviewableFilePaths.map(p => `- ${p}`).join('\n');
    const displayMessage = skippedCount > 0
      ? t('sessionFilesBadge.deepReview.displayMessageFiltered', {
          files: fileList,
          skipped: skippedCount,
          defaultValue:
            'Deep review filtered files:\n{{files}}\n\nSkipped {{skipped}} excluded files.',
        })
      : t('sessionFilesBadge.deepReview.displayMessage', {
          files: fileList,
          defaultValue: 'Deep review modified files:\n{{files}}',
        });

    try {
      const prompt = await buildDeepReviewPromptFromSessionFiles(
        reviewableFilePaths,
        undefined,
        currentWorkspace?.rootPath,
      );

      await launchDeepReviewSession({
        parentSessionId: sessionId,
        workspacePath: currentWorkspace?.rootPath,
        prompt,
        displayMessage,
        childSessionName: t('sessionFilesBadge.deepReview.threadTitle', {
          defaultValue: 'Deep review',
        }),
      });

      setIsExpanded(false);
    } catch (error) {
      log.error('Failed to send deep review request', {
        sessionId,
        fileCount: reviewableFilePaths.length,
        skippedCount,
        error,
      });
    }
  }, [confirmDeepReviewLaunch, fileStats, sessionId, t, currentWorkspace?.rootPath]);

  const getOperationIcon = (operationType: 'write' | 'edit' | 'delete') => {
    switch (operationType) {
      case 'write':
        return <FilePlus size={12} className="icon-write" />;
      case 'delete':
        return <Trash2 size={12} className="icon-delete" />;
      default:
        return <FileEdit size={12} className="icon-edit" />;
    }
  };

  // Hide when there is no session, no changes, or disabled.
  if (!sessionId || fileStats.size === 0 || disabled) {
    return null;
  }

  return (
    <>
      <div
        ref={badgeRef}
        className={`session-files-badge ${isExpanded ? 'session-files-badge--expanded' : ''}`}
      >
      <button
        className="session-files-badge__button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loadingStats}
        type="button"
      >
        <span className="session-files-badge__count">
          {fileStats.size} {t('sessionFilesBadge.files')}
        </span>
        {totalStats.totalAdditions > 0 && (
          <span className="session-files-badge__stats session-files-badge__stats--add">
            +{totalStats.totalAdditions}
          </span>
        )}
        {totalStats.totalDeletions > 0 && (
          <span className="session-files-badge__stats session-files-badge__stats--del">
            -{totalStats.totalDeletions}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp size={12} className="session-files-badge__arrow" />
        ) : (
          <ChevronDown size={12} className="session-files-badge__arrow" />
        )}
      </button>

      <div
        ref={reviewMenuRef}
        className="session-files-badge__review-menu"
      >
        <button
          className={[
            'session-files-badge__review-btn',
            showReviewReadyGlint && 'session-files-badge__review-btn--glint',
          ].filter(Boolean).join(' ')}
          onClick={(event) => {
            event.stopPropagation();
            setIsReviewMenuOpen(open => !open);
          }}
          disabled={loadingStats}
          title={t('sessionFilesBadge.reviewMenuHint')}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isReviewMenuOpen}
        >
          <span className="session-files-badge__review-text">{t('sessionFilesBadge.reviewMenuLabel')}</span>
          <ChevronDown size={12} className="session-files-badge__review-menu-chevron" />
        </button>

        {isReviewMenuOpen && (
          <div className="session-files-badge__review-menu-popover" role="menu">
            <button
              className="session-files-badge__review-menu-item"
              onClick={handleReviewClick}
              type="button"
              role="menuitem"
            >
              <span>{t('sessionFilesBadge.reviewModeStandard')}</span>
            </button>
            <button
              className="session-files-badge__review-menu-item session-files-badge__review-menu-item--deep"
              onClick={handleDeepReviewClick}
              type="button"
              role="menuitem"
            >
              <Sparkles size={12} className="session-files-badge__review-icon" />
              <span>{t('sessionFilesBadge.reviewModeDeep')}</span>
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div
          ref={popoverRef}
          className="session-files-badge__popover"
        >
          <div className="session-files-badge__list">
            {Array.from(fileStats.values()).map((stat) => (
              <div
                key={stat.filePath}
                className={`session-files-badge__file-item session-files-badge__file-item--${stat.operationType} ${
                  stat.error ? 'session-files-badge__file-item--error' : ''
                }`}
                onClick={() => !stat.error && handleFileClick(stat.filePath)}
                title={stat.error ? stat.error : t('sessionFilesBadge.clickToViewDiff')}
              >
                <span className="session-files-badge__file-icon">
                  {getOperationIcon(stat.operationType)}
                </span>

                <span className="session-files-badge__file-name">{stat.fileName}</span>

                {stat.error ? (
                  <span className="session-files-badge__file-error">{stat.error}</span>
                ) : (
                  <span className="session-files-badge__file-stats">
                    {stat.additions > 0 && (
                      <span className="session-files-badge__file-stat session-files-badge__file-stat--add">
                        +{stat.additions}
                      </span>
                    )}
                    {stat.deletions > 0 && (
                      <span className="session-files-badge__file-stat session-files-badge__file-stat--del">
                        -{stat.deletions}
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
      {deepReviewConsentDialog}
    </>
  );
};

SessionFilesBadge.displayName = 'SessionFilesBadge';
