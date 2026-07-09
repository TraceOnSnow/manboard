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
