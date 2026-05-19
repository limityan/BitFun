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
- 平台工程：解释企业为什么会从个人使用 AI 工具，转向建设组织级 AI 工程平台。
- 人类监督：解释不同风险等级下，哪些判断必须由人负责。
- Agent Runtime / Harness：作为辅助表达，说明模型外部的工具、权限、反馈和 trace 如何支撑可靠执行；不要把它讲成独立主线。

## 目标听众

- 本科生：理解为什么学习编程仍然重要，以及 AI 时代要补充哪些新能力。
- 研究生：理解 AI 对软件工程研究、开发流程和系统架构的影响。
- 高校教师：理解课程体系和实践教学可以如何从“写代码”扩展到“组织智能协作”。

## 建议时长

20 分钟。

建议控制在 7 到 8 页幻灯片，每页只承载一个核心判断，避免展开 BitFun 项目细节。

## 讲述主线

```text
AI 编程助手
  -> Agentic Coding
  -> Context Engineering
  -> AI-assisted SDLC
  -> Platform Engineering
  -> Quality Gates and Human Oversight
  -> 开发者角色重构
```

BitFun 在报告中只作为引子和参照物出现：它代表一种趋势，即开发工具正在从“编辑代码的工具”转向“承载 Agent、上下文、工具、会话、审查和执行环境的 Agent Runtime”。

可以借鉴 `Harness-references-ppt` 里的一个简洁表达：

```text
Prompt ⊂ Context ⊂ Harness
```

Prompt 决定模型怎么理解指令，Context 决定模型此刻看见哪个世界，Harness 则决定模型如何安全、可观察、可验证地完成任务。这个表达只作为解释 Context Engineering、平台工程和质量治理的辅助框架，不作为报告主题。

## 20 分钟报告大纲

### 1. 开场：AI 会写代码后，程序员还剩什么？约 2 分钟

用一个直接问题抓住听众：

> 如果 AI 已经能写代码，未来程序员、研究者和软件工程教育还应该关注什么？

可以快速区分两个层次：

- 短期变化：AI 提高个人写代码、查资料、修 bug 的效率。
- 深层变化：AI 正在进入需求、设计、编码、测试、审查、发布、运维等软件生命周期环节。

引出核心判断：

> 程序员不会简单消失，但角色会从“代码生产者”转向“智能协作系统的设计者、组织者和监督者”。

### 2. 背景：从个人效率工具到组织级工程体系，约 3 分钟

过去两年，企业采用 AI 的方式大致经历了三个阶段：

1. 个人工具阶段：开发者使用 Copilot、ChatGPT、Claude 等工具提高局部效率。
2. 团队流程阶段：AI 进入代码审查、测试生成、日志分析、需求拆解和文档生成。
3. 工程平台阶段：公司开始关注模型权限、上下文资产、内部工具连接、审计日志、质量门禁和统一治理。

这里可以引入 DORA 2025 的一个重要判断：AI 更像放大器，会放大组织已有的强项和弱项。工程体系成熟的团队更容易从 AI 中获益；测试、边界和流程薄弱的团队，可能只是更快地产生更多风险。

面向学生可以补一句：

> 在作业场景里，AI 很容易帮你完成一个函数；在真实工程里，更难的是不破坏已有系统、不制造质量债、不绕过团队约定。

### 3. BitFun 引子：开发工具正在变成 Agent Runtime，约 2 分钟

简要介绍 BitFun：

- 它不是只提供聊天窗口的 AI 工具。
- 它更像一个本地 Agent Runtime，承载会话、工具、文件系统、终端、Git、记忆、审查和执行环境。
- 它代表的趋势是：AI 开发工具正在从“帮人写代码”变成“组织 Agent 完成工程任务”。

不要展开 Rust、Tauri、React、模块结构等项目细节，只强调一种范式变化：

```text
传统 IDE：人操作代码
Agent Runtime：人定义目标，Agent 读取上下文、调用工具、执行任务，人负责监督和验证
```

这里可以补一个来自参考材料的极简模型：

```text
Think -> Act -> Observe -> Finish
```

Agent 并不是魔法，而是一个循环：模型思考下一步，调用工具执行动作，观察工具结果，再继续下一轮。真正关键的是 Finish：不能由模型说“我完成了”就算完成，而要绑定测试结果、用户确认、review finding、计划项状态或失败说明等外部证据。

可引出的结论：

> 模型只负责生成下一步意图，工程系统负责把意图变成可执行、可观察、可回滚的步骤。

### 4. 概念一：Agentic Coding，约 3 分钟

Agentic Coding 指 AI 不再只是补全代码，而是能够围绕一个任务执行多步动作：

