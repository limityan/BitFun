# AI 如何重新定义软件开发

## 报告定位

本报告以 BitFun 为引子，讨论 AI 如何从代码补全走向 Agentic Coding，并进一步影响软件开发全生命周期。内容将结合 Context Engineering、质量门禁、平台工程与人类监督等概念，分析企业研发流程、工程治理方式和开发者角色的变化，理解 AI 时代软件工程从“写代码”走向“组织智能协作系统”的新范式。

## 核心主旨

AI 重新定义软件开发，不是因为它能更快生成代码，而是因为它正在改变软件工程的基本对象：从代码、函数和文件，扩展到任务、上下文、工具、权限、验证、反馈、人类监督和组织流程。

对高校听众来说，这个变化最值得关注的不是“AI 会不会取代程序员”，而是“未来的软件人才需要如何重新定义自己的能力结构”。

## 全局主干

所有概念、案例和论文都围绕同一条主干展开：

```text
代码补全
  -> Agentic Coding
  -> 软件开发全生命周期被 AI 介入
  -> 企业研发流程和工程治理方式变化
  -> 开发者角色从写代码转向组织智能协作系统
```

报告中出现的 Context Engineering、质量门禁、平台工程、人类监督、Agent Runtime、Harness、ICSE 论文案例，都只是这条主干上的支撑材料。它们的作用分别是：

- Context Engineering：解释 Agentic Coding 为什么需要组织上下文，而不是只写 prompt。
- 质量门禁：解释 AI 进入开发全生命周期后，为什么测试、CI、review、评测和审计更重要。
- 平台工程：解释组织为什么会从个人使用 AI 工具，转向建设统一规则、权限、流水线、评测和可观测平台。
- 人类监督：解释不同风险等级下，哪些判断必须由人负责。
- Agent Runtime / Harness：作为辅助表达，说明模型外部的工具、权限、反馈和 trace 如何支撑可靠执行；不要把它讲成独立主线。

## 目标听众

- 本科生：理解为什么学习编程仍然重要，以及 AI 时代要补充哪些新能力。
- 研究生：理解 AI 对软件工程研究、开发流程和系统架构的影响。
- 高校教师：理解课程体系和实践教学可以如何从“写代码”扩展到“组织智能协作”。

## 建议时长

15 分钟。

建议控制在 6 到 7 页幻灯片，每页只承载一个核心判断。报告不宜平铺概念，也不宜展开 BitFun 项目细节；更适合用一个真实开发现象带出问题，再用软件工程视角逐步回答。

## 讲述主线

```text
BitFun 一个高速 AI 开发案例
  -> AI 把开发速度和需求变化速度一起放大
  -> 非商用探索更快，但质量治理缺口更明显
  -> 高质量开源提交与大厂复杂交付提出不同要求
  -> 需要 Context / Quality Gates / Platform / Oversight
  -> 开发者角色从写代码转向组织智能协作系统
```

BitFun 在报告中只作为引子和参照物出现：它代表一种趋势，即开发工具正在从“编辑代码的工具”转向“承载 Agent、上下文、工具、会话、审查和执行环境的 Agent Runtime”。可以用“一个月写出 18w+ 行代码”作为开场现象，但重点不是炫耀代码量，而是追问：当产能突然放大，软件工程的瓶颈会转移到哪里？

可以借鉴 `Harness-references-ppt` 里的一个简洁表达：

```text
Prompt ⊂ Context ⊂ Harness
```

Prompt 决定模型怎么理解指令，Context 决定模型此刻看见哪个世界，Harness 则决定模型如何安全、可观察、可验证地完成任务。这个表达只作为后半段解释 Context Engineering、平台工程和质量治理的辅助框架，不作为报告主题。

## 15 分钟报告大纲

### 1. 开场：18w+ 行代码之后，问题真的变少了吗？约 2 分钟

用 BitFun 的高速 AI 开发体验抓住听众：

> 如果一个项目借助 AI，一个月可以产出 18w+ 行代码，我们应该先兴奋，还是先紧张？

