# 设计文档：LLM 输出截断检测与自动任务拆分

> 日期：2026-04-27
> 状态：Draft
> 范围：深度审核（Deep Review）场景，后续可扩展到其他长上下文任务

---

## 背景与问题

### 事件

2026-04-27 的深度审核会话中，模型（glm-5.1）在执行 `TodoWrite` 工具调用时突然停止输出。日志显示：

- 输入 token：约 100,068
- 输出 token：仅 64-261
- 无 `finish_reason`
- 无 ERROR/WARN 日志
- 应用无任何用户提示

### 根因

模型输出 token 被长上下文挤占，剩余空间不足以完成工具调用参数的 JSON 输出。这不是网络错误，因此现有重试机制（仅覆盖瞬态网络错误）无法处理。

### 现有重试机制的覆盖范围

| 错误类型 | 覆盖 | 机制 |
|---------|------|------|
| 网络传输错误（connection reset, timeout） | 是 | `round_executor.rs` 指数退避重试（最多 1 次） |
| HTTP 5xx / 429 | 是 | `sse.rs` 指数退避重试（最多 3 次） |
| 认证/配额/模型错误 | 否 | 直接失败，显示错误 |
| **模型输出截断（token limit）** | **否** | **静默停止，无提示** |

---

## 竞品方案分析

### 方案矩阵

| 方案 | 代表 | 能否解决 token limit | 用户感知 | 实现成本 |
|------|------|---------------------|---------|---------|
| A. 同请求重试 | Codex CLI | 不能（同样上下文，同样截断） | 无感知但无效 | 低 |
| B. Continue 续写 | Claude Code | 不能（输出空间仍不足） | 需手动触发 | 中 |
| C. 模型自主拆分 | Claude Code / Copilot | 能（但质量不稳定） | 无感知 | 中 |
| D. 文件级并行 | CodeRabbit | 能（按文件隔离上下文） | 增量反馈 | 高 |
| E. **显式任务拆分 + Sub-agent 并行** | 本方案 | **能** | **结构化进度** | **中** |

### 决策

采用 **方案 E：显式任务拆分 + Sub-agent 并行**。

理由：
1. Continue / 重试对 token limit 无效（根因是输入上下文过长）
2. 模型自主拆分质量不可控（Claude Code 和 Copilot 均有此问题）
3. BitFun 已有 `TaskTool` + `coordinator.execute_subagent()` 基础设施，方案 E 改动最小
4. 显式策略比隐式策略更可控、可调试、可优化

---

## 设计

### 架构总览

```
用户请求: "深度审核这个 PR"
       |
       v
+------------------+     +----------------+     +------------------+     +---------------+
| Round 1: 分析    |---->| Round 2: 并行  |---->| Round 3: 聚合    |---->| 最终审核报告   |
| TaskSplitter     |     | SubtaskQueue   |     | ResultAggregator |     | (TodoWrite)   |
| 拆分为子任务     |     | 并发执行子任务  |     | 去重 + 合并      |     |               |
+------------------+     +----------------+     +------------------+     +---------------+
                              |     |     |
                              v     v     v
                         Sub-agent 1  Sub-agent 2  Sub-agent 3
                         (独立 session, 独立上下文)
```

### 与现有架构的集成

| 现有组件 | 角色 | 是否需要改动 |
|---------|------|-------------|
| `deep_review_agent.rs` | 审核入口，触发拆分 | 是（增加拆分步骤） |
| `deep_review_policy.rs` | 审核策略配置 | 是（增加拆分策略配置） |
| `task_tool.rs` | 启动子 agent | 否（复用） |
| `coordinator.execute_subagent()` | 创建独立 session | 否（复用） |
| `SubagentConcurrencyLimiter` | 并发控制（默认 5） | 否（复用） |
| `ExecutionEngine` | 执行 dialog turn | 否（复用） |
| `EventQueue` | 事件路由 | 是（新增进度事件） |
| 前端 `DeepReviewService.ts` | 审核状态管理 | 是（处理进度事件） |

---

### 组件 1：TaskSplitter（任务拆分器）

**文件**：`src/crates/core/src/agentic/execution/task_splitter.rs`

