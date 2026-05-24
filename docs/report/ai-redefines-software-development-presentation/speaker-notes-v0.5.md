# AI 如何重新定义软件开发：分页演讲稿

建议时长：15 分钟。建议页数：13 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。
节奏校验：当前分页讲稿标注合计约 15 分钟，其中主体讲述约 14.2 分钟，收束与 Q&A 入口约 0.8 分钟。

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

## 15 分钟演讲节奏

按正常中文演讲语速，标题页和目录页快速进入主题，核心内容页保持 1.1-1.5 分钟，最后一页用于收束和引出互动。讲稿正文按口播方式组织，可以直接作为演讲者手卡使用。

- 第 1 页：约 0.5 分钟｜AI 如何重新定义软件开发
- 第 2 页：约 0.6 分钟｜报告目录
- 第 3 页：约 1.4 分钟｜单月 10W+ 行代码之后，问题真的变少了吗？
- 第 4 页：约 1.3 分钟｜主线：产出放大后，协作对象变了
- 第 5 页：约 1.2 分钟｜从传统 SDLC 到人 + Agent SDLC
- 第 6 页：约 1.4 分钟｜关键机制：概率过程，证据放行
- 第 7 页：约 1.2 分钟｜速度收益不是指数曲线
- 第 8 页：约 1.3 分钟｜速度的代价：把返工变成可管理队列
- 第 9 页：约 1.4 分钟｜工程质量：责任、证据与工程协议
- 第 10 页：约 1.3 分钟｜把 AI 开发组织成可治理工作流
- 第 11 页：约 1.5 分钟｜开发者角色：在新工程系统中找准位置
- 第 12 页：约 1.1 分钟｜刚入职场：四个能力方向
- 第 13 页：约 0.8 分钟（收束 + Q&A 入口）｜谢谢

## 分页讲稿

### 第 1 页：AI 如何重新定义软件开发

- 建议时长：约 0.5 分钟
- 讲述目标：建立演讲边界：讨论对象不是某个工具，而是 AI 进入研发流程后，工程协作、验证和责任如何变化。
- 可选提问：如果 AI 已经能写很多代码，软件工程真正该升级什么？

讲稿：

各位好，今天分享的主题是《AI 如何重新定义软件开发》。我想先把范围说清楚：今天不做工具演示，也不做某个项目的复盘，而是借 BitFun 这个具体入口，讨论一个更大的变化。当 AI 从补全一行代码，走向能开任务、改代码、跑测试、提交 PR 时，软件开发被改变的就不只是写代码的速度。真正被改写的是工程系统本身：任务如何被委派，证据如何被沉淀，风险如何被放行，最后责任如何落到人和组织上。

转场：

先用目录把 15 分钟的路径铺开：从案例入口，到速度背后的代价，再到质量治理和开发者角色。

### 第 2 页：报告目录

- 建议时长：约 0.6 分钟
- 讲述目标：说明四段主线：产出放大、速度代价、质量治理、开发者角色。
- 可选提问：这 15 分钟里，大家最想带走的是工具判断、工程方法，还是个人成长路径？

讲稿：

今天会沿着四段往下讲。第一段从一个很具体的现象开始：当 AI 让一个项目在短时间内产生大量代码，问题是不是就少了，还是被转移到了验证和维护上。第二段看速度背后，为什么局部开发变快，不等于团队交付天然变快。第三段讨论质量治理，重点不是再加一层审批，而是让责任、证据和工程协议变得可执行。第四段回到开发者本人，尤其是刚进入职场的人，应该把能力训练放在哪里。听完之后，希望大家带走的不是某个工具结论，而是一套判断 AI 研发收益和风险的工程视角。

转场：

先看第一个现象：代码量突然放大之后，团队真正面对的压力是什么。

### 第 3 页：单月 10W+ 行代码之后，问题真的变少了吗？

- 建议时长：约 1.4 分钟
- 讲述目标：用 BitFun 统计做压力测试：代码产出扩大后，瓶颈转向验证、维护、协作和上线。
- 可选提问：如果一个项目单月写出 10W+ 行代码，第一反应该是兴奋，还是先问怎么验证？

讲稿：

先看一个具体数字。在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日为窗口，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行，删除 46,479 行。这个数字不是为了说明代码越多越好，而是一个很好的压力测试：当 AI 把代码生产速度放大之后，原型可以更快落地，想法可以更快变成 PR，个人也能承担过去需要多人协同的探索工作。但同一时间，测试、review、架构理解、运行验证和知识沉淀不会自动同速扩张。可以把注意力放在右侧的 Git 快照和下方的快速路径上：代码进入仓库变快了，反馈路径也要跟上，否则快只是把问题更早推到 reviewer、CI 和线上环境里。所以真正的问题从“能不能写出来”转向“凭什么能合并、凭什么能发布、出了问题谁解释、长期谁维护”。速度带来的不是单纯收益，而是把系统瓶颈暴露得更快，也要求团队用新的方式组织验证和协作。它更像放大镜，暴露了原来就存在但不够显性的工程压力。