这里不要把数字讲成产能宣传，而要把它讲成一个问题入口：

- 代码写得更快，是否意味着产品更快成熟？
- 需求改得更频繁，是否意味着方向更灵活，还是更容易失控？
- 团队协作变少，是否意味着效率更高，还是质量检查被省略？
- 非商用探索可以快速推进，但如果要进入开源高质量协作或复杂组织交付，还缺什么？

引出核心判断：

> AI 首先改变的不是“代码怎么写”，而是“软件开发的速度、风险和组织方式如何被重新分配”。

### 2. 第一层变化：AI 让探索变快，也让变化变快，约 2.5 分钟

用 BitFun 的经验讲 AI 对非商用探索和早期研发的正面作用：

- 更快的原型验证：想法可以在几天内变成可运行形态。
- 更灵活的需求变更：方向不确定时，试错成本显著下降。
- 更少的团队配合成本：一个人可以完成过去需要多人配合的探索性工作。
- 更大的功能覆盖面：许多“值得试但不一定值得排期”的想法可以被快速验证。

这部分要避免落入“AI 全面替代团队”的叙事。更准确的表达是：

> AI 让探索性开发从“排期驱动”变成“想法驱动”，但这主要解决的是速度问题，不自动解决质量问题。

可以向学生抛一个问题：

> 如果毕业后你能用 AI 一周做完一个原型，老板真正会关心的是“你写得快”，还是“这个东西能不能上线、维护、回滚和审计”？

### 3. 第二层变化：速度放大之后，质量责任被重新定义，约 3 分钟

继续沿着 18w+ 行代码这个现象追问：如果 AI 可以快速堆出大量功能，新的问题是什么？

非商用探索阶段，很多问题可以被暂时接受：

- 功能能跑，但边界不一定稳定。
- 需求变化很快，但设计决策不一定沉淀。
- 代码很多，但 review 和测试不一定跟上。
- 一个人推进很快，但知识可能没有进入团队流程。
- Agent 能修问题，但修复依据可能来自模型自信，而不是外部证据。

但一旦走出个人探索，就会出现两种不同的质量要求：

1. **开源高质量要求：开发者要对自己的提交负责**

   开源项目不一定是商用项目，但它对代码质量有公共责任。维护者需要判断：海量 AI 生成变更是否可读、可测、可维护、符合项目方向，是否会增加安全、性能或兼容性风险。这里的核心不是“能不能合并”，而是“维护者如何验证一个陌生开发者或 AI-assisted contributor 的大规模变更”。

2. **大厂复杂交付要求：组织要对系统和流程负责**

   大厂面对的是更高复杂度的跨团队协作：依赖链长、发布链路长、合规要求多、用户规模大、故障成本高。AI 不是只给单个开发者提速，还会冲击需求评审、方案设计、代码检视、测试准入、发布节奏、线上观测和事故追责。

这一段可以引出报告的第一个核心转折：

> AI 把“写代码”变便宜之后，软件工程的稀缺资源从代码产能转向质量责任、上下文组织和跨团队治理。

### 4. 第三层变化：现在有哪些更成熟的工程补法？约 4 分钟

这一段把核心概念作为“解决问题的工具”引出，不要单独做术语讲解。可以按四类能力组织：

1. **Context Engineering：让 Agent 站在正确事实上**

   不只是写 prompt，而是把需求、代码结构、日志、测试结果、历史决策、项目规范组织成 Agent 能可靠使用的上下文。开源项目可以通过 `AGENTS.md`、贡献指南、架构文档、设计说明和模块边界降低误改；大厂则会进一步把内部知识库、服务拓扑、变更历史、监控数据、事故复盘接入研发平台。

2. **代码检视与质量门禁：让“完成”绑定外部证据**

   Agent 说“我完成了”不算完成。完成应当绑定测试、CI、review finding、用户确认、性能数据或失败说明。比较成熟的方向包括 CODEOWNERS、required status checks、merge queue、CodeQL/code scanning、dependency review、AI first-pass review 加人工 owner 审查。AI 可以帮助初筛，但关键责任仍应落在 owner、maintainer 和质量门禁上。

