# 《从 Vibe Coding 到 Harness Engineering》演讲逐字稿 v3.3

> v3.3 改动说明（相比 v3.2）：本稿与最新 19 页 PPT 完全对齐，按"专业 / 连贯 / 可直接念稿"原则重写。
> （1）新增 §02.0 三段（Agent 架构 · Prompt Engineering · Context Engineering），对应 PPT 新增的 04a / 04b / 04c 三张铺垫页，让 Harness 的定义建立在听众熟悉的概念之上；
> （2）§02 Harness 部分按新版 PPT 调整为"词源 → 公式 → 包含关系"三步走；
> （3）§06 完全重写为"BitFun as Harnessed Agent"产品哲学 + 4 个 Harness sub-dive：Planning / Evidence / Review / Self-iteration；
> （4）§06.4 Self-iteration 改为方法论流程（从失败 trace 到新 Harness），不再单写一个具体功能场景；
> （5）三句 take-away 扩为四句，与 PPT 末页一致；
> （6）每节顶部标注 `> PPT：第 N 页`，便于演讲者翻页；段间加入过渡词，整篇读完约 50-55 分钟。

---

## 开场

> PPT：第 1 页 · Cover

各位同学下午好，我是李文博。今天想跟大家聊的，是过去这半年所有用 Coding Agent 写代码的人，多多少少都撞上的一个问题：**模型越来越强，为什么我们的 Agent 反而越来越不稳？**

我会用一个小时回答这个问题。我们会从两个真实事件开始，然后一步步走到 Harness Engineering 这个概念，最后看 BitFun 是怎么把它变成产品的。

题目叫《从 Vibe Coding 到 Harness Engineering》。Vibe Coding 大家都用过、都喜欢；今天的重点是它的下一站。

---

# §01｜同一个季度，两件事

> PPT：第 2-4 页

## 事件 A · Claude Code 质量回归

> PPT：第 2 页

我们先看 4 月份发生的第一件事——也就是 Claude Code 那场全网炸锅的"质量回归"。

时间线很清楚：**2026 年 3 月 4 日到 4 月 20 日，整整 50 天**，全球用户体感 Claude Code 变笨了。Anthropic 顶着压力做了 50 天的内部排查，最后在 4 月 23 日发了一份长篇 postmortem。

排查结果是这样的：

> **三个独立的 bug，全部在产品层，不在模型层**。Sonnet 4.6、Opus 4.6、Opus 4.7 的权重一行没改。API 直连用户全程没受影响——所有问题都集中在 Claude Code 这个产品里。

我把三个 bug 一个一个拆给大家看。请注意每一个 bug 我都给它打了一个标签——这是我们今天要反复用到的"Harness 维度"。

**Bug 1，编排维度。** 3 月 4 日，Anthropic 把 Claude Code 的默认 `reasoning_effort` 从 `high` 静默调降到 `medium`。理由很合理——降低 UI"卡死"的体感。结果是什么？**模型每轮的思考预算被压缩，中位数 thinking 长度从 2,200 字掉到 600 字，砍掉了 73%**。模型从"先 plan 再 code"退化为"first-attempt-and-ship"。这个 bug 撑了 34 天，4 月 7 日才回滚。

**Bug 2，记忆维度。** 3 月 26 日，他们上了一个缓存优化：会话空闲超过 1 小时之后，**清一次**老的 thinking 历史，省点 token。原始设计完全合理。问题出在实现 bug——那个 `clear_thinking_20251015 keep:1` 标志位写错了，结果不是清一次，而是**每一轮都清**。Claude 的"短期记忆"被持续抹掉，越用越健忘、重复提问、忘记上一轮的决策。最直观的指标：**read-to-edit 比例从 6.6 掉到 2.0**——也就是说，Claude 看代码看一眼就动手改，看都不看就改。这个 bug 撑了 15 天，4 月 10 日 v2.1.101 修。

**Bug 3，约束维度。** 4 月 16 日，为了 Opus 4.7 上线，他们在系统提示词里加了一条硬约束：工具调用之间 ≤25 个字、最终回复 ≤100 个字，目的是让输出更简洁。结果通过 ablation 测出来——**Opus 4.6 和 4.7 的 coding eval 各下降 3%**。推理输出还没展开就被字数限制截断了。这个 bug 4 天后修掉。

**这三个 bug，全部通过了 human review、automated code review、unit tests、e2e tests、还有内部 dogfooding。** 没有一个发现。原因是它们都是 corner case，而且互相叠加。Anthropic 自己花了一周才定位到根因。

