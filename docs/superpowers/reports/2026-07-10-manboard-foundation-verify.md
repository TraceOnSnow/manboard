---
comet_change: manboard-foundation
role: verification-report
date: 2026-07-10
verify_mode: full
---

# 验证报告：manboard-foundation

## Summary

| 维度 | 状态 |
|------|------|
| Completeness（完整性） | 29/29 任务完成；5/5 capability spec 有对应实现 |
| Correctness（正确性） | 全部 requirement 与 scenario 覆盖；1 个 WARNING（type 归属缺口） |
| Coherence（一致性） | 实现遵循 design.md 全部 7 条方向性决策 |

## 新鲜验证证据（Iron Law）

- **后端测试**：`pytest tests/ -q` → **27 passed**（1 个无害 deprecation warning）
- **TypeScript 类型检查**：`tsc --noEmit` → **exit 0（clean）**
- **前端构建**：`npm run build` → **成功**（dist 产物正常）
- **安全扫描**：提交区间无硬编码密钥/secret/token

## Completeness

### 任务完成
- tasks.md：**29/29** 全部 `[x]`，0 个未勾选。

### Spec 覆盖（5 capability）
| Capability | Requirement 数 | 实现位置 | 状态 |
|-----------|---------------|---------|------|
| core-data-model | 4 | `core/app/models.py` | ✓ |
| storage-abstraction | 3 | `core/app/storage.py` | ✓ |
| connector-contract | 2 | `core/app/connectors.py` | ✓ |
| dashboard-shell | 4 | `dashboard/src/App.tsx`、`ThreadForm.tsx` | ✓（见 WARNING-1） |
| repo-layout | 3 | 目录结构 + `.gitignore` | ✓ |

## Correctness

逐 requirement + scenario 核对结果：

### core-data-model
- ✓ Item 字段集合：`ThreadBase` 含全部 12 字段，`title`/`type` 必填，其余默认
- ✓ horizon 字段：`Horizon` 枚举 (today/week/long/none)，默认 `none`（`models.py:46`）
- ✓ type 含 entry：`ThreadType.entry`（`models.py:17`）
- ✓ 字段校验：Pydantic 自动校验，非法枚举 422（`test_invalid_horizon_returns_422` 证实）
- ✓ 旧数据默认 horizon：`_migrate()` 补 none（`test_lazy_migration_adds_horizon` 证实）

### storage-abstraction
- ✓ 统一接口：`Storage` Protocol 含 list/get/create/update/delete（`storage.py:17`）
- ✓ JSON reference 实现：`JsonStorage`，原子写 + Lock
- ✓ 存储位置可配置：`MANBOARD_DATA_FILE`，默认 `data/threads.json`（`storage.py:104`）

### connector-contract
- ✓ 契约存在：`Connector` Protocol + `fetch()`（`connectors.py:7,16`）
- ✓ 无真实实现：仓库无任何 Postgres/Obsidian/RSS/Calendar/LLM 代码

### dashboard-shell
- ✓ 9 分区呈现：`SECTIONS` 数组含全部 9 分区，空分区保留占位
- ✓ 分区由 type+horizon 推导：时间区按 horizon，内容区按 type
- ✓ 手动 CRUD：`handleCreate/handleUpdate/handleDelete` + ThreadForm
- ✓ 优先级排序：`priorityRank` now=0→next=1→later=2（`App.tsx:88`）
- ⚠ **WARNING-1**：见下方

### repo-layout
- ✓ 三层目录：`core/`、`dashboard/`、`data/` 存在，`life-dashboard/` 已删除
- ✓ 私有数据分离：`.gitignore` 排除 `data/*.json`，保留 `data/sample/` + `.gitkeep`；`git check-ignore` 证实 `data/threads.json` 被忽略
- ✓ 构建路径更新：README 记录从 `core/`、`dashboard/` 启动

## Coherence

实现遵循 design.md 全部 7 条方向性决策：
- D1 三层化 ✓ | D2 horizon+entry ✓ | D3 视图排他 ✓ | D4 Storage 抽象 ✓
- D5 Connector 仅契约 ✓ | D6 懒迁移 ✓ | D7 entry 复用 notes ✓

delta spec 与 design doc **无矛盾**（design doc 的「Spec Patch（延后）」段已说明视图排他与懒迁移的设计决策记录在 doc 内，未回写 spec，符合规避 stale 守卫的处理）。

## Issues

### WARNING-1（应修复）：部分 type 在 horizon=none 时无归属分区

**问题**：`core-data-model` spec 的 type 枚举含 12 种，但 `dashboard-shell` 的内容分区只显式覆盖了其中 9 种（project/todo/ai-chat/research/game/novel/anime/video/entry）。当 `horizon=none` 时，`goal`、`self-improvement`、`other` 三种 type **不匹配任何内容分区的过滤条件**，条目不会出现在面板上（数据仍在存储，仅视图不可见）。

**影响范围**：低。MVP 阶段用户主要靠 horizon 把目标放进时间区（今日/本周/长期），`goal` 在 `horizon≠none` 时正常显示。但若用户创建一个 `type=goal, horizon=none` 或 `type=self-improvement, horizon=none` 的条目，会"看不到"，可能困惑。

**Spec 视角**：严格来说不违反 spec——`dashboard-shell` spec 只要求 9 个分区存在，未要求每种 type 都有归属。但这是一个实现层面的可用性缺口。

**建议修复方式**（任选其一，留作后续 tweak）：
1. 在「长期目标」分区放宽为 `horizon=long OR (horizon=none && type=goal)`，让 goal 始终可见
2. 新增一个「其他/收件箱」兜底分区，容纳无归属的 type
3. 在 ThreadForm 对这三种 type 强制 horizon 选择

## Final Assessment

**无 CRITICAL 问题。1 个 WARNING（type 归属缺口，不影响数据完整性，可用性层面）。**

验证通过，可进入 archive。WARNING-1 建议作为独立 tweak change 处理，不阻塞本次归档。