3. **架构稳定性与设计治理：让快速变化不破坏长期边界**

   设计模式、模块边界和架构稳定性在 AI 时代更重要，因为 AI 很容易局部最优地“补一段代码”。比较好的方向是 spec-driven development、ADR/RFC、架构 fitness functions、依赖边界检查、模块 owner、架构守护测试，把“架构不能被破坏”变成自动反馈，而不是只靠资深工程师记忆。

4. **性能看护与线上风险控制：让变更可以渐进暴露和回滚**

   AI 可以更快改代码，也可能更快引入性能退化。比较成熟的方向包括 benchmark/performance budget、profiling、OpenTelemetry traces/metrics/logs、SLO/error budget、feature flag、canary release、灰度发布和自动回滚。它们的共同点是：不假设代码 review 能发现所有问题，而是在运行期持续验证。

可以用一个简单对比收束：

| 场景 | 核心问题 | 典型机制 |
| --- | --- | --- |
| 个人/非商用探索 | 能不能快速做出来 | Vibe Coding、快速原型、轻量验证 |
| 开源高质量协作 | 维护者如何验证海量变更 | CODEOWNERS、CI、merge queue、security checks、review discipline |
| 大厂复杂交付 | 组织如何控制跨团队风险 | 平台工程、设计评审、SLO、灰度、可观测性、审计和回滚 |

### 5. BitFun 作为一个缩影：不是项目细节，而是四个问题，约 1.5 分钟

这里用 BitFun 回扣开场，但不展开架构。只说它把 AI 开发遇到的问题产品化成四类工作流：

- Planning：快速变化的需求，需要先探索和计划，而不是直接改。
- Evidence：debug 不能只凭模型自信，需要日志、复现和证据。
- Review：执行者、审查者、仲裁者需要分离。
- Self-iteration：一次失败不只修一次代码，而要沉淀成下一版工作流。

这四个关键词服务一个结论：

> AI 工具的未来形态不是“更会聊天”，而是能把开发过程组织成可验证、可追踪、可治理的工程系统。

这里也可以补一句区分：

> 对开源项目，重点是让维护者能判断“这批变更是否值得合并”；对大厂系统，重点是让组织能判断“这批变更是否可以安全进入复杂生产链路”。

### 6. 结尾：从学生到工程师，角色如何变化？约 2 分钟

用三个问题收束，留给听众思考：

1. 如果 AI 能完成大部分编程作业，编程课应该继续训练什么？
2. 如果 AI 能一周写完原型，工程师还需要证明什么？
3. 如果 AI 让个人产能接近一个小团队，团队协作和质量责任应该怎么重新设计？

最后落到角色变化：

| 过去的开发者 | AI 时代的开发者 |
| --- | --- |
| 写代码的人 | 定义任务的人 |
| 熟悉语法和 API 的人 | 组织上下文的人 |
| 修 bug 的人 | 设计验证闭环的人 |
| 使用工具的人 | 编排 Agent 和工具的人 |
| 实现功能的人 | 维护系统演进和质量边界的人 |

最后的落点：

> 未来优秀的软件人才，不只是会写程序，而是会设计人与 AI Agent 共同工作的工程系统。

## 支撑主干的趣味概念

这些内容不要讲成“行业名词列表”，而要讲成课堂上能被快速理解的小故事。每个概念最好只占 30 到 60 秒，并且必须服务全局主干：从代码补全到 Agentic Coding，再到软件开发全生命周期、工程治理和角色变化。

### 18w+ 行不是答案，而是问题

可以作为整场报告的第一张故事卡：

> AI 让 BitFun 在一个月里快速产出 18w+ 行代码。真正值得讨论的不是“AI 写了多少”，而是当产能突然放大之后，需求、质量、协作、审查和交付责任会怎样变化。

它适合引出一个判断：

> AI 时代的软件工程，不是围绕“能不能写出来”展开，而是围绕“能不能被验证、维护、协作和商业化交付”展开。

这里的“交付”建议拆成两个层次讲：