**职责**：分析审核任务，拆分为多个可独立执行的子任务

**核心接口**：

```rust
pub struct TaskSplitter {
    config: TaskSplitterConfig,
}

pub struct TaskSplitterConfig {
    /// 每个子任务的输入 token 上限（默认 80000，留出输出空间）
    pub max_input_tokens_per_subtask: usize,
    /// 拆分策略
    pub strategy: SplitStrategy,
}

pub enum SplitStrategy {
    /// 按文件拆分：每个文件一个子任务
    ByFile,
    /// 按模块拆分：分析依赖关系，相关文件分组
    ByModule { max_files_per_group: usize },
    /// 按变更量拆分：按 diff 行数均衡分组
    ByChangeSize { target_lines_per_subtask: usize },
}

pub struct Subtask {
    pub id: String,
    pub description: String,
    pub prompt: String,
    pub files: Vec<PathBuf>,
    pub focus_areas: Vec<String>,
    pub estimated_tokens: usize,
}
```

**拆分流程**：

1. 获取变更文件列表（通过 git diff 或用户指定）
2. 估算每个文件的 token 数（通过 `TokenCounter`）
3. 按 `SplitStrategy` 分组
4. 为每组生成独立的 prompt（注入统一的审核标准）
5. 返回子任务列表

**分组算法（ByFile）**：

```
输入: files = [a.rs(50K), b.rs(30K), c.rs(10K), d.rs(5K), e.rs(3K)]
max_tokens = 80K

分组:
  Group 1: [a.rs(50K)]               → 50K (单独大文件)
  Group 2: [b.rs(30K), c.rs(10K)]    → 40K (组合中等文件)
  Group 3: [d.rs(5K), e.rs(3K)]      → 8K  (组合小文件)

输出: 3 个子任务
```

**分组算法（ByChangeSize）**：

```
输入: files = [a.rs(+500), b.rs(+300), c.rs(+100), d.rs(+50)]
target_lines = 400

分组:
  Group 1: [a.rs(+500)]              → 单独（超过 target）
  Group 2: [b.rs(+300), c.rs(+100)]  → 400 行
  Group 3: [d.rs(+50)]               → 50 行

输出: 3 个子任务
```

---

### 组件 2：SubtaskQueue（子任务队列）

**文件**：`src/crates/core/src/agentic/execution/subtask_queue.rs`

**职责**：管理子任务生命周期，控制并发度，收集结果

**核心接口**：

```rust
pub struct SubtaskQueue {
    pending: Vec<Subtask>,
    completed: Vec<SubtaskResult>,
    failed: Vec<SubtaskFailure>,
    concurrency: usize,
}

pub struct SubtaskResult {
    pub subtask_id: String,
    pub findings: Vec<ReviewFinding>,
    pub token_usage: TokenUsage,
    pub duration_ms: u64,
}

pub struct SubtaskFailure {
    pub subtask_id: String,
    pub error: String,
    pub retriable: bool,
}

pub struct ReviewFinding {
    pub file: PathBuf,
    pub line: Option<usize>,
    pub severity: Severity,
    pub category: String,
    pub description: String,
    pub suggestion: Option<String>,
}
```

**并发控制**：

- 复用现有 `SubagentConcurrencyLimiter`（默认最大 5 并发）
- 子任务通过 `TaskTool` 提交，自动获得并发控制
- 每个子任务有独立的超时（默认 120 秒）和取消令牌

**错误处理**：

```
子任务失败时:
  1. 如果是可重试错误（网络/超时）→ 自动重试 1 次
  2. 如果重试仍失败 → 标记为 failed，继续其他子任务
  3. 所有子任务完成后 → 聚合时包含失败信息
  4. 如果全部失败 → 返回错误给用户
```

---

### 组件 3：ResultAggregator（结果聚合器）

**文件**：`src/crates/core/src/agentic/execution/result_aggregator.rs`

**职责**：合并子任务结果，去重，生成最终审核报告

**核心接口**：

