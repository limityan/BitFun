# 启动阶段与历史 Session 打开性能优化设计说明书

> 本文最初基于 `C:\Users\yan\AppData\Roaming\bitfun\logs\20260516T092038` 的启动日志、现有 Web UI / Desktop 启动代码、以及历史 session 打开链路分析整理。后续已结合 `20260516T214200`、`20260516T222142` 新日志、里程碑 1-3 的实现结果，以及 Claude Code、Codex、OpenCode、OpenClaw 等同类产品公开资料进行修订。debug 模式日志的绝对耗时不能直接等价为 release 表现，但耗时分布、阻塞顺序、payload 规模、重复请求和远程通信风险具备优化参考价值。

## 1. 决策原则

### 1.1 用户裁定门禁

性能优化不能隐瞒风险。任何优化点如果可能引入以下问题，必须在实施前显式记录风险，并在风险无法被测试或灰度保护充分覆盖时暂停实施，由用户最终裁定：

- 性能劣化：例如常用操作首次打开变慢、主线程更容易卡顿、后台任务抢占交互、线程切换成本高于收益。
- 功能降级：例如 Git 状态不准确、历史 session 缺 turns、远程 / ACP / BTW session 行为不一致、Monaco 编辑器能力缺失。
- 体验降级：例如启动后看到错误空态、历史 session 闪成新建 session、编辑器首次打开白屏、操作反馈延迟或状态不可信。
- 可维护性降级：例如引入难以理解的调度层、跨线程状态竞争、缓存失效规则不清、日志噪声过高。

默认策略：遇到上述风险且没有明确保护手段时，不做该优化，只保留分析和可选方案，等待用户裁定。

### 1.2 质量和度量优先

每个里程碑必须先有质量保障和性能测量方式，再做行为优化。优化 PR 不能只声称“更快”，必须能回答：

- 慢在哪个阶段。
- 改动前后各阶段耗时如何变化。
- 是否产生新的功能、体验或主线程负担风险。
- 哪些场景被自动化测试覆盖，哪些仍依赖手动验证。

日志采集原则：

- 启动、session hydrate、后台任务调度使用阶段性结构化日志。
- 高频逻辑不逐次打日志，只在阈值超限、状态变更、聚合 flush 或 debug probe 开启时输出。
- 日志必须 English-only，不能包含敏感数据、API key、完整用户输入或大体积 payload。
- 对于高频事件，优先使用内存计数器和耗时直方图，按阶段结束输出聚合结果。

### 1.3 首屏体验优先

启动优化以用户实际看到和能操作为优先目标。不能为了降低 bundle 或延迟加载，把常用路径变成“首次使用明显卡一下”。如果存在两种方案：

- 方案 A：包体略大，但常用操作稳定。
- 方案 B：包体更小，但常用操作首次打开明显变慢。

默认选择 A；方案 B 只能作为可选方案并由用户裁定。

### 1.4 多线程与异步策略

原则上尽可能利用多线程和异步能力，避免把 IO、CPU 转换、Git 状态扫描、session turns 转换等非 UI 必须逻辑堆在主线程。但不能无脑创建线程或切碎任务。

采用规则：

- UI 状态提交、React render、DOM 测量、窗口显示仍属于主线程关键链路。
- 磁盘 IO、Git 命令、session turns 解析、历史 session 预取、快照 warmup 应放到 Rust async runtime、blocking pool、Web Worker 或 idle task 中。
- 小于 5-10ms 的轻量同步逻辑不强行 offload，避免线程调度和上下文切换成本超过收益。
- 后台任务必须有并发上限、取消机制、优先级和 in-flight 去重。
- 多平台上优先使用 Tauri / Tokio / browser 标准能力，不引入平台专属线程模型。

### 1.5 远程开发第一优先级

远程 SSH / Remote workspace 是本轮优化的第一优先级。任何启动、session、Git、配置、Monaco 相关优化，都必须先判断对远程场景的影响，再判断本地收益。

远程场景的硬约束：

- 不新增高频前后端往返。禁止把一次可批量获取的数据拆成 per workspace、per session、per turn、per item 的连续 IPC / remote command。
- 不新增大 payload 的重复正反序列化。历史 session turns、Git status、workspace metadata、model config 等数据必须优先复用缓存、批量返回或按需分页。
- 不在 React render 或高频 effect 中触发远程通信。远程通信必须在明确的事件、后台调度器或用户意图触发点中执行。
- 不为了本地启动更快而让远程工作区进入更慢或更不确定的状态。若本地与远程策略冲突，默认保护远程体验。
- 所有远程相关日志只记录 command count、payload bytes、duration、cache hit/miss、serialization duration 等聚合指标，不记录完整 payload。

远程性能度量必须包含：

- 前端到 Tauri/backend 的命令次数。
- remote workspace 启动阶段的 backend command 次数。
- 单次和总 payload size。
- 序列化 / 反序列化耗时。
- cache hit/miss 和 in-flight dedupe 命中次数。
- hydrate、Git refresh、workspace warmup 的取消次数和超时次数。

## 2. 当前证据

### 2.1 启动日志关键时间线

| 阶段 | 时间 / 耗时 | 说明 |
|---|---:|---|
| 进程启动 | 约 `09:20:38.040` | 由 `since_process_start_ms=2581` 反推 |
| `initialize_app_state` | 506ms | Desktop app state 初始化 |
| `create_main_window` | 1907ms | native 主窗口创建，是 native 侧最大显式耗时 |
| `tauri_setup` 完成 | 2581ms since process start | 进程启动到 Tauri setup 完成已超过 1s 目标 |
| Desktop started | `09:20:40.665` | native 侧报告启动成功 |
| WebView 第一条前端日志 | `09:20:59.053` | 与 Desktop started 相差约 18.388s，当前日志无法继续拆分 |
| `initializeBeforeRender` | 743.8ms | 前端首屏前初始化 |
| `scheduleInitialRender` | 756.9ms since frontend start | React 初始渲染被调度 |
| `Main window shown` | `09:21:00.313` | 距 WebView 第一条日志约 1.26s |
| `initializeAfterRender` | 4613.6ms | 首屏后初始化，影响早期可交互性 |
| `startApplication` | 5371.9ms | 前端启动函数完整结束 |

### 2.2 启动高耗时簇

- Native 窗口创建：`create_main_window` 1907ms。
- Debug/WebView 空窗：Desktop started 到前端第一条日志约 18.388s。当前缺少导航与 first script 埋点，不能判断是 Vite dev server、WebView navigation、资源加载还是 JS transform。
- 首屏前配置链路：`initializeFrontendLogLevelSync` 674ms；其中 `get_config ai.models` 705ms，`get_config app.ai_experience` 367.3ms。
- 首屏后 Monaco：`Monaco Editor` 从 `09:21:00.623` 到 `09:21:04.403`，约 3.78s。
- Git 刷新：`git_get_status` 4 次总耗时 13.48s，单次最大 4990ms，且启动期存在主仓库和 worktree 并发刷新、重复刷新迹象。
- Session 初始化：`list_persisted_sessions` 4 次总耗时 937ms；`restore_session` 498.5ms；`load_session_turns` 279.5ms。
- 配置重复读取：`ai.default_models` 读取 22 次，并伴随 25 条 `Invalid agentType` warning。

### 2.3 历史 Session 首次打开现象

当前历史 session 打开链路的关键行为如下：

1. session 列表先从 `FlowChatStore.initializeFromDisk(...)` 加载 metadata，并将历史 session 标记为 `isHistorical: true`，此时 `dialogTurns` 为空。
2. 用户点击历史 session 时，`openMainSession(...)` 调用 `flowChatManager.switchChatSession(...)`。
3. `switchChatSession(...)` 会立即执行 `flowChatStore.switchSession(sessionId)`，UI active session 立即切到目标 session。
4. 如果目标 session 是 historical，随后才后台调用 `hydrateHistoricalSession(...)`。
5. hydrate 内部调用 `loadSessionHistory(...)`，依次执行 `restore_session` 和 `load_session_turns`，再把 turns 转为 `dialogTurns`。
6. 在 hydrate 完成前，Modern chat 容器看到 active session 但 `dialogTurns.length === 0`，容易呈现新建 session / 空 session 的视觉状态。

因此，“先变成新建 session 界面，之后才加载已有内容”不是单一渲染慢，而是状态语义缺失：`历史内容尚未 hydrate` 被误表达成了 `这是一个空 session`。

## 3. 性能分层模型

后续优化必须把启动拆成以下层级独立度量，避免把所有问题混成一个“启动慢”：

| 层级 | 目标含义 | 关键路径 |
|---|---|---|
| Process Ready | 进程起来并进入 Tauri setup | `src/apps/desktop/src/lib.rs` |
| Native Window Ready | 主窗口对象创建完成 | `src/apps/desktop/src/theme.rs` |
| WebView Navigation Ready | WebView 开始加载页面并拿到入口资源 | Tauri window URL / Vite / bundled asset |
| Frontend First Script | 前端入口 JS 开始执行 | `src/web-ui/src/main.tsx` 顶层 |
| First Render Scheduled | React root render 被调度 | `src/web-ui/src/main.tsx` |
| First Visible Shell | native 主窗口显示，用户看到 splash / shell | `src/web-ui/src/app/App.tsx` |
| Interactive Shell | session 列表、输入框、基础导航可响应 | Web UI app stores |
| Background Ready | Monaco、Git、MCP、ACP、tools 等后台能力完成 | `initializeAfterRender` 及各服务 |
| Historical Session Ready | 目标历史 session 的可见内容完成 hydrate | `FlowChatStore.loadSessionHistory` |

## 4. 风险账本

