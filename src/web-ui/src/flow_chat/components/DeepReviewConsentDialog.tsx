import React, { useCallback, useState } from 'react';
import { Clock, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Modal } from '@/component-library';
import { createLogger } from '@/shared/utils/logger';
import './DeepReviewConsentDialog.scss';

const log = createLogger('DeepReviewConsentDialog');
const SKIP_DEEP_REVIEW_CONFIRMATION_STORAGE_KEY = 'bitfun.deepReview.skipCostConfirmation';

interface PendingConsent {
  resolve: (confirmed: boolean) => void;
}

export interface DeepReviewConsentControls {
  confirmDeepReviewLaunch: () => Promise<boolean>;
  deepReviewConsentDialog: React.ReactNode;
}

export function useDeepReviewConsent(): DeepReviewConsentControls {
  const { t } = useTranslation('flow-chat');
  const [pendingConsent, setPendingConsent] = useState<PendingConsent | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const confirmDeepReviewLaunch = useCallback(async () => {
    try {
      if (localStorage.getItem(SKIP_DEEP_REVIEW_CONFIRMATION_STORAGE_KEY) === 'true') {
        return true;
      }
    } catch (error) {
      log.warn('Failed to read Deep Review confirmation preference from local storage', error);
    }

    return new Promise<boolean>((resolve) => {
      setDontShowAgain(false);
      setPendingConsent({ resolve });
    });
  }, []);

  const settleConsent = useCallback(async (confirmed: boolean) => {
    const pending = pendingConsent;
    if (!pending) {
      return;
    }

    if (confirmed && dontShowAgain) {
      try {
        localStorage.setItem(SKIP_DEEP_REVIEW_CONFIRMATION_STORAGE_KEY, 'true');
      } catch (error) {
        log.warn('Failed to persist Deep Review confirmation preference to local storage', error);
      }
    }

    setPendingConsent(null);
    pending.resolve(confirmed);
  }, [dontShowAgain, pendingConsent]);

  const deepReviewConsentDialog = pendingConsent ? (
    <Modal
      isOpen={true}
      onClose={() => void settleConsent(false)}
      title={t('deepReviewConsent.title')}
      size="small"
      closeOnOverlayClick={false}
    >
      <div className="deep-review-consent">
        <div className="deep-review-consent__hero" aria-hidden="true">
          <Sparkles size={18} />
        </div>
        <div className="deep-review-consent__body">
          <p>{t('deepReviewConsent.body')}</p>
          <div className="deep-review-consent__facts">
            <div className="deep-review-consent__fact">
              <ShieldCheck size={15} />
              <span>{t('deepReviewConsent.readonly')}</span>
            </div>
            <div className="deep-review-consent__fact">
              <Coins size={15} />
              <span>{t('deepReviewConsent.cost')}</span>
            </div>
            <div className="deep-review-consent__fact">
              <Clock size={15} />
              <span>{t('deepReviewConsent.time')}</span>
            </div>
          </div>
        </div>
        <Checkbox
          className="deep-review-consent__checkbox"
          checked={dontShowAgain}
          onChange={(event) => setDontShowAgain(event.target.checked)}
          label={t('deepReviewConsent.dontShowAgain')}
        />
        <div className="deep-review-consent__actions">
          <Button
            variant="secondary"
            size="small"
            onClick={() => void settleConsent(false)}
          >
            {t('deepReviewConsent.cancel')}
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={() => void settleConsent(true)}
          >
            {t('deepReviewConsent.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  ) : null;

  return {
    confirmDeepReviewLaunch,
    deepReviewConsentDialog,
  };
}