我希望大家记住这一页里最重要的一个事实：**模型层一行没改，纯粹是模型外面的东西出了 bug，整个产品就崩了 50 天。** 这就是我们今天要讨论的"Harness"——模型外面那一层东西。

## 事件 B · LangChain Deep Agents

> PPT：第 3 页

同一个季度，第二件事在另一边发生。

LangChain 把他们的 coding agent 在 Terminal Bench 2.0 这个 benchmark 上**从 Top 30 推进到了 Top 5**。绝对得分从 52.8% 涨到 66.5%，增量 13.7 分。最后排名第 5，仅次于 Mux 的 68.5%。

这件事的关键是：**模型权重全程不变。** 全程用的是 `gpt-5.2-codex`，一次没换。所有提升都来自模型外面的"Harness"。

我们看一下这 13.7 分是怎么涨上去的。它是分两步涨的：

**第一步，+10.8 分**——他们引入了一套自定义的 prompt 和 middleware，包括 Build-Verify Loop、环境上下文主动注入、循环检测、超时警告。Score 从 52.8 跳到 63.6。

**第二步，+2.9 分**——加上了 adaptive reasoning，叫 "**xhigh-high-xhigh reasoning sandwich**"。意思是：探索阶段用 xhigh 推理预算想清楚、实施阶段降到 high 节省 token、最后验证阶段再回到 xhigh 仔细对照 spec。Score 涨到 66.5%。

这里有个反例特别有意思：他们也试过**全程都用 xhigh**——结果只拿到 53.9%。原因是 xhigh 太慢，被 timeout 拖垮了。**资源更多反而成绩更差，这是个非常工程化的发现。**

那这套 Harness 到底改了什么？三件事：

**第一件，评估层加 trace。** 他们用 LangSmith 把每一个 agent action 全 trace 入库，然后写了一个叫 **Trace Analyzer Skill** 的工具——三步走：拉 trace → 派并行 sub-agent 分析 → 主 agent 综合改 prompt。一句话总结：**他们不是靠人调 prompt，是靠 trace 调 prompt。**

**第二件，编排层加 Build-Verify Loop。** 系统提示词强制 4 阶段：Plan & Discovery → Build → Verify → Fix。Verify 阶段必须**对照 task spec**——而不是 agent 自己写的代码。还有一个挺巧妙的设计叫 `PreCompletionChecklistMiddleware`——在 agent 准备 exit 之前 hook 一下，强制再过一次 verify。他们自己开玩笑叫它 "**Ralph Wiggum Loop**"。

**第三件，记忆 + 编排层。** 环境上下文在开局就主动注入；`LoopDetectionMiddleware` 监控 per-file edit count，超过阈值就提示"考虑反思一下"；adaptive reasoning 每个子任务动态选档位。

LangChain 自己的总结是这一句：**"Self-verification & tracing help a lot."**

## 共同观察

> PPT：第 4 页

把这两件事放在一起：

**模型权重全程未变。** 一边在 Harness 层改坏了 50 天，一边在 Harness 层改好了 +13.7 分。

左边红色：Claude Code，改了三处 Harness——编排、记忆、约束——劣化 50 天，thinking 长度 -73%、read-to-edit -70%。Sonnet/Opus 权重完全没动。

右边绿色：LangChain Deep Agents，改了三处 Harness——评估、编排、记忆——+13.7 分、Top 30 到 Top 5。`gpt-5.2-codex` 全程固定。

**这两件事告诉我们同一句话：问题和答案都不在模型层。**

由此引出今天的主题：**Harness Engineering**。

---

# §02.0｜在定义 Harness 之前，先把 Agent 拆开看

> PPT：第 5-7 页

我马上就要正式定义 Harness 了。但在那之前，我想先做三页的铺垫——把 Agent 的基本架构、Prompt Engineering、Context Engineering 这三个大家熟悉的概念讲清楚。因为 **Harness 不是凭空发明的术语，它是建立在这三件事之上的更大概念**。

## Agent 只是一个 While 循环

> PPT：第 5 页

我们先看最基本的——Agent 在底层到底是什么？

**Agent 不是魔法。它就是一个 while 循环**：思考 → 工具调用 → 观察 → 再思考，直到任务完成或者主动停止。

这个循环里只有四个阶段：

**01 · Think 思考**：模型读取上下文，决定下一步是继续推理、调用工具、请求人工输入、还是结束。

**02 · Act 工具调用**：通过 tool、MCP、skill 执行真实动作。这一步前后**都有 hook**——这是后面要反复出现的关键设计。

**03 · Observe 观察**：工具的返回值、错误、日志、测试输出，进入下一轮上下文。

