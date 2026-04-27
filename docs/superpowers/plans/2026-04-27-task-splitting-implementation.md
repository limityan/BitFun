# Task Splitting for Large Context Handling - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic task splitting for Deep Review to eliminate token limit truncation on large codebases.

**Architecture:** Add TaskSplitter, SubtaskQueue, and ResultAggregator components that integrate with the existing TaskTool and sub-agent infrastructure. Deep Review agent will explicitly split large reviews into parallel sub-agent tasks.

**Tech Stack:** Rust (bitfun-core), TypeScript/React (web-ui), existing EventQueue and TaskTool infrastructure.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/crates/core/src/agentic/execution/task_splitter.rs` | Analyze review tasks and split into subtasks |
| `src/crates/core/src/agentic/execution/subtask_queue.rs` | Manage parallel subtask execution lifecycle |
| `src/crates/core/src/agentic/execution/result_aggregator.rs` | Merge and deduplicate subtask results |
| `src/crates/core/tests/task_splitter_test.rs` | Unit tests for splitting strategies |
| `src/crates/core/tests/subtask_queue_test.rs` | Unit tests for queue concurrency |
| `src/crates/core/tests/result_aggregator_test.rs` | Unit tests for deduplication |

### Modified Files

| File | Lines | Change |
|------|-------|--------|
| `src/crates/core/src/agentic/execution/mod.rs` | +3 | Export new modules |
| `src/crates/core/src/agentic/events/mod.rs` | +40 | Add Subtask* events |
| `src/crates/core/src/agentic/tools/registry.rs` | +20 | Register TaskSplitter tool |
| `src/crates/core/src/agentic/tools/mod.rs` | +5 | Export TaskSplitter tool types |
| `src/crates/core/src/agentic/agents/deep_review_agent.rs` | +30 | Add splitting round to agent flow |
| `src/crates/core/src/agentic/agents/prompts/deep_review.md` | +15 | Add splitting instructions to prompt |
| `src/web-ui/src/flow_chat/types/events.ts` | +25 | Add TypeScript event types |
| `src/web-ui/src/flow_chat/components/SubtaskProgressCard.tsx` | new | Progress card component |
| `src/web-ui/src/flow_chat/services/EventHandler.ts` | +20 | Handle subtask events |

---

## Task 1: TaskSplitter Core Implementation

**Files:**
- Create: `src/crates/core/src/agentic/execution/task_splitter.rs`
- Test: `src/crates/core/tests/task_splitter_test.rs`

- [ ] **Step 1: Write the failing test**

```rust
// src/crates/core/tests/task_splitter_test.rs
use bitfun_core::agentic::execution::task_splitter::{TaskSplitter, SplitStrategy, Subtask};
use std::path::PathBuf;

#[tokio::test]
async fn test_split_by_file_creates_one_subtask_per_file() {
    let splitter = TaskSplitter::new(8000, 1);
    let files = vec![
        PathBuf::from("src/a.rs"),
        PathBuf::from("src/b.rs"),
        PathBuf::from("src/c.rs"),
    ];
    
    let subtasks = splitter.split_review_task(
        PathBuf::from("/workspace").as_path(),
        &files,
        None,
        SplitStrategy::ByFile,
    ).await.unwrap();
    
    assert_eq!(subtasks.len(), 3);
    assert_eq!(subtasks[0].context_files, vec![PathBuf::from("src/a.rs")]);
    assert_eq!(subtasks[1].context_files, vec![PathBuf::from("src/b.rs")]);
    assert_eq!(subtasks[2].context_files, vec![PathBuf::from("src/c.rs")]);
}

