const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pptxgen = require("pptxgenjs");

const outDir = __dirname;
const slidesDir = path.join(outDir, "slides-png-v0.8");
const pptxPath = path.join(outDir, process.env.PPTX_FILE || "ai-redefines-software-development-v0.8.pptx");
const notesPath = path.join(outDir, "speaker-notes-v0.8.md");
const readmePath = path.join(outDir, "README.md");
const contactSheetPath = path.join(outDir, "preview-contact-sheet-v0.8.png");

fs.mkdirSync(slidesDir, { recursive: true });

const W = 1920;
const H = 1080;
const PPT_W = 13.333;
const PPT_H = 7.5;

const C = {
  bg: "#EEF4F8",
  bg2: "#E6EEF5",
  paper: "#FBFDFF",
  ink: "#12202A",
  ink2: "#263845",
  muted: "#667987",
  soft: "#91A1AD",
  line: "#CAD7E2",
  line2: "#AEBFCC",
  teal: "#08776F",
  teal2: "#13AFA4",
  tealSoft: "#D9EFEB",
  blue: "#245FDB",
  blue2: "#4A8DF5",
  blueSoft: "#E2EAFB",
  coral: "#B94616",
  coral2: "#E66C34",
  coralSoft: "#F4E3DB",
  amber: "#9A6700",
  amber2: "#C9921F",
  amberSoft: "#F0E5C7",
  green: "#187A45",
  greenSoft: "#DCEDE2",
  red: "#A9352B",
  redSoft: "#F3DBD8",
  violet: "#5F55BE",
  violetSoft: "#E9E6F7",
  dark: "#102330",
  dark2: "#182F3E",
  cyan: "#0EA5B7",
  steel: "#EAF0F5",
};

const intro =
  "本报告以 AI 放大代码产能后的工程升级为入口，重新梳理 AI 进入软件工程后的核心机会：生成能力已经成为确定趋势，真正需要同步增强的是上下文组织、证据生成、风险分流、阶段门禁和责任承接。报告结合 DORA、METR、Harness、Agent Harness、AgentOps 等研究与工程观点，把 AI 开发收敛为一套可落地、可放大正收益的工程框架。";

const speakerName = process.env.SPEAKER_NAME || "颜仲南";
const speakerOrg = process.env.SPEAKER_ORG || "华为 软件IDE实验室";

const bitfunStats = {
  repo: "GCWing/BitFun",
  url: "https://github.com/GCWing/BitFun",
  ref: "gcwing-http/main",
  range: "2026-04-22 ~ 2026-05-22",
  author: "limityan <limit_yan@sina.com>",
  commits: "241",
  additions: "185,533",
  deletions: "46,479",
  churn: "232,012",
  head: "5ae1d354",
};

const slidesV05Archive = [
  {
    section: "COVER",
    title: "AI 如何重新定义软件开发",
    subtitle: "以 BitFun 为引子，理解 AI 时代的软件工程新范式",
    time: "约 0.5 分钟",
    focus: "建立演讲边界：讨论对象不是某个工具，而是 AI 进入研发流程后，工程协作、验证和责任如何变化。",
    question: "如果 AI 已经能写很多代码，软件工程真正该升级什么？",
    script:
      "各位好，今天分享的主题是《AI 如何重新定义软件开发》。我想先把范围说清楚：今天不做工具演示，也不做某个项目的复盘，而是借 BitFun 这个具体入口，讨论一个更大的变化。当 AI 从补全一行代码，走向能开任务、改代码、跑测试、提交 PR 时，软件开发被改变的就不只是写代码的速度。真正被改写的是工程系统本身：任务如何被委派，证据如何被沉淀，风险如何被放行，最后责任如何落到人和组织上。",
    transition: "先用目录把 15 分钟的路径铺开：从案例入口，到速度背后的代价，再到质量治理和开发者角色。",
    render: slideTitleV02,
  },
  {
    section: "AGENDA",
    title: "报告目录",
    subtitle: "",
    time: "约 0.6 分钟",
    focus: "说明四段主线：产出放大、速度代价、质量治理、开发者角色。",
    question: "这 15 分钟里，大家最想带走的是工具判断、工程方法，还是个人成长路径？",
    script:
      "今天会沿着四段往下讲。第一段从一个很具体的现象开始：当 AI 让一个项目在短时间内产生大量代码，问题是不是就少了，还是被转移到了验证和维护上。第二段看速度背后，为什么局部开发变快，不等于团队交付天然变快。第三段讨论质量治理，重点不是再加一层审批，而是让责任、证据和工程协议变得可执行。第四段回到开发者本人，尤其是刚进入职场的人，应该把能力训练放在哪里。听完之后，希望大家带走的不是某个工具结论，而是一套判断 AI 研发收益和风险的工程视角。",
    transition: "先看第一个现象：代码量突然放大之后，团队真正面对的压力是什么。",
    render: slideAgendaV02,
  },
  {
    section: "01 / SOFTWARE CHANGE",
    title: "单月 10W+ 行代码之后，问题真的变少了吗？",
    subtitle: "AI 放大的不是代码量本身，而是速度、风险和组织方式的重分配。",
    time: "约 1.4 分钟",
    focus: "用 BitFun 统计做压力测试：代码产出扩大后，瓶颈转向验证、维护、协作和上线。",
    question: "如果一个项目单月写出 10W+ 行代码，第一反应该是兴奋，还是先问怎么验证？",
    script:
      "先看一个具体数字。在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日为窗口，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行，删除 46,479 行。这个数字不是为了说明代码越多越好，而是一个很好的压力测试：当 AI 把代码生产速度放大之后，原型可以更快落地，想法可以更快变成 PR，个人也能承担过去需要多人协同的探索工作。但同一时间，测试、review、架构理解、运行验证和知识沉淀不会自动同速扩张。可以把注意力放在右侧的 Git 快照和下方的快速路径上：代码进入仓库变快了，反馈路径也要跟上，否则快只是把问题更早推到 reviewer、CI 和线上环境里。所以真正的问题从“能不能写出来”转向“凭什么能合并、凭什么能发布、出了问题谁解释、长期谁维护”。速度带来的不是单纯收益，而是把系统瓶颈暴露得更快，也要求团队用新的方式组织验证和协作。它更像放大镜，暴露了原来就存在但不够显性的工程压力。",
    transition: "如果顺着这个现象往上看，软件工程要管理的对象就不再只是代码本身。",
    render: slideShockV02,
  },
  {
    section: "01 / SOFTWARE CHANGE",
    title: "主线：产出放大后，协作对象变了",
    subtitle: "从“谁写代码”走向“任务如何被委派、证据如何被放行、责任如何落地”。",
    time: "约 1.3 分钟",
    focus: "把协作对象从代码扩展到任务、Agent、工具执行、证据包和责任链。",
    question: "当 Agent 也能开分支、跑测试、提交 PR 时，团队到底应该管理什么？",
    script:
      "过去谈协作，很多时候是在谈人和人怎么分工，代码怎么进入仓库，PR 怎么被 review。AI Agent 进入之后，协作对象变多了：有异步执行的 Agent，有专门负责实现、测试、评审或文档的角色，有工具调用结果，有 trace，有风险说明，也有回滚路径。左边三个动作可以概括这种变化。第一是任务委派，目标、非目标、影响范围和验收标准要先清楚，否则 Agent 只是在放大模糊需求。第二是角色分工，不同 Agent 可以做不同事，但权限、上下文和生命周期必须受控，不能让所有能力混在一个无限权限的聊天窗口里。第三是证据放行，人不需要盯住每一步操作，但必须能看懂差异、测试、风险和责任。比如一个 issue 不只是需求描述，还应该带上验收标准；一个 PR 不只是 diff，还应该带上测试、trace 和回滚说明。也就是说，AI 时代的软件工程是在管理一个协作系统，而不是只管理代码提交。",
    transition: "协作对象变多以后，下一个关键问题就是：过程可以探索，但结果怎样才能被放行。",
    render: slideCoverV02,
  },
  {
    section: "01 / SOFTWARE CHANGE",
    title: "从传统 SDLC 到人 + Agent SDLC",
    subtitle: "角色没有消失，交付件发生变化：从人交接文档，转向人、Agent、平台共同维护证据。",
    time: "约 1.3 分钟",
    focus: "解释 SDLC 中每个角色的交付件如何从文档交接转向可验证证据。",
    question: "如果没有做过完整复杂项目，怎么理解软件工程不只是写代码？",
    script:
      "软件开发本来就不是一个人从头写到尾。产品负责需求和验收，设计负责交互和接口约束，开发负责模块、代码和 PR，测试负责用例、报告和回归，运维负责发布、监控和恢复。AI 进入之后，这些角色不会消失，但交付件的形态会变化。产品和开发要把目标、边界、场景和验收标准写得更结构化；设计约束、ADR 和例外情况要更显性；开发不只是交出代码，还要交出计划、diff 和 trace；测试不只是跑用例，还要形成连续证据；运维的回滚、复盘和学习也会回到系统里。换句话说，每个角色都需要把过去靠经验口头传递的内容，转成 Agent 能执行、工具能检查、人能判断的对象。核心变化是从“人交接文档”转向“Agent 可执行、人可判断、平台可验证的证据”。这也是为什么 AI 不是替代 SDLC，而是在重新定义 SDLC 里的交付物。",
    transition: "有了这个流程视角，再看概率过程和证据放行，会更容易理解为什么需要新的工程机制。",
    render: slideSdlcShiftV05,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "关键机制：概率过程，证据放行",
    subtitle: "允许 Agent 多路径探索，但把放行收敛到可复现证据和阶段门禁。",
    time: "约 1.4 分钟",
    focus: "解释可控系统如何收敛不可控过程：沙箱、权限、证据包和阶段门禁各承担什么责任。",
    question: "如果每一步都有 99% 正确率，十步之后系统还可信吗？",
    script:
      "AI 参与软件工程后，一个重要观念是：过程可以是概率性的，但放行不能只靠概率。比如每一步看起来都有 99% 的正确率，十步串起来大约只剩 0.90，这还没有考虑模型版本变化、上下文缺失、工具返回异常和角色之间相互放大错误。解决方法不是让人盯住每一步 prompt，而是把过程放进可控系统。左侧是概率探索层，沙箱执行、权限控制、失败回注和 trace 回放，让过程可观察、可停下、可追责。中间是证据包，把 diff、测试、风险和回滚路径压缩成可判断对象。右侧是阶段门禁，只在计划到实现、实现到评审、评审到合并、发布到复盘这些转换点做放行判断。这里的关键是把不确定性限制在探索空间里，把确定性建立在证据和门禁上。人的重点不是监督每个动作，而是判断证据是否足够、风险是否可接受、责任是否清楚。这样既保留 Agent 多路径探索的效率，也避免把概率性输出直接推到生产链路里。模型给可能性，工程系统要给可复现性和可追责性。",
    transition: "这套机制解释了为什么 AI 很快，但组织收益不会天然按指数增长。",
    render: slideReliabilityV02,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "速度收益不是指数曲线",
    subtitle: "AI 提升局部产出，但验证、评审、修复与集成会重新分配收益。",
    time: "约 1.2 分钟",
    focus: "用 DORA、METR、Harness 三类外部信号说明：局部加速会把隐藏工作推到评审、修复和集成环节。",
    question: "为什么开发者感觉更快，团队整体却未必同等加速？",
    script:
      "外部研究也在提醒同一件事：AI 带来的速度收益不是一条简单的指数曲线。DORA 2025 把 AI 看成组织系统的放大器，高质量组织会被放大，碎片化流程也会被放大；工具采用本身并不自动等于收益。METR 在成熟开源项目上做过随机对照实验，发现经验开发者使用当时的 AI 工具反而慢 19%，这说明熟悉代码库、理解上下文、处理边界条件仍然很重。Harness 2026 把问题放到工程管理上：很多团队的局部生产力指标变好，但 code review、修 bug、工具切换和验证工作也在增加。三个信号要合在一起看：AI 可以让局部动作更快，但组织收益取决于系统是否能吸收这些变化。结论不是 AI 没用，而是速度收益必须和验证成本、返工成本、评审压力一起衡量。如果只统计写了多少代码，就会高估收益；如果能统计从需求到稳定发布的净时间，才更接近真实生产力。",
    transition: "所以接下来要看速度的代价：返工和风险怎样从隐形成本变成可管理队列。",
    render: slideExternalSignalsV02,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "速度的代价：把返工变成可管理队列",
    subtitle: "处理办法不是再加审批，而是量化代价、分流风险、闭环修复。",
    time: "约 1.4 分钟",
    focus: "给出三个落地动作：量化净时间、按风险分流、让失败回到 Agent 与 CI 闭环。",
    question: "当 AI 让代码进入仓库的速度变快，团队怎样避免 review、返工和集成变成新瓶颈？",
    script:
      "当写代码变快以后，新的瓶颈往往不在键盘上，而在 review 队列、返工循环、CI 稳定性、跨团队集成和线上恢复。处理办法不是简单多加审批，而是把返工变成可管理队列。第一步是量化代价，看净时间而不是代码量：从需求到可验证结果用了多久，PR 等待多久，返工率是多少，失败重跑多少次，MTTR 有没有变差。第二步是风险分流，不是所有 AI 变更都走同一条线，而是按 owner、diff 大小、模块热度和 SLO 影响打标；低风险自动验证，高风险进入设计和人工评审。第三步是闭环修复，让 CI 失败、trace 归因、根因复盘回到 Agent 和工程系统。这样做的好处是，团队不用靠最后一个 reviewer 硬扛所有不确定性，而是把不同风险的变更排进不同队列。队列本身也要有优先级和退出标准，否则低风险和高风险混在一起，速度会被平均掉。速度提升才不会把成本甩给流程末端，而是进入可度量、可排队、可修复的流程。",
    transition: "速度和返工被纳入管理之后，质量治理才有可能真正落地。",
    render: slideLifecycleV02,
  },
  {
    section: "03 / QUALITY GOVERNANCE",
    title: "工程质量：责任、证据与工程协议",
    subtitle: "开源重公共责任，大厂重复杂交付；共同核心是把质量要求变成可执行证据。",
    time: "约 1.4 分钟",
    focus: "区分开源与大厂场景，但落到同一个核心：质量要求必须变成可复核工件。",
    question: "AI 让提交变多以后，维护者和平台团队到底该看什么？",
    script:
      "质量治理在不同场景里重点不同。开源项目更强调公共责任：贡献者要对自己的提交负责，维护者要能判断陌生贡献和 AI-assisted 变更是否值得信任。大厂复杂交付更强调系统连续性：一个变更会牵涉 owner、依赖链、合规、发布窗口和线上事故成本。两边看似不同，但核心一致：质量要求不能停留在口头承诺或文档口号里，必须变成可复核工件。责任链说明谁决策、谁审核、谁承担后果；证据链说明测试、日志、trace、风险和回滚路径是否完整；Artifact 链说明代码、配置、依赖、发布物和运行数据如何互相追踪。比如一个变更影响了鉴权、计费或发布流程，不能只写“已自测”，而要能看到相关用例、风险说明、owner 确认和回滚方案。这样维护者不必猜测变更可信不可信，而是围绕证据做判断。DFX、TDD、Code Review 也应该从人的流程习惯，逐步变成 Agent 能读取、工具能检查、人能复核的工程协议。质量治理的重点不是让流程更重，而是让判断有依据。",
    transition: "当这些协议进入真实流程，就会形成从 Issue 到 PR 的可治理工作流。",
    render: slideQualityV02,
  },
  {
    section: "03 / QUALITY GOVERNANCE",
    title: "把 AI 开发组织成可治理工作流",
    subtitle: "从 Issue 到 PR，不是聊天产物堆叠，而是交付对象、证据包和阶段门禁。",
    time: "约 1.4 分钟",
    focus: "把 AI 开发压成五个稳定环节：任务入口、隔离执行、证据包、独立评审、阶段放行。",
    question: "如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？",
    script:
      "把前面的原则落到团队工作流，可以拆成五个稳定环节。第一，任务从 Issue 或 Spec 进入，先明确目标、非目标、验收标准和风险边界。第二，Agent 在隔离工作区执行，探索过程可以充分展开，但不能直接污染主分支。第三，执行结束必须生成证据包，包括 diff 摘要、测试结果、日志、trace、未决风险和回滚路径。第四，评审要尽量角色分离，发现问题、仲裁问题、修复问题和验证修复，不要全部压在同一个角色身上。第五，阶段门禁决定能否进入 PR、合并或发布。这个顺序很重要：没有清晰任务，后面的证据会失焦；没有隔离执行，探索会污染主线；没有证据包，评审只能靠印象；没有独立评审，修复和验证容易混在一起。每一关都应该有明确输入和输出，缺少证据就停在当前阶段，而不是靠负责人记忆补齐。这里的关键不是把所有操作都录下来，而是把复杂过程压缩成团队能读、能审、能追责的交付对象和证据。",
    transition: "有了这样的工作流，再看开发者角色，就不会落到人和 AI 谁替代谁的简单问题上。",
    render: slideBitfunV02,
  },
  {
    section: "04 / DEVELOPER ROLE",
    title: "开发者角色：在新工程系统中找准位置",
    subtitle: "人不只是设计系统，而是在关键阶段承担目标、边界、证据和责任。",
    time: "约 1.5 分钟",
    focus: "明确人和 AI 在四个阶段的分工：定义问题、组织上下文、编排执行、证据放行。",
    question: "AI 参与每个阶段后，人类开发者最不可替代的技能是什么？",
    script:
      "从开发者个人角度看，未来不是人写代码、AI 做补全这么简单，而是人在不同阶段承担不同责任。第一阶段是定义问题，人负责价值判断、非目标和风险边界，AI 可以帮助整理信息和生成备选方案。第二阶段是组织上下文，人负责架构取舍、事实源选择和约束解释，AI 负责检索、摘要和草拟计划。第三阶段是编排执行，人负责设置权限、节奏、验证矩阵和停止条件，AI 负责生成、修改、运行和反馈。第四阶段是证据放行，人负责最终责任、质量解释和复盘沉淀，AI 提供 trace、diff、测试结果和改进建议。这里不是说开发者离代码越来越远，相反，只有理解代码、架构和运行约束，才知道该给 AI 什么上下文、该相信哪些证据、该在什么地方停下来。越是 AI 能快速完成表层实现，越要把人的时间放在问题选择、事实核验和风险解释上。编程基础仍然重要，但能力结构会从语法实现，升级到问题定义、系统判断、证据审查和协作治理。人的价值不是站在 AI 旁边看它写代码，而是在目标、边界、证据和责任上站稳，并把机器产出转化成团队可以放心承接的工程结果。",
    transition: "最后把这个判断落到新人工程师身上：第一年最应该训练哪些能力。",
    render: slideRoleV02,
  },
  {
    section: "04 / DEVELOPER ROLE",
    title: "刚入职场：四个能力方向",
    subtitle: "AI 会降低写代码门槛，但不会自动补齐判断、验证、理解和协作能力。",
    time: "约 1.1 分钟",
    focus: "给新人明确训练方向：读懂代码、证据交付、理解场景、承担责任边界。",
    question: "当 AI 可以帮你更快完成任务，第一年最应该刻意训练什么？",
    script:
      "对刚入职场的人来说，关键不是要不要用 AI，而是不要把成长路径外包给 AI。外部调研已经很清楚：大量开发者在使用或准备使用 AI，但对输出准确性的信任并不高；一些受控实验也提示，过度依赖 AI 可能影响调试和理解能力。更稳妥的训练方向有四个。第一，读懂与解释代码，至少能复现错误、读懂 diff、解释关键实现和边界条件。第二，证据驱动交付，把测试、CI、日志、trace 和 review 当成交付的一部分，而不是写完代码后的附属品。第三，理解需求与场景，知道用户路径、产品定位、体验约束和验收标准。第四，承担责任边界，能判断该不该做、能不能合、出了问题如何解释。使用 AI 时，可以让它帮你生成方案，但要逼自己说清为什么这样做、怎么验证、失败了怎么回滚。把能写代码升级为能理解问题并可靠交付，这会是新人最重要的专业位置。",
    transition: "最后用两个问题收束，进入交流。",
    render: slidePredictionV02,
  },
  {
    section: "THANKS AND Q&A",
    title: "谢谢",
    subtitle: "AI 编程、工程治理、开发者角色",
    time: "约 0.8 分钟（收束 + Q&A 入口）",
    focus: "收束主旨并把讨论引向收益指标、确定性证据和开发者成长。",
    question: "AI 编程真正值得追踪的收益指标、证据指标和成长指标分别是什么？",
    script:
      "最后把今天的内容收束成三句话。第一，AI 扩大了个人产出，但团队不能只看代码量，而要看净交付时间、返工率、评审压力和线上风险。第二，AI 的执行过程可以概率化，但放行必须依赖确定性证据，包括测试、trace、风险说明、owner 和回滚路径。第三，开发者的成长不会停留在会不会写代码，而会更多转向架构判断、上下文组织、证据设计和工程治理。如果只把 AI 当成写代码工具，会低估它对流程的影响；如果只把 AI 当成替代人，也会低估人在目标、边界和责任上的价值。接下来可以围绕 AI 编程、工程治理和开发者角色继续交流。",
    transition: "进入 Q&A。",
    render: slideThanksV02,
  },
];

const slides = [
  {
    section: "COVER",
    title: "AI 如何重新定义软件开发",
    subtitle: "从代码产能，到可治理交付",
    time: "约 0.5 分钟",
    focus: "建立主旨：AI 放大的不是单纯代码量，而是对工程治理系统的要求。",
    question: "当代码生成不再是瓶颈，软件工程真正需要同步升级的是什么？",
    script:
      "各位好，今天分享的主题是《AI 如何重新定义软件开发》。先把基调说清楚：AI 一定是软件工程的未来方向，而且长期看对研发效率和工程质量都会是正收益。今天不想把讨论停在某个工具有多会写代码，而是看这份正收益如何稳定落到团队交付里。封面上的副标题是“从代码产能，到可治理交付”：前半句承认 AI 已经显著提高了从想法到代码的速度，后半句强调这份速度必须被上下文、测试、评审、边界和责任系统接住。换句话说，生成能力已经是确定趋势，下一步需要升级的是软件工程里的上下文、证据、门禁和责任系统。",
    transition: "先看今天的主线，把后面 15 分钟的判断链路铺开。",
    render: slideTitleV02,
  },
  {
    section: "AGENDA",
    title: "目录",
    subtitle: "",
    time: "约 0.7 分钟",
    focus: "用一条链路组织全篇：问题、证据、框架、职责变化。",
    question: "AI 研发的收益，到底应该从代码量、交付速度，还是风险可控性来判断？",
    script:
      "今天按一条比较直的主线讲。第一步看现实问题：当代码产能被 AI 放大以后，验证、评审、维护和责任不会自动变轻。第二步看研究共识：DORA、METR、Harness 等研究都在提示，AI 收益取决于组织系统，而不是单点工具。第三步给出工程治理框架：任务入口、隔离执行、判断上下文、独立评审、阶段门禁和复盘回注。第四步回到能力演进：团队要建设可治理的交付系统，个人要把判断建立在事实、风险和证据上。",
    transition: "先从代码产能被放大的现实问题进入，看看它到底暴露了什么工程压力。",
    render: slideAgendaV02,
  },
  {
    section: "01 / 现实观察",
    title: "单月 10W+ 行代码之后，问题真的变少了吗？",
    subtitle: "高速产出不是结论，而是工程系统的压力测试。",
    time: "约 1.3 分钟",
    focus: "用 BitFun 统计把问题落到真实场景：代码增长后，验证和维护才是主要压力。",
    question: "如果一个项目单月写出 10W+ 行代码，第一反应该是兴奋，还是先问怎么验证？",
    script:
      "先看一个具体数字。在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日为窗口，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行，删除 46,479 行。这个数字不是为了证明代码越多越好，而是一个压力测试：AI 能让想法更快变成原型，也能让个人承担过去需要多人探索的工作。但它同时把另一些问题推到了前台：这些代码凭什么可以合并，哪些测试能覆盖风险，review 压力由谁承担，出了问题如何回滚，长期维护如何接住。所以 BitFun 这个案例更像一个入口，它提醒我们，AI 放大的是整个工程链路，而不是单独放大键盘速度。真正值得讨论的不是“能不能更快写出来”，而是“快出来之后，团队有没有足够的机制把它变成可信交付”。",
    transition: "单个项目的现象还不够，需要看看外部研究是否也指向同一个判断。",
    render: slideShockV02,
  },
  {
    section: "02 / 研究共识",
    title: "研究共识：从速度争议到 Agent 工程化",
    subtitle: "最新信号不只讨论生产率，也开始转向架构选择、生产测量、平台治理和质量。",
    time: "约 1.4 分钟",
    focus: "用企业研究、顶会论文和行业判断压实判断：AI 研发收益要从工具采用转向可测量、可验证、可治理的工程系统。",
    question: "为什么开发者感觉更快，团队整体交付却未必同等变快？",
    script:
      "外部信号现在已经不只停留在“AI 到底快不快”。Google Research 和 DeepMind 的 agent scaling 研究说明，多 Agent 不是越多越好，是否有效取决于任务是否可并行、工具密度和协调方式。IBM Research 在 ICLR 2026 的 MAP 研究观察生产 Agent，发现很多真实部署反而采用简单、可控、短链路的方式，人类评估和可靠性仍然是核心。Gartner 2026 对企业 coding agent 市场的判断也很关键：IDE 正在从唯一入口变成可选入口，治理、验证、控制会更多转向自动化平台。再看软件工程研究，MSR 2026 的 Cursor/Agent 研究把问题落到代码仓库：前置速度收益可能伴随静态告警、重复代码和认知复杂度上升。把这些合起来看，AI 研发的先进方向不是更会聊天，也不是只追求更多自动化，而是系统化：根据任务选择架构，把生产过程做短、做稳，把治理和验证平台化，同时用质量指标约束速度收益。",
    transition: "这些外部信号共同指向一个问题：如果收益来自系统，那这个系统到底由什么构成。",
    render: slideExternalSignalsV02,
  },
  {
    section: "03 / 工程治理",
    title: "BitFun：把 AI 执行放进工程控制面",
    subtitle: "规则上下文、工具准入、权限隔离和验证矩阵，共同保护 AI 交付能力。",
    time: "约 1.4 分钟",
    focus: "用 BitFun 本地工程机制说明运行基座不是概念，而是规则、工具、权限和验证的组合。",
    question: "同样的模型，为什么放进不同工程系统里，可靠性会差很多？",
    script:
      "把这个观点落回 BitFun，会看到它不是一句抽象的“用好上下文”。第一层是规则上下文，仓库级和模块级规则文件、架构文档、日志规范、远程兼容规则，会先告诉 AI 什么能改、什么边界不能碰。第二层是工具准入，工具执行链里有可用工具白名单、运行时限制，折叠工具还要求先读取工具规格，避免模型在不知道完整约束时直接调用。第三层是路径和权限隔离，运行产物不能越过项目根目录，小应用的文件、命令、网络能力走白名单，权限变更还会标出高风险差异。第四层是验证矩阵，前端、深度评审、共享后端、桌面集成分别有最小验证路径。这样看，BitFun 的工程控制面不是多写几条提示词，而是把规则、工具、权限和验证做成 AI 可以读取、系统可以拦截、人可以复核的结构。",
    transition: "有了这个控制面，再看 Agent 执行，就能理解为什么过程可以探索，但结果必须用证据放行。",
    render: slideExplorationV02,
  },
  {
    section: "03 / 工程治理",
    title: "关键机制：概率过程，证据放行",
    subtitle: "允许 Agent 多路径探索，但把放行收敛到可复现证据和阶段门禁。",
    time: "约 1.4 分钟",
    focus: "解释可控系统如何收敛不可控过程：沙箱、权限、判断上下文和阶段门禁各自承担责任。",
    question: "如果每一步都有 99% 正确率，十步之后系统还可信吗？",
    script:
      "AI 参与软件工程后，一个关键原则是：过程可以是概率性的，但放行不能只靠概率。比如每一步看起来都有 99% 的正确率，十步串起来大约只剩 0.90，这还没有考虑模型版本变化、上下文缺失、工具异常和多 Agent 之间的错误放大。解决方法不是让人盯住每一步提示词，而是把执行过程放进可控系统。左侧是概率探索层，沙箱执行、权限控制、失败回注和执行轨迹回放，让过程可观察、可停下、可追责。中间是 PR 判断上下文，把变更差异、测试、风险和回滚路径压缩成可判断对象。右侧是阶段门禁，只在计划到实现、实现到评审、评审到合并、发布到复盘这些转换点做判断。人的重点不是监督每个动作，而是判断证据是否足够、风险是否可接受、责任是否清楚。这样既保留 Agent 探索的空间，又避免把不确定性直接推到主分支和生产环境。",
    transition: "把这个机制落到团队流程里，就会形成一条可治理工作流。",
    render: slideReliabilityV02,
  },
  {
    section: "03 / 工程治理",
    title: "落地框架：从 Issue 到 PR 的可治理工作流",
    subtitle: "不是聊天产物堆叠，而是任务、环境、判断上下文、评审和门禁的连续交付对象。",
    time: "约 1.4 分钟",
    focus: "给出一条可执行工作流：任务入口、隔离执行、判断上下文、独立评审、阶段放行。",
    question: "如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？",
    script:
      "把前面的原则落到团队工作流，可以拆成五个稳定环节。第一，任务从 Issue 或 Spec 进入，先明确目标、非目标、验收标准和风险边界。第二，Agent 在隔离工作区执行，探索可以充分展开，但不能直接污染主分支。第三，执行结束要生成 PR 判断上下文，也就是把为什么改、改了什么、怎么验证、风险如何退放到一起。第四，评审要角色分离，发现问题、仲裁问题、修复问题和验证修复，不要全部压在同一个角色身上。第五，阶段门禁决定能否进入 PR、合并或发布。这个顺序很重要：没有清晰任务，判断上下文会失焦；没有隔离执行，探索会污染主线；没有判断上下文，评审只能靠印象；没有门禁，自动化就会直接绕过责任。它的价值是把 AI 的不确定执行，压缩成团队能读、能审、能追责的交付对象。",
    transition: "这个流程里最关键的转换，是把变更判断上下文和整体效率连起来。",
    render: slideBitfunV02,
  },
  {
    section: "03 / 工程治理",
    title: "速度变成效率：先让变更可判断",
    subtitle: "AI 加快提交进入评审；判断上下文减少猜测、等待与返工，最终看端到端效率。",
    time: "约 1.5 分钟",
    focus: "把 PR 判断上下文与整体效率合成一页：局部速度要通过可判断上下文，才能沉淀为端到端交付效率。",
    question: "当 AI 让代码更快进入评审，团队靠什么避免等待和返工吞掉这份加速？",
    script:
      "刚才这条工作流里，最容易被忽略的是一个转换：AI 让局部速度变快，但团队真正需要的是整体效率变快。左边是确定的正向价值，想法到原型、代码生成、提交反馈都会更快。问题在于，如果评审者只收到一堆 diff，等待、猜测和返工会把这份加速吃掉。中间的变更判断上下文，就是把为什么改、改了什么、怎么验证、风险如何退放在一起。它不是增加文档，而是减少评审者重新拼上下文的成本，让低风险变更更快通过，让高风险变更更早暴露。右边才是最终口径：端到端周期有没有缩短，评审等待有没有下降，返工闭环是不是更短，构建和恢复是不是更稳定。这样看，代码写得快只是入口；变更可判断、返工可闭环、风险可追踪，才是工程意义上的快。",
    transition: "有了可判断的效率口径之后，下一步要看质量要求如何沉淀成可复核链路。",
    render: slideReviewEfficiencyV09,
  },
  {
    section: "03 / 工程治理",
    title: "速度的代价：把返工变成可管理队列",
    subtitle: "处理办法不是再加审批，而是量化代价、分流风险、闭环修复。",
    time: "约 1.2 分钟",
    focus: "给出三个落地动作：量化净时间、按风险分流、让失败回到 Agent 与 CI 闭环。",
    question: "当 AI 让代码进入仓库的速度变快，团队怎样避免 review、返工和集成变成新瓶颈？",
    script:
      "当写代码变快以后，新的瓶颈往往不在键盘上，而在代码评审队列、返工循环、持续集成稳定性、跨团队集成和线上恢复。处理办法不是简单多加审批，而是把返工变成可管理队列。第一步是量化代价，看净时间而不是代码量：从需求到可验证结果用了多久，评审等待多久，返工率是多少，失败重跑多少次，平均恢复时间有没有变差。第二步是风险分流，不是所有 AI 变更都走同一条线，而是按责任人、变更规模、模块热度和稳定性影响打标；低风险自动验证，高风险进入设计和人工评审。第三步是闭环修复，让持续集成失败、执行轨迹归因、根因复盘回到 Agent 和工程系统。这样团队不是让最后一个评审者承担全部不确定性，而是把不同风险的变更放进不同队列。核心是让速度收益进入可度量、可排队、可修复的流程。",
    transition: "有了队列和证据之后，质量治理才有可能真正落地。",
    render: slideLifecycleV02,
  },
  {
    section: "04 / 能力演进",
    title: "BitFun：能力保护式重构",
    subtitle: "AI 可以加速拆解，但 runtime owner 迁移必须先锁住产品能力。",
    time: "约 1.5 分钟",
    focus: "用 BitFun core decomposition、product-full、boundary check、等价测试说明未来演进如何保护工程能力。",
    question: "当 AI 让重构速度变快，团队如何避免把能力边界拆散？",
    script:
      "第 10 页回到 BitFun 的未来演进。这里不想讲一套复杂架构图，只讲一个迁移原则：先锁能力，再迁 owner。左边的小图横轴是速度，纵轴是质量。蓝线表示只有速度、没有能力保护的重构，迁移推进得越快，越容易把质量、边界和行为等价挤掉；橙线表示能力保护式重构，速度上升的同时，用工程机制把质量托住。落到 BitFun，就是四个动作：先用 product-full 锁住完整产品能力；再为 owner 迁移设计 port/provider；然后用 boundary check 检查依赖方向；最后用契约测试和快照证明行为没有变。这里的重点不是让 AI 更快搬代码，而是让 AI 在一套保护能力的迁移协议里工作。这样未来 BitFun 拆 core、迁 runtime owner、推进 product domains 时，速度提升不会变成能力丢失。",
    transition: "守住能力边界以后，质量要求才可以继续前移到 DFX、TDD 和 Review 协议。",
    render: slideQualityV02,
  },
  {
    section: "04 / 能力演进",
    title: "工程协议：DFX、TDD、Review 可执行化",
    subtitle: "未来的护栏不是文档清单，而是 Agent 可读取、工具可检查、人可复核的契约。",
    time: "约 1.3 分钟",
    focus: "把 DFX、TDD、Code Review 从人的习惯升级为可执行工程协议。",
    question: "哪些质量要求应该从文档和经验，变成工具可以检查的规则？",
    script:
      "质量治理再往下落地，就是把 DFX、TDD 和 Code Review 从人的习惯，转成 Agent 可读取、工具可检查、人可复核的工程协议。AI 对 DFX 的影响，是让性能、安全、可观测、可维护这些要求必须更早进入生成和评审过程，否则生成越快，架构债越快。AI 对 TDD 的影响，是测试不再只是开发者写完以后补用例，而是先定义失败证据、验收边界和回归口径，再让 Agent 在边界内生成和修复。AI 对 Review 的影响，是第一轮检查可以更自动化，但人要从代码风格检查转向风险、依赖、owner、回滚和证据完整性的仲裁。这里的关键是把规则拆细，拆成工具能检查、Agent 能理解、人能判断的约束。好的工程协议不是让人少负责，而是让人可以把责任建立在更可靠的证据上。",
    transition: "最后回到开发者：人在这个系统里到底负责什么。",
    render: slideFutureQualityV02,
  },
  {
    section: "04 / 能力演进",
    title: "职责变化：团队建系统，个人守判断",
    subtitle: "团队把上下文、证据、指标和门禁做实；个人在目标、边界、风险和责任上站稳。",
    time: "约 1.7 分钟",
    focus: "合并团队职责和个人职责：团队负责可治理交付系统，个人负责问题定义、事实核验、风险解释和责任承接。",
    question: "AI 参与每个阶段后，哪些能力应该由团队系统承接，哪些判断必须由人站出来承担？",
    script:
      "最后把前面的内容合成职责变化。团队层面，最重要的不是追求全自动，而是建设可治理交付系统。第一，要把需求、架构、日志、测试和历史决策组织成 Agent 可以使用的上下文。第二，要把测试、CI、trace、review 和风险说明变成证据包，而不是写完代码后的附属品。第三，要建立净收益指标，看净时间、返工率、评审压力和线上风险，而不是只看代码量。第四，要用权限、隔离执行、独立评审和阶段门禁守住责任边界。个人层面，变化不是远离代码，而是把判断位置前移和上移。开发者要会定义问题，说明非目标和风险边界；要会核验事实，知道哪些上下文可信；要会解释风险，判断什么可以合、什么必须慢下来；也要能承担最终责任，出了问题能复盘和沉淀。对新人来说，能力训练顺序也会变化：先学会读懂系统、读懂证据、读懂运行约束，再追求让 AI 帮你写得更快。团队把流程做实，个人把判断站稳，这两件事合起来，才是 AI 时代的软件工程升级。",
    transition: "最后用三条结论收束。",
    render: slideResponsibilityV06,
  },
  {
    section: "THANKS AND Q&A",
    title: "谢谢",
    subtitle: "从代码产能，到可治理交付",
    time: "约 0.9 分钟（收束 + Q&A 入口）",
    focus: "用三条外部研究引出的讨论问题收束，给 Q&A 留入口。",
    question: "如果 AI 已经进入日常开发，团队最应该先讨论收益、治理，还是人的判断位置？",
    script:
      "最后我不把结论收成标准答案，而是留三个讨论入口。第一，Google 和 DeepMind 的 agent scaling 研究说明多 Agent 不是越多越好，那么我们在团队里该如何判断任务适合单 Agent、并行 Agent 还是集中编排。第二，IBM MAP 和 Gartner 的信号都指向生产化：真实企业更关心短链路、可控、人类评估、治理和验证平台，那么我们的工具建设要不要从单点能力转向运行基座。第三，MSR 2026 提醒我们，速度提升可能被复杂度和质量风险吞回，那么团队要如何把质量债、返工率和维护成本纳入 AI 研发的收益计算。用一句话收束：AI 重新定义软件开发，不是因为它能写更多代码，而是因为它逼我们把软件工程从经验流程，升级成可验证、可治理、可复盘的系统。",
    transition: "进入 Q&A。",
    render: slideThanksV02,
  },
];

