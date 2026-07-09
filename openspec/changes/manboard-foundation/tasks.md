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