- 开源交付：对社区、维护者和未来贡献者负责。
- 复杂组织交付：对用户、线上系统、跨团队依赖和业务连续性负责。

### Agent 只是一个 While 循环

可以用来降低神秘感：

```text
Think -> Act -> Observe -> Finish
```

它适合引出一个关键判断：

> Agent 的稳定性不只取决于模型多聪明，更取决于每次 Act 前有没有权限检查、每次 Observe 后有没有事实回注、每次 Finish 时有没有外部证据。

### Vibe Coding

这个概念只能作为起点，不作为报告主线。可以解释为“凭感觉描述需求，让 AI 快速生成原型”。它适合课程实验、创意验证和低风险 demo，但不适合没有测试、没有 review、没有边界控制的真实工程。

可以作为一个轻松的引子：

> Vibe Coding 很像让 AI 帮你把想法快速变成能跑的东西，但真实工程不能只靠 vibe，还要靠 verification。

### AI 实习生比喻

AI 像一个速度极快但不稳定的实习生：

- 它读得快、写得快、不会嫌任务烦。
- 它可能误解背景、过度自信、忘记约束。
- 它需要明确任务、足够上下文、可执行验证和人类审查。

这个比喻适合引出：

> 工程师不是被替代，而是要学会带领、监督和审查智能协作者。

### Spec-driven Development

先写清楚意图、边界和验收标准，再让 AI 执行。

可以与学生写作业对比：

```text
普通作业：题目已经定义好输入输出
真实工程：很多时候题目本身需要你定义清楚
```

### AI-friendly Codebase

结构清晰、测试充分、文档明确、边界稳定的代码库，更适合 AI Agent 工作。

可以用来提醒学生：

> 好代码不只是给人读的，也会越来越多地被 AI 读、改和验证。

### Model Ceiling / Harness Floor

可以借鉴参考材料里的说法：

```text
模型决定上限，Harness 决定下限。
```

含义是：强模型能带来更高能力上限，但真实工程里的最低可靠性，往往由上下文、工具权限、验证回路、约束和 trace 决定。

这句话适合放在结尾，帮助听众把“模型崇拜”转向“工程系统意识”。

### Prompt 里的“小心”没有强制力

可以讲成一个通用事故型故事，不一定绑定具体公司案例：

> 如果 Agent 拿到了生产环境 token，只在 prompt 里写“小心生产环境”是不够的。真正可靠的做法是在执行链路上做硬拦截：危险命令、生产环境写操作、强推分支、删除数据，都必须触发确认或拒绝。

可引出的结论：

> 软件工程里真正的约束，不应该只写在提示词里，而应该落在权限、hook、审计和回滚机制里。

## 可穿插的小案例

案例选择规则：每个案例都必须回答主干上的一个问题，而不是展示“又一个 AI 新东西”。

| 主干问题 | 对应案例 |
| --- | --- |
| AI 让开发速度提升后，真正的问题是什么？ | BitFun 一个月 18w+ 行代码引出的质量和交付问题 |
| 开源维护者如何验证海量 AI 变更？ | CODEOWNERS、merge queue、agent-authored PR 为什么没被合并 |
| 大厂如何管理复杂交付风险？ | SLO/error budget、feature flag、canary、OpenTelemetry |
| Agentic Coding 真的进入工程协作了吗？ | agent-authored PR 为什么没被合并 |
| Agent 为什么需要上下文工程？ | `AGENTS.md` 和架构文档作为项目级上下文 |
| AI 进入生命周期后如何验证？ | CI-Bench、测试失败修复、质量门禁 |
| 高风险项目如何做人类监督？ | 税法转代码、安全漏洞判断 |
| 企业为什么需要平台工程？ | trace、权限、规则、工作流沉淀 |
| 高校教学如何变化？ | AI-Driven Software Development 课程考核 |

### 0. BitFun 一个月 18w+ 行代码：产能放大后的工程问题

故事讲法：

> 一个月 18w+ 行代码听起来像效率奇迹，但软件工程里最重要的问题不是“写了多少”，而是“这些代码如何被理解、验证、审查、维护和交付”。

