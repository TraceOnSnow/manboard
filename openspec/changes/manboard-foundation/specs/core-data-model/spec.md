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