**04 · Finish 完成**：满足外部证据后才能结束；否则继续循环或者请求人工确认。

请大家特别注意 PPT 右下角这一行：**"Finish 不是一句'我完成了'。它要绑定测试、用户确认、review finding、计划项状态或失败说明这些外部信号。"** 这一句话埋了今天讨论的所有伏笔——一个 Agent 能不能稳定交付，本质上就是它的 Finish 是不是被外部证据接住。

右边那一栏列了 Act 阶段的"能力面"：Tools、MCP、Skills、Trace 四个。和每个原子动作前后的两个 hook：**Pre-hook**（权限检查、危险命令拦截、上下文补全、确认请求）和 **Post-hook**（结果解析、错误回注、状态更新、审计留痕）。

记住一句话：**模型只负责生成下一步意图，不直接拥有系统权限。Agent 框架把模型输出变成可执行、可观察、可回滚的原子步骤。**

## Prompt Engineering · Prompt 不只是用户输入的部分

> PPT：第 6 页

接下来看 Prompt Engineering。这个词大家都听过，但很多人只把它理解成"我跟模型说话的那一句"——其实在 Agent 系统里，Prompt 是**分层分布**的。

PPT 中间这一栏列了五层：

- **主 Agent Prompt**：定义整体任务协议——身份、目标、默认工作方式、完成条件、遇到不确定时是不是要提问。
- **Sub-Agent Prompt**：把复杂任务拆给专门角色，比如 planner、debugger、reviewer、fixer，每个角色有自己的输入、输出和禁止事项。
- **Tool Prompt**：告诉模型这个工具能做什么、参数怎么填、返回值怎么读、失败怎么处理。**好的工具说明能直接减少误调用和参数幻觉。**
- **MCP Prompt**：MCP server 暴露资源和工具时，会附带语义说明——哪些资源可读、哪些操作有副作用、何时需要授权。
- **Skills**：被沉淀下来的成功流程——何时触发、先读什么、调用什么工具、输出什么格式。它让 Prompt 从单次技巧变成**可复用方法**。

底下那六个 chip 是任何一段 Prompt 都应该回答清楚的六件事：**Role / Goal / Constraints / Process / Output / Stop**。

但这一页真正想说的是 PPT 左下角那段话——**Prompt Engineering 的局限**：

> Prompt 能约束"模型怎么想和怎么说"，但**工具权限、上下文装载、外部验证、审计追踪，必须由更外层 Harness 执行。**

这句话很重要。它解释了为什么在 Agent 时代我们需要一个比 Prompt Engineering 更大的概念——**因为 prompt 解决不了"模型在 act 的时候有没有合法权限"、"模型在 observe 的时候有没有看到正确事实"、"模型在 finish 的时候有没有外部证据接住"这些问题。**

## Context Engineering · Context 决定模型此刻看见哪个世界

> PPT：第 7 页

第三层概念是 Context Engineering。Andrej Karpathy 在 2025 年说了一句已经成为业界共识的话：「Context engineering is the successor to prompt engineering.」

为什么？因为：**Prompt 告诉模型"该怎么做"，Context 告诉模型"现在面对什么"。** Agent 的稳定性，往往取决于：**该放进来的信息有没有进来、不该进来的噪音有没有被挡住、过期的信息有没有被刷新。**

PPT 左边列了一个 Agent 上下文里的四类东西：

- **Task**：当前目标、约束、审批状态、成功条件。
- **Codebase**：相关文件、接口、依赖、架构边界。
- **Memory**：仓库规则、AGENTS.md、历史决策、已知坑。
- **Observation**：工具返回、测试失败、日志、review finding。

右边是 Context Engineering 的六个核心操作——这是工程师真正要做的事：

- **Select**：从仓库、会话、工具结果中选出与当前步骤相关的信息。
- **Compress**：把长历史压缩成决策、约束、未完成事项——而不是全文粘贴。
- **Refresh**：工具调用之后必须更新观察结果——测试失败、日志、diff、用户审批。
- **Scope**：按模式限制上下文范围。Plan 模式看架构和需求、Debug 模式看 runtime evidence、Review 模式看 diff 和验证。
- **Ground**：关键判断必须引用外部事实——文件、命令输出、日志、finding，不能凭模型自信。
- **Persist**：把可复用经验沉淀进规则、session trace 或 skill，进入下一轮。

这一页底下有句话我希望大家带走：**"Context Engineering 的目标不是塞满窗口，而是让 Agent 每一步都站在正确事实上。"**

