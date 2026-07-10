# dashboard-shell Specification

## Purpose
TBD - created by archiving change manboard-foundation. Update Purpose after archive.
## Requirements
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