```rust
pub struct ResultAggregator;

impl ResultAggregator {
    /// 聚合子任务结果
    pub fn aggregate(
        results: &[SubtaskResult],
        failures: &[SubtaskFailure],
    ) -> AggregationOutput;
}

pub struct AggregationOutput {
    pub findings: Vec<ReviewFinding>,
    pub stats: AggregationStats,
}

pub struct AggregationStats {
    pub total_subtasks: usize,
    pub completed: usize,
    pub failed: usize,
    pub total_findings: usize,
    pub duplicates_removed: usize,
}
```

**去重策略**：

两个 finding 被视为重复，当且仅当：
1. 同一文件
2. 同一类别（category）
3. 描述相似度 > 80%（通过编辑距离判断）

去重时保留 severity 更高的那个。

---

### 深度审核 Agent 集成

**文件**：`src/crates/core/src/agentic/agents/deep_review_agent.rs`

**改动**：在现有审核流程中增加拆分步骤

```
现有流程:
  用户请求 → 审核 Agent → 单次模型调用 → 可能截断

新流程:
  用户请求 → 审核 Agent → Round 1: 分析 + 拆分
                            → Round 2: 并行子任务执行
                            → Round 3: 聚合 + 生成最终报告
```

**触发条件**：

拆分仅当满足以下条件时触发：
1. 变更文件数量 > 阈值（默认 3 个文件）
2. 或估算总 token 数 > 子任务上限的 80%

否则走原有的单次审核流程（向后兼容）。

---

### 前端事件与 UI

#### 新增事件

```rust
// 在 AgenticEvent 中新增
pub enum AgenticEvent {
    // ... 现有事件 ...

    /// 子任务开始执行
    SubtaskStarted {
        session_id: String,
        subtask_id: String,
        description: String,
        progress: SubtaskProgress,
    },

    /// 子任务完成
    SubtaskCompleted {
        session_id: String,
        subtask_id: String,
        findings_count: usize,
        duration_ms: u64,
        progress: SubtaskProgress,
    },

    /// 子任务失败
    SubtaskFailed {
        session_id: String,
        subtask_id: String,
        error: String,
        progress: SubtaskProgress,
    },

    /// 模型输出被截断（兜底事件）
    OutputTruncated {
        session_id: String,
        reason: String,
        partial_content_saved: bool,
    },
}

pub struct SubtaskProgress {
    pub completed: usize,
    pub total: usize,
}
```

#### 前端 UI

在对话流中显示进度卡片：

```
+-------------------------------------------------------+
| 深度审核中...  [3/5 完成]                               |
|                                                       |
| + a.rs (安全性)         [完成] 发现 5 个问题           |
| + b.rs (性能)           [完成] 发现 3 个问题           |
| - c.rs (可读性)         [审核中...]                    |
|   d.rs (测试)           [等待]                        |
|   e.rs (文档)           [等待]                        |
+-------------------------------------------------------+
```

- 完成的子任务：绿色对勾 + 发现数量
- 进行中的子任务：蓝色圆点 + 动画
- 等待的子任务：灰色圆点
- 失败的子任务：红色叉号 + 错误信息

---

### 截断检测（兜底机制）

即使有了任务拆分，仍需要截断检测作为兜底。用于处理：
1. 单个文件过大（超过子任务上限）
2. 拆分策略配置不当
3. 非审核场景的长上下文任务

**检测条件**（三者同时满足才判定为截断）：

1. 流结束时 `finish_reason` 为 `None`
2. 有待处理的工具调用（`pending_tool_calls` 非空）
3. 工具调用参数 JSON 不完整（未闭合的 `{` 或 `[`）

**处理方式**：

截断被检测到时，**不显示"继续"按钮**（因为继续也无效），而是：
1. 在 `partial_recovery_reason` 中记录截断信息
2. 发送 `OutputTruncated` 事件到前端
3. 前端显示提示："模型输出被截断。建议将任务拆分为更小的部分，或切换到更大上下文窗口的模型。"

---

