# 组件与代码定位

以下路径相对仓库根目录，而不是本参考文件。通过仓库搜索定位，使用前读取当前实现及调用方；此处不是组件接口全集。

## 共享入口

| 入口 | 仓库路径 | 使用要点 |
| --- | --- | --- |
| 页面标题、表格及展示基础组件 | `web/components/ui/WorkspacePrimitives.jsx` | `PageHeader` 支持 `title`、`description`、`extra`，保留可选 `eyebrow`、`badge`；新版默认不传重复 eyebrow。表格评估 `DataTable`；金额可评估 `MoneyText`、`PercentText`，须确认币种和缩放符合数据。 |
| 登录提示 | `web/components/SignInRequiredCard.jsx` | 接收已翻译的 `title`、`description`；`showRegister` 默认关闭。内部复用安全返回地址，不重复拼接认证 URL，不自行扩大注册入口范围。 |
| 资产错误 | `web/components/ValuationError.jsx` | 保留旧数据标记、重试及诊断权限；不当作全部接口的通用错误解析器。 |
| 配置详情及预览 | `web/components/AgentSetDetail.jsx` | 使用 `variant="configuration"` 或 `variant="compact"`，`showHeader` 控制标题；旧 `compact` 参数兼容。新调用明确 variant，保留分组、启用判断及信息范围。 |
| 账户状态 | `web/components/useAccount.js` | 沿用页面已有状态与权限处理，不新增角色或替代后端鉴权。 |
| 中英文文案 | `web/lib/i18n.js` | 维护 `DICT` 两种语言，通过 `useI18n()` / `t()` 获取；新增 key 前搜索已有含义，不复用含义不同的 key。 |

共享基础组件仍可能有历史样式及默认英文。复用前核对，不无条件照搬默认错误和空状态，也不为单页需求改变其他页面默认值。

## 如何选择复用方式

1. **直接复用共享组件**：职责、数据含义和交互一致，现有公开参数足以表达差异。例如页面标题或登录卡片；无需增加页面专属样式参数。
2. **新增列表专用展示组件**：某类对象有稳定的身份、摘要及操作区域，但不适合其他业务对象。由页面保留数据请求、筛选和业务操作，展示组件接收所需数据及回调；参考 `TeamListCard` 和 `AgentSetListCard`，不合并成万能卡片。
3. **增加语义 variant**：同一对象、相同整理逻辑，需要稳定的完整或紧凑信息范围时使用。参考 `AgentSetDetail`；明确默认值和原调用兼容，检查全部调用方，不仅为边距或单页位置差异增加 variant。
4. **保留局部布局**：仅一处存在的间距或排版放在局部 CSS Module，不为集中管理而提前抽象。职责、数据来源和业务操作不同的页面不强行合成一个组件。

选择页面结构时参见 [页面模式](page-patterns.md)，不要因复用组件而反过来改变业务含义。

## Token 与样式边界

- `web/app/globals.css` 的 `:root` 定义背景 `--bg`、表面 `--surface`、文本 `--ink` / `--ink-soft` / `--muted`、边框 `--line` / `--line-strong`、操作 `--accent` / `--accent-strong` 和状态 `--success` / `--warning` / `--danger`。
- 排版使用 `--font-ui` / `--font-mono`，以及现有 `--type-page-title-*`、`--type-section-title-*`、`--type-card-title-*`、`--type-body-*`、`--type-control-*`、`--type-label-*`、`--type-caption-*`、`--type-metric-*` 语义 Token；具体名称以当前定义为准。
- 全局 CSS 仍有历史渐变、背景装饰及覆盖规则，它们不是新设计指令。局部改造不顺带删除，也不新增同类装饰。
- 使用目标页面或组件的 CSS Module；必要的 Ant Design 覆盖限制在局部作用域。继续使用已有依赖，不为改观新增框架。

## 新版参考

| 场景 | 入口与样式 | 可复用模式 |
| --- | --- | --- |
| 交易团队 `/teams` | `web/components/TeamWorkspace.jsx` 的 `TeamListView`；`web/components/TeamListCard.jsx`；`web/components/TeamList.module.css` | 简洁标题、下划线分组、独立卡片、指标与操作分区。不向其他列表强加资产指标。 |
| 团队配置 `/resources/agents` | `web/components/AgentSetLibrary.jsx`；`web/components/AgentSetListCard.jsx`；`web/components/AgentSetList.module.css` | 名称、版本、启用数与角色模型摘要；卡片不使用选择列表语义。 |
| 配置详情 `/resources/agents/[id]` | `web/components/AgentSetLibrary.jsx` 的 `AgentSetConfigDetail`；`web/components/AgentSetDetail.jsx`；`web/components/AgentSetDetail.module.css` | 单一标题、轻量角色切换、分层信息和按需展开指令；预览与历史快照保持 compact 信息范围。 |
| 邮件设置 `/settings/notifications` | `web/components/NotificationSettings.jsx`；`web/components/NotificationSettings.module.css` | 收件人置顶、设置分区、控件对齐及独立反馈；不影响实际发送规则及后端邮件模板。 |
| 数据总览 `/overview` | `web/components/OverviewDashboard.jsx`；`web/components/OverviewDashboard.module.css`；`web/components/EducationNotice.jsx` | 标题与已有公告、核心指标、明细及局部失败处理；仅参考信息组织，不将所有历史样式纳入规范。 |

按目标选择最近的参考后阅读源码。未列出的旧页面不自动成为新版规范，也不因此自动安排重构。