这个案例是整场报告的主入口，可以带出四个问题：

- 非商用探索里，AI 可以极大降低试错成本。
- 需求变化更灵活，但也更容易缺少稳定的验收标准。
- 个人和 Agent 的组合可以减少团队配合成本，但也可能减少团队共识。
- 如果进入开源协作或复杂组织交付，就必须补上质量门禁、可追溯性、权限边界和人类监督。

可引出的结论：

> AI 把软件开发从“代码产能问题”推向“工程治理问题”。

### 1. 给 AI 一份项目说明书：AGENTS.md

故事讲法：

> 同一个 coding agent，给它一份项目里的“工作说明书”，它会不会更快、更省 token？

ICSE 2026 的 JAWs Workshop 有一篇关于 `AGENTS.md` 的研究，比较 coding agent 在有无仓库级说明文件时的表现。它适合用来引出 Context Engineering：AI 不是只需要一个 prompt，而是需要稳定、版本化、项目级的工作上下文。

可引出的结论：

> 未来的项目文档不只是写给新人看的，也会写给 AI Agent 看。

### 2. AI 已经会提 PR，但为什么很多没被合并？

故事讲法：

> 如果 AI 已经能在 GitHub 上提交 PR，下一步最重要的问题是什么？不是它会不会写，而是它为什么会被 reviewer 拒掉。

MSR 2026 Mining Challenge 中有研究分析了 33k 个 agent-authored PR。这个案例适合引出开源维护者的真实压力：当 AI 让贡献者可以提交更多、更大的变更，maintainer 需要更强的 CODEOWNERS、CI、required checks、merge queue、security scan 和人工判断，而不是只看“代码能跑”。

可引出的结论：

> AI 生成代码只是开始，能被团队接受、通过测试、满足边界和长期维护要求，才是工程完成。

### 3. CI 红了，让 AI 修，它真的能修好吗？

故事讲法：

> 学生项目里测试挂了，可能改一行就过；真实项目的 CI 挂了，背后可能是环境、依赖、历史行为、并发和平台差异。

ICSE 2026 Demonstrations 中的 CI-Bench 用真实 CI/CD 失败来评估 LLM repair tools。这个案例适合引出 AI-assisted SDLC 和 EvalOps：评价 AI 编程能力不能只看静态题目，还要看它能不能处理真实工程流水线里的失败。

可引出的结论：

> AI 修 bug 的能力，必须放回真实构建、测试和运行环境里验证。

### 3a. 大厂不是多跑几个测试，而是管理复杂变更风险

故事讲法：

> 在一个大厂系统里，一个 AI 生成的改动可能穿过多个服务、多个 owner、多个发布窗口和多个监控指标。它不是“代码合并”这么简单，而是一次组织级变更。

这个案例可以不用绑定某一家具体公司，重点讲成熟机制：

- CODEOWNERS / owner review：谁对哪块代码负责。
- merge queue / required status checks：避免多个 PR 单独通过、合并后失败。
- SLO / error budget：用数据平衡创新速度和可靠性。
- feature flag / canary：把风险渐进暴露，而不是一次性全量上线。
- OpenTelemetry / tracing：让性能和故障能被定位，而不是靠猜。

可引出的结论：

> 大厂里的 AI 编程价值，不只是写代码更快，而是能否被纳入已有的变更治理、可靠性和可观测体系。

### 4. 税法写成代码：为什么高风险系统不能只靠生成？

故事讲法：

> 如果让 AI 把美国税法翻译成报税软件逻辑，怎么证明它算得对？

ICSE 2026 Research Track 有一篇 legal-critical software 的 agentic approach，以 tax preparation software 为案例，讨论自然语言法规到可执行逻辑的转换，并用 metamorphic testing 缓解 oracle problem。这个案例适合引出不同项目风险等级下的人类监督和测试策略。

可引出的结论：

> 越接近法律、金融、医疗和安全场景，AI 越需要被测试、比较、审计和人类专家监督。

### 5. 先给架构文档，再让 AI 写代码

故事讲法：

