# AI 如何重新定义软件开发：分页演讲稿

建议时长：15 分钟。建议页数：14 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。

## 报告简介

本报告以 BitFun 为引子，讨论 AI 如何从代码补全走向 Agentic Coding，并进一步影响软件开发全生命周期。内容将结合 Context Engineering、质量门禁、平台工程与人类监督等概念，分析企业研发流程、工程治理方式和开发者角色的变化，理解 AI 时代软件工程从“写代码”走向“组织智能协作系统”的新范式。

## 可引用调研

- Google / DORA 2025（https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/）：80% 以上受访者认为 AI 提升生产力，59% 认为代码质量改善；但报告同时提出 trust paradox，并强调 AI 是组织的 mirror and multiplier，采用工具之外还需要文化、流程和系统演进。
- DORA GenAI report 2025.2（https://dora.dev/ai/gen-ai-report/dora-impact-of-generative-ai-in-software-development.pdf）：报告提醒新技术采用可能带来短期生产率下降，也指出 AI 提高代码生成速度后，小批量、稳健测试等基本工程原则更重要。
- METR Early-2025 RCT（https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf）：16 位成熟开源开发者在熟悉项目中完成 246 个真实任务，使用当时 AI 工具后任务耗时增加 19%，适合作为“大型复杂工程收益不线性”的反例。
- METR 2026 update（https://metr.org/blog/2026-02-24-uplift-update/）：METR 提醒多 Agent 并行和开发者不愿脱离 AI 等因素会让 AI 生产率测量本身变得更难，适合引出“指标重写”。
- Harness State of Engineering Excellence 2026（https://www.harness.io/press-and-news/ai-has-outpaced-how-engineering-organizations-measure-developer-productivity）：81% 受访者认为采用 AI coding tools 后 code review 时间增加，约 31% 开发者时间进入 review、修 bug、工具切换等隐形工作。
- Harness DevOps Modernization 2026（https://www.harness.io/state-of-modernization-2026）：频繁使用 AI coding 的团队同时报告部署问题、回滚/热修复、MTTR、合规和性能压力等下游挑战，适合支撑“速度要与风险一起衡量”。
- Measuring Determinism in Large Language Models for Software Code Review（https://arxiv.org/abs/2502.20747）：即使 temperature 降到 0、清空上下文并重复同一提示，LLM 代码评审结果仍存在不同程度的不一致，适合支撑“模型层也需要工程收敛”。
- Google Research / DeepMind / Academia, Towards a Science of Scaling Agent Systems（https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/）：多 Agent 在可并行任务上可能收益明显，但在顺序任务上退化；独立多 Agent 的错误放大可达 17.2x，集中式校验能显著收敛错误传播。
- Towards a Science of AI Agent Reliability（https://arxiv.org/abs/2602.16666）：Princeton 等研究者提出不要只看单一成功率，而要从一致性、鲁棒性、可预测性和安全性刻画 Agent 可靠性。
- ICSE 2026 NIER: Towards Verifiably Safe Tool Use for LLM Agents（https://conf.researchr.org/details/icse-2026/icse-2026-nier/41/Towards-Verifiably-Safe-Tool-Use-for-LLM-Agents）：提出从 STPA 出发识别 Agent 工作流风险，并把能力、保密性、信任等级等标签 formalize 到可执行规格中。
- IBM Research / ICSE 2026: AgentFixer（https://research.ibm.com/publications/agentfixer-from-failure-detection-to-fix-recommendations-in-agentic-systems）：用 15 类失败检测工具和根因分析模块诊断 agentic 系统可靠性问题，说明验证系统本身也可演进为 agentic 的纠错流程。
- SWE-CI（https://arxiv.org/abs/2603.03823）与 SWE-Chain（https://arxiv.org/abs/2605.14415）：把编码 Agent 评估从静态一次性修复推进到 CI 循环、长期维护和连续版本升级，支撑“长期可维护性才是最终验证”。
- GitHub Copilot cloud agent（https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent）：把 coding agent 放进 GitHub Actions 驱动的临时环境，让其研究、计划、改代码、跑测试并进入 PR 工作流，适合支撑“异步委派 + 团队透明协作”。
- OpenAI Codex cloud（https://developers.openai.com/codex/cloud）：Codex 可在独立云环境中后台并行处理任务，并从 GitHub issue 或 PR 触发工作，适合支撑“多任务、多 Agent、PR 化交付”。
- Claude Code subagents / hooks（https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/hooks）：通过角色化 subagent、独立上下文、工具权限和生命周期 hooks，把协作从一个会话扩展到可控的 Agent 编排。
- LangChain Deep Agents harness engineering（https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering）：在模型固定的情况下，通过 trace、自验证和 harness 调整提升 Terminal Bench 2.0 表现，说明改进点常在模型外部工程系统。
- Collaborator or Assistant?（https://arxiv.org/abs/2605.08017）：分析 29,585 个 PR 生命周期，提出 Collaborator-Assistant 光谱；agent 可获得 operational agency，但 merge governance 仍主要由人类承担。
- SWE-PRBench（https://arxiv.org/abs/2603.26130）：350 个 PR 的 AI code review benchmark 显示，前沿模型只能发现部分人类标注问题，支持“AI 评审是证据输入，不是最终裁决”。
- AgentTrace（https://arxiv.org/abs/2602.10133）：提出 structured logging 框架，捕获 operational、cognitive、contextual 三类 trace，用于安全、问责、风险分析和信任校准。
- OpenAI, A Practical Guide to Building Agents（https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf）：强调模型、工具、指令和 guardrails 是 Agent 基础构件，并建议以 evals 建立性能基线、按任务选择模型。
- AgentOps: Enabling Observability of LLM Agents（https://arxiv.org/abs/2411.05285）：从 DevOps 视角提出 AgentOps taxonomy，强调要追踪 Agent 全生命周期中的 artifacts 和 associated data，支撑监控、日志、分析和安全。
- Fine-Grained Appropriate Reliance（https://arxiv.org/abs/2501.10909）：多步透明决策工作流在复杂任务中能帮助用户在中间步骤层面校准对 AI 的依赖，适合支撑“人看阶段性证据，而不是只看最终答案”。
- Fostering Appropriate Reliance on LLMs（https://arxiv.org/abs/2502.08554）：CHI 2025 研究发现，解释会同时增加对正确和错误回答的依赖；提供来源或暴露解释中的不一致更能降低对错误回答的过度依赖，适合支撑“判断辅助要突出来源、差异和不一致”。
- Designing meaningful human oversight in AI（https://link.springer.com/article/10.1007/s43681-026-01147-7）：提出 AI 负责执行性 agency，人类负责验证、 steering 和 substitution 的 evaluative agency，强调人类监督不能沦为 rubber stamp。
- SAA: visualization-based software analytics（https://www.sciencedirect.com/science/article/pii/S0164121225002584）：通过软件 Artifact traceability graph 和交互式可视化辅助软件过程分析与决策，适合支撑“Artifact 关系图 + 人类可读视图”。
- Cloudsmith 2026 Artifact Management Report 报道（https://www.itpro.com/software/development/developers-are-slacking-on-ai-generated-code-safety-heres-why-it-could-come-back-to-haunt-them）：AI 生成代码使用快速增长，但只有少数组织用传统制品同等级别的安全策略和 provenance tracking 管理代码、依赖和发布产物，提示 Artifact 治理正在成为工程风险点。

