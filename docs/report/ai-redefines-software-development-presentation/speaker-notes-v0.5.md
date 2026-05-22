# AI 如何重新定义软件开发：分页演讲稿

建议时长：15 分钟。建议页数：13 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。

## 报告简介

本报告以 BitFun 为引子，讨论 AI 如何从代码补全走向 Agentic Coding，并进一步影响软件开发全生命周期。内容将结合 Context Engineering、质量门禁、平台工程与人类监督等概念，分析企业研发流程、工程治理方式和开发者角色的变化，理解 AI 时代软件工程从“写代码”走向“组织智能协作系统”的新范式。

## 可引用调研

- Google / DORA 2025（https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/）：80% 以上受访者认为 AI 提升生产力，59% 认为代码质量改善；但报告同时提出 trust paradox，并强调 AI 是组织的 mirror and multiplier，采用工具之外还需要文化、流程和系统演进。
- DORA GenAI report 2025.2（https://dora.dev/ai/gen-ai-report/dora-impact-of-generative-ai-in-software-development.pdf）：报告提醒新技术采用可能带来短期生产率下降，也指出 AI 提高代码生成速度后，小批量、稳健测试等基本工程原则更重要。
- METR Early-2025 RCT（https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf）：16 位成熟开源开发者在熟悉项目中完成 246 个真实任务，使用当时 AI 工具后任务耗时增加 19%，适合作为“大型复杂工程收益不线性”的反例。
- METR 2026 update（https://metr.org/blog/2026-02-24-uplift-update/）：METR 提醒多 Agent 并行和开发者不愿脱离 AI 等因素会让 AI 生产率测量本身变得更难，适合引出“指标重写”。
- Harness State of Engineering Excellence 2026（https://www.harness.io/press-and-news/ai-has-outpaced-how-engineering-organizations-measure-developer-productivity）：81% 受访者认为采用 AI coding tools 后 code review 时间增加，约 31% 开发者时间进入 review、修 bug、工具切换等隐形工作。
- Harness DevOps Modernization 2026（https://www.harness.io/state-of-modernization-2026）：频繁使用 AI coding 的团队同时报告部署问题、回滚/热修复、MTTR、合规和性能压力等下游挑战，适合支撑“速度要与风险一起衡量”。
- Stack Overflow Developer Survey 2025（https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/）：84% 开发者使用或计划使用 AI 工具，但 46% 不信任 AI 输出准确性，45% 认为调试 AI 生成代码耗时，适合支撑“AI 已普及，但信任和验证成为核心能力”。
- Sonar State of Code Developer Survey 2026（https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/）：AI 已占开发者提交代码的 42%，预计 2027 年达到 65%；96% 开发者不完全信任 AI 代码，但只有 48% 总是在提交前验证，适合引出 verification debt。
- Anthropic, How AI assistance impacts the formation of coding skills（https://www.anthropic.com/research/AI-assistance-coding-skills）：52 名以 junior 为主的软件工程师受控实验显示，AI 组在学习新库后的测验分数低 17%，差距尤其体现在调试与理解；但要求解释、概念追问和先生成后理解等方式能缓解技能流失。
- Agentic Much? Adoption of Coding Agents on GitHub（https://arxiv.org/abs/2601.18341）：对 128,018 个 GitHub 项目的大规模研究估计 coding agent 采用率达到 22.20%--28.66%，且 agent-assisted commits 通常比纯人工提交更大，说明新人进入职场时面对的已经是 Agentic Coding 常态。
- AI IDEs or Autonomous Agents? Measuring the Impact of Coding Agents on Software Development（https://cmustrudel.github.io/papers/msr2026agarwal.pdf）：MSR 2026 研究区分 IDE assistant 与 autonomous agent，发现前置速度收益并不稳定，而静态分析警告和认知复杂度等质量风险可能持续增加，支撑“速度提升必须绑定质量护栏”。
- From Junior to Senior: Allocating Agency and Navigating Professional Growth in Agentic AI-Mediated Software Engineering（https://arxiv.org/abs/2602.00496）：CHI 2026 研究提出 junior 与 senior 在 agentic AI 下的 agency 分配不同，新人容易在过度依赖与谨慎回避之间摇摆，建议把 coding、learning、mentorship 的 agency 作为组织设计对象。
- Configuring Agentic AI Coding Tools: An Exploratory Study（https://arxiv.org/abs/2602.14690）：AIware 2026 研究分析 Claude Code、GitHub Copilot、Cursor、Gemini、Codex 等工具的配置机制，指出 AGENTS.md 等仓库级上下文文件正在成为跨工具起点，说明上下文组织本身已成为工程技能。
- Gartner Enterprise AI Coding Agents press release（https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment）：Gartner 预测到 2027 年超过 65% 使用 agentic coding 的工程团队会把 IDE 视为可选入口，治理、验证和控制将更多转向自动化平台，适合支撑“开发者工作台正在平台化”。
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
- Microsoft Research AgentRx（https://www.microsoft.com/en-us/research/blog/systematic-debugging-for-ai-agents-introducing-the-agentrx-framework/）：把 agent 执行轨迹规范化为可验证 trace，用约束检查和失败分类定位关键失败步骤，适合支撑“失败回到系统，而不是只回到人脑”。
- OpenAI, A Practical Guide to Building Agents（https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf）：强调模型、工具、指令和 guardrails 是 Agent 基础构件，并建议以 evals 建立性能基线、按任务选择模型。
- AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents（https://arxiv.org/abs/2605.13357）：提出把模型、harness 与环境作为整体系统来评价，harness 负责任务规格、上下文选择、工具访问、观测、验证、权限、熵审计和干预记录，支撑“能力不只在模型，也在运行基座”。
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