const positiveToneOverrides = [
  {
    index: 1,
    title: "目录",
    focus: "用四个风格统一的模块组织全篇：现实观察、研究共识、工程治理、能力演进。",
    script:
      "今天按四个模块讲。第一是现实观察：AI 已经把代码产能打开了，下一步是让验证、评审、维护和责任一起升级，承接这份生产力。第二是研究共识：DORA、METR、Harness 等研究都在提示，AI 收益取决于组织系统，而不是单点工具。第三是工程治理：控制面、判断上下文、独立评审、阶段门禁和复盘回注，不是给 AI 降速，而是让 AI 的速度稳定变成净交付。第四是能力演进：团队要建设可治理的交付系统，个人要把判断建立在事实、风险和证据上。",
    transition: "先从代码产能被放大的现实问题进入，看看团队怎样把这份生产力接成稳定收益。",
  },
  {
    index: 2,
    title: "单月 10W+ 行代码之后，速度从哪里来？",
    subtitle: "AI 缩短的是从想法到反馈的周期；质量取决于验证、评审和维护能否同步扩容。",
    focus: "用 BitFun 统计说明速度来自反馈周期压缩，同时点明质量压力会转移到评审、持续集成、维护和上下文承接。",
    question: "如果代码进入仓库更快了，团队怎样判断质量也在变好？",
    script:
      "先看一个具体数字。在 GCWing/BitFun 仓库里，以 2026 年 4 月 22 日到 5 月 22 日为窗口，作者 limityan 在 main 分支上有 241 个提交，新增 185,533 行，删除 46,479 行。这个数字首先说明，AI 对软件开发的产能提升是真实的。接下来要把它拆成三层看。第一层是事实：产能跃迁已经发生，单月 10W+ 行代码让过去很多探索工作可以更快被推到仓库里。第二层是速度来源：速度不只是敲键盘更快，而是反馈周期被压缩，想法更快变成原型，原型更快进入评审，问题更早暴露。第三层是质量影响：代码更快进入仓库后，压力会转向代码评审、持续集成、上下文理解、维护和回滚。这里的主旨是，AI 放大的不是单个键盘速度，而是从想法到反馈的整个回路；团队要把速度变成长期正收益，就要同步升级验证、评审和维护能力。",
    transition: "单个项目的现象还不够，需要看看行业研究是否也指向“收益来自系统化承接”。",
  },
  {
    index: 3,
    title: "研究共识：从速度争议到 Agent 工程化",
    focus: "用企业研究、顶会论文和行业判断提炼共识：AI 研发收益来自系统化承接，而不是单点工具采用。",
    script:
      "研究共识现在已经不只停留在“AI 到底快不快”，而是在讨论怎样把 AI 变成稳定的工程能力。Google Research 和 DeepMind 的 agent scaling 研究说明，多 Agent 不是越多越好，是否有效取决于任务是否可并行、工具密度和协调方式。IBM Research 在 ICLR 2026 的 MAP 研究观察生产 Agent，发现很多真实部署采用简单、可控、短链路的方式，这说明生产化不是倒退，而是让 Agent 更容易进入真实流程。Gartner 2026 对企业 coding agent 市场的判断也很关键：IDE 正在从唯一入口变成可选入口，治理、验证、控制会更多转向自动化平台。再看软件工程研究，MSR 2026 的 Cursor/Agent 研究提醒我们，速度收益需要质量机制承接。把这些合起来看，AI 研发的先进方向不是只追求更多自动化，而是系统化：根据任务选择架构，把生产过程做短、做稳，把治理和验证平台化，让速度收益稳定沉淀为工程收益。",
  },
  {
    index: 4,
    title: "BitFun：把 AI 执行放进工程控制面",
    subtitle: "规则上下文、工具准入、权限隔离和验证矩阵，共同保护 AI 交付能力。",
    script:
      "把这个观点落回 BitFun，会看到它不是一句抽象的“用好上下文”，而是在给 AI 能力搭更大的舞台。第一层是规则上下文，仓库级和模块级规则文件、架构文档、日志规范、远程兼容规则，会先告诉 AI 什么能改、什么边界需要确认。第二层是工具准入，工具执行链里有可用工具白名单、运行时限制，折叠工具还要求先读取工具规格，让模型能在更清楚的约束里行动。第三层是路径和权限隔离，运行产物不能越过项目根目录，小应用的文件、命令、网络能力走白名单，权限变更还会标出高风险差异。第四层是验证矩阵，前端、深度评审、共享后端、桌面集成分别有最小验证路径。这样看，BitFun 的工程控制面不是限制 AI，而是让 AI 的能力可以被团队更放心地复用和放大。",
  },
  {
    index: 5,
    title: "从概率探索到确定放行",
    subtitle: "Agent 可以多路径探索；中间件负责把过程变成可审、可测、可追责的证据。",
    focus: "讲清楚概率过程与确定性中间件的分工：探索可以发散，放行必须收敛到证据和门禁。",
    question: "如果 Agent 的每一步都可能波动，团队靠什么把最终交付变得可判断？",
    script:
      "这中间有一个关键分工：Agent 的执行过程可以是概率探索，但团队放行不能是概率判断。单步 99% 看起来很高，十步串起来大约只剩 0.90；这不是在否定 AI，而是在说明长链路需要工程中间件来收敛。左侧是概率探索层，Agent 可以在沙箱里尝试实现、调用工具、失败回注、重跑测试，这一层的价值是让探索足够快。中间是确定性中间件，它不负责替 Agent 思考，而是记录执行轨迹、约束权限、归一变更差异、收集测试、标注风险，形成后面 PR 评审用的判断上下文。右侧才是放行门禁，只在计划到实现、实现到评审、评审到合并、发布到复盘这些转换点做判断。人的重点不是盯住每一步提示词，而是判断证据是否足够、风险是否可接受、责任是否清楚。这样 AI 的探索空间被放大，团队的交付确定性也能被托住。",
    render: slideReliabilityBridgeV08,
  },
  {
    index: 6,
    script:
      "把前面的原则落到团队工作流，可以拆成五个稳定环节。第一，任务从需求或问题单进入，先明确目标、非目标、验收标准和风险边界。第二，Agent 在隔离工作区执行，探索可以充分展开，同时主线始终保持稳定。第三，执行结束生成 PR 判断上下文，把变更摘要、测试结果、日志、执行轨迹、未决风险和回滚路径放到一起。第四，评审要角色分离，发现问题、仲裁问题、修复问题和验证修复，不要全部压在同一个角色身上。第五，阶段门禁决定能否进入 PR、合并或发布。这个顺序的价值，是让 AI 的探索、人的判断和系统的验证各自站在合适位置。它不是为了降低自动化程度，而是把 AI 的高速执行压缩成团队能读、能审、能继续复用的交付对象。",
  },
  {
    index: 7,
    title: "速度变成效率：先让变更可判断",
    subtitle: "AI 加快提交进入评审；判断上下文减少猜测、等待与返工，最终看端到端效率。",
    time: "约 1.5 分钟",
    focus: "把 PR 判断上下文与整体效率合成一页：局部速度要通过可判断上下文，才能沉淀为端到端交付效率。",
    question: "当 AI 让代码更快进入评审，团队靠什么避免等待和返工吞掉这份加速？",
    script:
      "刚才这条工作流里，最容易被忽略的是一个转换：AI 让局部速度变快，但团队真正需要的是整体效率变快。左边是确定的正向价值，想法到原型、代码生成、提交反馈都会更快。问题在于，如果评审者只收到一堆 diff，等待、猜测和返工会把这份加速吃掉。中间的变更判断上下文，就是把为什么改、改了什么、怎么验证、风险如何退放在一起。它不是增加文档，而是减少评审者重新拼上下文的成本，让低风险变更更快通过，让高风险变更更早暴露。右边才是最终口径：端到端周期有没有缩短，评审等待有没有下降，返工闭环是不是更短，构建和恢复是不是更稳定。这样看，代码写得快只是入口；变更可判断、返工可闭环、风险可追踪，才是工程意义上的快。",
    transition: "有了可判断的效率口径之后，下一步要看质量要求如何沉淀成可复核链路。",
    render: slideReviewEfficiencyV09,
  },
  {
    index: 8,
    title: "速度与整体效率：快写不等于快交付",
    subtitle: "真正要衡量的是端到端周期：等待、返工、验证和恢复都算进效率。",
    focus: "说明局部开发速度与整体交付效率不同：AI 会加快进入评审，但代码评审、持续集成、返工和恢复决定端到端效率。",
    question: "当 AI 让代码进入仓库的速度变快，团队怎样避免评审、返工和集成变成新瓶颈？",
    script:
      "这里有一个更直接的判断：AI 让局部开发更快，但整体效率不等于写代码速度。左边是局部速度，想法到原型、代码生成、提交评审都会变快，这是 AI 非常确定的正向价值。中间是协作摩擦，如果评审等待、构建排队、返工循环和集成冲突没有被处理，前面的加速会被后面吞掉。右边才是整体效率，团队最终要看的是从需求到稳定发布的总周期有没有缩短，返工有没有减少，失败能不能被复盘，线上恢复有没有更快。因此衡量口径要更具体：代码写得快只是开始，需求到稳定发布更快，才是软件工程意义上的快。",
    transition: "整体效率要继续成立，下一步就要把质量要求变成可复核的检查面。",
  },
  {
    index: 9,
    section: "05 / 工程质量",
    title: "工程质量：把质量落到三条可复核链路",
    subtitle: "开源和大厂场景不同，但都要回答责任、证据和工件是否可追踪。",
    focus: "用三块等尺寸卡片讲清质量共同点：开源看提交可信，大厂看稳定交付，中间收束到责任链、证据链、工件链。",
    question: "AI 让提交变多以后，维护者、平台团队和业务团队到底该看什么？",
    script:
      "工程质量可以先落到三个可复核链路。开源项目的重点，是让维护者能信任更多外部贡献：贡献者要对代码负责，维护者要看方向、可读性、测试和小批量变更，AI 辅助提交更需要带上可复核事实。大厂复杂交付的重点，是让变更在多人、多系统、多发布窗口里仍然稳定：需求、设计、接口、稳定性目标、责任人、发布、回滚、合规和线上追踪都要连起来。两边场景不同，但中间共同检查面一致：责任链回答谁决策、谁审核、谁承担；证据链回答测试、日志、执行轨迹、风险和回滚是否完整；工件链回答代码、配置、依赖、发布物和运行数据是否能追踪。这样讲质量就不再是多一道审批，而是让 AI 产出的变更更容易被信任、复核和长期维护。",
    transition: "这些链路再往前走，就会变成质量属性、测试驱动和代码评审的可执行工程协议。",
    render: slideQualityChainsV08,
  },
  {
    index: 10,
    title: "工程协议：把质量要求前置到工作流",
    subtitle: "先明确检查面，再把质量要求前置到任务、生成和合并节点。",
    focus: "说明质量要求如何进入执行路径：任务前写清约束，生成中持续验证，合并前做风险仲裁。",
    script:
      "质量链路知道要检查什么之后，还要回答怎么落到日常工作流里。可以把它拆成三个时间点。第一，任务前就写清质量约束：性能、安全、可观测、兼容性、验收边界，不能等代码生成完再补要求。第二，生成中用测试和评估持续约束：先定义失败证据和回归口径，再让 Agent 在边界内实现、修复、重跑。第三，合并前做风险仲裁：AI 可以承担第一轮检查，但人要判断责任人、依赖、回滚、例外和证据完整性。这样责任链、证据链、工件链就不再停留在概念上，而是变成任务前、生成中、合并前都能执行的工程协议。它不是取消质量属性、测试驱动和代码评审，而是把它们前置、显性化、可执行化。",
    transition: "质量协议进入流程之后，最后要回到团队和个人职责怎样变化。",
  },
  {
    index: 11,
    script:
      "最后把前面的内容合成职责变化。团队层面，AI 会把团队推向更高阶的协作方式：不仅追求自动化，还要建设可治理交付系统。第一，要把需求、架构、日志、测试和历史决策组织成 Agent 可以使用的上下文。第二，要把测试、持续集成、执行轨迹、代码评审和风险说明变成 PR 判断上下文，而不是写完代码后的附属品。第三，要建立净收益指标，看净时间、返工率、评审压力和线上风险，而不是只看代码量。第四，要用权限、隔离执行、独立评审和阶段门禁守住责任边界。个人层面，变化不是远离代码，而是把判断位置前移和上移。开发者要会定义问题，说明非目标和风险边界；要会核验事实，知道哪些上下文可信；要会解释风险，判断什么可以自动推进、什么需要补充证据；也要能承担最终责任，出了问题能复盘和沉淀。对新人来说，AI 会降低进入门槛，也会提高成长上限：先学会读懂系统、读懂证据、读懂运行约束，再让 AI 帮你把实现速度放大。团队把流程做实，个人把判断站稳，这两件事合起来，才是 AI 时代的软件工程升级。",
  },
  {
    index: 12,
    script:
      "最后我不把结论收成标准答案，而是留三个讨论入口。第一，Google 和 DeepMind 的 agent scaling 研究说明多 Agent 要按任务结构设计，那么我们在团队里该如何判断任务适合单 Agent、并行 Agent 还是集中编排。第二，IBM MAP 和 Gartner 的信号都指向生产化：真实企业更关心短链路、可控、人类评估、治理和验证平台，那么我们的工具建设如何从单点能力走向运行基座。第三，MSR 2026 提醒我们，速度提升需要质量机制承接，那么团队要如何把质量、返工率和维护收益纳入 AI 研发的收益计算。用一句话收束：AI 一定会持续重新定义软件开发，它带来的不是一次工具替换，而是一轮工程系统升级。周边工程能力、团队沟通方式和个人技能跟上以后，这份正收益会被持续放大。",
  },
];

for (const { index, ...fields } of positiveToneOverrides) {
  Object.assign(slides[index], fields);
}

// Merge the previous standalone "PR 判断上下文" and "速度与整体效率" pages.
// Keep the merged page at index 7 and drop the old efficiency-only page so
// later page numbers, notes, and section ranges are regenerated consistently.
slides.splice(8, 1);

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgBase(slide, index, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F8FBFD"/>
      <stop offset="42%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="#E9F1F6"/>
    </linearGradient>
    <linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#F4F8FB" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="darkPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.dark2}"/>
      <stop offset="100%" stop-color="${C.dark}"/>
    </linearGradient>
    <radialGradient id="halo" cx="74%" cy="28%" r="62%">
      <stop offset="0%" stop-color="#79D7E0" stop-opacity="0.22"/>
      <stop offset="45%" stop-color="#6D9FF2" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="microgrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C7D5E0" stroke-width="1" opacity="0.50"/>
      <circle cx="0" cy="0" r="1.2" fill="#9FB1BE" opacity="0.38"/>
    </pattern>
    <pattern id="diagonal" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="18" stroke="#9DB4C5" stroke-width="1" opacity="0.25"/>
    </pattern>
    <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="1.8" fill="#8FB7C2" opacity="0.32"/>
    </pattern>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.teal2}"/>
      <stop offset="52%" stop-color="${C.blue2}"/>
      <stop offset="100%" stop-color="${C.coral2}"/>
    </linearGradient>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="165%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#2F5368" flood-opacity="0.16"/>
    </filter>
    <filter id="tightShadow" x="-16%" y="-16%" width="132%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="11" flood-color="#203E50" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGradient)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  <rect width="${W}" height="${H}" fill="url(#microgrid)" opacity="0.32"/>
  ${cornerTech()}
  ${chrome(slide, index)}
  ${body}
</svg>`;
}

function cornerTech() {
  return `
    <path d="M1375 72 H1840 V320 H1650 V430 H1460" fill="none" stroke="#AFC0CC" stroke-width="2" opacity="0.34"/>
    <path d="M80 820 H360 V940 H600" fill="none" stroke="#AFC0CC" stroke-width="2" opacity="0.25"/>
    <polygon points="1420,96 1840,96 1840,252 1565,252" fill="url(#diagonal)" opacity="0.55"/>
    <polygon points="80,858 420,858 520,998 80,998" fill="url(#dots)" opacity="0.28"/>
    <circle cx="1375" cy="72" r="5" fill="${C.cyan}" opacity="0.34"/>
    <circle cx="1840" cy="320" r="5" fill="${C.blue2}" opacity="0.32"/>
    <circle cx="1650" cy="430" r="5" fill="${C.teal2}" opacity="0.30"/>
    <circle cx="80" cy="820" r="5" fill="${C.teal2}" opacity="0.30"/>
    <circle cx="600" cy="940" r="5" fill="${C.blue2}" opacity="0.26"/>
  `;
}

function chrome(slide, index) {
  return `
    <rect x="80" y="44" width="360" height="44" rx="6" fill="${C.dark}" opacity="0.94"/>
    <text x="102" y="56" class="mono small" style="fill:#DCE9F0">${esc(slide.section)}</text>
    <rect x="1688" y="44" width="152" height="44" rx="6" fill="${C.paper}" stroke="${C.line}" stroke-width="1.5" filter="url(#tightShadow)"/>
    <text x="1764" y="56" class="mono small" text-anchor="middle" style="fill:${C.dark}">${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</text>
    <line x1="80" y1="104" x2="1840" y2="104" stroke="${C.line}" stroke-width="2"/>
    <line x1="80" y1="106" x2="360" y2="106" stroke="url(#accentLine)" stroke-width="4"/>
    <line x1="80" y1="1012" x2="1840" y2="1012" stroke="${C.line}" stroke-width="2"/>
    <line x1="80" y1="1014" x2="300" y2="1014" stroke="url(#accentLine)" stroke-width="4"/>
    <style>
      text { font-family: "Microsoft YaHei", "Noto Sans SC", "PingFang SC", "Segoe UI", sans-serif; dominant-baseline: hanging; }
      .mono { font-family: "Cascadia Mono", "JetBrains Mono", "Consolas", "Microsoft YaHei", monospace; }
      .small { font-size: 17px; font-weight: 800; letter-spacing: 1.7px; }
      .kicker { font-size: 24px; font-weight: 800; fill: ${C.teal}; letter-spacing: 1.2px; }
      .h1 { font-size: 72px; font-weight: 900; fill: ${C.ink}; letter-spacing: -1.2px; }
      .h2 { font-size: 54px; font-weight: 900; fill: ${C.ink}; letter-spacing: -0.6px; }
      .sub { font-size: 28px; font-weight: 500; fill: ${C.muted}; }
      .body { font-size: 26px; font-weight: 550; fill: ${C.ink2}; }
      .body2 { font-size: 23px; font-weight: 520; fill: ${C.muted}; }
      .label { font-size: 21px; font-weight: 850; fill: ${C.ink}; }
      .micro { font-size: 18px; font-weight: 750; fill: ${C.muted}; }
      .num { font-family: "Arial", "Microsoft YaHei", sans-serif; font-weight: 900; }
    </style>
  `;
}

function header(slide, kicker = "") {
  return `
    ${kicker ? `<text x="96" y="120" class="kicker">${esc(kicker)}</text>` : ""}
    <text x="96" y="${kicker ? 166 : 126}" class="h2">${esc(slide.title)}</text>
    <text x="98" y="${kicker ? 236 : 204}" class="sub">${esc(slide.subtitle)}</text>
  `;
}

function text(x, y, content, cls = "body", fill) {
  return `<text x="${x}" y="${y}" class="${cls}"${fill ? ` fill="${fill}"` : ""}>${esc(content)}</text>`;
}

function lines(x, y, lineArray, cls = "body2", gap = 34, fill) {
  return lineArray
    .map((line, i) => `<text x="${x}" y="${y + i * gap}" class="${cls}"${fill ? ` fill="${fill}"` : ""}>${esc(line)}</text>`)
    .join("");
}

function card(x, y, w, h, opts = {}) {
  const fill = opts.fill || C.paper;
  const stroke = opts.stroke || C.line;
  const shadow = opts.shadow === false ? "" : ' filter="url(#softShadow)"';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.rx || 24}" fill="${fill}" stroke="${stroke}" stroke-width="${opts.sw || 2}"${shadow}/>`;
}

function pill(x, y, w, label, fill, color) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="42" rx="21" fill="${fill}" stroke="${color}" stroke-width="1.5" opacity="0.98"/>
    <text x="${x + w / 2}" y="${y + 11}" class="micro" text-anchor="middle" fill="${color}">${esc(label)}</text>
  `;
}

function bullet(x, y, color = C.teal2) {
  return `<circle cx="${x}" cy="${y + 12}" r="6" fill="${color}"/>`;
}

function arrow(x1, y1, x2, y2, color = C.teal, width = 4) {
  const id = `m${Math.abs(Math.round(x1 + y1 + x2 + y2 + width))}`;
  return `
    <defs><marker id="${id}" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth"><path d="M2,2 L10,6 L2,10 Z" fill="${color}"/></marker></defs>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" marker-end="url(#${id})"/>
  `;
}

function quoteBand(textValue) {
  return `
    <rect x="180" y="916" width="1560" height="64" rx="20" fill="${C.dark}" opacity="0.96"/>
    <text x="960" y="932" class="body" text-anchor="middle" style="fill:#FFFFFF">${esc(textValue)}</text>
  `;
}

function slideCover(slide, index) {
  const body = `
    <rect x="0" y="0" width="1920" height="14" fill="url(#accentLine)"/>
    <rect x="0" y="1066" width="1920" height="14" fill="url(#accentLine)"/>
    <path d="M1160 240 C1280 180 1440 190 1545 285 C1660 390 1645 570 1535 665 C1420 770 1228 742 1120 630 C1010 515 1030 310 1160 240Z" fill="${C.tealSoft}" opacity="0.55"/>
    <path d="M1240 300 H1510 V520 H1340 V650 H1110 V430 H1240Z" fill="none" stroke="${C.teal}" stroke-width="4" opacity="0.55"/>
    <circle cx="1240" cy="300" r="12" fill="${C.teal}"/>
    <circle cx="1510" cy="300" r="12" fill="${C.blue}"/>
    <circle cx="1510" cy="520" r="12" fill="${C.coral}"/>
    <circle cx="1110" cy="430" r="12" fill="${C.amber}"/>
    <text x="112" y="150" class="kicker">BITFUN / AGENTIC CODING / SOFTWARE ENGINEERING</text>
    <text x="112" y="218" class="h1">${esc(slide.title)}</text>
    <text x="118" y="316" class="sub">${esc(slide.subtitle)}</text>
    <path d="M112 410 H810 L872 472 V574 H112 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="146" y="440" class="body2">本报告不讨论某个工具是否最好，而是追问：</text>
    <text x="146" y="488" class="body" fill="${C.ink}">当 AI 把代码产能放大后，软件工程的瓶颈会转移到哪里？</text>
    ${pill(146, 526, 170, "15 分钟", C.tealSoft, C.teal)}
    ${pill(338, 526, 190, "高校听众", C.blueSoft, C.blue)}
    ${pill(550, 526, 230, "架构师视角", C.coralSoft, C.coral)}
    <rect x="1105" y="382" width="525" height="270" rx="30" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="1160" y="425" class="micro">BITFUN 现象级入口</text>
    <text x="1160" y="468" class="num" style="font-size:120px" fill="${C.coral}">18w+</text>
    <text x="1170" y="602" class="body" fill="${C.ink}">行代码 / 约 1 个月</text>
    ${quoteBand("不是“AI 写了多少”，而是“这些代码如何被验证、审查、维护和交付”。")}
  `;
  return svgBase(slide, index, body);
}

function slideShock(slide, index) {
  const body = `
    ${header(slide, "01 / 产能冲击")}
    <rect x="108" y="302" width="560" height="470" rx="30" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="154" y="344" class="micro">不是答案，而是问题入口</text>
    <text x="154" y="398" class="num" style="font-size:112px" fill="${C.coral}">18w+</text>
    <text x="162" y="528" class="body">代码量被放大</text>
    <line x1="154" y1="590" x2="610" y2="590" stroke="${C.line}" stroke-width="2"/>
    ${lines(164, 626, ["开发速度更快", "需求变化更频繁", "团队配合可被压缩", "质量检查也更容易被省略"], "body2", 40)}
    <rect x="760" y="318" width="1040" height="420" rx="32" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    ${questionCard(810, 365, "01", "能跑", "是否等于可上线？", C.teal, C.tealSoft)}
    ${questionCard(1305, 365, "02", "变快", "是否等于可维护？", C.blue, C.blueSoft)}
    ${questionCard(810, 545, "03", "少配合", "是否省掉了团队共识？", C.amber, C.amberSoft)}
    ${questionCard(1305, 545, "04", "探索快", "离高质量协作还差什么？", C.coral, C.coralSoft)}
    ${arrow(662, 535, 748, 535, C.ink2, 4)}
    ${quoteBand("AI 首先改变的不是代码怎么写，而是速度、风险和组织方式如何被重新分配。")}
  `;
  return svgBase(slide, index, body);
}

function questionCard(x, y, n, h, b, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="420" height="126" rx="24" fill="${fill}" stroke="${color}" stroke-width="2"/>
    <text x="${x + 28}" y="${y + 24}" class="micro" fill="${color}">${n}</text>
    <text x="${x + 95}" y="${y + 22}" class="label" fill="${C.ink}">${esc(h)}</text>
    <text x="${x + 95}" y="${y + 66}" class="body2">${esc(b)}</text>
  `;
}