| 优化方向 | 潜在收益 | 性能风险 | 功能风险 | 体验风险 | 默认决策 |
|---|---|---|---|---|---|
| 增加启动 trace | 明确耗时归因 | 日志过多会拖慢启动 | 低 | 日志噪声 | 可做，但必须聚合输出并限频 |
| 首屏前日志级别同步延后 | 减少 pre-render IPC | 初期日志级别短暂不精确 | 低 | 排查早期问题略难 | 可做，保留内存 buffer 或默认级别说明 |
| 首屏前 AI config 延后 | 降低 `initializeBeforeRender` | 后台配置读取与 UI 并发 | 模型选择默认值可能短暂未就绪 | 模型 selector 首次打开可能 loading | 可做，但模型相关 UI 必须有 loading/兜底 |
| 更早显示主窗口 shell | 提前可见反馈 | shell 过早 render 可能触发更多并发 | 未初始化服务被误用 | 用户看到半初始化状态 | 只在有明确 loading 状态后做 |
| 历史 session loading shell | 消除空态闪烁 | 轻微增加状态复杂度 | hydrate 状态错误会影响发送 | loading 卡住会更明显 | 可做，必须有 failed/retry/timeout |
| Monaco lazy / idle | 减少启动后 4s 阻塞 | 首次打开 editor/diff 可能变慢 | Monaco theme/worker 初始化遗漏 | 首次打开白屏或延迟 | 可做，但常用路径必须 idle 预热并有可见 loading |
| Git stale cache + 后台刷新 | 减少 3-5s Git 阻塞 | 缓存状态可能过期 | 危险 Git 操作状态不准 | 状态跳变 | 可做，但危险操作前强制 refresh |
| Git in-flight 去重 | 减少重复 Git 任务 | 等待已有慢任务可能延迟新请求 | force refresh 语义变复杂 | 状态更新不及时 | 可做，force 语义需单测 |
| session metadata 批处理 | 减少重复 config IPC | 批处理任务过大可能阻塞 | 单个 session 异常影响批次 | 列表部分缺失 | 可做，按 session 隔离错误 |
| 远程 IPC 批量化 / 去重 | 减少远程往返和连接压力 | 批量请求过大可能导致单次等待变长 | 批量结果局部失败处理更复杂 | 局部数据延迟出现 | 可做，但必须支持局部失败和 payload 上限 |
| 远程 payload 分页 / 摘要化 | 降低序列化和网络成本 | 需要额外分页状态 | 搜索/跳转可能需要补数据 | 内容逐步出现 | 可做，但首屏必须有明确 loading 和补齐状态 |
| 远程预取最近 session | 再次打开更快 | 可能抢占 SSH/remote 通道 | 预取 stale 数据可能误导 | 后台耗时影响当前操作 | 默认不做，除非度量证明收益大于通信成本 |
| 前端 Web Worker 承接大对象转换 | 降低主线程长任务 | structured clone 可能比主线程转换更慢 | 类型/引用语义丢失 | 首次内容出现变慢 | 高风险，需要 profile 和用户裁定 |
| `load_session_turns` 分段加载 | 大 session 首屏更快 | 后续分页增加复杂度 | 搜索/跳转可能缺数据 | 滚动补齐不自然 | 高风险，需要用户裁定后实施 |
| Native splash | 进程启动早期可见 | 多窗口/平台行为复杂 | window focus/tray/macOS 行为变化 | 闪屏、窗口跳动 | 高风险，需要用户裁定后实施 |
| 持久化 session index | session 列表更快 | 索引维护成本 | 索引损坏导致列表不准 | 列表延迟纠正 | 高风险，需要用户裁定后实施 |

## 5. 深层优化候选

以下方案可能带来更大收益，但风险和实现复杂度也更高。默认不纳入前三个里程碑的必做范围，只作为用户确认后的后续优化。

### 5.1 Native 早期 Splash 或双阶段窗口

思路：在主 WebView 完整可用前展示极轻量 native splash 或预创建窗口，降低点击后无反馈时间。

风险：

- Windows/macOS/Linux 窗口焦点、托盘恢复、fullscreen、DPI、多显示器行为可能出现差异。
- 如果主窗口随后 resize/focus，可能产生视觉跳动。
- 需要额外 E2E 或人工多平台验证。

裁定要求：只有 release 采样确认 `create_main_window` 或 WebView navigation 仍是瓶颈，且普通前端首屏收敛不足以达标时，才建议进入设计评审。

### 5.2 Session 持久索引

思路：为 session metadata 建立增量索引，启动时优先读索引而不是扫描 session 文件。

风险：

- 索引损坏、版本迁移、远程 session、手工文件修改都可能导致列表不一致。
- 需要明确 fallback：索引异常时回退完整扫描并修复索引。

裁定要求：只有 `list_persisted_sessions` 在 release 下仍显著耗时，且 metadata 批处理不足以解决时再考虑。

### 5.3 Git 状态后台守护或更细粒度缓存

思路：把 Git 状态刷新从 UI mount 触发改为 workspace 生命周期内的低频后台状态服务。

风险：

- 状态一致性和危险操作前 refresh 规则更复杂。
- 大 repo 下 watcher 或周期刷新可能带来持续资源消耗。

裁定要求：只有 Git 刷新在优化去重和启动降级后仍明显影响交互，才进入后续方案。

### 5.4 Web Worker 承接 Turns 转换

思路：将 `load_session_turns` 后的 turns 到 `DialogTurn` 转换放到 Web Worker，减少主线程长任务。

风险：

- 需要处理大对象序列化 / structured clone 成本。
- 类型、日期、Map、引用语义转换可能引入隐藏 bug。

裁定要求：只有性能 profile 证明转换本身是主线程长任务，且数据传输成本低于主线程执行成本时再做。

### 5.5 远程命令合并与服务端摘要

思路：将启动期多个远程读取命令合并为少量 coarse-grained command，例如一次返回 workspace 基础状态、session metadata 摘要、Git basic cache 状态，而不是前端逐项拉取。

风险：

- 后端聚合接口可能变成新的大而全接口，维护边界变差。
- 聚合结果里的局部失败需要精细表达，否则会把小错误扩大成整个启动失败。
- 单次 payload 变大后，序列化耗时和超时风险可能上升。

裁定要求：只有里程碑 1 的 remote command count / payload size 证明启动期远程往返是主要瓶颈，且批量接口能设置 payload 上限、局部失败、缓存命中信息时，才进入实现。

## 6. 三个里程碑

每个里程碑都必须达到可提交 PR 的质量：范围清晰、可独立回滚、自动化测试通过、性能数据可对比、PR 描述能说明风险与收益。

### 里程碑 1：可观测性与安全基线

目标：不改变产品行为，先建立启动和历史 session hydrate 的阶段性度量。

修改范围：

- `src/apps/desktop/src/lib.rs`
- `src/apps/desktop/src/theme.rs`
- `src/web-ui/src/main.tsx`
- `src/web-ui/src/app/App.tsx`
- `src/web-ui/src/infrastructure/api/service-api/ApiClient.ts`
- `src/web-ui/src/flow_chat/store/FlowChatStore.ts`
- `src/web-ui/src/flow_chat/services/flow-chat-manager/SessionModule.ts`
- `src/web-ui/src/shared/utils/startupTrace.ts`
- `src/web-ui/src/shared/utils/startupTrace.test.ts`
- `docs/perf-baselines/startup-m1-20260516/collect-startup-baseline.ps1`

交付内容：

- native/web 统一 `startupTraceId`。
- 阶段事件：native setup、main window create、web first script、before render、first render scheduled、main window shown、after render。
- session 事件：metadata list、historical switch、hydrate start/end、first content ready、hydrate failed。
- 高频限制：session hydrate 只记录每次用户切换的阶段事件；列表批处理只输出聚合数量和耗时，不逐 session 打日志。
- release 场景下早期 debug phase 可能早于日志转发稳定，因此最终 summary 必须包含 bounded phase events，保证 `first_script_eval` 等早期阶段不会只剩计数。

可执行任务：

- [x] 在 `src/web-ui/src/shared/` 下新增轻量 startup trace helper，定义阶段事件、聚合计数、阈值过滤和敏感字段保护。
- [x] 在 `src/web-ui/src/infrastructure/api/ApiClient` 相关调用链增加可关闭的聚合统计：command count、success/failure count、duration、payload bytes、serialization duration；默认只在启动阶段 flush 一次。
- [x] 在 `src/apps/desktop/src/lib.rs` 和 `src/apps/desktop/src/theme.rs` 增加 native startup phase 记录：process/setup/window create，并通过 WebView initialization script 与前端共用 `startupTraceId`；窗口显示事件由前端 `show_main_window` 调用链记录，不改变现有窗口行为。
- [x] 在 `src/web-ui/src/main.tsx` 增加 web first script、before render、render scheduled、after render 阶段记录。
- [x] 在 `src/web-ui/src/app/App.tsx` 记录 main window shown、interactive shell ready。
- [x] 在 `FlowChatStore` 和 `SessionModule` 记录 metadata list、historical switch、hydrate start/end/failed。
- [x] 对远程 workspace 单独聚合 remote command count、payload bytes、cache hit/miss，确保后续里程碑能比较通信动作是否增减。当前已接入 remote command count、payload bytes 与 cache hit/miss/unknown 计数；没有具体缓存命中信号的调用会落到 unknown，不能伪造。
- [x] 远程计数口径：`remoteConnectionId`、非 localhost 的 `remoteSshHost` 或非 localhost 的通用 `sshHost` 才计入 remote，避免本地 session metadata 中的 `sshHost: localhost` 污染远程 baseline，同时不漏计真实远程 `sshHost` 请求。
- [x] 写 trace helper 单元测试，覆盖阈值过滤、聚合 flush、敏感字段拒绝、disabled 模式无额外输出。
- [x] 采集 debug / preview debug / release-like 各 3 次 baseline，记录本地 workspace 数据；当前环境未配置真实远程 SSH workspace，因此远程 baseline 只能保留采样口径和阻断原因，不能伪造数据。

当前状态：2026-05-16 已完成里程碑 1 的代码接入、本地多轮 baseline 采样和远程计数口径校正。当前没有可用真实远程 SSH workspace 样本，因此远程启动 baseline 仍是环境限制项；后续涉及 remote workspace 的 PR 必须在具备远程样本后补齐 remote command count、payload bytes、cache hit/miss/unknown 和 serialization duration 对比。里程碑 1 不宣称性能收益，只建立可比较的度量基线。

基线采样结果：

- 采样脚本：`docs/perf-baselines/startup-m1-20260516/collect-startup-baseline.ps1`。
- 原始结果：`docs/perf-baselines/startup-m1-20260516/current-fixed/*/summary.json`。
- 聚合结果：`docs/perf-baselines/startup-m1-20260516/current-fixed/baseline-aggregate.json` 和 `baseline-aggregate.csv`。
- `release-like` 当前使用 `target/release-fast/bitfun-desktop.exe`，不是完整 LTO release；该数据用于观察 release 打包资源路径下的启动分布，不替代最终发布包采样。
- `desktop-dev` 和 `preview-debug` 受 Vite dev server、WebView dev navigation、debug logging 影响，绝对耗时不能等价于 release，但能暴露阶段分布和采集开销。

| 场景 | 次数 | native setup avg | first script avg | render scheduled avg | main window shown avg | interactive shell avg | startApplication avg | API count avg | failure avg | remote avg | response bytes avg | payload estimate avg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `preview-debug` | 3 | 1698.3ms | 7939.0ms | 606.8ms | 8971.4ms | 9141.3ms | 3494.1ms | 59.7 | 2.0 | 0.0 | 216633 | 6.3ms |
| `desktop-dev` | 3 | 2555.0ms | 20789.6ms | 616.5ms | 21879.1ms | 22077.5ms | 4177.2ms | 58.0 | 2.0 | 0.0 | 236113 | 7.4ms |
| `release-like` | 3 | 1267.0ms | 1260.8ms | 82.8ms | 2285.3ms | 2447.2ms | 1249.3ms | 21.0 | 1.0 | 0.0 | 14561 | 1.5ms |

基线结论：

