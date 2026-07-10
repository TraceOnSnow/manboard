# Comet Design Handoff

- Change: manboard-foundation
- Phase: design
- Mode: compact
- Context hash: 64ef6299418a08c4f9dd69768951f0cb1112f477ed6015c793dcd5a80613eebf

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/manboard-foundation/proposal.md

- Source: openspec/changes/manboard-foundation/proposal.md
- Lines: 1-41
- SHA256: 6447ab806b13777811633ccf822024dcda82a309a1f218e952503a4ed30b212a

```md
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

```

## openspec/changes/manboard-foundation/design.md

- Source: openspec/changes/manboard-foundation/design.md
- Lines: 1-96
- SHA256: 5b92d2eb91f1b4aed605f96377c0fb2e9605485f6f0b1fde2112ad594c7bd52f

[TRUNCATED]

```md
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


```

Full source: openspec/changes/manboard-foundation/design.md

## openspec/changes/manboard-foundation/tasks.md

- Source: openspec/changes/manboard-foundation/tasks.md
- Lines: 1-55
- SHA256: b3b177c4bd5fe0f05166a6483759d672f8a975dd858108d8e5827e3f3ed89bf3

```md
## 1. 目录重构

- [ ] 1.1 打 git tag `pre-foundation` 作为回滚点
- [ ] 1.2 新建 `core/`、`dashboard/`、`data/` 三层目录
- [ ] 1.3 将 `life-dashboard/backend` 内容移入 `core/`，`life-dashboard/frontend` 内容移入 `dashboard/`
- [ ] 1.4 移动现有真实数据到 `data/`（如 `data/threads.json`）
- [ ] 1.5 删除空的 `life-dashboard/` 目录
- [ ] 1.6 更新 `.gitignore`：排除 `data/` 下真实数据，保留 `data/sample/` 与 `data/.gitkeep`
- [ ] 1.7 创建 `data/sample/` 样例数据集（迁移后的脱敏条目）和 `data/.gitkeep`

## 2. core 数据模型

- [ ] 2.1 在 `core/app/models.py` 新增 `horizon` 枚举（today/week/long/none），并入 `ThreadBase` 与 `Thread`
- [ ] 2.2 在 `ThreadType` 枚举新增 `entry`（工作流入口）
- [ ] 2.3 校验 `horizon` 取值在枚举内（Pydantic 自动校验），确认非法值被拒

## 3. core storage 抽象

- [ ] 3.1 在 `core/app/` 定义统一 `Storage` 协议（list/get/create/update/delete）
- [ ] 3.2 重构 `storage.py`：JSON 读写适配 `Storage` 接口，作为默认 reference 实现
- [ ] 3.3 将 JSON 文件路径改为可配置（默认 `data/threads.json`，支持环境变量覆盖）

## 4. core connector 契约

- [ ] 4.1 在 `core/app/` 定义 `Connector` 接口契约（`fetch() -> list[Thread]` 形状）
- [ ] 4.2 确认仓库内无任何真实外部源实现

## 5. 数据迁移

- [ ] 5.1 写一次性迁移逻辑：遍历 `data/threads.json`，为缺 `horizon` 的旧条目补默认值 `none`
- [ ] 5.2 运行迁移，验证既有条目不丢失、字段完整

## 6. core API 适配

- [ ] 6.1 确认 `/threads` 路由（GET/POST/PATCH/DELETE）支持 `horizon` 字段的读写
- [ ] 6.2 更新 CORS/启动配置路径以适配 `core/` 新位置
- [ ] 6.3 在 `core/` 下运行 `uvicorn`，确认服务启动且 `/health`、`/docs` 可用

## 7. dashboard 类型与 API

- [ ] 7.1 在 `dashboard/src/types/thread.ts` 增加 `horizon` 枚举与 `entry` type
- [ ] 7.2 更新 `api/threads.ts` 以支持 `horizon` 字段（API base URL 与新结构路径一致则无需改）

## 8. dashboard 分区面板

- [ ] 8.1 重构 `App.tsx`：从单列表改为 9 分区布局（今日/本周/长期目标 · 当前项目 · 待办 · AI 对话摘要 · 研究 · 媒体 · 工作流入口）
- [ ] 8.2 实现分区筛选逻辑：时间区由 `horizon` 推导，内容区由 `type` 推导
- [ ] 8.3 各分区内按 `priority`（now→next→later）排序
- [ ] 8.4 确保每分区支持手动新增/编辑/删除（复用 ThreadForm/ThreadCard）
- [ ] 8.5 空分区保留占位呈现

## 9. 文档与验证

- [ ] 9.1 更新 `README.md`：新三层结构、core/dashboard 启动方式、data 说明
- [ ] 9.2 端到端验证：拉起前后端，确认 9 分区可见、新增条目落盘刷新仍在、时间分区正确归类、删除生效

```

