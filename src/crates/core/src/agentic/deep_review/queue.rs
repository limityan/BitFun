//! Deep Review queue state, controls, and capacity error classification.

use dashmap::DashMap;
use serde::Serialize;
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DeepReviewCapacityQueueReason {
    ProviderRateLimit,
    ProviderConcurrencyLimit,
    RetryAfter,
    LocalConcurrencyCap,
    TemporaryOverload,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeepReviewCapacityQueueDecision {
    pub queueable: bool,
    pub reason: Option<DeepReviewCapacityQueueReason>,
    pub retry_after_seconds: Option<u64>,
}

impl DeepReviewCapacityQueueDecision {
    fn queueable(reason: DeepReviewCapacityQueueReason, retry_after_seconds: Option<u64>) -> Self {
        Self {
            queueable: true,
            reason: Some(reason),
            retry_after_seconds,
        }
    }

    fn fail_fast() -> Self {
        Self {
            queueable: false,
            reason: None,
            retry_after_seconds: None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DeepReviewReviewerQueueStatus {
    QueuedForCapacity,
    PausedByUser,
    Running,
    CapacitySkipped,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeepReviewReviewerQueueState {
    pub status: DeepReviewReviewerQueueStatus,
    pub reason: Option<DeepReviewCapacityQueueReason>,
    pub queue_elapsed_ms: u64,
    pub run_elapsed_ms: u64,
}

impl DeepReviewReviewerQueueState {
    pub fn queued_for_capacity(
        reason: DeepReviewCapacityQueueReason,
        queue_elapsed_ms: u64,
    ) -> Self {
        Self {
            status: DeepReviewReviewerQueueStatus::QueuedForCapacity,
            reason: Some(reason),
            queue_elapsed_ms,
            run_elapsed_ms: 0,
        }
    }

    pub fn paused_by_user(queue_elapsed_ms: u64) -> Self {
        Self {
            status: DeepReviewReviewerQueueStatus::PausedByUser,
            reason: None,
            queue_elapsed_ms,
            run_elapsed_ms: 0,
        }
    }

    pub fn running(queue_elapsed_ms: u64, run_elapsed_ms: u64) -> Self {
        Self {
            status: DeepReviewReviewerQueueStatus::Running,
            reason: None,
            queue_elapsed_ms,
            run_elapsed_ms,
        }
    }

    pub fn capacity_skipped(reason: DeepReviewCapacityQueueReason, queue_elapsed_ms: u64) -> Self {
        Self {
            status: DeepReviewReviewerQueueStatus::CapacitySkipped,
            reason: Some(reason),
            queue_elapsed_ms,
            run_elapsed_ms: 0,
        }
    }

    pub fn timeout_elapsed_ms(&self) -> u64 {
        self.run_elapsed_ms
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DeepReviewQueueControlAction {
    Pause,
    Continue,
    Cancel,
    SkipOptional,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeepReviewQueueControlSnapshot {
    pub paused: bool,
    pub cancelled: bool,
    pub skip_optional: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct DeepReviewQueueControlKey {
    parent_dialog_turn_id: String,
    tool_id: String,
}

impl DeepReviewQueueControlKey {
    fn new(parent_dialog_turn_id: &str, tool_id: &str) -> Option<Self> {
        let parent_dialog_turn_id = parent_dialog_turn_id.trim();
        let tool_id = tool_id.trim();
        if parent_dialog_turn_id.is_empty() || tool_id.is_empty() {
            return None;
        }

        Some(Self {
            parent_dialog_turn_id: parent_dialog_turn_id.to_string(),
            tool_id: tool_id.to_string(),
        })
    }
}

#[derive(Default)]
pub(crate) struct DeepReviewQueueControlTracker {
    paused_tools: DashMap<DeepReviewQueueControlKey, Instant>,
    cancelled_tools: DashMap<DeepReviewQueueControlKey, Instant>,
    skip_optional_turns: DashMap<String, Instant>,
}

impl DeepReviewQueueControlTracker {
    pub(crate) fn apply(
        &self,
        parent_dialog_turn_id: &str,
        tool_id: &str,
        action: DeepReviewQueueControlAction,
    ) -> DeepReviewQueueControlSnapshot {
        let now = Instant::now();
        let Some(key) = DeepReviewQueueControlKey::new(parent_dialog_turn_id, tool_id) else {
            return DeepReviewQueueControlSnapshot {
                paused: false,
                cancelled: false,
                skip_optional: false,
            };
        };

        match action {
            DeepReviewQueueControlAction::Pause => {
                self.paused_tools.insert(key.clone(), now);
            }
            DeepReviewQueueControlAction::Continue => {
                self.paused_tools.remove(&key);
            }
            DeepReviewQueueControlAction::Cancel => {
                self.cancelled_tools.insert(key.clone(), now);
                self.paused_tools.remove(&key);
            }
            DeepReviewQueueControlAction::SkipOptional => {
                self.skip_optional_turns
                    .insert(key.parent_dialog_turn_id.clone(), now);
            }
        }

        self.snapshot(parent_dialog_turn_id, tool_id)
    }

    pub(crate) fn snapshot(
        &self,
        parent_dialog_turn_id: &str,
        tool_id: &str,
    ) -> DeepReviewQueueControlSnapshot {
        let Some(key) = DeepReviewQueueControlKey::new(parent_dialog_turn_id, tool_id) else {
            return DeepReviewQueueControlSnapshot {
                paused: false,
                cancelled: false,
                skip_optional: false,
            };
        };
        let skip_optional = self
            .skip_optional_turns
            .contains_key(&key.parent_dialog_turn_id);

        DeepReviewQueueControlSnapshot {
            paused: self.paused_tools.contains_key(&key),
            cancelled: self.cancelled_tools.contains_key(&key),
            skip_optional,
        }
    }

    pub(crate) fn clear_tool(&self, parent_dialog_turn_id: &str, tool_id: &str) {
        if let Some(key) = DeepReviewQueueControlKey::new(parent_dialog_turn_id, tool_id) {
            self.paused_tools.remove(&key);
            self.cancelled_tools.remove(&key);
        }
    }
}

pub fn classify_deep_review_capacity_error(
    code: &str,
    message: &str,
    retry_after_seconds: Option<u64>,
) -> DeepReviewCapacityQueueDecision {
    let code = code.trim().to_ascii_lowercase();
    let message = message.trim().to_ascii_lowercase();
    let combined = format!("{code} {message}");

    if contains_any(
        &combined,
        &[
            "auth",
            "api key",
            "unauthorized",
            "permission",
            "quota",
            "billing",
            "exhausted",
            "invalid_model",
            "invalid model",
            "model does not exist",
            "user_cancel",
            "cancelled",
            "canceled",
            "invalid_tooling",
            "subagent_not_allowed",
            "not allowed",
            "policy",
            "validation",
        ],
    ) {
        return DeepReviewCapacityQueueDecision::fail_fast();
    }

    if code == "deep_review_concurrency_cap_reached" {
        return DeepReviewCapacityQueueDecision::queueable(
            DeepReviewCapacityQueueReason::LocalConcurrencyCap,
            retry_after_seconds,
        );
    }

    if retry_after_seconds.is_some() {
        return DeepReviewCapacityQueueDecision::queueable(
            DeepReviewCapacityQueueReason::RetryAfter,
            retry_after_seconds,
        );
    }

    if contains_any(&combined, &["rate limit", "rate_limit", "429"]) {
        return DeepReviewCapacityQueueDecision::queueable(
            DeepReviewCapacityQueueReason::ProviderRateLimit,
            retry_after_seconds,
        );
    }

    if contains_any(
        &combined,
        &[
            "too many concurrent",
            "concurrency limit",
            "parallel request",
            "concurrent requests",
            "max concurrent",
        ],
    ) {
        return DeepReviewCapacityQueueDecision::queueable(
            DeepReviewCapacityQueueReason::ProviderConcurrencyLimit,
            retry_after_seconds,
        );
    }

    if contains_any(
        &combined,
        &[
            "temporarily overloaded",
            "temporary overload",
            "overloaded",
            "capacity",
            "try again later",
            "retry later",
        ],
    ) {
        return DeepReviewCapacityQueueDecision::queueable(
            DeepReviewCapacityQueueReason::TemporaryOverload,
            retry_after_seconds,
        );
    }

    DeepReviewCapacityQueueDecision::fail_fast()
}

fn contains_any(value: &str, needles: &[&str]) -> bool {
    needles.iter().any(|needle| value.contains(needle))
}