转场：

如果顺着这个现象往上看，软件工程要管理的对象就不再只是代码本身。

### 第 4 页：主线：产出放大后，协作对象变了

- 建议时长：约 1.3 分钟
- 讲述目标：把协作对象从代码扩展到任务、Agent、工具执行、证据包和责任链。
- 可选提问：当 Agent 也能开分支、跑测试、提交 PR 时，团队到底应该管理什么？

讲稿：

过去谈协作，很多时候是在谈人和人怎么分工，代码怎么进入仓库，PR 怎么被 review。AI Agent 进入之后，协作对象变多了：有异步执行的 Agent，有专门负责实现、测试、评审或文档的角色，有工具调用结果，有 trace，有风险说明，也有回滚路径。左边三个动作可以概括这种变化。第一是任务委派，目标、非目标、影响范围和验收标准要先清楚，否则 Agent 只是在放大模糊需求。第二是角色分工，不同 Agent 可以做不同事，但权限、上下文和生命周期必须受控，不能让所有能力混在一个无限权限的聊天窗口里。第三是证据放行，人不需要盯住每一步操作，但必须能看懂差异、测试、风险和责任。比如一个 issue 不只是需求描述，还应该带上验收标准；一个 PR 不只是 diff，还应该带上测试、trace 和回滚说明。也就是说，AI 时代的软件工程是在管理一个协作系统，而不是只管理代码提交。

转场：

协作对象变多以后，下一个关键问题就是：过程可以探索，但结果怎样才能被放行。

### 第 5 页：从传统 SDLC 到人 + Agent SDLC

- 建议时长：约 1.2 分钟
- 讲述目标：解释 SDLC 中每个角色的交付件如何从文档交接转向可验证证据。
- 可选提问：如果没有做过完整复杂项目，怎么理解软件工程不只是写代码？

讲稿：

软件开发本来就不是一个人从头写到尾。产品负责需求和验收，设计负责交互和接口约束，开发负责模块、代码和 PR，测试负责用例、报告和回归，运维负责发布、监控和恢复。AI 进入之后，这些角色不会消失，但交付件的形态会变化。产品和开发要把目标、边界、场景和验收标准写得更结构化；设计约束、ADR 和例外情况要更显性；开发不只是交出代码，还要交出计划、diff 和 trace；测试不只是跑用例，还要形成连续证据；运维的回滚、复盘和学习也会回到系统里。换句话说，每个角色都需要把过去靠经验口头传递的内容，转成 Agent 能执行、工具能检查、人能判断的对象。核心变化是从“人交接文档”转向“Agent 可执行、人可判断、平台可验证的证据”。这也是为什么 AI 不是替代 SDLC，而是在重新定义 SDLC 里的交付物。

转场：

有了这个流程视角，再看概率过程和证据放行，会更容易理解为什么需要新的工程机制。

### 第 6 页：关键机制：概率过程，证据放行

- 建议时长：约 1.4 分钟
- 讲述目标：解释可控系统如何收敛不可控过程：沙箱、权限、证据包和阶段门禁各承担什么责任。
- 可选提问：如果每一步都有 99% 正确率，十步之后系统还可信吗？

讲稿：

AI 参与软件工程后，一个重要观念是：过程可以是概率性的，但放行不能只靠概率。比如每一步看起来都有 99% 的正确率，十步串起来大约只剩 0.90，这还没有考虑模型版本变化、上下文缺失、工具返回异常和角色之间相互放大错误。解决方法不是让人盯住每一步 prompt，而是把过程放进可控系统。左侧是概率探索层，沙箱执行、权限控制、失败回注和 trace 回放，让过程可观察、可停下、可追责。中间是证据包，把 diff、测试、风险和回滚路径压缩成可判断对象。右侧是阶段门禁，只在计划到实现、实现到评审、评审到合并、发布到复盘这些转换点做放行判断。这里的关键是把不确定性限制在探索空间里，把确定性建立在证据和门禁上。人的重点不是监督每个动作，而是判断证据是否足够、风险是否可接受、责任是否清楚。这样既保留 Agent 多路径探索的效率，也避免把概率性输出直接推到生产链路里。模型给可能性，工程系统要给可复现性和可追责性。

转场：

这套机制解释了为什么 AI 很快，但组织收益不会天然按指数增长。

### 第 7 页：速度收益不是指数曲线

