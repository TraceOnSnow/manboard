---
comet_change: manboard-foundation
role: technical-design
canonical_spec: openspec
archived-with: 2026-07-10-manboard-foundation
status: final
---

# manboard-foundation 技术设计（精简版）

> 本 Design Doc 只记录**已确认的方向性决策**。具体接口签名、组件拆分等实现细节留给 build 阶段，遵循「先体验再迭代」的策略。

## 背景

manboard 当前是单层应用 `life-dashboard/{backend, frontend}`，扁平 Thread 列表 + 单文件 JSON 存储。长期定位是「个人 AI 操作系统的前端壳子」，需要把 core（数据 + 多源连接器）与 dashboard（展示壳子）分离。本次只打地基，交付 general MVP。

现有实现要点（build 阶段需保留）：`storage.py` 模块级函数 + 原子写（tmp + os.replace）+ threading.Lock；`routes.py` 直接调 storage；前端 `App.tsx` 已有 priorityRank 排序与筛选逻辑。

## 已确认方向

### 1. 目录三层化（拍平 life-dashboard）
`life-dashboard/backend → core/`，`life-dashboard/frontend → dashboard/`，私有数据 → 顶层 `data/`。`data/` 真实数据 gitignore，保留 `data/sample/` 样例集 + `data/.gitkeep`。

### 2. 数据模型演进（加 horizon、entry）
- `models.py` 新增 `Horizon` 枚举（today/week/long/none），并入 `ThreadBase`/`Thread`，默认 none。
- `ThreadType` 新增 `entry`（工作流入口）。
- Pydantic 自动校验枚举，非法值返回 422。
- 向后兼容：保留现有 type/status/priority/area/nextAction/notes。

### 3. horizon 语义：通用 + 视图排他
- 任何条目都能标 horizon。
- 分区呈现排他：时间区（今日/本周/长期）= horizon 匹配的全部条目（不限 type）；内容区 = horizon=none 且 type 匹配的条目。
- 标了 horizon 的条目只出现在时间区，不重复进内容区。
- 9 分区固定顺序：今日目标 / 本周目标 / 长期目标 / 当前项目 / 待办 / AI 对话摘要 / 研究 / 媒体 / 工作流入口。
- 媒体区 = type ∈ {game, novel, anime, video}。
- 分区内按 priority（now→next→later）排序。

### 4. Storage 抽象（Protocol + 工厂方向）
- 抽出 `Protocol Storage`（list/get/create/update/delete）+ `JsonStorage` 默认实现，搬现有原子写与锁逻辑。
- `get_storage()` 工厂读 `MANBOARD_DATA_FILE`（默认 `data/threads.json`）返回 JsonStorage。
- `routes.py` 用 FastAPI `Depends(get_storage)` 注入。
- 未来 Postgres/SQLite adapter 只需新增实现类。
- **具体方法签名留给 build 阶段。**

### 5. Connector 契约（仅定义，不实现）
- `Protocol Connector`（`fetch() -> list[Thread]` 方向），本 change 无任何真实外部源实现。
- 具体签名留 build 阶段。

### 6. 数据迁移：懒迁移
- JsonStorage 读取时，缺 horizon 的旧条目自动补 none，下次保存持久化。
- 不写独立迁移脚本。

### 7. 工作流入口：复用 notes
- `type=entry` 复用 `notes` 字段存链接/命令，不为它单开 url 字段（YAGNI）。

## 风险与取舍

- **Protocol 无运行时强检查** → 依赖 fastapi/pydantic 保证类型；adapter 漏实现靠测试覆盖。
- **Connector 接口最小（仅 fetch）** → 首个真实源接入时可能返工，接受，留后续 change。
- **视图排他导致「待办」区看不到今日待办** → 后续可加「全部待办」聚合视图缓解（不在本 change）。
- **目录重构影响构建路径** → 各层内部结构基本不变（只改外层路径），重构前打 git tag `pre-foundation` 作回滚点。

## 测试策略

- **后端**：pytest —— JsonStorage CRUD + 懒迁移；Storage Protocol 与 JsonStorage 满足契约；API horizon 读写、非法枚举 422；Connector 契约存在。
- **前端**：手动端到端为主（MVP），核心分区筛选逻辑可加单测。
- **迁移**：构造缺 horizon 的旧 JSON，验证加载补 none、保存持久化。

## 体验后再定（明确留白）

- horizon 是否升级为独立正交轴 / section 一等公民
- connector 是 pull 还是双向 sync
- Item vs Aggregate 是否分两种一级公民
- 工作流入口是否需要专属 url 字段
- 「全部待办」聚合视图

## Spec Patch（延后）

视图排他与懒迁移的边界场景本计划回写 delta spec，但因 design 阶段 handoff 生成后 spec 变更会触发 classic runtime 的 stale 守卫（hash 漂移后无法重生成 handoff），故本次延后：

- **视图排他**、**懒迁移** 的设计决策已记录在本 Design Doc 上方，build 阶段据此实现。
- **懒迁移** 的验收场景已被 `core-data-model` spec 的「旧数据默认 horizon」覆盖。
- 若后续需要 spec 级 rigor，在独立 change 中补 delta spec。

