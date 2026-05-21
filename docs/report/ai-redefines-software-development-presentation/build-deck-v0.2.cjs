const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pptxgen = require("pptxgenjs");

const outDir = __dirname;
const slidesDir = path.join(outDir, "slides-png-v0.2");
const pptxPath = path.join(outDir, process.env.PPTX_FILE || "ai-redefines-software-development-v0.2.pptx");
const notesPath = path.join(outDir, "speaker-notes-v0.2.md");
const readmePath = path.join(outDir, "README.md");
const contactSheetPath = path.join(outDir, "preview-contact-sheet-v0.2.png");

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
  "本报告以 BitFun 为引子，讨论 AI 如何从代码补全走向 Agentic Coding，并进一步影响软件开发全生命周期。内容将结合 Context Engineering、质量门禁、平台工程与人类监督等概念，分析企业研发流程、工程治理方式和开发者角色的变化，理解 AI 时代软件工程从“写代码”走向“组织智能协作系统”的新范式。";

const speakerName = process.env.SPEAKER_NAME || "颜仲南";

const slides = [
  {
    section: "COVER",
    title: "AI 如何重新定义软件开发",
    subtitle: "以 BitFun 为引子，理解 AI 时代的软件工程新范式",
    time: "约 0.5 分钟",
    focus: "首页：保留主题，强调 AI 带来的工程范式变化。",
    question: "如果 AI 已经能写很多代码，软件工程真正该升级什么？",
    script:
      "各位好，今天分享的主题还是《AI 如何重新定义软件开发》。这一版会更聚焦一个问题：AI 带来的变化不只是代码生成变快，而是软件工程开始从“管理人写代码”转向“管理人、AI、工具和证据共同协作”。BitFun 只是引子，我们不会展开项目细节，而是借它讨论未来工程系统如何吸收概率性产出、如何重新定义质量责任，以及开发者在新系统里应该站在哪里。",
    transition: "先看目录，四个主题从案例、速度、治理一路落到开发者角色。",
    render: slideTitleV02,
  },
  {
    section: "AGENDA",
    title: "报告目录",
    subtitle: "",
    time: "约 0.5 分钟",
    focus: "目录页：四个大模块不超过四个，标题按用户建议调整。",
    question: "这 15 分钟，哪些问题最值得带走？",
    script:
      "这场报告分四个模块。第一是软件工程变革，先从 BitFun 的高速 AI 开发经验出发，再推导到智能协作系统。第二是速度的背后，讨论为什么产出变快并不等于交付线性变快，以及概率性过程如何通过确定性证据获得高置信度。第三是工程质量与治理，结合外部报告和 BitFun 方法论，看质量门禁、DFX、TDD、Artifact 治理会怎样演进。第四是开发者角色，讨论人在这个系统里如何找到关键位置，而不是只停留在“会不会被替代”的问题上。",
    transition: "先从一个最直观的案例入口开始：代码量变大之后，问题到底有没有变少。",
    render: slideAgendaV02,
  },
  {
    section: "01 / SOFTWARE CHANGE",
    title: "数十万行代码之后，问题真的变少了吗？",
    subtitle: "AI 放大的不是代码量本身，而是速度、风险和组织方式的重分配。",
    time: "约 1.4 分钟",
    focus: "先案例后抽象：把 BitFun 作为实际入口，而不是先讲概念。",
    question: "如果一个项目一个月写出数十万行代码，第一反应该是兴奋还是审计？",
    script:
      "先从一个具体入口看：如果借助 AI，一个项目短时间内可以产生数十万行代码，这当然说明局部编码能力被放大了。但这里最有价值的不是数字，而是它暴露出的工程问题：需求变化会更频繁，原型验证会更快，个人可以先完成过去需要小团队配合的工作；与此同时，测试、review、架构理解、运行验证、知识沉淀不一定同步扩张。也就是说，代码量的膨胀不一定带来交付节奏等比例膨胀，它更像是把系统瓶颈从“写不出来”推向“能否验证、能否维护、能否协作、能否上线”。",
    transition: "由这个案例往上推，就能看到 AI 时代软件工程对象正在发生扩张。",
    render: slideShockV02,
  },
  {
    section: "01 / SOFTWARE CHANGE",
    title: "主线：产出放大后，协作对象变了",
    subtitle: "从“谁写代码”走向“谁定义目标、谁产出证据、谁承担责任”。",
    time: "约 1.4 分钟",
    focus: "承接 BitFun 案例，说明代码产出放大后，协作对象从人和代码扩展到 Agent、证据包和责任链。",
    question: "当 Agent 也能开分支、跑测试、提交 PR 时，团队真正新增的协作对象是什么？",
    script:
      "由 BitFun 的高速开发经验往上推，主线不是“AI 多写了代码”，而是协作对象变了。过去我们主要管理人和人之间的协作，以及代码进入仓库的流程；现在多了异步 Agent、角色化 Agent、工具执行、测试结果、trace、风险说明和回滚路径。第一阶段是人和 AI 同步 pair coding，AI 在 IDE 或 chat 里帮你补全、解释和修改。第二阶段是异步委派，比如 GitHub Copilot cloud agent 或 Codex cloud：你把任务交给 Agent，它在独立环境里研究、建分支、跑测试、准备 PR。第三阶段是角色化 Agent：实现、测试、评审、安全、文档可能由不同 Agent 或不同流程承担。第四阶段仍然是人类放行，但人看的重点不是每一步 prompt，而是目标是否明确、证据是否足够、风险是否可接受、责任是否能落地。所以 AI 时代的软件工程，不是多一个助手，而是把任务、证据和责任一起纳入协作系统。",
    transition: "协作对象变多以后，真正的治理问题就出现了：AI 可以概率性探索，但系统必须确定性放行。",
    render: slideCoverV02,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "关键机制：概率过程，证据放行",
    subtitle: "允许 Agent 多路径探索，但把放行收敛到可复现证据和阶段门禁。",
    time: "约 1.6 分钟",
    focus: "说明如何用 Harness 保护、证据包、阶段门禁和人工判断收敛概率性过程。",
    question: "如果每一步都有 99% 正确率，十步之后系统还可信吗？",
    script:
      "这页是前面协作变化之后的关键机制：我们不要求 AI 的每一步都确定正确，而是允许过程概率性探索，同时把结果放行建立在确定性证据上。AI 的不确定性不只来自某一次回答，团队里不同人可能使用不同模型，同一模型不同版本能力也会波动；如果一个 Agent Team 中每一步都把前一步结论当事实输入，错误会像串联系统一样累乘，0.99 的十次方大约只有 0.90。解决办法不是让人类盯住每一步 prompt，而是建立阶段门禁和证据包。左边是概率探索层，Harness 要提供沙箱、权限、危险操作拦截、失败回注和 trace；中间是证据包，把 diff、测试、日志、风险、回滚路径压缩成人能判断的交付对象；右边是阶段门禁，在计划到实现、实现到评审、评审到合并这些阶段转换处检查完整性、契约、测试、owner 和风险。人类参与的重点也从过程监督变成判断辅助：看摘要、差异、来源、不一致提示和风险解释。也就是说，用可控系统解决不可控过程，核心不是记录更多细节，而是把复杂过程收敛为可审查、可复现、可回滚的证据。",
    transition: "有了这层纠偏系统，再看外部数据，会更容易理解为什么速度收益不是天然指数级增长。",
    render: slideReliabilityV02,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "速度收益不是指数曲线",
    subtitle: "AI 提升局部产出，但验证、评审、修复与集成会重新分配收益。",
    time: "约 1.2 分钟",
    focus: "补外部信息：DORA、METR、Harness 作为市场和研究佐证。",
    question: "为什么开发者感觉更快，团队整体却未必同等加速？",
    script:
      "外部研究给了我们一个更冷静的视角。DORA 2025 把 AI 描述为组织系统的放大器：高质量组织会被放大，原本碎片化的流程也会被放大；同时它也提醒，采用 AI 不等于自动获得收益，组织需要同步演进文化、流程和系统。METR 在 2025 对成熟开源项目做随机对照实验，发现经验开发者使用当时的 AI 工具反而慢 19%；2026 年 METR 又提醒，AI 工具正在进化，任务选择和多 Agent 使用让测量本身也变难。Harness 2026 则把问题落到工程管理上：很多团队的生产力指标变好，但 code review、修 bug、工具切换等隐形工作也在上升。结论不是 AI 没用，而是不要只用代码量衡量收益。",
    transition: "所以第一个真正被重新定义的东西，是质量责任。",
    render: slideExternalSignalsV02,
  },
  {
    section: "02 / BEHIND SPEED",
    title: "速度放大之后，质量责任被重新定义",
    subtitle: "代码很多，但评审、测试、追溯和长期维护不一定同步跟上。",
    time: "约 1.0 分钟",
    focus: "解释从能跑到可放行的距离，承接前一页证据放行机制。",
    question: "AI 生成的代码能跑之后，距离可合并、可发布、可长期维护还差什么？",
    script:
      "当速度被放大之后，质量责任会从“这个功能能不能跑”扩展到“谁确认它可以进入系统”。功能能跑，只说明 happy path 暂时成立；设计不沉淀，意味着需求变化没有变成可复用的决策记录；协作被压缩，意味着个人加 Agent 很快，但团队共识可能不足；修复凭自信，意味着 Agent 可以给出看似合理的 patch，却没有复现、日志和验证。这里的关键是把“高置信度”从模型自信改成工程证据：证据不是附属材料，而是进入合并、发布和复盘的主路径。",
    transition: "质量责任落地以后，工程治理需要从门禁转向更细的智能护栏。",
    render: slideLifecycleV02,
  },
  {
    section: "03 / QUALITY GOVERNANCE",
    title: "工程质量：从门禁到智能护栏",
    subtitle: "开源重公共责任，大厂重复杂交付；共同核心是责任链和证据链。",
    time: "约 1.4 分钟",
    focus: "突出开源与大厂场景中的责任链、证据链与小批量反制不稳定。",
    question: "AI 让提交变多以后，维护者和大厂平台到底该看什么？",
    script:
      "原先第七页和第八页容易讲成重复的质量术语，这里把它收敛为一个治理问题：开源高质量协作强调公共责任，维护者要提升对陌生贡献或 AI-assisted 变更质量的信任度；大厂复杂交付强调系统连续性，组织要处理 owner、依赖链、合规、发布窗口、线上事故成本，以及贯穿整个系统的确定性工件。两者都不能只靠“多跑测试”。更有效的做法是把变化拆小，把责任、证据和 Artifact 绑定到每个小批次：谁拥有模块，谁确认设计边界，哪些测试和运行指标证明可以前进，失败时如何回滚。",
    transition: "再往前看，DFX、TDD、架构守护都会出现 AI 时代的新形态。",
    render: slideQualityV02,
  },
  {
    section: "03 / QUALITY GOVERNANCE",
    title: "下一代工程方法：让 DFX 与 TDD 变成 Agent 协议",
    subtitle: "未来的护栏不是文档清单，而是可执行、可追踪、可复用的工程契约。",
    time: "约 1.3 分钟",
    focus: "回应 DFX/TDD 新形态：非特定工程的 AI 下解决方案、细化军规、用例形态升级。",
    question: "如果代码军规仍会被幻觉绕过，下一层护栏是什么？",
    script:
      "这里可以做一个前瞻判断：AI 时代的 DFX 不会只是 Design for X 的静态清单，而会变成一组可执行的 Agent 协议。比如性能、可观测性、安全、可维护性，不再只写在规范里，而是以检查项、基准、trace、回归用例、发布预算的形式进入 Agent 工作流。TDD 也会扩展：不只是先写单元测试再写实现，而是先定义失败证据、属性约束、运行观测和评估集，再让 Agent 在这些证据边界里修改。代码军规仍会有幻觉，所以规则要更细，但更关键的是规则要可执行：能被工具检查、能被 trace 回放、能被 review 独立仲裁。",
    transition: "把这些方法落到 BitFun，就能看到一个 Agent 工程系统的雏形。",
    render: slideFutureQualityV02,
  },
  {
    section: "03 / QUALITY GOVERNANCE",
    title: "BitFun 的价值：把开发过程组织成团队工作流",
    subtitle: "从 Issue 到 PR，不是聊天产物堆叠，而是交付对象、证据包和阶段门禁。",
    time: "约 1.4 分钟",
    focus: "把第九页落到可执行方法：Spec/Issue -> Agent Worktree -> Evidence Packet -> Independent Review -> Gate/Merge。",
    question: "如果多个 Agent 同时参与，团队靠什么判断一个变更可以继续前进？",
    script:
      "回到 BitFun，它不是要证明某个模型更强，而是展示一个团队工作流的雏形。更可落地的做法是把一次 AI 开发压成五个稳定环节：第一，任务从 Issue 或 Spec 进入，明确目标、非目标和风险边界；第二，Agent 在隔离工作区执行，避免把探索过程直接污染主分支；第三，执行结束必须生成证据包，包括 diff 摘要、测试结果、日志、trace、未决风险和回滚路径；第四，评审要角色分离，发现问题、仲裁问题、修复问题、验证修复尽量不要由同一个角色闭环；第五，阶段门禁决定能否进入 PR、合并或发布。这里的关键不是记录每一步操作，而是把复杂过程压缩成团队能读、能审、能追责的交付对象和证据。",
    transition: "最后，我们把视角切回开发者：人在这样的系统里到底做什么。",
    render: slideBitfunV02,
  },
  {
    section: "04 / DEVELOPER ROLE",
    title: "开发者角色：在新工程系统中找准位置",
    subtitle: "人不只是设计系统，而是在关键阶段承担目标、边界、证据和责任。",
    time: "约 1.5 分钟",
    focus: "收敛为四步，明确人在各阶段和 AI 在各阶段的角色。",
    question: "AI 参与每个阶段后，人类开发者最不可替代的技能是什么？",
    script:
      "对学生来说，这页很关键：未来不是“人写代码，AI 帮忙补全”，而是人在不同阶段承担不同关键角色。第一步是定义问题，人负责价值判断、非目标和风险边界，AI 可以帮助整理信息和生成备选方案。第二步是组织上下文，人负责架构取舍和事实源选择，AI 负责检索、摘要和草拟计划。第三步是编排执行，人负责设置权限、节奏、验证矩阵和停止条件，AI 负责生成、修改、运行和反馈。第四步是证据放行，人负责最终责任、质量解释和复盘沉淀，AI 提供 trace、diff、测试结果和改进建议。所以编程基础仍重要，但能力结构会从语法实现，升级到问题定义、系统判断、证据审查和协作治理。",
    transition: "最后用三条未来判断收束：未来几年软件工程会往哪里走。",
    render: slideRoleV02,
  },
  {
    section: "04 / DEVELOPER ROLE",
    title: "三个未来判断",
    subtitle: "最后只带走三件事：指标、角色、协议都会被重写。",
    time: "约 0.9 分钟",
    focus: "压缩前瞻页，作为收束而不是新增概念。",
    question: "未来两三年，软件工程里最先被重写的指标和方法是什么？",
    script:
      "最后用三条判断收束，不再展开新概念。第一，指标会从代码行数、commit 数转向净收益：需求到证据的时间、评审负担、返工率、故障恢复和知识沉淀。第二，角色会从单一开发者扩展成任务 owner、Agent 编排者、证据审查者和系统治理者，人的价值更多在目标、边界、取舍和责任。第三，工程协议会越来越重要：TDD、DFX、Code Review 不只是人的流程习惯，而会变成 Agent 可读取、可执行、可产证据的协议。未来优秀的软件人才，不只是会用 AI 写代码，而是能把 AI 放进可靠工程系统里工作。",
    transition: "最后进入 Q&A。",
    render: slidePredictionV02,
  },
  {
    section: "THANKS AND Q&A",
    title: "谢谢",
    subtitle: "AI 编程、工程治理、开发者角色",
    time: "Q&A",
    focus: "致谢页：去掉上方答疑互动说明，只保留主题和互动问题。",
    question: "围绕 AI 编程、工程治理和开发者角色继续讨论。",
    script:
      "以上就是主要内容。最后留两个问题和一个方向给大家：如果 AI 能显著扩大个人产出，团队还应该用什么指标判断真实收益？如果执行过程允许概率性，哪些证据必须保持确定性？以及开发者的技术成长会向哪些方向延伸，比如架构判断、上下文组织、证据设计和工程治理。接下来进入答疑互动。",
    transition: "答疑互动。",
    render: slideThanksV02,
  },
];

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
    ${responseCard(1260, 300, "Quality Gates", "让完成绑定外部证据", ["CI / review", "required checks", "security scan", "merge queue"], C.blue, C.blueSoft)}
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
  ${v5Chrome(slide, index)}
  ${body}