## 分页讲稿

### 第 1 页：AI 如何重新定义软件开发

- 建议时长：约 0.5 分钟
- 页内重点：首页：保留主题，强调 AI 带来的工程范式变化。
- 互动提问：如果 AI 已经能写很多代码，软件工程真正该升级什么？

屏幕信息：

本页以“COVER”为视觉段落，围绕标题“AI 如何重新定义软件开发”展开。

讲稿：

各位好，今天分享的主题还是《AI 如何重新定义软件开发》。这一版会更聚焦一个问题：AI 带来的变化不只是代码生成变快，而是软件工程开始从“管理人写代码”转向“管理人、AI、工具和证据共同协作”。BitFun 只是引子，我们不会展开项目细节，而是借它讨论未来工程系统如何吸收概率性产出、如何重新定义质量责任，以及开发者在新系统里应该站在哪里。

转场：

先看目录，四个主题从案例、速度、治理一路落到开发者角色。

### 第 2 页：报告目录

- 建议时长：约 0.5 分钟
- 页内重点：目录页：四个大模块不超过四个，标题按用户建议调整。
- 互动提问：这 15 分钟，哪些问题最值得带走？

屏幕信息：

本页以“AGENDA”为视觉段落，围绕标题“报告目录”展开。

讲稿：

这场报告分四个模块。第一是软件工程变革，先从 BitFun 的高速 AI 开发经验出发，再推导到智能协作系统。第二是速度的背后，讨论为什么产出变快并不等于交付线性变快，以及概率性过程如何通过确定性证据获得高置信度。第三是工程质量与治理，结合外部报告和 BitFun 方法论，看质量门禁、DFX、TDD、Artifact 治理会怎样演进。第四是开发者角色，讨论人在这个系统里如何找到关键位置，而不是只停留在“会不会被替代”的问题上。