这场报告分四个模块。第一是软件工程变革，先从 BitFun 的高速 AI 开发经验出发，再补一页传统软件工程到人加 Agent 协作的模式变化。第二是速度的背后，讨论为什么产出变快并不等于交付线性变快，以及概率性过程如何通过确定性证据获得高置信度。第三是工程质量与治理，把质量、DFX、TDD、Artifact 与团队工作流收敛成两页方法。第四是开发者角色，讨论人在这个系统里如何找到关键位置，并给刚入职场的同学一些更可执行的能力方向。

转场：

先从一个最直观的案例入口开始：代码量变大之后，问题到底有没有变少。

### 第 3 页：单月 10W+ 行代码之后，问题真的变少了吗？

- 建议时长：约 1.4 分钟
- 页内重点：先案例后抽象：把 BitFun 作为实际入口，而不是先讲概念。
- 互动提问：如果一个项目单月写出 10W+ 行代码，第一反应该是兴奋还是审计？

屏幕信息：

本页以“01 / SOFTWARE CHANGE”为视觉段落，围绕标题“单月 10W+ 行代码之后，问题真的变少了吗？”展开。

讲稿：

先从一个具体入口看：在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日的一个月窗口统计，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行、删除 46,479 行。这个统计口径不用于证明代码越多越好，而是作为一个压力测试入口：当代码生产速度被 AI 放大以后，需求变化会更频繁，原型可以更快从想法变成可运行样例，个人也可以先完成过去需要小团队配合的探索工作；与此同时，测试、review、架构理解、运行验证、知识沉淀不一定同步扩张。也就是说，代码量的膨胀不一定带来交付节奏等比例膨胀，它更像是把系统瓶颈从“写不出来”推向“能否验证、能否维护、能否协作、能否上线”。

转场：

由这个案例往上推，就能看到 AI 时代软件工程对象正在发生扩张。

### 第 4 页：主线：产出放大后，协作对象变了

- 建议时长：约 1.2 分钟
- 页内重点：承接 BitFun 案例，说明代码产出放大后，协作对象从代码扩展到任务委派、角色分工、证据放行，并用实际文档/验证片段展示证据形态。
- 互动提问：当 Agent 也能开分支、跑测试、提交 PR 时，团队到底要管理什么？

屏幕信息：

