## Context

manboard 当前是一个单层应用：`life-dashboard/{backend, frontend}`，扁平 Thread 列表 + 单文件 JSON 存储，靠 `priority: now/next/later` 单轴组织。后端是 FastAPI + Pydantic，前端是 Vite + React 18 + TS + Tailwind v3。

长期定位是「个人 AI 操作系统的前端壳子」，需要把 **core（数据抽象 + 多源连接器）** 和 **dashboard（展示壳子）** 分离，为未来接入 Postgres / Obsidian / AI 对话存档 / RSS / GitHub issues / Calendar / Task system / LLM API 铺路。本次只打地基，且用户明确要求「先给最 general 的 MVP，体验后再迭代」——因此本设计刻意保留多个未定设计点（见 Open Questions），用最简单、不锁死未来的方式先跑起来。

约束：
- 不引入新运行时依赖（仍是 FastAPI + React + TS + Tailwind）
- 本地可跑（`uvicorn` + `npm run dev`），不做云端/认证/多用户
- 开源框架、私有数据分离

## Goals / Non-Goals

**Goals:**
- 三层目录结构落地：`core / dashboard / data`，移除多余 `life-dashboard/` 层
- core 提供 Item 数据抽象、storage 接口（含 JSON reference 实现）、connector 接口契约（无实现）
- dashboard 以 9 分区呈现条目并支持手动 CRUD
- Item 模型新增 `horizon` 字段（today/week/long/none），现有数据平滑迁移
- 框架与私有数据分离，仓库只带空/样例数据集

**Non-Goals:**
- 不实现任何真实外部 connector（Postgres/Obsidian/RSS/GitHub/Calendar/LLM）
- 不做 AI 对话摘要的自动生成（该分区 MVP 仅手动录入）
- 不做双向同步、多用户、认证、云端部署
- 不确定 horizon 正交设计——MVP 仅加字段，留待体验后定
- 不重写 Thread 模型，仅演进式扩展

## Decisions

### D1: 目录分层 —— `core / dashboard / data`（拍平 life-dashboard）
- `core/`（原 backend）：FastAPI + Pydantic，含 models / storage 接口 / connector 接口 / routes。
- `dashboard/`（原 frontend）：Vite + React + TS + Tailwind 面板。
- `data/`：私有数据，gitignore，仓库保留 `data/.gitkeep` 或样例集。
- **理由**：展示层与数据/服务层解耦，是「dashboard 可被多前端消费」「core 可接多源」的前提。
- **替代方案**：保留 `life-dashboard/` 单层、只加 `data/`——被否，因为命名与「manboard = AI-OS 壳子」定位不符，且不利于未来 core 独立复用。

### D2: 数据模型 —— 演进式扩展 Thread，新增 `horizon` 字段
- 在现有 `Thread` 上加 `horizon: enum{today, week, long, none}`，默认 `none`。
- 保留 `type/status/priority/area/nextAction/notes`，向后兼容。
- 不区分「Item」与「Aggregate」两种一级公民——MVP 统一为 Item，留给后续 connector 决定。
- **理由**：用户要求 general MVP、复用现有数据；horizon 是体验分区所需的最小新增。
- **未定**（见 Open Questions）：horizon 是独立正交轴还是某个 type 的属性。MVP 采用「加字段、不约束正交」最弱形式。

### D3: 分区映射 —— dashboard 由 `type` + `horizon` 推导分区，不做独立 section 实体
- MVP 不新建「section」实体；9 个分区是前端视图，由条目的 `type` 和 `horizon` 组合筛选呈现：
  - 时间区：`horizon=today/week/long` 的条目（含 goal 等）
  - 当前项目：`type=project`
  - 待办：`type=todo`
  - AI 对话摘要：`type=ai-chat`
  - 研究：`type=research`
  - 媒体（玩的/看的）：`type=game/novel/anime/video`
  - 工作流入口：单独的链接/书签类条目（见 D6）
- **理由**：避免过早引入分区实体导致模型复杂；视图层组合足够 MVP 体验。是否需要 section 一等公民留待体验后定。

### D4: storage —— 抽象接口 + JSON reference 实现
- 定义统一 `Storage` 协议（list/get/create/update/delete），JSON 文件实现适配该协议并作为默认。
- **理由**：后续换 Postgres/SQLite 只需新增 adapter，不动 core 业务逻辑与 dashboard。
- **替代方案**：v1 直接上 SQLite/Postgres——被否，违反「低摩擦个人面板」定位且超出 MVP。

### D5: connector —— 只定接口契约，不实现
- 定义 `Connector` 协议形状（如 `fetch() -> list[Item]`），本次不实现任何外部源。
- **理由**：地基阶段需要接口形状固定下来，避免后续每个 connector 长得不一样；但实现真实源会大幅扩大范围。
- **未定**：connector 是只读 pull 还是双向 sync——MVP 仅占位，留待引入第一个真实源时定。

### D6: 工作流入口 —— 作为新 type `entry` 的链接条目
- 新增 `ThreadType.entry`（工作流入口），承载「快速跳转到某工具/流程」的链接/书签。
- **理由**：复用 Item 抽象，不为它单开实体。

### D7: 开源/私有分离 —— `.gitignore` 排除真实数据
- `data/` 下真实数据 gitignore，仓库保留 `data/sample/` 样例集供框架演示。
- **理由**：用户明确「开源的是框架，不是数据」。

## Risks / Trade-offs

- **[horizon 字段语义弱]** → MVP 故意不定正交设计；体验后若混乱，单独 change 收敛为正交轴或 section 实体。
- **[connector 接口可能返工]** → 只定义最小契约（fetch 返回 list[Item]），同步/认证等留到引入真实源时再补；接受首次接入真实源时可能调整接口。
- **[分区映射靠视图组合]** → 若用户希望分区本身可自定义/排序/隐藏，需要后续把 section 提为一等公民。MVP 固定 9 区。
- **[数据迁移风险]** → 现有 `threads.json` 仅 1 条样例数据，迁移风险低；仍需为旧条目补 `horizon: none` 默认值，保证不丢数据。
- **[目录重构影响构建脚本]** → 路径/导入需同步调整，通过保持各层内部结构基本不变（只改外层路径）降低影响。

## Migration Plan

1. 建新三层目录，移动 `backend→core`、`frontend→dashboard`，调整导入/路径/构建脚本。
2. core：扩展 Item 模型（加 horizon、entry type）、抽 storage 接口、JSON 实现适配、加 connector 接口契约。
3. 写一次性迁移逻辑：遍历 `data/threads.json`，为缺 `horizon` 的旧条目补默认值。
4. dashboard：改分区布局、适配 API、迁移样例数据。
5. `.gitignore` 排除 `data/` 真实数据，留样例集。
6. 本地拉起前后端验证。
- **回滚**：目录重构前打 git tag；若失败可整体回退到重构前 commit。

## Open Questions

- **horizon 是独立正交轴，还是 type 的属性？** MVP 暂用「加字段、不约束正交」，留体验后定。
- **是否需要 section 一等公民（可自定义/排序/隐藏分区）？** MVP 固定 9 区视图组合，留待体验。
- **connector 是只读 pull 还是双向 sync？** 留待引入第一个真实源时定。
- **Item 与 Aggregate（如 AI 摘要这类衍生聚合）是否需要分两种一级公民？** MVP 统一为 Item，留待体验。
