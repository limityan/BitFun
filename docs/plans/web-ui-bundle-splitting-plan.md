# Web UI 打包拆分与体验保护计划

> 执行约定：本文是分阶段设计与执行计划。开始改产品代码前，必须先重新测量当前基线，并确认对应阶段的保护门槛。每个阶段都必须能独立回滚。

**目标：** 降低 Web UI 主包中“意外进入首包”的依赖体积，同时不牺牲 BitFun 桌面端常用操作体验。

**最高优先级：** 体验优先于包体大小。若某个优化会让常用操作出现明显变慢、闪烁、空白、交互延迟或可靠性下降，应保留 eager 路径或加入明确 preload；即使这会导致总包体不如理论最小值，也应优先保证体验。

**非目标：** 不通过修改 `chunkSizeWarningLimit` 消除告警。告警只能因为依赖图被收窄、包组织更合理、缓存更稳定而自然缓解；如果仍有真实热点，告警应继续存在。

---

## 1. 当前证据

当前 Web UI 构建产物明显集中在一个较大的入口 chunk 中。

2026-05-15 的 `dist/assets` 快照：

| Asset | Raw | Gzip |
|---|---:|---:|
| `index-CnUXX3aF.js` | 9953.0 KiB | 2802.0 KiB |
| `index-6_rRexRZ.css` | 1298.1 KiB | 189.5 KiB |
| `cytoscape.esm-5J0xJHOV.js` | 431.3 KiB | 138.2 KiB |
| `treemap-KMMF4GRG-7-Lcfx9m.js` | 346.3 KiB | 86.9 KiB |

从 `src/web-ui/src/main.tsx` 做静态 import 图扫描：

- 主入口静态可达本地模块约 `1067` 个。
- 主入口静态可达的重依赖包括：
  - `monaco-editor`
  - `@monaco-editor/react`
  - `@xterm/xterm` 及 xterm addons
  - `mermaid`
  - `react-markdown`
  - `react-syntax-highlighter`
  - `remark-*` / `rehype-*`
  - `katex`
  - `@tiptap/*`
  - `lucide-react`

这说明问题核心不是“某个 React 组件文件太大”，而是主入口静态依赖图过宽。

### 1.1 P2 执行结果快照

P2 已按“先保护常用体验，再收窄意外首包依赖”的原则完成阶段 0-4。当前 PR 不修改 `chunkSizeWarningLimit`，也不 lazy 整个 `SessionScene` 或整个 Markdown 渲染器。

| 快照 | 最大入口 JS | 入口 gzip | JS/CSS raw 总量 | JS/CSS gzip 总量 | 主入口静态图 |
|---|---:|---:|---:|---:|---:|
| P2 前基线 | 9953.0 KiB | 2802.0 KiB | 14332.4 KiB | 3905.1 KiB | 1067 local modules |
| 阶段 1 后 | 9896.9 KiB | 2786.9 KiB | - | - | 1010 local modules |
| 阶段 2 后 | 9367.0 KiB | 2648.6 KiB | 13801.7 KiB | 3774.5 KiB | 1010 local modules |
| 阶段 3 后 | 8881.4 KiB | 2512.8 KiB | 13796.5 KiB | 3773.7 KiB | 1010 local modules |
| P2 完成后 | 8242.6 KiB | 2286.1 KiB | 13952.4 KiB | 3930.0 KiB | 1013 local modules |

P2 完成后的入口 JS 相比基线减少约 `1710.4 KiB raw / 515.9 KiB gzip`。JS/CSS gzip 总量相比基线轻微增加约 `24.9 KiB`，主要来自语法高亮改为异步轻量 Prism 后产生的语言包按需资产；这是可接受的体验取舍，因为普通聊天、普通 Markdown 和 app shell 不再为 Mermaid / Prism 预付解析成本，而代码块仍可先显示可读纯文本，再增强高亮。

P2 完成后的关键静态图断言：

- `src/web-ui/src/main.tsx` 不再直接从 `./tools` 导入。
- 主入口静态图不再触达 `mermaid`。
- 主入口静态图不再触达 `react-syntax-highlighter`。
- 生产源码不再使用 `import * as LucideIcons from 'lucide-react'`。

---

## 2. 根因梳理

### 2.1 `tools` barrel import 放大主入口依赖图

`src/web-ui/src/main.tsx` 从 `./tools` 导入 `initializeAllTools`。

