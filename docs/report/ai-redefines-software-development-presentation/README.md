# AI 如何重新定义软件开发：演讲材料

本目录保留原版演讲材料，并新增 V0.2 版本。V0.2 继续使用整页图片式 PPT，重点增强案例引导、外部调研依据、工程治理和开发者角色映射。

## 原版材料

- `ai-redefines-software-development.pptx`：原版演讲用 PPTX。
- `speaker-notes.md`：原版分页讲稿。
- `slides-png/`：原版逐页 SVG 与 PNG。
- `preview-contact-sheet.png`：原版缩略总览。
- `build-deck.cjs`：原版可复现生成脚本。

重新生成原版：

```powershell
node .\docs\report\ai-redefines-software-development-presentation\build-deck.cjs
```

## V0.2 材料

- `ai-redefines-software-development-v0.2.pptx`：V0.2 演讲用 PPTX，13 页。
- `speaker-notes-v0.2.md`：V0.2 分页讲稿，按约 15 分钟节奏扩展。
- `slides-png-v0.2/`：V0.2 逐页 SVG 与 PNG。
- `preview-contact-sheet-v0.2.png`：V0.2 缩略总览。
- `build-deck-v0.2.cjs`：V0.2 可复现生成脚本。

重新生成 V0.2：

```powershell
node .\docs\report\ai-redefines-software-development-presentation\build-deck-v0.2.cjs
```

V0.2 主线：BitFun 的高速 AI 开发经验 -> 代码量膨胀后的真实问题 -> 产出放大后的协作对象变化 -> 概率过程与证据放行 -> 外部调研中的生产率悖论 -> 质量责任、DFX、TDD 与团队交付流 -> 开发者在新工程系统中的关键位置。