- 建议时长：约 1.2 分钟
- 讲述目标：用 DORA、METR、Harness 三类外部信号说明：局部加速会把隐藏工作推到评审、修复和集成环节。
- 可选提问：为什么开发者感觉更快，团队整体却未必同等加速？

讲稿：

外部研究也在提醒同一件事：AI 带来的速度收益不是一条简单的指数曲线。DORA 2025 把 AI 看成组织系统的放大器，高质量组织会被放大，碎片化流程也会被放大；工具采用本身并不自动等于收益。METR 在成熟开源项目上做过随机对照实验，发现经验开发者使用当时的 AI 工具反而慢 19%，这说明熟悉代码库、理解上下文、处理边界条件仍然很重。Harness 2026 把问题放到工程管理上：很多团队的局部生产力指标变好，但 code review、修 bug、工具切换和验证工作也在增加。三个信号要合在一起看：AI 可以让局部动作更快，但组织收益取决于系统是否能吸收这些变化。结论不是 AI 没用，而是速度收益必须和验证成本、返工成本、评审压力一起衡量。如果只统计写了多少代码，就会高估收益；如果能统计从需求到稳定发布的净时间，才更接近真实生产力。

转场：

所以接下来要看速度的代价：返工和风险怎样从隐形成本变成可管理队列。

### 第 8 页：速度的代价：把返工变成可管理队列

- 建议时长：约 1.3 分钟
- 讲述目标：给出三个落地动作：量化净时间、按风险分流、让失败回到 Agent 与 CI 闭环。
- 可选提问：当 AI 让代码进入仓库的速度变快，团队怎样避免 review、返工和集成变成新瓶颈？

讲稿：

当写代码变快以后，新的瓶颈往往不在键盘上，而在 review 队列、返工循环、CI 稳定性、跨团队集成和线上恢复。处理办法不是简单多加审批，而是把返工变成可管理队列。第一步是量化代价，看净时间而不是代码量：从需求到可验证结果用了多久，PR 等待多久，返工率是多少，失败重跑多少次，MTTR 有没有变差。第二步是风险分流，不是所有 AI 变更都走同一条线，而是按 owner、diff 大小、模块热度和 SLO 影响打标；低风险自动验证，高风险进入设计和人工评审。第三步是闭环修复，让 CI 失败、trace 归因、根因复盘回到 Agent 和工程系统。这样做的好处是，团队不用靠最后一个 reviewer 硬扛所有不确定性，而是把不同风险的变更排进不同队列。队列本身也要有优先级和退出标准，否则低风险和高风险混在一起，速度会被平均掉。速度提升才不会把成本甩给流程末端，而是进入可度量、可排队、可修复的流程。

转场：

速度和返工被纳入管理之后，质量治理才有可能真正落地。

### 第 9 页：工程质量：责任、证据与工程协议

- 建议时长：约 1.4 分钟
- 讲述目标：区分开源与大厂场景，但落到同一个核心：质量要求必须变成可复核工件。
- 可选提问：AI 让提交变多以后，维护者和平台团队到底该看什么？

讲稿：

质量治理在不同场景里重点不同。开源项目更强调公共责任：贡献者要对自己的提交负责，维护者要能判断陌生贡献和 AI-assisted 变更是否值得信任。大厂复杂交付更强调系统连续性：一个变更会牵涉 owner、依赖链、合规、发布窗口和线上事故成本。两边看似不同，但核心一致：质量要求不能停留在口头承诺或文档口号里，必须变成可复核工件。责任链说明谁决策、谁审核、谁承担后果；证据链说明测试、日志、trace、风险和回滚路径是否完整；Artifact 链说明代码、配置、依赖、发布物和运行数据如何互相追踪。比如一个变更影响了鉴权、计费或发布流程，不能只写“已自测”，而要能看到相关用例、风险说明、owner 确认和回滚方案。这样维护者不必猜测变更可信不可信，而是围绕证据做判断。DFX、TDD、Code Review 也应该从人的流程习惯，逐步变成 Agent 能读取、工具能检查、人能复核的工程协议。质量治理的重点不是让流程更重，而是让判断有依据。

转场：

当这些协议进入真实流程，就会形成从 Issue 到 PR 的可治理工作流。

### 第 10 页：把 AI 开发组织成可治理工作流

- 建议时长：约 1.3 分钟
- 讲述目标：把 AI 开发压成五个稳定环节：任务入口、隔离执行、证据包、独立评审、阶段放行。
- 可选提问：如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？

讲稿：