- release-like 下 `first script -> render scheduled` 平均约 82.8ms，说明 startup trace helper 的前端同步成本当前较低，未看到可疑的首屏前采集膨胀。
- release-like 下 `main window shown` 平均约 2285.3ms、`interactive shell ready` 平均约 2447.2ms，仍高于“点击后尽可能小于 1s 看到有效页面”的目标；后续优化需要继续拆 native window create、WebView navigation、首屏前初始化三段。
- debug / preview debug 的 first script 和 main window shown 波动明显，尤其 preview debug 存在 Vite cold transform outlier，后续性能收益判断必须优先看 release / release-like 数据。
- 本地 baseline 的 `apiRemoteCount=0` 符合预期，说明 `sshHost: localhost` 不再被误计为远程；真实远程样本仍需单独采集。
- API failure count 已被纳入聚合统计，但里程碑 1 不修复具体失败原因；后续里程碑如果减少请求或调整启动链路，必须同时观察 failure count 是否新增或变差。

质量保障：

- 新增 trace helper 的单元测试，覆盖耗时记录、阈值过滤、敏感字段拒绝。
- 现有启动流程行为不变。
- 日志字段 English-only。

性能保障：

- 采样 debug、preview debug、release-like 各至少 3 次；完整发布包 release 数据在具备发布构建窗口时补采。
- PR 描述附 before/after 阶段表。里程碑 1 不要求性能变快，但日志开销不得让 `Frontend First Script -> First Render Scheduled` 变慢超过 5%。

必跑验证：

```powershell
pnpm run lint:web
pnpm run type-check:web
pnpm --dir src/web-ui run test:run
cargo check -p bitfun-desktop
```

停止条件：

- 如果日志埋点本身导致启动阶段明显变慢或日志量过大，停止后续优化，先修正采集方式。

### 里程碑 2：首屏前阻塞收敛与历史 Session 状态修复

目标：优先解决用户最直观的问题：启动首屏前等待过多、历史 session 误显示为空 session。

修改范围：

- `src/web-ui/src/main.tsx`
- `src/web-ui/src/infrastructure/config/services/FrontendLogLevelSync.ts`
- `src/web-ui/src/infrastructure/config/services/ConfigManager.ts`
- `src/web-ui/src/flow_chat/types/flow-chat.ts`
- `src/web-ui/src/flow_chat/store/FlowChatStore.ts`
- `src/web-ui/src/flow_chat/services/flow-chat-manager/SessionModule.ts`
- `src/web-ui/src/flow_chat/services/storeSync.test.ts`
- `src/web-ui/src/flow_chat/components/modern/HistorySessionPlaceholder.tsx`
- `src/web-ui/src/flow_chat/components/modern/ModernFlowChatContainer.tsx`
- `src/web-ui/src/flow_chat/components/modern/ModernFlowChatContainer.scss`
- `src/web-ui/src/locales/*/flow-chat.json`

交付内容：

- `initializeBeforeRender` 不再等待 AI 模型配置和完整日志配置。
- `ConfigManager` 对同 path 并发读取做 in-flight 去重。
- 引入历史 session hydrate 状态：

```ts
type SessionHistoryState =
  | 'new'
  | 'metadata-only'
  | 'hydrating'
  | 'ready'
  | 'failed';
```

- 历史 session 点击后立即显示目标 session 标题和 loading shell，不显示新建 session 引导。
- hydrate 失败展示 failed/retry，不吞掉错误。
- 发送消息前复用 pending hydrate，避免创建重复 backend session。

质量保障：

- `FlowChatStore` 测试：
  - metadata-only session 不被当成 new session。
  - hydrate start/end/failed 状态转换正确。
  - 快速切换 session 时，旧 hydrate 结果只更新旧 session，不拉回 active session。
- `SessionModule` 测试：
  - historical session 切换立即 active，hydrate 后台执行。
  - ensure backend session 复用 pending hydrate。
  - ACP session 仍跳过普通 `restore_session`。
- UI 测试：
  - historical empty turns 显示 loading shell。
  - hydrating session 继续显示 loading shell。
  - new empty session 仍显示新建引导。
  - failed session 显示 retry，retry 复用 `switchChatSession`。
- `storeSync` 测试：
  - 同步到 Modern store 时原样传递 session 对象，保留 `historyState`。

性能保障：

- `Frontend First Script -> First Render Scheduled` 目标下降。
- `initializeBeforeRender` release 目标小于 150ms；如果 release 暂时无法跑，至少 debug/preview debug 给出趋势数据。
- 点击历史 session 到 loading shell 目标小于 100ms。
- 高频路径不新增逐 turn、逐 item 日志。

必跑验证：

```powershell
pnpm run lint:web
pnpm run type-check:web
pnpm --dir src/web-ui run test:run
```

手动验证：

- 打开最近历史 session：由 loading shell / retry UI 单测覆盖；真实桌面手测仍建议在 PR 自测阶段补充。
- 打开大 turns 历史 session：当前未引入分段加载，风险主要是 loading 可恢复性；真实大 session 耗时需在有样本后补测。
- 快速连续切换多个历史 session：由旧 hydrate 不拉回 active session 的 store 测试覆盖。
- ACP session：由 `loadSessionHistory` skip normal restore 测试覆盖。
- BTW 子 session：本里程碑未改 BTW 打开链路，只通过 `storeSync` 保留 `historyState`；真实 BTW 手测建议作为 PR smoke。
- 远程 SSH workspace 历史 session：当前环境无真实远程 SSH workspace，不能伪造样本；remote command count 在本地采样中仍为 0。

可执行任务：

- [x] 调整 `initializeBeforeRender`：移除 context types、recommendation providers、完整 config watcher 等非首屏必要 await，保留 logger/theme/i18n 能力。
- [x] 为 `FrontendLogLevelSync` 增加启动期轻量路径：启动期直接读取 logging 必要配置，ConfigManager watcher 延后安装；敏感诊断配置仍在启动同步中读取，避免安全语义降级。
- [x] 在 `ConfigManager` 增加同 path in-flight 去重，避免并发 `get_config` 重复 IPC。
- [x] 在 `flow-chat.ts` 增加 `historyState`，并明确 `new` 与 `metadata-only` 的语义差异。
- [x] 修改 `FlowChatStore.initializeFromDisk`：historical metadata 初始进入 `metadata-only`，不触发 turns 加载。
- [x] 修改 historical hydrate：进入 `hydrating`，复用 pending hydrate，失败进入 `failed`，成功进入 `ready`。
- [x] 确认 `storeSync` 通过原 session 对象同步到 Modern store，并补测试保护 `historyState` 不丢失；运行时代码无需额外转换。
- [x] 修改 `ModernFlowChatContainer`：`metadata-only` 和 `hydrating` 展示历史 session loading shell，`failed` 展示 retry；未改 `VirtualMessageList`，避免把占位状态扩散到消息虚拟列表。
- [x] 增加远程保护：本里程碑没有为 historical hydrate 新增额外 command；本地 release-like 采样 remote command count 仍为 0。真实远程 SSH workspace 样本当前不可用，后续 PR 必须补远程采样或由用户裁定。
- [x] 增加测试：new empty session、metadata-only session、hydrating、failed/retry、ACP skip restore、旧 hydrate 不拉回 active session、pending hydrate 复用、storeSync historyState 保留。

当前状态：2026-05-16 已完成里程碑 2 的代码和测试。M2 优化集中在首屏前同步 await 收敛、配置读取 in-flight 去重、历史 session 首次打开不再误显示新建引导，以及失败后的 retry 出口。没有引入 `load_session_turns` 分段加载、Web Worker、大 payload 协议改造或 native splash；这些仍保留在高风险候选区，需要用户裁定后才能进入实现。

M2 release-like 采样结果：

- 采样脚本：`docs/perf-baselines/startup-m1-20260516/collect-startup-baseline.ps1`。
- 里程碑 1 对照：`docs/perf-baselines/startup-m1-20260516/current-fixed/baseline-aggregate.json`。
- 里程碑 2 当前：`docs/perf-baselines/startup-m1-20260516/m2-current/baseline-aggregate.json`。
- 当前只保留聚合和 summary 文件，逐 run 临时日志已清理。

| 场景 | runs | Native Since Process Start avg | Native Window Create avg | First Script avg | First Render Scheduled avg | Main Window Shown avg | Interactive Shell Ready avg | Start Application avg | After Render avg | API Total avg | Remote Count avg | Response Bytes avg | Payload Estimate avg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| M1 release-like | 3 | 1267.0ms | 949.0ms | 1260.8ms | 82.8ms | 2285.3ms | 2447.2ms | 1249.3ms | 1165.1ms | 21.0 | 0.0 | 14561 | 1.5ms |
| M2 release-like | 3 | 1457.7ms | 1115.7ms | 1118.8ms | 68.0ms | 2004.4ms | 2196.3ms | 1038.5ms | 969.4ms | 20.0 | 0.0 | 13559 | 0.9ms |

M2 结论：

- `First Render Scheduled` 平均从 82.8ms 降到 68.0ms，约 17.9% 改善，说明首屏前同步初始化有所收敛。
- `Start Application` 平均从 1249.3ms 降到 1038.5ms，约 16.9% 改善；`After Render` 平均从 1165.1ms 降到 969.4ms，约 16.8% 改善。
- `Main Window Shown` 和 `Interactive Shell Ready` 分别约 12.3% / 10.3% 改善，但仍明显高于“尽可能小于 1s 看到有效页面”的目标，后续仍需要里程碑 3 继续处理首屏后任务竞争和 native/WebView 侧瓶颈。
- Native window create 这组数据出现一次明显 outlier，平均从 949.0ms 上升到 1115.7ms；M2 没有改 native window create 链路，因此该项不作为收益声明，只作为后续需要继续采样确认的波动风险。
- 本地 release-like remote command count 仍为 0，没有新增远程通信；但当前环境没有真实远程 SSH workspace，远程通信风暴和正反序列化风险仍需在具备样本后补验证。

M2 当前质量验证：

- `pnpm run lint:web`：通过。
- `pnpm run type-check:web`：通过。
- `pnpm --dir src/web-ui run test:run`：通过，124 个测试文件 / 650 个测试。
- `cargo check -p bitfun-desktop`：通过。
- `cargo test -p bitfun-desktop`：通过，27 个测试。
- `pnpm run desktop:build:release-fast`：通过；仍保留已有 Vite chunk size / dynamic import warning，本里程碑不通过提高阈值掩盖该问题。
- `git diff --check`：通过，仅输出 Windows CRLF 提示。
- `rustfmt --edition 2021 --check --config skip_children=true src\apps\desktop\src\lib.rs src\apps\desktop\src\theme.rs`：通过。

停止条件：

- 如果模型配置延后导致模型选择、发送消息或默认模型展示出现不可接受的错误状态，暂停该优化，由用户裁定。
- 如果 loading shell 引入“卡住但不可恢复”的体验，暂停并优先补 failed/retry。

### 里程碑 3：后台任务调度、Monaco/Git 降阻塞与 Session 批处理

目标：降低首屏后 5s 内主线程、IPC、Git、Monaco、session metadata 的竞争，提升早期可交互性。

修改范围：