## openspec/changes/manboard-foundation/specs/connector-contract/spec.md

- Source: openspec/changes/manboard-foundation/specs/connector-contract/spec.md
- Lines: 1-15
- SHA256: 8ec97923d42780d127aa4df1836d1302aa8beda98ef2323e860a84e7bd2d529b

```md
## ADDED Requirements

### Requirement: Connector 接口契约
core SHALL 定义一个 `Connector` 接口契约，用于约定未来外部数据源如何向 core 提供条目。本次只定义契约形状，MUST NOT 包含任何真实外部源的实现。

#### Scenario: 契约存在但无实现
- **WHEN** 检查 core 代码
- **THEN** 存在 Connector 接口定义，且仓库中没有任何真实外部源（Postgres/Obsidian/RSS/GitHub/Calendar/LLM）的实现代码

### Requirement: Connector 最小形状
Connector 接口 SHALL 至少定义一个从外部源获取条目并转为 core Item 的方式（如 `fetch() -> list[Item]`）。是否支持双向同步不在本次契约范围。

#### Scenario: 占位契约可被未来实现
- **WHEN** 未来实现第一个真实 connector
- **THEN** 它能实现该接口契约的形状；若契约不足以支撑该源，可在引入时通过新 change 调整

```

## openspec/changes/manboard-foundation/specs/core-data-model/spec.md

- Source: openspec/changes/manboard-foundation/specs/core-data-model/spec.md
- Lines: 1-33
- SHA256: 3802cb26bd6e5a9669e0a5d30b42cbe924132a4b39adcad054295d87f869b10f

```md
## ADDED Requirements

### Requirement: Item 字段集合
core 数据模型 SHALL 以 `Item`（沿用 Thread 命名亦可）为统一条目抽象，MUST 包含以下字段：`id`、`title`、`type`、`status`、`priority`、`area`、`nextAction`、`notes`、`horizon`、`lastTouched`、`createdAt`、`updatedAt`。其中 `title`、`type` 为必填，其余可空。

#### Scenario: 新建条目含必填与可选字段
- **WHEN** 创建一个新 Item，仅提供 `title` 与 `type`
- **THEN** 系统接受创建，其余字段取默认值（`status=active`、`priority=next`、`horizon=none`），并由系统生成 `id` 与三个时间戳

### Requirement: horizon 字段
Item SHALL 包含 `horizon` 字段，取值限定为枚举 `today`、`week`、`long`、`none`，默认 `none`。horizon 表示条目落在哪个时间尺度分区。

#### Scenario: 条目落今日分区
- **WHEN** 一个 Item 的 `horizon=today`
- **THEN** 该条目出现在 dashboard 的「今日目标」分区

#### Scenario: 旧数据默认 horizon
- **WHEN** 一个不含 horizon 的旧条目被加载
- **THEN** 系统为其补默认值 `horizon=none`，不报错、不丢数据

### Requirement: type 枚举含工作流入口
Item 的 `type` SHALL 限定为枚举：`goal`、`project`、`todo`、`research`、`game`、`novel`、`anime`、`video`、`ai-chat`、`entry`、`self-improvement`、`other`。其中 `entry` 表示工作流入口条目。

#### Scenario: 工作流入口类型
- **WHEN** 创建一个 `type=entry` 的 Item
- **THEN** 系统接受该类型，条目可作为工作流入口呈现

### Requirement: 字段校验
core SHALL 在创建/更新 Item 时校验字段合法性：`title` 非空、`type`/`status`/`priority`/`horizon` 取值在对应枚举内，非法输入被拒绝。

#### Scenario: 非法枚举被拒
- **WHEN** 提交一个 `horizon=someday`（非合法枚举）的创建请求
- **THEN** 系统拒绝该请求并返回校验错误

```

## openspec/changes/manboard-foundation/specs/dashboard-shell/spec.md

- Source: openspec/changes/manboard-foundation/specs/dashboard-shell/spec.md
- Lines: 1-37
- SHA256: a13e3386a99b5cd2f3468db13028e2c83d9cb9df6cbdbe67f5dd78ca13d2b725