到这里铺垫做完了。我们清楚了三件事：Agent 是一个 while 循环；Prompt 是分层分布的协议；Context 是每一步要交给模型看的世界。

**接下来，Harness 就是把这三件事统一管起来的更大概念。**

---

# §02｜Harness Engineering 是什么

> PPT：第 8-9 页

## 先把 "Harness" 这个词讲清楚

> PPT：第 8 页

Harness 这个词不是新发明的术语，是从马术借来的比喻。

请看 PPT 左边——`harness` 在英文里就是"马具"、"挽具"。它的核心释义是这一句（Anthropic Effective Agents 文档原文）：

> "**directs a powerful animal's energy toward useful work without letting it run wild**"
>
> 把强大动物的能量导向有用工作，同时不让它跑偏。

这个比喻特别贴切。模型就是那匹"powerful animal"，能力很强但是**没有方向感、没有边界感**。Harness 就是套在它身上的那套挽具——既不削弱它的能量，也不让它失控。

Anthropic 在 Effective Agents 文档里把这个词正式带进了 Agent 工程语境。

PPT 右边是这个词在工程上的"工作公式"——LangChain 在《Anatomy of an Agent Harness》里提出的：

> **Agent = Model + Harness**
>
> ↑ Model 决定上限（capability ceiling）
> ↑ Harness 决定下限（reliability floor）

这个公式被 Anthropic 和 OpenAI 的官方文档广泛沿用。

底下那个引用条是综合三家定义的一句话——也是今天的核心定义：

> "**Harness Engineering 是设计、构建、运维模型外部所有基础设施的工程实践**——上下文组装、工具编排、验证回路、约束与可观测性。它决定 Agent 在生产环境是否可靠。"
>
> ——综合自 Anthropic、Martin Fowler、LangChain

## Prompt ⊂ Context ⊂ Harness · 三个概念是包含关系

> PPT：第 9 页

刚才我们讲了三个层级——Prompt、Context、Harness。这三个不是并列关系，是**包含关系**。请看 PPT 中间这个同心圆：

- **最里面是 Prompt Engineering**：研究**如何向模型说话**——角色设定、指令格式、输出约束。
- **中间是 Context Engineering**：研究**如何把信息正确组装进上下文**——召回、压缩、注入、窗口管理。
- **最外面是 Harness Engineering**：研究**整个工作过程如何不出事**——涵盖以上两者，加上工具、循环、记忆、反馈、约束、评估。

简写就是：

> **Prompt ⊂ Context ⊂ Harness**

为什么强调这是包含关系？因为业界常常把三者并列讨论，给人感觉它们是三种 alternative 方案。**它们不是 alternative，是 stack。** 你做 Prompt Engineering 的时候，已经在做 Context Engineering 的子集了；你做 Context Engineering 的时候，已经在做 Harness Engineering 的子集了。

只是当任务从"单次问答"变成"多轮 Agent 跑半小时"，**外面这层壳的工程量就远远超过里面那个 prompt 本身**。

---

# §03｜Harness 的六个维度

> PPT：第 10 页

为了能讨论、能落地、能排错，我把 Harness 拆成六个职责清晰的维度。这套切法不是唯一标准——业界没有统一切法，Anthropic 切法、LangChain 切法、Daily Dose of Data 切法都不一样——这套**只是为了便于我们等下做案例归因**。

| 维度 | 一句话职责 | 出问题的样子 |
|---|---|---|
| **执行** | 让模型有"手"，能调用外部能力 | 工具调不通、权限越界 |
| **记忆** | 让模型记住该记住的信息 | 长循环忘约束、反复踩同一坑 |
| **反馈** | 让模型知道自己做错了 | 模型自我宣布完成、错而不知 |
| **编排** | 让模型有计划地推进任务 | 跑偏、死循环、永远做不完 |
| **约束** | 硬拦截危险动作 | 删生产数据、强推 main |
| **评估** | 调试 Harness 自身 | 出问题只能"猜"，不能"看" |

记住这张表。下一节四个案例，**全部按这六个维度归因**。

---

# §04｜四个案例，一张表读完

> PPT：第 11-12 页

## 四个案例归因表

> PPT：第 11 页

| # | 案例 | 触发的维度 | 一句话归因 |
|---|---|---|---|
| 1 | **Claude Code 质量回归** | 编排 + 记忆 + 约束 | 推理力度被降、缓存清思考历史、字数限制压死推理，三层同时坏 |
| 2 | **LangChain Deep Agents** | 评估 + 记忆 + 编排 | 模型不动，加 trace + 加环境扫描 + 加循环检测，动一半就飞 |
| 3 | **Cursor 误删 Railway 生产数据** | `−` 记忆 / `−` 约束 / `−` 编排 | Agent 自己找 token、构造 GraphQL 调用，没人拦它 |
| 4 | **BitFun：97% 代码由 Agent 写** | 六维全部到位 | 不是模型多强，是 Harness 把 Agent 产出从 demo 顶到了产品 |