- `src/web-ui/src/main.tsx`
- `src/web-ui/src/shared/utils/backgroundTaskScheduler.ts`
- `src/web-ui/src/tools/editor/services/MonacoStartupWarmup.ts`
- `src/web-ui/src/tools/git/state/GitStateManager.ts`
- `src/web-ui/src/tools/git/services/WorkspaceGitInitializer.ts`
- `src/web-ui/src/tools/git/services/GitService.ts`
- `src/web-ui/src/flow_chat/store/FlowChatStore.ts`
- 对应单元测试文件。已评估本里程碑不需要修改 Rust `list_persisted_sessions` / `load_session_turns` API；分页、索引、worker 化仍属于高风险候选，需用户裁定后单独设计。

交付内容：

- 引入前端后台任务调度规则：优先级、并发上限、取消、idle 执行。
- Monaco 从 `initializeAfterRender` 的强等待中移出，改为按需初始化 + idle 预热。
- Git refresh 做 in-flight 去重；启动期只刷新当前 workspace 的必要 basic 信息。
- 危险 Git 操作前强制 refresh，不使用 stale 状态执行。
- `initializeFromDisk` 批量读取模型配置，取消 per-session `ai.default_models` 请求。
- session metadata 处理对单个异常隔离，避免一个坏 metadata 影响整个列表。

质量保障：

- `GitStateManager` 测试：
  - 同 repo 同 layer mount refresh 合并。
  - `force=true` 与已有 refresh 的语义符合预期。
  - 危险操作前 refresh 不被 stale cache 跳过。
- Monaco 测试或集成验证：
  - 首次打开 editor/diff 能显示 loading 并完成初始化。
  - 主题同步在 Monaco 初始化后执行。
- `FlowChatStore.initializeFromDisk` 测试：
  - `ai.default_models` 只读取一次或接近一次。
  - 单个坏 metadata 不影响其他 session。

性能保障：

- `initializeAfterRender` 不再等待 Monaco 完整初始化。
- 启动后 5s 内 `git_get_status` 请求数下降，同 repo 同 layer 不重复。
- `ai.default_models` 启动期重复读取从 22 次降到 1 次或接近 1 次。
- 打开 editor/diff 的首次体验必须有数据：如果 lazy 后首次打开明显慢于当前体验，需要回退或请求用户裁定。

多线程/异步要求：

- Git 和 session IO 继续走 Rust/Tauri 后台能力，不在 React render 或 effect 中做重 CPU 同步循环。
- turns 转换如果 profile 证明是主线程长任务，先记录风险，不在本里程碑默认上 Web Worker，需用户确认。
- Monaco 预热使用 idle / 后台调度，不在首屏关键链路同步等待。

必跑验证：

```powershell
pnpm run lint:web
pnpm run type-check:web
pnpm --dir src/web-ui run test:run
```

如果修改 Rust session API：

```powershell
cargo check --workspace
cargo test --workspace
```

手动验证：

- 启动后立即打开 Git 面板、查看 workspace item Git 状态。
- 启动后立即打开 editor/diff。
- 大量历史 session workspace。
- 大 turns session。
- 远程 SSH workspace。

可执行任务：

- [x] 新增后台任务调度器，支持 priority、concurrency limit、idle execution、cancellation、in-flight key。
- [x] 将 Monaco 初始化从 `initializeAfterRender` 强等待路径移出：启动后通过 idle 低优先级预热，首屏关键链路不再等待完整初始化和主题同步。
- [x] 保留现有 editor/diff 按需初始化与加载态承接；本里程碑未做额外 timeout/error UI 重构，首次打开真实体验仍需后续手测验证。
- [x] 修改 `GitStateManager`：同 repositoryPath + layer 的 mount refresh 合并；`force=true` 会等待已有 refresh 收敛后再执行新 refresh，避免并发 force 互相污染。
- [x] 启动期 Git 只刷新当前 workspace 必要 basic 信息；完整 status 不在 mount 阶段同步拉取，但危险 Git 操作前强制刷新 basic + status。
- [x] 修改 `FlowChatStore.initializeFromDisk`：一次读取 `ai.models` / `ai.default_models`，批量处理 session metadata，单个坏 metadata 不影响其他 session。
- [x] 基于里程碑 1/2 数据评估 Rust session API 改动：当前 M3 收益可以通过前端批处理和隔离实现，不修改 Rust API，避免扩大协议和远程兼容风险。
- [x] 增加远程通信预算：本地 release-like 采样 remote command count 仍为 0；API count、request bytes、response bytes 均低于 M1/M2。真实远程 SSH workspace 当前不可用，不能伪造远程样本。
- [x] 增加测试：后台调度器、Monaco idle warmup、Git refresh 合并、force refresh、dangerous operation refresh、session config 批量读取、坏 metadata 隔离。

当前状态：2026-05-16 已完成里程碑 3 的代码和测试。M3 重点收敛首屏后后台任务竞争：Monaco 不再阻塞 `initializeAfterRender` 完成；Git 启动刷新从 full status 降为 basic-only；危险 Git 操作保留强制刷新保护；历史 session metadata 初始化减少重复 config 读取并隔离单项失败。未引入 Rust API 改动、session turns 分页、Web Worker 转换、native splash 或远程聚合协议改造，这些仍保留在高风险候选区。

M3 release-like 采样结果：

- 采样脚本：`docs/perf-baselines/startup-m1-20260516/collect-startup-baseline.ps1`。
- 里程碑 1 对照：`docs/perf-baselines/startup-m1-20260516/current-fixed/baseline-aggregate.json`。
- 里程碑 2 对照：`docs/perf-baselines/startup-m1-20260516/m2-current/baseline-aggregate.json`。
- 里程碑 3 当前：`docs/perf-baselines/startup-m1-20260516/m3-current-mainbase/baseline-aggregate.json`。
- 当前 M3 数据已基于 #754 合并后的最新 `upstream/main` 重新采样，避免把旧 PR 分支结果直接用于新 PR。M3 没有修改 native/window create 链路，因此 native 耗时波动只作为后续持续采样风险，不作为本里程碑直接收益声明。

| 场景 | runs | Main Window Shown avg | Interactive Shell Ready avg | Start Application avg | After Render avg | API Total avg | Remote Count avg | Request Bytes avg | Response Bytes avg | Payload Estimate avg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| M1 release-like | 3 | 2285.3ms | 2447.2ms | 1249.3ms | 1165.1ms | 21.0 | 0.0 | 1020.0 | 14561.0 | 1.5ms |
| M2 release-like | 3 | 2004.4ms | 2196.3ms | 1038.5ms | 969.4ms | 20.0 | 0.0 | 1006.0 | 13559.0 | 0.9ms |
| M3 release-like | 3 | 2010.5ms | 2224.1ms | 795.3ms | 756.9ms | 13.7 | 0.0 | 659.3 | 11411.3 | 0.7ms |

M3 结论：

- API 调用数从 M1 的 21.0、M2 的 20.0 降到 13.7，request bytes 从 1020.0 降到 659.3，response bytes 从 14561.0 降到 11411.3，说明 Git basic-only 和 session config 批处理有效降低了启动期 IPC/序列化压力。
- `startApplication` 3 次平均为 795.3ms，较 M1 改善约 36.3%，较 M2 改善约 23.4%；`afterRender` 3 次平均为 756.9ms，较 M1 改善约 35.0%，较 M2 改善约 21.9%。
- `Main Window Shown` 和 `Interactive Shell Ready` 与 M2 基本持平，说明 M3 收益主要来自首屏后任务竞争收敛和 IPC 降载，而不是 native/WebView 创建链路。Monaco 已从强等待路径移出，但首次 editor/diff 真实体验仍需手动验证，若出现明显劣化应回退或调整预热时机。
- 本地 release-like remote command count 仍为 0，没有新增远程通信动作；真实远程 SSH workspace 当前不可用，远程通信风暴和实际网络 RTT 风险仍需在具备样本后补验证。

M3 当前质量验证：

- targeted vitest：通过，6 个测试文件 / 26 个测试。
- `pnpm run lint:web`：通过。
- `pnpm run type-check:web`：通过。
- `pnpm --dir src/web-ui run test:run`：通过，129 个测试文件 / 674 个测试。
- `cargo check -p bitfun-desktop`：通过。
- `cargo test -p bitfun-desktop`：通过，27 个测试。
- `pnpm run desktop:build:release-fast`：通过；仍保留已有 Vite chunk size / dynamic import warning，本里程碑不通过提高阈值掩盖该问题。

停止条件：

- 如果 Git stale cache 让用户看到错误危险状态，立即回退该部分。
- 如果 Monaco lazy 造成常用 editor/diff 首次打开显著劣化，默认回退或改为更早 idle 预热，由用户裁定。
- 如果 session 批处理需要大规模 Rust API 改造，先拆出单独设计，不在本里程碑直接扩大范围。

## 7. 关键风险识别与应对措施

| 风险 | 触发信号 | 检测方式 | 应对措施 | 是否需要用户裁定 |
|---|---|---|---|---|
| 远程启动通信风暴 | remote workspace 启动 command count 明显上升 | startup trace 聚合 command count、payload bytes | 合并请求、in-flight 去重、取消非当前 workspace 后台任务 | 如果必须新增通信动作，需要裁定 |
| 序列化 / 反序列化成本上升 | payload bytes 不大但 serialization duration 高 | ApiClient / backend trace 记录 serialization duration | 减少 payload 字段、摘要化、延后大对象、评估 worker/offload | 如果需要协议或 DTO 改造，需要裁定 |
| loading shell 卡住 | `hydrating` 超时或 failed 无 retry | session hydrate timeout/error trace | 增加 timeout、failed/retry、取消 stale hydrate | 不需要，除非要改变发送策略 |
| 历史 session 数据缺失 | ready 后 turns 数量异常或跳转失败 | load turns count、UI 测试、大 session 手测 | 回退到完整 hydrate、禁止默认分段加载 | 分段加载或分页必须裁定 |
| Git stale 状态误导 | UI 显示旧 branch/status，危险操作未刷新 | GitStateManager trace、危险操作测试 | 危险操作前强制 refresh；stale 标记显性化 | 如果希望继续使用 stale 执行，需要裁定 |
| Monaco 首次打开变慢 | editor/diff 首次打开超出 baseline | editor open trace、手动验证 | 提前 idle 预热、保留 loading、必要时回退强预热 | 如果牺牲首次 editor 体验换启动数字，需要裁定 |
| 后台任务抢占交互 | 首屏后输入、切 session、打开面板卡顿 | long task、scheduler queue、manual smoke | 降并发、idle 调度、取消低优先级任务 | 如果高优先级后台任务必须抢占，需要裁定 |
| 日志采集反向拖慢启动 | 里程碑 1 后 first render 变慢超过 5% | baseline 对比 | 降采样、聚合 flush、关闭高频 debug probe | 不需要，直接修采集 |
| 批量接口局部失败扩大化 | 一个坏 session 导致列表整体失败 | 单测、坏 metadata fixture | 按 item 返回 error，UI 局部降级 | 如果需要改变后端 API contract，需要裁定 |
| 远程连接陈旧 | remoteConnectionId stale 导致 restore 失败 | 远程 SSH 手测、trace connection source | 复用 effective connection 解析逻辑 | 不需要，除非改连接模型 |