转场：

先从一个最直观的案例入口开始：代码量变大之后，问题到底有没有变少。

### 第 3 页：数十万行代码之后，问题真的变少了吗？

- 建议时长：约 1.4 分钟
- 页内重点：先案例后抽象：把 BitFun 作为实际入口，而不是先讲概念。
- 互动提问：如果一个项目一个月写出数十万行代码，第一反应该是兴奋还是审计？

屏幕信息：

本页以“01 / SOFTWARE CHANGE”为视觉段落，围绕标题“数十万行代码之后，问题真的变少了吗？”展开。

讲稿：

先从一个具体入口看：如果借助 AI，一个项目短时间内可以产生数十万行代码，这当然说明局部编码能力被放大了。但这里最有价值的不是数字，而是它暴露出的工程问题：需求变化会更频繁，原型验证会更快，个人可以先完成过去需要小团队配合的工作；与此同时，测试、review、架构理解、运行验证、知识沉淀不一定同步扩张。也就是说，代码量的膨胀不一定带来交付节奏等比例膨胀，它更像是把系统瓶颈从“写不出来”推向“能否验证、能否维护、能否协作、能否上线”。

转场：

由这个案例往上推，就能看到 AI 时代软件工程对象正在发生扩张。

### 第 4 页：从人 + 人，到人 + 人 + Agent + Agent

- 建议时长：约 1.5 分钟
- 页内重点：用协作拓扑替换抽象结论：同步 pair、异步委派、角色化 Agent、人工放行。
- 互动提问：当 Agent 也能开分支、跑测试、提交 PR 时，团队协作到底变了什么？

屏幕信息：

本页以“01 / SOFTWARE CHANGE”为视觉段落，围绕标题“从人 + 人，到人 + 人 + Agent + Agent”展开。

讲稿：

从 BitFun 这个案例往上抽象，AI 重新定义软件开发，不只是因为模型能写函数，而是团队协作拓扑变了。第一阶段是人加 AI 的同步 pair coding，AI 在 IDE 里帮你补全、解释和修改。第二阶段是异步委派，比如 GitHub Copilot cloud agent 或 Codex cloud：你把 issue 或任务交给 Agent，它在独立环境里研究、建分支、跑测试、准备 PR。第三阶段是角色化 Agent：实现、测试、评审、安全、文档不一定由同一个 Agent 完成，而是通过 subagents、hooks、trace 和工作流编排形成分工。第四阶段仍然是人类放行：人不需要监督每一步 prompt，而是看目标是否达成、证据包是否足够、风险是否可接受、是否可以合并或发布。所以协作对象从人和人，扩展成了人、Agent、工具和证据共同工作的系统。

转场：

接下来讨论速度：为什么 AI 让探索更快，但不保证交付自然变稳。

