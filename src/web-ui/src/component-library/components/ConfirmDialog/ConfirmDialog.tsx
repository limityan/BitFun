/**
 * ConfirmDialog component
 * Supports both controlled usage and imperative calls
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/infrastructure/i18n';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import './ConfirmDialog.scss';

export type ConfirmDialogType = 'info' | 'warning' | 'error' | 'success';

export interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Confirm callback */
  onConfirm: () => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Title */
  title: string;
  /** Message content */
  message: React.ReactNode;
  /** Dialog type */
  type?: ConfirmDialogType;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether the confirm button uses danger styling */
  confirmDanger?: boolean;
  /** Whether to show the cancel button */
  showCancel?: boolean;
  /** Preview content (e.g. multi-line text) */
  preview?: string;
  /** Max preview height */
  previewMaxHeight?: number;
  /** Delay confirm/close actions until the countdown reaches zero. */
  confirmDelayMs?: number;
}

const iconMap: Record<ConfirmDialogType, React.ReactNode> = {
  info: <Info size={24} />,
  warning: <AlertTriangle size={24} />,
  error: <AlertCircle size={24} />,
  success: <CheckCircle size={24} />,
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'warning',
  confirmText,
  cancelText,
  confirmDanger = false,
  showCancel = true,
  preview,
  previewMaxHeight = 200,
  confirmDelayMs = 0,
}) => {
  const { t } = useI18n('components');
  const titleId = useId();
  const hasMessage = message !== null && message !== undefined && message !== '';
  const [confirmDelayRemainingMs, setConfirmDelayRemainingMs] = useState(0);
  
  // Resolve i18n default values
  const resolvedConfirmText = confirmText ?? t('dialog.confirm.ok');
  const resolvedCancelText = cancelText ?? t('dialog.confirm.cancel');
  
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const isCountdownActive = confirmDelayRemainingMs > 0;
  const confirmCountdownSeconds = Math.max(1, Math.ceil(confirmDelayRemainingMs / 1000));
  const resolvedConfirmButtonText = isCountdownActive
    ? `${resolvedConfirmText} (${confirmCountdownSeconds})`
    : resolvedConfirmText;

  useEffect(() => {
    if (isOpen) {
      setConfirmDelayRemainingMs(confirmDelayMs);
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    } else {
      setConfirmDelayRemainingMs(0);
    }
  }, [confirmDelayMs, isOpen]);

  useEffect(() => {
    if (!isOpen || confirmDelayRemainingMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setConfirmDelayRemainingMs(current => Math.max(0, current - 200));
    }, 200);

    return () => {
      window.clearInterval(timer);
    };
  }, [confirmDelayRemainingMs, isOpen]);

  const handleConfirm = () => {
    if (isCountdownActive) {
      return;
    }
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (isCountdownActive) {
      return;
    }
    onCancel?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isCountdownActive ? () => {} : handleCancel}
      size="medium"
      showCloseButton={false}
      closeOnOverlayClick={!isCountdownActive}
    >
      <div
        className={`confirm-dialog confirm-dialog--${type}`}
        data-testid="confirm-dialog"
      >
        <div className="confirm-dialog__icon" aria-hidden>
          {iconMap[type]}
        </div>

        <div className="confirm-dialog__content">
          <h3
            className={`confirm-dialog__title${hasMessage ? '' : ' confirm-dialog__title--compact'}`}
            id={titleId}
          >
            {title}
          </h3>
          {hasMessage ? (
            <div className="confirm-dialog__message" role="region" aria-labelledby={titleId}>
              {message}
            </div>
          ) : null}

          {preview && (
            <div
              className="confirm-dialog__preview"
              style={{ maxHeight: previewMaxHeight }}
            >
              <pre>{preview}</pre>
            </div>
          )}
        </div>

        <div className="confirm-dialog__actions">
          {showCancel && (
            <Button
              variant="secondary"
              size="medium"
              onClick={handleCancel}
              data-testid="confirm-dialog-cancel-btn"
              disabled={isCountdownActive}
            >
              {resolvedCancelText}
            </Button>
          )}
          <Button
            ref={confirmButtonRef}
            variant={confirmDanger ? 'danger' : 'primary'}
            size="medium"
            onClick={handleConfirm}
            data-testid="confirm-dialog-confirm-btn"
            disabled={isCountdownActive}
          >
            {resolvedConfirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