## 8. 验证矩阵

| 场景 | 里程碑 1 | 里程碑 2 | 里程碑 3 |
|---|---|---|---|
| 冷启动 debug / preview debug / release | 阶段耗时采集 | 首屏耗时对比 | 后台任务耗时对比 |
| 历史 session 首次打开 | hydrate trace | loading shell / retry | 批处理和 hydrate 耗时 |
| 快速切换多个历史 session | trace 顺序 | active session 不被旧 hydrate 拉回 | pending hydrate 去重 |
| ACP session | trace | 不走普通 restore | 不被批处理破坏 |
| BTW 子 session | trace | aux pane 行为不变 | 后台 hydrate 不抢 UI |
| 远程 SSH workspace | trace | effective connection 复用 | session/Git 后台任务不阻塞 |
| 远程 command count / payload bytes | 建立 baseline | 不新增额外 hydrate 通信 | 不高于 baseline，超出需裁定 |
| 远程序列化成本 | 建立 baseline | 避免新增大 payload | 批处理后 serialization duration 不劣化 |
| 首次打开 editor/diff | 记录 baseline | 不涉及 | Monaco lazy/idle 验证 |
| Git 状态与危险操作 | 记录 baseline | 不涉及 | stale cache + 强制 refresh 验证 |

## 9. PR 要求

每个里程碑 PR 必须包含：

- 变更范围和明确非目标。
- 风险账本更新：说明哪些风险被消除，哪些仍需用户裁定。
- 性能数据：至少包含本里程碑相关阶段的 before/after。
- 远程数据：涉及启动、session、Git、ConfigManager、workspace 的 PR 必须包含 remote command count、payload bytes、serialization duration 对比。
- 质量保障：列出已运行命令和手动验证场景。
- 回滚策略：说明如果性能或体验回退，最小回滚点是什么。

涉及启动、session、Git、Monaco、ConfigManager 的后续 PR，如果没有性能数据和风险说明，不应合并。

## 10. 最终指标

| 指标 | 目标 |
|---|---:|
| process start 到 native window ready | release 下持续压缩，目标接近 1s |
| frontend first script 到 first visible shell | release 下小于 500ms |
| `initializeBeforeRender` | release 下小于 150ms |
| 点击历史 session 到 loading shell | 小于 100ms |
| 点击历史 session 到首屏历史内容 | cached 小于 300ms，cold 尽量小于 1200ms |
| 启动期 `ai.default_models` 请求数 | 1 次或接近 1 次 |
| 启动期重复 `git_get_status` | 同 repo 同 layer 不重复 |
| Monaco 完整初始化 | 不阻塞首屏和 `startApplication` 完成 |
| 远程启动 command count | 不高于里程碑 1 baseline，新增通信必须用户裁定 |
| 远程启动 payload bytes | 不高于里程碑 1 baseline，批量接口必须设置上限 |
| 远程序列化 / 反序列化耗时 | 不高于里程碑 1 baseline，若上升必须解释收益 |

这些指标不是合并的唯一条件。只要出现功能降级、体验降级或常用路径性能劣化，即使某个启动数字变好，也必须暂停并进入用户裁定。

## 11. 2026-05-16T222142 新日志复盘与完整方案修订

本节是当前最新设计基线。若本节与前文早期候选描述存在优先级差异，以本节为准；前文里程碑和风险账本保留为历史决策依据。

### 11.1 修订结论摘要

这轮日志比前几轮更清楚地说明：启动和历史 session 打开已经不是单点问题，而是三个路径互相抢资源。

1. 应用启动：debug 下 Vite/WebView navigation 仍占绝对大头，但 native setup 期间 snapshot warmup 也会占用约 4.75s 的磁盘和 CPU，容易与窗口创建、页面加载竞争。
2. 历史 session 首次加载：后端恢复已经从旧日志的 4s 级下降到 1.5s 左右，但前端 `restore_session_with_turns` 仍耗时 3.5s，核心矛盾转向 9MB 级 raw tool output 的 IPC 传输、反序列化和前端对象落地。
3. 长 session 持久化：同一份大工具输出同时出现在 turn 文件和 context snapshot 中，造成磁盘、解析、模型上下文恢复、前端传输四处重复放大。新 session 必须停止继续扩大这个结构性问题，但旧 session 必须无损可读。
4. 远程连接：本轮日志没有真实远程 SSH 样本，`remoteCount=0`，只能验证本地 `sshHost=localhost` 不应被误计为远程。任何后续远程优化必须基于真实远程样本补采，不能用本地日志替代。
5. 用户体验优先：点击历史 session 后应尽快看到目标 session 的标题、完整可见历史内容和明确 loading 状态；任何会减少原本可见内容、增加用户等待步骤、增加远程逐项请求或让常用操作首次使用变慢的方案，先进入统一审视池，不进入默认执行路径。

### 11.2 `20260516T222142` 关键证据

启动阶段：

| 证据 | 耗时 / 规模 | 结论 |
|---|---:|---|
| `initialize_app_state` | 1189ms | app state 初始化仍是 native 侧明显成本 |
| 主 workspace snapshot warmup | 946 个 metadata，4563ms；cold init 4748ms | 不适合在首屏可见前抢占 IO/CPU |
| `create_main_window` | 5365ms；setup total 5416ms | debug 下 window build 与 snapshot warmup 重叠，存在资源竞争嫌疑 |
| 主窗口 page load started -> finished | 约 28.55s | debug/Vite/WebView navigation 仍不能直接代表 release，但说明 dev 模式首屏前空窗会被放大 |
| first script -> main window shown | 约 1416ms | 前端执行后到可见仍有优化空间 |
| `initializeFrontendLogLevelSync` | 607.8ms | 首屏前仍在等待偏重配置链路 |
| `initializeAfterRender` | 1112.8ms | 首屏后任务仍可能抢占早期交互 |
| agent companion page load | request 后约 9345ms 完成 | 第二个 WebView 在主窗口早期阶段启动，可能与主窗口和历史 session 加载争资源 |
| startup API summary | 18 次调用，`get_config` 10 次，1 次 `font` not found failure | 配置请求仍可收敛，optional not found 不应污染 failure 指标 |

历史 session 阶段：

| session | 后端恢复 | 前端 API | 文件 / payload | 结论 |
|---|---:|---:|---|---|
| `702f7c6b...` | 473ms | 1686.4ms | turn 6.76MB，raw chars 2.67M，tool result 345 个 | 后端较快，但跨 IPC/反序列化仍放大到 1.7s |
| `d53d1ec5...` | 297ms | 465.6ms | turn 1.28MB | 中等 session 基本可接受 |
| `474061de...` | 111ms | 278.9ms | turn 1.52MB | 可接受 |
| `a76d2715...` | 33ms | 40.4ms | 小 session | 正常 |
| `ebece794...` | 83ms | 249ms | turn 1.39MB | 可接受 |
| `c44dd3c3...` | 1527ms | 3517.3ms | turn 14.48MB，snapshot 14.48MB，raw chars 9.06M，最大 Bash output 8.61M | 最大问题：大 raw output 被完整读取、恢复、传输和落地 |

`c44dd3c3...` 的进一步拆分：

- turn JSON 读取 41ms，parse 697ms，总 738ms。
- context snapshot 读取 40ms，parse 693ms，总 734ms。
- 后端 `Session restored` 总 1512ms。
- 后端完成到前端 API resolve 仍有约 1.99s 差距，说明 IPC 传输、Tauri 序列化、WebView 反序列化或主线程调度成本已经成为剩余主因。
- `result_for_assistant_chars` 只有 171716，但 `raw_result_string_chars` 达到 9063228，说明 UI 和模型可见上下文不应都背负完整 raw output。

workspace / snapshot：

- 切到 worktree 后 snapshot manager cold init 约 4199ms。
- 两个 `get_session_stats` 请求分别等待 lazy init 约 3294ms 和 1007ms，虽然已有并发去重，但调用方仍会被 stats 等待拖慢。
- stats/files 不应成为聊天内容首屏展示的前置条件；可以延后、局部 loading 或按当前 session 优先级调度。

远程：

- 本轮日志只显示 `remote_get_workspace_info: returning None` 和 `remoteCount=0`，没有真实远程 SSH restore、Git、snapshot 样本。
- 不能基于这份日志证明远程已优化完成；只能确认本地 `localhost` 不应污染远程计数。

### 11.3 当前根因排序

P0 级体验根因：

- 历史 session restore 返回完整 turns，其中包含完整 raw tool output。对 9MB raw output 的 session，后端已完成后前端仍等待约 2s。
- UI 可见历史内容和模型上下文恢复被绑在同一个 `restore_session_with_turns` 完整返回路径上。
- 旧 session 的 turn file 与 context snapshot 可能重复保存同一份巨大工具输出，导致读、parse、传输成本翻倍。

P1 级启动根因：

- snapshot warmup 在启动期读取近千个 metadata 文件，容易与 window create/WebView load 竞争。
- agent companion 在主窗口刚显示和历史 session restore 尚未稳定时拉起第二个 WebView。
- 首屏前配置链路仍有 `get_config` 大头，且 `font` optional not found 被按 error/failure 输出。

P1 级远程风险：

- 如果大 session restore 在真实远程场景仍返回完整 raw turns，将把本地 IPC 成本进一步放大为网络传输、远端序列化、反序列化和等待队列成本。
- 如果 session list/stats/snapshot 在远程切换时逐项拉取，会形成通信风暴。

P2 级后续治理：

- session metadata list 在启动和切 workspace 时仍有重复触发。
- LSP pre-start 对缺失插件连续输出 error，虽然不是本轮主要性能瓶颈，但会污染日志和排查视线。
- 长 session 缺少“体积预警”和“raw output 外置”策略，未来仍会继续制造更大的老化样本。

### 11.4 竞品与同类项目启发

以下不是照搬实现，而是用于校验方向是否合理。

