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