function slideExploration(slide, index) {
  const body = `
    ${header(slide, "02 / 探索方式")}
    <rect x="110" y="310" width="1700" height="166" rx="32" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    ${phase(150, 352, "过去", "排期驱动", "想法进入 backlog，等待人力与排期", C.soft, C.bg2)}
    ${arrow(510, 392, 610, 392, C.line2, 4)}
    ${phase(650, 352, "现在", "想法驱动", "一个人和 Agent 快速试多个方向", C.teal, C.tealSoft)}
    ${arrow(1010, 392, 1110, 392, C.line2, 4)}
    ${phase(1150, 352, "下一步", "证据驱动", "用测试、评审、指标和 trace 决定是否继续", C.blue, C.blueSoft)}
    <text x="116" y="548" class="micro" fill="${C.teal}">探索收益</text>
    ${metric(130, 600, "更快原型", "几天内从想法到可运行形态", C.teal, C.tealSoft)}
    ${metric(555, 600, "更灵活变更", "方向不确定时，试错成本下降", C.blue, C.blueSoft)}
    ${metric(980, 600, "更少配合成本", "早期探索不用等待完整团队", C.amber, C.amberSoft)}
    ${metric(1405, 600, "更大覆盖面", "更多“值得试”的想法可以验证", C.coral, C.coralSoft)}
    <rect x="260" y="825" width="1400" height="76" rx="24" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
    <text x="960" y="844" class="body" text-anchor="middle" fill="${C.ink}">探索可以更像“想法驱动”，交付必须回到“证据驱动”。</text>
  `;
  return svgBase(slide, index, body);
}

function phase(x, y, tag, title, desc, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="320" height="88" rx="22" fill="${fill}" stroke="${color}" stroke-width="2"/>
    <text x="${x + 24}" y="${y + 16}" class="micro" fill="${color}">${esc(tag)}</text>
    <text x="${x + 100}" y="${y + 14}" class="label">${esc(title)}</text>
    <text x="${x + 24}" y="${y + 52}" class="micro" fill="${C.muted}">${esc(desc)}</text>
  `;
}

function metric(x, y, title, desc, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="350" height="132" rx="26" fill="${fill}" stroke="${color}" stroke-width="2" filter="url(#softShadow)"/>
    <circle cx="${x + 44}" cy="${y + 42}" r="14" fill="${color}"/>
    <text x="${x + 78}" y="${y + 25}" class="label">${esc(title)}</text>
    <text x="${x + 32}" y="${y + 78}" class="body2">${esc(desc)}</text>
  `;
}

function slideLifecycle(slide, index) {
  const body = `
    ${header(slide, "03 / Agentic Coding")}
    ${timelineNode(130, 338, "代码补全", "补一行、补函数", C.soft, C.bg2)}
    ${arrow(430, 410, 545, 410, C.line2, 4)}
    ${timelineNode(575, 338, "Agentic Coding", "读仓库、改文件、跑命令、观察结果", C.teal, C.tealSoft)}
    ${arrow(875, 410, 990, 410, C.line2, 4)}
    ${timelineNode(1020, 338, "AI-assisted SDLC", "需求、设计、测试、CI、review、发布", C.blue, C.blueSoft)}
    ${arrow(1320, 410, 1435, 410, C.line2, 4)}
    ${timelineNode(1465, 338, "智能协作系统", "平台化、可追踪、可治理", C.coral, C.coralSoft)}
    <rect x="150" y="594" width="770" height="260" rx="30" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="200" y="628" class="label">Prompt ⊂ Context ⊂ Harness</text>
    <text x="210" y="690" class="body2">Prompt：角色、目标、约束、输出格式</text>
    <text x="210" y="734" class="body2">Context：需求、代码、日志、测试、历史决策</text>
    <text x="210" y="778" class="body2">Harness：工具权限、执行编排、验证、trace、审计</text>
    <rect x="1000" y="594" width="770" height="260" rx="30" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="1050" y="628" class="label">可以穿插的研究引子</text>
    ${evidence(1060, 692, "AGENTS.md", "项目级上下文影响 coding agent 效率", C.teal)}
    ${evidence(1060, 744, "agent-authored PR", "AI 已进入 GitHub 协作链路", C.blue)}
    ${evidence(1060, 796, "CI-Bench", "真实 CI 失败才是工程验证场", C.coral)}
    ${quoteBand("模型决定能力上限，工程系统决定可靠性下限。")}
  `;
  return svgBase(slide, index, body);
}

function timelineNode(x, y, title, desc, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="300" height="144" rx="28" fill="${fill}" stroke="${color}" stroke-width="2.5" filter="url(#softShadow)"/>
    <text x="${x + 28}" y="${y + 30}" class="label" fill="${color}">${esc(title)}</text>
    ${lines(x + 28, y + 80, desc.split("、").reduce((acc, cur, i) => {
      if (i === 0) acc.push(cur);
      else if (acc[acc.length - 1].length + cur.length < 16) acc[acc.length - 1] += "、" + cur;
      else acc.push(cur);
      return acc;
    }, []), "micro", 30, C.muted)}
  `;
}

function evidence(x, y, label, desc, color) {
  return `
    <circle cx="${x}" cy="${y + 12}" r="7" fill="${color}"/>
    <text x="${x + 24}" y="${y}" class="micro" fill="${color}">${esc(label)}</text>
    <text x="${x + 205}" y="${y}" class="micro" fill="${C.muted}">${esc(desc)}</text>
  `;
}

function slideQuality(slide, index) {
  const body = `
    ${header(slide, "04 / 质量责任")}
    <rect x="130" y="310" width="760" height="392" rx="34" fill="${C.tealSoft}" stroke="${C.teal}" stroke-width="3" filter="url(#softShadow)"/>
    <text x="190" y="360" class="h2" style="font-size:42px" fill="${C.teal}">开源高质量协作</text>
    ${lines(205, 450, ["开发者：对自己的提交负责", "维护者：验证陌生人或 AI 贡献者的大规模变更", "关注：可读、可测、可维护、符合项目方向"], "body", 44, C.ink2)}
    ${pill(205, 610, 190, "CODEOWNERS", C.paper, C.teal)}
    ${pill(415, 610, 205, "required checks", C.paper, C.teal)}
    ${pill(640, 610, 170, "CodeQL", C.paper, C.teal)}
    <rect x="1030" y="310" width="760" height="392" rx="34" fill="${C.amberSoft}" stroke="${C.amber}" stroke-width="3" filter="url(#softShadow)"/>
    <text x="1090" y="360" class="h2" style="font-size:42px" fill="${C.amber}">大厂复杂交付</text>
    ${lines(1105, 450, ["组织：对系统、流程和业务连续性负责", "挑战：跨团队 owner、依赖链、合规、发布窗口", "关注：稳定性、可观测、审计、回滚"], "body", 44, C.ink2)}
    ${pill(1105, 610, 205, "SLO / error budget", C.paper, C.amber)}
    ${pill(1330, 610, 165, "canary", C.paper, C.amber)}
    ${pill(1515, 610, 205, "OpenTelemetry", C.paper, C.amber)}
    <rect x="300" y="770" width="1320" height="94" rx="28" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
    <text x="960" y="794" class="body" text-anchor="middle" fill="${C.ink}">共同问题：谁承担责任？用什么证据确认？失败后如何复盘？</text>
    ${quoteBand("不要把高质量只理解成商用。开源协作同样要求可验证、可维护、可追责。")}
  `;
  return svgBase(slide, index, body);
}

function slideResponses(slide, index) {
  const body = `
    ${header(slide, "05 / 工程补法")}
    <rect x="740" y="410" width="440" height="156" rx="34" fill="${C.dark}" stroke="${C.dark}" filter="url(#softShadow)"/>
    <text x="960" y="452" class="h2" style="font-size:46px;fill:#FFFFFF" text-anchor="middle">AI 变更</text>
    <text x="960" y="514" class="micro" text-anchor="middle" style="fill:#DDE7EE">代码、配置、测试、文档、发布策略</text>
    ${responseCard(130, 300, "Context Engineering", "让 Agent 站在正确事实上", ["AGENTS.md", "架构文档", "日志与测试", "历史决策"], C.teal, C.tealSoft)}
    ${responseCard(1260, 300, "Quality Gates", "让完成绑定可验证证据", ["CI / review", "required checks", "security scan", "merge queue"], C.blue, C.blueSoft)}
    ${responseCard(130, 630, "Architecture Governance", "让快速变化不破坏长期边界", ["ADR / RFC", "依赖边界", "模块 owner", "fitness functions"], C.amber, C.amberSoft)}
    ${responseCard(1260, 630, "Runtime Guardrails", "让风险渐进暴露和回滚", ["benchmark", "SLO / tracing", "feature flag", "canary / rollback"], C.coral, C.coralSoft)}
    ${arrow(600, 380, 736, 466, C.teal, 4)}
    ${arrow(1260, 380, 1184, 466, C.blue, 4)}
    ${arrow(600, 715, 736, 548, C.amber, 4)}
    ${arrow(1260, 715, 1184, 548, C.coral, 4)}
    <text x="960" y="904" class="body" text-anchor="middle" fill="${C.ink}">Finish 不是一句“我完成了”，而是要被测试、评审、指标和 trace 接住。</text>
  `;
  return svgBase(slide, index, body);
}

function responseCard(x, y, title, desc, items, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="520" height="230" rx="32" fill="${fill}" stroke="${color}" stroke-width="2.5" filter="url(#softShadow)"/>
    <text x="${x + 36}" y="${y + 30}" class="label" fill="${color}">${esc(title)}</text>
    <text x="${x + 36}" y="${y + 78}" class="body2">${esc(desc)}</text>
    ${items
      .map((item, i) => {
        const px = x + 36 + (i % 2) * 230;
        const py = y + 132 + Math.floor(i / 2) * 46;
        return `${bullet(px, py, color)}<text x="${px + 22}" y="${py}" class="micro" fill="${C.ink2}">${esc(item)}</text>`;
      })
      .join("")}
  `;
}

function slideBitfun(slide, index) {
  const body = `
    ${header(slide, "06 / BitFun 缩影")}
    <rect x="724" y="372" width="472" height="198" rx="44" fill="${C.dark}" stroke="${C.dark}" filter="url(#softShadow)"/>
    <text x="960" y="420" class="h2" style="font-size:48px;fill:#FFFFFF" text-anchor="middle">Agent Runtime</text>
    <text x="960" y="494" class="micro" text-anchor="middle" style="fill:#DDE7EE">上下文、工具、权限、验证、反馈</text>
    ${workflow(190, 298, "Planning", "快速变化的需求，要先探索和计划", "探索 / 分解 / 方案", C.teal, C.tealSoft)}
    ${workflow(1270, 298, "Evidence", "debug 不能只凭模型自信，要有日志、复现和证据", "日志 / 复现 / 证据", C.blue, C.blueSoft)}
    ${workflow(190, 655, "Self-iteration", "一次失败不只修代码，还要沉淀成下一版工作流", "trace / 复盘 / skill", C.coral, C.coralSoft)}
    ${workflow(1270, 655, "Review", "执行者、审查者、仲裁者需要分离", "owner / finding / gate", C.amber, C.amberSoft)}
    ${arrow(585, 382, 720, 438, C.teal, 4)}
    ${arrow(1270, 382, 1198, 438, C.blue, 4)}
    ${arrow(585, 732, 720, 540, C.coral, 4)}
    ${arrow(1270, 732, 1198, 540, C.amber, 4)}
    <rect x="330" y="880" width="1260" height="74" rx="24" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
    <text x="960" y="900" class="body" text-anchor="middle" fill="${C.ink}">AI 工具的未来形态不是“更会聊天”，而是组织可验证、可追踪、可治理的开发过程。</text>
  `;
  return svgBase(slide, index, body);
}

function workflow(x, y, title, desc, tags, color, fill) {
  return `
    <rect x="${x}" y="${y}" width="460" height="194" rx="32" fill="${fill}" stroke="${color}" stroke-width="2.5" filter="url(#softShadow)"/>
    <text x="${x + 36}" y="${y + 30}" class="label" fill="${color}">${esc(title)}</text>
    ${lines(x + 36, y + 82, splitDesc(desc), "body2", 34, C.ink2)}
    <text x="${x + 36}" y="${y + 150}" class="micro" fill="${color}">${esc(tags)}</text>
  `;
}

function splitDesc(desc) {
  if (desc.length < 24) return [desc];
  const parts = [];
  let current = "";
  for (const char of desc) {
    current += char;
    if (current.length >= 20 && /[，、]/.test(char)) {
      parts.push(current);
      current = "";
    }
  }
  if (current) parts.push(current);
  return parts.slice(0, 2);
}

function slideRole(slide, index) {
  const body = `
    ${header(slide, "07 / 角色变化")}
    <rect x="140" y="300" width="670" height="360" rx="34" fill="${C.paper}" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="190" y="350" class="h2" style="font-size:42px">过去的开发者</text>
    ${roleRows(205, 442, ["写代码的人", "熟悉语法和 API 的人", "修 bug 的人", "使用工具的人", "实现功能的人"], C.soft)}
    ${arrow(850, 480, 1040, 480, C.coral, 6)}
    <rect x="1090" y="300" width="670" height="360" rx="34" fill="${C.tealSoft}" stroke="${C.teal}" stroke-width="3" filter="url(#softShadow)"/>
    <text x="1140" y="350" class="h2" style="font-size:42px" fill="${C.teal}">AI 时代的开发者</text>
    ${roleRows(1155, 442, ["定义任务的人", "组织上下文的人", "设计验证闭环的人", "编排 Agent 和工具的人", "维护系统演进与质量边界的人"], C.teal)}
    <rect x="180" y="735" width="1560" height="166" rx="34" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
    <text x="230" y="772" class="label">留给高校课堂的三个问题</text>
    ${questionLine(250, 832, "01", "AI 能完成大部分编程作业后，编程课还训练什么？", C.teal)}
    ${questionLine(790, 832, "02", "AI 能一周写完原型后，工程师还要证明什么？", C.blue)}
    ${questionLine(1330, 832, "03", "个人产能接近小团队后，质量责任如何重新设计？", C.coral)}
    ${quoteBand("未来优秀的软件人才，是会设计人与 AI Agent 共同工作的工程系统的人。")}
  `;
  return svgBase(slide, index, body);
}

function roleRows(x, y, rows, color) {
  return rows
    .map((row, i) => {
      const py = y + i * 45;
      return `${bullet(x, py, color)}<text x="${x + 28}" y="${py - 2}" class="body2" fill="${C.ink2}">${esc(row)}</text>`;
    })
    .join("");
}

function questionLine(x, y, n, q, color) {
  return `
    <text x="${x}" y="${y}" class="micro" fill="${color}">${esc(n)}</text>
    <text x="${x + 46}" y="${y - 2}" class="micro" fill="${C.ink2}">${esc(q)}</text>
  `;
}

function mainPoint(linesValue, accent = C.teal) {
  const arr = Array.isArray(linesValue) ? linesValue : [linesValue];
  return `
    <path d="M112 292 H1760 L1824 356 V${arr.length > 1 ? 414 : 388} H112 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#tightShadow)"/>
    <path d="M112 292 H1760 L1824 356" fill="none" stroke="${accent}" stroke-width="4"/>
    <rect x="112" y="292" width="12" height="${arr.length > 1 ? 122 : 96}" fill="${accent}"/>
    <text x="148" y="314" class="mono small" style="fill:${accent};letter-spacing:2.2px">KEY MESSAGE</text>
    ${arr.map((line, i) => `<text x="148" y="${348 + i * 42}" class="body" style="fill:${i === 0 ? C.ink : C.muted};font-weight:${i === 0 ? 900 : 650}">${esc(line)}</text>`).join("")}
  `;
}

function softLine(x1, y1, x2, y2, color, width = 5) {
  return `<path d="M${x1} ${y1} C${x1 + 160} ${y1}, ${x2 - 160} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="0.92"/>`;
}

function smallTag(x, y, label, color, fill = C.paper) {
  return `
    <rect x="${x}" y="${y}" width="${Math.max(138, label.length * 19)}" height="44" rx="8" fill="${fill}" stroke="${color}" stroke-width="2" filter="url(#tightShadow)"/>
    <text x="${x + Math.max(138, label.length * 19) / 2}" y="${y + 12}" class="micro" text-anchor="middle" style="fill:${color};font-weight:800">${esc(label)}</text>
  `;
}

function thesisFooter(textValue, color = C.dark) {
  return `
    <path d="M140 900 H1740 L1780 940 L1740 978 H140 L180 940 Z" fill="url(#darkPanel)" opacity="0.98" filter="url(#tightShadow)"/>
    <path d="M190 900 H520" stroke="url(#accentLine)" stroke-width="5"/>
    <text x="215" y="922" class="mono small" style="fill:#8FDCE3">TAKEAWAY</text>
    <text x="960" y="922" class="body" text-anchor="middle" style="fill:#FFFFFF;font-weight:850">${esc(textValue)}</text>
  `;
}

function slideCoverV3(slide, index) {
  const body = `
    <rect x="0" y="0" width="1920" height="14" fill="url(#accentLine)"/>
    <text x="112" y="138" class="kicker">BITFUN / AGENTIC CODING / SOFTWARE ENGINEERING</text>
    <text x="112" y="206" class="h1">${esc(slide.title)}</text>
    <text x="118" y="304" class="sub">${esc(slide.subtitle)}</text>
    <text x="118" y="386" class="body" style="fill:${C.ink};font-weight:800">核心不是“AI 会写多少代码”，而是软件工程的对象正在扩大。</text>
    <text x="118" y="440" class="body2">从文件、函数、提交，扩展到任务、上下文、工具、权限、验证、反馈与人类监督。</text>
    <path d="M112 592 H1560" stroke="${C.line2}" stroke-width="5" stroke-linecap="round"/>
    ${axisNode(112, 532, "代码产能", "写得更快", C.teal)}
    ${axisNode(520, 532, "工程证据", "证明完成", C.blue)}
    ${axisNode(928, 532, "组织治理", "可追责、可复盘", C.amber)}
    ${axisNode(1336, 532, "智能协作系统", "人和 Agent 共同工作", C.coral)}
    <circle cx="1475" cy="300" r="190" fill="${C.tealSoft}" opacity="0.74"/>
    <path d="M1340 212 H1520 V312 H1638 V458 H1440 V360 H1305 V260 H1340Z" fill="none" stroke="${C.teal}" stroke-width="5" opacity="0.72"/>
    <circle cx="1340" cy="212" r="12" fill="${C.teal}"/>
    <circle cx="1520" cy="212" r="12" fill="${C.blue}"/>
    <circle cx="1638" cy="458" r="12" fill="${C.coral}"/>
    <path d="M1250 516 H1662 L1710 564 V694 H1250 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="1296" y="548" class="micro" style="fill:${C.coral};font-weight:900">BITFUN 现象级入口</text>
    <text x="1296" y="586" class="num" style="font-size:96px;fill:${C.coral}">18w+</text>
    <text x="1298" y="684" class="body2" style="fill:${C.ink};font-weight:800">行代码 / 约 1 个月</text>
    ${thesisFooter("本报告的结论：AI 重新定义软件开发，是从“写代码”走向“组织智能协作系统”。")}
  `;
  return svgBase(slide, index, body);
}

function axisNode(x, y, titleValue, subValue, color) {
  return `
    <circle cx="${x + 54}" cy="${y + 60}" r="54" fill="${color}" opacity="0.92"/>
    <text x="${x + 54}" y="${y + 44}" class="micro" text-anchor="middle" style="fill:#FFFFFF;font-weight:900">${esc(titleValue)}</text>
    <text x="${x + 54}" y="${y + 80}" class="micro" text-anchor="middle" style="fill:#FFFFFF">${esc(subValue)}</text>
  `;
}

function slideShockV3(slide, index) {
  const body = `
    ${header(slide, "01 / 产能冲击")}
    ${mainPoint(["代码量暴涨不是终点，它会把软件工程的瓶颈推向验证、协作和治理。"], C.coral)}
    <circle cx="520" cy="610" r="112" fill="${C.coralSoft}" stroke="${C.coral}" stroke-width="4" filter="url(#tightShadow)"/>
    <text x="520" y="568" class="num" text-anchor="middle" style="font-size:78px;fill:${C.coral}">18w+</text>
    <text x="520" y="658" class="body2" text-anchor="middle" style="fill:${C.ink};font-weight:800">代码产能被放大</text>
    <circle cx="520" cy="610" r="176" fill="none" stroke="${C.coral}" stroke-width="3" opacity="0.18"/>
    <circle cx="520" cy="610" r="245" fill="none" stroke="${C.coral}" stroke-width="3" opacity="0.12"/>
    ${softLine(640, 535, 1250, 470, C.teal, 6)}
    ${softLine(650, 610, 1250, 610, C.blue, 6)}
    ${softLine(640, 690, 1250, 750, C.amber, 6)}
    ${shockOutcome(1260, 420, "需求变化更快", "方向灵活，也更容易失去稳定验收标准", C.teal, C.tealSoft)}
    ${shockOutcome(1260, 560, "变更规模更大", "review、测试和回归成本随之上升", C.blue, C.blueSoft)}
    ${shockOutcome(1260, 700, "质量责任更重", "谁确认、谁放行、谁复盘变得更关键", C.amber, C.amberSoft)}
    <text x="230" y="818" class="body2" style="fill:${C.muted}">开场追问</text>
    <text x="230" y="858" class="body" style="fill:${C.ink};font-weight:800">如果你是维护者，面对一个 AI 生成的大型 PR，会先看代码量，还是先找验证证据？</text>
    ${thesisFooter("AI 把开发从“产能问题”推向“工程治理问题”。", C.dark)}
  `;
  return svgBase(slide, index, body);
}

function shockOutcome(x, y, titleValue, desc, color, fill) {
  return `
    <path d="M${x} ${y} H${x + 440} L${x + 500} ${y + 36} V${y + 124} H${x} L${x - 38} ${y + 88} V${y + 36} Z" fill="${fill}" stroke="${color}" stroke-width="2.5" filter="url(#tightShadow)"/>
    <text x="${x + 34}" y="${y + 28}" class="label" style="fill:${color}">${esc(titleValue)}</text>
    <text x="${x + 34}" y="${y + 74}" class="body2" style="fill:${C.ink2}">${esc(desc)}</text>
  `;
}

function slideExplorationV3(slide, index) {
  const body = `
    ${header(slide, "02 / 探索方式")}
    ${mainPoint(["探索可以从排期驱动变成想法驱动，但交付必须回到证据驱动。"], C.teal)}
    <path d="M210 640 C470 420, 790 410, 1010 604 S1450 780, 1710 520" fill="none" stroke="${C.line2}" stroke-width="14" stroke-linecap="round" opacity="0.38"/>
    <path d="M210 640 C470 420, 790 410, 1010 604 S1450 780, 1710 520" fill="none" stroke="url(#accentLine)" stroke-width="8" stroke-linecap="round"/>
    ${journeyPoint(210, 640, "过去", "排期驱动", "进入 backlog\n等待人力与排期", C.soft, C.bg2)}
    ${journeyPoint(690, 420, "现在", "想法驱动", "快速原型\n多方向试错", C.teal, C.tealSoft)}
    ${journeyPoint(1170, 715, "边界", "质量责任", "能跑不等于\n能上线", C.amber, C.amberSoft)}
    ${journeyPoint(1710, 520, "下一步", "证据驱动", "测试、评审\n指标、trace", C.blue, C.blueSoft)}
    <path d="M220 798 H1646 L1700 852 V884 H220 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#tightShadow)"/>
    ${smallTag(265, 820, "更快原型", C.teal, C.tealSoft)}
    ${smallTag(510, 820, "更灵活变更", C.blue, C.blueSoft)}
    ${smallTag(805, 820, "更低试错成本", C.amber, C.amberSoft)}
    ${smallTag(1140, 820, "更多想法可验证", C.coral, C.coralSoft)}
    <text x="1440" y="828" class="micro" style="fill:${C.muted}">但这些仍只是“探索收益”</text>
    ${thesisFooter("AI 让原型更像实验室，真实工程仍要有验收、回滚和审计。")}
  `;
  return svgBase(slide, index, body);
}

function journeyPoint(x, y, tag, titleValue, desc, color, fill) {
  const lineArr = desc.split("\n");
  return `
    <circle cx="${x}" cy="${y}" r="68" fill="#FFFFFF" stroke="${color}" stroke-width="2" opacity="0.82"/>
    <circle cx="${x}" cy="${y}" r="58" fill="${fill}" stroke="${color}" stroke-width="4" filter="url(#tightShadow)"/>
    <text x="${x}" y="${y - 54}" class="micro" text-anchor="middle" style="fill:${color};font-weight:900">${esc(tag)}</text>
    <text x="${x}" y="${y - 18}" class="label" text-anchor="middle" style="fill:${C.ink}">${esc(titleValue)}</text>
    ${lineArr.map((line, i) => `<text x="${x}" y="${y + 22 + i * 27}" class="micro" text-anchor="middle" style="fill:${C.muted}">${esc(line)}</text>`).join("")}
  `;
}

function slideLifecycleV3(slide, index) {
  const body = `
    ${header(slide, "03 / Agentic Coding")}
    ${mainPoint(["AI 编程的对象正在从代码片段，扩展到任务、上下文、工具、权限、验证和反馈。"], C.blue)}
    <path d="M170 468 H718 L780 530 V798 H170 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <circle cx="475" cy="633" r="138" fill="${C.violetSoft}" stroke="${C.violet}" stroke-width="4"/>
    <circle cx="475" cy="633" r="96" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="4"/>
    <circle cx="475" cy="633" r="54" fill="${C.tealSoft}" stroke="${C.teal}" stroke-width="4"/>
    <text x="475" y="596" class="micro" text-anchor="middle" style="fill:${C.teal};font-weight:900">Prompt</text>
    <text x="475" y="634" class="micro" text-anchor="middle" style="fill:${C.blue};font-weight:900">Context</text>
    <text x="475" y="704" class="micro" text-anchor="middle" style="fill:${C.violet};font-weight:900">Harness / Platform</text>
    <text x="210" y="820" class="body2" style="fill:${C.muted}">Prompt 不是全部；可靠执行来自上下文、权限、验证和 trace。</text>
    <path d="M930 490 H1690" stroke="${C.line2}" stroke-width="6" stroke-linecap="round"/>
    ${laneStep(900, 430, "代码补全", "补一行、补函数", C.soft, C.bg2)}
    ${laneStep(1115, 430, "Agentic Coding", "读仓库、改文件、跑命令", C.teal, C.tealSoft)}
    ${laneStep(1365, 430, "AI-assisted SDLC", "需求、测试、CI、review", C.blue, C.blueSoft)}
    ${laneStep(1615, 430, "智能协作系统", "平台化、可治理", C.coral, C.coralSoft)}
    <path d="M920 626 H1624 L1680 682 V850 H920 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <text x="970" y="674" class="label">研究与实践的三个佐证</text>
    ${evidence(986, 728, "AGENTS.md", "项目级上下文影响 Agent 效率", C.teal)}
    ${evidence(986, 776, "Agent PR", "AI 已进入 GitHub 协作链路", C.blue)}
    ${evidence(986, 824, "CI-Bench", "真实 CI 失败是工程验证场", C.coral)}
    ${thesisFooter("模型能力是上限，工程系统才是可靠性下限。")}
  `;
  return svgBase(slide, index, body);
}

function laneStep(x, y, titleValue, desc, color, fill) {
  return `
    <path d="M${x} ${y} h170 l28 28 v134 l-28 28 h-170 l-28 -28 v-134 z" fill="${fill}" stroke="${color}" stroke-width="2.5" filter="url(#tightShadow)"/>
    <text x="${x + 85}" y="${y + 34}" class="micro" text-anchor="middle" style="fill:${color};font-weight:900">${esc(titleValue)}</text>
    ${lines(x + 28, y + 84, desc.split("、"), "micro", 28, C.muted)}
  `;
}