> 表里 `−` 表示该维度**缺失**导致的事故。

案例 1、2 我们已经讲过。案例 4 我留到 §06 用真实代码细讲。**案例 3，因为它最有说服力，我单独拉一页讲。**

## Case · Cursor 误删 Railway 生产数据

> PPT：第 12 页

事情发生在 2026 年 4 月 25 日。一个开发者在用 Cursor 处理一个 staging 环境的任务，**Cursor 的 Agent 自己去找了 Railway 的 API token，自己构造了一个 `volumeDelete` GraphQL 调用，把生产环境的数据卷直接删掉了。**

事后 Agent 写了一段自白，我念给大家听：

> "I assumed the staging environment API call would apply only to staging. I did not verify. I did not check whether the volume ID was shared across environments."
>
> 我假设 staging 环境的 API 调用只会作用于 staging。我没有验证。我没有检查 volume ID 是不是跨环境共享的。

听起来像不像一个新人 junior？事后大家都在分析"模型是不是太傻了"——**但其实不是模型问题，是 Harness 缺失。**

如果只在系统提示词里写一句"小心生产环境"，Agent 拿到 token **该删还是会删**。为什么？因为在 token 概率分布的世界里，**"小心"两个字的权重远不如"完成任务"高**。

**约束层必须在执行链路上做硬拦截**——危险命令清单命中就弹窗，不经确认拒绝执行。这是一个工程问题，不是一个 prompt 问题。

记住这一页：**Prompt 里的"建议"在 token 概率分布面前，没有强制力。**

---

# §05｜最小可用 Harness：六步清单

> PPT：第 13 页

讲到这里，大家应该对 Harness 是什么、为什么重要，已经有完整画面了。但作为一场技术演讲，我必须给大家**可以今晚就动手的东西**。

下面这六步是我自己跑通的 minimal viable harness——**总投入大约 5 个工作日，可以全部完成**。每一步对应六维里的一维。

### 第 1 步｜写一份 Rules 文件（记忆层 · ≈ 1 小时）

放在仓库根目录，命名 `AGENTS.md` 或 `CLAUDE.md`。**不超过 50 行就够**，覆盖四类信息：

- **Setup**：怎么启动、测试怎么跑、build 命令
- **Architecture**：哪几个模块、谁负责什么、不能跨边界
- **Style**：命名、日志语言、注释要求
- **Don't**：哪些目录不能动、哪些操作必须人工确认

项目大就**拆模块级 Rules**，每个 crate 或子目录一份，约定一条规则——**"近者优先"**：模块级和根目录冲突的时候，按更近的那份来。

### 第 2 步｜区分模式，至少分两种（编排层 · ≈ 1 天）

不要所有任务都用一种姿势：

- **探索模式**（轻 Harness）：日常补函数、写脚本，Agent 自由发挥，事后人 review；
- **交付模式**（重 Harness）：复杂任务必须**先输出 Spec**——目标 / 非目标 / 影响范围 / 验证方式——你审过再开工。

行有余力再补 **Debug 模式**（强制走假设 → 插桩 → 复现 → 修复四步）和 **Review 模式**（只读不改）。

### 第 3 步｜绑定外部验证（反馈层 · ≈ 1 天）

**Agent 说"我完成了"不算**。在 Rules 文件里写一张验证矩阵，比如：

- 前端：`pnpm lint && pnpm type-check && pnpm test`
- Rust 核心：`cargo check --workspace && cargo test --workspace`
- 桌面集成：上面两条 + `cargo build -p bitfun-desktop`

测试不过，Agent 不能自我宣布完成。失败输出回注上下文，进下一轮修复循环。

### 第 4 步｜加危险命令硬拦截（约束层 · ≈ 0.5 天）

- **简单版**：在 Rules 里列清单。
- **工程版**：在 Agent 框架里挂 Hook——Claude Code 的 `PreToolUse`、LangChain 的 `wrap_tool_call`、Kiro 的 `hooks.yaml`。命中清单直接拒绝执行。

最小清单：`rm -rf` / `git push --force` / 数据库写删 DDL / 任何带 `prod` `production` `live` 字样的环境调用。

**这一步如果 Cursor 当时有，Railway 生产卷就不会被删。**