</svg>`;
}

function lightCircuit() {
  return `
    <rect x="1560" y="76" width="168" height="134" rx="12" fill="none" stroke="${L.line}" stroke-width="2"/>
    <path d="M1578 118 h42 m-42 28 h112 m-112 28 h88" stroke="${L.line}" stroke-width="2" stroke-dasharray="5 8" fill="none"/>
    <path d="M1848 56 h-88 q-28 0 -28 28 v126" stroke="${L.line}" stroke-width="2" fill="none"/>
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
    <text x="96" y="132" class="small5" style="fill:${L.blue};font-weight:900">${esc(kicker)}</text>
    <text x="96" y="188" class="h15" style="font-size:${titleSize}px">${esc(titleValue)}</text>
    ${subtitle ? `<text x="100" y="${titleSize > 72 ? 292 : 282}" class="sub5">${esc(subtitle)}</text>` : ""}
    <path d="M96 ${subtitle ? 356 : 310} h112" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="${subtitle ? 230 : 226}" cy="${subtitle ? 356 : 310}" r="5.5" fill="${L.orange}"/>
  `;
}

function v5Takeaway(textValue, y = 918, width = 1260) {
  return `
    <rect x="${(1920 - width) / 2}" y="${y}" width="${width}" height="82" rx="10" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M${(1920 - width) / 2 + 82} ${y + 21} v40" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <text x="${(1920 - width) / 2 + 130}" y="${y + 22}" class="body5" style="font-size:31px">${esc(textValue)}</text>
  `;
}

function v02Takeaway(textValue, width = 1320, y = 936) {
  const x = (1920 - width) / 2;
  return `
    <rect x="${x}" y="${y}" width="${width}" height="78" rx="10" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M${x + 76} ${y + 20} v38" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <text x="${x + width / 2 + 32}" y="${y + 22}" class="body5" text-anchor="middle" style="font-size:30px">${esc(textValue)}</text>
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
    <rect x="${x}" y="${y}" width="760" height="118" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 36}" y="${y + 28}" class="num5" style="font-size:42px;fill:${color}">${esc(n)}</text>
    <text x="${x + 118}" y="${y + 26}" class="label5">${esc(titleValue)}</text>
    <text x="${x + 118}" y="${y + 66}" class="small5">${esc(desc)}</text>
    <text x="${x + 724}" y="${y + 36}" class="small5" text-anchor="end" style="fill:${color};font-weight:900">${esc(pages)}</text>
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
    <text x="1130" y="760" class="small5">Agent 能修问题，但必须回到外部证据</text>
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

