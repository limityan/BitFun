# AI 如何重新定义软件开发：演讲材料

本目录包含一份 15 分钟演讲用 PPTX、分页演讲稿和逐页图片预览。

- `ai-redefines-software-development.pptx`：演讲用 PPTX，11 页，每页为整页图片式设计。
- `speaker-notes.md`：按页分页的讲稿、页内重点、互动提问和转场。
- `slides-png/`：每一页导出的 SVG 与 PNG，可用于单页预览或二次编辑。
- `preview-contact-sheet.png`：8 页缩略总览。
- `build-deck.cjs`：可复现生成脚本。

重新生成：

```powershell
node .\docs\report\ai-redefines-software-development-presentation\build-deck.cjs
```

报告主线保持为：BitFun 的高速 AI 开发现象 -> 探索变快与变化变快 -> 质量责任被重新定义 -> 开源高质量协作与大厂复杂交付 -> code review、架构稳定性、性能看护和发布控制 -> BitFun 作为 Planning / Evidence / Review / Self-iteration 缩影 -> 开发者角色从写代码转向组织智能协作系统。