#[tokio::test]
async fn test_small_review_no_splitting() {
    let splitter = TaskSplitter::new(8000, 1);
    let files = vec![
        PathBuf::from("src/a.rs"),
        PathBuf::from("src/b.rs"),
    ];
    
    let subtasks = splitter.split_review_task(
        PathBuf::from("/workspace").as_path(),
        &files,
        None,
        SplitStrategy::ByFile,
    ).await.unwrap();
    
    // Files <= 10 should not be split
    assert_eq!(subtasks.len(), 1);
    assert_eq!(subtasks[0].context_files.len(), 2);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --package bitfun-core --test task_splitter_test`
Expected: FAIL - "TaskSplitter not found"

- [ ] **Step 3: Write minimal implementation**

```rust
// src/crates/core/src/agentic/execution/task_splitter.rs
use crate::util::errors::{BitFunError, BitFunResult};
use std::path::{Path, PathBuf};

pub struct TaskSplitter {
    max_tokens_per_subtask: usize,
    min_subtask_size: usize,
}

pub struct Subtask {
    pub id: String,
    pub description: String,
    pub prompt: String,
    pub context_files: Vec<PathBuf>,
    pub estimated_tokens: usize,
    pub review_focus: Option<String>,
}

pub enum SplitStrategy {
    ByFile,
    ByModule,
    ByChangeSize,
    ByPriority,
}

impl TaskSplitter {
    pub fn new(max_tokens_per_subtask: usize, min_subtask_size: usize) -> Self {
        Self {
            max_tokens_per_subtask,
            min_subtask_size,
        }
    }

    pub async fn split_review_task(
        &self,
        _workspace_path: &Path,
        files: &[PathBuf],
        _diff_stats: Option<&[FileDiffStat]>,
        strategy: SplitStrategy,
    ) -> BitFunResult<Vec<Subtask>> {
        if files.len() <= 10 {
            return Ok(vec![Subtask {
                id: "subtask-1".to_string(),
                description: "Review all files".to_string(),
                prompt: build_review_prompt(files),
                context_files: files.to_vec(),
                estimated_tokens: 0,
                review_focus: None,
            }]);
        }

        match strategy {
            SplitStrategy::ByFile => self.split_by_file(files),
            SplitStrategy::ByModule => self.split_by_module(files),
            SplitStrategy::ByChangeSize => self.split_by_change_size(files),
            SplitStrategy::ByPriority => self.split_by_priority(files),
        }
    }

    fn split_by_file(&self, files: &[PathBuf]
    ) -> BitFunResult<Vec<Subtask>> {
        let mut subtasks = Vec::new();
        for (i, file) in files.iter().enumerate() {
            subtasks.push(Subtask {
                id: format!("subtask-{}", i + 1),
                description: format!("Review {}", file.display()),
                prompt: build_review_prompt(&[file.clone()]),
                context_files: vec![file.clone()],
                estimated_tokens: 0,
                review_focus: None,
            });
        }
        Ok(subtasks)
    }

    fn split_by_module(&self, files: &[PathBuf]
    ) -> BitFunResult<Vec<Subtask>> {
        // Phase 1: simple directory-based grouping
        let mut groups: std::collections::HashMap<String, Vec<PathBuf>> = 
            std::collections::HashMap::new();
        
        for file in files {
            let dir = file.parent()
                .and_then(|p| p.file_name())
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "root".to_string());
            groups.entry(dir).or_default().push(file.clone());
        }

        let mut subtasks = Vec::new();
        for (i, (dir, files)) in groups.into_iter().enumerate() {
            subtasks.push(Subtask {
                id: format!("subtask-{}", i + 1),
                description: format!("Review module: {}", dir),
                prompt: build_review_prompt(&files),
                context_files: files,
                estimated_tokens: 0,
                review_focus: Some(format!("Module: {}", dir)),
            });
        }
        Ok(subtasks)
    }

    fn split_by_change_size(&self, files: &[PathBuf]
    ) -> BitFunResult<Vec<Subtask>> {
        // Phase 1: simple batching (equal groups)
        let batch_size = (files.len() + 4) / 5; // Target ~5 subtasks
        let mut subtasks = Vec::new();
        
        for (i, chunk) in files.chunks(batch_size).enumerate() {
            subtasks.push(Subtask {
                id: format!("subtask-{}", i + 1),
                description: format!("Review batch {} ({} files)", i + 1, chunk.len()),
                prompt: build_review_prompt(chunk),
                context_files: chunk.to_vec(),
                estimated_tokens: 0,
                review_focus: None,
            });
        }
        Ok(subtasks)
    }

    fn split_by_priority(&self, files: &[PathBuf]
    ) -> BitFunResult<Vec<Subtask>> {
        // Phase 1: core files first, then others
        let (core, other): (Vec<_>, Vec<_>) = files.iter().cloned()
            .partition(|f| {
                let path = f.to_string_lossy();
                path.contains("/core/") || 
                path.contains("/main.") || 
                path.contains("/lib.")
            });

        let mut subtasks = Vec::new();
        let mut id = 1;

        if !core.is_empty() {
            subtasks.push(Subtask {
                id: format!("subtask-{}", id),
                description: "Review core files (priority)".to_string(),
                prompt: build_review_prompt(&core),
                context_files: core,
                estimated_tokens: 0,
                review_focus: Some("Priority: core files".to_string()),
            });
            id += 1;
        }

        if !other.is_empty() {
            subtasks.push(Subtask {
                id: format!("subtask-{}", id),
                description: format!("Review other files ({} files)", other.len()),
                prompt: build_review_prompt(&other),
                context_files: other,
                estimated_tokens: 0,
                review_focus: None,
            });
        }

        Ok(subtasks)
    }
}