本页以“01 / SOFTWARE CHANGE”为视觉段落，围绕标题“主线：产出放大后，协作对象变了”展开。

讲稿：

由 BitFun 的高速开发经验往上推，主线不是“AI 多写了代码”，而是协作对象变了。过去我们主要管理人和人之间的协作，以及代码进入仓库的流程；现在多了异步 Agent、角色化 Agent、工具执行、测试结果、trace、风险说明和回滚路径。这页只讲三个变化。第一，任务委派：你不只是让 AI 写一段代码，而是把目标、非目标、影响范围和验收标准交给 Agent，让它在独立工作区探索。第二，角色分工：实现、测试、评审、安全、文档不一定由同一个 Agent 或同一个流程完成，团队要管理权限、上下文和生命周期。第三，证据放行：人看的重点不是每一步 prompt，而是目标是否明确、证据是否足够、风险是否可接受、责任是否能落地。所以 AI 时代的软件工程，不是多一个助手，而是把任务、证据和责任一起纳入协作系统。

转场：

协作对象变多以后，真正的治理问题就出现了：AI 可以概率性探索，但系统必须确定性放行。

### 第 5 页：从传统 SDLC 到人 + Agent SDLC

- 建议时长：约 1.0 分钟
- 页内重点：为高校听众补齐复杂项目中的角色、流程和交付件，再说明 AI 进入后变化在哪里。
- 互动提问：如果没有做过完整复杂项目，怎么理解软件工程不是“写代码”这一件事？

屏幕信息：

本页以“01 / SOFTWARE CHANGE”为视觉段落，围绕标题“从传统 SDLC 到人 + Agent SDLC”展开。

讲稿：

为了避免把软件工程讲成抽象概念，这里补一页传统模式。过去一个完整项目通常不是一个人从头写到尾，而是产品定义需求和验收，设计给出交互和视觉，开发拆分模块和接口，测试建立用例和回归，运维关注发布、监控和故障恢复。每个角色都有交付件：PRD、设计稿、接口文档、代码和 PR、测试报告、发布记录、监控告警。AI 进入以后，角色不会简单消失，但交付件会变化。产品和开发要把目标、非目标、边界和验收标准写得更清楚；Agent 在隔离工作区里生成计划、代码、测试和日志；平台用 CI、权限、trace 和风险规则做阶段门禁；人类负责最终取舍、责任解释和发布放行。这个变化的核心是：软件工程从人和人之间交接文档，变成 人、人、Agent、Agent 与平台共同维护可验证证据。

转场：

有了这个完整流程视角，再讨论概率过程和证据放行就更具体。

### 第 6 页：关键机制：概率过程，证据放行

- 建议时长：约 1.6 分钟
- 页内重点：说明如何用 Harness 保护、证据包、阶段门禁和人工判断收敛概率性过程。
- 互动提问：如果每一步都有 99% 正确率，十步之后系统还可信吗？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“关键机制：概率过程，证据放行”展开。

讲稿：

这页是前面协作变化之后的关键机制：我们不要求 AI 的每一步都确定正确，而是允许过程概率性探索，同时把结果放行建立在确定性证据上。AI 的不确定性不只来自某一次回答，团队里不同人可能使用不同模型，同一模型不同版本能力也会波动；如果一个 Agent Team 中每一步都把前一步结论当事实输入，错误会像串联系统一样累乘，0.99 的十次方大约只有 0.90。解决办法不是让人类盯住每一步 prompt，而是建立阶段门禁和证据包。左边是概率探索层，Harness 要提供沙箱、权限、危险操作拦截、失败回注和 trace；中间是证据包，把 diff、测试、日志、风险、回滚路径压缩成人能判断的交付对象；右边是阶段门禁，在计划到实现、实现到评审、评审到合并这些阶段转换处检查完整性、契约、测试、owner 和风险。人类参与的重点也从过程监督变成判断辅助：看摘要、差异、来源、不一致提示和风险解释。也就是说，用可控系统解决不可控过程，核心不是记录更多细节，而是把复杂过程收敛为可审查、可复现、可回滚的证据。

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

