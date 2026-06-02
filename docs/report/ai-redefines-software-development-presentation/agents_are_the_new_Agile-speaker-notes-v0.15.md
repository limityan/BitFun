# AI 如何重新定义软件开发：分页演讲稿

建议时长：约 15 分钟。建议页数：12 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。
节奏校验：当前分页讲稿标注合计约 14.6 分钟，其中主体讲述约 13.7 分钟，最后收束约 0.9 分钟。

## 报告简介

本报告以 BitFun 单月高吞吐 AI 辅助开发经验为入口，讨论 AI 如何从代码补全走向 Agentic Coding，并进一步影响软件开发全生命周期。内容结合任务契约、隔离执行、验证矩阵、Artifact 包、反馈记忆与人类监督等概念，分析企业研发流程、工程治理方式和开发者角色的变化，理解 AI 时代软件工程从“写代码”走向“组织智能协作系统”的新范式。

## 可引用调研

- Microsoft Agent Workspace（https://support.microsoft.com/en-us/windows/experimental-agentic-features-a25ede8a-e4c2-4841-85a8-44839191dfb3）：Windows 把 Agent 放进独立账号、隔离工作区、权限和审计模型中，适合支撑“Agentic OS 不是口号，而是系统层边界外扩”。
- Warp ADE / Open Agentic Development（https://www.warp.dev/blog/reimagining-coding-agentic-development-environment, https://www.warp.dev/newsroom/2026/4/28/warp-open-sources-its-agentic-development-environment）：把终端/IDE 扩展成多 Agent 控制、云端编排、可见进度和开放贡献系统，适合支撑“IDE 正在变成 Agent 控制平面”。
- OpenClaw Lobster（https://openclawlab.com/en/docs/tools/lobster/）：把多步工具调用收敛成类型化 runtime、审批门禁、可恢复 token 和结构化结果，适合支撑“自由对话之外还需要确定性流程壳”。
- Toward an Agentic Infused Software Ecosystem（https://arxiv.org/abs/2602.20979）：提出 AISE 需要同时推进 Agent、语言/API/工具以及 Agent 运行生态，适合支撑“未来 IDE 边界外扩到工程生态”。
- AI in Software Engineering: Perceived Roles and Their Impact on Adoption（https://arxiv.org/abs/2504.20329）：开发者会把 AI 视为工具或类似队友的角色，并进一步区分助手、参考向导、顾问、问题解决者等角色，适合支撑“AI Teammate 改变协作预期”。
- GitHub Copilot coding agent（https://github.com/newsroom/press-releases/coding-agent-for-github-copilot）：GitHub 把 coding agent 放进 issue、draft PR、session logs 和 PR review 的工作流，适合支撑“Background Agent 与异步任务交付”。
- GitHub Agent HQ（https://github.blog/news-insights/company-news/welcome-home-agents/）：把多种 coding agent 统一到 mission control、VS Code、GitHub、CLI 和移动端，并提出 agentic code review、AI access control plane 和 metrics dashboard，适合支撑“入口与委托正在平台化”。
- GitHub Copilot coding agent 2026 更新（https://github.blog/ai-and-ml/github-copilot/whats-new-with-github-copilot-coding-agent/）：model picker、self-review、安全扫描、自定义 agent 和 CLI handoff 说明竞品正在把“自动写代码”推进到“可选择、可检查、可交接”的工程流程。
- Just-say-no / just-say-yes engineer 讨论（https://www.seangoedecke.com/the-just-say-no-engineer-was-a-zirp-phenomenon/）：可作为工程文化热词引用，强调 AI 时代不是无原则说 yes，而是要设计可验证、可回滚的安全放行路径。
- Agentic Much? Adoption of Coding Agents on GitHub（https://arxiv.org/abs/2601.18341）：对 128,018 个项目的研究估计 coding agent 采用率已达 22.20%--28.66%，且 agent-assisted commits 往往更大，支撑“市场工具需要更强评审与证据机制”。
- AI Harness Engineering（https://arxiv.org/abs/2605.13357）：提出软件 Agent 能力来自 model-harness-environment 系统，Harness 负责任务规格、上下文选择、工具访问、观测、验证、权限、熵审计和人工干预记录，支撑“强模型之后更需要工程运行基座”。
- AgentTrace（https://arxiv.org/abs/2602.10133）：用结构化日志捕获 operational、cognitive、contextual 三类 trace，用于安全、问责、风险分析和信任校准，支撑“概率执行过程需要可观测证据”。
- SWE-CI / SWE-Chain（https://arxiv.org/abs/2603.03823, https://arxiv.org/abs/2605.14415）：把编码 Agent 评估从一次性修复推进到 CI 循环、长期维护和连续版本升级，支撑“最终验证应看长期可维护性”。
- LangChain Harness Engineering（https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering）：在固定 gpt-5.2-codex 的情况下，通过 trace、evals、自验证和 harness 调整把 Terminal Bench 2.0 分数从 52.8 提到 66.5，说明改进点常在模型外侧的运行系统。
- Anthropic Claude Opus 4.5（https://www.anthropic.com/news/claude-opus-4-5）：前沿模型把 SWE-bench Verified 推到 80%+ 区间，说明真实开源 issue 修复能力已明显上台阶。
- SWE-CI（https://arxiv.org/abs/2603.03823）：把编码 Agent 评估从静态一次性修复推进到 CI 循环和长期维护，任务平均覆盖真实仓库 233 天、71 个连续提交的演进历史。
- SWE-Bench Mobile（https://arxiv.org/abs/2602.09540）：用 PRD、Figma、生产级 iOS 代码库和测试套件评估工业移动任务，最优组合约 12%，且同模型不同 Agent 设计最高存在 6x 差距。
- Gartner Enterprise AI Coding Agents 2026（https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment）：预测到 2027 年，超过 65% 使用 agentic coding 的工程团队会把 IDE 视为可选入口，治理、验证和控制转向自动化平台。
- DORA 2025（https://dora.dev/dora-report-2025/）：AI 的主要作用是放大组织既有强项与弱项，收益来自底层组织系统，而不是工具采购本身。
- Google Research / DeepMind, Towards a Science of Scaling Agent Systems（https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/）：多 Agent 在可并行任务上可能收益明显，但在顺序任务上退化；独立多 Agent 的错误放大可达 17.2x，集中式校验能显著收敛错误传播。
- IBM Research / ICLR 2026 MAP（https://research.ibm.com/publications/measuring-agents-in-production）：生产 Agent 的现实状态更偏简单、短链路、可控和人类评估，68% 最多执行 10 步即需要人工介入，74% 主要依赖人类评估。
- MSR 2026, Speed at the Cost of Quality（https://cmustrudel.github.io/papers/msr2026he.pdf）：Cursor/LLM agent assistant 带来前置速度收益的同时，也观察到静态分析警告、重复代码密度和认知复杂度等质量风险。
- GitHub Copilot cloud agent（https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent）：把任务放进 GitHub Actions 驱动的临时环境，可研究仓库、计划、改分支、跑测试并进入 PR。
- OpenAI Codex web（https://developers.openai.com/codex/cloud）：在独立云环境中后台执行任务，可连接 GitHub 并从工作结果创建 PR。
- Claude Code subagents / hooks / permissions（https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/agent-sdk/hooks）：用子 Agent、独立上下文、工具权限、worktree isolation 和 Pre/PostToolUse hooks 把自动执行放进可审计护栏。
- AIDev: Studying AI Coding Agents on GitHub（https://arxiv.org/abs/2602.09185）：汇集 932,791 个由 OpenAI Codex、Devin、GitHub Copilot、Cursor 和 Claude Code 生成的 Agentic PR，说明未来研究和产品优化会围绕 PR、评审、提交、失败和协作数据展开。
- Cursor Background Agents / Rules（https://docs.cursor.com/background-agents, https://docs.cursor.com/en/context）：用后台远程 Agent、项目规则和 AGENTS.md 组织仓库级上下文与分支交付。