function slideQualityV3(slide, index) {
  const body = `
    ${header(slide, "04 / 质量责任")}
    ${mainPoint(["高质量不是单一标准：开源强调公共责任，大厂强调复杂组织交付责任。"], C.amber)}
    <path d="M250 548 C520 430, 720 520, 920 650" fill="none" stroke="${C.teal}" stroke-width="18" stroke-linecap="round" opacity="0.72"/>
    <path d="M1670 548 C1400 430, 1200 520, 1000 650" fill="none" stroke="${C.amber}" stroke-width="18" stroke-linecap="round" opacity="0.72"/>
    <circle cx="960" cy="670" r="136" fill="#FFFFFF" stroke="${C.line}" stroke-width="2" filter="url(#softShadow)"/>
    <circle cx="960" cy="670" r="116" fill="url(#panelGradient)" stroke="${C.dark}" stroke-width="5"/>
    <text x="960" y="622" class="label" text-anchor="middle" style="fill:${C.ink};font-size:34px">可验证责任</text>
    <text x="960" y="684" class="body2" text-anchor="middle">谁负责</text>
    <text x="960" y="724" class="body2" text-anchor="middle">用什么证据确认</text>
    <text x="960" y="764" class="body2" text-anchor="middle">失败后如何复盘</text>
    ${qualitySide(150, 472, "开源高质量协作", "开发者对提交负责，维护者验证大规模 AI 变更", ["CODEOWNERS", "required checks", "CodeQL", "merge queue"], C.teal, C.tealSoft)}
    ${qualitySide(1240, 472, "大厂复杂交付", "组织对系统、流程和用户连续性负责", ["owner review", "SLO / error budget", "canary", "OpenTelemetry"], C.amber, C.amberSoft)}
    <text x="960" y="846" class="body" text-anchor="middle" style="fill:${C.ink};font-weight:800">通过单测只是起点，离“可合并、可发布、可长期维护”仍有距离。</text>
    ${thesisFooter("开源不是低质量，大厂也不是多跑测试；关键是责任链和证据链。")}
  `;
  return svgBase(slide, index, body);
}

function qualitySide(x, y, titleValue, desc, tags, color, fill) {
  return `
    <path d="M${x} ${y} H${x + 452} L${x + 500} ${y + 48} V${y + 250} H${x} Z" fill="${fill}" stroke="${color}" stroke-width="3" filter="url(#softShadow)"/>
    <path d="M${x + 28} ${y + 28} H${x + 210}" stroke="${color}" stroke-width="5"/>
    <text x="${x + 42}" y="${y + 36}" class="label" style="fill:${color};font-size:30px">${esc(titleValue)}</text>
    ${lines(x + 42, y + 94, splitDesc(desc), "body2", 34, C.ink2)}
    ${tags.map((tag, i) => smallTag(x + 42 + (i % 2) * 212, y + 168 + Math.floor(i / 2) * 48, tag, color, C.paper)).join("")}
  `;
}

function slideResponsesV3(slide, index) {
  const body = `
    ${header(slide, "05 / 工程补法")}
    ${mainPoint(["成熟补法不是多贴几个工具名，而是把 AI 变更放进一条可验证的证据链。"], C.teal)}
    <path d="M210 620 H1710" stroke="${C.line2}" stroke-width="10" stroke-linecap="round" opacity="0.45"/>
    <path d="M210 620 H1710" stroke="url(#accentLine)" stroke-width="6" stroke-linecap="round"/>
    ${pipelineStage(220, 520, "01", "上下文", "需求、规范\n历史决策", C.teal, C.tealSoft)}
    ${pipelineStage(500, 520, "02", "变更", "代码、配置\n测试、文档", C.blue, C.blueSoft)}
    ${pipelineStage(780, 520, "03", "质量门禁", "CI、review\n安全扫描", C.violet, C.violetSoft)}
    ${pipelineStage(1060, 520, "04", "架构守护", "边界、owner\nADR / RFC", C.amber, C.amberSoft)}
    ${pipelineStage(1340, 520, "05", "运行看护", "SLO、trace\n灰度、回滚", C.coral, C.coralSoft)}
    <path d="M430 780 H1440 L1490 830 V862 H430 Z" fill="url(#panelGradient)" stroke="${C.line}" stroke-width="2" filter="url(#tightShadow)"/>
    <text x="960" y="804" class="body" text-anchor="middle" style="fill:${C.ink};font-weight:900">Finish = 测试结果 + 评审结论 + 架构约束 + 运行指标 + 失败说明</text>
    ${thesisFooter("把“相信模型”改成“组织证据”，才是 AI 时代的软件工程升级。")}
  `;
  return svgBase(slide, index, body);
}

function pipelineStage(x, y, n, titleValue, desc, color, fill) {
  const arr = desc.split("\n");
  return `
    <circle cx="${x + 80}" cy="${y + 100}" r="92" fill="#FFFFFF" stroke="${C.line}" stroke-width="2" filter="url(#tightShadow)"/>
    <circle cx="${x + 80}" cy="${y + 100}" r="76" fill="${fill}" stroke="${color}" stroke-width="4"/>
    <path d="M${x + 20} ${y + 100} H${x + 140}" stroke="${color}" stroke-width="2" opacity="0.35"/>
    <text x="${x + 80}" y="${y + 38}" class="micro" text-anchor="middle" style="fill:${color};font-weight:900">${esc(n)}</text>
    <text x="${x + 80}" y="${y + 78}" class="label" text-anchor="middle" style="fill:${C.ink}">${esc(titleValue)}</text>
    ${arr.map((line, i) => `<text x="${x + 80}" y="${y + 126 + i * 30}" class="micro" text-anchor="middle" style="fill:${C.muted}">${esc(line)}</text>`).join("")}
  `;
}

function slideBitfunV3(slide, index) {
  const body = `
    ${header(slide, "06 / BitFun 缩影")}
    ${mainPoint(["BitFun 的价值不在项目细节，而在于把 AI 开发组织成可计划、可取证、可审查、可沉淀的闭环。"], C.coral)}
    <circle cx="960" cy="670" r="205" fill="none" stroke="${C.line2}" stroke-width="18" opacity="0.46"/>
    <path d="M960 465 A205 205 0 0 1 1165 670" fill="none" stroke="${C.teal}" stroke-width="14" stroke-linecap="round"/>
    <path d="M1165 670 A205 205 0 0 1 960 875" fill="none" stroke="${C.blue}" stroke-width="14" stroke-linecap="round"/>
    <path d="M960 875 A205 205 0 0 1 755 670" fill="none" stroke="${C.amber}" stroke-width="14" stroke-linecap="round"/>
    <path d="M755 670 A205 205 0 0 1 960 465" fill="none" stroke="${C.coral}" stroke-width="14" stroke-linecap="round"/>
    <circle cx="960" cy="670" r="118" fill="url(#darkPanel)" filter="url(#softShadow)"/>
    <text x="960" y="628" class="label" text-anchor="middle" style="fill:#FFFFFF;font-size:34px">开发过程</text>
    <text x="960" y="680" class="label" text-anchor="middle" style="fill:#FFFFFF;font-size:34px">产品化</text>
    ${loopLabel(742, 420, "Planning", "先探索和计划，再进入实现", C.teal, C.tealSoft)}
    ${loopLabel(1220, 570, "Evidence", "debug 先取证，不凭模型自信", C.blue, C.blueSoft)}
    ${loopLabel(742, 758, "Review", "执行者、审查者、仲裁者分离", C.amber, C.amberSoft)}
    ${loopLabel(240, 570, "Self-iteration", "失败沉淀成下一版工作流", C.coral, C.coralSoft)}
    ${thesisFooter("AI 工具的未来形态不是更会聊天，而是组织可治理的开发闭环。")}
  `;
  return svgBase(slide, index, body);
}

function loopLabel(x, y, titleValue, desc, color, fill) {
  return `
    <path d="M${x} ${y} H${x + 418} L${x + 460} ${y + 42} V${y + 126} H${x} Z" fill="${fill}" stroke="${color}" stroke-width="3" filter="url(#tightShadow)"/>
    <text x="${x + 34}" y="${y + 26}" class="label" style="fill:${color}">${esc(titleValue)}</text>
    <text x="${x + 34}" y="${y + 76}" class="body2" style="fill:${C.ink2}">${esc(desc)}</text>
  `;
}

function slideRoleV3(slide, index) {
  const body = `
    ${header(slide, "07 / 角色变化")}
    ${mainPoint(["程序员不是只从“写代码”升级为“会用 AI”，而是升级为能组织智能协作系统的人。"], C.teal)}
    <path d="M260 780 L260 560 L570 560 L570 490 L880 490 L880 420 L1190 420 L1190 350 L1500 350 L1500 285 L1710 285" fill="none" stroke="${C.line2}" stroke-width="14" stroke-linejoin="round" opacity="0.32"/>
    ${capabilityStep(190, 650, "01", "写代码", "理解语言、框架和系统行为", C.soft, C.bg2)}
    ${capabilityStep(500, 580, "02", "定义任务", "把模糊需求变成可执行问题", C.teal, C.tealSoft)}
    ${capabilityStep(810, 510, "03", "组织上下文", "让 Agent 看见正确事实", C.blue, C.blueSoft)}
    ${capabilityStep(1120, 440, "04", "设计验证闭环", "测试、评审、指标、trace", C.amber, C.amberSoft)}
    ${capabilityStep(1430, 370, "05", "治理协作系统", "权限、责任、回滚、复盘", C.coral, C.coralSoft)}
    <text x="220" y="842" class="label" style="fill:${C.ink}">留给高校课堂：</text>
    <text x="468" y="846" class="body2" style="fill:${C.ink2}">评价从“代码能跑”扩展到“定义问题、验证结果、解释风险”。</text>
    ${thesisFooter("未来优秀的软件人才，是会设计人与 AI Agent 共同工作的工程系统的人。")}
  `;
  return svgBase(slide, index, body);
}

function capabilityStep(x, y, n, titleValue, desc, color, fill) {
  return `
    <path d="M${x} ${y} h236 l42 42 v126 h-278 v-168Z" fill="${fill}" stroke="${color}" stroke-width="3" filter="url(#tightShadow)"/>
    <path d="M${x + 26} ${y + 22} H${x + 94}" stroke="${color}" stroke-width="4"/>
    <text x="${x + 30}" y="${y + 26}" class="micro" style="fill:${color};font-weight:900">${esc(n)}</text>
    <text x="${x + 30}" y="${y + 70}" class="label" style="fill:${C.ink}">${esc(titleValue)}</text>
    ${lines(x + 30, y + 118, splitDesc(desc), "micro", 28, C.muted)}
  `;
}

const D = {
  bg: "#071018",
  bg2: "#0B1722",
  panel: "#0E1F2C",
  ink: "#F4FAFD",
  ink2: "#D4E4EC",
  muted: "#7E95A4",
  line: "#1E3948",
  line2: "#294A5E",
  cyan: "#31D7E8",
  cyan2: "#74F4FF",
  blue: "#6EA8FF",
  teal: "#2FE6BF",
  amber: "#FFB84D",
  coral: "#FF7A45",
  violet: "#A99BFF",
};

function svgBaseV4(slide, index, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="deepHalo" cx="76%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#174B60" stop-opacity="0.72"/>
      <stop offset="42%" stop-color="#0D2736" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#071018" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warmHalo" cx="18%" cy="74%" r="52%">
      <stop offset="0%" stop-color="#57391C" stop-opacity="0.40"/>
      <stop offset="55%" stop-color="#071018" stop-opacity="0"/>
    </radialGradient>
    <pattern id="darkGrid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#18303E" stroke-width="1"/>
      <circle cx="0" cy="0" r="1.4" fill="#2B5364" opacity="0.7"/>
    </pattern>
    <linearGradient id="laser" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${D.teal}"/>
      <stop offset="45%" stop-color="${D.cyan}"/>
      <stop offset="78%" stop-color="${D.blue}"/>
      <stop offset="100%" stop-color="${D.coral}"/>
    </linearGradient>
    <linearGradient id="dimLaser" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#173445" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#0A1720" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="wideGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="22" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${D.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#deepHalo)"/>
  <rect width="${W}" height="${H}" fill="url(#warmHalo)"/>
  <rect width="${W}" height="${H}" fill="url(#darkGrid)" opacity="0.42"/>
  ${darkAmbient()}
  ${darkChrome(slide, index)}
  ${body}
</svg>`;
}

function darkAmbient() {
  return `
    <path d="M-40 820 C320 700 520 900 840 760 C1160 620 1320 460 1960 520" stroke="#1C4656" stroke-width="2" fill="none" opacity="0.42"/>
    <path d="M-80 250 C360 120 620 340 990 220 C1320 110 1520 140 2000 90" stroke="#24495C" stroke-width="1.5" fill="none" opacity="0.35"/>
    <circle cx="1580" cy="188" r="260" fill="#0A2532" opacity="0.42"/>
    <circle cx="302" cy="830" r="210" fill="#241A12" opacity="0.24"/>
    <path d="M1510 80 H1840 V310" stroke="#2A5668" stroke-width="2" fill="none" opacity="0.55"/>
    <path d="M80 900 H420 V1010" stroke="#2A5668" stroke-width="2" fill="none" opacity="0.35"/>
  `;
}

function darkChrome(slide, index) {
  return `
    <style>
      text { font-family: "Microsoft YaHei", "Noto Sans SC", "PingFang SC", "Segoe UI", sans-serif; dominant-baseline: hanging; }
      .mono { font-family: "Cascadia Mono", "JetBrains Mono", "Consolas", "Microsoft YaHei", monospace; }
      .chrome { font-size: 18px; font-weight: 800; letter-spacing: 2.1px; fill: ${D.muted}; }
      .kickerD { font-size: 25px; font-weight: 900; fill: ${D.cyan}; letter-spacing: 1.6px; }
      .titleD { font-size: 74px; font-weight: 900; fill: ${D.ink}; letter-spacing: -1.2px; }
      .subD { font-size: 32px; font-weight: 540; fill: ${D.muted}; }
      .bodyD { font-size: 31px; font-weight: 640; fill: ${D.ink2}; }
      .mutedD { font-size: 27px; font-weight: 560; fill: ${D.muted}; }
      .labelD { font-size: 27px; font-weight: 900; fill: ${D.ink}; }
      .microD { font-size: 21px; font-weight: 820; fill: ${D.muted}; }
      .numD { font-family: "Arial", "Microsoft YaHei", sans-serif; font-weight: 900; fill: ${D.ink}; }
    </style>
    <text x="80" y="52" class="mono chrome">${esc(slide.section)}</text>
    <text x="1840" y="52" class="mono chrome" text-anchor="end">${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</text>
    <line x1="80" y1="94" x2="1840" y2="94" stroke="#203B4C" stroke-width="2"/>
    <line x1="80" y1="94" x2="430" y2="94" stroke="url(#laser)" stroke-width="4"/>
    <line x1="80" y1="1012" x2="1840" y2="1012" stroke="#203B4C" stroke-width="2"/>
  `;
}

function darkHeader(slide, section) {
  return `
    <text x="96" y="122" class="kickerD">${esc(section)}</text>
    <text x="96" y="170" class="titleD">${esc(slide.title)}</text>
    <text x="100" y="250" class="subD">${esc(slide.subtitle)}</text>
  `;
}

function darkKey(textValue, color = D.cyan) {
  return `
    <path d="M104 326 H1620" stroke="${color}" stroke-width="3" opacity="0.9"/>
    <text x="104" y="352" class="mono microD" style="fill:${color};letter-spacing:2.6px">KEY MESSAGE</text>
    <text x="104" y="396" class="bodyD" style="fill:${D.ink};font-weight:900">${esc(textValue)}</text>
  `;
}

function darkTakeaway(textValue) {
  return `
    <path d="M120 916 H1724" stroke="url(#laser)" stroke-width="3" opacity="0.92"/>
    <text x="120" y="938" class="mono microD" style="fill:${D.cyan};letter-spacing:2.4px">TAKEAWAY</text>
    <text x="420" y="934" class="bodyD" style="fill:${D.ink};font-weight:900">${esc(textValue)}</text>
  `;
}

function glowDot(x, y, r, color, label, sub) {
  return `
    <circle cx="${x}" cy="${y}" r="${r + 22}" fill="${color}" opacity="0.10" filter="url(#wideGlow)"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#0A1720" stroke="${color}" stroke-width="3"/>
    <text x="${x}" y="${y - 18}" class="labelD" text-anchor="middle" style="fill:${color}">${esc(label)}</text>
    ${sub ? `<text x="${x}" y="${y + 22}" class="microD" text-anchor="middle">${esc(sub)}</text>` : ""}
  `;
}

function annotation(x, y, titleValue, desc, color = D.cyan) {
  return `
    <text x="${x}" y="${y}" class="labelD" style="fill:${color}">${esc(titleValue)}</text>
    <text x="${x}" y="${y + 42}" class="mutedD">${esc(desc)}</text>
  `;
}

function arcText(x, y, titleValue, desc, color) {
  return `
    <circle cx="${x}" cy="${y}" r="7" fill="${color}" filter="url(#glow)"/>
    <text x="${x + 24}" y="${y - 18}" class="labelD" style="fill:${color}">${esc(titleValue)}</text>
    <text x="${x + 24}" y="${y + 22}" class="mutedD">${esc(desc)}</text>
  `;
}

function signalField(x, y, w, h, color = D.cyan, opacity = 0.24) {
  const cols = Math.floor(w / 56);
  const rows = Math.floor(h / 48);
  const parts = [`<g opacity="${opacity}">`];
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      const px = x + col * 56 + (row % 2) * 18;
      const py = y + row * 48;
      parts.push(`<circle cx="${px}" cy="${py}" r="${(row + col) % 3 === 0 ? 3.2 : 2}" fill="${color}"/>`);
      if ((row + col) % 4 === 0 && col < cols) {
        parts.push(`<path d="M${px + 8} ${py} H${px + 40}" stroke="${color}" stroke-width="1.4" fill="none"/>`);
      }
      if ((row * 2 + col) % 5 === 0 && row < rows) {
        parts.push(`<path d="M${px} ${py + 8} V${py + 34}" stroke="${color}" stroke-width="1.2" fill="none"/>`);
      }
    }
  }
  parts.push("</g>");
  return parts.join("");
}

function waveStack(x, y, w, color = D.cyan, opacity = 0.22) {
  return `
    <g opacity="${opacity}">
      <path d="M${x} ${y} C${x + w * 0.22} ${y - 56} ${x + w * 0.46} ${y + 62} ${x + w * 0.68} ${y} S${x + w * 0.88} ${y - 42} ${x + w} ${y + 18}" stroke="${color}" stroke-width="2" fill="none"/>
      <path d="M${x} ${y + 58} C${x + w * 0.22} ${y + 6} ${x + w * 0.46} ${y + 116} ${x + w * 0.68} ${y + 58} S${x + w * 0.88} ${y + 18} ${x + w} ${y + 78}" stroke="${color}" stroke-width="1.5" fill="none"/>
      <path d="M${x} ${y + 116} C${x + w * 0.22} ${y + 64} ${x + w * 0.46} ${y + 176} ${x + w * 0.68} ${y + 116} S${x + w * 0.88} ${y + 76} ${x + w} ${y + 136}" stroke="${color}" stroke-width="1.2" fill="none"/>
    </g>
  `;
}

function radialTicks(cx, cy, r, color = D.cyan, count = 48, opacity = 0.28) {
  const ticks = [`<g opacity="${opacity}">`];
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    const len = i % 6 === 0 ? 28 : 14;
    const x1 = cx + Math.cos(a) * r;
    const y1 = cy + Math.sin(a) * r;
    const x2 = cx + Math.cos(a) * (r + len);
    const y2 = cy + Math.sin(a) * (r + len);
    ticks.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${color}" stroke-width="${i % 6 === 0 ? 2 : 1}" fill="none"/>`);
  }
  ticks.push("</g>");
  return ticks.join("");
}

function telemetryBars(x, y, w, h, color = D.cyan, opacity = 0.18) {
  const bars = [`<g opacity="${opacity}">`];
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const bx = x + (w / count) * i;
    const bh = 24 + ((i * 37) % h);
    bars.push(`<rect x="${bx.toFixed(1)}" y="${(y + h - bh).toFixed(1)}" width="10" height="${bh}" rx="5" fill="${color}"/>`);
  }
  bars.push("</g>");
  return bars.join("");
}

function slideCoverV4(slide, index) {
  const body = `
    ${signalField(1220, 198, 470, 220, D.cyan, 0.16)}
    ${waveStack(1010, 758, 620, D.blue, 0.15)}
    <text x="104" y="150" class="kickerD">BITFUN / AGENTIC CODING / SOFTWARE ENGINEERING</text>
    <text x="104" y="226" class="titleD" style="font-size:76px">${esc(slide.title)}</text>
    <text x="110" y="322" class="subD">${esc(slide.subtitle)}</text>
    <text x="110" y="430" class="bodyD" style="fill:${D.ink};font-weight:900">核心不是“AI 会写多少代码”，而是软件工程的对象正在扩大。</text>
    <text x="110" y="486" class="mutedD">从文件、函数、提交，扩展到任务、上下文、工具、权限、验证、反馈与人类监督。</text>
    <path d="M120 670 C410 560 610 695 850 620 C1120 538 1320 420 1650 475" stroke="url(#laser)" stroke-width="6" fill="none" filter="url(#glow)"/>
    ${glowDot(170, 670, 60, D.teal, "代码产能", "写得更快")}
    ${glowDot(640, 642, 60, D.blue, "工程证据", "证明完成")}
    ${glowDot(1080, 542, 60, D.amber, "组织治理", "可追责")}
    <text x="1380" y="510" class="numD" style="font-size:132px;fill:${D.coral}">18w+</text>
    <text x="1392" y="655" class="bodyD" style="fill:${D.ink};font-weight:900">行代码 / 约 1 个月</text>
    <path d="M1370 350 h280 l120 110 v210" stroke="${D.cyan}" stroke-width="3" fill="none" opacity="0.62"/>
    <circle cx="1370" cy="350" r="9" fill="${D.teal}"/>
    <circle cx="1650" cy="350" r="9" fill="${D.blue}"/>
    <circle cx="1770" cy="670" r="9" fill="${D.coral}"/>
    ${darkTakeaway("AI 重新定义软件开发，是从“写代码”走向“组织智能协作系统”。")}
  `;
  return svgBaseV4(slide, index, body);
}

function slideShockV4(slide, index) {
  const body = `
    ${signalField(1040, 220, 620, 250, D.coral, 0.13)}
    ${waveStack(195, 468, 520, D.coral, 0.16)}
    ${darkHeader(slide, "01 / 产能冲击")}
    ${darkKey("代码量暴涨不是终点，它会把软件工程的瓶颈推向验证、协作和治理。", D.coral)}
    <circle cx="560" cy="620" r="132" fill="#0A1720" stroke="${D.coral}" stroke-width="6" filter="url(#glow)"/>
    <text x="560" y="536" class="numD" text-anchor="middle" style="font-size:118px;fill:${D.coral}">18w+</text>
    <text x="560" y="690" class="labelD" text-anchor="middle">代码产能被放大</text>
    <circle cx="560" cy="620" r="214" fill="none" stroke="${D.coral}" stroke-width="2" opacity="0.28"/>
    <circle cx="560" cy="620" r="306" fill="none" stroke="${D.coral}" stroke-width="2" opacity="0.17"/>
    <path d="M700 548 C930 512 1060 470 1260 430" stroke="${D.teal}" stroke-width="5" fill="none"/>
    <path d="M708 620 C930 620 1060 620 1260 610" stroke="${D.blue}" stroke-width="5" fill="none"/>
    <path d="M700 704 C925 735 1065 758 1260 790" stroke="${D.amber}" stroke-width="5" fill="none"/>
    ${annotation(1300, 404, "需求变化更快", "方向灵活，也更容易失去稳定验收标准", D.teal)}
    ${annotation(1300, 584, "变更规模更大", "review、测试和回归成本随之上升", D.blue)}
    ${annotation(1300, 764, "质量责任更重", "谁确认、谁放行、谁复盘变得更关键", D.amber)}
    <text x="180" y="828" class="mutedD">开场追问</text>
    <text x="180" y="866" class="bodyD" style="fill:${D.ink};font-weight:900">如果你是维护者，面对一个 AI 生成的大型 PR，会先看代码量，还是先找验证证据？</text>
    ${darkTakeaway("AI 把开发从“产能问题”推向“工程治理问题”。")}
  `;
  return svgBaseV4(slide, index, body);
}

function slideExplorationV4(slide, index) {
  const body = `
    ${signalField(1160, 430, 520, 230, D.blue, 0.16)}
    ${waveStack(250, 838, 760, D.teal, 0.13)}
    ${darkHeader(slide, "02 / 探索方式")}
    ${darkKey("探索可以从排期驱动变成想法驱动，但交付必须回到证据驱动。", D.teal)}
    <path d="M170 720 C420 555 685 512 930 625 S1330 795 1710 520" stroke="#183646" stroke-width="18" fill="none" opacity="0.76"/>
    <path d="M170 720 C420 555 685 512 930 625 S1330 795 1710 520" stroke="url(#laser)" stroke-width="7" fill="none" filter="url(#glow)"/>
    <path d="M330 475 C520 455 760 468 950 548 C1190 648 1350 682 1620 590" stroke="#24566B" stroke-width="2" fill="none" opacity="0.42"/>
    ${glowDot(170, 720, 54, D.muted, "过去", "排期驱动")}
    ${glowDot(690, 512, 64, D.teal, "现在", "想法驱动")}
    ${glowDot(1120, 700, 58, D.amber, "边界", "质量责任")}
    ${glowDot(1710, 520, 64, D.blue, "下一步", "证据驱动")}
    ${arcText(355, 810, "更快原型", "几天内从想法到可运行形态", D.teal)}
    ${arcText(700, 828, "更灵活变更", "方向不确定时，试错成本下降", D.blue)}
    ${arcText(1045, 828, "更低试错成本", "更多想法可以被验证", D.amber)}
    <text x="1380" y="820" class="mutedD">但这些仍只是“探索收益”</text>
    ${darkTakeaway("AI 让原型更像实验室，真实工程仍要有验收、回滚和审计。")}
  `;
  return svgBaseV4(slide, index, body);
}

function slideLifecycleV4(slide, index) {
  const body = `
    ${radialTicks(480, 625, 252, D.violet, 56, 0.18)}
    ${signalField(1030, 378, 650, 170, D.blue, 0.14)}
    ${darkHeader(slide, "03 / Agentic Coding")}
    ${darkKey("AI 编程的对象正在从代码片段，扩展到任务、上下文、工具、权限、验证和反馈。", D.blue)}
    <circle cx="480" cy="625" r="212" fill="none" stroke="${D.violet}" stroke-width="5" opacity="0.85"/>
    <circle cx="480" cy="625" r="144" fill="none" stroke="${D.blue}" stroke-width="5"/>
    <circle cx="480" cy="625" r="76" fill="none" stroke="${D.teal}" stroke-width="5"/>
    <text x="480" y="582" class="labelD" text-anchor="middle" style="fill:${D.teal}">Prompt</text>
    <text x="480" y="628" class="labelD" text-anchor="middle" style="fill:${D.blue}">Context</text>
    <text x="480" y="766" class="labelD" text-anchor="middle" style="fill:${D.violet}">Harness / Platform</text>
    <text x="205" y="858" class="mutedD">Prompt 不是全部；可靠执行来自上下文、权限、验证和 trace。</text>
    <path d="M860 620 H1710" stroke="#213F50" stroke-width="10" opacity="0.82"/>
    <path d="M860 620 H1710" stroke="url(#laser)" stroke-width="4" filter="url(#glow)"/>
    ${orbitStep(880, 538, "代码补全", "补一行 / 补函数", D.muted)}
    ${orbitStep(1120, 492, "Agentic Coding", "读仓库 / 改文件 / 跑命令", D.teal)}
    ${orbitStep(1390, 538, "AI-assisted SDLC", "需求 / 测试 / CI / review", D.blue)}
    ${orbitStep(1645, 492, "智能协作系统", "平台化 / 可治理", D.coral)}
    ${arcText(1000, 770, "AGENTS.md", "项目级上下文影响 Agent 效率", D.teal)}
    ${arcText(1285, 862, "Agent PR", "AI 已进入 GitHub 协作链路", D.blue)}
    ${arcText(1515, 760, "CI-Bench", "真实 CI 失败是工程验证场", D.coral)}
    ${darkTakeaway("模型能力是上限，工程系统才是可靠性下限。")}
  `;
  return svgBaseV4(slide, index, body);
}

function orbitStep(x, y, titleValue, desc, color) {
  return `
    <circle cx="${x}" cy="${y}" r="8" fill="${color}" filter="url(#glow)"/>
    <text x="${x}" y="${y - 66}" class="labelD" text-anchor="middle" style="fill:${color}">${esc(titleValue)}</text>
    <text x="${x}" y="${y - 28}" class="microD" text-anchor="middle">${esc(desc)}</text>
  `;
}

function slideQualityV4(slide, index) {
  const body = `
    ${signalField(1430, 326, 310, 170, D.amber, 0.16)}
    ${signalField(165, 335, 320, 165, D.teal, 0.14)}
    ${radialTicks(960, 660, 185, D.cyan, 48, 0.16)}
    ${darkHeader(slide, "04 / 质量责任")}
    ${darkKey("高质量不是单一标准：开源强调公共责任，大厂强调复杂组织交付责任。", D.amber)}
    <path d="M240 640 C520 460 750 520 920 650" stroke="${D.teal}" stroke-width="11" fill="none" opacity="0.72"/>
    <path d="M1680 640 C1400 460 1170 520 1000 650" stroke="${D.amber}" stroke-width="11" fill="none" opacity="0.72"/>
    <circle cx="960" cy="660" r="154" fill="#091722" stroke="${D.ink}" stroke-width="2"/>
    <circle cx="960" cy="660" r="128" fill="none" stroke="${D.cyan}" stroke-width="4" opacity="0.72"/>
    <text x="960" y="582" class="labelD" text-anchor="middle" style="font-size:40px;fill:${D.ink}">可验证责任</text>
    <text x="960" y="657" class="mutedD" text-anchor="middle">谁负责</text>
    <text x="960" y="704" class="mutedD" text-anchor="middle">用什么证据确认</text>
    <text x="960" y="751" class="mutedD" text-anchor="middle">失败后如何复盘</text>
    ${annotation(160, 525, "开源高质量协作", "开发者对提交负责，维护者验证大规模 AI 变更", D.teal)}
    ${arcText(200, 665, "CODEOWNERS", "owner review / required checks / CodeQL", D.teal)}
    ${annotation(1240, 525, "大厂复杂交付", "组织对系统、流程和用户连续性负责", D.amber)}
    ${arcText(1295, 665, "SLO / error budget", "canary / OpenTelemetry / rollback", D.amber)}
    <text x="960" y="842" class="bodyD" text-anchor="middle" style="fill:${D.ink};font-weight:900">通过单测只是起点，离“可合并、可发布、可长期维护”仍有距离。</text>
    ${darkTakeaway("开源不是低质量，大厂也不是多跑测试；关键是责任链和证据链。")}
  `;
  return svgBaseV4(slide, index, body);
}

