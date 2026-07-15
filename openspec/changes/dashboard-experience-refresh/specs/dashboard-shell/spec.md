## MODIFIED Requirements

### Requirement: 9 分区呈现
dashboard SHALL 以行动优先的分区布局呈现条目。首页 MUST 将“今日待办”和 Inbox 作为首要内容，并保留对今日/本周/长期目标、当前项目、待办、AI 对话摘要、研究方向、媒体内容和工作流入口的可达视图。空内容区 MUST 不渲染大面积的“空”占位卡，而应以紧凑的空状态或导航计数呈现。

#### Scenario: 首页展示行动焦点
- **WHEN** 用户打开 dashboard 首页
- **THEN** 用户无需滚动即可看到快速记录、今日待办和 Inbox

#### Scenario: 访问已有内容分区
- **WHEN** 用户通过桌面侧边导航或页面内导航选择一个内容分区
- **THEN** 页面滚动或定位到该分区，且该分区显示符合既有 type 与 horizon 映射的条目

### Requirement: 分区由 type 与 horizon 推导
dashboard SHALL 由条目的 `type` 与 `horizon` 组合筛选出各分区内容，MVP 不引入独立的 section 实体。映射规则：时间区由 `horizon` 推导，内容区由 `type` 推导；`type=other` 且 `horizon=none` 的条目 MUST 归入 Inbox。

#### Scenario: 待办区只含 todo
- **WHEN** 一个 Item `type=todo` 且 `horizon=none`
- **THEN** 它出现在“待办”分区，不出现在“当前项目”或 Inbox

#### Scenario: 时间区由 horizon 推导
- **WHEN** 一个 Item `horizon=week`
- **THEN** 它出现在“本周目标”分区

#### Scenario: 未整理条目归入 Inbox
- **WHEN** 一个 Item `type=other` 且 `horizon=none`
- **THEN** 它出现在 Inbox 分区

### Requirement: 手动 CRUD
dashboard 的每个分区 SHALL 支持对条目的手动新增、编辑、删除；分区标题 MUST 提供上下文新增入口，且从该入口新增的条目 MUST 预设与分区相符的 `type` 和/或 `horizon`。编辑 SHALL 在不遮蔽整个应用的右侧详情抽屉中完成。

#### Scenario: 从项目分区新增
- **WHEN** 用户点击“当前项目”分区的新增入口
- **THEN** 详情抽屉打开，且新条目的类型预设为 `project`

#### Scenario: 删除条目
- **WHEN** 用户确认删除一个条目
- **THEN** 该条目从面板与存储中移除，并显示可理解的结果反馈

### Requirement: 条目按适合工作流的顺序呈现
dashboard SHALL 以工作流决定排序：今日待办按未完成优先及 priority（now → next → later）排序；项目、研究、媒体和 Inbox MUST 按 `updatedAt` 倒序排序；已完成的长期条目 MUST 默认折叠，并允许用户展开查看。

#### Scenario: 最近项目优先
- **WHEN** 项目板块有不同 `updatedAt` 的多个项目
- **THEN** 最近更新的项目显示在前面

#### Scenario: 完成内容不干扰日常浏览
- **WHEN** 项目板块包含完成与未完成项目
- **THEN** 未完成项目默认显示，完成项目归入可展开的“已完成”区域

## ADDED Requirements

### Requirement: 即时待办与长期条目使用不同状态交互

`type=todo` 且 `horizon=today` 的条目 SHALL 以简单复选框呈现，并仅通过勾选在 active 与 done 之间切换。项目、研究、媒体和其他长期条目 SHALL 显示明确命名的状态菜单，支持 active、paused、parked 与 done；系统 MUST 不依赖固定顺序轮换状态。

#### Scenario: 完成今日碎事
- **WHEN** 用户勾选一条今日待办
- **THEN** dashboard 将该条目更新为 `status=done`，并提供即时视觉反馈

#### Scenario: 暂停长期项目
- **WHEN** 用户在项目卡片上打开状态菜单并选择“暂停”
- **THEN** dashboard 将该项目更新为 `status=paused`

### Requirement: 响应式应用外壳与可访问交互

dashboard SHALL 在桌面端提供紧凑侧边导航和右侧详情抽屉，在窄视口以单列主内容替代侧边导航。所有图标按钮 MUST 有可访问名称、所有关键操作 MUST 可用键盘完成、焦点状态 MUST 可见，并且动效 MUST 尊重 `prefers-reduced-motion`。

#### Scenario: 在窄视口使用 dashboard
- **WHEN** 视口宽度小于桌面断点
- **THEN** dashboard 以单列显示内容，且快速记录与分区新增入口仍可使用

#### Scenario: 键盘打开并关闭详情
- **WHEN** 键盘用户聚焦条目并打开详情抽屉
- **THEN** 焦点进入抽屉，且用户可通过明确的关闭控件或 Escape 返回原条目