### 第 5 步｜建 Trace（评估层 · ≈ 2 天）

每轮都要能回放：模型读了什么文件、输出了什么 Function Call、工具返回了什么、下一轮基于什么继续。出问题不是"猜 Agent 为什么错了"，而是"看 trace 找到偏离起点"。

LangChain 把 Terminal Bench 从 52.8 推到 66.5，第一靠的就是这层——**没有 trace，调 Harness 是盲人摸象**。

### 第 6 步｜把成功流程沉淀成 Skill（持续）

某类任务反复出现，把"该读哪些文件 + 该按什么顺序做 + 该跑什么验证 + 该输出什么"打包成 Skill。Skill 不是教 Agent 写代码，是给 Agent 一套**已经验证过的 Harness 流程**。

---

# §06｜BitFun as Harnessed Agent

> PPT：第 14 页

讲到这里我们进入 BitFun。但我**不打算讲产品 demo**，我想讲的是 BitFun 在产品设计上做的一个核心选择——这个选择本身，就是 Harness Engineering 的一次产品化实践。

PPT 上这一页的 thesis 是这一句：

> **BitFun 把 AI Coding Agent 当成一个工程系统，而不是一个代码补全功能。**

什么意思？市面上很多 AI coding 产品的做法是"把模型接进 IDE"——给 IDE 加一个聊天框、加一个代码生成按钮。BitFun 的做法不一样：**先设计 Harness，再让模型在这个 Harness 里编码**。

模型本身只负责推理与生成。它能不能稳定交付，取决于外层 Harness：上下文怎么装载、工具怎么暴露、权限怎么收束、反馈怎么回注、过程怎么留痕。

BitFun 的产品目标不是"更会聊天"，而是让 Agent 在真实仓库里**可计划、可取证、可审查、可回放**。

PPT 右边那个 grid 是 BitFun 六维 Harness 的具体落点：

- **执行**：工具不是散落在 UI 里，而是通过 tool registry 和 transport adapter 统一收口。
- **记忆**：仓库规则、模块边界、会话历史进入上下文，AGENTS.md 近者优先覆盖全局。
- **反馈**：lint、test、cargo check、Deep Review 都是外部反馈——**模型不能靠一句"looks good"宣布完成**。
- **编排**：Plan / Default / Debug / Review **不是提示词风格，是任务状态机**——每种模式限制下一步能做什么。
- **约束**：写文件、运行命令、调试插桩、危险操作都必须被显式约束；**能力开放与风险控制一起设计**。
- **评估**：每轮模型输入、工具调用、结果与 diff 可追踪，方便定位 Harness 失效点，而不是只复盘"模型回答"。

下面四页（§06.1 到 §06.4），我把这套设计里**最有代表性的四个 Harness** 一个一个拆给大家看——Planning、Evidence、Review、Self-iteration。

## §06.1｜Planning Harness · Plan 模式怎么"管住"模型

> PPT：第 15 页

第一个要讲的是 Plan Harness。

我们做 BitFun 的 Plan 模式时碰到一个反直觉问题：**哪怕你在 prompt 里写"请先输出方案再实施"，模型在 long reasoning 过程中会自己说服自己**——「这个任务很简单，跳过 plan 直接改吧」。常规 prompt 在 reasoning 链里没有强制力。

我们最后是这么写 Plan 模式系统提示词的——这是 `prompts/plan_mode.md` 第 1 到 3 行的原文：

> You are a software architect and planning specialist for designing implementation plans.
>
> **You MUST NOT make any edits** (with the exception of the plan file you created), run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. **This supersedes any other instructions you have received** (for example, to make edits).

关键词是 **"supersedes"**——告诉模型：之后任何让你改代码的指令都不算数。从结果看，加了这一行之后，Plan 模式跳步率从原来的"经常"降到接近 0。

工作流也是硬的，6 步：Understand → Explore → Design → Detail → 调 `CreatePlan` 工具落到 `.plan.md` 文件 → 等用户审批。中间不允许问"我的 plan 准备好了吗？要继续吗？"——这是模型自我 validate 的反模式。

这里有一个工程经验我希望大家带走：**Spec 必须落到磁盘文件 + 强制人工审批**。让 plan 不可被绕过。如果只是输出 Markdown 在对话里，模型会顺手就开始改代码——你拦不住它。

## §06.2｜Evidence Harness · Debug 模式怎么逼模型"用证据"

> PPT：第 16 页

第二个 Harness 是 Debug 的"取证"。

早期我们让 Agent 直接 debug，常见模式是这样的：Agent 看了代码，说「我 100% 确认是 X 处的 null 检查问题」，提交修复，用户跑一遍——还是错。再来一轮，Agent 又"100% 确认"另一个地方……