- 理解需求
- 搜索代码库
- 修改多个文件
- 调用终端和测试
- 根据失败结果自我修正
- 总结变更并提交 review

可以用一组对比抓住学生兴趣：

```text
学生作业：让 AI 写一个排序函数
真实工程：让 AI 修改已有系统，同时不能破坏历史行为、团队规范、性能和测试
```

结论：

> 软件开发的最小单位正在从“代码片段”变成“任务闭环”。

可穿插案例：

- ICSE 2026 / MSR 2026 的一项研究分析了 33k 个 agent-authored PR，问题不再是“AI 会不会提交代码”，而是“AI 提交的 PR 为什么没被合并”。
- BitFun 的 Code Agent、Flow Chat、Deep Review 可以理解为对这种任务闭环的产品化：让 Agent 的探索、修改、验证和审查过程留下可追踪记录。

### 5. 概念二：Context Engineering，约 3 分钟

很多人以为 AI 开发的关键是 prompt，但在真实工程中，更关键的是上下文。

Context Engineering 关注的是：

- 给 AI 哪些需求背景
- 给 AI 哪些代码和接口
- 给 AI 哪些历史决策
- 给 AI 哪些测试结果
- 给 AI 哪些日志和错误信息
- 给 AI 哪些项目规范和禁止事项
- 如何避免无关上下文干扰模型判断

可以用一句话概括：

> Prompt 是一句话，Context 是 AI 工作时能看到的世界。

面向高校听众可以引出一个能力迁移：

> 未来学生不只要学会“怎么问 AI”，还要学会“怎么把一个复杂问题整理成 AI 能可靠工作的上下文”。

可穿插概念：

- MCP：让 AI 标准化连接工具、文档、数据库和内部系统。
- AI-friendly codebase：结构清晰、测试充分、规范明确的代码库，更适合 Agent 工作。
- Harness：把上下文、工具、权限、验证、反馈、trace 统一编排起来，让 Agent 不只是“能做事”，而是“能被工程化地使用”。这里把它放在平台工程和质量治理下讲，不单独展开成主线。

可以用参考材料中的包含关系做一页轻量解释：

```text
Prompt Engineering：如何向模型说话
Context Engineering：如何让模型站在正确事实上
Harness：如何让模型在真实工程环境里不失控
```

### 6. 概念三：AI-assisted SDLC / 软件开发全生命周期，约 3 分钟

传统软件开发生命周期可以简化为：

```text
需求 -> 设计 -> 编码 -> 构建 -> 测试 -> Review -> 发布 -> 运维
```

AI 进入后，每一环都在变化：

- 需求：AI 辅助整理用户反馈、拆解故事、识别影响面。
- 设计：AI 辅助生成方案、比较 trade-off、发现遗漏。
- 编码：Agent 执行代码修改和局部重构。
- 测试：AI 生成测试、解释失败、补充边界用例。
- Review：AI 做初审、多角色审查和风险分级。
- 发布：AI 生成变更说明、升级说明和回滚建议。
- 运维：AI 总结日志、定位异常、聚合用户反馈。

但要强调：

> AI-assisted SDLC 不等于全自动 SDLC。AI 介入越深，越需要明确的工程边界、质量标准和责任归属。

### 7. 概念四：Quality Gates 与 Human Oversight，约 3 分钟

AI 不是越自动越好，而是要根据风险设计不同的人类介入点和质量门槛。

可以按项目类型分层：

| 项目类型 | 合适的 AI 使用方式 |
| --- | --- |
| 课程实验 / 原型 | 可以 AI-first，重点验证想法和学习概念 |
| 个人工具 / 内部脚本 | AI 生成 + 人工检查 + 基础测试 |
| 开源项目 | 小 PR、清晰 diff、CI、review、可回滚 |
| 企业核心系统 | 权限控制、测试门禁、审计日志、灰度发布 |
| 高安全 / 高可靠系统 | AI 辅助分析，关键决策必须由人审批 |

这里可以引入两个判断：

1. AI 会让写代码变快，也会让错误扩散变快。
2. 未来软件工程不是少做测试和 review，而是把测试、review、CI、评测和审计嵌入 AI 工作流。

结论：

> AI 时代的软件工程核心，不是取消流程，而是把流程变成 Agent 可以理解、执行和被约束的系统。

### 8. 结尾：从学生到工程师，角色如何变化？约 1 到 2 分钟

