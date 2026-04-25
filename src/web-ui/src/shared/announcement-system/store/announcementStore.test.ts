import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnnouncementCard } from '../types';
import { useAnnouncementStore } from './announcementStore';

function buildCard(id: string): AnnouncementCard {
  return {
    id,
    card_type: 'feature',
    source: 'local',
    app_version: null,
    priority: 1,
    trigger: {
      condition: { type: 'manual' },
      delay_ms: 0,
      once_per_version: false,
    },
    toast: {
      icon: '',
      title: id,
      description: `${id} description`,
      action_label: 'announcements.common.learn_more',
      dismissible: true,
      auto_dismiss_ms: null,
    },
    modal: {
      size: 'lg',
      closable: true,
      completion_action: 'dismiss',
      pages: [
        {
          layout: 'text_only',
          title: id,
          body: `${id} body`,
          media: null,
        },
      ],
    },
    expires_at: null,
  };
}

const initialState = {
  queue: [],
  activeToast: null,
  toastVisible: false,
  openModal: null,
  modalVisible: false,
  currentPage: 0,
  initialised: false,
};

describe('announcementStore.enqueueCards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAnnouncementStore.setState(initialState);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    useAnnouncementStore.setState(initialState);
  });

  it('starts the next toast when the announcement system is idle', () => {
    const card = buildCard('feature_context_capture_v0_2_3');

    useAnnouncementStore.getState().enqueueCards([card]);
    vi.advanceTimersByTime(100);

    const state = useAnnouncementStore.getState();
    expect(state.activeToast?.id).toBe(card.id);
    expect(state.toastVisible).toBe(true);
    expect(state.queue).toEqual([]);
  });

  it('appends cards without duplicating the visible or queued items', () => {
    const visibleCard = buildCard('feature_shortcuts_v0_2_2');
    const queuedCard = buildCard('feature_context_capture_v0_2_3');
    const duplicateQueuedCard = buildCard('feature_context_capture_v0_2_3');

    useAnnouncementStore.setState({
      ...initialState,
      activeToast: visibleCard,
      toastVisible: true,
      queue: [queuedCard],
    });

    useAnnouncementStore.getState().enqueueCards([visibleCard, duplicateQueuedCard, buildCard('feature_welcome')]);

    const state = useAnnouncementStore.getState();
    expect(state.activeToast?.id).toBe(visibleCard.id);
    expect(state.queue.map((card) => card.id)).toEqual([
      queuedCard.id,
      'feature_welcome',
    ]);
  });
});