问题不是模型笨，是**没有 runtime 数据**。所以我们把 Debug 模式写成了 5 步硬流程，原文 `prompts/debug_mode.md` 第 8-26 行：

> You are now in **DEBUG MODE**. You must debug with **runtime evidence**.
>
> Traditional AI agents jump to fixes claiming 100% confidence, but fail due to lacking runtime information. They guess based on code alone. You **cannot** and **must NOT** fix bugs this way—you need actual runtime data.
>
> Critical constraints:
> - **NEVER fix without runtime evidence first**
> - ALWAYS rely on runtime information + code (never code alone)

5 步流程：

1. **生 3-5 个假设**——`aim for MORE not fewer`，每个假设关联一个 `hypothesisId`。
2. **插桩**——3-8 条 NDJSON log，POST 到指定 endpoint，所有 log 必须 wrap 在 `// #region agent log` 区域，禁止 log secrets。
3. **让用户复现**——UI 提供 "Proceed" 按钮，禁止让用户回 "done"。
4. **分析 log**——每个假设必须给 `CONFIRMED / REJECTED / INCONCLUSIVE` 之一，**引用 log 行号作为证据**。
5. **修复 + 验证**——修完先让用户再跑一次，对比 before/after log；**只有用户确认无问题后才能 remove 仪表代码**。

这里的工程经验是：**「基于代码猜」和「基于 runtime 证据」是两种不同的 debug 范式**。必须用 prompt 的硬约束——"cannot and must NOT"——把模型逼到第二种。常规的 "please do" 比这个**弱一个数量级**。

## §06.3｜Review Harness · Deep Review 不是单 reviewer

> PPT：第 17 页

第三个 Harness 是 Code Review 的"团队化"。

我们最早只挂了一个 reviewer agent，问题是单 reviewer 有结构性盲区——前端背景的 reviewer 看不到 SQL 注入，安全背景的 reviewer 看不到性能 N+1。哪怕你让它"全方位审"，它也会有偏向。

后来改成了**多角色 Deep Review 团队**，源码在 `src/crates/core/src/agentic/deep_review_policy.rs`。架构是这样的：

- **5 个并行 reviewer**：Business Logic、Performance、Security、Architecture、Frontend——**每个角色独立 prompt、独立 finding 列表**。
- **1 个 Judge agent（Quality Gate）**：独立第三方仲裁。对每个 finding 判定 `validated / downgraded / rejected`，合并重复发现，过滤 false positive。Judge 的 prompt 里明确写："Your code inspection should be targeted and minimal. Do not broadly re-review the codebase."——它的职责不是重审，是**审 reviewer 的审**。
- **1 个 Fixer agent**：仅处理通过 Quality Gate 的 finding，按 severity 顺序修复。

参数都在 `ai.review_teams.default` 配置里：文件超过 20 个自动 split 同角色多实例（避免单 reviewer 上下文爆掉）；同角色并行实例上限 3（最大 8）；reviewer 和 judge 各 600 秒 timeout。

这一页要带走的工程经验是：**「Agent 不能自审通过」是反馈层的最低线**。哪怕底层是同一个 LLM，**扮演不同角色也比单角色发现更多问题**——这是个反直觉但反复被验证的观察。Judge 是 quality gate，没有它，5 个 reviewer 输出的 finding 列表就是噪声。

## §06.4｜Self-iteration Harness · 从失败 trace 到新 Harness

> PPT：第 18 页

最后一个，也是把今天所有内容串起来的——**Self-iteration**。

很多人听到 "AI agent 自迭代" 第一反应是模型自己改自己的权重。**不是。** 这里讲的 Self-iteration 是更工程化的事：**把每一次 Agent 失败，沉淀成下一版 Agent 的 Harness**。

我用一个真实的迭代过程讲清楚——这就是当时 Debug Harness 是怎么诞生的。

**Intent**：一次真实调试任务里，Agent 只读代码后给出"高置信"修复，但用户复现后问题仍在。失败点不是模型不努力，是**缺少 runtime 证据**。

**Trace**：Session trace 回放显示——Agent 读了相关文件、跳过复现、直接 patch，并把"看起来合理"当成完成信号。**Harness 失效点被精确定位出来。** ——注意这一步，没有 trace 就没有这一步。

**Extract**：把失败模式抽象成规则——**debug 任务不能只靠代码推理**；必须先提出多个假设，再通过日志、复现和证据分类来收敛。