但 `src/web-ui/src/tools/index.ts` 同时导出多个工具模块：

- `./editor`
- `./file-system`
- `./git`
- `./lsp`
- `./mermaid-editor`
- `./snapshot_system`
- `./terminal`

主入口只需要轻量启动初始化能力，但 barrel 同时暴露 editor、terminal、Mermaid、Tiptap 等重模块，使这些模块更容易进入主入口 chunk。

### 2.2 `SessionScene` 当前是有意 eager

`src/web-ui/src/app/scenes/SceneViewport.tsx` 明确把 `SessionScene` 留在主 scene bundle 中，并注释说明 session 是主要交互路径，不希望首次打开时因为 lazy chunk 拉取和解析而卡顿。

这个判断是合理的产品选择。不能为了让包体数字好看，简单把整个 `SessionScene` 改成 lazy。打开工作区、进入会话、看到聊天输入区属于常用路径。

### 2.3 Markdown 渲染把可选重路径静态带入

`src/web-ui/src/component-library/components/Markdown/Markdown.tsx` 静态导入：

- `react-markdown`
- `remark-gfm`
- `remark-math`
- `rehype-katex`
- `rehype-raw`
- `rehype-sanitize`
- `react-syntax-highlighter`
- KaTeX CSS
- `MermaidBlock`

`MermaidBlock` 又静态导入 `MermaidService`，`MermaidService` 静态导入 `mermaid`。

Markdown 本身在聊天历史中很常见，但 Mermaid 和语法高亮引擎只在特定内容出现时需要。这里应做细粒度拆分，而不是把整个 Markdown 渲染器变成 lazy，导致普通消息也变慢。

### 2.4 动态图标查找可能影响 tree-shaking

以下文件使用 `import * as LucideIcons from 'lucide-react'`：

- `src/web-ui/src/shared/context-menu-system/components/ContextMenuRenderer.tsx`
- `src/web-ui/src/app/scenes/miniapps/utils/miniAppIcons.tsx`
- `src/web-ui/src/flow_chat/components/smart-recommendations/SmartRecommendations.tsx`

如果通过 namespace 对象动态解析 icon 名，bundler 可能保留比实际需要更多的 `lucide-react` 代码。

---

## 3. 体验保护硬约束

以下约束优先级高于所有包体收益。

1. **常用路径不能出现明显体验劣化。**
   - App shell 启动、workspace 自动打开、session/chat 挂载、chat input 聚焦、切换到已有 session scene、打开常用面板都必须保持顺滑。

2. **`SessionScene` 默认保持 eager。**
   - 它是主要交互路径。
   - 后续若要拆，只能在有启动时序证据和 preload 设计后另行评审。

3. **Lazy loading 只能放在用户已有异步预期的位置。**
   - 可接受：Mermaid 图表块显示 loading 后再渲染。
   - 高风险：聊天输入区延迟出现、消息列表先空白再恢复、常规 Markdown 消息等待渲染器加载。

4. **允许并鼓励对常用路径 preload。**
   - 拆 chunk 不自动等于体验更好。若某功能是常用操作，可以在 first paint 后、hover/focus 时或内容检测后预加载。

5. **不删除产品能力或资源。**
   - 不在本计划中删除字体、宠物资源、locale、Monaco 资源、编辑器能力、语法功能或图表支持。

6. **不做阈值型修复。**
   - `chunkSizeWarningLimit` 保持不变。

---

## 4. 设计方向

推荐采用“保守收窄依赖图”的方案：先改 import 边界和可选 runtime 边界，再考虑 `manualChunks`。

整体分四层推进：

1. **测量层**
   - 增加可重复的 bundle size 和静态图检查。
   - 让每个阶段都有 before/after 证据。

2. **意外首包依赖清理**
   - 主入口不再因为需要启动初始化而导入大 barrel。
   - 保持初始化行为和时序等价。

3. **可选功能边界**
   - Mermaid、语法高亮等按内容或动作触发加载。
   - 聊天和主 shell 的常用路径保持 eager 或被明确 preload。

4. **打包组织**
   - 在根因清理后，再用 `manualChunks` 稳定 vendor 分组和缓存。
   - 它是打包治理，不是第一修复手段。

---

## 5. 明确拒绝或延后的方案

### 5.1 调高 `chunkSizeWarningLimit`