## 风险预判

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 拆分质量差（不合理的分组） | 中 | 高 | 提供多种拆分策略；默认使用 ByFile（最简单可靠）；允许用户通过配置覆盖 |
| 单个子任务仍超 token 限制 | 中 | 高 | 每个子任务独立估算 token；超限时自动进一步拆分（递归，最多 2 层） |
| 子任务结果不一致 | 中 | 中 | 子任务 prompt 注入统一审核标准；聚合时检测冲突并标记 |
| 并行子任务过多导致资源竞争 | 低 | 中 | 复用现有并发限制（默认 5）；子任务有独立超时（120 秒） |
| 去重误判（合并了不应合并的 finding） | 低 | 中 | 去重条件严格（同文件 + 同类别 + 高相似度）；保留原始结果供用户展开查看 |
| 与现有 DeepReview 策略冲突 | 中 | 中 | 拆分作为可选步骤；小任务走原有流程；配置开关 |
| 前端状态管理复杂化 | 低 | 中 | 复用现有事件流；进度状态由事件驱动，不引入新状态机 |
| 递归拆分导致无限循环 | 低 | 高 | 硬编码最大递归深度（2 层）；单文件超限时提示用户 |
| 模型不支持结构化输出 | 低 | 低 | TaskSplitter 由代码实现，不依赖模型输出 |

---

## 实施计划

| 阶段 | 内容 | 依赖 | 验证方式 |
|------|------|------|---------|
| **1** | `TaskSplitter` 基础实现（`SplitStrategy::ByFile`） | 无 | 单元测试：输入文件列表，输出正确分组 |
| **2** | `SubtaskQueue` + 并行执行 | 阶段 1 | 集成测试：多个子任务并发执行，结果正确收集 |
| **3** | `ResultAggregator`（去重合并） | 阶段 2 | 单元测试：重复 finding 正确去重 |
| **4** | 截断检测（`stream_processor.rs`） | 无 | 单元测试：模拟截断场景，检测条件正确触发 |
| **5** | `deep_review_agent.rs` 集成 | 阶段 1-3 | 集成测试：大 PR 审核不截断 |
| **6** | 前端进度事件 + UI | 阶段 5 | 手动测试：UI 显示进度卡片 |
| **7** | 高级拆分策略（`ByModule`, `ByChangeSize`） | 阶段 1 | 性能测试：不同策略的审核质量对比 |
| **8** | E2E 测试 + 边界情况修复 | 阶段 5-6 | E2E 测试：完整审核流程 |

---

## 文件改动清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/crates/core/src/agentic/execution/task_splitter.rs` | 任务拆分器 |
| `src/crates/core/src/agentic/execution/subtask_queue.rs` | 子任务队列 |
| `src/crates/core/src/agentic/execution/result_aggregator.rs` | 结果聚合器 |

### 修改文件

| 文件 | 改动范围 | 说明 |
|------|---------|------|
| `src/crates/core/src/agentic/agents/deep_review_agent.rs` | 中 | 增加拆分 + 并行 + 聚合流程 |
| `src/crates/core/src/agentic/deep_review_policy.rs` | 小 | 增加拆分策略配置项 |
| `src/crates/core/src/agentic/execution/stream_processor.rs` | 小 | 增加截断检测逻辑 |
| `src/crates/core/src/agentic/events.rs` | 小 | 新增 Subtask 进度事件 |
| `src/web-ui/src/flow_chat/services/DeepReviewService.ts` | 中 | 处理进度事件 |
| `src/web-ui/src/shared/ai-errors/aiErrorPresenter.ts` | 小 | 新增 `output_truncated` 分类 |

### 不改动的文件

| 文件 | 原因 |
|------|------|
| `task_tool.rs` | 复用现有子 agent 启动能力 |
| `coordinator.rs` | 复用现有 `execute_subagent` |
| `execution_engine.rs` | 子任务通过 TaskTool 间接使用 |
| `round_executor.rs` | 现有重试逻辑不变 |

---

## 向后兼容性

- 小任务（文件数 <= 3 且 token 估算未超限）走原有单次审核流程
- 拆分策略可通过配置关闭（`split_enabled: false`）
- 前端不处理新事件时不影响现有 UI（事件被忽略）

---

## 验收标准

1. 深度审核 10+ 文件的 PR 时，不再出现静默截断
2. 前端显示结构化的审核进度
3. 审核结果与单次审核质量相当（无信息丢失）
4. 小任务（<= 3 文件）的审核行为与改动前一致