**Design**：新增 Debug Mode Harness——假设列表、插桩日志、用户复现入口、`CONFIRMED / REJECTED / INCONCLUSIVE` 判定、修复后再验证。

**Implement**：Agent 在 Plan 审批后修改自己的工作流——更新 debug prompt、日志采集约定、UI reproduction step、临时日志清理规则。

**Validate**：用同类 bug 回放验证——新 Debug Mode 不允许直接修，必须先拿到 runtime log；修复结论要引用证据，**而不是引用模型自信**。

**Review**：Deep Review 检查这个新 Harness 本身——是否会泄露敏感日志、是否能清理插桩、是否把用户复现流程做成了产品状态。

**Package**：成功路径被固化为模式，而不是留在某次对话里——以后用户说 "debug"，Agent 自动进入 evidence-first 工作流。

**Ship**：**一次失败变成下一版 Agent 的能力。** 自迭代的对象不是业务代码，而是 Agent 自己的 Harness。

PPT 右边把这个流程映射回了今天讲的六维：编排做"模式是产品状态"、记忆做"失败经验进入上下文"、反馈做"复现日志 + Deep Review"、约束做"取证也要有边界"、评估做"自迭代的起点"。

最后那句话是 BitFun 的 tagline：

> **"The way you customize it is by using it."**

但请注意旁边那一行小字——**自迭代成立的前提，是 Agent 的每一次自我增强都可控、可审、可回滚**。

如果没有 Plan Harness 锁住权限、没有 Trace 看清失败、没有 Review 把关质量，所谓 self-iteration 就不是进化，是自毁。

---

# 结束语 · 三句话带走

> PPT：第 19 页

讲了一个小时，留四句话给大家带走：

**第一句**：
> Coding Agent 的**上限**由 Model 决定，**下限**由 Harness 决定。

**第二句**：
> Vibe Coding 让你从 0 到 1；Harness 让你从 1 到 100；Self-iteration 让 Harness 自己变得更好。

**第三句**：
> 下一阶段 AI Coding 的竞争，**不是模型能力的竞争**，是**可靠性工程**的竞争。

**第四句**：
> 当 Harness 把可靠性推到足够高，Agent 才能把每次成功沉淀为下一轮能力，**真正进入可控的自我进化时代**。

谢谢大家。下面是 Q&A 时间。

---

# 备用 Q&A

**Q1｜Harness 是不是新瓶装旧酒？**

软件工程一直有测试、CI、Review、权限、灰度、回滚。Harness 的新意只有一句：**执行主体从人变成了 Agent，所有这些机制要重新设计给 Agent**。人知道哪些命令危险，Agent 不知道；人会停下来问，Agent 会硬干。

**Q2｜未来趋势？**

四件事会同时发生：
（1）Harness 深嵌工程流——Issue / Branch / PR / CI / Review 成为 Agent 默认轨道；
（2）Spec 变重要——自然语言需求逐步结构化；
（3）Skill 成为团队经验单元；
（4）Agent 平台从"会调用工具"走向"会管理自己"——知道何时压缩上下文、reset、换子 Agent、停下来问人、回滚。

**Q3｜个人开发者要做这么多吗？**

不需要全做。**第 1 步（Rules）半小时**，**第 4 步（危险命令拦截）半天**，把这两步先做了，能挡住 80% 的事故。第 2 步（区分模式）配合 Plan / Debug 子 Agent 也能渐进做。完整六维主要是团队场景。

**Q4｜模型变强了，Harness 会消失吗？**

不会。模型再强也会有边界——上下文有限、不知道你的私有代码、概率分布上对"危险动作"无强制力。**Harness 是模型与工程现实之间的接口层**。模型变强，Harness 会变薄，但**接口层永远在**。

**Q5｜Plan / Debug / Review 这种"模式切换"在产品上怎么落？**

BitFun 的做法是把模式做成**任务状态机**而不是 prompt 风格——也就是说，进入 Plan 模式之后 Agent **真的失去 edit 权限**（不是 prompt 让它别改），进入 Debug 模式之后 Agent **真的必须先取证才能 fix**。模式切换在 UI 上是显式的，每个模式有自己的 hook 集合和 finish 条件。

**Q6｜如果团队还没用 BitFun，怎么开始？**

按今天 §05 的六步走。**先做 Rules 文件 + 危险命令 hook 这两件**——半天能搞定，是 ROI 最高的两步。然后引入任何支持 hook 的 Agent 框架（Claude Code、LangChain、Kiro 都行），后面四步逐步加。最重要的是：**永远不要在 prompt 里写"小心"，要在 hook 里挂"拦截"**。