function slideTitleV02(slide, index) {
  const body = `
    <text x="96" y="154" class="small5" style="fill:${L.blue};font-weight:900">BitFun / AI 软件工程报告</text>
    <text x="96" y="240" class="h15" style="font-size:82px">AI 如何重新定义软件开发</text>
    <text x="100" y="360" class="sub5">以 BitFun 为引子，理解 AI 时代的软件工程新范式</text>
    <path d="M96 436 h164" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="288" cy="436" r="6" fill="${L.orange}"/>
    <rect x="1116" y="210" width="560" height="390" rx="24" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <path d="M1190 520 C1270 390 1364 398 1428 302 S1568 218 1624 332" stroke="${L.blue}" stroke-width="6" fill="none"/>
    <path d="M1182 410 C1278 474 1386 472 1486 410 S1582 348 1630 396" stroke="${L.orange}" stroke-width="6" fill="none"/>
    ${v5Icon("terminal", 1218, 276, 78, L.blue)}
    ${v5Icon("shield", 1388, 420, 78, L.orange)}
    ${v5Icon("team", 1530, 286, 78, L.blue)}
    <rect x="1206" y="502" width="356" height="56" rx="28" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="1384" y="516" class="small5" text-anchor="middle" style="font-size:22px;fill:${L.ink};font-weight:900">生成能力之后，工程系统如何升级</text>
    <text x="96" y="620" class="body5">演讲者：${esc(speakerName)}</text>
    <text x="96" y="676" class="muted5">2026.05</text>
    <rect x="96" y="760" width="1430" height="106" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="134" y="792" class="label5">报告定位</text>
    <text x="320" y="798" class="small5" style="font-size:24px">从 BitFun 的开发经验出发，讨论软件工程如何走向可验证、可治理、可协作的智能协作系统。</text>
  `;
  return svgBaseV5(slide, index, body);
}