## BitFun 本地工程证据

- AGENTS.md：仓库级规则、平台边界、远程兼容、验证矩阵，支撑第 7 页“任务契约”和第 8 页“验证矩阵”。
- tool_pipeline.rs：可用工具白名单、运行时工具限制、折叠工具规格读取，支撑第 8 页“隔离执行”和“工具轨迹”。
- workspace_paths.rs、miniapp/host_dispatch.rs、miniapp/manager.rs：运行产物根目录防逃逸、小应用能力白名单、高风险权限差异，支撑第 8 页“权限边界”。
- docs/architecture/core-decomposition.md 与 scripts/check-core-boundaries.mjs：产品能力保护、端口和提供者迁移、边界检查与等价验证，支撑第 10 页“边界演进”。
- product-domains MiniApp/function-agent contract tests：用契约测试和快照保护 owner 迁移后的行为等价，支撑第 10 页“反馈回归”和“回归样本”。

## 15 分钟演讲节奏

按正常中文演讲语速，标题页和目录页快速进入主题，核心内容页保持 1.1-1.6 分钟，最后一页用于收束和引出互动。讲稿正文按口播方式组织，可以直接作为演讲者手卡使用。

- 第 1 页：约 0.5 分钟｜AI 如何重新定义软件开发
- 第 2 页：约 0.7 分钟｜目录
- 第 3 页：约 1.3 分钟｜速度的背后
- 第 4 页：约 1.4 分钟｜IDE 的边界
- 第 5 页：约 1.5 分钟｜产品化
- 第 6 页：约 1.2 分钟｜案例链路
- 第 7 页：约 1.3 分钟｜需求到任务
- 第 8 页：约 1.4 分钟｜实现到验证
- 第 9 页：约 1.4 分钟｜评审到交付
- 第 10 页：约 1.3 分钟｜发布到运维
- 第 11 页：约 1.7 分钟｜开发者角色
- 第 12 页：约 0.9 分钟｜谢谢