> 如果直接让 AI 写代码，它可能能跑；如果先给它架构文档和实现计划，它是否更像一个懂项目约束的工程师？

ICSE 2026 Designing Workshop 有研究讨论用 architectural documents 和 implementation plans 改善 LLM-assisted code generation。这个案例很适合高校听众，因为它把传统软件工程里的需求、架构和计划重新连接到 AI 编程。

可引出的结论：

> AI 时代不是不要设计文档，而是设计文档会变成 Agent 执行任务的重要输入。

### 6. 软件工程课怎么考？只看功能可能不够了

故事讲法：

> 如果学生都可以用 AI 写出能跑的代码，老师还应该怎么评价学习效果？

ICSE 2026 SEET Track 有一篇 AI-Driven Software Development 课程设计论文，讨论在 LLM 时代重新设计软件工程课程和评估方式。这个案例特别适合作为面向高校教师的引子。

可引出的结论：

> 编程教育需要从“代码是否能跑”扩展到“学生是否能定义问题、选择工具、验证结果、解释风险”。

### 7. 多 Agent 重构：像一个小型工程团队

故事讲法：

> 一个 Agent 负责计划，一个 Agent 负责改代码，一个 Agent 负责测试，一个 Agent 负责反思，这会不会比一个全能 Agent 更可靠？

ICSE 2026 Research Track 的 RefAgent 研究把 refactoring 拆给多个 specialized agents，用来讨论 multi-agent software engineering。这个案例适合引出团队分工、角色专业化和自动化边界。

可引出的结论：

> 多 Agent 的价值不只是“多几个模型”，而是把软件工程流程中的角色和质量检查显式化。

### 8. LLM 看安全漏洞，可能只是“高级代码指标”？

故事讲法：

> 如果一个 LLM 说某段代码有漏洞，它是真的理解了漏洞，还是只是被复杂度、长度、控制流这类表面指标影响？

ICSE 2026 Research Track 有研究从 code metrics 角度分析 LLM-based vulnerability discovery，指出 LLM 在漏洞发现中可能受到浅层代码指标影响。这个案例适合提醒听众：AI 的判断需要被解释和验证，尤其在安全场景。

可引出的结论：

> AI 给出的安全判断不能直接当结论，必须结合传统分析、指标、测试和专家审查。

## 从 Harness 参考报告中可借鉴的表达

参考目录 `D:\software\Feishu\files\Harness-references-ppt` 中的材料更适合做“概念层表达”和“讲述节奏”的补充。当前报告时间只有 15 分钟，因此建议吸收以下点，而不是完整复刻原报告，也不要把主题偏移到 Harness Engineering。

### 1. 开场问题可以更尖锐

原报告的开场问题是：

> 模型越来越强，为什么 Agent 反而越来越不稳？

这个问题比“AI 会不会替代程序员”更工程化，也更容易引出软件工程主题。可以在当前报告里作为第二个追问：

> 如果模型能力一直增强，为什么企业仍然需要流程、测试、review、权限和审计？

### 2. 用 Agent 循环降低神秘感

`Think -> Act -> Observe -> Finish` 这个模型非常适合高校听众。它让学生明白 Agent 不是“自动产生软件的黑盒”，而是一条不断循环的工程链路。

这里最值得保留的句子是：

> Finish 不是一句“我完成了”，而是要被外部证据接住。

这句话可以连接测试、CI、review、用户确认和失败说明。

### 3. 用包含关系讲清 Prompt、Context、Harness

参考报告中的：

```text
Prompt ⊂ Context ⊂ Harness
```

适合作为概念桥梁。高校听众通常听过 prompt，也可能听过 context engineering，但未必理解为什么还需要更外层的工程系统。

建议讲法：

- Prompt：角色、目标、约束、输出格式。
- Context：需求、代码、日志、测试、历史决策、项目规范。
- Harness：工具权限、执行编排、验证回路、约束、trace、审计。

### 4. Harness 六维可作为平台工程和质量治理的归因框架

参考报告中的六维可以压缩成一张备用图：

