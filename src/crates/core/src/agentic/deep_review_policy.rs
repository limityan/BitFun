use crate::service::config::global::GlobalConfigManager;
use crate::util::errors::{BitFunError, BitFunResult};
use dashmap::DashMap;
use log::warn;
use serde_json::{json, Value};
use std::collections::HashSet;
use std::sync::LazyLock;
use std::time::{Duration, Instant};

pub const DEEP_REVIEW_AGENT_TYPE: &str = "DeepReview";
pub const REVIEW_JUDGE_AGENT_TYPE: &str = "ReviewJudge";
pub const REVIEW_FIXER_AGENT_TYPE: &str = "ReviewFixer";
pub const CORE_REVIEWER_AGENT_TYPES: [&str; 3] =
    ["ReviewBusinessLogic", "ReviewPerformance", "ReviewSecurity"];
const DEFAULT_REVIEW_TEAM_CONFIG_PATH: &str = "ai.review_teams.default";

const DEFAULT_REVIEWER_TIMEOUT_SECONDS: u64 = 300;
const DEFAULT_JUDGE_TIMEOUT_SECONDS: u64 = 240;
const DEFAULT_AUTO_FIX_ENABLED: bool = true;
const DEFAULT_AUTO_FIX_MAX_ROUNDS: usize = 2;
const DEFAULT_AUTO_FIX_MAX_STALLED_ROUNDS: usize = 1;
const MAX_TIMEOUT_SECONDS: u64 = 3600;
const MIN_AUTO_FIX_ROUNDS: usize = 1;
const MAX_AUTO_FIX_ROUNDS: usize = 5;
const BUDGET_TTL: Duration = Duration::from_secs(6 * 60 * 60);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DeepReviewSubagentRole {
    Reviewer,
    Judge,
    Fixer,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeepReviewExecutionPolicy {
    pub extra_subagent_ids: Vec<String>,
    pub reviewer_timeout_seconds: u64,
    pub judge_timeout_seconds: u64,
    pub auto_fix_enabled: bool,
    pub auto_fix_max_rounds: usize,
    pub auto_fix_max_stalled_rounds: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeepReviewPolicyViolation {
    pub code: &'static str,
    pub message: String,
}

impl DeepReviewPolicyViolation {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    pub fn to_tool_error_message(&self) -> String {
        json!({
            "code": self.code,
            "message": self.message,
        })
        .to_string()
    }
}

impl Default for DeepReviewExecutionPolicy {
    fn default() -> Self {
        Self {
            extra_subagent_ids: Vec::new(),
            reviewer_timeout_seconds: DEFAULT_REVIEWER_TIMEOUT_SECONDS,
            judge_timeout_seconds: DEFAULT_JUDGE_TIMEOUT_SECONDS,
            auto_fix_enabled: DEFAULT_AUTO_FIX_ENABLED,
            auto_fix_max_rounds: DEFAULT_AUTO_FIX_MAX_ROUNDS,
            auto_fix_max_stalled_rounds: DEFAULT_AUTO_FIX_MAX_STALLED_ROUNDS,
        }
    }
}

impl DeepReviewExecutionPolicy {
    pub fn from_config_value(raw: Option<&Value>) -> Self {
        let Some(config) = raw.and_then(Value::as_object) else {
            return Self::default();
        };

        Self {
            extra_subagent_ids: normalize_extra_subagent_ids(config.get("extra_subagent_ids")),
            reviewer_timeout_seconds: clamp_u64(
                config.get("reviewer_timeout_seconds"),
                0,
                MAX_TIMEOUT_SECONDS,
                DEFAULT_REVIEWER_TIMEOUT_SECONDS,
            ),
            judge_timeout_seconds: clamp_u64(
                config.get("judge_timeout_seconds"),
                0,
                MAX_TIMEOUT_SECONDS,
                DEFAULT_JUDGE_TIMEOUT_SECONDS,
            ),
            auto_fix_enabled: config
                .get("auto_fix_enabled")
                .and_then(Value::as_bool)
                .unwrap_or(DEFAULT_AUTO_FIX_ENABLED),
            auto_fix_max_rounds: clamp_usize(
                config.get("auto_fix_max_rounds"),
                MIN_AUTO_FIX_ROUNDS,
                MAX_AUTO_FIX_ROUNDS,
                DEFAULT_AUTO_FIX_MAX_ROUNDS,
            ),
            auto_fix_max_stalled_rounds: clamp_usize(
                config.get("auto_fix_max_stalled_rounds"),
                MIN_AUTO_FIX_ROUNDS,
                MAX_AUTO_FIX_ROUNDS,
                DEFAULT_AUTO_FIX_MAX_STALLED_ROUNDS,
            ),
        }
    }

    pub fn classify_subagent(
        &self,
        subagent_type: &str,
    ) -> Result<DeepReviewSubagentRole, DeepReviewPolicyViolation> {
        if CORE_REVIEWER_AGENT_TYPES.contains(&subagent_type)
            || self
                .extra_subagent_ids
                .iter()
                .any(|configured| configured == subagent_type)
        {
            return Ok(DeepReviewSubagentRole::Reviewer);
        }

        match subagent_type {
            REVIEW_JUDGE_AGENT_TYPE => Ok(DeepReviewSubagentRole::Judge),
            REVIEW_FIXER_AGENT_TYPE if self.auto_fix_enabled => Ok(DeepReviewSubagentRole::Fixer),
            REVIEW_FIXER_AGENT_TYPE => Err(DeepReviewPolicyViolation::new(
                "deep_review_auto_fix_disabled",
                "ReviewFixer is disabled by the active DeepReview execution policy",
            )),
            DEEP_REVIEW_AGENT_TYPE => Err(DeepReviewPolicyViolation::new(
                "deep_review_nested_task_disallowed",
                "DeepReview cannot launch another DeepReview task",
            )),
            _ => Err(DeepReviewPolicyViolation::new(
                "deep_review_subagent_not_allowed",
                format!(
                    "DeepReview may only launch configured review-team agents, ReviewJudge, or ReviewFixer; '{}' is not allowed",
                    subagent_type
                ),
            )),
        }
    }

    pub fn effective_timeout_seconds(
        &self,
        role: DeepReviewSubagentRole,
        requested_timeout_seconds: Option<u64>,
    ) -> Option<u64> {
        let cap = match role {
            DeepReviewSubagentRole::Reviewer => self.reviewer_timeout_seconds,
            DeepReviewSubagentRole::Judge => self.judge_timeout_seconds,
            DeepReviewSubagentRole::Fixer => return requested_timeout_seconds,
        };

        if cap == 0 {
            return requested_timeout_seconds;
        }

        Some(
            requested_timeout_seconds
                .map(|requested| requested.min(cap))
                .unwrap_or(cap),
        )
    }
}

#[derive(Debug)]
struct DeepReviewTurnBudget {
    fixer_calls: usize,
    judge_calls: usize,
    updated_at: Instant,
}

impl DeepReviewTurnBudget {
    fn new(now: Instant) -> Self {
        Self {
            fixer_calls: 0,
            judge_calls: 0,
            updated_at: now,
        }
    }
}

#[derive(Default)]
pub struct DeepReviewBudgetTracker {
    turns: DashMap<String, DeepReviewTurnBudget>,
}

impl DeepReviewBudgetTracker {
    pub fn record_task(
        &self,
        parent_dialog_turn_id: &str,
        policy: &DeepReviewExecutionPolicy,
        role: DeepReviewSubagentRole,
    ) -> Result<(), DeepReviewPolicyViolation> {
        let now = Instant::now();
        self.prune_stale(now);

        let mut budget = self
            .turns
            .entry(parent_dialog_turn_id.to_string())
            .or_insert_with(|| DeepReviewTurnBudget::new(now));

        match role {
            DeepReviewSubagentRole::Reviewer => {}
            DeepReviewSubagentRole::Fixer => {
                if !policy.auto_fix_enabled {
                    return Err(DeepReviewPolicyViolation::new(
                        "deep_review_auto_fix_disabled",
                        "ReviewFixer is disabled by the active DeepReview execution policy",
                    ));
                }

                if budget.fixer_calls >= policy.auto_fix_max_rounds {
                    return Err(DeepReviewPolicyViolation::new(
                        "deep_review_auto_fix_round_budget_exhausted",
                        format!(
                            "ReviewFixer launch budget exhausted for this DeepReview turn (max rounds: {})",
                            policy.auto_fix_max_rounds
                        ),
                    ));
                }

                budget.fixer_calls += 1;
            }
            DeepReviewSubagentRole::Judge => {
                let max_judge_calls =
                    1 + usize::from(policy.auto_fix_enabled) * policy.auto_fix_max_rounds;
                if budget.judge_calls >= max_judge_calls {
                    return Err(DeepReviewPolicyViolation::new(
                        "deep_review_judge_budget_exhausted",
                        format!(
                            "ReviewJudge launch budget exhausted for this DeepReview turn (max calls: {})",
                            max_judge_calls
                        ),
                    ));
                }

                budget.judge_calls += 1;
            }
        }

        budget.updated_at = now;
        Ok(())
    }

    fn prune_stale(&self, now: Instant) {
        self.turns
            .retain(|_, budget| now.saturating_duration_since(budget.updated_at) <= BUDGET_TTL);
    }
}

static GLOBAL_DEEP_REVIEW_BUDGET_TRACKER: LazyLock<DeepReviewBudgetTracker> =
    LazyLock::new(DeepReviewBudgetTracker::default);

pub async fn load_default_deep_review_policy() -> BitFunResult<DeepReviewExecutionPolicy> {
    let config_service = GlobalConfigManager::get_service().await.map_err(|error| {
        BitFunError::config(format!(
            "Failed to load DeepReview execution policy because config service is unavailable: {}",
            error
        ))
    })?;

    let raw_config = match config_service
        .get_config::<Value>(Some(DEFAULT_REVIEW_TEAM_CONFIG_PATH))
        .await
    {
        Ok(config) => Some(config),
        Err(error) if is_missing_default_review_team_config_error(&error) => {
            warn!(
                "DeepReview policy config missing at {}, using defaults",
                DEFAULT_REVIEW_TEAM_CONFIG_PATH
            );
            None
        }
        Err(error) => {
            return Err(BitFunError::config(format!(
                "Failed to load DeepReview execution policy from {}: {}",
                DEFAULT_REVIEW_TEAM_CONFIG_PATH, error
            )));
        }
    };

    Ok(DeepReviewExecutionPolicy::from_config_value(
        raw_config.as_ref(),
    ))
}

pub fn is_missing_default_review_team_config_error(error: &BitFunError) -> bool {
    error.to_string().contains(&format!(
        "Config path '{}' not found",
        DEFAULT_REVIEW_TEAM_CONFIG_PATH
    ))
}

pub fn record_deep_review_task_budget(
    parent_dialog_turn_id: &str,
    policy: &DeepReviewExecutionPolicy,
    role: DeepReviewSubagentRole,
) -> Result<(), DeepReviewPolicyViolation> {
    GLOBAL_DEEP_REVIEW_BUDGET_TRACKER.record_task(parent_dialog_turn_id, policy, role)
}

fn normalize_extra_subagent_ids(raw: Option<&Value>) -> Vec<String> {
    let Some(values) = raw.and_then(Value::as_array) else {
        return Vec::new();
    };

    let disallowed = disallowed_extra_subagent_ids();
    let mut seen = HashSet::new();
    let mut normalized = Vec::new();

    for value in values {
        let id = value_to_id(value);
        if id.is_empty() || disallowed.contains(id.as_str()) || !seen.insert(id.clone()) {
            continue;
        }
        normalized.push(id);
    }

    normalized
}

fn disallowed_extra_subagent_ids() -> HashSet<&'static str> {
    CORE_REVIEWER_AGENT_TYPES
        .into_iter()
        .chain([
            REVIEW_JUDGE_AGENT_TYPE,
            DEEP_REVIEW_AGENT_TYPE,
            REVIEW_FIXER_AGENT_TYPE,
        ])
        .collect()
}

fn value_to_id(value: &Value) -> String {
    match value {
        Value::String(value) => value.trim().to_string(),
        _ => value.to_string().trim().to_string(),
    }
}

fn clamp_u64(raw: Option<&Value>, min: u64, max: u64, fallback: u64) -> u64 {
    let Some(value) = raw.and_then(number_as_i64) else {
        return fallback;
    };

    value.clamp(min as i64, max as i64) as u64
}

fn clamp_usize(raw: Option<&Value>, min: usize, max: usize, fallback: usize) -> usize {
    let Some(value) = raw.and_then(number_as_i64) else {
        return fallback;
    };

    value.clamp(min as i64, max as i64) as usize
}

fn number_as_i64(value: &Value) -> Option<i64> {
    value.as_i64().or_else(|| {
        value
            .as_u64()
            .map(|value| i64::try_from(value).unwrap_or(i64::MAX))
    })
}

#[cfg(test)]
mod tests {
    use super::is_missing_default_review_team_config_error;
    use crate::util::errors::BitFunError;

    #[test]
    fn only_missing_default_review_team_path_can_fallback_to_defaults() {
        assert!(is_missing_default_review_team_config_error(
            &BitFunError::config("Config path 'ai.review_teams.default' not found")
        ));
        assert!(!is_missing_default_review_team_config_error(
            &BitFunError::config("Config service unavailable")
        ));
        assert!(!is_missing_default_review_team_config_error(
            &BitFunError::config("Config path 'ai.review_teams.default.extra' not found")
        ));
    }
}