## 分页讲稿

### 第 1 页：AI 如何重新定义软件开发

- 建议时长：约 0.5 分钟
- 讲述目标：建立主旨：BitFun 是入口，核心问题是如何把 AI 高速产出变成可验证、可治理、可复盘的交付系统。
- 可选提问：当代码生成不再稀缺，软件工程真正稀缺的是什么？

讲稿：

各位好，今天分享的主题是《AI 如何重新定义软件开发》。可以把今天当成一个准工程师问题：如果 AI 已经能帮你快速写出大量代码，真正难的事情还剩什么？报告会以 BitFun 的真实开发经验为入口，但重点不是复盘项目细节，也不是比较哪个工具更强。今天的主线可以概括成一句话：从代码产能，到可治理 Agentic SDLC。也就是说，AI 不只是帮人补全代码，而是逐步进入需求理解、实现、测试、评审、发布和复盘；软件工程要升级的，是如何把这些概率性的执行过程，收敛成团队能判断、能追责、能复用的工程结果。

转场：

先看今天的四个主题，后面会用一个贯穿案例把它们串起来。

### 第 2 页：目录

- 建议时长：约 0.7 分钟
- 讲述目标：用四个模块组织全篇：软件工程变革、速度的背后、工程质量与治理、开发者角色。
- 可选提问：AI 研发的收益，应该看代码量、局部速度，还是端到端风险可控？

讲稿：

今天分四个部分。第一，软件工程变革：从 BitFun 的高吞吐开发经验出发，看 AI 放大代码产出后，软件工程真正被挑战的是什么。第二，速度的背后：看行业工具和研究为什么都在从“会不会写代码”转向“能不能进入工程系统”。第三，工程质量与治理：这里会用一个具体功能贯穿，假设我们要做 PR 自动摘要，从需求到任务、实现到验证、评审到交付、发布到运维，逐步看每一步要留下什么证据。第四，开发者角色：回到个人成长，讨论强一点的本科生或准新人，未来应该训练哪些能力，才能让 AI 放大自己的专业判断，而不是替代自己的理解。

转场：

先从 BitFun 的实际开发经验进入，看为什么代码量不是终点。

### 第 3 页：速度的背后

- 建议时长：约 1.3 分钟
- 讲述目标：用 BitFun 统计把问题落到真实场景：代码增长后，净收益要看端到端周期、评审等待、返工率、失败重跑和线上风险。
- 可选提问：单月 10W+ 行代码更像生产力证明，还是工程系统压力测试？

