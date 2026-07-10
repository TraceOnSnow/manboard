# storage-abstraction Specification

## Purpose
TBD - created by archiving change manboard-foundation. Update Purpose after archive.
## Requirements
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