```md
## ADDED Requirements

### Requirement: 9 分区呈现
dashboard SHALL 以分区布局呈现条目，MUST 至少包含以下分区：今日目标、本周目标、长期目标、当前项目、待办、AI 对话摘要、正在研究的方向、正在玩的/看的东西、工作流入口。

#### Scenario: 首页展示全部分区
- **WHEN** 打开 dashboard 首页
- **THEN** 9 个分区全部可见，即使某分区暂无条目也保留占位

### Requirement: 分区由 type 与 horizon 推导
dashboard SHALL 由条目的 `type` 与 `horizon` 组合筛选出各分区内容，MVP 不引入独立的 section 实体。映射规则：时间区由 `horizon` 推导，内容区由 `type` 推导。

#### Scenario: 待办区只含 todo
- **WHEN** 一个 Item `type=todo`
- **THEN** 它出现在「待办」分区，不出现在「当前项目」

#### Scenario: 时间区由 horizon 推导
- **WHEN** 一个 Item `horizon=week`
- **THEN** 它出现在「本周目标」分区

### Requirement: 手动 CRUD
dashboard 的每个分区 SHALL 支持对条目的手动新增、编辑、删除；新增时可指定 `type`、`horizon`、`priority`、`status` 等字段。

#### Scenario: 新增并持久化
- **WHEN** 在「待办」分区新增一个条目并刷新页面
- **THEN** 该条目仍在（已通过 core storage 落盘）

#### Scenario: 删除条目
- **WHEN** 删除一个条目
- **THEN** 该条目从面板与存储中移除

### Requirement: 条目按优先级排序
dashboard SHALL 在各分区内按 `priority`（now → next → later）排序呈现条目。

#### Scenario: 分区内优先级排序
- **WHEN** 某分区有 priority 分别为 later/now/next 的三个条目
- **THEN** 呈现顺序为 now → next → later

```

## openspec/changes/manboard-foundation/specs/repo-layout/spec.md

- Source: openspec/changes/manboard-foundation/specs/repo-layout/spec.md
- Lines: 1-30
- SHA256: 1b3220adca8a787b993cee53e4da3e99e997915c3a4f899ddf0dff327398578e

```md
## ADDED Requirements

### Requirement: 三层目录结构
仓库 SHALL 采用三层目录结构：`core`（数据与服务层）、`dashboard`（展示层）、`data`（私有数据），且 MUST NOT 保留多余的 `life-dashboard/` 中间层。

#### Scenario: 目录无冗余嵌套
- **WHEN** 检查仓库根目录
- **THEN** 存在 `core/`、`dashboard/`、`data/`，不存在 `life-dashboard/` 目录

### Requirement: 私有数据与框架分离
真实私有数据 SHALL 通过 `.gitignore` 排除版本控制，仓库 MUST 保留空/样例数据集（如 `data/sample/` 或 `data/.gitkeep`）以保证框架可演示。

#### Scenario: 真实数据不入库
- **WHEN** 在 `data/` 写入真实条目
- **THEN** `git status` 不显示这些文件（已被 gitignore）

#### Scenario: 框架自带样例
- **WHEN** 全新 clone 仓库
- **THEN** 存在样例数据集或占位文件，框架可拉起演示

### Requirement: 构建与启动路径更新
目录重构后，后端启动、前端构建/开发的路径与脚本 SHALL 更新为指向新的 `core/` 与 `dashboard/` 位置。

#### Scenario: 后端可从 core 启动
- **WHEN** 在 `core/` 下运行后端启动命令
- **THEN** 服务正常启动并提供 API

#### Scenario: 前端可从 dashboard 启动
- **WHEN** 在 `dashboard/` 下运行前端开发命令
- **THEN** 面板正常启动并可访问 API

```

## openspec/changes/manboard-foundation/specs/storage-abstraction/spec.md

- Source: openspec/changes/manboard-foundation/specs/storage-abstraction/spec.md
- Lines: 1-26
- SHA256: fa6835c1eb63ada81d2a2b25eb5ad1b0da25c372eb243baf6d2a6a9192c5720a

```md
## ADDED Requirements

### Requirement: 统一 Storage 接口
core SHALL 定义统一的存储接口，MUST 至少包含以下操作：`list()` 列出全部条目、`get(id)` 取单条、`create(item)` 新建、`update(id, patch)` 部分更新、`delete(id)` 删除。

#### Scenario: 接口可被多种实现适配
- **WHEN** 提供 JSON 文件实现与接口
- **THEN** 该实现满足 Storage 接口的所有方法签名，core 业务逻辑不依赖具体实现

### Requirement: JSON reference 实现
core SHALL 提供 JSON 文件作为 Storage 接口的默认 reference 实现，条目持久化到本地文件，刷新或重启后数据仍在。

#### Scenario: 数据落盘
- **WHEN** 通过 API 新建一个条目
- **THEN** 该条目被写入 JSON 文件，重启后端服务后仍可读取

#### Scenario: 默认实现可替换
- **WHEN** 未来新增一个 Postgres/SQLite adapter 并切换默认实现
- **THEN** core 业务逻辑与 dashboard 无需改动即可生效

### Requirement: 存储位置可配置
Storage 的 JSON 文件路径 SHALL 可配置（如通过环境变量或配置项），默认指向 `data/` 目录，便于分离框架与私有数据。

#### Scenario: 私有数据目录
- **WHEN** 仓库按三层结构组织，真实数据放 `data/`
- **THEN** Storage 默认从 `data/` 读写，且该目录可被 gitignore 而不影响框架运行

```