拒绝。它隐藏告警，但不改变依赖图。

### 5.2 直接 lazy 所有 scene，包括 session

延后。它可能显著降低主包大小，但风险是伤害最常用路径。只有在有 preload 方案和启动时序证据后，才可以另起设计评审。

### 5.3 删除功能或 bundled assets

拒绝。本计划不是资源裁剪任务。任何产品可见资源或功能删除都需要单独批准。

### 5.4 一开始就加大范围 `manualChunks`

延后。`manualChunks` 能改善缓存和输出组织，但如果入口仍然 eager 依赖同一批代码，首屏体验未必改善，还可能因为 chunk 数增加而在 WebView 中更慢。

---

## 6. 阶段计划

### 阶段 0：基线与测量工具

**当前状态：** P2 已完成。已新增 bundle size 与主入口静态图脚本，并以构建产物记录 before/after。

**目的：** 让后续每个阶段都可测、可比、可回滚。

**涉及路径：**

- `scripts/`
- `src/web-ui/vite.config.ts`
- `dist/assets`

**动作：**

- 记录当前 `dist/assets` 中 JS/CSS raw 和 gzip 体积。
- 记录从 `src/web-ui/src/main.tsx` 出发的主入口静态可达模块数量。
- 记录主入口静态可达的重依赖包。
- 本阶段不改变运行时行为。

**建议命令：**

```powershell
pnpm --dir src/web-ui build
pnpm run verify:monaco-assets
node scripts/report-web-bundle-size.cjs
node scripts/report-web-main-static-graph.cjs
git diff --check
```

**验收：**

- 形成可重复的 baseline 报告。
- 如果本机 `pnpm --dir src/web-ui build` 过慢或超时，只能把现有 `dist` 当作临时证据，并在记录中明确标注。

**回滚：**

- 本阶段不应包含产品代码变更。

### 阶段 1：替换 `./tools` 启动 barrel import

**当前状态：** P2 已完成。`main.tsx` 已改为导入窄入口 `./tools/initializeTools`，原 barrel 导出继续保留兼容。

**目的：** 在保持启动行为不变的前提下，移除主入口通过 `tools/index.ts` 意外触达 editor/terminal/Mermaid 的路径。

**可能涉及文件：**

- `src/web-ui/src/main.tsx`
- `src/web-ui/src/tools/index.ts`
- 新增窄入口，例如 `src/web-ui/src/tools/initializeTools.ts`
- `src/web-ui/src/tools/lsp/index.ts`
- `src/web-ui/src/tools/git/index.ts`

**设计：**

- 将 `initializeAllTools` 移到窄入口，只导入真实需要的 Git/LSP 初始化模块。
- 保留 `tools/index.ts` 既有导出，避免破坏其他调用方。
- 不改变 `initializeAfterRender` 中工具初始化的时序。
- 不在本阶段把 Git/LSP 初始化改成 lazy，除非先证明行为等价。

**体验风险：**

- Git 状态和 LSP extension registry 当前在 render 后启动。若导入边界收窄错误，可能导致工作区 Git 状态或编辑器 LSP 后续失效。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm --dir src/web-ui run test:run -- src/tools/lsp src/tools/editor src/tools/git
pnpm --dir src/web-ui build
pnpm run verify:monaco-assets
pnpm run e2e:test:l0
```

**验收：**

- `main.tsx` 不再从 `./tools` 导入。
- 主入口静态图不再因 tools barrel 触达 editor/terminal/Mermaid。
- Git/LSP 启动日志和行为保持等价。

### 阶段 2：替换 Lucide namespace 动态导入

**当前状态：** P2 已完成。上下文菜单、MiniApp 图标和智能推荐图标已改为显式图标 map，并保留各自 fallback 行为。

**目的：** 降低 `lucide-react` 全量保留风险，不改变 UI 表现。

**可能涉及文件：**

- `src/web-ui/src/shared/context-menu-system/components/ContextMenuRenderer.tsx`
- `src/web-ui/src/app/scenes/miniapps/utils/miniAppIcons.tsx`
- `src/web-ui/src/flow_chat/components/smart-recommendations/SmartRecommendations.tsx`

**设计：**

- 将 `import * as LucideIcons` 替换为显式 icon imports 和类型化 map。
- 保持未知 icon 名的 fallback：
  - context menu：延续当前文本或无图标行为。
  - mini apps：回退到 `Box`。
  - smart recommendations：保留当前 fallback icon。

**体验风险：**

- icon map 漏项会让菜单或 MiniApp 图标缺失。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm --dir src/web-ui run test:run -- src/app/scenes/miniapps src/flow_chat/components src/shared/context-menu-system
pnpm --dir src/web-ui build
pnpm run e2e:test:l0
```