| 维度 | 课堂讲法 |
| --- | --- |
| 执行 | Agent 有没有被允许调用正确工具 |
| 记忆 | Agent 有没有记住项目规则和历史决策 |
| 反馈 | Agent 做错后能不能知道自己错了 |
| 编排 | Agent 是否按计划推进，而不是乱跑 |
| 约束 | 危险动作是否被硬拦截 |
| 评估 | 出问题后能不能通过 trace 复盘 |

这套框架可以用来解释为什么企业需要平台工程：AI 时代的软件工程不是“少做工程”，而是把工程约束重新设计给 Agent，并沉淀为组织级能力。

### 5. 最小可用 Harness 可以作为平台工程的课后启发

原报告里的六步落地清单很实用，但 15 分钟报告里不宜展开。可以作为最后一页备份或 Q&A：

1. 写一份 `AGENTS.md` / rules 文件。
2. 区分探索模式和交付模式。
3. 给任务绑定外部验证命令。
4. 对危险操作加硬拦截。
5. 保留 trace，能复盘 Agent 为什么错。
6. 把成功流程沉淀成 skill 或团队规范。

面向学生可以换一种说法：

> 未来进公司后，会用 AI 不够；能把 AI 放进一个安全、可验证、可复盘的工作流里，才是真正的工程能力。

### 6. BitFun 只保留四个产品化关键词

参考报告里 BitFun 部分较细，当前报告不建议展开。可以只保留四个关键词：

- Planning：先探索和计划，再进入实现。
- Evidence：debug 先取证，不凭模型自信修复。
- Review：执行者、审查者、仲裁者分离。
- Self-iteration：一次失败沉淀为下一版工作流，而不是只修一次代码。

这四个词可以放在 BitFun 引子页角落，作为“为什么 BitFun 是 Agent Runtime，而不是聊天壳”的简短说明。

## 推荐幻灯片结构

1. 标题：AI 如何重新定义软件开发
2. 开场案例：BitFun 一个月 18w+ 行代码之后，问题变少了吗？
3. 速度的正面：更快原型、更灵活需求、更低探索成本
4. 速度的背面：质量责任、追溯、协作和长期维护缺口
5. 两类高质量要求：开源 maintainer 验证 vs 大厂复杂交付治理
6. 现在比较成熟的补法：code review / architecture / performance / release
7. BitFun 缩影：Planning、Evidence、Review、Self-iteration
8. 结论：从会写代码到会组织智能协作系统

如果需要压缩到 6 页，可以合并第 3 页和第 4 页，把“收益和风险”放在同一页左右对照；或者合并第 5 页和第 6 页，把“开源/大厂要求”和“工程补法”放成一张对照表。

## 面向高校听众的提问点

可以在报告中穿插 2 到 3 个问题，让听众参与思考：

1. 如果 AI 一个月能写出 18w+ 行代码，你更关心代码量、功能完成度，还是验证证据？
2. 如果 AI 能完成大部分编程作业，编程课应该训练什么能力？
3. 一个会写代码但不会验证 AI 输出的学生，能否胜任真实工程？
4. 如果你是开源项目 maintainer，面对一个 AI 生成的 5k 行 PR，你会先看什么？
5. 如果你在大厂负责一个核心服务，AI 生成的代码通过单元测试后，距离上线还差哪些门槛？
6. 未来简历上除了语言和框架，是否还应该体现 AI 工作流、上下文工程和质量治理能力？
7. 你愿意让 AI 自动修改个人项目、开源项目、公司核心系统，还是医疗和金融系统？为什么边界不同？

## 讲述时的注意事项

- 不要把报告讲成 BitFun 项目介绍。BitFun 只负责打开问题，不负责承载全部内容。
- 不要把重点放在某个工具是否最好。工具会变化，产能放大后的工程治理问题更重要。
- 不要把“商用”作为唯一高质量标准；开源高质量代码同样要求开发者负责、维护者可验证、项目长期可维护。
- 不要把大厂要求简化成“测试更多”；它还包括跨团队 owner、设计评审、变更冻结、灰度、SLO、性能看护、审计和事故复盘。
- 不要把 AI 描述成“替代程序员”的单线叙事。更准确的说法是：开发者的能力结构和组织方式正在改变。
- 不要过度承诺全自动开发。更可靠的落点是：AI 与软件工程实践结合，形成可监督、可验证、可治理的开发体系。