function slideResponsesV4(slide, index) {
  const body = `
    ${telemetryBars(260, 406, 1380, 176, D.teal, 0.15)}
    ${signalField(1230, 720, 420, 130, D.coral, 0.12)}
    ${darkHeader(slide, "05 / 工程补法")}
    ${darkKey("成熟补法不是多贴几个工具名，而是把 AI 变更放进一条可验证的证据链。", D.teal)}
    <path d="M235 620 H1690" stroke="#213F50" stroke-width="18" stroke-linecap="round" opacity="0.68"/>
    <path d="M235 620 H1690" stroke="url(#laser)" stroke-width="6" stroke-linecap="round" filter="url(#glow)"/>
    ${chainNode(260, 620, "01", "上下文", "需求 / 规范 / 历史决策", D.teal)}
    ${chainNode(590, 620, "02", "变更", "代码 / 配置 / 测试 / 文档", D.blue)}
    ${chainNode(920, 620, "03", "质量门禁", "CI / review / 安全扫描", D.violet)}
    ${chainNode(1250, 620, "04", "架构守护", "边界 / owner / ADR", D.amber)}
    ${chainNode(1580, 620, "05", "运行看护", "SLO / trace / 灰度回滚", D.coral)}
    <text x="960" y="792" class="bodyD" text-anchor="middle" style="fill:${D.ink};font-weight:900">Finish = 测试结果 + 评审结论 + 架构约束 + 运行指标 + 失败说明</text>
    ${darkTakeaway("把“相信模型”改成“组织证据”，才是 AI 时代的软件工程升级。")}
  `;
  return svgBaseV4(slide, index, body);
}

function chainNode(x, y, n, titleValue, desc, color) {
  return `
    <circle cx="${x}" cy="${y}" r="86" fill="#091722" stroke="${color}" stroke-width="5" filter="url(#glow)"/>
    <text x="${x}" y="${y - 58}" class="microD" text-anchor="middle" style="fill:${color}">${esc(n)}</text>
    <text x="${x}" y="${y - 14}" class="labelD" text-anchor="middle">${esc(titleValue)}</text>
    <text x="${x}" y="${y + 36}" class="microD" text-anchor="middle">${esc(desc)}</text>
  `;
}

function slideBitfunV4(slide, index) {
  const body = `
    ${radialTicks(960, 662, 300, D.cyan, 68, 0.20)}
    ${signalField(240, 470, 390, 210, D.coral, 0.12)}
    ${signalField(1260, 430, 420, 220, D.blue, 0.14)}
    ${darkHeader(slide, "06 / BitFun 缩影")}
    ${darkKey("BitFun 的价值不在项目细节，而在于把 AI 开发组织成可计划、可取证、可审查、可沉淀的闭环。", D.coral)}
    <circle cx="960" cy="662" r="236" fill="none" stroke="#24485A" stroke-width="20" opacity="0.72"/>
    <path d="M960 426 A236 236 0 0 1 1196 662" stroke="${D.teal}" stroke-width="12" fill="none"/>
    <path d="M1196 662 A236 236 0 0 1 960 898" stroke="${D.blue}" stroke-width="12" fill="none"/>
    <path d="M960 898 A236 236 0 0 1 724 662" stroke="${D.amber}" stroke-width="12" fill="none"/>
    <path d="M724 662 A236 236 0 0 1 960 426" stroke="${D.coral}" stroke-width="12" fill="none"/>
    <circle cx="960" cy="662" r="136" fill="#08141D" stroke="${D.ink}" stroke-width="2" filter="url(#glow)"/>
    <text x="960" y="600" class="labelD" text-anchor="middle" style="font-size:42px;fill:${D.ink}">开发过程</text>
    <text x="960" y="668" class="labelD" text-anchor="middle" style="font-size:42px;fill:${D.ink}">产品化</text>
    ${annotation(692, 438, "Planning", "先探索和计划，再进入实现", D.teal)}
    ${annotation(1270, 590, "Evidence", "debug 先取证，不凭模型自信", D.blue)}
    ${annotation(665, 812, "Review", "执行者、审查者、仲裁者分离", D.amber)}
    ${annotation(240, 594, "Self-iteration", "失败沉淀成下一版工作流", D.coral)}
    ${darkTakeaway("AI 工具的未来形态不是更会聊天，而是组织可治理的开发闭环。")}
  `;
  return svgBaseV4(slide, index, body);
}

function slideRoleV4(slide, index) {
  const body = `
    ${signalField(1125, 270, 520, 210, D.amber, 0.14)}
    ${waveStack(210, 532, 560, D.teal, 0.13)}
    ${darkHeader(slide, "07 / 角色变化")}
    ${darkKey("程序员不是只从“写代码”升级为“会用 AI”，而是升级为能组织智能协作系统的人。", D.teal)}
    <path d="M220 805 L220 720 L540 720 L540 640 L860 640 L860 560 L1180 560 L1180 480 L1500 480 L1500 400" stroke="#25475A" stroke-width="12" fill="none" opacity="0.65"/>
    <path d="M220 805 L220 720 L540 720 L540 640 L860 640 L860 560 L1180 560 L1180 480 L1500 480 L1500 400" stroke="url(#laser)" stroke-width="4" fill="none" filter="url(#glow)"/>
    ${rolePoint(220, 805, "01", "写代码", "理解语言、框架和系统行为", D.muted)}
    ${rolePoint(540, 720, "02", "定义任务", "把模糊需求变成可执行问题", D.teal)}
    ${rolePoint(860, 640, "03", "组织上下文", "让 Agent 看见正确事实", D.blue)}
    ${rolePoint(1180, 560, "04", "设计验证闭环", "测试、评审、指标、trace", D.amber)}
    ${rolePoint(1500, 480, "05", "治理协作系统", "权限、责任、回滚、复盘", D.coral)}
    <text x="230" y="862" class="labelD" style="fill:${D.ink}">留给高校课堂：</text>
    <text x="470" y="864" class="mutedD">评价从“代码能跑”扩展到“定义问题、验证结果、解释风险”。</text>
    ${darkTakeaway("未来优秀的软件人才，是会设计人与 AI Agent 共同工作的工程系统的人。")}
  `;
  return svgBaseV4(slide, index, body);
}

function rolePoint(x, y, n, titleValue, desc, color) {
  return `
    <circle cx="${x}" cy="${y}" r="10" fill="${color}" filter="url(#glow)"/>
    <text x="${x + 24}" y="${y - 70}" class="microD" style="fill:${color}">${esc(n)}</text>
    <text x="${x + 24}" y="${y - 34}" class="labelD">${esc(titleValue)}</text>
    <text x="${x + 24}" y="${y + 4}" class="microD">${esc(desc)}</text>
  `;
}

const L = {
  bg: "#FBFAF7",
  paper: "#FFFFFF",
  ink: "#050608",
  muted: "#5F6670",
  soft: "#A5A9AE",
  line: "#D7D7D2",
  line2: "#C4C6C1",
  blue: "#106BEF",
  blue2: "#0C55CF",
  orange: "#FF5A1F",
  warm: "#776B5B",
  faint: "#F0EFEA",
};

function svgBaseV5(slide, index, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="lightDots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="1.7" fill="${L.line2}" opacity="0.55"/>
    </pattern>
    <filter id="paperShadow" x="-18%" y="-18%" width="136%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#4B5563" flood-opacity="0.13"/>
    </filter>
    <marker id="arrowBlue" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2 2 L10 6 L2 10" fill="none" stroke="${L.blue}" stroke-width="2"/>
    </marker>
    <marker id="arrowGray" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
      <path d="M2 2 L10 6 L2 10" fill="none" stroke="${L.soft}" stroke-width="2"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" fill="${L.bg}"/>
  ${lightCircuit()}
  ${sectionWatermark(index)}
  ${v5Chrome(slide, index)}
  ${body}
</svg>`;
}

function sectionWatermark(index) {
  const item = sectionWatermarkInfo(index);
  if (!item) return "";
  const color = L.blue;
  return `
    <g transform="rotate(-2 1508 104)">
      <text x="1268" y="58"
        style="font-family:'Arial Black','Microsoft YaHei','Noto Sans SC',sans-serif;font-size:88px;font-weight:900;letter-spacing:1.4px;fill:${color};fill-opacity:0.15;stroke:${color};stroke-width:1.4;stroke-opacity:0.2;paint-order:stroke">${esc(item.n)}</text>
      <text x="1370" y="92"
        style="font-family:'Microsoft YaHei','Noto Sans SC','Segoe UI',sans-serif;font-size:38px;font-weight:900;letter-spacing:1.6px;fill:${color};stroke:${L.paper};stroke-width:2.4;paint-order:stroke;fill-opacity:0.48">${esc(item.title)}</text>
      <path d="M1368 150 C1488 118 1628 174 1768 134" stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.24"/>
    </g>
  `;
}

function sectionWatermarkInfo(index) {
  const page = index + 1;
  if (page === 3) return { n: "01", title: "现实观察" };
  if (page === 4) return { n: "02", title: "研究共识" };
  if (page >= 5 && page <= 8) return { n: "03", title: "工程治理" };
  if (page >= 9 && page <= 12) return { n: "04", title: "能力演进" };
  return null;
}

function lightCircuit() {
  return `
    <path d="M1816 92 h-70 q-28 0 -28 28 v78" stroke="${L.line}" stroke-width="2" fill="none" opacity="0.34"/>
    <path d="M1782 890 v-190 q0 -32 32 -32 h50" stroke="${L.line}" stroke-width="2" fill="none"/>
    <path d="M1650 820 h112 q30 0 30 -30 v-80" stroke="${L.line}" stroke-width="2" fill="none"/>
    <circle cx="1800" cy="708" r="7" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <circle cx="1762" cy="820" r="7" fill="${L.blue}"/>
    <circle cx="1848" cy="622" r="6" fill="${L.orange}"/>
    <rect x="1378" y="720" width="180" height="120" fill="url(#lightDots)" opacity="0.48"/>
    <rect x="152" y="318" width="128" height="96" fill="url(#lightDots)" opacity="0.42"/>
    <path d="M70 740 h120 v118 h250" stroke="${L.line}" stroke-width="2" fill="none"/>
    <path d="M50 510 h116 q26 0 26 26 v52" stroke="${L.line}" stroke-width="2" fill="none"/>
    <circle cx="150" cy="857" r="5" fill="${L.orange}"/>
    ${cityLine(1350, 820, 0.72)}
  `;
}

function cityLine(x, y, scale = 1) {
  return `
    <g opacity="0.26" transform="translate(${x} ${y}) scale(${scale})">
      <path d="M0 120 L110 60 L220 120 L110 180 Z" fill="none" stroke="${L.line2}" stroke-width="2"/>
      <path d="M110 60 V180 M0 120 V220 M220 120 V220 M0 220 H320" stroke="${L.line2}" stroke-width="2" fill="none"/>
      <path d="M260 50 h70 v170 h-70 Z M280 80 h30 M280 116 h30 M280 152 h30" stroke="${L.line2}" stroke-width="2" fill="none"/>
      <path d="M360 96 h90 v124 h-90 Z M382 122 h46 M382 154 h46 M382 186 h46" stroke="${L.line2}" stroke-width="2" fill="none"/>
      <path d="M88 144 h42 v76 h-42 Z M150 126 h48 v94 h-48 Z" stroke="${L.line2}" stroke-width="2" fill="none"/>
    </g>
  `;
}

function v5Chrome(slide, index) {
  return `
    <style>
      text { font-family: "Microsoft YaHei", "Noto Sans SC", "PingFang SC", "Segoe UI", Arial, sans-serif; dominant-baseline: hanging; }
      .brand5 { font-size: 42px; font-weight: 900; fill: ${L.ink}; }
      .num5 { font-family: "Arial", "Microsoft YaHei", sans-serif; font-weight: 900; fill: ${L.ink}; }
      .h15 { font-size: 68px; font-weight: 900; fill: ${L.ink}; letter-spacing: 0; }
      .h25 { font-size: 58px; font-weight: 900; fill: ${L.ink}; letter-spacing: 0; }
      .sub5 { font-size: 31px; font-weight: 560; fill: ${L.muted}; }
      .body5 { font-size: 30px; font-weight: 700; fill: ${L.ink}; }
      .muted5 { font-size: 24px; font-weight: 560; fill: ${L.muted}; }
      .label5 { font-size: 29px; font-weight: 900; fill: ${L.ink}; }
      .small5 { font-size: 23px; font-weight: 760; fill: ${L.muted}; }
      .micro5 { font-size: 19px; font-weight: 760; fill: ${L.muted}; }
    </style>
    <text x="42" y="46" class="brand5">BitFun</text>
    <text x="1840" y="50" class="small5" text-anchor="end">${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}</text>
  `;
}

function v5Header(kicker, titleValue, subtitle, titleSize = 72) {
  return `
    <text x="96" y="146" class="h15" style="font-size:${titleSize}px">${esc(titleValue)}</text>
    ${subtitle ? `<text x="100" y="${titleSize > 72 ? 250 : 244}" class="sub5">${esc(subtitle)}</text>` : ""}
    <path d="M96 ${subtitle ? 318 : 268} h112" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="${subtitle ? 230 : 226}" cy="${subtitle ? 318 : 268}" r="5.5" fill="${L.orange}"/>
  `;
}

function v5Takeaway(textValue, y = 918, width = 1260) {
  return `
    <rect x="${(1920 - width) / 2}" y="${y}" width="${width}" height="82" rx="10" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M${(1920 - width) / 2 + 82} ${y + 21} v40" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <text x="${(1920 - width) / 2 + 130}" y="${y + 22}" class="body5" style="font-size:31px">${esc(textValue)}</text>
  `;
}

const TAKEAWAY_Y_V02 = 954;
const TAKEAWAY_H_V02 = 64;
const TAKEAWAY_W_V02 = 1580;

function v02Takeaway(textValue, _ignoredWidth = TAKEAWAY_W_V02, _ignoredY = TAKEAWAY_Y_V02) {
  // Keep every bottom takeaway locked to one footprint. Some older calls still
  // pass width/y values; ignore them so future content edits cannot accidentally
  // misalign the footer strip.
  const y = TAKEAWAY_Y_V02;
  const width = TAKEAWAY_W_V02;
  const x = (1920 - width) / 2;
  return `
    <rect x="${x}" y="${y}" width="${width}" height="${TAKEAWAY_H_V02}" rx="10" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M${x + 70} ${y + 17} v30" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <text x="${x + width / 2 + 26}" y="${y + TAKEAWAY_H_V02 / 2 - 2}" class="body5" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" style="font-size:27px">${esc(textValue)}</text>
  `;
}

function v5Icon(type, x, y, size = 62, color = L.blue) {
  const s = size / 64;
  const common = `stroke="${color}" stroke-width="${3 / s}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const wrap = (inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
  if (type === "code") return wrap(`<path d="M24 20 L10 32 L24 44" ${common}/><path d="M40 20 L54 32 L40 44" ${common}/><path d="M36 14 L28 50" ${common}/>`);
  if (type === "chat") return wrap(`<path d="M12 18 h40 q8 0 8 8 v18 q0 8 -8 8 H32 l-12 9 v-9 h-8 q-8 0 -8-8 V26 q0-8 8-8 Z" ${common}/><circle cx="24" cy="35" r="2.4" fill="${color}"/><circle cx="34" cy="35" r="2.4" fill="${color}"/><circle cx="44" cy="35" r="2.4" fill="${color}"/>`);
  if (type === "stack") return wrap(`<rect x="16" y="16" width="24" height="24" rx="3" ${common}/><rect x="24" y="24" width="24" height="24" rx="3" ${common}/><rect x="8" y="8" width="24" height="24" rx="3" ${common}/>`);
  if (type === "terminal") return wrap(`<path d="M18 18 L34 32 L18 46" ${common}/><path d="M38 48 h16" ${common}/>`);
  if (type === "check") return wrap(`<rect x="12" y="10" width="40" height="44" rx="4" ${common}/><path d="M22 32 l8 8 l14 -18" ${common}/>`);
  if (type === "team") return wrap(`<circle cx="32" cy="22" r="8" ${common}/><circle cx="18" cy="30" r="6" ${common}/><circle cx="46" cy="30" r="6" ${common}/><path d="M14 50 q18 -16 36 0 M4 54 q14 -12 28 -5 M32 49 q14 -7 28 5" ${common}/>`);
  if (type === "file") return wrap(`<path d="M18 8 h22 l10 10 v38 H18 Z M40 8 v12 h12 M26 32 h20 M26 42 h18" ${common}/>`);
  if (type === "cube") return wrap(`<path d="M32 6 L54 18 V44 L32 58 L10 44 V18 Z M10 18 L32 32 L54 18 M32 32 V58" ${common}/><path d="M20 13 l22 14 M44 12 L22 27" ${common} opacity="0.55"/>`);
  if (type === "grid") return wrap(`<rect x="10" y="10" width="18" height="18" ${common}/><rect x="36" y="10" width="18" height="18" ${common}/><rect x="10" y="36" width="18" height="18" ${common}/><path d="M41 36 l14 9 l-14 9 l-14 -9 Z" ${common}/>`);
  if (type === "server") return wrap(`<rect x="12" y="10" width="40" height="13" rx="4" ${common}/><rect x="12" y="29" width="40" height="13" rx="4" ${common}/><rect x="12" y="48" width="40" height="13" rx="4" ${common}/><circle cx="22" cy="16.5" r="1.8" fill="${color}"/><circle cx="22" cy="35.5" r="1.8" fill="${color}"/><circle cx="22" cy="54.5" r="1.8" fill="${color}"/>`);
  if (type === "loop") return wrap(`<path d="M48 18 A22 22 0 0 0 14 24 M14 24 h12 M14 24 v-12 M16 46 A22 22 0 0 0 50 40 M50 40 H38 M50 40 v12" ${common}/><path d="M24 34 l7 7 l13 -17" ${common}/>`);
  if (type === "shield") return wrap(`<path d="M32 6 L52 14 V30 q0 18 -20 28 Q12 48 12 30 V14 Z M22 32 l7 7 l15 -18" ${common}/>`);
  return wrap(`<circle cx="32" cy="32" r="22" ${common}/><path d="M20 32 h24 M32 20 v24" ${common}/>`);
}

