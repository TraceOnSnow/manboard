## ADDED Requirements

### Requirement: 全局快速记录

dashboard SHALL 在首页提供始终可见的全局快速记录入口。用户只输入非空标题即可创建一条记录，系统 MUST 不要求用户在创建时选择类型、优先级、状态、时间范围或填写备注。

#### Scenario: 捕捉临时想法
- **WHEN** 用户输入标题并提交快速记录
- **THEN** dashboard 创建该记录、显示成功反馈，并清空输入框

#### Scenario: 拒绝空记录
- **WHEN** 用户尝试提交只含空白字符的快速记录
- **THEN** dashboard 不创建记录并在输入框附近显示可恢复的校验提示

### Requirement: Inbox 作为未整理记录的落点

通过全局快速记录创建的条目 SHALL 使用既有 Thread 模型保存为 `type=other`、`status=active`、`priority=next`、`horizon=none`，并显示在首页 Inbox 板块中。Inbox MUST 按 `updatedAt` 倒序展示，且现有的 `type=other` 条目也必须可见。

#### Scenario: 刷新后仍可找到捕捉内容
- **WHEN** 用户完成快速记录后刷新页面
- **THEN** 该记录仍显示在 Inbox 中

### Requirement: Inbox 条目可被整理

用户 SHALL 能从 Inbox 条目的详情抽屉修改类型、时间范围、优先级、状态、下一步动作和备注。修改后的条目 MUST 离开 Inbox，并按其更新后的属性出现在对应板块中。

#### Scenario: 将灵感整理为项目
- **WHEN** 用户将 Inbox 条目的类型改为 `project` 并保存
- **THEN** 条目不再出现在 Inbox，并显示在项目板块