### 第 5 页：速度的背后：概率执行，证据放行

- 建议时长：约 1.5 分钟
- 页内重点：加入概率性问题、高置信度、开发者信任与产品可信的关系。
- 互动提问：同样的模型，为什么有的 Agent 可信，有的 Agent 不可信？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“速度的背后：概率执行，证据放行”展开。

讲稿：

AI 介入之后，研发节奏会从排期驱动部分转向想法驱动：先快速探索，再用证据决定是否继续。但这里的核心不是“模型每次都确定正确”，恰恰相反，模型生成天然带有概率性。新的软件工程范式更像是：允许执行过程多路径探索，但最终放行必须依赖可复现证据。开发者信任来自 Agent 层的保护，比如只读计划、沙箱执行、危险操作拦截、失败回注上下文、trace 可回放；产品可信来自测试、评估集、灰度、监控和人工审批。换句话说，我们不是消灭概率性，而是把概率性关进可观察、可比较、可回滚的工程边界里。

转场：

更尖锐的问题是：如果模型本身、团队使用的模型和多 Agent 链路都在波动，工程系统怎么收敛？

### 第 6 页：用可控系统收敛不可控过程

- 建议时长：约 1.2 分钟
- 页内重点：补充模型波动、概率串联衰减、Agent Team 错误放大，以及阶段性纠错系统。
- 互动提问：如果每一步都有 99% 正确率，十步之后系统还可信吗？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“用可控系统收敛不可控过程”展开。

讲稿：

这里可以把问题说得更硬一点：AI 的不确定性不只来自某一次回答。团队里不同人可能使用不同模型，同一个模型不同版本能力会变化，甚至在 temperature 很低时同一评审任务也可能出现不一致。再往上，如果一个 Agent Team 中每一步都把前一步的自然语言结论当事实输入，错误就会像串联系统一样累乘：0.99 的十次方大约只有 0.90；更糟的是，很多错误不是独立随机错误，而是会被后续步骤继承并放大。但治理对象要切清楚：模型、提示词、工具调用这些是后台 telemetry，用于复现、审计和失败排查，不应该变成人类日常评审的主要对象。人类应该判断的是交付对象：需求意图是否明确，代码变更是否完整，测试和运行证据是否足够，风险和回滚是否可接受。阶段门禁就是放在阶段转换处的自动控制点，比如从计划到实现、从实现到评审、从评审到合并。它检查的是交付对象和证据包，而不是每一步操作日志：接口契约、影响范围、构建测试、静态检查、风险标签、owner 和回滚路径。Artifact 也要收窄成可长期管理的关键工程产物，包括需求/任务、设计决策、代码 diff、测试证据、评审结论、发布与回滚记录。系统把复杂执行过程压缩成摘要、差异、来源、不一致提示和风险解释，帮助人做判断；只有在高风险、证据冲突或事故复盘时，才需要下钻到模型和执行轨迹。

转场：

有了这层纠偏系统，再看外部数据，会更容易理解为什么速度收益不是天然指数级增长。

### 第 7 页：速度收益不是指数曲线

- 建议时长：约 1.2 分钟
- 页内重点：补外部信息：DORA、METR、Harness 作为市场和研究佐证。
- 互动提问：为什么开发者感觉更快，团队整体却未必同等加速？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“速度收益不是指数曲线”展开。

讲稿：

外部研究给了我们一个更冷静的视角。DORA 2025 把 AI 描述为组织系统的放大器：高质量组织会被放大，原本碎片化的流程也会被放大；同时它也提醒，采用 AI 不等于自动获得收益，组织需要同步演进文化、流程和系统。METR 在 2025 对成熟开源项目做随机对照实验，发现经验开发者使用当时的 AI 工具反而慢 19%；2026 年 METR 又提醒，AI 工具正在进化，任务选择和多 Agent 使用让测量本身也变难。Harness 2026 则把问题落到工程管理上：很多团队的生产力指标变好，但 code review、修 bug、工具切换等隐形工作也在上升。结论不是 AI 没用，而是不要只用代码量衡量收益。