### 第 8 页：速度的代价：把返工变成可管理队列

- 建议时长：约 1.3 分钟
- 页内重点：把速度提升后的隐形成本落到可执行的度量、分流和修复闭环。
- 互动提问：当 AI 让代码进入仓库的速度变快，团队怎样避免 review、返工和集成变成新瓶颈？

屏幕信息：

本页以“02 / BEHIND SPEED”为视觉段落，围绕标题“速度的代价：把返工变成可管理队列”展开。

讲稿：

前一页说速度收益不是指数曲线，这一页回答“代价该怎么处理”。AI 让写代码变快以后，新的瓶颈通常不是打字速度，而是 review 队列、返工循环、CI 不稳定、跨团队集成和线上恢复。第一步要把成本显性化：不要只看生成了多少代码，而要看从需求到可验证结果的净时间、PR 等待、返工率、失败重跑、MTTR。METR 的开源开发者实验提醒我们，熟悉项目里使用 AI 也可能变慢；Harness 的报告则说明，评审、修 bug、工具切换会成为隐形工作。第二步是入口风险分流：不是所有 AI 变更都走同一条审批线，而是按 owner、diff 大小、模块热度、SLO 影响做风险打标，低风险自动验证，高风险进入设计和人工评审。第三步是闭环修复：SWE-CI 把 Agent 评估放进连续集成循环，SWE-PRBench 提醒 AI 评审还不能当最终裁决，AgentTrace 和 AgentRx 这类工作则把失败步骤和根因变成可定位对象。这样速度提升才不会把成本甩给最后一个 reviewer，而是进入一个可度量、可分流、可修复的工程队列。

转场：

把代价管住以后，下一步才是讨论开源和大厂场景下的质量治理形态。

### 第 9 页：工程质量：责任、证据与工程协议

- 建议时长：约 1.5 分钟
- 页内重点：合并质量治理与 DFX/TDD 方法演进，突出责任链、证据链、Artifact 链和工程协议。
- 互动提问：AI 让提交变多以后，维护者和大厂平台到底该看什么？

屏幕信息：

本页以“03 / QUALITY GOVERNANCE”为视觉段落，围绕标题“工程质量：责任、证据与工程协议”展开。

讲稿：

这部分把原来三页收敛成两页，避免变成重复的质量术语。开源高质量协作强调公共责任：贡献者要对自己的提交负责，维护者要提升对陌生贡献或 AI-assisted 变更质量的信任度。大厂复杂交付强调系统连续性：组织要处理 owner、依赖链、合规、发布窗口、线上事故成本，以及贯穿整个系统的确定性工件。两者共同的方向，是把质量要求变成可执行证据。DFX、TDD、Code Review 不应该只停留在文档和习惯里，而要进入 Agent 能读取、工具能检查、人能复核的工程协议：性能、安全、可观测、可维护都要能落到检查项、基准、trace、回归用例和发布预算上。

转场：

这些协议真正落地时，会表现为一个可治理的团队工作流。

### 第 10 页：把 AI 开发组织成可治理工作流

- 建议时长：约 1.5 分钟
- 页内重点：把质量治理落到可执行方法：Spec/Issue -> Agent Worktree -> Evidence Packet -> Independent Review -> Gate/Merge。
- 互动提问：如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？

屏幕信息：

本页以“03 / QUALITY GOVERNANCE”为视觉段落，围绕标题“把 AI 开发组织成可治理工作流”展开。

讲稿：

回到 BitFun，它不是要证明某个模型更强，而是展示一个团队工作流的雏形。更可落地的做法是把一次 AI 开发压成五个稳定环节：第一，任务从 Issue 或 Spec 进入，明确目标、非目标和风险边界；第二，Agent 在隔离工作区执行，避免把探索过程直接污染主分支；第三，执行结束必须生成证据包，包括 diff 摘要、测试结果、日志、trace、未决风险和回滚路径；第四，评审要角色分离，发现问题、仲裁问题、修复问题、验证修复尽量不要由同一个角色闭环；第五，阶段门禁决定能否进入 PR、合并或发布。这里的关键不是记录每一步操作，而是把复杂过程压缩成团队能读、能审、能追责的交付对象和证据。