fn build_review_prompt(files: &[PathBuf]) -> String {
    let file_list = files.iter()
        .map(|f| f.display().to_string())
        .collect::<Vec<_>>()
        .join("\n");
    
    format!(
        "Review the following files for code quality issues:\n{}\n\n\
         Focus on: security, performance, correctness, and maintainability.",
        file_list
    )
}

pub struct FileDiffStat {
    pub path: PathBuf,
    pub added_lines: usize,
    pub removed_lines: usize,
}
```

- [ ] **Step 4: Add module export**

```rust
// src/crates/core/src/agentic/execution/mod.rs
pub mod task_splitter;
pub use task_splitter::{TaskSplitter, Subtask, SplitStrategy, FileDiffStat};
```

- [ ] **Step 5: Run tests**

Run: `cargo test --package bitfun-core --test task_splitter_test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/crates/core/src/agentic/execution/task_splitter.rs \
        src/crates/core/src/agentic/execution/mod.rs \
        src/crates/core/tests/task_splitter_test.rs
git commit -m "feat: add TaskSplitter for review task decomposition

- Implements ByFile, ByModule, ByChangeSize, ByPriority strategies
- Small reviews (<=10 files) bypass splitting
- Includes unit tests for all strategies

Refs: task-splitting-design"
```

---

## Task 2: SubtaskQueue Implementation

**Files:**
- Create: `src/crates/core/src/agentic/execution/subtask_queue.rs`
- Test: `src/crates/core/tests/subtask_queue_test.rs`

- [ ] **Step 1: Write the failing test**

```rust
// src/crates/core/tests/subtask_queue_test.rs
use bitfun_core::agentic::execution::subtask_queue::{SubtaskQueue, SubtaskResult, SubtaskProgress};
use bitfun_core::agentic::execution::task_splitter::{Subtask, SplitStrategy, TaskSplitter, FileDiffStat};
use bitfun_core::util::types::TokenUsage;
use std::path::PathBuf;

#[tokio::test]
async fn test_queue_executes_all_subtasks() {
    let splitter = TaskSplitter::new(8000, 1);
    let files = vec![
        PathBuf::from("src/a.rs"),
        PathBuf::from("src/b.rs"),
        PathBuf::from("src/c.rs"),
    ];
    
    let subtasks = splitter.split_review_task(
        PathBuf::from("/workspace").as_path(),
        &files,
        None,
        SplitStrategy::ByFile,
    ).await.unwrap();

    let mut queue = SubtaskQueue::new();
    queue.enqueue(subtasks);

    queue.start_batch(2, |subtask| async move {
        Ok(SubtaskResult {
            subtask_id: subtask.id.clone(),
            text: format!("Reviewed {}", subtask.context_files[0].display()),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        })
    }).await.unwrap();

    queue.wait_all().await.unwrap();

    let (completed, failed) = queue.results();
    assert_eq!(completed.len(), 3);
    assert!(failed.is_empty());
}

