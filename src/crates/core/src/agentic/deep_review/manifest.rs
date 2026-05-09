//! Typed Deep Review launch manifest accessors.

use super::execution_policy::DeepReviewPolicyViolation;
use serde_json::Value;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct DeepReviewScopeProfile {
    review_depth: String,
    risk_focus_tags: Vec<String>,
    max_dependency_hops: Option<String>,
    optional_reviewer_policy: Option<String>,
    allow_broad_tool_exploration: bool,
    coverage_expectation: Option<String>,
}

impl DeepReviewScopeProfile {
    pub(crate) fn from_manifest(raw: &Value) -> Option<Self> {
        let manifest = raw.as_object()?;
        let review_mode = string_for_any_key(raw, &["reviewMode", "review_mode"])?;
        if review_mode != "deep" {
            return None;
        }

        let profile = manifest
            .get("scopeProfile")
            .or_else(|| manifest.get("scope_profile"))?
            .as_object()?;
        let review_depth = profile
            .get("reviewDepth")
            .or_else(|| profile.get("review_depth"))
            .and_then(normalized_non_empty_string)?;
        if !matches!(
            review_depth.as_str(),
            "high_risk_only" | "risk_expanded" | "full_depth"
        ) {
            return None;
        }

        let risk_focus_tags = profile
            .get("riskFocusTags")
            .or_else(|| profile.get("risk_focus_tags"))
            .and_then(Value::as_array)
            .map(|tags| {
                tags.iter()
                    .filter_map(|tag| tag.as_str().map(str::trim))
                    .filter(|tag| !tag.is_empty())
                    .map(str::to_string)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        Some(Self {
            review_depth,
            risk_focus_tags,
            max_dependency_hops: profile
                .get("maxDependencyHops")
                .or_else(|| profile.get("max_dependency_hops"))
                .and_then(scope_dependency_hops_to_string),
            optional_reviewer_policy: profile
                .get("optionalReviewerPolicy")
                .or_else(|| profile.get("optional_reviewer_policy"))
                .and_then(normalized_non_empty_string),
            allow_broad_tool_exploration: profile
                .get("allowBroadToolExploration")
                .or_else(|| profile.get("allow_broad_tool_exploration"))
                .and_then(Value::as_bool)
                .unwrap_or(false),
            coverage_expectation: profile
                .get("coverageExpectation")
                .or_else(|| profile.get("coverage_expectation"))
                .and_then(normalized_non_empty_string),
        })
    }

    pub(crate) fn review_depth(&self) -> &str {
        &self.review_depth
    }

    pub(crate) fn risk_focus_tags(&self) -> &[String] {
        &self.risk_focus_tags
    }

    pub(crate) fn max_dependency_hops(&self) -> Option<&str> {
        self.max_dependency_hops.as_deref()
    }

    pub(crate) fn optional_reviewer_policy(&self) -> Option<&str> {
        self.optional_reviewer_policy.as_deref()
    }

    pub(crate) fn allow_broad_tool_exploration(&self) -> bool {
        self.allow_broad_tool_exploration
    }

    pub(crate) fn coverage_expectation(&self) -> Option<&str> {
        self.coverage_expectation.as_deref()
    }

    pub(crate) fn is_reduced_depth(&self) -> bool {
        self.review_depth != "full_depth"
    }
}

fn value_for_any_key<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a Value> {
    keys.iter().find_map(|key| value.get(*key))
}

fn normalized_non_empty_string(value: &Value) -> Option<String> {
    value
        .as_str()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn string_for_any_key(value: &Value, keys: &[&str]) -> Option<String> {
    value_for_any_key(value, keys).and_then(normalized_non_empty_string)
}

fn scope_dependency_hops_to_string(value: &Value) -> Option<String> {
    if let Some(hops) = value.as_u64() {
        return Some(hops.to_string());
    }
    normalized_non_empty_string(value)
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DeepReviewRunManifestGate {
    active_subagent_ids: HashSet<String>,
    skipped_subagent_reasons: HashMap<String, String>,
}

impl DeepReviewRunManifestGate {
    pub fn from_value(raw: &Value) -> Option<Self> {
        let manifest = raw.as_object()?;
        if manifest.get("reviewMode").and_then(Value::as_str) != Some("deep") {
            return None;
        }

        let mut active_subagent_ids = HashSet::new();
        collect_manifest_members(manifest.get("workPackets"), &mut active_subagent_ids);
        collect_manifest_members(manifest.get("coreReviewers"), &mut active_subagent_ids);
        collect_manifest_members(
            manifest.get("enabledExtraReviewers"),
            &mut active_subagent_ids,
        );
        if let Some(id) = manifest
            .get("qualityGateReviewer")
            .and_then(manifest_member_subagent_id)
        {
            active_subagent_ids.insert(id);
        }

        if active_subagent_ids.is_empty() {
            return None;
        }

        let mut skipped_subagent_reasons = HashMap::new();
        if let Some(skipped) = manifest.get("skippedReviewers").and_then(Value::as_array) {
            for member in skipped {
                let Some(id) = manifest_member_subagent_id(member) else {
                    continue;
                };
                let reason = member
                    .get("reason")
                    .and_then(Value::as_str)
                    .unwrap_or("skipped")
                    .trim();
                skipped_subagent_reasons.insert(
                    id,
                    if reason.is_empty() {
                        "skipped".to_string()
                    } else {
                        reason.to_string()
                    },
                );
            }
        }

        Some(Self {
            active_subagent_ids,
            skipped_subagent_reasons,
        })
    }

    pub fn ensure_active(&self, subagent_type: &str) -> Result<(), DeepReviewPolicyViolation> {
        if self.active_subagent_ids.contains(subagent_type) {
            return Ok(());
        }

        let reason = self
            .skipped_subagent_reasons
            .get(subagent_type)
            .map(String::as_str)
            .unwrap_or("missing_from_manifest");

        Err(DeepReviewPolicyViolation::new(
            "deep_review_subagent_not_active_for_target",
            format!(
                "DeepReview subagent '{}' is not active for this review target (reason: {})",
                subagent_type, reason
            ),
        ))
    }
}

fn collect_manifest_members(raw: Option<&Value>, output: &mut HashSet<String>) {
    let Some(values) = raw.and_then(Value::as_array) else {
        return;
    };

    for member in values {
        if let Some(id) = manifest_member_subagent_id(member) {
            output.insert(id);
        }
    }
}

fn manifest_member_subagent_id(value: &Value) -> Option<String> {
    let id = value
        .get("subagentId")
        .or_else(|| value.get("subagent_id"))
        .and_then(Value::as_str)?
        .trim();
    (!id.is_empty()).then(|| id.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn scope_profile_parses_camel_case_manifest() {
        let manifest = json!({
            "reviewMode": "deep",
            "scopeProfile": {
                "reviewDepth": "high_risk_only",
                "riskFocusTags": ["security", "cross_boundary_api_contracts"],
                "maxDependencyHops": 0,
                "optionalReviewerPolicy": "risk_matched_only",
                "allowBroadToolExploration": false,
                "coverageExpectation": "High-risk-only pass."
            }
        });

        let profile = DeepReviewScopeProfile::from_manifest(&manifest)
            .expect("scope profile should parse");

        assert_eq!(profile.review_depth(), "high_risk_only");
        assert_eq!(
            profile
                .risk_focus_tags()
                .iter()
                .map(String::as_str)
                .collect::<Vec<_>>(),
            vec!["security", "cross_boundary_api_contracts"]
        );
        assert_eq!(profile.max_dependency_hops(), Some("0"));
        assert_eq!(profile.optional_reviewer_policy(), Some("risk_matched_only"));
        assert!(!profile.allow_broad_tool_exploration());
        assert_eq!(profile.coverage_expectation(), Some("High-risk-only pass."));
        assert!(profile.is_reduced_depth());
    }

    #[test]
    fn scope_profile_parses_snake_case_manifest() {
        let manifest = json!({
            "review_mode": "deep",
            "scope_profile": {
                "review_depth": "full_depth",
                "risk_focus_tags": ["security"],
                "max_dependency_hops": "policy_limited",
                "optional_reviewer_policy": "full",
                "allow_broad_tool_exploration": true,
                "coverage_expectation": "Full-depth pass."
            }
        });

        let profile = DeepReviewScopeProfile::from_manifest(&manifest)
            .expect("scope profile should parse");

        assert_eq!(profile.review_depth(), "full_depth");
        assert_eq!(profile.max_dependency_hops(), Some("policy_limited"));
        assert!(profile.allow_broad_tool_exploration());
        assert!(!profile.is_reduced_depth());
    }

    #[test]
    fn scope_profile_missing_stays_compatible_with_legacy_manifest() {
        let manifest = json!({
            "reviewMode": "deep",
            "workPackets": []
        });

        assert!(DeepReviewScopeProfile::from_manifest(&manifest).is_none());
    }
}