把前面的原则落到团队工作流，可以拆成五个稳定环节。第一，任务从 Issue 或 Spec 进入，先明确目标、非目标、验收标准和风险边界。第二，Agent 在隔离工作区执行，探索过程可以充分展开，但不能直接污染主分支。第三，执行结束必须生成证据包，包括 diff 摘要、测试结果、日志、trace、未决风险和回滚路径。第四，评审要尽量角色分离，发现问题、仲裁问题、修复问题和验证修复，不要全部压在同一个角色身上。第五，阶段门禁决定能否进入 PR、合并或发布。这个顺序很重要：没有清晰任务，后面的证据会失焦；没有隔离执行，探索会污染主线；没有证据包，评审只能靠印象；没有独立评审，修复和验证容易混在一起。每一关都应该有明确输入和输出，缺少证据就停在当前阶段，而不是靠负责人记忆补齐。这里的关键不是把所有操作都录下来，而是把复杂过程压缩成团队能读、能审、能追责的交付对象和证据。

转场：

有了这样的工作流，再看开发者角色，就不会落到人和 AI 谁替代谁的简单问题上。

### 第 11 页：开发者角色：在新工程系统中找准位置

- 建议时长：约 1.5 分钟
- 讲述目标：明确人和 AI 在四个阶段的分工：定义问题、组织上下文、编排执行、证据放行。
- 可选提问：AI 参与每个阶段后，人类开发者最不可替代的技能是什么？

讲稿：

从开发者个人角度看，未来不是人写代码、AI 做补全这么简单，而是人在不同阶段承担不同责任。第一阶段是定义问题，人负责价值判断、非目标和风险边界，AI 可以帮助整理信息和生成备选方案。第二阶段是组织上下文，人负责架构取舍、事实源选择和约束解释，AI 负责检索、摘要和草拟计划。第三阶段是编排执行，人负责设置权限、节奏、验证矩阵和停止条件，AI 负责生成、修改、运行和反馈。第四阶段是证据放行，人负责最终责任、质量解释和复盘沉淀，AI 提供 trace、diff、测试结果和改进建议。这里不是说开发者离代码越来越远，相反，只有理解代码、架构和运行约束，才知道该给 AI 什么上下文、该相信哪些证据、该在什么地方停下来。越是 AI 能快速完成表层实现，越要把人的时间放在问题选择、事实核验和风险解释上。编程基础仍然重要，但能力结构会从语法实现，升级到问题定义、系统判断、证据审查和协作治理。人的价值不是站在 AI 旁边看它写代码，而是在目标、边界、证据和责任上站稳，并把机器产出转化成团队可以放心承接的工程结果。

转场：

最后把这个判断落到新人工程师身上：第一年最应该训练哪些能力。

### 第 12 页：刚入职场：四个能力方向

- 建议时长：约 1.1 分钟
- 讲述目标：给新人明确训练方向：读懂代码、证据交付、理解场景、承担责任边界。
- 可选提问：当 AI 可以帮你更快完成任务，第一年最应该刻意训练什么？

讲稿：

对刚入职场的人来说，关键不是要不要用 AI，而是不要把成长路径外包给 AI。外部调研已经很清楚：大量开发者在使用或准备使用 AI，但对输出准确性的信任并不高；一些受控实验也提示，过度依赖 AI 可能影响调试和理解能力。更稳妥的训练方向有四个。第一，读懂与解释代码，至少能复现错误、读懂 diff、解释关键实现和边界条件。第二，证据驱动交付，把测试、CI、日志、trace 和 review 当成交付的一部分，而不是写完代码后的附属品。第三，理解需求与场景，知道用户路径、产品定位、体验约束和验收标准。第四，承担责任边界，能判断该不该做、能不能合、出了问题如何解释。使用 AI 时，可以让它帮你生成方案，但要逼自己说清为什么这样做、怎么验证、失败了怎么回滚。把能写代码升级为能理解问题并可靠交付，这会是新人最重要的专业位置。

转场：

最后用两个问题收束，进入交流。

### 第 13 页：谢谢

- 建议时长：约 0.8 分钟（收束 + Q&A 入口）
- 讲述目标：收束主旨并把讨论引向收益指标、确定性证据和开发者成长。
- 可选提问：AI 编程真正值得追踪的收益指标、证据指标和成长指标分别是什么？

讲稿：

最后把今天的内容收束成三句话。第一，AI 扩大了个人产出，但团队不能只看代码量，而要看净交付时间、返工率、评审压力和线上风险。第二，AI 的执行过程可以概率化，但放行必须依赖确定性证据，包括测试、trace、风险说明、owner 和回滚路径。第三，开发者的成长不会停留在会不会写代码，而会更多转向架构判断、上下文组织、证据设计和工程治理。如果只把 AI 当成写代码工具，会低估它对流程的影响；如果只把 AI 当成替代人，也会低估人在目标、边界和责任上的价值。接下来可以围绕 AI 编程、工程治理和开发者角色继续交流。

转场：

进入 Q&A。