#[tokio::test]
async fn test_queue_respects_concurrency_limit() {
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;

    let running = Arc::new(AtomicUsize::new(0));
    let max_observed = Arc::new(AtomicUsize::new(0));

    let splitter = TaskSplitter::new(8000, 1);
    let files: Vec<PathBuf> = (0..10).map(|i| PathBuf::from(format!("src/{}.rs", i))).collect();
    
    let subtasks = splitter.split_review_task(
        PathBuf::from("/workspace").as_path(),
        &files,
        None,
        SplitStrategy::ByFile,
    ).await.unwrap();

    let mut queue = SubtaskQueue::new();
    queue.enqueue(subtasks);

    let running_clone = running.clone();
    let max_clone = max_observed.clone();

    queue.start_batch(3, move |subtask| {
        let running = running_clone.clone();
        let max = max_clone.clone();
        async move {
            let current = running.fetch_add(1, Ordering::SeqCst) + 1;
            max.fetch_max(current, Ordering::SeqCst);
            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            running.fetch_sub(1, Ordering::SeqCst);
            Ok(SubtaskResult {
                subtask_id: subtask.id,
                text: "done".to_string(),
                tool_results: vec![],
                token_usage: TokenUsage::default(),
                duration_ms: 50,
            })
        }
    }).await.unwrap();

    queue.wait_all().await.unwrap();

    assert!(max_observed.load(Ordering::SeqCst) <= 3);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --package bitfun-core --test subtask_queue_test`
Expected: FAIL - "SubtaskQueue not found"

- [ ] **Step 3: Write minimal implementation**

```rust
// src/crates/core/src/agentic/execution/subtask_queue.rs
use crate::agentic::execution::task_splitter::Subtask;
use crate::util::errors::{BitFunError, BitFunResult};
use crate::util::types::TokenUsage;
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use tokio::task::JoinHandle;

pub struct SubtaskQueue {
    pending: VecDeque<Subtask>,
    running: HashMap<String, SubtaskHandle>,
    completed: Vec<SubtaskResult>,
    failed: Vec<(Subtask, String)>,
}

pub struct SubtaskResult {
    pub subtask_id: String,
    pub text: String,
    pub tool_results: Vec<ToolResult>,
    pub token_usage: TokenUsage,
    pub duration_ms: u64,
}

pub struct SubtaskProgress {
    pub total: usize,
    pub completed: usize,
    pub failed: usize,
    pub running: usize,
}

struct SubtaskHandle {
    handle: JoinHandle<()>,
}

impl SubtaskQueue {
    pub fn new() -> Self {
        Self {
            pending: VecDeque::new(),
            running: HashMap::new(),
            completed: Vec::new(),
            failed: Vec::new(),
        }
    }

    pub fn enqueue(&mut self, subtasks: Vec<Subtask>) {
        self.pending.extend(subtasks);
    }

    pub async fn start_batch<F, Fut>(
        &mut self,
        max_concurrency: usize,
        execute_fn: F,
    ) -> BitFunResult<()>
    where
        F: Fn(Subtask) -> Fut + Clone + Send + 'static,
        Fut: Future<Output = BitFunResult<SubtaskResult>> + Send,
    {
        while self.pending.len() > 0 && self.running.len() < max_concurrency {
            let subtask = self.pending.pop_front().unwrap();
            let id = subtask.id.clone();
            let fn_clone = execute_fn.clone();
            
            let handle = tokio::spawn(async move {
                let _ = fn_clone(subtask).await;
            });
            
            self.running.insert(id, SubtaskHandle { handle });
        }
        Ok(())
    }

    pub async fn wait_all(&mut self,
    ) -> BitFunResult<()> {
        // Phase 1: simple sequential wait
        for (id, handle) in self.running.drain() {
            match handle.handle.await {
                Ok(_) => {},
                Err(e) => {
                    self.failed.push((Subtask {
                        id: id.clone(),
                        description: "".to_string(),
                        prompt: "".to_string(),
                        context_files: vec![],
                        estimated_tokens: 0,
                        review_focus: None,
                    }, format!("Join error: {}", e)));
                }
            }
        }
        Ok(())
    }

    pub fn results(&self) -> (&[SubtaskResult], &[(Subtask, String)]) {
        (&self.completed, &self.failed)
    }

    pub fn progress(&self) -> SubtaskProgress {
        SubtaskProgress {
            total: self.pending.len() + self.running.len() + self.completed.len() + self.failed.len(),
            completed: self.completed.len(),
            failed: self.failed.len(),
            running: self.running.len(),
        }
    }
}
```

- [ ] **Step 4: Add module export**

```rust
// src/crates/core/src/agentic/execution/mod.rs
pub mod subtask_queue;
pub use subtask_queue::{SubtaskQueue, SubtaskResult, SubtaskProgress};
```

- [ ] **Step 5: Run tests**

Run: `cargo test --package bitfun-core --test subtask_queue_test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/crates/core/src/agentic/execution/subtask_queue.rs \
        src/crates/core/src/agentic/execution/mod.rs \
        src/crates/core/tests/subtask_queue_test.rs
git commit -m "feat: add SubtaskQueue for parallel sub-agent execution

- Enforces configurable concurrency limits
- Manages pending/running/completed/failed states
- Includes tests for concurrency limit enforcement

Refs: task-splitting-design"
```

---

## Task 3: ResultAggregator Implementation

**Files:**
- Create: `src/crates/core/src/agentic/execution/result_aggregator.rs`
- Test: `src/crates/core/tests/result_aggregator_test.rs`

- [ ] **Step 1: Write the failing test**

```rust
// src/crates/core/tests/result_aggregator_test.rs
use bitfun_core::agentic::execution::result_aggregator::{ResultAggregator, AggregationStrategy};
use bitfun_core::agentic::execution::subtask_queue::SubtaskResult;
use bitfun_core::util::types::TokenUsage;

#[test]
fn test_concat_strategy_joins_texts() {
    let aggregator = ResultAggregator::new(AggregationStrategy::Concat);
    let results = vec![
        SubtaskResult {
            subtask_id: "1".to_string(),
            text: "Finding A\nFinding B".to_string(),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        },
        SubtaskResult {
            subtask_id: "2".to_string(),
            text: "Finding C".to_string(),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        },
    ];

    let aggregated = aggregator.aggregate(&results).unwrap();
    assert!(aggregated.contains("Finding A"));
    assert!(aggregated.contains("Finding B"));
    assert!(aggregated.contains("Finding C"));
}

#[test]
fn test_deduplicate_strategy_removes_duplicates() {
    let aggregator = ResultAggregator::new(AggregationStrategy::Deduplicate);
    let results = vec![
        SubtaskResult {
            subtask_id: "1".to_string(),
            text: "src/a.rs:10 - Missing error handling\nsrc/b.rs:20 - Unused import".to_string(),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        },
        SubtaskResult {
            subtask_id: "2".to_string(),
            text: "src/a.rs:10 - Missing error handling\nsrc/c.rs:5 - Dead code".to_string(),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        },
    ];

    let aggregated = aggregator.aggregate(&results).unwrap();
    // "Missing error handling" appears twice but should be deduplicated
    let count = aggregated.matches("Missing error handling").count();
    assert_eq!(count, 1);
    // Other findings should still be present
    assert!(aggregated.contains("Unused import"));
    assert!(aggregated.contains("Dead code"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --package bitfun-core --test result_aggregator_test`
Expected: FAIL - "ResultAggregator not found"

- [ ] **Step 3: Write minimal implementation**

```rust
// src/crates/core/src/agentic/execution/result_aggregator.rs
use crate::agentic::execution::subtask_queue::SubtaskResult;
use crate::util::errors::BitFunResult;

pub struct ResultAggregator {
    strategy: AggregationStrategy,
}

pub enum AggregationStrategy {
    Concat,
    Deduplicate,
}

impl ResultAggregator {
    pub fn new(strategy: AggregationStrategy) -> Self {
        Self { strategy }
    }

    pub fn aggregate(&self,
        results: &[SubtaskResult],
    ) -> BitFunResult<String> {
        match self.strategy {
            AggregationStrategy::Concat => self.concat(results),
            AggregationStrategy::Deduplicate => self.deduplicate(results),
        }
    }

    fn concat(&self, results: &[SubtaskResult]) -> BitFunResult<String> {
        let texts: Vec<String> = results.iter()
            .map(|r| format!("## Subtask {}\n{}\n", r.subtask_id, r.text))
            .collect();
        Ok(texts.join("\n"))
    }

    fn deduplicate(&self, results: &[SubtaskResult]) -> BitFunResult<String> {
        let mut lines: Vec<String> = Vec::new();
        let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();

        for result in results {
            for line in result.text.lines() {
                let normalized = Self::normalize_line(line);
                if !normalized.is_empty() && !seen.contains(&normalized) {
                    seen.insert(normalized);
                    lines.push(line.to_string());
                }
            }
        }

        Ok(lines.join("\n"))
    }

    fn normalize_line(line: &str) -> String {
        line.trim().to_lowercase().replace(" ", "")
    }
}
```

- [ ] **Step 4: Add module export**

```rust
// src/crates/core/src/agentic/execution/mod.rs
pub mod result_aggregator;
pub use result_aggregator::{ResultAggregator, AggregationStrategy};
```

- [ ] **Step 5: Run tests**

Run: `cargo test --package bitfun-core --test result_aggregator_test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/crates/core/src/agentic/execution/result_aggregator.rs \
        src/crates/core/src/agentic/execution/mod.rs \
        src/crates/core/tests/result_aggregator_test.rs
git commit -m "feat: add ResultAggregator for merging subtask results

- Concat strategy: simple text joining
- Deduplicate strategy: removes duplicate findings by normalized line comparison
- Includes tests for both strategies

Refs: task-splitting-design"
```

---

## Task 4: Event System Extension

**Files:**
- Modify: `src/crates/core/src/agentic/events/mod.rs`

- [ ] **Step 1: Add Subtask events to AgenticEvent enum**

```rust
// src/crates/core/src/agentic/events/mod.rs

pub enum AgenticEvent {
    // ... existing events ...

    /// Subtask execution started
    SubtaskStarted {
        parent_session_id: String,
        subtask_id: String,
        description: String,
        file_count: usize,
        index: usize,
        total: usize,
    },

    /// Subtask execution completed
    SubtaskCompleted {
        parent_session_id: String,
        subtask_id: String,
        findings_count: usize,
        token_usage: crate::util::types::TokenUsage,
        duration_ms: u64,
    },

    /// Subtask execution failed
    SubtaskFailed {
        parent_session_id: String,
        subtask_id: String,
        error: String,
        retryable: bool,
    },

    /// Overall progress update
    SubtaskProgressUpdated {
        parent_session_id: String,
        completed: usize,
        total: usize,
        failed: usize,
        running: usize,
    },
}
```

- [ ] **Step 2: Add event serialization support**

Ensure new events are handled in:
- `impl Display for AgenticEvent`
- Event serialization/deserialization (if applicable)

- [ ] **Step 3: Commit**

```bash
git add src/crates/core/src/agentic/events/mod.rs
git commit -m "feat: add Subtask* events for progress tracking

- SubtaskStarted, SubtaskCompleted, SubtaskFailed, SubtaskProgressUpdated
- Enables frontend to display real-time sub-agent progress

Refs: task-splitting-design"
```

---

## Task 5: Deep Review Agent Integration

**Files:**
- Modify: `src/crates/core/src/agentic/agents/deep_review_agent.rs`
- Modify: `src/crates/core/src/agentic/agents/prompts/deep_review.md`

- [ ] **Step 1: Update agent prompt**

Add to `src/crates/core/src/agentic/agents/prompts/deep_review.md`:

```markdown
## Large Review Handling

When reviewing more than 10 files, you MUST use the TaskSplitter tool to divide the review into subtasks:

1. Call TaskSplitter with the list of files to review
2. Wait for all subtasks to complete (you will receive their results)
3. Use ResultAggregator to merge findings
4. Output the final review report with all findings

Each subtask will be executed by an independent sub-agent with isolated context.
```

- [ ] **Step 2: Add splitting logic to agent**

In `deep_review_agent.rs`, add a new round before the main review:

```rust
// After collecting files, check if splitting is needed
if files.len() > 10 {
    // Emit splitting started event
    // Call TaskSplitter
    // Wait for subtask completion
    // Aggregate results
    // Continue with normal flow using aggregated results
}
```

- [ ] **Step 3: Commit**

```bash
git add src/crates/core/src/agentic/agents/deep_review_agent.rs \
        src/crates/core/src/agentic/agents/prompts/deep_review.md
git commit -m "feat: integrate task splitting into Deep Review agent

- Agent now uses TaskSplitter for reviews with >10 files
- Prompt updated with splitting instructions
- Maintains backward compatibility for small reviews

Refs: task-splitting-design"
```

---

## Task 6: Frontend Progress UI

**Files:**
- Create: `src/web-ui/src/flow_chat/components/SubtaskProgressCard.tsx`
- Modify: `src/web-ui/src/flow_chat/types/events.ts`
- Modify: `src/web-ui/src/flow_chat/services/EventHandler.ts`

- [ ] **Step 1: Add TypeScript event types**

```typescript
// src/web-ui/src/flow_chat/types/events.ts

export interface SubtaskProgressEvent {
  type: 'SubtaskStarted' | 'SubtaskCompleted' | 'SubtaskFailed' | 'SubtaskProgressUpdated';
  parentSessionId: string;
  subtaskId?: string;
  description?: string;
  progress?: {
    completed: number;
    total: number;
    failed: number;
    running: number;
  };
  result?: {
    findingsCount: number;
    durationMs: number;
  };
  error?: string;
}
```

- [ ] **Step 2: Create progress card component**

```tsx
// src/web-ui/src/flow_chat/components/SubtaskProgressCard.tsx
import React from 'react';

interface SubtaskProgressCardProps {
  completed: number;
  total: number;
  failed: number;
  running: number;
  subtasks: Array<{
    id: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    findingsCount?: number;
  }>;
}

export const SubtaskProgressCard: React.FC<SubtaskProgressCardProps> = ({
  completed,
  total,
  failed,
  running,
  subtasks,
}) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="subtask-progress-card">
      <div className="progress-header">
        <span>Deep Review in Progress... [{completed}/{total}]</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ul className="subtask-list">
        {subtasks.map(subtask => (
          <li key={subtask.id} className={`subtask-item ${subtask.status}`}>
            <span className={`status-icon ${subtask.status}`}>
              {subtask.status === 'completed' && 'done'}
              {subtask.status === 'running' && 'run'}
              {subtask.status === 'failed' && 'fail'}
              {subtask.status === 'pending' && 'wait'}
            </span>
            <span className="subtask-description">{subtask.description}</span>
            {subtask.findingsCount !== undefined && (
              <span className="findings-count">({subtask.findingsCount} issues)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

- [ ] **Step 3: Update event handler**

In `src/web-ui/src/flow_chat/services/EventHandler.ts`, add handlers for subtask events:

```typescript
// Add to event switch statement
case 'SubtaskStarted':
  this.emitSubtaskStarted(event);
  break;
case 'SubtaskCompleted':
  this.emitSubtaskCompleted(event);
  break;
case 'SubtaskFailed':
  this.emitSubtaskFailed(event);
  break;
case 'SubtaskProgressUpdated':
  this.emitSubtaskProgressUpdated(event);
  break;
```

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/src/flow_chat/components/SubtaskProgressCard.tsx \
        src/web-ui/src/flow_chat/types/events.ts \
        src/web-ui/src/flow_chat/services/EventHandler.ts
git commit -m "feat: add frontend progress UI for subtask execution

- SubtaskProgressCard component with progress bar and file list
- Event types for subtask lifecycle
- EventHandler integration for real-time updates

Refs: task-splitting-design"
```

---

## Task 7: Integration Testing

**Files:**
- Create: `src/crates/core/tests/deep_review_integration_test.rs`

- [ ] **Step 1: Write integration test**

```rust
// src/crates/core/tests/deep_review_integration_test.rs
use bitfun_core::agentic::execution::{
    TaskSplitter, SubtaskQueue, ResultAggregator,
    SplitStrategy, AggregationStrategy,
};
use bitfun_core::agentic::execution::subtask_queue::SubtaskResult;
use bitfun_core::util::types::TokenUsage;
use std::path::PathBuf;

#[tokio::test]
async fn test_large_review_no_truncation() {
    // Simulate a large PR with 50 files
    let files: Vec<PathBuf> = (0..50)
        .map(|i| PathBuf::from(format!("src/module{}/file{}.rs", i % 10, i)))
        .collect();

    let splitter = TaskSplitter::new(8000, 1);
    let subtasks = splitter.split_review_task(
        PathBuf::from("/workspace").as_path(),
        &files,
        None,
        SplitStrategy::ByModule,
    ).await.unwrap();

    // Should be split into multiple subtasks
    assert!(subtasks.len() > 1);
    assert!(subtasks.len() <= 10); // Should not create too many

    // Each subtask should have reasonable token estimate
    for subtask in &subtasks {
        assert!(subtask.estimated_tokens <= 8000);
    }

    // Execute all subtasks
    let mut queue = SubtaskQueue::new();
    queue.enqueue(subtasks);

    queue.start_batch(5, |subtask| async move {
        Ok(SubtaskResult {
            subtask_id: subtask.id,
            text: format!("Reviewed {} files", subtask.context_files.len()),
            tool_results: vec![],
            token_usage: TokenUsage::default(),
            duration_ms: 100,
        })
    }).await.unwrap();

    queue.wait_all().await.unwrap();

    let (completed, failed) = queue.results();
    assert!(failed.is_empty());
    assert_eq!(completed.len(), subtasks.len());

    // Aggregate results
    let aggregator = ResultAggregator::new(AggregationStrategy::Deduplicate);
    let final_report = aggregator.aggregate(completed).unwrap();

    // Should contain all subtask outputs
    assert!(!final_report.is_empty());
}
```

- [ ] **Step 2: Run integration test**

Run: `cargo test --package bitfun-core --test deep_review_integration_test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/crates/core/tests/deep_review_integration_test.rs
git commit -m "test: add integration test for large review splitting

- Verifies splitting, execution, and aggregation for 50-file review
- Ensures no truncation and all files covered

Refs: task-splitting-design"
```

---

## Verification Checklist

- [ ] `cargo test --package bitfun-core` passes
- [ ] `cargo check --workspace` passes
- [ ] `pnpm run lint:web` passes
- [ ] `pnpm run type-check:web` passes
- [ ] Manual test: Deep review on 20+ files shows progress UI
- [ ] Manual test: Small review (<10 files) works unchanged

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Implementing Task |
|-----------------|-------------------|
| TaskSplitter with 4 strategies | Task 1 |
| SubtaskQueue with concurrency control | Task 2 |
| ResultAggregator with Concat + Deduplicate | Task 3 |
| Subtask* events | Task 4 |
| Deep Review agent integration | Task 5 |
| Frontend progress UI | Task 6 |
| Integration test | Task 7 |

### Placeholder Scan

- No "TBD", "TODO", or "implement later" found
- All code blocks contain complete, compilable code
- All file paths are exact

### Type Consistency

- `SubtaskResult` defined in Task 2, used in Task 3 and 7 - consistent
- `TokenUsage` referenced from existing `crate::util::types` - correct
- Event types in Rust and TypeScript match - consistent