**验收：**

- 生产源码不再出现 `import * as LucideIcons`。
- 未知 icon 名仍有 fallback，不造成 UI 空洞。

### 阶段 3：让 Mermaid runtime 变成可选加载

**当前状态：** P2 已完成。`MermaidService` 内部改为缓存式动态导入 Mermaid runtime，Markdown 仍保持 eager 可用。

**目的：** Markdown 组件仍可及时渲染普通聊天内容，但只有出现 Mermaid 图表或执行导出/校验时才加载 `mermaid`。

**可能涉及文件：**

- `src/web-ui/src/component-library/components/Markdown/MermaidBlock.tsx`
- `src/web-ui/src/tools/mermaid-editor/services/MermaidService.ts`
- 可能新增 `src/web-ui/src/tools/mermaid-editor/services/loadMermaid.ts`

**设计：**

- 保持 `MermaidBlock` 组件对 Markdown 可用。
- 修改 Mermaid service 内部，让 `mermaid` 包在首次 render/validate/export 时动态导入。
- 保留 SVG cache 和 theme-change 行为。
- 保留 loading、incomplete、rendered、error 状态。
- 如果首次 Mermaid 渲染明显变慢，可以在 first paint 后或检测到 ```mermaid 代码块时预加载。

**体验风险：**

- 第一个 Mermaid 图表可能晚一点渲染。
- theme change 可能在 Mermaid 尚未加载时触发 cache 清理。
- SVG/PNG 导出路径若没有共享 loader，可能发生重复加载或状态不一致。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm --dir src/web-ui run test:run -- src/component-library/components/Markdown src/tools/editor
pnpm --dir src/web-ui build
pnpm run e2e:test:l0
pnpm --dir tests/e2e run test:l1:chat-flow
```

**手工检查：**

- 普通 Markdown 消息。
- 包含 Mermaid 图表的消息。
- 切换主题后图表重新渲染。
- 当前构建中若暴露 SVG/PNG 导出入口，需要检查导出。

**验收：**

- 除非显式 preload，`mermaid` 不再从主入口静态图可达。
- 不含 Mermaid 的 Markdown 消息不等待 Mermaid。

### 阶段 4：谨慎拆分语法高亮

**当前状态：** P2 已完成。Markdown 代码块和 CodePreview 改为共享异步 Prism loader，先渲染可读纯文本 fallback，再加载 `prism-async-light` 增强高亮。

**目的：** 普通文本和无代码 Markdown 不加载重语法高亮引擎，同时保留代码块质量。

**可能涉及文件：**

- `src/web-ui/src/component-library/components/Markdown/Markdown.tsx`
- `src/web-ui/src/flow_chat/components/CodePreview.tsx`
- `src/web-ui/src/flow_chat/components/codePreviewPrismTheme.ts`

**设计：**

- 保持 Markdown parsing 行为稳定。
- 将 syntax highlighter 和 prism theme 加载放到代码块路径。
- 首帧使用稳定的 inline fallback，再在 highlighter 加载后增强。
- 不把整个 Markdown 组件 lazy 化，避免拖慢普通聊天消息。

**体验风险：**