| 产品 / 项目 | 公开资料观察 | 对 BitFun 的启发 |
|---|---|---|
| Claude Code | 官方 context window 文档强调 context 会包含文件读取、工具结果等内容，`/compact` 会用结构化 summary 替换历史，并重新注入必要启动内容；subagent 可让大文件读取留在独立上下文中。参考：[Claude Code context window](https://code.claude.com/docs/en/context-window) | 模型上下文和 UI transcript 不必完全等价；旧工具输出应可被摘要或引用，而不是长期占据主上下文 |
| Codex | 公开 issue 显示线程元数据与 JSONL rollout 需要兼容迁移，否则用户会感知为“历史丢失”；另一个 issue 指出超大 rollout JSONL 和内联大二进制会导致启动/加载崩溃风险。参考：[history intact but hidden](https://github.com/openai/codex/issues/21734)、[large JSONL crash](https://github.com/openai/codex/issues/22004) | 任何 session 存储改造都必须 legacy fallback；大 payload 应外置并引用，不能继续内联扩大 |
| OpenCode | session compaction 代码包含 overflow 检测、tail 选择和 prune old tool output 的逻辑。参考：[opencode compaction.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/compaction.ts) | 长 session 优化应保留最近上下文和结构化边界，对旧工具输出做可恢复的瘦身，而不是简单截断 |
| OpenClaw | session 文档使用 JSONL transcript，并提供 validate、archive、compact 等维护入口；compaction 文档提到 active transcript byte-size guard 和 compaction 后轮转 active transcript，旧 transcript 归档保留。参考：[OpenClaw sessions](https://openclaw-openclaw.mintlify.app/concepts/sessions)、[OpenClaw compaction](https://github.com/openclaw/openclaw/blob/main/docs/reference/session-management-compaction.md) | 可以考虑“活跃 transcript 瘦身 + 旧完整 transcript 归档”的方向，但不能原地破坏旧数据 |

共同启发：

- 元数据索引和完整 transcript 分离，但索引必须可重建。
- 同类项目常用“摘要/最近内容首屏 + 完整内容按需读取”，但 BitFun 若采用该策略，必须先证明不会让用户感知为历史缺失。
- raw tool output、图片、超长日志等大对象外置为 artifact/ref 可以作为候选方向，但属于 11.8 统一审视池。
- compaction/瘦身必须保留旧数据或可恢复路径，不能让用户认为历史丢失。

### 11.5 完整设计方案

#### A. 启动阶段：先显示可用 shell，再低优先级补齐能力

启动任务分层：

| 层级 | 必须完成后才能显示 | 处理方式 |
|---|---|---|
| Critical | app 基础配置、日志最低可用级别、主窗口 shell、最近 workspace/session metadata 最小集合 | 保持短链路，严格限制 IPC 数量和 payload |
| Interactive | 输入框、session 列表、当前 session loading/ready 状态、基础导航 | 可以在首屏后立即完成，但不得等待 snapshot/Git full status/Monaco |
| Idle | snapshot warmup、agent companion、Monaco warmup、Git full status、LSP pre-start、MCP/ACP 深初始化 | 进入后台调度器，低优先级、可取消、并发受限 |

具体方案：

- snapshot warmup 改为首屏显示后的后台任务，当前 workspace 优先，非当前 workspace 降级或取消。
- `get_session_stats` 不得触发用户等待式 snapshot cold init 阻塞聊天内容；stats 面板可以显示 loading 或稍后刷新。
- agent companion 默认延后到主窗口 `interactive_shell_ready` 之后，并避开正在进行的大 session restore。若用户明确依赖启动即出现 companion，需要单独裁定。
- `initializeFrontendLogLevelSync` 首屏前只读取 logging 必需项；AI models、AI experience、font 等非首屏必需配置延后或复用批量配置。
- `font` not found 在明确 `skipRetryOnNotFound=true` 的场景下不计为 startup failure，不输出 error；但非 optional config 仍保持错误。

保护：

- 不删除现有初始化能力，只调整调度优先级。
- 任何 idle 任务都必须可被用户操作打断或降优先级。
- 常用路径首次打开如 editor/diff 不能明显劣化；如果 Monaco lazy 让首次打开可感知变慢，则提前 idle warmup 或回退。

#### B. 历史 Session：拆分“可见历史”和“可继续对话上下文”

当前可执行的 API 方向：

```text
restore_session_view(request)
  -> session metadata
  -> visible turns, preserving legacy visible content
  -> payload diagnostics
  -> context_restore_state

ensure_session_context_ready(request)
  -> waits for existing background restore or restores now
```

兼容原则：

- 保留现有 `restore_session_with_turns` 行为，避免旧前端、测试或未迁移调用断裂。
- 新前端优先使用 `restore_session_view`，但当前阶段不得裁剪、截断或隐藏原本会在历史面板中可见的 turn 内容。
- 发送消息前必须调用或等待 `ensure_session_context_ready`，保证模型上下文与旧逻辑一致；如果 restore 失败，发送必须明确失败并提示 retry，不能静默新建上下文。
- 不在打开历史 session 后自动触发完整 context 背景恢复或逐 tool output 拉取；这类后台动作可能抢占远程通道或早期交互，进入统一审视池。

体验目标：

- 点击历史 session 到目标标题/loading shell：小于 100ms。
- 点击历史 session 到完整可见历史内容：legacy 大 session cold path 目标小于 1200ms；若不裁剪 raw output 无法达到目标，则记录证据并进入统一审视池，不用隐藏内容换数字。
- 发送前 context restore 可以等待同一个 in-flight restore，但必须有明确失败状态和 retry 路径。

风险与应对：

- 风险：context restore 未完成时用户发送消息。应对：发送前 await 同一个 in-flight restore。
- 风险：为了缩短首屏时间隐藏 raw output 或改成 lazy expand，用户感知为历史内容缺失。应对：默认不做，放入 11.8 统一审视。
- 风险：旧 session 解析仍需读 14MB JSON。应对：legacy fallback 第一阶段只避免 context snapshot 和 IPC 双重放大；是否通过新格式解决根源进入 11.8 裁定。

#### C. 长 Session 持久化：先观测和提示，格式改造统一审视

当前可执行策略：

- 为超大 session 记录体积指标：turn bytes、snapshot bytes、raw output bytes、largest output path、output count。
- 日志只记录聚合大小和字段路径，不记录完整工具输出、不改写旧数据。
- UI 只提供温和提示或局部 loading，不打断用户工作，不要求用户立即处理。
- 不改变新 session 写入格式，不引入 output ref/artifact 读写路径，直到兼容性和体验风险统一审视完成。

旧 session 读取策略：

- 不原地迁移、不删除、不改写旧 turn/snapshot。
- legacy reader 继续支持完整 JSON。
- 可选后台“非破坏性 sidecar index”只作为待裁定候选；在证明不会让 session 列表 stale 前不进入默认执行路径。

体积预警：

- 当单 session raw output 或 turn file 超阈值时，在日志中输出聚合 warning，并在 UI 中提供温和提示。
- 提示不得打断用户工作，不应要求用户手工处理；后续可以提供“压缩/归档”工具，但必须保留完整原文。

#### D. 远程连接：减少往返和大 payload，优先保证一致性

远程策略：

- 远程 restore 优先使用单次 coarse-grained `restore_session_view`，避免前端按 turn/tool 逐项请求。
- 当前阶段不因为本地首屏数字而新增远程预取、逐项 lazy output RPC、range/tail output 协议；这些都进入统一审视池。
- 如果未来要减少远程大 payload，必须在服务端一次生成可见内容和 refs，并证明用户体验不降级、远程 command count 不增加。
- session metadata list 使用 in-flight 去重和短 TTL，避免 workspace 切换时同路径重复三四次请求。
- snapshot/stats/Git full status 均为低优先级任务；危险操作前再强制刷新。

远程质量门禁：

- 后续 PR 必须提供真实远程 SSH 样本，至少包含 command count、payload bytes、duration、serialization estimate、cache hit/miss。
- 任何新增远程命令或 payload 增大，都必须解释用户收益；如收益只是本地启动数字变好，默认不接受。
- 远程连接身份、workspace path、session storage path 必须继续复用现有解析逻辑，不能引入新的 local-only 判断。

#### E. 日志与观测：定位慢点，但不制造新慢点

新增/保留日志点：

- startup：native setup、window build、page load start/finish、first script、first visible shell、interactive shell。
- session restore：metadata load、turn scan/read/parse、context snapshot scan/read/parse、payload raw chars、assistant chars、largest output、backend complete、frontend API complete、state commit complete。
- remote：command count、payload bytes、duration、serialization estimate、remote host class、本地 localhost 排除。
- scheduler：队列长度、in-flight dedupe hit、任务取消、超阈值任务，不逐 item 打日志。

不允许：

- 高频 render/effect 每次输出日志。
- 输出完整 payload、完整用户输入、完整工具输出。
- 为了观测在远程场景增加额外逐项 RPC。

### 11.6 修订后的三阶段执行计划

#### 阶段 1：安全诊断与低风险启动收敛

目标：不改变 session 存储格式，先修正明显日志和调度问题。

任务：

- 修正 optional `font` not found 的错误分类，只在 optional path 下不计 failure。
- 将 snapshot warmup、agent companion、LSP pre-start 明确纳入后台调度优先级，不阻塞 shell。
- 对 `get_session_stats` 增加“不可阻塞聊天内容”的调用约束和日志，必要时 UI 局部 loading。
- 收敛重复 session metadata list：同 workspace + filter 的 in-flight 去重和短 TTL。

质量：

- Web 单测覆盖 optional config、metadata in-flight、stats loading。
- desktop trace 验证启动 failure count 不被 optional config 污染。
- release-like 采样确认 `main_window_shown`、`interactive_shell_ready` 不劣化。

停止条件：

- companion 延后导致用户明确依赖能力变慢。
- stats 延后导致 UI 错误展示旧状态。
- metadata TTL 导致 session 列表不刷新或远程 stale。

#### 阶段 2：历史 Session 读路径瘦身

目标：优先解决第一次打开大 session 慢，不改写旧数据。

任务：

- 新增 `restore_session_view`，返回 metadata 和完整可见 turns，但不恢复 runtime context，不把 session 注入 backend active runtime。
- context snapshot restore 从 UI 首屏路径拆出；发送或继续执行前 `ensureBackendSession` 统一恢复 context，并做 in-flight 去重。
- 前端优先使用 view restore，保留 `restore_session_with_turns` fallback 和能力探测。
- 不做 raw output preview/ref、不做 output lazy expand、不新增逐 tool output API；这些可能让历史内容变成“稍后才完整”，统一放入 11.8 审视。

质量：

- legacy fixture：包含旧 turn JSON、旧 context snapshot、超大 Bash output。
- 测试确认旧 session 可打开、完整可见 raw output 不丢失、发送前会等待 context ready。
- 测试快速切 session 时旧 restore 不覆盖当前 active session。
- 远程 mock 或真实样本确认首屏 view 不发生 per-output RPC，不自动预取完整 context 或 tool output。

停止条件：

- 任何旧 session 无法恢复。
- 任意完整 raw output 丢失或顺序错乱。
- 发送消息时上下文与旧行为不一致。
- 远程 command count 因 view restore 或 context ensure 增加到不可解释。

#### 阶段 3：长 Session 治理的非破坏性准备

目标：在不改变写入格式、不引入新读取协议的前提下，补齐长 session 治理所需证据和用户可见保护。

任务：

- 增加 session size / raw output / snapshot payload 聚合日志和阈值 warning，不记录内容。
- 增加温和的 session 体积提示或诊断入口，优先解释原因，不打断用户操作。
- 建立 legacy fixture 和离线分析脚本，覆盖超大 output、旧 snapshot、远程路径。
- 将 output artifact/ref、新 snapshot 格式、sidecar index、自动 compaction 作为 11.8 候选方案统一评估，不在本阶段直接落地。

质量：

- 日志单测确认只输出大小、数量、字段路径，不输出工具内容或用户输入。
- fixture 覆盖旧 turn JSON、旧 context snapshot、超大 Bash output，确认读取路径保持兼容。
- 远程路径分析不新增远程逐项 RPC，不改变 remote workspace/session storage 解析。

停止条件：

- 需要原地迁移旧 session、删除旧 raw output 或改写历史文件。
- UI 提示打断常用操作、让用户误以为历史异常或必须立即清理。
- 离线分析或日志采集在常规 session 上造成可感知变慢。

### 11.7 兼容性与回滚策略

兼容性必须覆盖：

- 旧 session：完整 turn JSON、完整 context snapshot、无 output ref、无 sidecar index。
- 当前安全阶段：`restore_session_view` 读取旧 turn 并保留完整可见内容，context restore 延后但发送前恢复。
- 待裁定新格式：output ref、preview、artifact、瘦身 context snapshot、混合 session 双读。
- 远程 session：远程 workspace path、remote SSH host、remote storage/mirror path。
- ACP/BTW/子 session：不能被普通 historical restore 改写语义。

回滚原则：

- 阶段 1 可按调度点单独回滚，不涉及数据格式。
- 阶段 2 必须保留 `restore_session_with_turns` fallback，前端可通过 feature flag 或能力探测回退完整 restore。
- 阶段 3 当前只允许非破坏性日志、提示和 fixture；任何新写入格式必须先经过 11.8 审视。
- 如果后续批准 sidecar index，它只能可删除重建，不能作为唯一数据源。

### 11.8 可能导致用户体验降级的统一审视池

以下优化不进入当前默认执行路径。只有当日志证明收益明确、质量门禁覆盖兼容性和远程场景、且用户确认可接受体验权衡后，才允许拆成单独方案实施。

| 方案 | 潜在收益 | 可能的体验/功能/性能降级 | 进入实施前必须证明 | 当前结论 |
|---|---|---|---|---|
| raw output preview/ref + output lazy expand | 降低首屏 payload 和 IPC/反序列化成本 | 历史面板原本可见内容变成需要等待或点击；远程展开可能增加 RPC；搜索/复制可能不完整 | 完整内容无损可达、默认可见体验不退化、远程不产生 per-output 通信风暴 | 暂不实施 |
| 新 session output artifact/ref 写入格式 | 从源头降低 turn JSON 和 snapshot 膨胀 | 旧版本读取异常、写入链路更复杂、artifact 损坏导致内容缺失感 | 新旧/混合格式双读、原子写入、损坏提示、回滚和远程路径安全测试 | 暂不实施 |
| context snapshot 自动后台恢复或预热 | 发送前等待更短 | 启动/切 session 后抢占 CPU/磁盘/远程通道，导致滚动、输入或其他 session 切换变慢 | idle 调度、取消、并发上限、远程 command count 不上升，且早期交互无长任务 | 暂不实施 |
| Web Worker 承接大 turns 转换 | 降低主线程长任务 | structured clone 可能让首次内容出现更慢；类型和引用语义更复杂 | profile 证明 clone+worker 总成本低于主线程，且大/小 session 都不劣化 | 暂不实施 |
| 远程预取完整历史或完整 tool output | 再次打开更快 | 占用远程 SSH/relay 通道，增加序列化和网络压力，影响当前操作 | 真实远程样本证明 command count/payload/时延可控，且只在用户意图明确时触发 | 暂不实施 |
| Native splash 或双窗口启动 | 进程早期有反馈 | 焦点、窗口跳动、托盘/macOS 行为差异，可能比空窗更打扰 | 多平台冒烟、窗口生命周期测试、失败回退路径 | 暂不实施 |
| 为启动数字延后常用 editor/diff/Git/status 能力 | 降低 startup 指标 | 首次打开编辑器/diff 白屏或 Git 状态不可信，危险操作状态错误 | idle 预热、首次使用 loading、危险操作强制刷新和实测不劣化 | 仅保留已有保护，不再扩大 |
| 持久化 session index / sidecar refs | session list 或定位更快 | 索引 stale 造成列表/跳转不准，用户误以为历史缺失 | index 可重建、损坏自动回源、列表真相仍来自原始 session 文件 | 暂不实施 |
| 自动 compaction 或删除/截断旧 raw output | 控制长期体积 | 模型上下文语义变化、历史证据丢失、用户信任受损 | 用户显式触发、完整备份/归档、可恢复和清晰提示 | 暂不实施 |

统一审视结论：

- 当前继续执行的合理边界是“更早显示完整可见历史内容，延后不可见的 runtime context restore”，因为它不减少用户已经能看到的内容，也不增加远程逐项通信。
- `raw output preview/ref + lazy expand` 收益最大，但也最容易让用户感知为历史缺失；除非能证明默认视图完整可信、复制/搜索/展开都有无损路径，否则不应实施。
- `output artifact/ref` 和新 snapshot 格式属于长期治理方向，不适合和启动/首次打开优化混在同一个阶段；它需要单独 PR、单独兼容矩阵和远程样本。
- 自动后台预热、远程预取、Web Worker 转换、Native splash 都可能把耗时从一个指标转移到另一个用户操作上；没有 A/B 数据前，只保留为候选。
- 所有候选方案的共同底线：不能因为局部性能数字更好，让历史内容完整性、发送上下文一致性、远程连接稳定性或常用操作首次体验变差。

### 11.9 验收指标

| 指标 | 当前证据 | 阶段 2 目标 | 阶段 3 目标 |
|---|---:|---:|---:|
| `c44dd3c3...` backend restore | 1527ms | view restore 不等待 context snapshot，legacy cold 小于 1200ms | 非破坏性治理不劣化 |
| `c44dd3c3...` frontend API | 3517.3ms | 尽量接近 1200ms；若必须裁剪可见内容才达标，则进入 11.8 | 非破坏性治理不劣化 |
| 最大 raw output 首屏传输 | 8.61M chars | 当前安全阶段不裁剪原本可见内容，只避免 context snapshot 重复阻塞 | 是否外置或按需加载进入 11.8 |
| context snapshot parse | 734ms | 不阻塞可见历史；发送前再恢复 context | 是否改写新 snapshot 格式进入 11.8 |
| session stats lazy init | 1007ms-3294ms | 不阻塞聊天内容 | 可后台刷新并局部展示 |
| startup optional config failure | 1 | 0 | 0 |
| 真实远程 command count | 本轮无样本 | 不高于阶段 1 remote baseline | 不高于阶段 2 remote baseline |
| 远程大 session首屏 payload | 本轮无样本 | 不新增 per-output RPC，不自动预取 | 减 payload 的协议改造进入 11.8 |

最终判断标准：

- 如果用户更快看到可信且完整的当前可见历史内容，并且发送前上下文一致，这是可接受的体验优化。
- 如果为了减少启动或 restore 数字导致历史内容缺失、发送上下文不一致、远程多请求、Git 状态不可信或 editor/diff 首次显著变慢，则不接受。
- 如果性能收益和体验风险冲突，优先保护体验和数据兼容性，暂停并进入用户裁定。

### 11.10 仍需补充的日志与分析

当前设计方向已经覆盖启动、历史 session、长 session 持久化、远程连接、兼容性和回滚策略，可以作为后续阶段的总体方案。但若要把阶段 2/3 做到足够稳，需要在实施前或实施第一步补齐以下定位信息。

必须补充：

| 缺口 | 当前已知 | 需要补充 | 用途 |
|---|---|---|---|
| Tauri 返回后的序列化 / IPC / WebView 反序列化边界 | backend `restore_session_with_turns completed` 到 frontend API completed 有约 2s 差距 | backend return 前 response prepare 耗时、frontend response bytes estimate、API resolve 后 next frame/long task 聚合 | 确认 2s 主要来自 IPC/反序列化还是 React 落地 |
| React 实际渲染/绘制成本 | 当前 `state_commit_end` 只覆盖 setState 调用，不等于真实 render/paint | hydrate state commit 后 `requestAnimationFrame`、long task count/max duration、first message painted 阶段 | 避免只优化 API 耗时却让 UI commit 后继续卡顿 |
| 大 output 分布 | 当前只有 total raw chars 和 largest path | top N tool output size、tool name/type、field path、是否进入 `result_for_assistant`；不记录内容 | 判断 preview/ref 或字段外置是否值得进入 11.8 审视 |
| context snapshot 体积构成 | 已知 snapshot 与 turn 都约 14.48MB | snapshot payload stats：raw output chars、assistant chars、largest field、message count | 判断 snapshot 是否重复保存 raw output，以及新 snapshot 应如何瘦身 |
| 真实远程样本 | 本轮 `remoteCount=0`，没有 SSH restore/Git/snapshot | 真实 remote workspace 下启动、切 session、大 session restore 的 command count、payload bytes、duration | 防止本地优化在远程变成通信风暴 |
| session metadata 重复来源 | 日志显示重复 start/end，但缺 caller/source | workspace key、caller、in-flight key、dedupe hit/miss、短 TTL 命中 | 找到重复触发组件，避免误加缓存导致列表 stale |
| optional config failure 分类 | `font` optional not found 仍计 failure | config path 级聚合：path、optional、failure class，不输出配置值 | 修复 failure 指标污染，同时不掩盖真实配置错误 |

建议补充：

- 启动 release/安装包样本：debug Vite/WebView navigation 绝对值不可靠，阶段 1/2 的收益声明应优先看 release-like 或安装包。
- snapshot warmup A/B 分析：一次保留现状、一次延后 warmup，比较 `main_window_shown`、`interactive_shell_ready`、首次 stats ready。
- agent companion A/B 分析：保留现状与延后到 idle 后比较主窗口首屏和首次历史 session 打开。
- LSP pre-start error 去重分析：当前主要是日志噪声，不是 P0 性能根因，但会干扰排查。

不建议补充：

- 不在高频 render/effect 中逐次打日志。
- 不为了诊断远程场景新增 per turn/per tool RPC。
- 不记录完整工具输出、完整用户输入或完整 session payload。
- 不先做不可逆迁移来“获得数据”；旧 session 只能读分析或生成可删除 sidecar。

执行判断：

- 阶段 1 可以直接做，并同步补上述低风险日志。
- 阶段 2 当前只实施“不恢复 context、不裁剪可见 turns”的 `restore_session_view`；如果要引入 preview/ref 或 output lazy expand，必须先回到 11.8 审视。
- 阶段 3 当前只实施非破坏性日志、提示和 fixture；如果要改写新持久化格式，必须完成旧 session 文件结构离线分析、legacy fixture、artifact/ref 安全边界和真实远程样本验证，并单独获得裁定。

### 11.11 本轮补充的日志点

本轮先补诊断，不改变 session restore、远程协议或持久化格式。

已补充：

| 场景 | 日志 / 阶段 | 字段 | 目的 |
|---|---|---|---|
| 历史 session hydrate 后前端绘制 | `historical_session_after_state_commit_frame` | `sessionTraceId`、`remote`、`turnCount`、`frameCount`、`durationMs` | 区分 API resolve / setState 后，浏览器下一批帧是否仍有可感知卡顿 |
| session metadata list 重复来源 | `session_metadata_list_start/loaded/end/failed` | `source`、`metadataListTraceId`、`remote`、`sessionCount`、`durationMs` | 定位重复 list 是 FlowChatManager、MainNav 还是远程自动恢复触发 |
| 大 session API response 估算 | startup API summary 的 `restore_session_view` / `restore_session_with_turns` / `load_session_turns` | response bytes cap 从 64KB 提高到 2MB，仅限这些低频大响应 | 让历史 session 大 payload 的前端估算不再固定卡在 64KB，同时避免诊断估算在超长 session 首开热路径上额外遍历过多数据 |
| restore turns payload top N | `restore_session_with_turns payload diagnostics` | `top_raw_results=toolName:rawChars:assistantChars:path` | 看清最大 raw output 来自哪些工具和字段，不记录内容 |
| context snapshot payload stats | `Loaded latest context snapshot` | `tool_result_count`、`raw_result_string_chars`、`result_for_assistant_chars`、`largest_raw_result_chars`、`largest_raw_result_path` | 判断 snapshot 是否重复保存 raw output，以及瘦身应切到哪里 |

日志安全约束：

- 不记录完整工具输出、完整用户输入、完整 session payload、workspace path、remote host。
- `top_raw_results` 只包含工具名、字符数量和字段路径，不包含字段值。
- snapshot payload stats 只在 snapshot load 已经超过 80ms 或 snapshot 文件数较多时计算，避免给常规小 session 增加无意义遍历。
- 仅对 `restore_session_view` / `restore_session_with_turns` / `load_session_turns` 提高 response 估算上限到 2MB，避免高频 API 都执行大对象遍历，也避免超长 session 的诊断估算本身成为新的首开成本。

看新日志时的判断方式：

- 如果 backend completed 到 frontend API completed 仍大，但 `historical_session_after_state_commit_frame` 很小，优先判断 IPC/反序列化是主因。
- 如果 frontend API completed 不大，但 `historical_session_after_state_commit_frame` 大，优先判断 React render/paint 或工具卡片落地是主因。
- 如果 turn payload 和 snapshot payload 的 `largest_raw_result_path` 指向同一类工具字段，说明重复保存 raw output 的判断成立。
- 如果 metadata list 的 `source` 集中在同一来源，先做该来源去重；如果多个来源并发触发，再考虑 store 层 in-flight/TTL。

### 11.12 当前安全执行状态

本轮按“体验不降级”原则收紧后，当前代码只保留以下安全优化：

- `restore_session_view` 读取 metadata 和完整可见 turns，但不加载 context snapshot，不写入 backend runtime session/context。
- 前端历史 session hydrate 优先使用 `restore_session_view`；若能力不可用，回退 `restore_session_with_turns`，再回退旧的 `restore_session + load_session_turns`。
- 如果前端方法存在但旧后端未注册 `restore_session_view` / `restore_session_with_turns` Tauri command，仅在明确 unsupported-command 错误时逐级回退，真实 restore 失败不吞掉。
- unsupported restore command 会按当前运行期和远程身份缓存，后续同一后端身份的历史 session 不再重复发送已知必失败的 restore command，避免旧后端场景额外失败 IPC 和日志噪声，同时避免旧远程端点影响本地或新远程端点的优化路径。
- 已覆盖两级旧后端组合：缺少 `restore_session_view` 时回退完整 `restore_session_with_turns`；缺少 `restore_session_with_turns` 时回退 legacy `restore_session + load_session_turns`。
- `contextRestoreState=pending` 只表示 backend runtime context 尚未恢复；用户发送或继续执行前由 `ensureBackendSession` 恢复并做 in-flight 去重。
- snapshot 刷新策略已把 `contextRestoreState=pending` 视为暂缓条件，避免历史 session 可见内容刚加载后立即抢占 snapshot manager 初始化资源。
- restore payload top N 诊断只在 debug 日志开启时采集，避免非诊断场景为了日志统计额外遍历大 turns。
- 当前没有实现 raw output preview/ref、output lazy expand、逐 tool output API、artifact/ref 新写入格式、自动 compaction、远程完整 output 预取。
- 已补保护测试，确认 `restore_session_view` 和前端转换都保留完整可见 tool result 与 `result_for_assistant`，防止后续把可见历史内容悄悄裁剪掉。

后续继续执行时，必须先检查变更是否落入 11.8 审视池；若落入，则不应直接实施，只能补充度量、fixture、风险评估或等待用户裁定。

### 11.13 2026-05-17 PR #760 当前进展与后续工作

当前进展：

- 已基于最新 `upstream/main` 提交 PR [GCWing/BitFun#760](https://github.com/GCWing/BitFun/pull/760)，head 为 `limityan/BitFun:yanzhn/web-ui-startup-m3`，PR 内保持 2 个 commit；本设计文档和 `docs/perf-baselines` 未纳入 PR。
- PR 当前覆盖启动、历史 session 首开、session 保存、snapshot/Git/config 后台竞争四类安全优化；没有引入 raw output preview/ref、output lazy expand、逐 tool output API、artifact/ref 新写入格式、自动 compaction、远程完整 output 预取、Web Worker turns 转换或 native splash。
- 历史 session 首开路径已拆分为“完整可见历史内容”和“可继续对话 runtime context”：`restore_session_view` 只读取 metadata + 完整可见 turns，不恢复 context snapshot；发送或继续执行前通过 `ensureBackendSession` 恢复 backend context，并对同一 restore 做 in-flight 去重。
- 兼容性 fallback 已覆盖三层：`restore_session_view` -> `restore_session_with_turns` -> `restore_session + load_session_turns`；unsupported command 只在明确命令不存在时降级，真实 restore 失败不会被吞掉。
- session metadata 保存已从常规路径的全量 turn 扫描收敛为增量更新，并增加 per-session metadata update lock；如果存储不一致或无法安全增量更新，仍回退 full scan。
- 启动期 AI 配置读取已通过 `get_configs` 批量化，旧后端不支持时回退 per-key `get_config`；Git 启动刷新使用 basic-only 路径，危险 Git 操作前仍保留强制刷新保护。
- snapshot refresh 已在 `historyState=metadata-only/hydrating/failed` 或 `contextRestoreState=pending` 时暂缓；待历史内容 ready 且 context 状态允许后再恢复刷新，避免抢占首开关键链路。
- startup trace / API trace 已保留聚合式、阈值式诊断；大 session response bytes 估算上限审计后收敛到 2MB，避免诊断本身对超长 session 造成可感知成本。
- 第三方审计视角已修正 3 个问题：response 估算上限过大、snapshot 未覆盖 pending context、unsupported restore command 缓存没有按远程身份隔离。

已完成验证：

- `git diff --check upstream/main..HEAD`
- `rustfmt --edition 2021 --check src/crates/core/src/agentic/persistence/manager.rs`
- `pnpm run type-check:web`
- `pnpm run lint:web`
- `pnpm exec vitest run src/flow_chat/services/flow-chat-manager/SessionModule.test.ts`
- `pnpm exec vitest run src/infrastructure/api/service-api/ApiClient.test.ts src/tools/snapshot_system/hooks/snapshotRefreshPolicy.test.ts src/flow_chat/store/FlowChatStore.test.ts`
- `pnpm exec vitest run --maxWorkers=1`
- `cargo test -p bitfun-core save_dialog_turn_updates_metadata_without_scanning_unrelated_turn_files -- --nocapture`
- `cargo test -p bitfun-core concurrent_dialog_turn_saves_keep_metadata_counts_consistent -- --nocapture`
- `cargo check -p bitfun-desktop`

后续必须完成或继续跟踪：

| 后续项 | 当前状态 | 完成标准 | 风险控制 |
|---|---|---|---|
| PR CI / review feedback | #760 已创建，需等待远端 checks 和人工 review | CI 通过；review 反馈中若涉及行为风险，先补测试再修代码 | 不为通过 CI 放宽阈值或隐藏风险；不把 docs 纳入该 PR |
| 真实远程 SSH 样本 | 当前环境仍无真实远程样本，本地 `remoteCount=0` 不能替代远程结论 | 采集启动、首次打开历史 session、切换 session、Git basic/status 的 command count、payload bytes、duration、serialization estimate、cache hit/miss | 若远程 command count 或 payload 上升，暂停相关优化并回到 11.8 审视 |
| 手动体验 smoke | 自动化已覆盖 fallback 和状态流，但仍需桌面真实操作确认 | 本地打开历史 session 不闪成新建界面；首次发送前 context 恢复成功；快速切 session 不被旧 hydrate 覆盖；首次 editor/diff/Git 危险操作无明显退化 | 任何可见历史缺失、首开明显卡顿、发送上下文不一致都应回退或暂停 |
| 新日志复盘 | #760 合入前后的真实日志尚未补采 | 基于新版本日志确认 `restore_session_view`、API response bytes、after state commit frame、snapshot pending gate 是否按预期生效 | 日志只看聚合和字段路径，不记录完整 payload 或用户内容 |
| PR 后性能复测 | 当前 M1/M2/M3 release-like 数据已记录，但 #760 审计修正后尚未重新采样 | 至少 release-like 3 次，记录 main window shown、interactive shell ready、startApplication、afterRender、API count、request/response bytes、payload estimate duration | 不用 debug 绝对值声明收益；只用 release-like/release 或同口径对比 |
| 长 session 非破坏性治理 | 目前只做诊断，不改写格式 | 有超大 output / snapshot payload fixture；确认诊断能定位 top N 字段且不输出内容 | 任何 output ref、artifact/ref、自动 compaction、preview/lazy expand 都必须先经用户裁定 |
| 文档与代码一致性 | 本节已记录 #760 当前实现和审计修正 | 若 PR 后续继续改动性能路径，必须同步更新本节状态、风险和验证命令 | 不把设计文档随 #760 提交；只在后续专门文档任务中处理 |

当前不应继续直接实施的项：

- 不做 raw output preview/ref 或 output lazy expand，因为它可能让历史面板原本完整可见的内容变成延迟可见，属于体验降级风险。
- 不做 output artifact/ref 新写入格式、sidecar index 或自动 compaction，因为它们会改变持久化兼容边界，需要单独设计、legacy fixture 和回滚策略。
- 不做远程完整历史或完整 output 预取，因为当前缺少真实远程样本，无法证明不会增加通信风暴或序列化压力。
- 不做 Web Worker turns 转换，因为尚未证明 structured clone + worker 调度总成本低于主线程转换，也可能推迟内容出现。
- 不做 native splash / 双窗口启动，因为窗口生命周期、焦点和跨平台体验风险高于当前收益证据。

推荐下一步：

1. 等待 #760 CI 和 reviewer 反馈；若反馈涉及已识别风险，优先补自动化保护再改代码。
2. 用 #760 构建产物采一组 release-like 启动和历史 session 首开日志，重点看 `restore_session_view`、`historical_session_after_state_commit_frame`、snapshot pending gate、API response bytes。
3. 由用户提供真实远程 SSH workspace 样本后，再评估是否需要进入远程协议/批量接口层面的后续优化。
4. 在没有新日志和用户裁定前，只允许继续做非破坏性诊断、fixture、文档和测试补强。
