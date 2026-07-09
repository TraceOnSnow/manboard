# Brainstorm Summary

- Change: manboard-foundation
- Date: 2026-07-09

## 设计深度策略（已确认）

- **收薄**：Design Doc 只记录已确认的大方向，接口签名/具体形态留给 build 阶段
- 用户诉求是「先体验再迭代」，不提前钉死尚未准备好做的决定
- Design Doc 不追求把所有接口签名钉死，体验后再迭代

## 确认的技术方案（方向性记录）

### horizon 语义（已确认）
- **方案 C：horizon 通用 + 视图排他**
- 任何条目都能标 `horizon: today/week/long/none`（默认 none）
- 分区呈现按「先时间区（today/week/long）、再内容区」排他：
  - 标了 horizon 的条目只出现在对应时间区，不重复进内容区
  - horizon=none 的条目落对应 type 的内容区
- 9 分区呈现顺序：今日目标 / 本周目标 / 长期目标 / 当前项目 / 待办 / AI对话摘要 / 研究 / 媒体 / 工作流入口
- 时间区内容 = horizon 匹配的全部条目（不限 type）
- 内容区内容 = horizon=none 且 type 匹配的条目

### Storage / Connector 接口（已确认方向）
- **typing.Protocol + 工厂注入**方向
- `core/app/storage.py`：`Protocol Storage`（list/get/create/update/delete）+ `class JsonStorage` 默认实现
- `routes.py` 用 FastAPI `Depends(get_storage)` 注入实例
- `get_storage()` 工厂按配置返回实现；未来 Postgres/SQLite adapter 写新类即可
- `Connector` 同样用 Protocol（`fetch() -> list[Thread]`），保持一致风格
- 保留现有原子写（tmp + os.replace）与 threading.Lock
- **具体方法签名与实现细节留给 build 阶段**

### 数据路径配置（已确认）
- 环境变量 `MANBOARD_DATA_FILE`，默认 `data/threads.json`
- 工厂 `get_storage()` 读取该环境变量决定 JsonStorage 文件路径

### 数据迁移（已确认）
- **懒迁移**：JsonStorage 读取时若条目缺 `horizon`，自动补 `none`，下次保存时持久化
- 不写独立迁移脚本；spec 的「旧数据默认 horizon」场景由加载路径天然满足

### 工作流入口形态（已确认）
- **复用 `notes` 字段**存链接/命令，不为 `type=entry` 单开 url 字段（YAGNI）
- 体验后再决定是否需要专属字段

## 关键取舍与风险
- Protocol 无运行时强检查 → 依赖 fastapi/pydantic 保证；adapter 漏实现靠测试覆盖
- Connector 接口最小（仅 fetch），首个真实源接入时可能返工 → 接受，留 change
- 视图排他导致「待办」区看不到今日待办 → 后续可加「全部待办」聚合视图缓解（不在本 change）

## 测试策略
- **后端 (core)**：pytest 验证
  - JsonStorage CRUD + 懒迁移（缺 horizon 的旧条目补 none）
  - Protocol 接口签名与 JsonStorage 满足契约
  - API 层 horizon 字段读写、非法枚举被拒（422）
  - Connector 接口定义存在（仅契约）
- **前端 (dashboard)**：手动端到端为主（MVP），核心分区筛选逻辑可加单测
- **数据迁移**：构造缺 horizon 的旧 JSON，验证加载后补 none、保存后持久化

## Spec Patch
- **dashboard-shell/spec.md**：补充「视图排他」边界场景——标了 horizon 的条目只出现在时间区、不重复进内容区
- **storage-abstraction/spec.md**：补充「懒迁移」场景——缺 horizon 的旧条目加载时补默认值
- 其余 spec 无需 patch