- 代码块可能短暂显示为未高亮文本。
- streaming Markdown 若没有缓存 loader，可能重复触发动态导入。
- 大量历史消息可能在 highlighter 加载后重渲染。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm --dir src/web-ui run test:run -- src/flow_chat src/component-library/components/Markdown
pnpm --dir src/web-ui build
pnpm --dir tests/e2e run test:l1:chat-flow
```

**手工检查：**

- 无 Markdown 的聊天消息。
- 有 Markdown 但无代码块的聊天消息。
- 单个代码块消息。
- streaming 响应中出现代码块。

**验收：**

- 普通 Markdown 仍立即显示。
- 代码块在增强前可读，增强后正常高亮。
- 消息列表没有超出正常渲染预期的布局跳动。

### 阶段 5：复审 component-library barrel

**当前状态：** 延后到 P3。该阶段会触及更广泛 UI import 面，当前 PR 只记录风险与执行门槛，不混入实现。

**目的：** 减少 `@/component-library` 在热点路径上的意外 fan-out，但不做全仓库机械替换。

**可能涉及文件：**

- `src/web-ui/src/component-library/index.ts`
- `src/web-ui/src/component-library/components/index.ts`
- `src/web-ui/src/app`
- `src/web-ui/src/flow_chat`
- `src/web-ui/src/tools`

**设计：**

- 不在一个 PR 中批量重写所有 component-library import。
- 从热点路径开始，把简单 UI primitives 改成直接路径导入，避免顺带暴露 Markdown/CodeEditor 等重组件。
- 优先考虑：
  - `@/component-library/components/Tooltip`
  - `@/component-library/components/Button`
  - `@/component-library/components/ConfirmDialog/confirmService`
  - `@/component-library/components/Markdown`
- 保留 barrel 导出，兼容低风险或 legacy 调用方。

**体验风险：**

- 主要是编译和导入路径风险；错误 export path 会影响多个 UI 面。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm run lint:web
pnpm --dir src/web-ui run test:run
pnpm --dir src/web-ui build
```

**验收：**

- 热点路径不再通过 component-library barrel 拉入无关重组件。
- 公共 barrel 仍可用。

### 阶段 6：在根因清理后再加 manual chunks

**当前状态：** 延后到 P3。P2 仍让 Vite 大 chunk 告警保留为真实信号，不用阈值掩盖。

**目的：** 在意外依赖已清理后，改善缓存和 vendor 组织。

**可能涉及文件：**

- `src/web-ui/vite.config.ts`

**设计：**

- `chunkSizeWarningLimit` 保持不变。
- 根据阶段 0 到阶段 5 的测量结果添加少量显式 `manualChunks`。
- 候选分组：
  - `vendor-react`
  - `vendor-i18n`
  - `vendor-markdown`
  - `vendor-monaco`
  - `vendor-terminal`
  - `vendor-mermaid`
  - `vendor-tiptap`
- 避免过度拆分小依赖。

**体验风险：**

- chunk 过多可能让 WebView 冷启动更慢。
- 如果所有 chunk 仍在启动时被 eager 加载，缓存收益有限。

**保护命令：**

```powershell
pnpm run type-check:web
pnpm --dir src/web-ui build
pnpm run verify:monaco-assets
pnpm run e2e:test:l0
pnpm --dir tests/e2e run test:l1:chat
pnpm --dir tests/e2e run test:l1:editor
pnpm --dir tests/e2e run test:l1:terminal
```

**验收：**

- 主入口 chunk 变小。
- 启动和常用交互无明显劣化。
- Vite 告警若仍存在，应能指向剩余真实热点，而不是单文件集中问题。

---

## 7. 全局合理性与风险复审

### 7.1 方案整体合理性

整体策略是合理的，因为它从依赖所有权和入口边界入手，而不是从输出文件名或告警阈值入手。

优先修复 `tools/index.ts` 这类“轻需求导入重 barrel”的问题，可以在不改变产品行为的情况下缩小主入口图。随后再处理 Mermaid、语法高亮等真正可选 runtime，最后才用 `manualChunks` 做缓存和组织优化。

这符合 BitFun 的桌面端产品定位：用户感知到的响应速度比一个理想化的 bundle 报表更重要。

### 7.2 最高风险区域

| 区域 | 风险 | 原因 | 缓解 |
|---|---|---|---|
| Session/chat eager path | 高 | 主工作流，用户最常使用 | 本计划不 lazy 整个 `SessionScene` |
| Markdown 渲染 | 高 | 聊天历史和 agent 输出依赖它 | 拆 Mermaid/highlighter 内部，不拆整个 Markdown 外壳 |
| Monaco/editor | 高 | 核心工具面 | 只移除意外入口可达性，保留 Monaco asset 校验 |
| Git/LSP 启动 | 中 | 工作区状态和编辑器能力依赖后台初始化 | 保持启动时序，跑 focused checks |
| manual chunks | 中 | 可能增加 WebView 请求和解析开销 | 根因清理后再做，且必须测启动体验 |
| Lucide icon map | 低/中 | map 漏项可能让图标缺失 | 保留 fallback，检查菜单和卡片 |