讲稿：

先看一个入口案例。在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日为窗口，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行，删除 46,479 行。可以把它概括成单月 10W+ 行代码，但数字本身不是重点。对一个准工程师来说，更应该追问：这些代码凭什么可以合并，哪些测试证明它没破坏旧功能，reviewer 怎么快速看懂，出了问题能不能回滚。AI 确实让想法更快变成原型，让个人可以承担过去需要多人探索的工作；但代码更快进入仓库以后，真正的问题会转移到验证覆盖、评审等待、返工闭环和长期维护。高吞吐不是净收益的证明，只说明生产环节已经被放大。更合理的收益口径，应该看端到端周期、评审等待、返工率、失败重跑、线上风险和维护者理解成本。

转场：

这个判断不能只靠单个项目经验，接下来看看行业里正在出现的工作方式变化。

### 第 4 页：IDE 的边界

- 建议时长：约 1.4 分钟
- 讲述目标：用行业新概念承接 BitFun 高吞吐现象，引出 IDE 从代码编辑器扩展为 Agent 运行、协作、审批和证据平台，同时带出工程师角色变化。
- 可选提问：为什么这些新词最后都在讨论运行环境、权限、协作和可审计性，而不是只讨论写代码？

讲稿：

从 BitFun 的高吞吐现象往下看，讨论不能只停在“AI 写代码更快”。更值得关注的是，这些行业新概念共同指向了 IDE 边界的外扩。Agentic OS 说明 Agent 正在被当成独立运行主体，需要账号、权限、隔离环境和审计要求。ADE，也就是 Agentic Development Environment，说明开发环境正在从编辑器扩展成多 Agent 的控制平面。龙虾式 Workflow 说明自由对话之外，还需要类型化流程、审批门禁和可恢复执行，让 Agent 不必每一步都自由发挥。Yes Engineer 则是一个有趣但也很专业的信号：它不是让工程师无原则答应需求，而是要求工程师设计一条能安全说 Yes/Go 的路径。对学生来说，这里的启发是，未来工具不只比谁生成代码更快，还会比谁更会管理身份、权限、执行环境、评审证据和回滚路径。

转场：

这些信号要进入真实团队，最终必须落成具体产品能力。

### 第 5 页：产品化

- 建议时长：约 1.5 分钟
- 讲述目标：从竞品和研究信号推导 ADE 的产品演进方向：任务委托、治理护栏和证据复盘三类能力最值得优先产品化，并明确 BitFun/ADE 的本地工程上下文定位。
- 可选提问：如果 IDE 边界已经外扩，BitFun/ADE 后续应该补的是哪些系统能力？

讲稿：

如果把这些行业信号拆成产品能力，三个方向最清楚。第一是入口与委托：GitHub Agent HQ、Copilot coding agent 和 Codex Cloud 都把任务从 issue、聊天、CLI 或 IDE 交给独立环境执行，再把结果回到分支和 PR。第二是治理与护栏：GitHub 的 model picker、自检、安全扫描、自定义 agent，以及 Claude Code 的 subagent、权限、hooks、worktree 隔离，都在把自动执行变成可选择、可拦截、可恢复的流程。第三是证据与复盘：session logs、规则上下文、trace、evals 和失败样本库，正在成为团队判断 AI 变更能否合并的依据。AIDev 把几十万级 Agentic PR 作为研究对象，也说明未来竞争点会落在 PR、评审、失败和协作数据。对 BitFun/ADE 来说，重点不是再做一个云端 Agent，而是在 IDE 和本地工程上下文里组织规则、权限、执行证据和协作边界。下一步我们用一个具体功能把这三个方向串起来。

转场：

接下来假设要做一个 PR 自动摘要能力，看它如何走完整条研发链路。

### 第 6 页：案例链路

- 建议时长：约 1.2 分钟
- 讲述目标：用一个贯穿功能降低抽象感：PR 自动摘要从需求、任务、实现、评审、发布反馈走完整链路。
- 可选提问：如果让 AI 做一个 PR 自动摘要功能，怎样才算真正交付完成？

讲稿：

