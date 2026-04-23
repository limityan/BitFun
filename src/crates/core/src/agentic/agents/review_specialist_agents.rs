use super::{Agent, RequestContextPolicy};
use async_trait::async_trait;

fn default_review_tools() -> Vec<String> {
    vec![
        "Read".to_string(),
        "Grep".to_string(),
        "Glob".to_string(),
        "LS".to_string(),
        "GetFileDiff".to_string(),
        "Git".to_string(),
    ]
}

macro_rules! define_review_specialist_agent {
    ($struct_name:ident, $id:literal, $name:literal, $description:literal, $prompt:literal) => {
        pub struct $struct_name {
            default_tools: Vec<String>,
        }

        impl Default for $struct_name {
            fn default() -> Self {
                Self::new()
            }
        }

        impl $struct_name {
            pub fn new() -> Self {
                Self {
                    default_tools: default_review_tools(),
                }
            }
        }

        #[async_trait]
        impl Agent for $struct_name {
            fn as_any(&self) -> &dyn std::any::Any {
                self
            }

            fn id(&self) -> &str {
                $id
            }

            fn name(&self) -> &str {
                $name
            }

            fn description(&self) -> &str {
                $description
            }

            fn prompt_template_name(&self, _model_name: Option<&str>) -> &str {
                $prompt
            }

            fn default_tools(&self) -> Vec<String> {
                self.default_tools.clone()
            }

            fn request_context_policy(&self) -> RequestContextPolicy {
                RequestContextPolicy::instructions_only()
            }

            fn is_readonly(&self) -> bool {
                true
            }
        }
    };
}

define_review_specialist_agent!(
    BusinessLogicReviewerAgent,
    "ReviewBusinessLogic",
    "Business Logic Reviewer",
    r#"Independent read-only reviewer focused on workflow correctness, business rules, state transitions, data integrity, and edge-case handling in the review target. Use this when you need a fresh perspective on whether the change still does the right thing for real users."#,
    "review_business_logic_agent"
);

define_review_specialist_agent!(
    PerformanceReviewerAgent,
    "ReviewPerformance",
    "Performance Reviewer",
    r#"Independent read-only reviewer focused on latency, hot-path efficiency, unnecessary allocations, N+1 patterns, blocking calls, over-fetching, and scale-sensitive regressions introduced by the review target."#,
    "review_performance_agent"
);

define_review_specialist_agent!(
    SecurityReviewerAgent,
    "ReviewSecurity",
    "Security Reviewer",
    r#"Independent read-only reviewer focused on security risks such as injection, auth gaps, data exposure, unsafe command/file handling, privilege escalation, and trust-boundary mistakes in the review target."#,
    "review_security_agent"
);

define_review_specialist_agent!(
    ReviewJudgeAgent,
    "ReviewJudge",
    "Review Quality Inspector",
    r#"Independent read-only quality inspector that validates reviewer findings, removes false positives, checks whether optimization advice is directionally correct, and decides what should appear in the final deep-review report."#,
    "review_quality_gate_agent"
);

#[cfg(test)]
mod tests {
    use super::{
        Agent, BusinessLogicReviewerAgent, PerformanceReviewerAgent, ReviewJudgeAgent,
        SecurityReviewerAgent,
    };
    use crate::agentic::agents::RequestContextPolicy;

    #[test]
    fn specialist_reviewers_use_isolated_instruction_context() {
        let agents: Vec<Box<dyn Agent>> = vec![
            Box::new(BusinessLogicReviewerAgent::new()),
            Box::new(PerformanceReviewerAgent::new()),
            Box::new(SecurityReviewerAgent::new()),
            Box::new(ReviewJudgeAgent::new()),
        ];

        for agent in agents {
            assert_eq!(
                agent.request_context_policy(),
                RequestContextPolicy::instructions_only()
            );
            assert!(agent.is_readonly());
            assert!(agent.default_tools().contains(&"GetFileDiff".to_string()));
        }
    }
}
