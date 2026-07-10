## Why

manboard 当前是一个扁平的 Thread 列表，只靠 `priority: now/next/later` 这一个轻重轴组织生活/工作条目，且整个应用被多套了一层不必要的 `life-dashboard/` 目录。用户对它的长期定位是**个人 AI 操作系统的前端壳子**——一个统一聚合今日/本周/长期目标、当前项目、待办、AI 对话摘要、研究方向、正在玩的看的东西、工作流入口的中枢面板。

这个面板的价值不只是 dashboard 页面，而是「core（统一数据抽象 + 多源连接器）」与「dashboard（展示壳子）」分离后，未来能逐步接入 Postgres / Obsidian / AI 对话存档 / RSS / GitHub issues / Calendar / Task system / LLM API 等外部源。本次 change 只打地基：搭出三层架构、把 Thread 演进为可落时间轴的通用条目、交付一个能手动录入并覆盖全部分区的最小可体验面板。其余设计细节（horizon 是独立轴还是属性、连接器实现、AI 摘要自动生成等）刻意留到体验后再决定。

## What Changes

- **目录与命名拍平**：移除多余的 `life-dashboard/` 一层，应用代码重新组织为 `core / dashboard / data` 三层。**BREAKING**（相对内部结构，非外部 API）。
- **三层架构分离**：
  - `core` — 统一 Item 抽象、`storage` 接口、`connector` 接口
  - `dashboard` — React 面板前端
  - `data` — 私有数据目录，gitignore，仓库只带空/样例数据集
- **数据模型演进**：在现有 Thread 抽象上新增 `horizon`（today/week/long/none）字段，使条目可落到时间轴分区；保留现有 `type/status/priority/area` 等字段以兼容既有数据。不强行做 horizon 正交设计，留待体验后定。
- **面板 UI 重构**：从单列表改为按 9 个分区（今日目标 / 本周目标 / 长期目标 / 当前项目 / 待办 / AI 对话摘要 / 正在研究的方向 / 正在玩的看的东西 / 工作流入口）呈现，每区支持手动增删改查。
- **storage 抽象化**：JSON 文件作为 reference 实现并保留为默认，但抽出统一 `storage` 接口，使后续换 Postgres/SQLite 只需新增 adapter。
- **connector 接口契约**：只定义 `connector` 接口的形状（契约），不实现任何真实外部源。
- **开源/私有分离**：框架代码可开源，私有数据通过 `.gitignore` 排除，仓库只保留空/样例数据集。
- **现有数据迁移**：`backend/data/threads.json` 中的既有条目平滑迁移到新结构（补齐 `horizon` 默认值）。

## Capabilities

### New Capabilities
- `core-data-model`: core 层的统一 Item 数据抽象，包含 type/status/priority/area/horizon 等字段及其校验规则。
- `storage-abstraction`: 统一的 storage 接口契约及 JSON reference 实现，定义 core 如何读写条目。
- `connector-contract`: connector 接口契约的定义，约定未来外部源（Obsidian/RSS/Calendar 等）如何向 core 喂数据；本次只定义契约，不含实现。
- `dashboard-shell`: dashboard 层的分区面板前端，按 9 个分区呈现条目并支持手动 CRUD。
- `repo-layout`: 仓库三层目录结构（core/dashboard/data）与开源/私有数据分离约定。

### Modified Capabilities
<!-- 当前 openspec/specs/ 为空，无既有 capability 需要修改 -->

## Impact

- **代码结构**：`life-dashboard/backend` → `core`，`life-dashboard/frontend` → `dashboard`，私有数据 → `data/`；路径、导入、构建脚本相应调整。
- **后端 (core)**：FastAPI 路由 `/threads` 扩展以支持 `horizon` 字段；storage 抽出接口，JSON 实现适配接口；新增 connector 接口定义（无实现）。
- **前端 (dashboard)**：`App.tsx` 从单列表改为分区布局；`types/thread.ts` 增加 horizon 枚举；`api/threads.ts` 适配；新增分区组件。
- **数据迁移**：`threads.json` 既有条目需补 `horizon: none`（或按 type 推断默认），保证旧数据不丢。
- **配置**：`.gitignore` 排除 `data/` 真实数据；README 更新新结构与启动方式。
- **依赖**：不引入新运行时依赖（仍 FastAPI + React + TS + Tailwind）。
- **非目标影响**：不接任何真实外部源、不做 AI 摘要自动生成、不做认证/多用户/云端部署。