为了避免后面变成概念罗列，我们从这里开始用一个贯穿案例：假设 BitFun 要做一个 PR 自动摘要功能。这个功能听起来很简单：AI 看 PR，然后生成摘要、风险点和测试建议。但如果把它放进真实工程，就会发现它不是只写一个接口或者一个 prompt。第一步要明确需求：摘要给谁看，解决什么问题，不做什么。第二步要转成任务契约：输入、目标、非目标、验收标准和风险边界。第三步是实现和验证：代码、测试、日志、异常场景要能复现。第四步是评审到交付：PR 里不能只有 diff，还要有摘要样例、测试日志、风险 Owner 和回滚路径。第五步是发布到运维：摘要不准、误导 reviewer、性能变慢、权限越界，都要回到下一轮规则和测试。沿着这条链路看，ADE 的价值就不只是更强 IDE，而是让 Agent 能力贯穿需求、实现、评审和反馈。

转场：

先看第一步：一个想法怎样变成 AI 可以执行、团队可以验收的任务。

### 第 7 页：需求到任务

- 建议时长：约 1.3 分钟
- 讲述目标：用 PR 自动摘要说明任务契约：把模糊需求转成可执行、可验收、可追责的输入。
- 可选提问：一个需求什么时候才适合交给 Agent 执行？

讲稿：

第一步不是让 AI 直接写代码，而是把需求转成任务契约。以 PR 自动摘要为例，模糊说法是“帮 reviewer 总结一下 PR”。工程化说法要更具体：输入是 PR diff、commit、issue、测试日志和仓库规则；目标是给出变更摘要、影响范围、风险点和建议检查项；非目标是不能替 maintainer 做最终合并判断，也不能读取超出权限的私有信息；验收标准是摘要能覆盖关键文件、能指出测试证据、能识别高风险模块，并且失败时有降级策略。人的职责是定义成功和边界，AI 可以帮助拆需求、查上下文、生成任务计划，但不能替人决定产品取舍。这个节点的产物不是代码，而是一份可执行任务单。它决定后面实现、验证、评审到底拿什么判断对错。

转场：

任务契约明确以后，再让 Agent 进入实现和验证循环。

### 第 8 页：实现到验证

- 建议时长：约 1.4 分钟
- 讲述目标：用 PR 自动摘要说明概率过程与确定性验证：每轮修改都要留下可复现证据。
- 可选提问：如果实现过程是概率性的，团队靠什么判断它真的完成了？

讲稿：

第二个节点是实现到验证。这里要处理一个核心矛盾：模型生成代码的过程可以是概率性的，但软件工程最后要的是确定性的运行结果。PR 自动摘要的实现可能会改前端展示、摘要生成逻辑、权限读取、日志记录和测试用例；Agent 可以尝试不同实现路径，但每一轮结束时都要能回答四个问题：改了什么，为什么这么改，跑了哪些检查，失败在哪里。这里需要三层保护。第一是隔离执行，探索不要直接污染主线。第二是验证矩阵，前端交互、摘要准确性、权限边界、异常降级要各有检查。第三是证据包，把 diff 摘要、测试日志、失败列表和影响范围保存下来。这样 0.99 的多轮串联不会只靠信心累乘，而是在每个节点被验证证据打断和纠偏。

转场：

实现和验证有证据以后，下一步的问题是：这些海量变更如何进入代码仓和发布流程。

### 第 9 页：评审到交付

- 建议时长：约 1.4 分钟
- 讲述目标：用 PR 自动摘要说明 Artifact 包：让维护者或团队负责人敢判断、敢合并、敢回滚。
- 可选提问：维护者或团队负责人如何验证陌生的大量 AI 变更是否值得合并？

讲稿：

第三个节点是评审到交付。AI 带来的真实压力不是多了几行代码，而是维护者要在更短时间里判断更大的变更是否可信。以 PR 自动摘要为例，评审对象不能只有最终 diff，还应该有一包 Artifact：任务契约、关键设计差异、摘要样例、测试结果、权限检查、影响范围、剩余风险和回滚路径。Artifact 不应该靠开发者手工整理，也不应该要求人回看每一步操作；它应该由平台从任务契约、diff、测试日志、风险说明、Owner 审批和回滚路径自动生成，并与 PR 或发布记录绑定。开源项目里，这能帮助维护者建立对陌生贡献的信任；企业项目里，它能帮助跨团队角色对齐责任。AI 可以辅助预评审、生成说明、比对规则、提示高风险文件；但人要做风险仲裁，判断质量例外是否可接受，是否需要架构 Owner、测试 Owner 或发布 Owner 介入。