function v5Card(x, y, w, h, icon, titleValue, desc, n = "", color = L.blue) {
  const compact = h <= 96;
  const iconSize = compact ? 48 : 58;
  const iconY = y + (h - iconSize) / 2;
  const textX = x + (compact ? 108 : 118);
  const titleY = y + (h - (compact ? 58 : 66)) / 2;
  const descY = titleY + (compact ? 34 : 40);
  const titleSize = compact ? 27 : 29;
  const descSize = compact ? 21 : 23;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${v5Icon(icon, x + 30, iconY, iconSize, color)}
    ${n ? `<text x="${x + w - 34}" y="${y + 26}" class="num5" text-anchor="end" style="font-size:42px">${esc(n)}</text>` : ""}
    <text x="${textX}" y="${titleY}" class="label5" style="font-size:${titleSize}px">${esc(titleValue)}</text>
    <text x="${textX}" y="${descY}" class="small5" style="font-size:${descSize}px">${esc(desc)}</text>
  `;
}

function v5Step(x, y, icon, n, titleValue, desc, color = L.blue) {
  return `
    <rect x="${x}" y="${y}" width="112" height="112" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${v5Icon(icon, x + 24, y + 24, 64, color)}
    <text x="${x + 56}" y="${y - 70}" class="num5" text-anchor="middle" style="font-size:46px">${esc(n)}</text>
    <text x="${x + 56}" y="${y - 28}" class="small5" text-anchor="middle" style="fill:${L.ink};font-weight:780">${esc(titleValue)}</text>
    <path d="M${x + 56} ${y + 112} v42" stroke="${L.line2}" stroke-width="2" stroke-dasharray="6 8"/>
    <circle cx="${x + 56}" cy="${y + 166}" r="6" fill="${color}"/>
    <text x="${x + 56}" y="${y + 188}" class="small5" text-anchor="middle" style="fill:${L.ink};font-weight:760">${esc(desc)}</text>
  `;
}

function agendaItem5(x, y, n, titleValue, desc, pages, color = L.blue) {
  return `
    <rect x="${x}" y="${y}" width="700" height="118" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 36}" y="${y + 28}" class="num5" style="font-size:42px;fill:${color}">${esc(n)}</text>
    <text x="${x + 118}" y="${y + 26}" class="label5">${esc(titleValue)}</text>
    <text x="${x + 118}" y="${y + 66}" class="small5">${esc(desc)}</text>
    <text x="${x + 664}" y="${y + 36}" class="small5" text-anchor="end" style="fill:${color};font-weight:900">${esc(pages)}</text>
  `;
}

function slideTitleV5(slide, index) {
  const body = `
    <text x="96" y="154" class="small5" style="fill:${L.blue};font-weight:900">BitFun / AI 软件工程报告</text>
    <text x="96" y="238" class="h15" style="font-size:78px">AI 如何重新定义软件开发</text>
    <text x="100" y="350" class="sub5">以 BitFun 为引子，理解 AI 时代的软件工程新范式</text>
    <path d="M96 426 h160" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="284" cy="426" r="6" fill="${L.orange}"/>
    <rect x="1120" y="222" width="520" height="354" rx="22" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <path d="M1190 376 C1260 300 1360 304 1428 376 S1550 452 1600 372" stroke="${L.blue}" stroke-width="6" fill="none"/>
    <path d="M1190 454 C1280 520 1388 520 1480 454 S1565 392 1610 438" stroke="${L.orange}" stroke-width="6" fill="none"/>
    ${v5Icon("terminal", 1224, 280, 78, L.blue)}
    ${v5Icon("check", 1394, 402, 78, L.orange)}
    ${v5Icon("team", 1522, 292, 78, L.blue)}
    <text x="96" y="610" class="body5">演讲者：${esc(speakerName)}</text>
    <text x="96" y="664" class="muted5">2026.05</text>
    <rect x="96" y="760" width="920" height="112" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="134" y="792" class="label5">报告定位</text>
    <text x="134" y="836" class="small5">从代码补全走向 Agentic Coding，再看软件开发全生命周期如何被 AI 改写。</text>
  `;
  return svgBaseV5(slide, index, body);
}

function slideAgendaV5(slide, index) {
  const body = `
    ${v5Header("目录 / 15 分钟", "报告目录", "四个主题串起软件工程的新变化", 72)}
    ${agendaItem5(170, 398, "01", "开场与主线", "软件工程对象正在扩大；BitFun 作为问题入口。", "03-04", L.blue)}
    ${agendaItem5(990, 398, "02", "产能与探索", "AI 让探索变快，也让变化变快。", "05", L.blue)}
    ${agendaItem5(170, 580, "03", "质量与治理", "质量责任、开源协作、大厂交付和工程护栏。", "06-08", L.orange)}
    ${agendaItem5(990, 580, "04", "角色与互动", "BitFun 缩影、开发者角色变化与 Q&A。", "09-11", L.orange)}
    <path d="M314 798 H1606" stroke="${L.blue}" stroke-width="5" stroke-linecap="round" opacity="0.86"/>
    <text x="330" y="842" class="body5">主线：</text>
    <text x="448" y="844" class="muted5">代码补全 → Agentic Coding → 全生命周期介入 → 工程治理变化 → 组织智能协作系统</text>
  `;
  return svgBaseV5(slide, index, body);
}

function slideCoverV5(slide, index) {
  const body = `
    ${v5Header("主题一 / 全局主线", "从写代码，到组织智能协作系统", "软件工程对象正在扩大", 68)}
    <text x="104" y="420" class="body5">核心不是 AI 会写多少代码，而是软件工程的对象正在扩大。</text>
    <text x="104" y="472" class="muted5">从代码、函数和文件，扩展到任务、上下文、工具、验证、反馈、人类监督和组织流程。</text>
    <path d="M180 720 C420 630 650 746 870 686 C1050 632 1226 642 1420 666" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M180 720 C420 630 650 746 870 686 C1050 632 1226 642 1420 666" stroke="${L.line2}" stroke-width="2" fill="none" opacity="0.55"/>
    ${v5Step(196, 662, "terminal", "01", "概率性生成", "AI 产出建议", L.blue)}
    ${v5Step(660, 602, "check", "02", "确定性验证", "构建 / 测试 / 评审", L.orange)}
    ${v5Step(1110, 610, "team", "03", "工程节奏", "稳定吸收变化", L.blue)}
    <rect x="1358" y="462" width="430" height="178" rx="14" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="1392" y="504" class="small5" style="fill:${L.blue};font-weight:900">报告主线</text>
    <text x="1392" y="558" class="label5">从会生成</text>
    <text x="1392" y="606" class="small5">走向可验证、可治理、可协作</text>
    ${v5Takeaway("AI 重新定义软件开发，是从“写代码”走向“组织智能协作系统”。", 918, 1280)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideShockV5(slide, index) {
  const body = `
    ${v5Header("01 / 开场案例", "xx w+ 行代码之后，问题真的变少了吗？", "AI 放大的不只是产能，也会放大速度、风险和组织方式的重分配。", 64)}
    <rect x="128" y="440" width="590" height="360" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="178" y="500" class="small5" style="fill:${L.blue};font-weight:900">开场问题</text>
    <path d="M560 540 C612 506 648 476 672 444" stroke="${L.blue}" stroke-width="6" fill="none" marker-end="url(#arrowBlue)"/>
    <text x="178" y="588" class="num5" style="font-size:68px;fill:${L.blue}">xx w+ 行代码</text>
    <path d="M190 712 H654" stroke="${L.line2}" stroke-width="3"/>
    <text x="178" y="738" class="body5">不是结论，是问题入口</text>
    <text x="178" y="772" class="muted5">成熟度、质量检查、团队共识是否跟上？</text>
    <path d="M728 620 H828" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    ${v5Card(858, 380, 380, 118, "terminal", "局部编码", "任务完成更快", "", L.blue)}
    ${v5Card(1318, 380, 380, 118, "check", "测试验证", "失败会返工", "", L.orange)}
    ${v5Card(858, 610, 380, 118, "team", "代码检视", "认知成本转移", "", L.blue)}
    ${v5Card(1318, 610, 380, 118, "loop", "问题修复", "收益被重新分配", "", L.orange)}
    <path d="M1238 439 H1300" stroke="${L.blue}" stroke-width="4" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M1238 669 H1300" stroke="${L.blue}" stroke-width="4" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M1048 510 V592" stroke="${L.line2}" stroke-width="3" stroke-dasharray="8 9"/>
    <path d="M1508 510 V592" stroke="${L.line2}" stroke-width="3" stroke-dasharray="8 9"/>
    <rect x="202" y="842" width="1508" height="82" rx="12" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="238" y="870" class="small5" style="fill:${L.blue};font-weight:900">核心判断</text>
    <text x="390" y="870" class="small5">AI 首先改变的是速度、风险和组织方式如何被重新分配。</text>
    ${v5Takeaway("不要问代码是否变多，先问验证、维护、协作和交付是否跟得上。", 946, 1260)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideExplorationV5(slide, index) {
  const body = `
    ${v5Header("02 / 探索方式", "AI 先改变探索方式", "探索可以想法驱动，但交付必须证据驱动。", 70)}
    <rect x="146" y="410" width="720" height="386" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="1054" y="410" width="720" height="386" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="210" y="474" class="small5" style="fill:${L.soft};font-weight:900">过去常见节奏</text>
    <text x="210" y="548" class="num5" style="font-size:54px">排期驱动</text>
    <text x="210" y="612" class="muted5">想法进入 backlog，等待排人、评估、实现和验收。</text>
    <path d="M240 686 H760" stroke="${L.line2}" stroke-width="4"/>
    <text x="210" y="744" class="small5">适合稳定需求，但不适合高频探索。</text>
    <text x="1118" y="474" class="small5" style="fill:${L.blue};font-weight:900">AI 介入之后</text>
    <text x="1118" y="548" class="num5" style="font-size:54px;fill:${L.blue}">想法驱动</text>
    <text x="1118" y="612" class="muted5">一个人和 Agent 可以快速做出可运行版本。</text>
    <path d="M1148 686 H1668" stroke="${L.blue}" stroke-width="4"/>
    <text x="1118" y="744" class="small5">适合原型验证，但必须回到证据。</text>
    <path d="M902 626 H1012" stroke="${L.blue}" stroke-width="6" fill="none" marker-end="url(#arrowBlue)"/>
    ${v5Card(194, 818, 360, 90, "terminal", "更快原型", "几天内可运行", "", L.blue)}
    ${v5Card(584, 818, 360, 90, "loop", "灵活变更", "低成本试错", "", L.blue)}
    ${v5Card(974, 818, 360, 90, "team", "少量配合", "个人可先探索", "", L.orange)}
    ${v5Card(1364, 818, 360, 90, "grid", "覆盖更广", "想法更容易验证", "", L.orange)}
    ${v5Takeaway("原型更快，不等于交付更稳；真实工程仍要验收、回滚和审计。", 946, 1280)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideLifecycleV5(slide, index) {
  const body = `
    ${v5Header("03 / 速度的背面", "速度放大之后，质量责任被重新定义", "代码很多，但评审、测试、追溯和长期维护不一定同步跟上。", 64)}
    <rect x="176" y="410" width="1568" height="430" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <path d="M960 410 V840" stroke="${L.line2}" stroke-width="2" stroke-dasharray="10 10"/>
    <path d="M176 625 H1744" stroke="${L.line2}" stroke-width="2" stroke-dasharray="10 10"/>
    ${v5Icon("check", 250, 470, 68, L.blue)}
    <text x="350" y="492" class="label5">功能能跑</text>
    <text x="350" y="540" class="small5">但边界、异常路径和验收标准不一定稳定</text>
    ${v5Icon("file", 1030, 470, 68, L.blue)}
    <text x="1130" y="492" class="label5">设计不沉淀</text>
    <text x="1130" y="540" class="small5">需求变化更快，决策记录更容易缺失</text>
    ${v5Icon("team", 250, 690, 68, L.orange)}
    <text x="350" y="712" class="label5">协作被压缩</text>
    <text x="350" y="760" class="small5">一个人加 Agent 很快，但团队共识可能不足</text>
    ${v5Icon("loop", 1030, 690, 68, L.orange)}
    <text x="1130" y="712" class="label5">修复凭自信</text>
    <text x="1130" y="760" class="small5">Agent 能修问题，但必须回到可验证证据</text>
    <rect x="440" y="850" width="1040" height="82" rx="12" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="486" y="878" class="body5" style="font-size:28px;fill:${L.blue};font-weight:900">工程确定性</text>
    <text x="700" y="878" class="body5" style="font-size:28px;fill:${L.ink2};font-weight:760">生成过程可以探索，放行依据必须可复现、可审查、可回滚。</text>
    ${v5Takeaway("AI 把“能不能写出来”的问题，推向“谁负责、凭什么放行”。", 946, 1260)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideQualityV5(slide, index) {
  const body = `
    ${v5Header("04 / 质量责任", "高质量不是一个标准", "开源强调公共责任，大厂强调复杂组织交付责任。", 70)}
    <circle cx="960" cy="610" r="150" fill="${L.paper}" stroke="${L.blue}" stroke-width="5" filter="url(#paperShadow)"/>
    <text x="960" y="548" class="body5" text-anchor="middle" style="font-size:36px">可验证责任</text>
    <text x="960" y="606" class="muted5" text-anchor="middle">谁负责</text>
    <text x="960" y="652" class="muted5" text-anchor="middle">用什么证据确认</text>
    <path d="M308 612 C505 465 720 480 830 590" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M1612 612 C1415 465 1200 480 1090 590" stroke="${L.orange}" stroke-width="5" fill="none"/>
    ${v5Card(190, 472, 430, 122, "file", "开源高质量协作", "开发者对提交负责", "", L.blue)}
    ${v5Card(190, 646, 430, 122, "team", "代码归属", "负责人 / 必过检查", "", L.blue)}
    ${v5Card(1300, 472, 430, 122, "grid", "大厂复杂交付", "组织对系统连续性负责", "", L.orange)}
    ${v5Card(1300, 646, 430, 122, "loop", "服务目标 / 回滚", "灰度 / 追踪 / 预算", "", L.orange)}
    <text x="440" y="830" class="body5">通过单测只是起点，离“可合并、可发布、可长期维护”仍有距离。</text>
    ${v5Takeaway("关键不是多跑测试，而是责任链和证据链。", 936, 1000)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideResponsesV5(slide, index) {
  const body = `
    ${v5Header("05 / 成熟补法", "让快速变化进入工程护栏", "用代码检视、架构稳定性、性能看护和发布控制接住 AI 产出。", 66)}
    <path d="M300 668 H1620" stroke="${L.line2}" stroke-width="4"/>
    <path d="M300 668 H1620" stroke="${L.blue}" stroke-width="5" stroke-linecap="round" opacity="0.82"/>
    ${v5Card(120, 460, 390, 136, "team", "代码检视", "负责人 / 检查", "", L.blue)}
    ${v5Card(550, 460, 390, 136, "cube", "架构稳定性", "设计记录 / 边界检查", "", L.blue)}
    ${v5Card(980, 460, 390, 136, "server", "性能看护", "基准测试 / 追踪", "", L.orange)}
    ${v5Card(1410, 460, 390, 136, "shield", "发布控制", "灰度 / 回滚", "", L.orange)}
    <rect x="190" y="724" width="1540" height="136" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="240" y="776" class="label5">共同目标：把“模型说完成”变成“工程证据可放行”</text>
    <text x="240" y="818" class="small5">生成过程可以概率化；合并、发布和线上运行必须依赖可复现、可比较、可审计的确定性验证。</text>
    ${v5Takeaway("AI 时代不是少做工程，而是把工程约束重新设计给 Agent。", 946, 1280)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideBitfunV5(slide, index) {
  const body = `
    ${v5Header("06 / BitFun 缩影", "BitFun 的价值：四个问题", "不是项目细节，而是把 AI 开发组织成闭环。", 70)}
    <circle cx="960" cy="610" r="212" fill="${L.paper}" stroke="${L.line2}" stroke-width="3" filter="url(#paperShadow)"/>
    <path d="M960 398 A212 212 0 0 1 1172 610" stroke="${L.blue}" stroke-width="8" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M1172 610 A212 212 0 0 1 960 822" stroke="${L.blue}" stroke-width="8" fill="none"/>
    <path d="M960 822 A212 212 0 0 1 748 610" stroke="${L.orange}" stroke-width="8" fill="none"/>
    <path d="M748 610 A212 212 0 0 1 960 398" stroke="${L.orange}" stroke-width="8" fill="none"/>
    <text x="960" y="550" class="body5" text-anchor="middle" style="font-size:44px">开发过程</text>
    <text x="960" y="620" class="body5" text-anchor="middle" style="font-size:44px">产品化</text>
    ${v5Card(225, 430, 430, 122, "loop", "自迭代", "失败沉淀成下一版工作流", "", L.orange)}
    ${v5Card(680, 318, 430, 122, "file", "计划", "先探索和计划，再实现", "", L.blue)}
    ${v5Card(1260, 520, 430, 122, "check", "证据", "调试先取证，不凭自信", "", L.blue)}
    ${v5Card(690, 790, 430, 122, "team", "评审", "执行者、审查者、仲裁者分离", "", L.orange)}
    ${v5Takeaway("AI 工具的未来形态不是更会聊天，而是组织可治理的开发闭环。", 940, 1300)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideRoleV5(slide, index) {
  const body = `
    ${v5Header("07 / 角色变化", "从会写代码，到会组织智能协作系统", "未来优秀的软件人才，会设计人与 AI Agent 共同工作的工程系统。", 64)}
    <path d="M230 768 L230 692 L520 692 L520 616 L810 616 L810 540 L1100 540 L1100 464 L1390 464 L1390 388" stroke="${L.line2}" stroke-width="6" fill="none"/>
    <path d="M230 768 L230 692 L520 692 L520 616 L810 616 L810 540 L1100 540 L1100 464 L1390 464 L1390 388" stroke="${L.blue}" stroke-width="4" fill="none" marker-end="url(#arrowBlue)"/>
    ${roleStep5(230, 768, "01", "写代码", "理解语言、框架和系统行为", L.soft)}
    ${roleStep5(520, 692, "02", "定义任务", "把模糊需求变成可执行问题", L.blue)}
    ${roleStep5(810, 616, "03", "组织上下文", "让 Agent 看见正确事实", L.blue)}
    ${roleStep5(1100, 540, "04", "设计验证闭环", "测试、评审、指标、追踪", L.orange)}
    ${roleStep5(1390, 464, "05", "治理协作系统", "权限、责任、回滚、复盘", L.orange)}
    <rect x="250" y="826" width="1420" height="78" rx="12" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M292 848 v34" stroke="${L.blue}" stroke-width="7" stroke-linecap="round"/>
    <text x="330" y="848" class="body5" style="font-size:30px;fill:${L.blue};font-weight:900">评价从“代码能跑”扩展到“定义问题、验证结果、解释风险”。</text>
    ${v5Takeaway("未来优秀的软件人才，是会设计人与 AI Agent 共同工作的工程系统的人。", 938, 1320)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideThanksV5(slide, index) {
  const body = `
    <text x="96" y="142" class="small5" style="fill:${L.blue};font-weight:900">THANKS / Q&amp;A</text>
    <text x="96" y="238" class="h15" style="font-size:86px">谢谢</text>
    <text x="100" y="356" class="sub5">答疑互动：AI 编程、工程治理、开发者角色</text>
    <path d="M96 430 h144" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="270" cy="430" r="6" fill="${L.orange}"/>
    <rect x="170" y="522" width="1580" height="360" rx="22" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="240" y="586" class="label5">留给讨论的三个问题</text>
    <text x="240" y="650" class="body5" style="font-size:30px">1. AI 完成大部分编程作业后，软件工程课训练什么？</text>
    <text x="240" y="724" class="body5" style="font-size:30px">2. 个人产能接近小团队后，质量责任如何重新设计？</text>
    <text x="240" y="798" class="body5" style="font-size:30px">3. 开源与大厂场景下，哪些决策必须由人负责？</text>
    <rect x="1070" y="238" width="490" height="190" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="1124" y="286" class="num5" style="font-size:54px;fill:${L.blue}">Q&amp;A</text>
    <text x="1128" y="354" class="small5">答疑互动环节</text>
    ${v5Icon("chat", 1430, 292, 86, L.blue)}
    ${v5Takeaway("AI 编程、工程治理、开发者角色", 914, 980)}
  `;
  return svgBaseV5(slide, index, body);
}

function v02Lines(lines, x, y, size = 24, fill = L.muted, gap = 34, weight = 680, anchor = "start") {
  return lines
    .map((line, i) => {
      const ax = anchor === "middle" ? ` text-anchor="middle"` : anchor === "end" ? ` text-anchor="end"` : "";
      return `<text x="${x}" y="${y + i * gap}" class="small5"${ax} style="font-size:${size}px;fill:${fill};font-weight:${weight}">${esc(line)}</text>`;
    })
    .join("");
}

function v02MiniLabel(x, y, textValue, color = L.blue) {
  return `
    <rect x="${x}" y="${y}" width="${textValue.length * 25 + 56}" height="42" rx="21" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <circle cx="${x + 24}" cy="${y + 21}" r="5.5" fill="${color}"/>
    <text x="${x + 44}" y="${y + 10}" class="micro5" style="fill:${L.ink};font-size:20px">${esc(textValue)}</text>
  `;
}

function v02Panel(x, y, w, h, icon, titleValue, lines, color = L.blue, kicker = "") {
  const titleY = kicker ? y + 58 : y + 34;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${kicker ? `<text x="${x + 34}" y="${y + 24}" class="micro5" style="fill:${color};font-size:19px;font-weight:900">${esc(kicker)}</text>` : ""}
    ${v5Icon(icon, x + 34, titleY - 8, 58, color)}
    <text x="${x + 112}" y="${titleY}" class="label5" style="font-size:30px">${esc(titleValue)}</text>
    ${v02Lines(lines, x + 112, titleY + 48, 23, L.muted, 32, 640)}
  `;
}

function sourceQuoteCardV06(x, y, w, h, source, layer, quote, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 34}" y="${y + 28}" class="micro5" style="fill:${color};font-size:19px;font-weight:900">${esc(layer)}</text>
    <text x="${x + 34}" y="${y + 66}" class="label5" style="font-size:29px;fill:${L.ink}">${esc(source)}</text>
    ${v5Icon(icon, x + w - 98, y + 38, 58, color)}
    <path d="M${x + 34} ${y + 124} H${x + w - 34}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.76"/>
    <text x="${x + 34}" y="${y + 154}" class="num5" style="font-size:36px;fill:${color}">${esc(quote)}</text>
    ${v02Lines(lines, x + 40, y + 224, 23, L.muted, 34, w - 80)}
  `;
}

function sourceSignalCardV07(x, y, w, h, source, tag, claim, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 30}" y="${y + 30}" class="micro5" style="fill:${color};font-size:18px;font-weight:900">${esc(tag)}</text>
    <text x="${x + 30}" y="${y + 68}" class="label5" style="font-size:25px;fill:${L.ink}">${esc(source)}</text>
    ${v5Icon(icon, x + w - 78, y + 30, 46, color)}
    <path d="M${x + 30} ${y + 98} H${x + w - 30}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" opacity="0.72"/>
    <text x="${x + 30}" y="${y + 126}" class="body5" style="font-size:26px;fill:${color};font-weight:900">${esc(claim)}</text>
    ${v02Lines(lines, x + 30, y + 158, 19, L.muted, 23, 760)}
  `;
}

function collabCardV02(x, y, n, titleValue, kicker, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="340" height="236" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 34}" y="${y + 36}" class="num5" style="font-size:42px;fill:${color}">${esc(n)}</text>
    <text x="${x + 118}" y="${y + 26}" class="label5" style="font-size:31px">${esc(titleValue)}</text>
    <text x="${x + 118}" y="${y + 70}" class="small5" style="font-size:20px;fill:${color};font-weight:900">${esc(kicker)}</text>
    ${v5Icon(icon, x + 34, y + 104, 62, color)}
    ${v02Lines(lines, x + 118, y + 126, 22, L.muted, 32, 540)}
  `;
}

function shiftChipV02(x, y, titleValue, desc) {
  return `
    <rect x="${x}" y="${y}" width="210" height="78" rx="14" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <text x="${x + 105}" y="${y + 18}" class="label5" text-anchor="middle" style="font-size:26px;fill:${L.blue}">${esc(titleValue)}</text>
    <text x="${x + 105}" y="${y + 52}" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.ink};font-weight:830">${esc(desc)}</text>
  `;
}

function workflowStepV02(x, y, n, titleValue, kicker, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="500" height="194" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 30}" y="${y + 34}" class="num5" style="font-size:39px;fill:${color}">${esc(n)}</text>
    <text x="${x + 112}" y="${y + 31}" class="label5" style="font-size:29px">${esc(titleValue)}</text>
    <text x="${x + 112}" y="${y + 75}" class="small5" style="font-size:21px;fill:${color};font-weight:900">${esc(kicker)}</text>
    ${v5Icon(icon, x + 394, y + 38, 58, color)}
    ${v02Lines(lines, x + 112, y + 116, 22, L.muted, 31, 620)}
  `;
}

function v02SignalCard(x, y, w, h, n, titleValue, lines, color = L.blue) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 34}" y="${y + 24}" class="num5" style="font-size:42px;fill:${color}">${esc(n)}</text>
    <text x="${x + 110}" y="${y + 30}" class="label5" style="font-size:29px">${esc(titleValue)}</text>
    ${v02Lines(lines, x + 110, y + 76, 22, L.muted, 30, 640)}
  `;
}

function velocityQualityWatermarkV07(x, y, options = {}) {
  const scale = options.scale ?? 1;
  const opacity = options.opacity ?? 0.42;
  const labelSize = 19 * scale;
  const w = 540 * scale;
  const h = 260 * scale;
  const x0 = x + 72 * scale;
  const y0 = y + h - 36 * scale;
  const top = y + 42 * scale;
  const right = x + w - 26 * scale;
  const bottom = y0;
  const guarded = `M${x0 + 12 * scale} ${bottom - 62 * scale} C${x0 + 112 * scale} ${bottom - 112 * scale} ${x0 + 224 * scale} ${top + 58 * scale} ${x0 + 342 * scale} ${top + 50 * scale} C${x0 + 410 * scale} ${top + 46 * scale} ${x0 + 452 * scale} ${top + 54 * scale} ${right - 10 * scale} ${top + 34 * scale}`;
  const uncontrolled = `M${x0 + 12 * scale} ${top + 62 * scale} C${x0 + 120 * scale} ${top + 60 * scale} ${x0 + 226 * scale} ${top + 94 * scale} ${x0 + 326 * scale} ${top + 140 * scale} C${x0 + 390 * scale} ${top + 170 * scale} ${x0 + 438 * scale} ${top + 188 * scale} ${right - 8 * scale} ${bottom - 26 * scale}`;
  return `
    <g opacity="${opacity}">
      <path d="M${x0} ${bottom} H${right}" stroke="${L.line2}" stroke-width="${2.4 * scale}" fill="none" stroke-linecap="round"/>
      <path d="M${x0} ${bottom} V${top}" stroke="${L.line2}" stroke-width="${2.4 * scale}" fill="none" stroke-linecap="round"/>
      <text x="${x0 - 16 * scale}" y="${top - 18 * scale}" class="small5" text-anchor="end" style="font-size:${labelSize}px;fill:${L.orange};font-weight:900">质量</text>
      <text x="${right}" y="${bottom + 28 * scale}" class="small5" text-anchor="end" style="font-size:${labelSize}px;fill:${L.blue};font-weight:900">速度</text>
      <path d="${guarded}" stroke="${L.blue}" stroke-width="${4.8 * scale}" fill="none" stroke-linecap="round"/>
      <path d="${uncontrolled}" stroke="${L.orange}" stroke-width="${4.2 * scale}" fill="none" stroke-linecap="round"/>
      <circle cx="${x0 + 342 * scale}" cy="${top + 50 * scale}" r="${5.5 * scale}" fill="${L.blue}"/>
      <circle cx="${x0 + 326 * scale}" cy="${top + 140 * scale}" r="${5.5 * scale}" fill="${L.orange}"/>
    </g>
  `;
}

function slideTitleV02(slide, index) {
  const body = `
    <text x="96" y="154" class="small5" style="fill:${L.blue};font-weight:900">BitFun / AI 软件工程报告</text>
    <text x="96" y="240" class="h15" style="font-size:82px">${esc(slide.title)}</text>
    <text x="100" y="360" class="sub5">${esc(slide.subtitle)}</text>
    <path d="M96 436 h164" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="288" cy="436" r="6" fill="${L.orange}"/>
    <rect x="86" y="604" width="460" height="190" rx="18" fill="${L.bg}" opacity="0.96"/>
    <rect x="112" y="638" width="7" height="112" rx="3.5" fill="${L.blue}"/>
    <text x="154" y="628" class="body5" style="font-size:34px;fill:${L.ink};font-weight:900">${esc(speakerName)}</text>
    <text x="154" y="684" class="body5" style="font-size:29px;fill:${L.ink};font-weight:820">${esc(speakerOrg)}</text>
    <text x="154" y="740" class="muted5" style="font-size:26px">2026.05</text>
  `;
  return svgBaseV5(slide, index, body);
}

function slideAgendaV02(slide, index) {
  const body = `
    <text x="96" y="150" class="small5" style="fill:${L.blue};font-weight:900">目录</text>
    <path d="M96 220 h126" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="246" cy="220" r="6" fill="${L.orange}"/>
    <path d="M178 346 V810" stroke="${L.line2}" stroke-width="3" stroke-dasharray="8 12"/>
    ${agendaItemV09(220, 300, "01", "现实观察", "从 BitFun 产能跃迁看速度与质量压力。", "03")}
    ${agendaItemV09(286, 430, "02", "研究共识", "行业研究指向 Agent 工程化与系统承接。", "04")}
    ${agendaItemV09(220, 560, "03", "工程治理", "用控制面、判断上下文与门禁承接速度。", "05-08")}
    ${agendaItemV09(286, 690, "04", "能力演进", "质量协议、团队职责与个人判断升级。", "09-12")}
  `;
  return svgBaseV5(slide, index, body);
}

function agendaItemV09(x, y, n, titleValue, desc, pages) {
  return `
    <rect x="${x}" y="${y}" width="850" height="108" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 36}" y="${y + 24}" class="num5" style="font-size:40px;fill:${L.blue}">${esc(n)}</text>
    <text x="${x + 116}" y="${y + 24}" class="label5" style="font-size:29px">${esc(titleValue)}</text>
    <text x="${x + 116}" y="${y + 64}" class="small5" style="font-size:21px">${esc(desc)}</text>
    <text x="${x + 804}" y="${y + 34}" class="small5" text-anchor="end" style="fill:${L.blue};font-weight:900">${esc(pages)}</text>
  `;
}

function slideShockV02(slide, index) {
  const body = `
    ${v5Header("01 / 现实观察", slide.title, slide.subtitle, 60)}
    ${shockLogicCardV09(110, 400, "01", "事实", "产能跃迁已经发生", ["BitFun 单月 10W+ 行代码", "241 commits", "+185,533 / -46,479"], L.blue, "grid")}
    <path d="M622 580 H700" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${shockLogicCardV09(720, 400, "02", "速度来源", "反馈周期被压缩", ["想法到原型：更快试错", "原型到 PR：更快进仓", "PR 到反馈：更早暴露问题"], L.blue, "terminal")}
    <path d="M1232 580 H1310" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${shockLogicCardV09(1330, 400, "03", "质量影响", "压力转向承接系统", ["评审与构建压力上升", "上下文理解更重要", "维护与回滚成本更显性"], L.orange, "check")}
    ${v02Takeaway("AI 放大的不是键盘速度，而是从想法到反馈的回路；质量要靠验证、评审和维护承接。", 1520)}
  `;
  return svgBaseV5(slide, index, body);
}

function shockLogicCardV09(x, y, n, label, titleValue, lines, color, icon) {
  const bullets = lines.map((line, i) => {
    const yy = y + 232 + i * 44;
    return `
      <circle cx="${x + 58}" cy="${yy + 12}" r="7" fill="${color}" opacity="0.86"/>
      <text x="${x + 84}" y="${yy}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:850">${esc(line)}</text>
    `;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="480" height="380" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 70}" cy="${y + 72}" r="42" fill="${color}" opacity="0.10"/>
    ${v5Icon(icon, x + 44, y + 46, 52, color)}
    <text x="${x + 142}" y="${y + 42}" class="num5" style="font-size:36px;fill:${color}">${esc(n)}</text>
    <text x="${x + 208}" y="${y + 48}" class="small5" style="font-size:24px;fill:${color};font-weight:900">${esc(label)}</text>
    <text x="${x + 52}" y="${y + 142}" class="num5" style="font-size:34px;fill:${L.ink}">${esc(titleValue)}</text>
    <path d="M${x + 52} ${y + 192} H${x + 428}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.62"/>
    ${bullets}
  `;
}

function repoStatsCaptureV05(x, y) {
  return `
    <rect x="${x}" y="${y}" width="700" height="224" rx="18" fill="#111827" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="${x}" y="${y}" width="700" height="38" rx="18" fill="#1F2937"/>
    <circle cx="${x + 30}" cy="${y + 20}" r="6" fill="#EF4444"/>
    <circle cx="${x + 52}" cy="${y + 20}" r="6" fill="#F59E0B"/>
    <circle cx="${x + 74}" cy="${y + 20}" r="6" fill="#22C55E"/>
    <text x="${x + 104}" y="${y + 11}" class="small5" style="font-size:17px;fill:#D1D5DB;font-weight:900">${esc(bitfunStats.repo)} · git history snapshot</text>
    <text x="${x + 34}" y="${y + 56}" class="micro5" style="font-size:18px;fill:#93C5FD">${esc(bitfunStats.url)}</text>
    <text x="${x + 34}" y="${y + 88}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:850">range: ${esc(bitfunStats.range)}   ref: ${esc(bitfunStats.ref)}</text>
    <text x="${x + 34}" y="${y + 120}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:850">author: ${esc(bitfunStats.author)}</text>
    <text x="${x + 34}" y="${y + 170}" class="num5" style="font-size:36px;fill:#60A5FA">${esc(bitfunStats.commits)}</text>
    <text x="${x + 116}" y="${y + 172}" class="small5" style="font-size:18px;fill:#D1D5DB">commits</text>
    <text x="${x + 242}" y="${y + 170}" class="num5" style="font-size:36px;fill:#34D399">+${esc(bitfunStats.additions)}</text>
    <text x="${x + 438}" y="${y + 172}" class="small5" style="font-size:18px;fill:#D1D5DB">insertions</text>
    <text x="${x + 34}" y="${y + 202}" class="small5" style="font-size:18px;fill:#FCA5A5">-${esc(bitfunStats.deletions)} deletions</text>
    <text x="${x + 242}" y="${y + 202}" class="small5" style="font-size:18px;fill:#D1D5DB">churn: ${esc(bitfunStats.churn)} lines</text>
  `;
}

function miniFlowV05(x, y, a, b, c, d) {
  const items = [
    [x, a, L.blue],
    [x + 220, b, L.blue],
    [x + 460, c, L.orange],
    [x + 700, d, L.orange],
  ];
  const nodes = items.map(([nx, label, color], i) => `
    <circle cx="${nx}" cy="${y}" r="13" fill="${color}"/>
    <circle cx="${nx}" cy="${y}" r="27" fill="${color}" opacity="0.10"/>
    <text x="${nx}" y="${y + 44}" class="small5" text-anchor="middle" style="font-size:${i === 0 ? 20 : 21}px;fill:${L.ink};font-weight:900">${esc(label)}</text>
  `).join("");
  return `
    <path d="M${x} ${y} H${x + 700}" stroke="${L.line2}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x} ${y} H${x + 700}" stroke="${L.blue}" stroke-width="4" stroke-linecap="round" opacity="0.55" marker-end="url(#arrowBlue)"/>
    ${nodes}
  `;
}

function feedbackGridV08(x, y) {
  const items = [
    [x, y, "想法 / Issue", "入口更清楚"],
    [x + 430, y, "隔离执行", "探索不扰动主线"],
    [x, y + 72, "原型 / PR", "产出更快进入审查"],
    [x + 430, y + 72, "验证与评审", "证据决定能否继续"],
  ];
  return items.map(([ix, iy, titleValue, desc]) => `
    <g>
      <circle cx="${ix + 20}" cy="${iy + 20}" r="11" fill="${L.blue}"/>
      <circle cx="${ix + 20}" cy="${iy + 20}" r="24" fill="${L.blue}" opacity="0.10"/>
      <text x="${ix + 58}" y="${iy + 2}" class="small5" style="font-size:25px;fill:${L.ink};font-weight:900">${esc(titleValue)}</text>
      <text x="${ix + 58}" y="${iy + 36}" class="small5" style="font-size:18px;fill:${L.muted};font-weight:820">${esc(desc)}</text>
    </g>
  `).join("");
}

function speedQualityColumnV08(x, y, titleValue, lines, color) {
  const bullets = lines.map((line, i) => {
    const yy = y + 46 + i * 38;
    return `
      <circle cx="${x + 18}" cy="${yy + 11}" r="8" fill="${color}" opacity="0.92"/>
      <text x="${x + 44}" y="${yy}" class="small5" style="font-size:21px;fill:${L.ink};font-weight:880">${esc(line)}</text>
    `;
  }).join("");
  return `
    <g>
      <text x="${x}" y="${y}" class="num5" style="font-size:27px;fill:${color}">${esc(titleValue)}</text>
      <path d="M${x} ${y + 32} H${x + 374}" stroke="${color}" stroke-width="3.5" stroke-linecap="round" opacity="0.62"/>
      ${bullets}
    </g>
  `;
}

function slideCoverV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 64)}
    <text x="132" y="358" class="small5" style="font-size:23px;fill:${L.blue};font-weight:900">它不是额外文档，而是每个 AI 变更随 PR 附带的最小审查材料。</text>
    ${evidenceFieldV09(132, 438, "01", "为什么改", "任务 / 需求、目标、非目标、验收标准", L.blue, "file")}
    ${evidenceFieldV09(132, 548, "02", "改了什么", "变更摘要、影响路径、责任人与依赖", L.blue, "terminal")}
    ${evidenceFieldV09(132, 658, "03", "怎么验证", "测试、持续集成、执行轨迹与修复结果", L.blue, "check")}
    ${evidenceFieldV09(132, 768, "04", "风险如何退", "未决风险、回滚方式、复盘入口", L.blue, "shield")}
    <path d="M806 612 C850 586 900 586 944 612" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${evidenceCaptureV05(986, 472)}
    ${v02Takeaway("PR 判断上下文的价值：把“我觉得能合”，变成“基于这些事实可以合”。", 1500)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideReviewEfficiencyV09(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 58)}
    <text x="128" y="360" class="small5" style="font-size:23px;fill:${L.blue};font-weight:900">先把“可审查性”做实，再衡量端到端效率。</text>

    ${reviewSpeedPanelV09(110, 420)}
    <path d="M570 596 H622" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)" opacity="0.86"/>
    ${reviewContextPanelV09(650, 420)}
    <path d="M1298 596 H1350" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)" opacity="0.86"/>
    ${reviewEfficiencyPanelV09(1378, 420)}

    ${v02Takeaway("代码写得快是入口；判断依据清楚、评审等待下降、返工闭环变短，才是交付变快。", 1500)}
  `;
  return svgBaseV5(slide, index, body);
}

function reviewSpeedPanelV09(x, y) {
  return `
    <rect x="${x}" y="${y}" width="440" height="360" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 76}" cy="${y + 74}" r="42" fill="${L.blue}" opacity="0.10"/>
    ${v5Icon("grid", x + 50, y + 48, 52, L.blue)}
    <text x="${x + 142}" y="${y + 44}" class="small5" style="font-size:24px;fill:${L.blue};font-weight:900">01 / 局部速度</text>
    <text x="${x + 54}" y="${y + 132}" class="num5" style="font-size:34px;fill:${L.ink}">更快进入评审</text>
    <path d="M${x + 54} ${y + 184} H${x + 386}" stroke="${L.blue}" stroke-width="4" stroke-linecap="round" opacity="0.58"/>
    ${reviewBulletV09(x + 56, y + 226, "想法到原型更短", L.blue)}
    ${reviewBulletV09(x + 56, y + 274, "代码生成更快", L.blue)}
    ${reviewBulletV09(x + 56, y + 322, "提交反馈更早", L.blue)}
  `;
}

function reviewContextPanelV09(x, y) {
  return `
    <rect x="${x}" y="${y}" width="628" height="360" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 72}" cy="${y + 74}" r="42" fill="${L.blue}" opacity="0.10"/>
    ${v5Icon("file", x + 46, y + 48, 52, L.blue)}
    <text x="${x + 138}" y="${y + 44}" class="small5" style="font-size:24px;fill:${L.blue};font-weight:900">02 / 变更判断上下文</text>
    <text x="${x + 54}" y="${y + 132}" class="num5" style="font-size:34px;fill:${L.ink}">减少评审猜测</text>
    <path d="M${x + 54} ${y + 184} H${x + 574}" stroke="${L.blue}" stroke-width="4" stroke-linecap="round" opacity="0.58"/>
    ${reviewContextLineV09(x + 58, y + 214, "为什么改", "目标 / 非目标 / 验收", L.blue)}
    ${reviewContextLineV09(x + 58, y + 254, "改了什么", "影响路径 / 责任依赖", L.blue)}
    ${reviewContextLineV09(x + 58, y + 294, "怎么验证", "测试结果 / 执行轨迹", L.blue)}
    ${reviewContextLineV09(x + 58, y + 334, "风险如何退", "风险标记 / 回滚路径", L.blue)}
  `;
}

function reviewEfficiencyPanelV09(x, y) {
  return `
    <rect x="${x}" y="${y}" width="430" height="360" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 76}" cy="${y + 74}" r="42" fill="${L.blue}" opacity="0.10"/>
    ${v5Icon("loop", x + 50, y + 48, 52, L.blue)}
    <text x="${x + 142}" y="${y + 44}" class="small5" style="font-size:24px;fill:${L.blue};font-weight:900">03 / 整体效率</text>
    <text x="${x + 54}" y="${y + 132}" class="num5" style="font-size:34px;fill:${L.ink}">端到端周期缩短</text>
    <path d="M${x + 54} ${y + 184} H${x + 376}" stroke="${L.blue}" stroke-width="4" stroke-linecap="round" opacity="0.58"/>
    ${reviewBulletV09(x + 56, y + 226, "评审等待下降", L.blue)}
    ${reviewBulletV09(x + 56, y + 274, "返工闭环变短", L.blue)}
    ${reviewBulletV09(x + 56, y + 322, "构建与恢复更稳", L.blue)}
  `;
}

function reviewBulletV09(x, y, textValue, color) {
  return `
    <circle cx="${x}" cy="${y + 12}" r="7" fill="${color}" opacity="0.86"/>
    <text x="${x + 28}" y="${y}" class="small5" style="font-size:25px;fill:${L.ink};font-weight:860">${esc(textValue)}</text>
  `;
}

function reviewContextLineV09(x, y, label, desc, color) {
  return `
    <circle cx="${x}" cy="${y + 10}" r="6.5" fill="${color}" opacity="0.86"/>
    <text x="${x + 26}" y="${y - 2}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:900">${esc(label)}</text>
    <text x="${x + 188}" y="${y - 1}" class="small5" style="font-size:21px;fill:${L.muted};font-weight:800">${esc(desc)}</text>
  `;
}

function evidenceFieldV09(x, y, n, titleValue, desc, color, icon) {
  return `
    <rect x="${x - 16}" y="${y - 36}" width="704" height="86" rx="14" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${v5Icon(icon, x + 18, y - 16, 42, color)}
    <text x="${x + 84}" y="${y - 20}" class="num5" style="font-size:27px;fill:${color}">${esc(n)}</text>
    <text x="${x + 138}" y="${y - 18}" class="label5" style="font-size:26px">${esc(titleValue)}</text>
    <text x="${x + 138}" y="${y + 20}" class="small5" style="font-size:19px;fill:${L.muted};font-weight:760">${esc(desc)}</text>
  `;
}

function collabRowV05(x, y, n, titleValue, desc, color, icon) {
  return `
    <rect x="${x - 16}" y="${y - 50}" width="704" height="104" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${v5Icon(icon, x + 18, y - 27, 54, color)}
    <text x="${x + 84}" y="${y - 28}" class="num5" style="font-size:30px;fill:${color}">${esc(n)}</text>
    <text x="${x + 140}" y="${y - 28}" class="label5" style="font-size:28px">${esc(titleValue)}</text>
    <text x="${x + 140}" y="${y + 22}" class="small5" style="font-size:19px;fill:${L.muted};font-weight:720">${esc(desc)}</text>
  `;
}

function evidenceCaptureV05(x, y) {
  return `
    <rect x="${x}" y="${y}" width="690" height="286" rx="18" fill="#111827" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="${x}" y="${y}" width="690" height="40" rx="18" fill="#1F2937"/>
    <circle cx="${x + 30}" cy="${y + 21}" r="6" fill="#EF4444"/>
    <circle cx="${x + 52}" cy="${y + 21}" r="6" fill="#F59E0B"/>
    <circle cx="${x + 74}" cy="${y + 21}" r="6" fill="#22C55E"/>
    <text x="${x + 104}" y="${y + 11}" class="small5" style="font-size:17px;fill:#D1D5DB;font-weight:900">PR 判断上下文 · 自动生成审查材料</text>
    <text x="${x + 34}" y="${y + 66}" class="micro5" style="font-size:18px;fill:#93C5FD">目标 / 非目标 / 验收标准</text>
    <text x="${x + 34}" y="${y + 96}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:820">为什么改：任务范围、预期行为、已知边界</text>
    <text x="${x + 34}" y="${y + 132}" class="micro5" style="font-size:18px;fill:#93C5FD">变更 / 执行轨迹 / 检查结果</text>
    <text x="${x + 34}" y="${y + 162}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:820">改了什么：影响路径、工具调用、失败尝试</text>
    <text x="${x + 34}" y="${y + 196}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:820">如何验证：检查、测试、风险标记、回滚路径</text>
    <text x="${x + 34}" y="${y + 230}" class="small5" style="font-size:18px;fill:#E5E7EB;font-weight:820">谁来判断：评审者、未决风险、下一关门禁</text>
    <rect x="${x + 34}" y="${y + 252}" width="332" height="26" rx="13" fill="#064E3B"/>
    <text x="${x + 54}" y="${y + 258}" class="micro5" style="font-size:16px;fill:#BBF7D0;font-weight:900">先给判断依据，再请求评审放行</text>
  `;
}

function collabLaneV02(x, y, n, titleValue, kicker, humanText, evidenceText, color, icon) {
  return `
    <text x="${x}" y="${y}" class="num5" style="font-size:42px;fill:${color}">${esc(n)}</text>
    <text x="${x + 88}" y="${y + 4}" class="label5" style="font-size:31px">${esc(titleValue)}</text>
    <text x="${x + 88}" y="${y + 50}" class="small5" style="font-size:20px;fill:${color};font-weight:900">${esc(kicker)}</text>
    ${v5Icon(icon, x + 6, y + 126, 64, color)}
    <text x="${x + 88}" y="${y + 124}" class="small5" style="font-size:24px;fill:${L.ink};font-weight:860">${esc(humanText)}</text>
    <text x="${x + 88}" y="${y + 164}" class="small5" style="font-size:24px;fill:${L.muted};font-weight:720">${esc(evidenceText)}</text>
  `;
}

function slideSdlcShiftV05(slide, index) {
  const body = `
    ${v5Header("01 / 模式变化", "从传统 SDLC 到人 + Agent SDLC", "角色没有消失，交付件发生变化：从人交接文档，转向人、Agent、平台共同维护证据。", 58)}
    <text x="126" y="402" class="small5" style="font-size:23px;fill:${L.blue};font-weight:900">同一条生命周期，AI 改变的是每个阶段的交付件和判断依据</text>
    ${sdlcColumnV05(108, 458, "产品", "PRD / 验收", "目标、边界、场景", "需求更结构化", L.blue)}
    ${sdlcColumnV05(456, 458, "设计", "交互 / API", "约束、ADR、例外", "规则更显性", L.blue)}
    ${sdlcColumnV05(804, 458, "开发", "Code / PR", "计划、diff、trace", "过程可回放", L.orange)}
    ${sdlcColumnV05(1152, 458, "测试", "用例 / 报告", "CI、Eval、风险", "证据更连续", L.orange)}
    ${sdlcColumnV05(1500, 458, "运维", "发布 / 监控", "回滚、复盘、学习", "反馈进系统", L.blue)}
    <path d="M408 586 H438 M756 586 H786 M1104 586 H1134 M1452 586 H1482" stroke="${L.blue}" stroke-width="4" fill="none" marker-end="url(#arrowBlue)" opacity="0.75"/>
    <path d="M250 838 C520 890 830 872 960 840 S1398 798 1650 846" stroke="${L.orange}" stroke-width="4" fill="none" marker-end="url(#arrowGray)" opacity="0.30"/>
    ${v02Takeaway("核心变化：从“人交接文档”转向 Agent 可执行、人可判断、平台可验证的证据。", 1500)}
  `;
  return svgBaseV5(slide, index, body);
}

function sdlcColumnV05(x, y, stage, before, after, diff, color) {
  return `
    <rect x="${x}" y="${y}" width="312" height="336" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 156}" y="${y + 28}" class="label5" text-anchor="middle" style="font-size:32px">${esc(stage)}</text>
    <path d="M${x + 48} ${y + 86} H${x + 264}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <text x="${x + 52}" y="${y + 114}" class="small5" style="font-size:20px;fill:${L.blue};font-weight:900">传统交付</text>
    <text x="${x + 52}" y="${y + 150}" class="body5" style="font-size:25px">${esc(before)}</text>
    <text x="${x + 52}" y="${y + 196}" class="small5" style="font-size:20px;fill:${L.orange};font-weight:900">AI 介入后</text>
    <text x="${x + 52}" y="${y + 232}" class="body5" style="font-size:25px">${esc(after)}</text>
    <rect x="${x + 52}" y="${y + 278}" width="208" height="36" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="${x + 156}" y="${y + 284}" class="small5" text-anchor="middle" style="font-size:19px;fill:${L.ink};font-weight:900">${esc(diff)}</text>
  `;
}

function sdlcArrowV05(x, y, color) {
  const marker = color === L.orange ? "arrowGray" : "arrowBlue";
  return `<path d="M${x} ${y} H${x + 54}" stroke="${color}" stroke-width="4" fill="none" marker-end="url(#${marker})" opacity="0.85"/>`;
}

function slideExplorationV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 64)}
    <text x="142" y="366" class="small5" style="font-size:24px;fill:${L.muted};font-weight:820">模型生成的是可能性；BitFun 的控制面负责把可能性放进可读取、可拦截、可复核的工程轨道。</text>
    <rect x="120" y="424" width="1680" height="360" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <path d="M540 462 V750 M960 462 V750 M1380 462 V750" stroke="${L.line2}" stroke-width="2"/>
    ${controlLaneV07(160, 480, "01", "规则上下文", "先明确边界", ["仓库 / 模块规则文件", "架构、日志、远程规则", "先有事实，再有生成"], L.blue, "file")}
    ${controlLaneV07(580, 480, "02", "工具准入", "工具不是无限开放", ["可用工具白名单", "运行时限制", "先读工具规格"], L.orange, "grid")}
    ${controlLaneV07(1000, 480, "03", "权限隔离", "影响面必须可控", ["产物不越过根目录", "文件 / 命令 / 网络白名单", "高风险权限差异"], L.blue, "shield")}
    ${controlLaneV07(1420, 480, "04", "验证矩阵", "按风险选择验证", ["前端检查 / 类型 / 测试", "深度评审专项测试", "后端 / 桌面分层检查"], L.orange, "check")}
    ${v02Takeaway("关键不是让 AI 能做更多，而是让每次执行都有边界、审计和验证入口。", 1440)}
  `;
  return svgBaseV5(slide, index, body);
}