转场：

最后，我们把视角切回开发者：人在这样的系统里到底做什么。

### 第 11 页：开发者角色：在新工程系统中找准位置

- 建议时长：约 1.5 分钟
- 页内重点：收敛为四步，明确人在各阶段和 AI 在各阶段的角色。
- 互动提问：AI 参与每个阶段后，人类开发者最不可替代的技能是什么？

屏幕信息：

本页以“04 / DEVELOPER ROLE”为视觉段落，围绕标题“开发者角色：在新工程系统中找准位置”展开。

讲稿：

对学生来说，这页很关键：未来不是“人写代码，AI 帮忙补全”，而是人在不同阶段承担不同关键角色。第一步是定义问题，人负责价值判断、非目标和风险边界，AI 可以帮助整理信息和生成备选方案。第二步是组织上下文，人负责架构取舍和事实源选择，AI 负责检索、摘要和草拟计划。第三步是编排执行，人负责设置权限、节奏、验证矩阵和停止条件，AI 负责生成、修改、运行和反馈。第四步是证据放行，人负责最终责任、质量解释和复盘沉淀，AI 提供 trace、diff、测试结果和改进建议。所以编程基础仍重要，但能力结构会从语法实现，升级到问题定义、系统判断、证据审查和协作治理。

转场：

最后把视角落到刚入职场的同学：AI 时代哪些能力更值得优先练。

### 第 12 页：刚入职场：四个能力方向

- 建议时长：约 1.1 分钟
- 页内重点：结合最新调研与论文，把开发者角色变化落到新人工程师可执行的能力方向。
- 互动提问：当 AI 可以帮你更快完成任务，第一年最应该刻意训练什么？

屏幕信息：

本页以“04 / DEVELOPER ROLE”为视觉段落，围绕标题“刚入职场：四个能力方向”展开。

讲稿：

最后把问题落到刚入职场的同学。外部信号其实很一致：Stack Overflow 2025 里 84% 开发者使用或计划使用 AI，但 46% 不信任 AI 输出准确性；Anthropic 2026 的受控实验显示，使用 AI 的参与者在刚学新库后的概念测验中低 17%，尤其是调试和理解能力受影响；Sonar 2026 则显示 AI 已经占到相当比例的提交代码，但只有不到一半开发者总是提交前验证。也就是说，新人的问题不是要不要用 AI，而是如何不把成长路径外包给 AI。这里给四个更可执行的方向。第一，保留代码读写与调试基本功：至少能解释核心实现、能复现错误、能定位边界条件。第二，训练证据驱动交付：把测试、CI、日志、trace、review 作为交付的一部分，而不是写完代码后的附属品。第三，理解需求与用户场景：软件工程师不会只承担单纯开发角色，要逐步理解用户路径、产品定位、体验约束和验收标准，才能把 AI 生成结果放进正确问题里。第四，承担责任边界：AI 可以生成和修复，人仍然要判断该不该做、能不能合、出了问题如何解释。对新人来说，更实际的升级路径是把“能写代码”升级为“能理解问题并可靠交付”，在需求理解、证据交付和责任判断上建立自己的专业位置。

转场：

最后进入 Q&A。

### 第 13 页：谢谢

- 建议时长：Q&A
- 页内重点：致谢页：去掉上方答疑互动说明，只保留主题和互动问题。
- 互动提问：围绕 AI 编程、工程治理和开发者角色继续讨论。

屏幕信息：

本页以“THANKS AND Q&A”为视觉段落，围绕标题“谢谢”展开。

讲稿：

以上就是主要内容。最后留两个问题和一个方向给大家：如果 AI 能显著扩大个人产出，团队还应该用什么指标判断真实收益？如果执行过程允许概率性，哪些证据必须保持确定性？以及开发者的技术成长会向哪些方向延伸，比如架构判断、上下文组织、证据设计和工程治理。接下来进入答疑互动。

转场：

答疑互动。