转场：

所以第一个真正被重新定义的东西，是质量责任。

### 第 8 页：速度放大之后，质量责任被重新定义

- 建议时长：约 1.0 分钟
- 页内重点：优化第六页：放大中部内容，解释从能跑到可放行的距离。
- 互动提问：AI 生成的代码能跑之后，距离可合并、可发布、可长期维护还差什么？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“速度放大之后，质量责任被重新定义”展开。

讲稿：

当速度被放大之后，质量责任会从“这个功能能不能跑”扩展到“谁确认它可以进入系统”。功能能跑，只说明 happy path 暂时成立；设计不沉淀，意味着需求变化没有变成可复用的决策记录；协作被压缩，意味着个人加 Agent 很快，但团队共识可能不足；修复凭自信，意味着 Agent 可以给出看似合理的 patch，却没有复现、日志和验证。这里的关键是把“高置信度”从模型自信改成工程证据：证据不是附属材料，而是进入合并、发布和复盘的主路径。

转场：

质量责任落地以后，工程治理需要从门禁转向更细的智能护栏。

### 第 9 页：工程质量：从门禁到智能护栏

- 建议时长：约 1.4 分钟
- 页内重点：合并原第七/第八页的重复信息，突出责任链、证据链与小批量反制不稳定。
- 互动提问：AI 让提交变多以后，维护者和大厂平台到底该看什么？

屏幕信息：

本页以“03 / QUALITY GOVERNANCE”为视觉段落，围绕标题“工程质量：从门禁到智能护栏”展开。

讲稿：

原先第七页和第八页容易讲成重复的质量术语，这里把它收敛为一个治理问题：开源高质量协作强调公共责任，维护者要提升对陌生贡献或 AI-assisted 变更质量的信任度；大厂复杂交付强调系统连续性，组织要处理 owner、依赖链、合规、发布窗口、线上事故成本，以及贯穿整个系统的确定性工件。两者都不能只靠“多跑测试”。更有效的做法是把变化拆小，把责任、证据和 Artifact 绑定到每个小批次：谁拥有模块，谁确认设计边界，哪些测试和运行指标证明可以前进，失败时如何回滚。

转场：

再往前看，DFX、TDD、架构守护都会出现 AI 时代的新形态。

### 第 10 页：下一代工程方法：让 DFX 与 TDD 变成 Agent 协议

- 建议时长：约 1.3 分钟
- 页内重点：回应 DFX/TDD 新形态：非特定工程的 AI 下解决方案、细化军规、用例形态升级。
- 互动提问：如果代码军规仍会被幻觉绕过，下一层护栏是什么？

屏幕信息：

本页以“03 / QUALITY GOVERNANCE”为视觉段落，围绕标题“下一代工程方法：让 DFX 与 TDD 变成 Agent 协议”展开。

讲稿：

这里可以做一个前瞻判断：AI 时代的 DFX 不会只是 Design for X 的静态清单，而会变成一组可执行的 Agent 协议。比如性能、可观测性、安全、可维护性，不再只写在规范里，而是以检查项、基准、trace、回归用例、发布预算的形式进入 Agent 工作流。TDD 也会扩展：不只是先写单元测试再写实现，而是先定义失败证据、属性约束、运行观测和评估集，再让 Agent 在这些证据边界里修改。代码军规仍会有幻觉，所以规则要更细，但更关键的是规则要可执行：能被工具检查、能被 trace 回放、能被 review 独立仲裁。

转场：

把这些方法落到 BitFun，就能看到一个 Agent 工程系统的雏形。

### 第 11 页：BitFun 的价值：把开发过程组织成团队工作流

- 建议时长：约 1.4 分钟
- 页内重点：把第九页落到可执行方法：Spec/Issue -> Agent Worktree -> Evidence Packet -> Independent Review -> Gate/Merge。
- 互动提问：如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？

屏幕信息：