function controlLaneV07(x, y, n, titleValue, kicker, lines, color, icon) {
  const bullets = lines.map((line, i) => {
    const by = y + 176 + i * 46;
    return `
      <circle cx="${x + 18}" cy="${by + 12}" r="5.5" fill="${color}" opacity="0.80"/>
      <text x="${x + 38}" y="${by}" class="small5" style="font-size:22px;fill:${L.ink};font-weight:800">${esc(line)}</text>
    `;
  }).join("");
  return `
    <g>
      <circle cx="${x + 38}" cy="${y + 38}" r="38" fill="${color}" opacity="0.11"/>
      ${v5Icon(icon, x + 14, y + 14, 48, color)}
      <text x="${x + 94}" y="${y + 4}" class="num5" style="font-size:34px;fill:${color}">${esc(n)}</text>
      <text x="${x + 94}" y="${y + 50}" class="label5" style="font-size:30px">${esc(titleValue)}</text>
      <text x="${x}" y="${y + 120}" class="small5" style="font-size:22px;fill:${color};font-weight:900">${esc(kicker)}</text>
      <path d="M${x} ${y + 154} H${x + 330}" stroke="${color}" stroke-width="3.2" stroke-linecap="round" opacity="0.65"/>
      ${bullets}
    </g>
  `;
}

function harnessFocusV06(x, y, n, titleValue, desc, color) {
  return `
    <circle cx="${x + 22}" cy="${y + 20}" r="19" fill="${color}" opacity="0.13"/>
    <text x="${x + 22}" y="${y + 7}" class="micro5" text-anchor="middle" style="font-size:17px;fill:${color};font-weight:900">${esc(n)}</text>
    <text x="${x + 62}" y="${y}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:900">${esc(titleValue)}</text>
    <text x="${x + 224}" y="${y + 1}" class="small5" style="font-size:20px;fill:${L.muted};font-weight:760">${esc(desc)}</text>
  `;
}

function slideReliabilityV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 66)}
    <rect x="1350" y="346" width="460" height="54" rx="27" fill="#FFF6EE" stroke="${L.orange}" stroke-width="2"/>
    <text x="1580" y="373" class="small5" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle" style="font-size:23px;fill:${L.orange};font-weight:900">0.99^10 ≈ 0.90，长链路需要纠偏</text>
    ${reliabilityCardV05(110, 412, "01", "概率探索层", "允许过程多路径", ["沙箱执行", "权限控制", "失败回注", "trace 可回放"], L.blue, "terminal")}
    <path d="M620 590 H700" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    ${reliabilityCardV05(730, 412, "02", "证据包", "压缩成可判断对象", ["diff", "测试", "风险", "回滚"], L.blue, "file")}
    <path d="M1240 590 H1320" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    ${reliabilityCardV05(1350, 412, "03", "阶段门禁", "只在转换点放行", ["计划 → 实现", "实现 → 评审", "评审 → 合并", "发布 → 复盘"], L.orange, "shield")}
    ${v02Takeaway("新的工程确定性：过程可探索，结果必须以证据、门禁和责任放行。", 1320)}
  `;
  return svgBaseV5(slide, index, body);
}

function reliabilityCardV05(x, y, n, label, titleValue, chips, color, icon) {
  const chipText = chips.map((chip, i) => {
    const cx = x + 76 + (i % 2) * 202;
    const cy = y + 238 + Math.floor(i / 2) * 56;
    return `
      <circle cx="${cx}" cy="${cy + 14}" r="7" fill="${color}" opacity="0.86"/>
      <text x="${cx + 22}" y="${cy}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:860">${esc(chip)}</text>
    `;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="460" height="370" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 76}" cy="${y + 76}" r="46" fill="${color}" opacity="0.10"/>
    ${v5Icon(icon, x + 48, y + 48, 56, color)}
    <text x="${x + 144}" y="${y + 44}" class="num5" style="font-size:36px;fill:${color}">${esc(n)}</text>
    <text x="${x + 210}" y="${y + 48}" class="small5" style="font-size:23px;fill:${color};font-weight:900">${esc(label)}</text>
    <text x="${x + 52}" y="${y + 146}" class="num5" style="font-size:32px;fill:${L.ink}">${esc(titleValue)}</text>
    <path d="M${x + 52} ${y + 202} H${x + 408}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>
    ${chipText}
  `;
}

function slideReliabilityBridgeV08(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 58)}
    <rect x="1250" y="324" width="560" height="82" rx="24" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="1530" y="352" class="small5" text-anchor="middle" style="font-size:24px;fill:${L.ink};font-weight:900">0.99^10 ≈ 0.90</text>
    <text x="1530" y="384" class="micro5" text-anchor="middle" style="font-size:18px;fill:${L.muted};font-weight:820">单步可信，不等于长链路可信</text>

    ${reliabilityFlowCardV08(120, 440, "01", "概率探索", "让 Agent 放开探索", ["沙箱执行", "权限边界", "失败回注"], "terminal", 500, 330)}
    <path d="M640 604 H690" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)" opacity="0.90"/>
    ${reliabilityFlowCardV08(720, 440, "02", "确定性中间件", "把过程压缩成证据", ["记录执行轨迹", "归一变更差异", "收集测试与风险"], "file", 500, 330)}
    <path d="M1240 604 H1290" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)" opacity="0.90"/>
    ${reliabilityFlowCardV08(1320, 440, "03", "证据放行", "只在转换点判断", ["计划到实现", "实现到评审", "合并与发布"], "shield", 500, 330)}

    ${v02Takeaway("探索可以发散，放行必须收敛：中间件把 AI 过程变成团队可判断的证据。", 1380)}
  `;
  return svgBaseV5(slide, index, body);
}

function reliabilityFlowCardV08(x, y, n, label, titleValue, lines, icon, w = 450, h = 330) {
  const bullets = lines.map((line, i) => {
    const yy = y + 208 + i * 42;
    return `
      <circle cx="${x + 58}" cy="${yy + 11}" r="6.5" fill="${L.blue}" opacity="0.86"/>
      <text x="${x + 82}" y="${yy}" class="small5" style="font-size:24px;fill:${L.ink};font-weight:840">${esc(line)}</text>
    `;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 76}" cy="${y + 78}" r="44" fill="${L.blue}" opacity="0.10"/>
    ${v5Icon(icon, x + 48, y + 50, 56, L.blue)}
    <text x="${x + 144}" y="${y + 44}" class="num5" style="font-size:36px;fill:${L.blue}">${esc(n)}</text>
    <text x="${x + 210}" y="${y + 49}" class="small5" style="font-size:24px;fill:${L.blue};font-weight:900">${esc(label)}</text>
    <text x="${x + 52}" y="${y + 142}" class="num5" style="font-size:33px;fill:${L.ink}">${esc(titleValue)}</text>
    <path d="M${x + 52} ${y + 190} H${x + w - 52}" stroke="${L.blue}" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
    ${bullets}
  `;
}

function miniChipV08(x, y, label, color) {
  return `
    <rect x="${x}" y="${y}" width="96" height="32" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="1.8"/>
    <text x="${x + 48}" y="${y + 16}" class="micro5" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle" style="font-size:16px;fill:${color};font-weight:900">${esc(label)}</text>
  `;
}

function middleStepV08(x, y, label, desc, color) {
  return `
    <rect x="${x}" y="${y - 26}" width="360" height="48" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="1.8"/>
    <circle cx="${x + 30}" cy="${y - 2}" r="9" fill="${color}"/>
    <text x="${x + 56}" y="${y - 20}" class="small5" style="font-size:22px;fill:${L.ink};font-weight:900">${esc(label)}</text>
    <text x="${x + 128}" y="${y - 18}" class="small5" style="font-size:19px;fill:${L.muted};font-weight:820">${esc(desc)}</text>
  `;
}

function gateStepV08(x, y, from, to, color) {
  return `
    <text x="${x}" y="${y}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:900">${esc(from)}</text>
    <path d="M${x + 56} ${y + 14} H${x + 96}" stroke="${color}" stroke-width="3" marker-end="url(#arrowGray)" opacity="0.76"/>
    <text x="${x + 116}" y="${y}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:900">${esc(to)}</text>
  `;
}

function slideExternalSignalsV02(slide, index) {
  const body = `
    ${v5Header("02 / 研究共识", slide.title, slide.subtitle, 66)}
    ${sourceSignalCardV07(220, 380, 650, 204, "Google / DeepMind", "架构选择", "多 Agent 不等于更好", ["并行收益高，顺序任务可能退化"], L.blue, "team")}
    ${sourceSignalCardV07(1050, 380, 650, 204, "IBM MAP / ICLR 2026", "生产 Agent", "简单、可控、可评估", ["短链路介入，人类评估仍核心"], L.orange, "check")}
    ${sourceSignalCardV07(220, 626, 650, 204, "Gartner 2026", "平台化", "IDE 变成可选入口", ["治理与验证转向自动化平台"], L.blue, "grid")}
    ${sourceSignalCardV07(1050, 626, 650, 204, "MSR 2026", "质量", "速度收益需要承接", ["告警、重复代码、复杂度上升"], L.orange, "file")}
    ${v02Takeaway("核心判断：AI 研发收益取决于架构适配、生产可控、平台治理和质量约束。", 1520, 908)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideLifecycleV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 58)}
    ${speedCostCardV05(122, 410, "01", "局部速度", "更快进入评审", ["想法到原型", "代码生成", "改动提交", "快速反馈"], L.blue, "grid")}
    <path d="M610 590 H700" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${speedCostCardV05(720, 410, "02", "协作摩擦", "等待会吞掉加速", ["评审等待", "构建排队", "返工循环", "集成冲突"], L.orange, "team")}
    <path d="M1208 590 H1298" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${speedCostCardV05(1318, 410, "03", "整体效率", "端到端周期缩短", ["净周期", "返工少", "失败可复盘", "恢复更快"], L.blue, "loop")}
    <rect x="300" y="806" width="1320" height="70" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="841" class="body5" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" style="font-size:27px"><tspan style="fill:${L.blue};font-weight:900">衡量口径：</tspan><tspan>端到端周期 + 评审等待 + 返工率 + 构建稳定性 + 恢复时间</tspan></text>
    ${v02Takeaway("真正的快，是从需求到稳定发布更短、返工更少、风险更清楚。", 1320)}
  `;
  return svgBaseV5(slide, index, body);
}

