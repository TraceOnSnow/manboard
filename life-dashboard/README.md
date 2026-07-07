# Life Dashboard

一个低摩擦的个人状态面板，统一记录长期目标、短期目标、待办、研究方向、项目、游戏、小说/番剧/视频、长期进行的 AI 对话线索。

所有条目统一抽象为 **Thread**。

## 技术栈

- **Frontend**: Vite + React + TypeScript + Tailwind CSS v3
- **Backend**: FastAPI + Python + Pydantic v2
- **持久化**: `backend/data/threads.json`（JSON 文件，无数据库）

## 项目结构

```
life-dashboard/
├── frontend/                # Vite + React + TS
│   ├── src/
│   │   ├── api/             # 后端 API 封装
│   │   ├── components/      # ThreadCard / ThreadForm
│   │   ├── types/           # Thread 类型与常量
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── backend/                 # FastAPI
    ├── app/
    │   ├── main.py          # 应用入口 + CORS
    │   ├── models.py        # Pydantic 模型
    │   ├── storage.py       # JSON 文件读写
    │   └── routes.py        # /threads 路由
    ├── data/
    │   └── threads.json     # 数据文件（自动创建）
    └── requirements.txt
```

## Thread 字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 后端生成 |
| `title` | string | 标题（必填） |
| `type` | enum | `goal` / `project` / `research` / `todo` / `game` / `novel` / `anime` / `video` / `ai-chat` / `self-improvement` / `other` |
| `status` | enum | `active` / `paused` / `parked` / `done` |
| `priority` | enum | `now` / `next` / `later` |
| `area` | string? | 所属领域 |
| `nextAction` | string? | 下一步具体动作 |
| `notes` | string? | 备注 |
| `lastTouched` / `createdAt` / `updatedAt` | ISO string | 时间戳，后端维护 |

## 快速开始

### 前置要求

- **Python 3.10+**（用了 `list[Thread]` 等较新语法）
- **Node.js 18+**（Vite 5 要求）

### 1. 启动后端

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

后端运行在 http://localhost:8000

- API 文档（交互式）: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health

### 2. 启动前端（新开一个终端）

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:5173

打开浏览器访问 http://localhost:5173 即可使用。

## REST API

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/threads` | 列出全部 Thread |
| `POST` | `/threads` | 新建 Thread |
| `PATCH` | `/threads/{id}` | 部分更新 Thread |
| `DELETE` | `/threads/{id}` | 删除 Thread |

### 示例

```bash
# 新建
curl -X POST http://localhost:8000/threads \
  -H "Content-Type: application/json" \
  -d '{"title":"读完某本书","type":"goal","priority":"now"}'

# 列出
curl http://localhost:8000/threads

# 更新状态
curl -X PATCH http://localhost:8000/threads/<id> \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# 删除
curl -X DELETE http://localhost:8000/threads/<id>
```

## 功能

- 首页展示全部 Threads，按优先级排序（now → next → later）
- 按优先级 / 状态 / 类型 三维度筛选
- 新增 / 编辑 / 删除 Thread
- 点击卡片状态徽章可快速循环切换状态（active → done → paused → parked）
- 数据保存到后端 JSON 文件，刷新页面后仍在

## 配置说明

- 前端 API base URL 写死在 `frontend/src/api/threads.ts`（`http://localhost:8000`）
- 后端 CORS 允许 `http://localhost:5173`，配置在 `backend/app/main.py`
- 数据文件路径：`backend/data/threads.json`（首次写入时自动创建）

## 下一步建议

见本文档末尾「路线图」一节（按需实现）。

路线图（未实现，备选）：
- 排序选项（按 updatedAt、createdAt）
- 搜索 / 关键字过滤
- 统计面板（各状态数量）
- 导出 / 导入 JSON 备份
- 部署方案（Docker / 云端）