### 7.3 体验优先决策矩阵

每个拆分点都必须回答：

| 问题 | 如果是 | 如果否 |
|---|---|---|
| 是否处在首次 workspace/session 路径上？ | 保持 eager 或 first paint 后 preload | 可考虑 lazy |
| 是否已有明确 loading 状态？ | lazy 较安全 | 先补稳定占位 |
| 是否只在特定内容出现时需要？ | 内容检测后加载 | 若几乎每条消息都需要，不应拆 |
| 是否会增加很多冷启动小 chunk？ | 重新评估或分组合并 | 可继续 |
| 是否能用 focused tests + 一个 E2E 覆盖？ | 可进入实施 | 先补保护 |

### 7.4 让计划变得不安全的情况

- 没有 preload 和启动时序证据就把 `SessionScene` 改成 `React.lazy`。
- 把 Markdown 整体 lazy，导致普通聊天消息等待渲染器加载。
- 先加 `manualChunks`，再用更漂亮的输出文件名宣布根因已解决。
- 只看 gzip，不看 raw parse/compile 成本和 WebView 启动行为。
- 只跑 type-check/build，不跑 chat/editor/terminal 的 smoke 或 focused 回归。

### 7.5 可以接受总包体变大的情况

以下情况允许接受总包体轻微变大：

- 主入口变小，但常用路径通过 preload 保持及时可用。
- vendor chunk 独立后缓存更稳定，即使 raw 总量略增。
- eager loading 明确保护 chat/editor 响应速度。
- 某个 lazy 拆分造成体验劣化，需要回滚或改成 preload。

本计划追求的不是“理论最小包体”，而是“不该进入关键路径的重代码不要进入，同时常用操作不能明显变差”。

---

## 8. 验证汇总

P2 当前已执行并通过：

```powershell
pnpm run lint:web
pnpm run type-check:web
pnpm --dir src/web-ui run test:run -- src/tools/lsp src/tools/editor src/tools/git
pnpm --dir src/web-ui run test:run -- src/app/scenes/miniapps src/flow_chat/components src/shared/context-menu-system
pnpm --dir src/web-ui run test:run -- src/component-library/components/Markdown src/tools/editor
pnpm --dir src/web-ui run test:run -- src/flow_chat src/component-library/components/Markdown src/tools/mermaid-editor
pnpm --dir src/web-ui run test:run
pnpm --dir src/web-ui build
pnpm run verify:monaco-assets
node scripts/report-web-bundle-size.cjs --top=20
node scripts/report-web-main-static-graph.cjs --assert-external-unreachable=react-syntax-highlighter --assert-external-unreachable=mermaid --assert-no-direct-import=src/web-ui/src/main.tsx:./tools --top=12
git diff --check
```

`pnpm --dir src/web-ui run test:run` 当前覆盖 `119` 个测试文件、`629` 个测试用例。`pnpm run e2e:test:l0` 曾尝试执行，但日志出现 `Webview document did not become ready within 30000ms: BitFun app shell is not ready`，因此不计入通过项，后续 P3 若触及 `manualChunks` 或更大范围 scene/import 拆分，需要优先补跑可用的桌面 smoke。

后续任一产品代码阶段前，至少需要：

```powershell
pnpm run type-check:web
pnpm run lint:web
pnpm --dir src/web-ui run test:run
pnpm --dir src/web-ui build
pnpm run verify:monaco-assets
git diff --check
```

按影响面补充：

```powershell
pnpm run e2e:test:l0
pnpm --dir tests/e2e run test:l1:chat
pnpm --dir tests/e2e run test:l1:editor
pnpm --dir tests/e2e run test:l1:terminal
```

bundle 专项验证继续保留：

```powershell
node scripts/report-web-bundle-size.cjs
node scripts/report-web-main-static-graph.cjs
```

---

## 9. 推荐下一步

P2 已完成，当前 PR 到此为止。

后续建议进入 P3 前先单独评审两个方向：

- 复审 `component-library` barrel：只从热点路径做少量直接导入替换，不做全仓库机械改写。
- 在根因清理后的真实构建图上设计 `manualChunks`：重点看缓存稳定和 WebView 冷启动请求数，不以压掉 warning 为目标。

不建议把阶段 5/6 混入本 PR。它们会触及更广 import 面和构建组织，需要新的 before/after 与桌面 smoke 证据。
