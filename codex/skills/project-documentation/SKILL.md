---
name: project-documentation
description: Organize, create, migrate, or review project documentation with clear placement, indexes, links, and sensitive-information boundaries. Use when a request involves design documents, technical references, API or integration notes, development guides, deployment runbooks, troubleshooting records, worklogs, or documentation indexes.
---

# 项目文档管理

将文档放入适合长期维护的位置，沿用项目现有约定，并保护敏感信息。先检查仓库是否已有 `docs/`、`local-doc/`、`local-docs/` 或其他文档规范；已有约定优先于本 skill 的默认建议。

## 先读取现状

1. 阅读项目根目录的 `README.md`、文档索引和 `AGENTS.md`，并列出已有文档目录。
2. 针对当前主题，读取一份最接近的现有文档；检查 `.gitignore` 是否忽略本地或敏感文档目录。
3. 新增、移动或改名之前，搜索旧文件名、链接、脚本路径和命令引用。
4. 不把账号、密码、token、私钥、真实内网地址或可用于访问系统的凭证写入文档；示例统一使用占位符。

## 选择文档类型与位置

| 文档类型 | 默认位置 | 内容要求 |
| --- | --- | --- |
| 产品、设计决策、架构、技术参考 | `docs/<topic>/` | 可提交、可长期引用，说明背景、范围、决策和限制。 |
| 开发指南、API、组件或数据模型说明 | `docs/guides/` 或 `docs/reference/` | 以真实代码、接口或配置为依据，提供最小可用示例。 |
| 发布、部署、恢复、值守与排障手册 | `docs/runbooks/`；有敏感信息则使用项目本地文档目录 | 写明前置条件、步骤、验证、回滚和常见故障。 |
| 调研、实验、阶段结论、问题复盘 | `docs/worklogs/YYYY-MM/` 或项目既有工作记录目录 | 记录事实、结论、证据和待办，不伪装成稳定规范。 |
| 公司专用接入、内部服务、环境差异 | 项目约定的本地文档目录 | 仅记录可共享的流程与占位符，保持 Git 忽略。 |
| 文档导航与目录树 | 现有索引文件或 `docs/README.md` | 新增、移动、删除文档后同步更新。 |

若项目没有 `local-doc/` 或 `local-docs/`，不要擅自创建本地文档体系；先使用已有结构，或请用户确认敏感文档的存放位置。

## 编写与整理

1. 先确定文档是长期参考、可执行手册、阶段记录还是敏感内部补充，再决定位置。
2. 新建文档时使用清晰标题，开头先给目的或结论；按需要保留背景、适用范围、步骤、验证、限制、排障和参考链接。
3. 迁移现有文档时优先移动或改名，并同步更新引用；不要静默删除仍有价值的历史结论。
4. 使用代码块时标明语言；命令应能在声明的前置条件下执行。无法确认的内容标注“待补充”，不要编造。
5. 对运行手册补充成功验证、失败处理与回滚；对排障文档补充现象、证据、根因、修复与避免措施。

## 完成前检查

1. 检查 Markdown 链接、相对路径、目录树和索引项。
2. 运行 `git diff --check`；确认本地敏感文档没有被意外纳入提交范围。
3. 交付时说明新增、移动或更新的文档，以及仍需用户决定的归类或敏感信息边界。
