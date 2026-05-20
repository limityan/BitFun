const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pptxgen = require("pptxgenjs");

const outDir = __dirname;
const slidesDir = path.join(outDir, "slides-png");
const pptxPath = path.join(outDir, process.env.PPTX_FILE || "ai-redefines-software-development.pptx");
const notesPath = path.join(outDir, "speaker-notes.md");
const readmePath = path.join(outDir, "README.md");
const contactSheetPath = path.join(outDir, "preview-contact-sheet.png");

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
    focus: "正式首页：标题、演讲者和报告定位。",
    question: "AI 时代的软件开发，变化最大的究竟是什么？",
    script:
      "各位好，今天分享的主题是《AI 如何重新定义软件开发》。这不是一场工具介绍，也不是 BitFun 的项目复盘，而是想借 BitFun 这个引子，讨论 AI 从代码补全走向 Agentic Coding 之后，对软件开发全生命周期、工程治理方式和开发者角色带来的变化。",
    transition: "先用目录把 15 分钟的内容收敛成几个大的主题。",
    render: slideTitleV5,
  },
  {
    section: "AGENDA",
    title: "报告目录",
    subtitle: "四个主题串起软件工程的新变化",
    time: "约 0.5 分钟",
    focus: "目录页：用 4 个主题串起后续内容。",
    question: "这 15 分钟，我们围绕哪些问题展开？",
    script:
      "这场报告会按四个问题域展开。第一，先建立主线并用 BitFun 打开问题；第二，看 AI 如何放大产能和探索速度；第三，讨论速度背后的质量责任和工程护栏；第四，回到 BitFun 缩影、高校听众的角色变化，并在最后进入答疑互动。",
    transition: "先从这场报告最核心的一句话开始。",
    render: slideAgendaV5,
  },
  {
    section: "MAIN THREAD",
    title: "从写代码，到组织智能协作系统",
    subtitle: "软件工程对象正在扩大",
    time: "约 1.5 分钟",
    focus: "主题一：建立全局主线，说明软件工程对象正在扩大。",
    question: "AI 重新定义软件开发，究竟改变的是代码，还是开发过程本身？",
    script:
      "各位好，今天这场报告不做工具排行，也不展开 BitFun 的实现细节。报告的主线很简单：AI 重新定义软件开发，不只是因为它能更快生成代码，而是因为它正在改变软件工程的基本对象。过去我们关注代码、函数和文件；现在还要关注任务、上下文、工具、权限、验证、反馈、人类监督和组织流程。对高校听众来说，最值得关注的也不是一句“AI 会不会取代程序员”，而是未来的软件人才需要如何重新定义自己的能力结构。",
    transition: "下一页用 BitFun 的高速 AI 开发现象打开问题，但不会把它讲成产能宣传。",
    render: slideCoverV5,
  },
  {
    section: "CAPACITY SHOCK",
    title: "xx w+ 行代码之后，问题真的变少了吗？",
    subtitle: "AI 首先改变的是速度、风险和组织方式如何被重新分配。",
    time: "约 2 分钟",
    focus: "开场案例：用 BitFun 一个月 xx w+ 行代码引出产能放大后的工程问题。",
    question: "如果一个项目一个月写出 xx w+ 行代码，我们应该先兴奋，还是先紧张？",
    script:
      "先看一个现象：如果一个项目借助 AI，一个月可以产出 xx w+ 行代码，我们应该先兴奋，还是先紧张？这里不要把数字讲成产能宣传，而要把它讲成问题入口。代码写得更快，是否意味着产品更快成熟？需求改得更频繁，是否意味着方向更灵活，还是更容易失控？团队协作变少，是否意味着效率更高，还是质量检查被省略？如果进入开源高质量协作或复杂组织交付，还缺什么？这页的核心判断是：AI 首先改变的不是“代码怎么写”，而是软件开发的速度、风险和组织方式如何被重新分配。",
    transition: "接下来先讲 AI 的正面价值：探索变快，变化也变快。",
    render: slideShockV5,
  },
  {
    section: "EXPLORATION SPEED",
    title: "AI 先改变探索方式",
    subtitle: "从排期驱动到想法驱动，但真正交付仍要回到证据驱动。",
    time: "约 1.5 分钟",
    focus: "说明 AI 对原型验证、需求变化和个人探索的真实收益。",
    question: "如果一周做完原型，老板真正会追问速度，还是上线证据？",
    script:
      "AI 对早期研发最大的改变，是把很多探索从排期驱动变成想法驱动。过去一个想法需要进入 backlog、排人、评估成本；现在一个人和 Agent 就能快速做出可运行版本。这对学生项目、科研原型、内部创新都很有价值：原型更快，需求更灵活，探索成本更低，很多过去不值得排期的想法可以被验证。但这里有一个边界：AI 主要解决探索速度，不自动解决质量责任。真实工程最终仍要回到证据驱动。",
    transition: "当速度进入真实工程链路，AI 就不再只是代码补全。",
    render: slideExplorationV5,
  },
  {
    section: "QUALITY BACKSIDE",
    title: "速度的背面：质量责任被重新定义",
    subtitle: "代码很多，但评审、测试、追溯和长期维护不一定同步跟上。",
    time: "约 2 分钟",
    focus: "大纲第 4 页：速度放大之后，解释质量责任、追溯、协作和长期维护缺口。",
    question: "AI 生成的代码能跑之后，距离可合并、可发布、可长期维护还差什么？",
    script:
      "速度放大之后，新的问题会出现。非商用探索阶段，很多问题可以暂时接受：功能能跑，但边界不一定稳定；需求变化很快，但设计决策不一定沉淀；代码很多，但评审和测试不一定跟上；一个人推进很快，但知识可能没有进入团队流程；Agent 能修问题，但修复依据可能来自模型自信，而不是外部证据。这里也能引出概率性和确定性的关系：AI 生成过程允许多路径探索，但软件工程的放行依据必须是可复现、可审查、可回滚的确定性证据。",
    transition: "走出个人探索之后，会出现两类不同的高质量要求。",
    render: slideLifecycleV5,
  },
  {
    section: "QUALITY FRONTIERS",
    title: "高质量不是一个标准",
    subtitle: "开源高质量协作和大厂复杂交付，面对的是两类不同责任。",
    time: "约 2.5 分钟",
    focus: "把单一高质量要求拆成开源公共责任和复杂组织交付责任。",
    question: "AI 生成的代码通过单测后，距离合并和上线还差什么？",
    script:
      "这里要特别区分两个方向。第一类是开源高质量协作，它不一定是商用，但有公共责任。开发者要对提交负责，维护者要验证陌生人或 AI-assisted contributor 的大规模变更是否可读、可测、可维护、符合项目方向。第二类是大厂复杂交付，问题不是多跑几个测试，而是跨团队 owner、依赖链、合规、发布窗口、线上故障成本。AI 让改动来得更快，但组织要回答：谁负责，哪些证据可以放行，失败后如何回滚和复盘。",
    transition: "所以成熟做法会围绕责任、证据和可追踪性来设计。",
    render: slideQualityV5,
  },
  {
    section: "ENGINEERING RESPONSES",
    title: "成熟补法：让快速变化进入工程护栏",
    subtitle: "代码检视、架构稳定性、性能看护和发布风险控制共同接住 AI 产出。",
    time: "约 2.5 分钟",
    focus: "大纲第 6 页：以解决问题的方式讲成熟工程补法，不单独平铺术语。",
    question: "Finish 是一句“我完成了”，还是一组外部证据？",
    script:
      "成熟补法不要讲成术语列表，而要讲成四类工程能力。第一是代码检视与质量门禁，让“完成”绑定测试、CI、review finding、代码扫描和依赖审查。第二是架构稳定性与设计治理，因为 AI 很容易局部最优地补一段代码，却破坏长期边界，所以需要 ADR、RFC、依赖边界检查、模块 owner 和架构守护测试。第三是性能看护，用 benchmark、performance budget、profiling 和可观测数据发现退化。第四是发布风险控制，包括 feature flag、canary、灰度、SLO、error budget 和回滚。它们共同把概率性的中间产物，接回确定性的工程证据。",
    transition: "这也是为什么 BitFun 可以作为一个缩影，而不只是一个聊天壳。",
    render: slideResponsesV5,
  },
  {
    section: "BITFUN AS LENS",
    title: "BitFun 的价值：不是项目细节，而是四个问题",
    subtitle: "把 AI 开发从会生成推进到可计划、可取证、可审查、可沉淀。",
    time: "约 1.5 分钟",
    focus: "回扣 BitFun，用四个工作流解释 Agent Runtime 的工程意义。",
    question: "一次失败只是修一个 bug，还是沉淀成下一版工作流？",
    script:
      "回到 BitFun，它在这里不是要展示项目细节，而是作为缩影。Planning 对应快速变化的需求，需要先探索和计划。Evidence 对应调试不能只凭模型自信，需要日志、复现和证据。Review 对应执行者、审查者和仲裁者要分离。Self-iteration 对应一次失败不只是修一段代码，而要沉淀成下一版工作流。它们共同指向一个判断：AI 工具未来不是更会聊天，而是把开发过程组织成可验证、可追踪、可治理的工程系统。",
    transition: "最后，把这个变化落到学生、研究生和高校教师最关心的角色变化。",
    render: slideBitfunV5,
  },
  {
    section: "ROLE SHIFT",
    title: "从会写代码，到会组织智能协作系统",
    subtitle: "未来优秀的软件人才，不只是会写程序，而是会设计人与 AI Agent 共同工作的工程系统。",
    time: "约 1.5 分钟",
    focus: "面向高校听众收束：编程基础仍重要，但能力结构会升级。",
    question: "如果 AI 能完成大部分编程作业，编程课还应该训练什么？",
    script:
      "最后回到大家最关心的问题：AI 会不会替代程序员？更准确的说法是，开发者的能力结构正在改变。过去我们强调写代码、熟悉 API、修 bug、实现功能；AI 时代这些仍然重要，但不够了。工程师还要定义任务、组织上下文、设计验证闭环、编排 Agent 和工具、维护系统演进与质量边界。对学生来说，编程基础仍然重要，因为你要能判断 AI 写得对不对；对老师来说，评价也会从代码能不能跑，扩展到学生能否定义问题、选择工具、验证结果、解释风险。",
    transition: "这里可以进入 Q&A，围绕课程教学、开源协作或企业研发流程展开。",
    render: slideRoleV5,
  },
  {
    section: "THANKS AND Q&A",
    title: "谢谢",
    subtitle: "答疑互动：AI 编程、工程治理、开发者角色",
    time: "Q&A",
    focus: "致谢页，并明确进入答疑互动环节。",
    question: "围绕 AI 编程、工程治理和开发者角色继续讨论。",
    script:
      "以上就是今天的主要内容。最后留一个互动问题：如果 AI 能让个人产能接近一个小团队，团队协作、质量责任和课程评价应该如何重新设计？接下来进入答疑互动，围绕 AI 编程、工程治理和开发者角色继续交流。",
    transition: "答疑互动。",
    render: slideThanksV5,
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
  const paths = [];
  for (let i = 0; i < slides.length; i += 1) {
    const svg = slides[i].render(slides[i], i);
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
  linesOut.push("- Microsoft Research / GitHub Copilot controlled experiment（https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot/）：AI pair programmer 在局部编码任务中让 treatment group 完成速度提升 55.8%，适合作为“局部编码更快”的依据。");
  linesOut.push("- Google Cloud DORA 2025（https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report）：AI adoption 与软件交付吞吐、产品表现出现正相关，但仍与交付稳定性存在负相关，适合作为“收益不是单一维度”的依据。");
  linesOut.push("- Harness State of Engineering Excellence 2026（https://www.harness.io/press-and-news/ai-has-outpaced-how-engineering-organizations-measure-developer-productivity）：81% 受访者认为采用 AI coding tools 后 code review 时间增加，适合作为“隐性工作与验证成本上升”的依据。");
  linesOut.push("- METR 2025 RCT（https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/）：在成熟开源仓库中，经验开发者使用早期 2025 AI 工具完成任务反而慢 19%，适合作为“大型复杂工程收益不线性”的反例。");
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

本目录包含一份 15 分钟演讲用 PPTX、分页演讲稿和逐页图片预览。

- \`ai-redefines-software-development.pptx\`：演讲用 PPTX，${slides.length} 页，每页为整页图片式设计。
- \`speaker-notes.md\`：按页分页的讲稿、页内重点、互动提问和转场。
- \`slides-png/\`：每一页导出的 SVG 与 PNG，可用于单页预览或二次编辑。
- \`preview-contact-sheet.png\`：8 页缩略总览。
- \`build-deck.cjs\`：可复现生成脚本。

重新生成：

\`\`\`powershell
node .\\docs\\report\\ai-redefines-software-development-presentation\\build-deck.cjs
\`\`\`

报告主线保持为：BitFun 的高速 AI 开发现象 -> 探索变快与变化变快 -> 质量责任被重新定义 -> 开源高质量协作与大厂复杂交付 -> code review、架构稳定性、性能看护和发布控制 -> BitFun 作为 Planning / Evidence / Review / Self-iteration 缩影 -> 开发者角色从写代码转向组织智能协作系统。
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