function slideAgendaV02(slide, index) {
  const body = `
    ${v5Header("目录", "报告目录", "", 72)}
    ${agendaItem5(150, 370, "01", "软件工程变革", "从 BitFun 案例推导智能协作系统。", "03-04", L.blue)}
    ${agendaItem5(1010, 448, "02", "速度的背后", "概率执行、证据放行、收益重估。", "05-07", L.blue)}
    ${agendaItem5(150, 606, "03", "工程质量与治理", "责任链、证据链、DFX / TDD 新形态。", "08-10", L.orange)}
    ${agendaItem5(1010, 684, "04", "开发者角色", "人在新工程系统中的关键位置。", "11-13", L.orange)}
    <path d="M318 850 C558 800 758 875 960 844 S1350 824 1604 870" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <text x="960" y="914" class="muted5" text-anchor="middle" style="font-size:25px">案例入口 → 速度重估 → 质量治理 → 人的定位</text>
  `;
  return svgBaseV5(slide, index, body);
}

function slideShockV02(slide, index) {
  const body = `
    ${v5Header("01 / 案例入口", "数十万行代码之后，问题真的变少了吗？", "AI 放大的不是代码量本身，而是速度、风险和组织方式的重新分配。", 62)}
    <rect x="116" y="410" width="600" height="398" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="166" y="478" class="small5" style="fill:${L.blue};font-weight:900">BitFun 开场观察</text>
    <text x="166" y="548" class="num5" style="font-size:70px;fill:${L.blue}">数十万行代码</text>
    <path d="M172 654 H654" stroke="${L.line2}" stroke-width="3"/>
    <text x="166" y="690" class="body5" style="font-size:31px">这不是炫耀数字，而是压力测试</text>
    <text x="166" y="732" class="small5" style="font-size:23px">代码生产被放大后，验证、评审、协作、维护</text>
    <text x="166" y="764" class="small5" style="font-size:23px">是否也同步扩容？</text>
    <path d="M742 610 H830" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    ${v02SignalCard(860, 386, 390, 142, "A", "原型验证更快", ["从想法到可运行版本的距离缩短。"], L.blue)}
    ${v02SignalCard(1300, 386, 390, 142, "B", "需求变更更灵活", ["低成本试错让需求更频繁摆动。"], L.blue)}
    ${v02SignalCard(860, 606, 390, 142, "C", "评审负担转移", ["维护者要理解更多 AI 产物。"], L.orange)}
    ${v02SignalCard(1300, 606, 390, 142, "D", "集成风险上升", ["测试、性能、架构稳定性成为瓶颈。"], L.orange)}
    <rect x="232" y="846" width="1456" height="82" rx="12" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M274 868 v38" stroke="${L.blue}" stroke-width="8" stroke-linecap="round"/>
    <text x="318" y="870" class="body5" style="font-size:30px">问题从“能不能写出来”，转移到“凭什么可以合并、发布、长期维护”。</text>
    ${v02Takeaway("真正要观察的不是 LOC 膨胀，而是交付节奏、验证成本和团队协作是否一起改善。", 1440)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideCoverV02(slide, index) {
  const body = `
    ${v5Header("01 / 主线展开", "产出放大后，协作对象变了", "从“谁写代码”走向“谁定义目标、谁产出证据、谁承担责任”。", 64)}
    <rect x="140" y="318" width="1640" height="54" rx="10" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="330" class="small5" text-anchor="middle" style="font-size:25px;fill:${L.ink};font-weight:860">BitFun 经验不是终点：代码生产放大以后，团队要管理新的交付对象</text>
    <path d="M532 578 H558" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M930 578 H956" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M1328 578 H1354" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    ${collabCardV02(180, 424, "01", "同步 Pair", "IDE / Chat", ["人判断问题", "AI 辅助修改"], L.blue, "chat")}
    ${collabCardV02(578, 424, "02", "异步委派", "Cloud Agent", ["独立工作区", "研究、修改、测试"], L.orange, "terminal")}
    ${collabCardV02(976, 424, "03", "角色化 Agent", "Subagents / Hooks", ["实现、测试、评审分离", "权限与生命周期受控"], L.blue, "team")}
    ${collabCardV02(1374, 424, "04", "人类放行", "PR / CI / Gate", ["看证据包和风险", "决定合并或发布"], L.orange, "check")}
    <rect x="248" y="704" width="1424" height="154" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <path d="M292 728 v104" stroke="${L.blue}" stroke-width="7" stroke-linecap="round"/>
    <text x="328" y="730" class="label5" style="font-size:29px">协作重心变化</text>
    <text x="328" y="774" class="small5" style="font-size:22px;fill:${L.muted};font-weight:760">从“谁写代码”转向三个可判断对象：</text>
    ${shiftChipV02(680, 736, "目标", "谁定义边界")}
    ${shiftChipV02(952, 736, "证据", "谁产出证明")}
    ${shiftChipV02(1224, 736, "责任", "谁最终放行")}
    ${v02Takeaway("AI 时代的团队协作，不是 Agent 直接替人合并代码，而是 Agent 产出可审查的交付对象和证据包。", 1520)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideExplorationV02(slide, index) {
  const body = `
    ${v5Header("02 / 速度的背后", "概率执行，证据放行", "关注需求结果的确定性，放宽执行过程的概率性。", 70)}
    <rect x="146" y="408" width="704" height="366" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="1070" y="408" width="704" height="366" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="202" y="466" class="small5" style="fill:${L.blue};font-weight:900">开发者信任</text>
    <text x="202" y="528" class="num5" style="font-size:48px">同样模型，不同 Harness</text>
    ${v02Lines(["只读计划 / 沙箱执行 / 危险命令拦截", "失败回注上下文 / trace 可回放", "让概率输出变得可观察、可停下、可追责"], 202, 604, 27, L.muted, 40, 680)}
    <text x="1126" y="466" class="small5" style="fill:${L.orange};font-weight:900">产品可靠性</text>
    <text x="1126" y="528" class="num5" style="font-size:48px">不是相信结果，而是验证结果</text>
    ${v02Lines(["测试 / Eval / Canary / 监控 / 人工审批", "把“看起来能跑”转成“可以放行”", "让最终结果具备确定性证据"], 1126, 604, 27, L.muted, 40, 680)}
    <path d="M878 590 H1038" stroke="${L.blue}" stroke-width="6" fill="none" marker-end="url(#arrowBlue)"/>
    <rect x="604" y="824" width="712" height="72" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="842" class="num5" text-anchor="middle" style="font-size:34px;fill:${L.blue}">概率执行 + 确定证据 = 高置信交付</text>
    ${v02Takeaway("新范式不是消灭概率性，而是把概率性产物纳入证据、权限和回滚边界。", 1360)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideReliabilityV02(slide, index) {
  const body = `
    ${v5Header("02 / 关键机制", "概率过程，证据放行", "允许 Agent 多路径探索，但把放行收敛到可复现证据和阶段门禁。", 66)}
    <rect x="96" y="372" width="510" height="328" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="146" y="430" class="small5" style="fill:${L.blue};font-weight:900">01 / 概率探索层</text>
    <text x="146" y="492" class="num5" style="font-size:42px">允许过程多路径</text>
    ${v02Lines(["沙箱执行 / 权限控制", "危险操作拦截 / 失败回注", "trace 用于复现，不让人逐步盯操作"], 146, 568, 23, L.muted, 34, 680)}

    <path d="M628 536 H690" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <rect x="708" y="344" width="504" height="384" rx="22" fill="${L.paper}" stroke="${L.blue}" stroke-width="3" filter="url(#paperShadow)"/>
    <text x="960" y="408" class="small5" text-anchor="middle" style="fill:${L.blue};font-weight:900">02 / 证据包</text>
    <text x="960" y="458" class="num5" text-anchor="middle" style="font-size:42px;fill:${L.ink}">把过程压缩成</text>
    <text x="960" y="514" class="num5" text-anchor="middle" style="font-size:42px;fill:${L.ink}">人能判断的对象</text>
    <rect x="770" y="556" width="380" height="70" rx="12" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="572" class="small5" text-anchor="middle" style="font-size:23px;fill:${L.ink};font-weight:860">diff / 测试 / 日志 / 风险 / 回滚</text>
    <rect x="806" y="636" width="308" height="52" rx="26" fill="#FFF6EE" stroke="${L.orange}" stroke-width="2"/>
    <text x="960" y="644" class="num5" text-anchor="middle" style="font-size:31px;fill:${L.orange}">0.99^10 ≈ 0.90</text>
    <text x="960" y="704" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.muted};font-weight:720">长链路需要阶段性纠偏</text>

    <path d="M1234 536 H1294" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <rect x="1314" y="372" width="510" height="328" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="1364" y="430" class="small5" style="fill:${L.orange};font-weight:900">03 / 阶段门禁</text>
    <text x="1364" y="492" class="num5" style="font-size:42px">只在转换点放行</text>
    ${v02Lines(["计划 → 实现：目标和边界", "实现 → 评审：契约、测试、owner", "评审 → 合并：风险、回滚、责任"], 1364, 568, 23, L.muted, 34, 680)}

    <rect x="214" y="768" width="1492" height="104" rx="16" fill="${L.paper}" stroke="${L.line2}" stroke-width="2"/>
    ${reliabilityGate(282, 806, "A", "交付对象", "需求、接口、代码、测试")}
    ${reliabilityGate(626, 806, "B", "放行证据", "构建、运行、评审、风险")}
    ${reliabilityGate(970, 806, "C", "判断辅助", "摘要、来源、差异、不一致")}
    ${reliabilityGate(1314, 806, "D", "责任边界", "owner、审批、回滚路径")}
    ${v02Takeaway("新的工程确定性：过程可以概率探索，结果必须以证据、门禁和责任确定放行。", 1380)}
  `;
  return svgBaseV5(slide, index, body);
}

function reliabilityGate(x, y, n, titleValue, desc) {
  return `
    <circle cx="${x}" cy="${y + 18}" r="19" fill="${L.blue}" opacity="0.12"/>
    <text x="${x}" y="${y + 6}" class="small5" text-anchor="middle" style="font-size:20px;fill:${L.blue};font-weight:900">${esc(n)}</text>
    <text x="${x + 36}" y="${y - 2}" class="label5" style="font-size:27px">${esc(titleValue)}</text>
    <text x="${x + 36}" y="${y + 40}" class="small5" style="font-size:22px;fill:${L.muted};font-weight:720">${esc(desc)}</text>
  `;
}

function slideExternalSignalsV02(slide, index) {
  const body = `
    ${v5Header("02 / 外部信号", "速度收益不是指数曲线", "AI 提升局部产出，但验证、评审、修复与集成会重新分配收益。", 66)}
    ${v02Panel(92, 390, 560, 260, "cube", "DORA：AI 是放大器", ["80%+ 受访者感到生产力提升；", "组织文化、流程和系统决定能否放大收益；", "碎片化组织也会被 AI 放大弱点。"], L.blue, "组织层")}
    ${v02Panel(680, 390, 560, 260, "loop", "METR：熟悉代码库未必更快", ["2025 RCT：熟悉项目中使用早期 AI", "工具反而慢 19%；", "多 Agent 时代让测量更难。"], L.orange, "任务层")}
    ${v02Panel(1268, 390, 560, 260, "team", "Harness：隐形工作增加", ["81% 认为 review 时间增加；", "约 31% 时间进入 review、修 bug、工具切换；", "传统指标难以捕获这些工作。"], L.blue, "团队层")}
    <rect x="220" y="730" width="1480" height="110" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="754" class="label5" text-anchor="middle">关键转向</text>
    <text x="960" y="804" class="small5" text-anchor="middle" style="font-size:25px">从“AI 写了多少代码”转向“从需求到可验证结果的净时间、返工率、评审压力和线上风险”。</text>
    ${v02Takeaway("速度指标要和质量、协作、风险一起看，否则局部提速会在下游变成隐形成本。", 1400)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideLifecycleV02(slide, index) {
  const body = `
    ${v5Header("02 / 质量责任", "速度放大之后，质量责任被重新定义", "代码很多，但评审、测试、追溯和长期维护不一定同步跟上。", 64)}
    <rect x="154" y="404" width="1612" height="394" rx="20" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <path d="M557 404 V798 M960 404 V798 M1363 404 V798" stroke="${L.line2}" stroke-width="2" stroke-dasharray="10 10"/>
    ${v5Icon("check", 315, 468, 70, L.blue)}
    <text x="355" y="560" class="label5" text-anchor="middle" style="font-size:32px">功能能跑</text>
    ${v02Lines(["只是 happy path 成立", "边界与异常仍需证明"], 355, 616, 23, L.muted, 32, 650, "middle")}
    ${v5Icon("file", 718, 468, 70, L.blue)}
    <text x="758" y="560" class="label5" text-anchor="middle" style="font-size:32px">设计沉淀</text>
    ${v02Lines(["变更理由要留下", "否则后续协作断层"], 758, 616, 23, L.muted, 32, 650, "middle")}
    ${v5Icon("team", 1121, 468, 70, L.orange)}
    <text x="1161" y="560" class="label5" text-anchor="middle" style="font-size:32px">团队共识</text>
    ${v02Lines(["个人 + Agent 很快", "团队理解未必同步"], 1161, 616, 23, L.muted, 32, 650, "middle")}
    ${v5Icon("loop", 1524, 468, 70, L.orange)}
    <text x="1564" y="560" class="label5" text-anchor="middle" style="font-size:32px">修复证据</text>
    ${v02Lines(["不能只凭自信 patch", "要复现、验证、回归"], 1564, 616, 23, L.muted, 32, 650, "middle")}
    <rect x="500" y="812" width="920" height="70" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="831" class="body5" text-anchor="middle" style="font-size:30px"><tspan style="fill:${L.blue};font-weight:900">工程确定性</tspan><tspan> = 可复现 / 可审查 / 可回滚 / 可解释</tspan></text>
    ${v02Takeaway("质量责任从“我写完了”，升级为“我能证明它可以进入系统”。", 1200)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideQualityV02(slide, index) {
  const body = `
    ${v5Header("03 / 工程质量与治理", "从门禁到智能护栏", "开源重公共责任，大厂重复杂交付；共同核心是责任链和证据链。", 66)}
    <rect x="128" y="420" width="520" height="312" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="188" y="478" class="small5" style="fill:${L.blue};font-weight:900">开源高质量要求</text>
    <text x="188" y="536" class="num5" style="font-size:40px">维护者要验证海量变更</text>
    ${v02Lines(["贡献者对提交负责", "维护者看方向、可读性、测试、长期演进", "核心问题：如何提升对提交代码质量", "的信任度"], 188, 604, 23, L.muted, 31, 650)}
    <rect x="1272" y="420" width="520" height="312" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="1332" y="478" class="small5" style="fill:${L.orange};font-weight:900">大厂复杂交付</text>
    <text x="1332" y="536" class="num5" style="font-size:40px">跨团队看确定性工件</text>
    ${v02Lines(["需求 / 设计 / API / SLO / 证据", "Artifact 贯穿计划、实现、发布与复盘", "核心问题：哪些产物必须稳定可追踪"], 1332, 604, 23, L.muted, 34, 650)}
    <circle cx="960" cy="590" r="166" fill="${L.bg}" stroke="${L.line2}" stroke-width="3"/>
    <text x="960" y="514" class="num5" text-anchor="middle" style="font-size:38px;fill:${L.blue}">责任链</text>
    <text x="960" y="582" class="num5" text-anchor="middle" style="font-size:38px;fill:${L.ink}">证据链</text>
    <text x="960" y="650" class="num5" text-anchor="middle" style="font-size:38px;fill:${L.orange}">Artifact 链</text>
    <path d="M648 576 H782" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <path d="M1138 576 H1272" stroke="${L.orange}" stroke-width="5" fill="none" marker-end="url(#arrowGray)"/>
    <rect x="300" y="805" width="1320" height="92" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="830" class="body5" text-anchor="middle" style="font-size:30px">小批量、强证据、可回滚，是抵消 AI 大规模变更不确定性的工程底座。</text>
    ${v02Takeaway("质量治理的核心不是多一道审批，而是每个小变更都带着责任、证据和稳定工件前进。", 1500)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideFutureQualityV02(slide, index) {
  const body = `
    ${v5Header("03 / 方法演进", "让 DFX 与 TDD 变成 Agent 协议", "未来的护栏不是文档清单，而是可执行、可追踪、可复用的工程契约。", 64)}
    ${v02Panel(100, 390, 560, 250, "shield", "DFX：从清单到控制面", ["性能、安全、可观测、可维护", "进入检查项、基准、trace、发布预算。"], L.blue, "工程约束")}
    ${v02Panel(680, 390, 560, 250, "check", "TDD：从用例到证据接口", ["先定义失败证据和验收边界，", "再让 Agent 在边界内生成和修复。"], L.orange, "验证范式")}
    ${v02Panel(1260, 390, 560, 250, "file", "Code Rules：工具化", ["规则仍会被幻觉绕过，", "要拆成更细的可检查约束。"], L.blue, "规则治理")}
    <path d="M330 696 C540 770 762 750 960 694 S1356 624 1590 706" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    <rect x="402" y="770" width="1116" height="76" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="792" class="small5" text-anchor="middle" style="font-size:26px;font-weight:900">DFX、TDD、Review 将从人的流程习惯，变成 Agent 可执行的工程协议。</text>
    ${v02Takeaway("下一代工程方法会把“质量要求”变成 Agent 可以读取、执行、产证据的契约。", 1400)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideBitfunV02(slide, index) {
  const body = `
    ${v5Header("03 / BitFun 缩影", "把开发过程组织成团队工作流", "从 Issue 到 PR，不是聊天产物堆叠，而是交付对象、证据包和阶段门禁。", 62)}
    <path d="M600 490 H690" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M1190 490 H1280" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    <path d="M1530 584 V620 H770 V636" stroke="${L.orange}" stroke-width="5" fill="none" marker-end="url(#arrowGray)" opacity="0.88"/>
    <path d="M1020 740 H1100" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    ${workflowStepV02(100, 390, "01", "Issue / Spec", "目标与边界", ["目标、非目标、风险", "验收标准先写清"], L.blue, "file")}
    ${workflowStepV02(690, 390, "02", "Agent Worktree", "隔离执行", ["独立环境探索", "避免污染主分支"], L.orange, "terminal")}
    ${workflowStepV02(1280, 390, "03", "Evidence Packet", "证据包", ["diff 摘要、测试、日志", "trace、风险、回滚路径"], L.blue, "check")}
    ${workflowStepV02(520, 642, "04", "Independent Review", "独立评审", ["发现 / 仲裁分离", "修复后重新验证"], L.orange, "team")}
    ${workflowStepV02(1100, 642, "05", "Gate / Merge", "阶段放行", ["PR、合并、发布", "责任归属可追踪"], L.blue, "shield")}
    <rect x="350" y="854" width="1220" height="50" rx="14" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="866" class="small5" text-anchor="middle" style="font-size:22px;fill:${L.ink};font-weight:900">每个小变更都带着稳定 Artifact、风险摘要和可复核证据前进。</text>
    ${v02Takeaway("BitFun 的价值不是某个功能，而是把 AI 开发从聊天结果推进到团队可治理的交付流。", 1460)}
  `;
  return svgBaseV5(slide, index, body);
}

function slideRoleV02(slide, index) {
  const body = `
    ${v5Header("04 / 开发者角色", "在新工程系统中找准位置", "人承担目标、边界、证据和责任；AI 承担生成、检索、运行和反馈。", 64)}
    <rect x="120" y="408" width="404" height="402" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="562" y="452" width="404" height="402" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="1004" y="408" width="404" height="402" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <rect x="1416" y="452" width="404" height="402" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    ${roleColumnV02(120, 408, "01", "定义问题", "价值、边界、风险", "信息整理、备选方案", L.blue)}
    ${roleColumnV02(562, 452, "02", "组织上下文", "架构取舍、事实源", "检索、摘要、计划草案", L.blue)}
    ${roleColumnV02(1004, 408, "03", "编排执行", "权限、节奏、验证矩阵", "生成、运行、反馈", L.orange)}
    ${roleColumnV02(1416, 452, "04", "证据放行", "责任、解释、复盘", "trace、diff、测试", L.orange)}
    <path d="M510 604 H548 M952 648 H990 M1394 604 H1402" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)"/>
    ${v02Takeaway("关键不是“谁替代谁”，而是人在目标、边界、证据、责任上站稳。", 1400)}
  `;
  return svgBaseV5(slide, index, body);
}

function roleColumnV02(x, y, n, titleValue, humanText, aiText, color) {
  const w = 404;
  return `
    <text x="${x + 36}" y="${y + 34}" class="num5" style="font-size:44px;fill:${color}">${esc(n)}</text>
    <text x="${x + 36}" y="${y + 100}" class="label5" style="font-size:32px">${esc(titleValue)}</text>
    <path d="M${x + 36} ${y + 164} H${x + 320}" stroke="${L.line2}" stroke-width="3"/>
    <rect x="${x + 36}" y="${y + 202}" width="66" height="34" rx="17" fill="${L.blue}" opacity="0.12"/>
    <text x="${x + 69}" y="${y + 209}" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.blue};font-weight:900">人</text>
    <text x="${x + 118}" y="${y + 207}" class="small5" style="font-size:24px;fill:${L.ink};font-weight:820">${esc(humanText)}</text>
    <path d="M${x + 36} ${y + 266} H${x + w - 44}" stroke="${L.line2}" stroke-width="2"/>
    <rect x="${x + 36}" y="${y + 300}" width="66" height="34" rx="17" fill="${L.orange}" opacity="0.13"/>
    <text x="${x + 69}" y="${y + 307}" class="small5" text-anchor="middle" style="font-size:21px;fill:${L.orange};font-weight:900">AI</text>
    <text x="${x + 118}" y="${y + 305}" class="small5" style="font-size:24px;fill:${L.ink};font-weight:820">${esc(aiText)}</text>
    <circle cx="${x + w - 70}" cy="${y + 76}" r="28" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    ${v5Icon(n === "01" ? "chat" : n === "02" ? "file" : n === "03" ? "terminal" : "check", x + w - 88, y + 58, 36, color)}
  `;
}

function slidePredictionV02(slide, index) {
  const body = `
    ${v5Header("04 / 前瞻判断", "三个未来判断", "最后只带走三件事：指标、角色、协议都会被重写。", 66)}
    <path d="M430 740 C620 820 820 790 960 730 S1290 662 1490 760" stroke="${L.blue}" stroke-width="5" fill="none" marker-end="url(#arrowBlue)" opacity="0.88"/>
    ${predictionCardV02(120, 430, "01", "指标重写", ["从代码量转向净收益：", "交付时间、返工率、评审负担、", "线上风险与知识沉淀。"], L.blue)}
    ${predictionCardV02(700, 372, "02", "角色分化", ["开发者会更像 owner：", "定义目标、组织上下文、", "审查证据与承担责任。"], L.orange)}
    ${predictionCardV02(1280, 430, "03", "工程协议", ["TDD / DFX / Review", "会变成 Agent 可读取、", "可执行、可产证据的协议。"], L.blue)}
    <rect x="402" y="812" width="1116" height="92" rx="16" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="960" y="840" class="body5" text-anchor="middle" style="font-size:31px">未来的核心能力：把 AI 从 demo 推向可验证、可治理、可协作的交付系统。</text>
    ${v02Takeaway("谁能把工程协议做成系统能力，谁就更接近 AI 时代的可靠交付。", 1180)}
  `;
  return svgBaseV5(slide, index, body);
}

function predictionCardV02(x, y, n, titleValue, lines, color) {
  return `
    <rect x="${x}" y="${y}" width="520" height="250" rx="18" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="${x + 38}" y="${y + 34}" class="num5" style="font-size:44px;fill:${color}">${esc(n)}</text>
    <text x="${x + 38}" y="${y + 100}" class="label5" style="font-size:32px">${esc(titleValue)}</text>
    ${v02Lines(lines, x + 38, y + 154, 24, L.muted, 34, 650)}
  `;
}

function slideThanksV02(slide, index) {
  const body = `
    <text x="96" y="150" class="small5" style="fill:${L.blue};font-weight:900">THANKS / Q&amp;A</text>
    <text x="96" y="246" class="h15" style="font-size:90px">谢谢</text>
    <path d="M96 386 h150" stroke="${L.blue}" stroke-width="9" stroke-linecap="round"/>
    <circle cx="276" cy="386" r="6" fill="${L.orange}"/>
    <rect x="170" y="500" width="1580" height="340" rx="22" fill="${L.paper}" stroke="${L.line2}" stroke-width="2" filter="url(#paperShadow)"/>
    <text x="240" y="568" class="label5" style="font-size:33px">可以继续讨论的两个问题</text>
    <text x="240" y="640" class="body5" style="font-size:30px">1. AI 扩大个人产出后，团队该用什么指标判断真实收益？</text>
    <text x="240" y="716" class="body5" style="font-size:30px">2. 执行过程允许概率性时，哪些证据必须保持确定性？</text>
    <text x="240" y="790" class="body5" style="font-size:28px;fill:${L.muted}">开发者技能方向：架构判断、上下文组织、证据设计、工程治理。</text>
    <rect x="1090" y="238" width="470" height="178" rx="18" fill="${L.bg}" stroke="${L.line2}" stroke-width="2"/>
    <text x="1144" y="286" class="num5" style="font-size:56px;fill:${L.blue}">Q&amp;A</text>
    ${v5Icon("chat", 1424, 292, 86, L.blue)}
    ${v02Takeaway("AI 编程、工程治理、开发者角色", 900, 908)}
  `;
  return svgBaseV5(slide, index, body);
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
    slide.addNotes(`第 ${i + 1} 页：${slides[i].title}\n\n建议时长：${slides[i].time}\n\n页内重点：${slides[i].focus}\n\n互动提问：${slides[i].question}\n\n讲稿：${slides[i].script}\n\n转场：${slides[i].transition}`);
  });

  await pptx.writeFile({ fileName: pptxPath });
}

function writeNotes() {
  const linesOut = [];
  linesOut.push("# AI 如何重新定义软件开发：分页演讲稿");
  linesOut.push("");
  linesOut.push(`建议时长：15 分钟。建议页数：${slides.length} 页。PPT 每页采用整页图片式设计，适合直接投屏演讲。`);
  linesOut.push("");
  linesOut.push("## 报告简介");
  linesOut.push("");
  linesOut.push(intro);
  linesOut.push("");
  linesOut.push("## 可引用调研");
  linesOut.push("");
  linesOut.push("- Google / DORA 2025（https://blog.google/innovation-and-ai/technology/developers-tools/dora-report-2025/）：80% 以上受访者认为 AI 提升生产力，59% 认为代码质量改善；但报告同时提出 trust paradox，并强调 AI 是组织的 mirror and multiplier，采用工具之外还需要文化、流程和系统演进。");
  linesOut.push("- DORA GenAI report 2025.2（https://dora.dev/ai/gen-ai-report/dora-impact-of-generative-ai-in-software-development.pdf）：报告提醒新技术采用可能带来短期生产率下降，也指出 AI 提高代码生成速度后，小批量、稳健测试等基本工程原则更重要。");
  linesOut.push("- METR Early-2025 RCT（https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf）：16 位成熟开源开发者在熟悉项目中完成 246 个真实任务，使用当时 AI 工具后任务耗时增加 19%，适合作为“大型复杂工程收益不线性”的反例。");
  linesOut.push("- METR 2026 update（https://metr.org/blog/2026-02-24-uplift-update/）：METR 提醒多 Agent 并行和开发者不愿脱离 AI 等因素会让 AI 生产率测量本身变得更难，适合引出“指标重写”。");
  linesOut.push("- Harness State of Engineering Excellence 2026（https://www.harness.io/press-and-news/ai-has-outpaced-how-engineering-organizations-measure-developer-productivity）：81% 受访者认为采用 AI coding tools 后 code review 时间增加，约 31% 开发者时间进入 review、修 bug、工具切换等隐形工作。");
  linesOut.push("- Harness DevOps Modernization 2026（https://www.harness.io/state-of-modernization-2026）：频繁使用 AI coding 的团队同时报告部署问题、回滚/热修复、MTTR、合规和性能压力等下游挑战，适合支撑“速度要与风险一起衡量”。");
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
  linesOut.push("- SWE-PRBench（https://arxiv.org/abs/2603.26130）：350 个 PR 的 AI code review benchmark 显示，前沿模型只能发现部分人类标注问题，支持“AI 评审是证据输入，不是最终裁决”。");
  linesOut.push("- AgentTrace（https://arxiv.org/abs/2602.10133）：提出 structured logging 框架，捕获 operational、cognitive、contextual 三类 trace，用于安全、问责、风险分析和信任校准。");
  linesOut.push("- OpenAI, A Practical Guide to Building Agents（https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf）：强调模型、工具、指令和 guardrails 是 Agent 基础构件，并建议以 evals 建立性能基线、按任务选择模型。");
  linesOut.push("- AgentOps: Enabling Observability of LLM Agents（https://arxiv.org/abs/2411.05285）：从 DevOps 视角提出 AgentOps taxonomy，强调要追踪 Agent 全生命周期中的 artifacts 和 associated data，支撑监控、日志、分析和安全。");
  linesOut.push("- Fine-Grained Appropriate Reliance（https://arxiv.org/abs/2501.10909）：多步透明决策工作流在复杂任务中能帮助用户在中间步骤层面校准对 AI 的依赖，适合支撑“人看阶段性证据，而不是只看最终答案”。");
  linesOut.push("- Fostering Appropriate Reliance on LLMs（https://arxiv.org/abs/2502.08554）：CHI 2025 研究发现，解释会同时增加对正确和错误回答的依赖；提供来源或暴露解释中的不一致更能降低对错误回答的过度依赖，适合支撑“判断辅助要突出来源、差异和不一致”。");
  linesOut.push("- Designing meaningful human oversight in AI（https://link.springer.com/article/10.1007/s43681-026-01147-7）：提出 AI 负责执行性 agency，人类负责验证、 steering 和 substitution 的 evaluative agency，强调人类监督不能沦为 rubber stamp。");
  linesOut.push("- SAA: visualization-based software analytics（https://www.sciencedirect.com/science/article/pii/S0164121225002584）：通过软件 Artifact traceability graph 和交互式可视化辅助软件过程分析与决策，适合支撑“Artifact 关系图 + 人类可读视图”。");
  linesOut.push("- Cloudsmith 2026 Artifact Management Report 报道（https://www.itpro.com/software/development/developers-are-slacking-on-ai-generated-code-safety-heres-why-it-could-come-back-to-haunt-them）：AI 生成代码使用快速增长，但只有少数组织用传统制品同等级别的安全策略和 provenance tracking 管理代码、依赖和发布产物，提示 Artifact 治理正在成为工程风险点。");
  linesOut.push("");
  linesOut.push("## 分页讲稿");
  linesOut.push("");
  slides.forEach((slide, i) => {
    linesOut.push(`### 第 ${i + 1} 页：${slide.title}`);
    linesOut.push("");
    linesOut.push(`- 建议时长：${slide.time}`);
    linesOut.push(`- 页内重点：${slide.focus}`);
    linesOut.push(`- 互动提问：${slide.question}`);
    linesOut.push("");
    linesOut.push("屏幕信息：");
    linesOut.push("");
    linesOut.push(`本页以“${slide.section}”为视觉段落，围绕标题“${slide.title}”展开。`);
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

本目录保留原版演讲材料，并新增 V0.2 版本。V0.2 继续使用整页图片式 PPT，重点增强案例引导、外部调研依据、工程治理和开发者角色映射。

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

- \`ai-redefines-software-development-v0.2.pptx\`：V0.2 演讲用 PPTX，${slides.length} 页。
- \`speaker-notes-v0.2.md\`：V0.2 分页讲稿，按约 15 分钟节奏扩展。
- \`slides-png-v0.2/\`：V0.2 逐页 SVG 与 PNG。
- \`preview-contact-sheet-v0.2.png\`：V0.2 缩略总览。
- \`build-deck-v0.2.cjs\`：V0.2 可复现生成脚本。

重新生成 V0.2：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck-v0.2.cjs
\`\`\`

V0.2 主线：BitFun 的高速 AI 开发经验 -> 代码量膨胀后的真实问题 -> 产出放大后的协作对象变化 -> 概率过程与证据放行 -> 外部调研中的生产率悖论 -> 质量责任、DFX、TDD 与团队交付流 -> 开发者在新工程系统中的关键位置。
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