function speedCostCardV05(x, y, n, label, titleValue, chips, color, icon) {
  const chipText = chips.map((chip, i) => {
    const cx = x + 72 + (i % 2) * 210;
    const cy = y + 238 + Math.floor(i / 2) * 56;
    return `
      <circle cx="${cx}" cy="${cy + 14}" r="7" fill="${color}" opacity="0.86"/>
      <text x="${cx + 22}" y="${cy}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:860">${esc(chip)}</text>
    `;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="488" height="370" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 244}" cy="${y + 58}" r="38" fill="${color}" opacity="0.12"/>
    ${v5Icon(icon, x + 214, y + 28, 60, color)}
    <text x="${x + 244}" y="${y + 122}" class="small5" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle" style="font-size:22px;fill:${color};font-weight:900">${esc(n)} / ${esc(label)}</text>
    <text x="${x + 244}" y="${y + 176}" class="num5" text-anchor="middle" dominant-baseline="central" alignment-baseline="middle" style="font-size:34px">${esc(titleValue)}</text>
    ${chipText}
  `;
}

function slideQualityV02(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 60)}
    <text x="126" y="366" class="small5" style="font-size:23px;fill:${L.muted};font-weight:820">重构不是“把代码搬出去”，而是让能力在 owner 迁移后仍然成立。</text>
    ${capabilityCurveV07(140, 424)}
    <rect x="812" y="424" width="968" height="268" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="870" y="478" class="small5" style="font-size:23px;fill:${L.orange};font-weight:900">迁移原则</text>
    <text x="870" y="538" class="num5" style="font-size:48px;fill:${L.ink}">先锁能力，再迁 owner</text>
    <rect x="870" y="616" width="182" height="44" rx="22" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <rect x="1092" y="616" width="182" height="44" rx="22" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <rect x="1314" y="616" width="182" height="44" rx="22" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="961" y="630" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.blue};font-weight:900">能力没丢</text>
    <text x="1183" y="630" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.orange};font-weight:900">边界没破</text>
    <text x="1405" y="630" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.blue};font-weight:900">行为没变</text>
    <rect x="128" y="746" width="1664" height="142" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    ${capabilityStepV07(206, 786, "01", "锁能力", "product-full", L.blue)}
    ${capabilityStepV07(620, 786, "02", "设接口", "port / provider", L.orange)}
    ${capabilityStepV07(1034, 786, "03", "查边界", "boundary check", L.blue)}
    ${capabilityStepV07(1448, 786, "04", "验等价", "contract tests", L.orange)}
    <path d="M504 844 H576 M918 844 H990 M1332 844 H1404" stroke="${L.line2}" stroke-width="4" stroke-linecap="round"/>
    ${v02Takeaway("能力保护式重构：让 AI 提速发生在可证明的迁移协议里。", 1180)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideQualityChainsV08(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 58)}
    ${qualityPanelV08(110, 430, "开源高质量要求", "提升对提交质量的信任", [
      "贡献者对代码负责",
      "维护者看方向、可读性、测试",
      "小批量变更 + 可复核证据",
    ], L.blue, "team")}

    ${qualityPanelV08(700, 430, "共同检查面", "三条链同时可复核", [
      "责任链：谁决策 / 审核 / 承担",
      "证据链：测试 / 轨迹 / 回滚",
      "工件链：代码 / 配置 / 发布物",
    ], L.blue, "check")}

    ${qualityPanelV08(1290, 430, "大厂复杂交付", "稳定工件贯穿系统", [
      "需求 / 设计 / 接口 / 稳定性目标",
      "证据贯穿计划、发布与复盘",
      "责任人、回滚、合规可追踪",
    ], L.orange, "grid")}

    ${v02Takeaway("开源和大厂的差异在场景；共同点是责任清楚、证据完整、工件可追踪。", 1500)}
  `;
  return svgBaseV5(slide, index, body);
}

function qualityPanelV08(x, y, kicker, titleValue, lines, color, icon) {
  const bulletText = lines.map((line, i) => {
    const yy = y + 174 + i * 42;
    return `
      <circle cx="${x + 56}" cy="${yy + 12}" r="6.5" fill="${color}"/>
      <text x="${x + 78}" y="${yy}" class="small5" style="font-size:24px;fill:${L.muted};font-weight:850">${esc(line)}</text>
    `;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="520" height="310" rx="22" fill="${L.paper}" stroke="${L.line2}" stroke-width="2.2" filter="url(#paperShadow)"/>
    <circle cx="${x + 64}" cy="${y + 62}" r="38" fill="${color}" opacity="0.10"/>
    ${v5Icon(icon, x + 38, y + 36, 52, color)}
    <text x="${x + 122}" y="${y + 38}" class="small5" style="font-size:23px;fill:${color};font-weight:900">${esc(kicker)}</text>
    <text x="${x + 54}" y="${y + 112}" class="num5" style="font-size:34px;fill:${L.ink}">${esc(titleValue)}</text>
    <path d="M${x + 54} ${y + 150} H${x + 466}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.66"/>
    ${bulletText}
  `;
}

function chainPillV08(x, y, titleValue, desc, color) {
  return `
    <rect x="${x}" y="${y}" width="316" height="58" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="1.8"/>
    <text x="${x + 26}" y="${y + 9}" class="num5" style="font-size:27px;fill:${color}">${esc(titleValue)}</text>
    <text x="${x + 26}" y="${y + 38}" class="small5" style="font-size:17px;fill:${L.muted};font-weight:850">${esc(desc)}</text>
  `;
}

function capabilityCurveV07(x, y) {
  const x0 = x + 72;
  const y0 = y + 252;
  const top = y + 34;
  const right = x + 560;
  return `
    <g>
      <rect x="${x}" y="${y}" width="604" height="300" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
      <path d="M${x0} ${y0} H${right}" stroke="${L.line2}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M${x0} ${y0} V${top}" stroke="${L.line2}" stroke-width="2.5" stroke-linecap="round"/>
      <text x="${x0 - 16}" y="${top - 22}" class="small5" text-anchor="end" style="font-size:22px;fill:${L.orange};font-weight:900">质量</text>
      <text x="${right}" y="${y0 + 28}" class="small5" text-anchor="end" style="font-size:22px;fill:${L.blue};font-weight:900">速度</text>
      <path d="M${x0 + 20} ${top + 58} C${x0 + 164} ${top + 78} ${x0 + 294} ${top + 156} ${right - 22} ${y0 - 36}" stroke="${L.blue}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M${x0 + 20} ${top + 130} C${x0 + 158} ${top + 114} ${x0 + 296} ${top + 96} ${right - 22} ${top + 68}" stroke="${L.orange}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <circle cx="${x0 + 318}" cy="${top + 168}" r="5.5" fill="${L.blue}"/>
      <circle cx="${x0 + 332}" cy="${top + 90}" r="5.5" fill="${L.orange}"/>
    </g>
  `;
}

function capabilityStepV07(x, y, n, titleValue, desc, color) {
  return `
    <g>
      <circle cx="${x}" cy="${y + 58}" r="34" fill="${color}" opacity="0.12"/>
      <text x="${x}" y="${y + 43}" class="num5" text-anchor="middle" style="font-size:24px;fill:${color}">${esc(n)}</text>
      <text x="${x + 58}" y="${y + 20}" class="label5" style="font-size:27px">${esc(titleValue)}</text>
      <text x="${x + 58}" y="${y + 70}" class="small5" style="font-size:21px;fill:${L.muted};font-weight:820">${esc(desc)}</text>
    </g>
  `;
}

function slideFutureQualityV02(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 58)}
    ${qualityProtocolCardV09(100, 420, "01", "任务前", "质量约束先写清", ["DFX / 兼容性 / 验收边界", "让 Agent 带着约束开始生成"], L.blue, "shield")}
    ${qualityProtocolCardV09(680, 420, "02", "生成中", "测试与评估持续收敛", ["先定义失败证据", "生成、修复、重跑形成闭环"], L.orange, "check")}
    ${qualityProtocolCardV09(1260, 420, "03", "合并前", "人做风险仲裁", ["责任人、依赖、回滚、例外", "证据完整才进入下一关"], L.blue, "file")}
    <path d="M660 596 H704 M1240 596 H1284" stroke="${L.line2}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    ${v02Takeaway("工程协议的作用：把质量要求放到产出发生之前，并让每一关都有证据。", 1440)}
  `;
  return svgBaseV5(slide, index, body);
}

function qualityProtocolCardV09(x, y, n, stage, titleValue, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="560" height="300" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 72}" cy="${y + 72}" r="40" fill="${color}" opacity="0.10"/>
    ${v5Icon(icon, x + 46, y + 46, 52, color)}
    <text x="${x + 140}" y="${y + 42}" class="num5" style="font-size:34px;fill:${color}">${esc(n)}</text>
    <text x="${x + 208}" y="${y + 48}" class="small5" style="font-size:24px;fill:${color};font-weight:900">${esc(stage)}</text>
    <text x="${x + 56}" y="${y + 134}" class="num5" style="font-size:34px;fill:${L.ink}">${esc(titleValue)}</text>
    <path d="M${x + 56} ${y + 184} H${x + 504}" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.62"/>
    ${v02Lines(lines, x + 56, y + 218, 22, L.muted, 36, 820)}
  `;
}

function slideBitfunV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程治理", slide.title, slide.subtitle, 58)}
    <path d="M600 490 H690" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M1190 490 H1280" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M1020 740 H1100" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    ${workflowStepV02(100, 390, "01", "任务入口", "目标与边界", ["目标、非目标、风险", "验收标准先写清"], L.blue, "file")}
    ${workflowStepV02(690, 390, "02", "隔离工作区", "受控执行", ["独立环境探索", "避免污染主分支"], L.orange, "terminal")}
    ${workflowStepV02(1280, 390, "03", "判断上下文", "审查材料", ["为什么改、改了什么", "怎么验、风险如何退"], L.blue, "check")}
    ${workflowStepV02(520, 642, "04", "独立评审", "角色分离", ["发现 / 仲裁分离", "修复后重新验证"], L.orange, "team")}
    ${workflowStepV02(1100, 642, "05", "阶段放行", "门禁判断", ["PR、合并、发布", "责任归属可追踪"], L.blue, "shield")}
    ${v02Takeaway("落地重点不是多一个聊天入口，而是形成任务、环境、判断上下文、评审和门禁的连续交付流。", 1580)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideRoleV02(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 64)}
    <path d="M508 604 H548 M933 604 H973 M1358 604 H1398" stroke="${L.blue}" stroke-width="4" fill="none" marker-end="url(#arrowBlue)" opacity="0.72"/>
    ${roleColumnV02(130, 420, "01", "定义问题", "价值、边界、风险", "信息整理、备选方案", L.blue)}
    ${roleColumnV02(555, 420, "02", "组织上下文", "架构取舍、事实源", "检索、摘要、计划草案", L.blue)}
    ${roleColumnV02(980, 420, "03", "编排执行", "权限、节奏、验证", "生成、运行、反馈", L.orange)}
    ${roleColumnV02(1405, 420, "04", "证据放行", "责任、解释、复盘", "trace、diff、测试", L.orange)}
    ${v02Takeaway("关键不是“谁替代谁”，而是人在目标、边界、证据、责任上站稳。", 1320)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideResponsibilityV06(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 58)}
    <rect x="110" y="376" width="800" height="444" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="1010" y="376" width="800" height="444" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="166" y="430" class="small5" style="font-size:24px;fill:${L.blue};font-weight:900">团队职责</text>
    <text x="166" y="484" class="num5" style="font-size:42px;fill:${L.ink}">团队：把流程做实</text>
    ${responsibilityRowV06(168, 568, "01", "组织上下文", "需求、架构、日志、测试、历史决策进入 Agent 视野", L.blue)}
    ${responsibilityRowV06(168, 636, "02", "证据交付", "把测试、构建、轨迹、评审变成交付的一部分", L.blue)}
    ${responsibilityRowV06(168, 704, "03", "净收益指标", "看净时间、返工率、评审压力和线上风险", L.orange)}
    ${responsibilityRowV06(168, 772, "04", "阶段门禁", "用权限、隔离、独立评审承接自动化责任", L.orange)}
    <text x="1066" y="430" class="small5" style="font-size:24px;fill:${L.orange};font-weight:900">个人职责</text>
    <text x="1066" y="484" class="num5" style="font-size:42px;fill:${L.ink}">个人：把判断站稳</text>
    ${responsibilityRowV06(1068, 568, "01", "定义问题", "说明目标、非目标、验收标准和风险边界", L.blue)}
    ${responsibilityRowV06(1068, 636, "02", "核验事实", "选择可信上下文，理解代码、架构和运行约束", L.blue)}
    ${responsibilityRowV06(1068, 704, "03", "解释风险", "判断能不能合、哪里要慢、谁需要参与", L.orange)}
    ${responsibilityRowV06(1068, 772, "04", "承接责任", "出了问题能解释、回滚、复盘和沉淀", L.orange)}
    <path d="M936 560 V752" stroke="${L.line2}" stroke-width="3" stroke-dasharray="8 12"/>
    <circle cx="960" cy="656" r="54" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    ${v5Icon("team", 928, 624, 64, L.blue)}
    ${v02Takeaway("AI 时代的职责变化：团队建设可治理系统，个人承担关键判断。", 1320)}
  `;
  return svgBaseV5(slide, index, body);
}

function responsibilityRowV06(x, y, n, titleValue, desc, color) {
  return `
    <text x="${x}" y="${y}" class="micro5" style="font-size:20px;fill:${color};font-weight:900">${esc(n)}</text>
    <text x="${x + 48}" y="${y - 2}" class="small5" style="font-size:25px;fill:${L.ink};font-weight:900">${esc(titleValue)}</text>
    <text x="${x + 204}" y="${y}" class="small5" style="font-size:21px;fill:${L.muted};font-weight:760">${esc(desc)}</text>
  `;
}

function roleColumnV02(x, y, n, titleValue, humanText, aiText, color) {
  const w = 380;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="400" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 36}" y="${y + 34}" class="num5" style="font-size:44px;fill:${color}">${esc(n)}</text>
    <text x="${x + 36}" y="${y + 100}" class="label5" style="font-size:32px">${esc(titleValue)}</text>
    <path d="M${x + 36} ${y + 164} H${x + w - 50}" stroke="${L.line2}" stroke-width="3"/>
    <rect x="${x + 36}" y="${y + 202}" width="66" height="34" rx="17" fill="${L.blue}" opacity="0.12"/>
    <text x="${x + 69}" y="${y + 209}" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.blue};font-weight:900">人</text>
    <text x="${x + 118}" y="${y + 207}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:820">${esc(humanText)}</text>
    <path d="M${x + 36} ${y + 266} H${x + w - 44}" stroke="${L.line2}" stroke-width="2"/>
    <rect x="${x + 36}" y="${y + 300}" width="66" height="34" rx="17" fill="${L.orange}" opacity="0.13"/>
    <text x="${x + 69}" y="${y + 307}" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.orange};font-weight:900">AI</text>
    <text x="${x + 118}" y="${y + 305}" class="small5" style="font-size:23px;fill:${L.ink};font-weight:820">${esc(aiText)}</text>
    <circle cx="${x + w - 70}" cy="${y + 76}" r="28" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    ${v5Icon(n === "01" ? "chat" : n === "02" ? "file" : n === "03" ? "terminal" : "check", x + w - 88, y + 58, 36, color)}
  `;
}

function slidePredictionV02(slide, index) {
  const body = `
    ${v5Header("04 / 能力演进", slide.title, slide.subtitle, 58)}
    <path d="M260 570 C560 480 760 520 960 590 S1360 702 1620 552" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.42"/>
    <path d="M320 472 C650 398 1240 408 1580 494" stroke="${L.orange}" stroke-width="4" fill="none" stroke-dasharray="10 14" opacity="0.32"/>
    ${newGradCardV05(120, 420, "01", "组织上下文", ["让需求、架构、日志、测试、", "历史决策进入 Agent 视野。"], L.blue, "code")}
    ${newGradCardV05(1070, 420, "02", "证据驱动交付", ["把测试、CI、trace、review", "当成提交的一部分。"], L.orange, "check")}
    ${newGradCardV05(120, 650, "03", "建立净收益指标", ["看净时间、返工率、评审压力、", "线上风险，而不是代码量。"], L.orange, "file")}
    ${newGradCardV05(1070, 650, "04", "承担责任边界", ["判断该不该做、能不能合、", "出了问题如何解释。"], L.blue, "shield")}
    ${v02Takeaway("不要先追求全自动，先把上下文、证据、指标和责任边界做实。", 1360)}
  `;
  return svgBaseV5(slide, index, body);
}

function newGradCardV05(x, y, n, titleValue, lines, color, icon) {
  return `
    <rect x="${x}" y="${y}" width="730" height="172" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <circle cx="${x + 80}" cy="${y + 86}" r="50" fill="${color}" opacity="0.10"/>
    ${v5Icon(icon, x + 50, y + 56, 60, color)}
    <text x="${x + 152}" y="${y + 34}" class="num5" style="font-size:34px;fill:${color}">${esc(n)}</text>
    <text x="${x + 222}" y="${y + 34}" class="label5" style="font-size:31px">${esc(titleValue)}</text>
    ${v02Lines(lines, x + 222, y + 86, 24, L.muted, 32, 650)}
  `;
}

function slideThanksV02(slide, index) {
  const body = `
    <text x="96" y="150" class="small5" style="fill:${L.blue};font-weight:900">谢谢 / 讨论</text>
    <text x="96" y="246" class="h15" style="font-size:90px">谢谢</text>
    <path d="M96 386 h150" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="276" cy="386" r="6" fill="${L.orange}"/>
    <rect x="170" y="500" width="1580" height="340" rx="22" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="240" y="556" class="label5" style="font-size:33px">留给 Q&amp;A 的三个讨论入口</text>
    ${discussionPointV06(248, 638, "Google / DeepMind", "任务什么时候适合单 Agent、并行 Agent 或集中编排？", L.blue)}
    ${discussionPointV06(248, 716, "IBM MAP / Gartner", "工具建设要不要从单点能力转向运行基座？", L.orange)}
    ${discussionPointV06(248, 794, "MSR 2026", "质量机制如何持续放大速度收益？", L.blue)}
    <rect x="1090" y="238" width="470" height="178" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="1144" y="286" class="num5" style="font-size:56px;fill:${L.blue}">Q&amp;A</text>
    ${v5Icon("chat", 1424, 292, 86, L.blue)}
  `;
  return svgBaseV5(slide, index, body);
}

function discussionPointV06(x, y, source, textValue, color) {
  return `
    <text x="${x}" y="${y}" class="micro5" style="font-size:21px;fill:${color};font-weight:900">${esc(source)}</text>
    <circle cx="${x + 300}" cy="${y + 13}" r="6" fill="${color}"/>
    <text x="${x + 330}" y="${y - 2}" class="body5" style="font-size:29px;fill:${L.ink};font-weight:850">${esc(textValue)}</text>
  `;
}

function roleStep5(x, y, n, titleValue, desc, color) {
  return `
    <circle cx="${x}" cy="${y}" r="12" fill="${color}"/>
    <rect x="${x + 18}" y="${y - 122}" width="365" height="112" rx="10" fill="${L.bg}" opacity="0.94"/>
    <text x="${x + 30}" y="${y - 108}" class="num5" style="font-size:30px;fill:${color}">${esc(n)}</text>
    <text x="${x + 30}" y="${y - 66}" class="label5">${esc(titleValue)}</text>
    <text x="${x + 30}" y="${y - 25}" class="small5">${esc(desc)}</text>
  `;
}

async function renderImages() {
  for (const entry of fs.readdirSync(slidesDir)) {
    if (/^slide-\d+\.(svg|png)$/.test(entry)) {
      fs.unlinkSync(path.join(slidesDir, entry));
    }
  }
  const paths = [];
  for (let i = 0; i < slides.length; i += 1) {
    const svg = slides[i].render(slides[i], i).replace(/[ \t]+$/gm, "");
    const svgPath = path.join(slidesDir, `slide-${String(i + 1).padStart(2, "0")}.svg`);
    const pngPath = path.join(slidesDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    fs.writeFileSync(svgPath, svg, "utf8");
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    paths.push(pngPath);
  }
  return paths;
}

async function writeContactSheet(pngPaths) {
  const thumbW = 456;
  const thumbH = 257;
  const gap = 28;
  const pad = 44;
  const cols = 4;
  const rows = Math.ceil(pngPaths.length / cols);
  const width = pad * 2 + cols * thumbW + (cols - 1) * gap;
  const height = pad * 2 + rows * thumbH + (rows - 1) * gap;
  const composites = [];
  for (let i = 0; i < pngPaths.length; i += 1) {
    const input = await sharp(pngPaths[i]).resize(thumbW, thumbH).png().toBuffer();
    composites.push({
      input,
      left: pad + (i % cols) * (thumbW + gap),
      top: pad + Math.floor(i / cols) * (thumbH + gap),
    });
  }
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: C.bg,
    },
  })
    .composite(composites)
    .png()
    .toFile(contactSheetPath);
}

async function writePptx(pngPaths) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: PPT_W, height: PPT_H });
  pptx.layout = "WIDE";
  pptx.author = "BitFun";
  pptx.company = "BitFun";
  pptx.subject = "AI 如何重新定义软件开发";
  pptx.title = "AI 如何重新定义软件开发";
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: "Microsoft YaHei",
    bodyFontFace: "Microsoft YaHei",
    lang: "zh-CN",
  };

  pngPaths.forEach((pngPath, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "F6F8FB" };
    slide.addImage({ path: pngPath, x: 0, y: 0, w: PPT_W, h: PPT_H });
    slide.addNotes(`第 ${i + 1} 页：${slides[i].title}\n\n建议时长：${slides[i].time}\n\n讲述目标：${slides[i].focus}\n\n可选提问：${slides[i].question}\n\n讲稿：${slides[i].script}\n\n转场：${slides[i].transition}`);
  });

  await pptx.writeFile({ fileName: pptxPath });
}

function slideTimeMinutes(slide) {
  const match = String(slide.time).match(/([\d.]+)\s*分钟/);
  return match ? Number(match[1]) : 0;
}

function fmtMinutes(value) {
  return value.toFixed(1).replace(/\.0$/, "");
}

function writeNotes() {
  const linesOut = [];
  const totalMinutes = slides.reduce((sum, slide) => sum + slideTimeMinutes(slide), 0);
  const mainMinutes = slides.slice(0, -1).reduce((sum, slide) => sum + slideTimeMinutes(slide), 0);
  const closeMinutes = slideTimeMinutes(slides[slides.length - 1]);
  linesOut.push("# AI 如何重新定义软件开发：分页演讲稿");
  linesOut.push("");
  linesOut.push(`建议时长：15 分钟。建议页数：${slides.length} 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。`);
  linesOut.push(`节奏校验：当前分页讲稿标注合计约 ${fmtMinutes(totalMinutes)} 分钟，其中主体讲述约 ${fmtMinutes(mainMinutes)} 分钟，收束与 Q&A 入口约 ${fmtMinutes(closeMinutes)} 分钟。`);
  linesOut.push("");
  linesOut.push("## 报告简介");
  linesOut.push("");
  linesOut.push(intro);
  linesOut.push("");
  linesOut.push("## 可引用调研");
  linesOut.push("");
  linesOut.push("- DORA 2025（https://dora.dev/dora-report-2025/）：AI 的主要作用是放大组织既有强项与弱项，收益来自底层组织系统，而不是工具采购本身。");
  linesOut.push("- Google Research / DeepMind, Towards a Science of Scaling Agent Systems（https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/）：多 Agent 在可并行任务上可能收益明显，但在顺序任务上退化；独立多 Agent 的错误放大可达 17.2x，集中式校验能显著收敛错误传播。");
  linesOut.push("- IBM Research / ICLR 2026 MAP（https://research.ibm.com/publications/measuring-agents-in-production）：生产 Agent 的现实状态更偏简单、短链路、可控和人类评估，68% 最多执行 10 步即需要人工介入，74% 主要依赖人类评估。");
  linesOut.push("- Gartner Enterprise AI Coding Agents 2026（https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment）：预测到 2027 年，超过 65% 使用 agentic coding 的工程团队会把 IDE 视为可选入口，治理、验证和控制转向自动化平台。");
  linesOut.push("- MSR 2026, Speed at the Cost of Quality（https://cmustrudel.github.io/papers/msr2026he.pdf）：Cursor/LLM agent assistant 带来前置速度收益的同时，也观察到静态分析警告、重复代码密度和认知复杂度等质量风险。");
  if (false) {
  linesOut.push("- Google / DORA 2025（https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/）：80% 以上受访者认为 AI 提升生产力，59% 认为代码质量改善；但报告同时提出 trust paradox，并强调 AI 是组织的 mirror and multiplier，采用工具之外还需要文化、流程和系统演进。");
  linesOut.push("- DORA GenAI report 2025.2（https://dora.dev/ai/gen-ai-report/dora-impact-of-generative-ai-in-software-development.pdf）：报告提醒新技术采用可能带来短期生产率下降，也指出 AI 提高代码生成速度后，小批量、稳健测试等基本工程原则更重要。");
  linesOut.push("- METR Early-2025 RCT（https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf）：16 位成熟开源开发者在熟悉项目中完成 246 个真实任务，使用当时 AI 工具后任务耗时增加 19%，适合作为“大型复杂工程收益不线性”的反例。");
  linesOut.push("- METR 2026 update（https://metr.org/blog/2026-02-24-uplift-update/）：METR 提醒多 Agent 并行和开发者不愿脱离 AI 等因素会让 AI 生产率测量本身变得更难，适合引出“指标重写”。");
  linesOut.push("- Harness State of Engineering Excellence 2026（https://www.harness.io/press-and-news/ai-has-outpaced-how-engineering-organizations-measure-developer-productivity）：81% 受访者认为采用 AI coding tools 后 code review 时间增加，约 31% 开发者时间进入 review、修 bug、工具切换等隐形工作。");
  linesOut.push("- Harness DevOps Modernization 2026（https://www.harness.io/state-of-modernization-2026）：频繁使用 AI coding 的团队同时报告部署问题、回滚/热修复、MTTR、合规和性能压力等下游挑战，适合支撑“速度要与风险一起衡量”。");
  linesOut.push("- Stack Overflow Developer Survey 2025（https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/）：84% 开发者使用或计划使用 AI 工具，但 46% 不信任 AI 输出准确性，45% 认为调试 AI 生成代码耗时，适合支撑“AI 已普及，但信任和验证成为核心能力”。");
  linesOut.push("- Sonar State of Code Developer Survey 2026（https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/）：AI 已占开发者提交代码的 42%，预计 2027 年达到 65%；96% 开发者不完全信任 AI 代码，但只有 48% 总是在提交前验证，适合引出 verification debt。");
  linesOut.push("- Anthropic, How AI assistance impacts the formation of coding skills（https://www.anthropic.com/research/AI-assistance-coding-skills）：52 名以 junior 为主的软件工程师受控实验显示，AI 组在学习新库后的测验分数低 17%，差距尤其体现在调试与理解；但要求解释、概念追问和先生成后理解等方式能缓解技能流失。");
  linesOut.push("- Agentic Much? Adoption of Coding Agents on GitHub（https://arxiv.org/abs/2601.18341）：对 128,018 个 GitHub 项目的大规模研究估计 coding agent 采用率达到 22.20%--28.66%，且 agent-assisted commits 通常比纯人工提交更大，说明新人进入职场时面对的已经是 Agentic Coding 常态。");
  linesOut.push("- AI IDEs or Autonomous Agents? Measuring the Impact of Coding Agents on Software Development（https://cmustrudel.github.io/papers/msr2026agarwal.pdf）：MSR 2026 研究区分 IDE assistant 与 autonomous agent，发现前置速度收益并不稳定，而静态分析警告和认知复杂度等质量风险可能持续增加，支撑“速度提升必须绑定质量护栏”。");
  linesOut.push("- From Junior to Senior: Allocating Agency and Navigating Professional Growth in Agentic AI-Mediated Software Engineering（https://arxiv.org/abs/2602.00496）：CHI 2026 研究提出 junior 与 senior 在 agentic AI 下的 agency 分配不同，新人容易在过度依赖与谨慎回避之间摇摆，建议把 coding、learning、mentorship 的 agency 作为组织设计对象。");
  linesOut.push("- Configuring Agentic AI Coding Tools: An Exploratory Study（https://arxiv.org/abs/2602.14690）：AIware 2026 研究分析 Claude Code、GitHub Copilot、Cursor、Gemini、Codex 等工具的配置机制，指出 AGENTS.md 等仓库级上下文文件正在成为跨工具起点，说明上下文组织本身已成为工程技能。");
  linesOut.push("- Gartner Enterprise AI Coding Agents press release（https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment）：Gartner 预测到 2027 年超过 65% 使用 agentic coding 的工程团队会把 IDE 视为可选入口，治理、验证和控制将更多转向自动化平台，适合支撑“开发者工作台正在平台化”。");
  linesOut.push("- Measuring Determinism in Large Language Models for Software Code Review（https://arxiv.org/abs/2502.20747）：即使 temperature 降到 0、清空上下文并重复同一提示，LLM 代码评审结果仍存在不同程度的不一致，适合支撑“模型层也需要工程收敛”。");
  linesOut.push("- Google Research / DeepMind / Academia, Towards a Science of Scaling Agent Systems（https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/）：多 Agent 在可并行任务上可能收益明显，但在顺序任务上退化；独立多 Agent 的错误放大可达 17.2x，集中式校验能显著收敛错误传播。");
  linesOut.push("- Towards a Science of AI Agent Reliability（https://arxiv.org/abs/2602.16666）：Princeton 等研究者提出不要只看单一成功率，而要从一致性、鲁棒性、可预测性和安全性刻画 Agent 可靠性。");
  linesOut.push("- ICSE 2026 NIER: Towards Verifiably Safe Tool Use for LLM Agents（https://conf.researchr.org/details/icse-2026/icse-2026-nier/41/Towards-Verifiably-Safe-Tool-Use-for-LLM-Agents）：提出从 STPA 出发识别 Agent 工作流风险，并把能力、保密性、信任等级等标签 formalize 到可执行规格中。");
  linesOut.push("- IBM Research / ICSE 2026: AgentFixer（https://research.ibm.com/publications/agentfixer-from-failure-detection-to-fix-recommendations-in-agentic-systems）：用 15 类失败检测工具和根因分析模块诊断 agentic 系统可靠性问题，说明验证系统本身也可演进为 agentic 的纠错流程。");
  linesOut.push("- SWE-CI（https://arxiv.org/abs/2603.03823）与 SWE-Chain（https://arxiv.org/abs/2605.14415）：把编码 Agent 评估从静态一次性修复推进到 CI 循环、长期维护和连续版本升级，支撑“长期可维护性才是最终验证”。");
  linesOut.push("- GitHub Copilot cloud agent（https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent）：把 coding agent 放进 GitHub Actions 驱动的临时环境，让其研究、计划、改代码、跑测试并进入 PR 工作流，适合支撑“异步委派 + 团队透明协作”。");
  linesOut.push("- OpenAI Codex cloud（https://developers.openai.com/codex/cloud）：Codex 可在独立云环境中后台并行处理任务，并从 GitHub issue 或 PR 触发工作，适合支撑“多任务、多 Agent、PR 化交付”。");
  linesOut.push("- Claude Code subagents / hooks（https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/hooks）：通过角色化 subagent、独立上下文、工具权限和生命周期 hooks，把协作从一个会话扩展到可控的 Agent 编排。");
  linesOut.push("- LangChain Deep Agents harness engineering（https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering）：在模型固定的情况下，通过 trace、自验证和 harness 调整提升 Terminal Bench 2.0 表现，说明改进点常在模型外部工程系统。");
  linesOut.push("- Collaborator or Assistant?（https://arxiv.org/abs/2605.08017）：分析 29,585 个 PR 生命周期，提出 Collaborator-Assistant 光谱；agent 可获得 operational agency，但 merge governance 仍主要由人类承担。");
  linesOut.push("- AgentTrace（https://arxiv.org/abs/2602.10133）：提出 structured logging 框架，捕获 operational、cognitive、contextual 三类 trace，用于安全、问责、风险分析和信任校准。");
  linesOut.push("- OpenAI, A Practical Guide to Building Agents（https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf）：强调模型、工具、指令和 guardrails 是 Agent 基础构件，并建议以 evals 建立性能基线、按任务选择模型。");
  linesOut.push("- AI Harness Engineering: A Runtime Substrate for Foundation-Model Software Agents（https://arxiv.org/abs/2605.13357）：提出把模型、harness 与环境作为整体系统来评价，harness 负责任务规格、上下文选择、工具访问、观测、验证、权限、熵审计和干预记录，支撑“能力不只在模型，也在运行基座”。");
  linesOut.push("- AgentOps: Enabling Observability of LLM Agents（https://arxiv.org/abs/2411.05285）：从 DevOps 视角提出 AgentOps taxonomy，强调要追踪 Agent 全生命周期中的 artifacts 和 associated data，支撑监控、日志、分析和安全。");
  linesOut.push("- Fine-Grained Appropriate Reliance（https://arxiv.org/abs/2501.10909）：多步透明决策工作流在复杂任务中能帮助用户在中间步骤层面校准对 AI 的依赖，适合支撑“人看阶段性证据，而不是只看最终答案”。");
  linesOut.push("- Fostering Appropriate Reliance on LLMs（https://arxiv.org/abs/2502.08554）：CHI 2025 研究发现，解释会同时增加对正确和错误回答的依赖；提供来源或暴露解释中的不一致更能降低对错误回答的过度依赖，适合支撑“判断辅助要突出来源、差异和不一致”。");
  linesOut.push("- Designing meaningful human oversight in AI（https://link.springer.com/article/10.1007/s43681-026-01147-7）：提出 AI 负责执行性 agency，人类负责验证、 steering 和 substitution 的 evaluative agency，强调人类监督不能沦为 rubber stamp。");
  linesOut.push("- SAA: visualization-based software analytics（https://www.sciencedirect.com/science/article/pii/S0164121225002584）：通过软件 Artifact traceability graph 和交互式可视化辅助软件过程分析与决策，适合支撑“Artifact 关系图 + 人类可读视图”。");
  linesOut.push("- Cloudsmith 2026 Artifact Management Report 报道（https://www.itpro.com/software/development/developers-are-slacking-on-ai-generated-code-safety-heres-why-it-could-come-back-to-haunt-them）：AI 生成代码使用快速增长，但只有少数组织用传统制品同等级别的安全策略和 provenance tracking 管理代码、依赖和发布产物，提示 Artifact 治理正在成为工程风险点。");
  }
  linesOut.push("");
  linesOut.push("## BitFun 本地工程证据");
  linesOut.push("");
  linesOut.push("- AGENTS.md：仓库级规则、平台边界、remote compatibility、验证矩阵，支撑第 5 页“规则上下文”和“验证矩阵”。");
  linesOut.push("- tool_pipeline.rs：allowed_tools、runtime_tool_restrictions、collapsed tools / GetToolSpec，支撑第 5 页“工具准入”。");
  linesOut.push("- workspace_paths.rs、miniapp/host_dispatch.rs、miniapp/manager.rs：runtime artifact root 防逃逸、MiniApp allowlist、高风险权限 diff，支撑第 5 页“权限隔离”。");
  linesOut.push("- docs/architecture/core-decomposition.md 与 scripts/check-core-boundaries.mjs：product-full capability guardrail、port/provider 迁移、boundary check 与等价验证边界，支撑第 10 页“能力保护式重构”。");
  linesOut.push("- product-domains MiniApp/function-agent contract tests：用契约测试和快照保护 owner 迁移后的行为等价，支撑第 10 页“速度提升也能沉淀为质量提升”。");
  linesOut.push("");
  linesOut.push("## 15 分钟演讲节奏");
  linesOut.push("");
  linesOut.push("按正常中文演讲语速，标题页和目录页快速进入主题，核心内容页保持 1.1-1.6 分钟，最后一页用于收束和引出互动。讲稿正文按口播方式组织，可以直接作为演讲者手卡使用。");
  linesOut.push("");
  slides.forEach((slide, i) => {
    linesOut.push(`- 第 ${i + 1} 页：${slide.time}｜${slide.title}`);
  });
  linesOut.push("");
  linesOut.push("## 分页讲稿");
  linesOut.push("");
  slides.forEach((slide, i) => {
    linesOut.push(`### 第 ${i + 1} 页：${slide.title}`);
    linesOut.push("");
    linesOut.push(`- 建议时长：${slide.time}`);
    linesOut.push(`- 讲述目标：${slide.focus}`);
    linesOut.push(`- 可选提问：${slide.question}`);
    linesOut.push("");
    linesOut.push("讲稿：");
    linesOut.push("");
    linesOut.push(slide.script);
    linesOut.push("");
    linesOut.push("转场：");
    linesOut.push("");
    linesOut.push(slide.transition);
    linesOut.push("");
  });
  fs.writeFileSync(notesPath, linesOut.join("\n"), "utf8");
}

function writeReadme() {
  const text = `# AI 如何重新定义软件开发：演讲材料

本目录保留原版演讲材料、V0.2、V0.3、V0.4、V0.5、V0.6 版本，并新增 V0.7 版本。V0.7 继续使用整页图片式生成链路，但把第 5 页落到 BitFun 工程控制面，把第 10 页落到能力保护式重构，让外部研究、工程机制和 BitFun 演进方向形成一条更清晰的主线。

## 原版材料

- \`ai-redefines-software-development.pptx\`：原版演讲用 PPTX。
- \`speaker-notes.md\`：原版分页讲稿。
- \`slides-png/\`：原版逐页 SVG 与 PNG。
- \`preview-contact-sheet.png\`：原版缩略总览。
- \`build-deck.cjs\`：原版可复现生成脚本。

重新生成原版：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck.cjs
\`\`\`

## V0.2 材料

- \`ai-redefines-software-development-v0.2.pptx\`：V0.2 演讲用 PPTX，14 页。
- \`speaker-notes-v0.2.md\`：V0.2 分页讲稿，按约 15 分钟节奏扩展。
- \`slides-png-v0.2/\`：V0.2 逐页 SVG 与 PNG。
- \`preview-contact-sheet-v0.2.png\`：V0.2 缩略总览。
- \`build-deck-v0.2.cjs\`：V0.2 可复现生成脚本。

重新生成 V0.2：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck-v0.2.cjs
\`\`\`

V0.2 主线：BitFun 的高速 AI 开发经验 -> 代码量膨胀后的真实问题 -> 产出放大后的协作对象变化 -> 概率过程与证据放行 -> 外部调研中的生产率悖论 -> 质量责任、DFX、TDD 与团队交付流 -> 开发者在新工程系统中的关键位置。

## V0.3 材料

- \`ai-redefines-software-development-v0.3.pptx\`：V0.3 演讲用 PPTX，14 页。
- \`speaker-notes-v0.3.md\`：V0.3 分页讲稿，按约 15 分钟节奏扩展。
- \`slides-png-v0.3/\`：V0.3 逐页 SVG 与 PNG。
- \`preview-contact-sheet-v0.3.png\`：V0.3 缩略总览。
- \`build-deck-v0.3.cjs\`：V0.3 可复现生成脚本。

重新生成 V0.3：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck-v0.3.cjs
\`\`\`

V0.3 主线：BitFun 的高速 AI 开发经验 -> 代码量膨胀后的真实问题 -> 产出放大后的协作对象变化 -> 概率过程与证据放行 -> 外部调研中的生产率悖论 -> 速度代价处理框架 -> 质量治理、DFX、TDD 与团队交付流 -> 开发者在新工程系统中的关键位置。

## V0.4 材料

- \`ai-redefines-software-development-v0.4.pptx\`：V0.4 演讲用 PPTX，14 页。
- \`speaker-notes-v0.4.md\`：V0.4 分页讲稿，沿用 15 分钟节奏。
- \`slides-png-v0.4/\`：V0.4 逐页 SVG 与 PNG。
- \`preview-contact-sheet-v0.4.png\`：V0.4 缩略总览。
- \`build-deck-v0.4.cjs\`：V0.4 可复现生成脚本。

重新生成 V0.4：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck-v0.4.cjs
\`\`\`

V0.4 主线：沿用 V0.3 内容结构，并在第 3-12 页加入低干扰章节水印：01 软件工程变革、02 速度的背后、03 工程质量与治理、04 开发者角色。

## V0.7 材料

- \`ai-redefines-software-development-v0.8.pptx\`：V0.7 演讲用 PPTX，${slides.length} 页。
- \`speaker-notes-v0.8.md\`：V0.7 分页讲稿，沿用 15 分钟节奏。
- \`slides-png-v0.8/\`：V0.7 逐页 SVG 与 PNG。
- \`preview-contact-sheet-v0.8.png\`：V0.7 缩略总览。
- \`build-deck-v0.8.cjs\`：V0.7 可复现生成脚本。

重新生成 V0.7：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck-v0.8.cjs
\`\`\`

V0.7 主线：现实问题 -> 研究共识 -> BitFun 工程控制面 -> 可治理工作流 -> 能力保护式重构 -> 工程协议与职责变化。重点从泛化观点继续下探到 BitFun 当前机制和未来演进路径。
`;
  fs.writeFileSync(readmePath, text, "utf8");
}

async function main() {
  const pngPaths = await renderImages();
  await writeContactSheet(pngPaths);
  await writePptx(pngPaths);
  writeNotes();
  writeReadme();
  console.log(`Wrote ${pptxPath}`);
  console.log(`Wrote ${notesPath}`);
  console.log(`Wrote ${contactSheetPath}`);
  console.log(`Wrote ${slidesDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