本页以“03 / QUALITY GOVERNANCE”为视觉段落，围绕标题“BitFun 的价值：把开发过程组织成团队工作流”展开。

讲稿：

回到 BitFun，它不是要证明某个模型更强，而是展示一个团队工作流的雏形。更可落地的做法是把一次 AI 开发压成五个稳定环节：第一，任务从 Issue 或 Spec 进入，明确目标、非目标和风险边界；第二，Agent 在隔离工作区执行，避免把探索过程直接污染主分支；第三，执行结束必须生成证据包，包括 diff 摘要、测试结果、日志、trace、未决风险和回滚路径；第四，评审要角色分离，发现问题、仲裁问题、修复问题、验证修复尽量不要由同一个角色闭环；第五，阶段门禁决定能否进入 PR、合并或发布。这里的关键不是记录每一步操作，而是把复杂过程压缩成团队能读、能审、能追责的交付对象和证据。

转场：

最后，我们把视角切回开发者：人在这样的系统里到底做什么。

### 第 12 页：开发者角色：在新工程系统中找准位置

- 建议时长：约 1.5 分钟
- 页内重点：重做第十页：收敛为四步，明确人在各阶段和 AI 在各阶段的角色。
- 互动提问：AI 参与每个阶段后，人类开发者最不可替代的技能是什么？

屏幕信息：

本页以“04 / DEVELOPER ROLE”为视觉段落，围绕标题“开发者角色：在新工程系统中找准位置”展开。

讲稿：

对学生来说，这页很关键：未来不是“人写代码，AI 帮忙补全”，而是人在不同阶段承担不同关键角色。第一步是定义问题，人负责价值判断、非目标和风险边界，AI 可以帮助整理信息和生成备选方案。第二步是组织上下文，人负责架构取舍和事实源选择，AI 负责检索、摘要和草拟计划。第三步是编排执行，人负责设置权限、节奏、验证矩阵和停止条件，AI 负责生成、修改、运行和反馈。第四步是证据放行，人负责最终责任、质量解释和复盘沉淀，AI 提供 trace、diff、测试结果和改进建议。所以编程基础仍重要，但能力结构会从语法实现，升级到问题定义、系统判断、证据审查和协作治理。

转场：

最后用三条未来判断收束：未来几年软件工程会往哪里走。

### 第 13 页：三个未来判断

- 建议时长：约 0.9 分钟
- 页内重点：压缩前瞻页，作为收束而不是新增概念。
- 互动提问：未来两三年，软件工程里最先被重写的指标和方法是什么？

屏幕信息：

本页以“04 / DEVELOPER ROLE”为视觉段落，围绕标题“三个未来判断”展开。

讲稿：

最后用三条判断收束，不再展开新概念。第一，指标会从代码行数、commit 数转向净收益：需求到证据的时间、评审负担、返工率、故障恢复和知识沉淀。第二，角色会从单一开发者扩展成任务 owner、Agent 编排者、证据审查者和系统治理者，人的价值更多在目标、边界、取舍和责任。第三，工程协议会越来越重要：TDD、DFX、Code Review 不只是人的流程习惯，而会变成 Agent 可读取、可执行、可产证据的协议。未来优秀的软件人才，不只是会用 AI 写代码，而是能把 AI 放进可靠工程系统里工作。

转场：

最后进入 Q&A。

### 第 14 页：谢谢

- 建议时长：Q&A
- 页内重点：致谢页：去掉上方答疑互动说明，只保留主题和互动问题。
- 互动提问：围绕 AI 编程、工程治理和开发者角色继续讨论。

屏幕信息：

本页以“THANKS AND Q&A”为视觉段落，围绕标题“谢谢”展开。

讲稿：

以上就是主要内容。最后留两个问题和一个方向给大家：如果 AI 能显著扩大个人产出，团队还应该用什么指标判断真实收益？如果执行过程允许概率性，哪些证据必须保持确定性？以及开发者的技术成长会向哪些方向延伸，比如架构判断、上下文组织、证据设计和工程治理。接下来进入答疑互动。

转场：

答疑互动。