转场：

代码合并或发布以后，工程链路还没有结束，反馈必须回到下一轮研发系统。

### 第 10 页：发布到运维

- 建议时长：约 1.3 分钟
- 讲述目标：用 PR 自动摘要说明反馈记忆：线上问题如何回流到规则、测试、架构边界和样本库。
- 可选提问：AI 参与交付后，线上问题和长期维护经验如何变成下一轮能力？

讲稿：

第四个节点是发布到运维。AI 时代很容易把注意力放在生成和合并之前，但真正的长期质量要看发布以后。PR 自动摘要上线后，可能出现摘要遗漏关键风险、把测试失败解释错、在大 PR 上变慢、读取了不该读的上下文，或者被 reviewer 误用成自动合并理由。这些都不能只作为一次 bug 修掉，而要回到下一轮任务契约、测试用例、规则上下文和架构边界里。BitFun/ADE 在这里可以做两件事：第一，把运行证据组织成 Agent 可用的上下文，例如哪些摘要经常误判、哪些模块风险提示不足、哪些测试缺口导致返工。第二，把反馈沉淀成可复用资产，例如摘要规则、回归样本、权限检查和风险模板。这样，运维不是开发之后的尾巴，而是让 Agentic SDLC 持续变聪明的反馈源。

转场：

最后回到人和团队：在这个新系统里，开发者角色会怎样变化。

### 第 11 页：开发者角色

- 建议时长：约 1.7 分钟
- 讲述目标：从团队、个人和新人三个角度说明角色变化，并给出面向新工程系统的技术成长方向。
- 可选提问：AI 参与每个阶段后，哪些能力应该由系统承接，哪些判断必须由人承担？

讲稿：

最后看开发者角色。团队层面，未来的重点不是追求全自动，而是建设可治理交付系统：把任务契约、隔离执行、验证矩阵、Artifact 包和反馈记忆做成平台能力；用净时间、返工率、评审压力和线上风险判断真实收益。个人层面，变化不是远离代码，而是判断位置前移。对强一点的本科生或准新人，我建议把训练重点放在四件事。第一，定义问题：能说清目标、非目标、用户场景和验收标准。第二，读懂系统：能理解架构约束、依赖关系、历史决策和运行边界。第三，设计验证：能把测试、日志、性能、安全、回滚放进交付标准。第四，承担判断：知道什么可以自动推进，什么必须补证据，出了问题如何解释和复盘。AI 会降低实现门槛，但会提高系统理解和工程判断的要求。未来更强的开发者，不是不用 AI，而是能让 AI 放大自己的专业判断。

转场：

最后用三条结论收束，并进入交流。

### 第 12 页：谢谢

- 建议时长：约 0.9 分钟
- 讲述目标：用三个面向未来的方向性问题收束：IDE 边界、工程信任和开发者角色。
- 可选提问：如果 AI 真的进入软件工程全生命周期，未来最值得继续追问的是什么？

讲稿：

最后留下三个更值得继续讨论的问题。第一，IDE 的终点会是什么？如果 Agent 需要身份、权限、隔离环境、上下文和证据，那么 IDE 可能不再只是编辑器，而会成为 Agent 的运行面和工程控制面。第二，信任如何定价？当代码产出可以被快速放大，团队真正稀缺的会变成可合并的证据、可追责的责任边界和可回滚的系统设计。第三，开发者的坐标在哪里？当实现动作越来越多地交给 Agent，人更需要站在问题定义、架构约束、风险解释和最终责任上。今天的核心判断是：AI 的未来不是让软件工程消失，而是迫使软件工程升级；真正值得建设的是能把需求、实现、验证、评审和反馈串起来的 ADE。谢谢大家。

转场：

进入交流。