用一张对比表收束：

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
| Agentic Coding 真的进入工程协作了吗？ | agent-authored PR 为什么没被合并 |
| Agent 为什么需要上下文工程？ | `AGENTS.md` 和架构文档作为项目级上下文 |
| AI 进入生命周期后如何验证？ | CI-Bench、测试失败修复、质量门禁 |
| 高风险项目如何做人类监督？ | 税法转代码、安全漏洞判断 |
| 企业为什么需要平台工程？ | trace、权限、规则、工作流沉淀 |
| 高校教学如何变化？ | AI-Driven Software Development 课程考核 |

### 1. 给 AI 一份项目说明书：AGENTS.md

故事讲法：

> 同一个 coding agent，给它一份项目里的“工作说明书”，它会不会更快、更省 token？

ICSE 2026 的 JAWs Workshop 有一篇关于 `AGENTS.md` 的研究，比较 coding agent 在有无仓库级说明文件时的表现。它适合用来引出 Context Engineering：AI 不是只需要一个 prompt，而是需要稳定、版本化、项目级的工作上下文。

可引出的结论：

> 未来的项目文档不只是写给新人看的，也会写给 AI Agent 看。

### 2. AI 已经会提 PR，但为什么很多没被合并？

故事讲法：

> 如果 AI 已经能在 GitHub 上提交 PR，下一步最重要的问题是什么？不是它会不会写，而是它为什么会被 reviewer 拒掉。

MSR 2026 Mining Challenge 中有研究分析了 33k 个 agent-authored PR。这个案例适合引出 Quality Gates、Human Oversight 和真实工程中的 review 价值。

可引出的结论：

> AI 生成代码只是开始，能被团队接受、通过测试、满足边界和长期维护要求，才是工程完成。

### 3. CI 红了，让 AI 修，它真的能修好吗？

故事讲法：

> 学生项目里测试挂了，可能改一行就过；真实项目的 CI 挂了，背后可能是环境、依赖、历史行为、并发和平台差异。

ICSE 2026 Demonstrations 中的 CI-Bench 用真实 CI/CD 失败来评估 LLM repair tools。这个案例适合引出 AI-assisted SDLC 和 EvalOps：评价 AI 编程能力不能只看静态题目，还要看它能不能处理真实工程流水线里的失败。

可引出的结论：

> AI 修 bug 的能力，必须放回真实构建、测试和运行环境里验证。

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

参考目录 `D:\software\Feishu\files\Harness-references-ppt` 中的材料更适合做“概念层表达”和“讲述节奏”的补充。当前报告时间只有 20 分钟，因此建议吸收以下点，而不是完整复刻原报告，也不要把主题偏移到 Harness Engineering。

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

原报告里的六步落地清单很实用，但 20 分钟报告里不宜展开。可以作为最后一页备份或 Q&A：

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
2. 开场问题：AI 会写代码后，程序员还剩什么？
3. 背景变化：从个人效率工具到组织级工程体系
4. BitFun 引子：从 IDE 到 Agent Runtime
5. Agent 循环：Think -> Act -> Observe -> Finish
6. Agentic Coding：开发单位从代码片段变成任务闭环
7. Prompt ⊂ Context ⊂ Harness：从问模型到组织工程系统
8. AI-assisted SDLC：AI 进入软件生命周期全链路
9. Quality Gates and Human Oversight：自动化必须被治理
10. 结论：从会写代码到会组织智能协作系统

如果必须压缩到 7 页，可以合并第 3 页和第 4 页，合并第 5 页和第 7 页，合并第 8 页和第 9 页。

## 面向高校听众的提问点

可以在报告中穿插 2 到 3 个问题，让听众参与思考：

1. 如果 AI 能完成大部分编程作业，编程课应该训练什么能力？
2. 一个会写代码但不会验证 AI 输出的学生，能否胜任真实工程？
3. 未来简历上除了语言和框架，是否还应该体现 AI 工作流、上下文工程和质量治理能力？
4. 你愿意让 AI 自动修改个人项目、开源项目、公司核心系统，还是医疗和金融系统？为什么边界不同？

## 讲述时的注意事项

- 不要把报告讲成 BitFun 项目介绍。BitFun 只负责打开问题，不负责承载全部内容。
- 不要把重点放在某个工具是否最好。工具会变化，范式变化更重要。
- 不要把 AI 描述成“替代程序员”的单线叙事。更准确的说法是：开发者的能力结构和组织方式正在改变。
- 不要过度承诺全自动开发。更可靠的落点是：AI 与软件工程实践结合，形成可监督、可验证、可治理的开发体系。

## 可参考行业材料

- DORA 2025: State of AI-assisted Software Development
- Thoughtworks Technology Radar: agentic workflows, context engineering, AI antipatterns
- GitHub Octoverse: AI and agentic workflows in developer experience
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
