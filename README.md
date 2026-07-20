# Manboard

一个本地优先的个人任务看板：用可拖动、可缩放的 **Box** 组织任务；任务完成后自动沉到当前 Box 的底部。

> 你的数据默认保留在本机 `data/`，不会被提交到仓库。`data/sample/` 只放可公开的示例数据。

## 现在有什么

- 默认自动创建一个 **Inbox** Box；它和其他 Box 一样可重命名、拖动、缩放或删除。
- 自由新增任意 Box，例如「今日待办」「项目」「长期事项」。
- 每个 Box 右上角的 `＋` 可快速创建任务。
- 勾选任务即完成；已完成任务会变灰、加删除线，并自动排在同 Box 的未完成任务之后。
- 点击任务标题可就地重命名；点击右侧铅笔在右侧抽屉编辑详情。
- 任务只能属于一个 Box，支持多个标签、一个截止日期、高/中/低优先级、详情备注。
- 删除 Box 时可以删除其中所有任务，或把任务迁移至另一个 Box。

## 一键启动（VS Code）

首次运行前，在两个终端各执行一次：

```bash
cd core
python -m venv .venv
.venv/bin/pip install -r requirements.txt

cd ../dashboard
npm install
```

然后在 VS Code：

1. 打开 **Run and Debug**（侧栏播放图标）。
2. 选择 **启动 Manboard（前后端）**。
3. 按 **F5**。

它会先启动 API、等待 API 健康检查通过，再启动 Dashboard 并自动打开浏览器。这个启动器使用 Node 进程编排，不再依赖 Python 的 `debugpy`，因此不会再触发 `debugpy is not supported`。

- Dashboard：`http://localhost:5173`
- API：`http://localhost:8000`

## 手动启动

**终端 1：API**

```bash
cd core
MANBOARD_DATA_FILE=../data/threads.json .venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

**终端 2：前端**

```bash
cd dashboard
npm run dev -- --host localhost
```

浏览器打开 `http://localhost:5173`。

## 数据与旧数据升级

默认数据文件仍为 `data/threads.json`，但其内部格式已经升级为 Box 看板格式（`version: 2`）。首次启动时：

- 没有数据文件：自动创建含一个 `Inbox` 的新看板。
- 检测到旧 Thread 格式：自动将全部旧记录迁移进 `Inbox`。
- 迁移前会在同目录创建一次备份：`data/threads.json.bak`。

旧字段的迁移规则：

| 旧 Thread 字段 | 新任务字段 |
| --- | --- |
| `type` + `area` | `tags` |
| `nextAction` + `notes` | `details` |
| `done` | `completedAt` |
| `now` / `next` / `later` | 高 / 中 / 低优先级 |

如需恢复旧数据，先停止 API，再用备份替换当前文件：

```bash
cp data/threads.json.bak data/threads.json
```

可通过环境变量改用其他数据文件：

```bash
MANBOARD_DATA_FILE=/absolute/path/to/board.json
```

## REST API

### Box

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/boxes` | 列出 Box |
| `POST` | `/boxes` | 新建 Box |
| `PATCH` | `/boxes/{id}` | 修改名称或网格布局 |
| `DELETE` | `/boxes/{id}` | 删除 Box；请求体指定删除任务或迁移任务 |

删除 Box 请求体示例：

```json
{ "taskDisposition": "delete" }
```

```json
{ "taskDisposition": "move", "targetBoxId": "other-box-id" }
```

### Task

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/tasks` | 列出任务 |
| `POST` | `/tasks` | 新建任务 |
| `GET` | `/tasks/{id}` | 获取任务 |
| `PATCH` | `/tasks/{id}` | 修改任务、移动 Box 或切换完成状态 |
| `DELETE` | `/tasks/{id}` | 删除任务 |

任务字段：`title`、`boxId`、`tags`、`priority`（`high` / `medium` / `low`）、`dueDate`（`YYYY-MM-DD`）、`details`、`completedAt`。

## 验证

完成改动后，在仓库根目录运行：

```bash
./scripts/verify.sh
```

它会执行后端测试、前端测试、生产构建、启动脚本语法检查和 Git diff 检查。

## 项目结构

```text
core/       FastAPI API、数据模型和 JSON 存储
dashboard/ React + Vite 看板界面
scripts/    无 debugpy 的 VS Code 启动脚本
data/       本地私有数据（已 gitignore）
.vscode/    F5 启动配置
```