## 可参考行业材料

- DORA 2025: State of AI-assisted Software Development
- Thoughtworks Technology Radar: agentic workflows, context engineering, AI antipatterns
- GitHub Octoverse: AI and agentic workflows in developer experience
- GitHub Docs: CODEOWNERS, branch protection, required status checks, merge queue, code scanning, dependency review
- OpenSSF Scorecard: automated open source security and project health checks
- Google SRE: SLO, error budget, canary release, feature flag and progressive delivery practices
- OpenTelemetry: traces, metrics and logs for observability
- Thoughtworks: evolutionary architecture and architecture fitness functions
- ICSE 2026 Research Track: agentic coding, RefAgent, legal-critical agentic software, LLM-based vulnerability discovery
- ICSE 2026 co-located tracks and workshops: MSR Mining Challenge, SEET, JAWs, Designing, Demonstrations
- MCP: agents connecting to tools and context through standardized protocols

## ICSE 2026 可引用论文和议题

- [On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents](https://conf.researchr.org/details/icse-2026/jaws-2026-papers/31/On-the-Impact-of-AGENTS-md-Files-on-the-Efficiency-of-AI-Coding-Agents)：用于说明仓库级上下文和项目说明会影响 Agent 效率。
- [Where Do AI Coding Agents Fail? An Empirical Study of Failed Agentic Pull Requests in GitHub](https://2026.msrconf.org/details/msr-2026-mining-challenge/19/Where-Do-AI-Coding-Agents-Fail-An-Empirical-Study-of-Failed-Agentic-Pull-Requests-in)：用于说明 Agentic Coding 已经进入 PR 级工程协作，但合并失败原因仍需研究。
- [CI-Bench: A Framework for Evaluating Large Language Model Tools on CI Failures](https://conf.researchr.org/details/icse-2026/icse-2026-demonstrations/9/CI-Bench-A-Framework-for-Evaluating-Large-Language-Model-Tools-on-CI-Failures)：用于说明真实 CI 失败是评估 AI 修复能力的重要场景。
- [An LLM Agentic Approach for Legal-Critical Software: A Case Study for Tax Prep Software](https://conf.researchr.org/details/icse-2026/icse-2026-research-track/58/An-LLM-Agentic-Approach-for-Legal-Critical-Software-A-Case-Study-for-Tax-Prep-Softwa)：用于说明高风险领域需要更强测试、监督和合规验证。
- [Improving LLM-assisted code generation through the use of architectural documents and implementation plans](https://conf.researchr.org/details/icse-2026/designing-2026-papers/2/Improving-LLM-assisted-code-generation-through-the-use-of-architectural-documents-and)：用于说明传统架构文档和实现计划在 AI 编程中仍然有价值。
- [AI-Driven Software Development: A New Course Concept and Assessment Model for the Era of Large Language Models](https://conf.researchr.org/details/icse-2026/icse-2026-software-engineering-education-and-training--seet-/18/AI-Driven-Software-Development-A-New-Course-Concept-and-Assessment-Model-for-the-Era)：用于说明高校软件工程教学和考核方式正在被 AI 改写。
- [RefAgent: A Multi-agent LLM-based Framework for Automatic Software Refactoring](https://conf.researchr.org/details/icse-2026/icse-2026-research-track/111/RefAgent-A-Multi-agent-LLM-based-Framework-for-Automatic-Software-Refactoring)：用于说明多 Agent 可以映射软件工程中的计划、执行、测试和反思角色。
- [LLM-based Vulnerability Discovery through the Lens of Code Metrics](https://conf.researchr.org/details/icse-2026/icse-2026-research-track/57/LLM-based-Vulnerability-Discovery-through-the-Lens-of-Code-Metrics)：用于说明 AI 安全判断仍需传统软件工程方法解释和校验。
