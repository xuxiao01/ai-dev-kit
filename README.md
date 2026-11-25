<p align="center">
  <img src="https://typorabucket0308.oss-cn-beijing.aliyuncs.com/images/20260603103934962.jpg" alt="ai-dev-kit 项目封面" width="800" />
</p>

<h1 align="center">ai-dev-kit</h1>

<p align="center">将内置的 Cursor 与 Codex 开发协作资源安装到目标项目的命令行工具。</p>

## 项目简介

`@xuxiao-dev/ai-dev-kit` 是一个 npm CLI 包，用于将包内维护的 Cursor rules / commands 和 Codex skills 安装到当前工作目录的项目中。

CLI 命令为 `ai-dev-kit`，运行环境要求 Node.js `>=18`。

## 功能特性

- 列出包内可用的 Cursor 和 Codex 资源。
- 安装单个或全部 Cursor rule 与 command 到 `.cursor/`。
- 安装单个或全部 Codex skill 到 `.agents/skills/`。
- 在目标项目的 `AGENTS.md` 中维护由 ai-dev-kit 管理的简短 Skill 索引。
- 默认跳过目标中已存在的资源；使用 `--force` 可覆盖已安装的 Skill 文件；无论是否覆盖，都会更新受管理的 `AGENTS.md` 索引区块。

## 技术栈

- Node.js `>=18`
- TypeScript
- Commander
- fs-extra
- picocolors
- tsup
- pnpm

## 核心目录结构

```text
ai-dev-kit/
├── bin/                         # 构建后的 CLI
├── codex/
│   └── skills/                  # Codex 内置 Skill
├── cursor/
│   ├── commands/
│   └── rules/
├── src/
│   ├── commands/                # Cursor / Codex 子命令
│   ├── utils/
│   └── cli.ts                   # CLI 入口
├── package.json
├── tsup.config.ts
└── README.md
```

## 本地运行

安装依赖：

```bash
pnpm install
```

以源码方式运行 CLI：

```bash
pnpm dev
```

构建：

```bash
pnpm build
```

构建完成后，可执行：

```bash
node bin/ai-dev-kit.js cursor list
node bin/ai-dev-kit.js codex list
```

## 使用方式

在目标项目根目录中，通过 `npx` 运行已发布的包：

```bash
npx @xuxiao-dev/ai-dev-kit cursor list
npx @xuxiao-dev/ai-dev-kit codex list
```

安装全部 Cursor 资源：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add --all
```

安装单个 Cursor 资源：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add rule ai-task-workflow-rule
npx @xuxiao-dev/ai-dev-kit cursor add command readme-command
```

安装全部 Codex 资源：

```bash
npx @xuxiao-dev/ai-dev-kit codex add --all
```

安装全部 Codex skills，也可以显式指定 Skill 类型：

```bash
npx @xuxiao-dev/ai-dev-kit codex add skill --all
```

安装单个 Codex skill：

```bash
npx @xuxiao-dev/ai-dev-kit codex add skill readme
npx @xuxiao-dev/ai-dev-kit codex add skill vue-config
npx @xuxiao-dev/ai-dev-kit codex add skill draw
npx @xuxiao-dev/ai-dev-kit codex add skill git-submit
npx @xuxiao-dev/ai-dev-kit codex add skill blog
```

默认不会覆盖目标项目内已有资源。如需覆盖，请增加 `--force`：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add --all --force
npx @xuxiao-dev/ai-dev-kit codex add --all --force
```

## 内置资源

当前包内包含以下资源：

| 类型 | 资源 |
| --- | --- |
| Cursor Rule | `ai-task-workflow-rule` |
| Cursor Command | `commit`、`create-plan-from-brief`、`readme-command` |
| Codex Skill | `blog`、`docs`、`readme`、`bug-review`、`git-commit`、`git-submit`、`draw`、`vue-config` |

安装后，Cursor 资源会写入 `.cursor/rules/` 或 `.cursor/commands/`；Codex skills 会写入 `.agents/skills/`，并在目标项目的 `AGENTS.md` 中追加由 ai-dev-kit 管理的 Skill 索引区块。完整 Skill 内容不会写入 `AGENTS.md`。

目标项目中的 Codex 资源结构示例：

```text
project/
├── AGENTS.md
└── .agents/
    └── skills/
        └── vue-config/
            └── SKILL.md
```

`AGENTS.md` 只记录 Skill 的用途和路径；具体任务规范保存在对应的 `SKILL.md` 中。

安装后可使用 `$git-submit`、`$git-commit`、`$blog`、`$draw`、`$docs`、`$readme`、`$bug-review`、`$vue-config` 调用。旧安装名会提示对应的新名字，按提示重新运行安装命令即可。

## 科研与技术绘图

`draw` 面向论文、答辩 PPT 和技术文章。随 Skill 提供三种科研图型及一张并发时序图的可编辑 draw.io 模板和 PNG 预览。使用导出脚本需要 Python 3 和已安装的 draw.io 桌面程序；可通过 `--drawio` 指定程序位置。

## 博客配图

单独安装 `blog` 会先配套安装 `draw`，并将两者登记到目标项目的 `AGENTS.md`。安装前检查所需资源，已有 Skill 默认跳过，`--force` 沿用合并覆盖规则。全量安装仍包含八个通用 Skill，每个只安装一次。

`blog` 配图前读取 `draw` 的版式、配色和技术文章规范，并检查本机 draw.io。有软件时制作可编辑源图并导出 PNG、SVG，缺少软件时参考同一套规范和模板使用 AI 生图。导出异常先排查并报告；AI 工具不可用或生图失败时继续优化正文，并说明待完成的配图。

## 个人分支提交与同步

`git-submit` 按“检查个人分支 → 暂存工作区 → 中文提交 → 同步最新主干 → 推送个人分支”执行，随后由用户提交 PR。执行前核对 `main`、`master` 及目标主干，确定远端与目标分支；用户指定文件或限定步骤时按该次范围执行。安装命令只复制 Skill，实际 Git 流程在用户要求执行时触发。

`git-commit` 用于提交现有暂存区内容。`git-submit` 用于个人分支的完整暂存、提交、同步和推送流程。

## 投资平台 Skill 套装

面向 `multi-agent-investment` 的开发协作流程，显式安装五个独立 Skill：

```bash
npx @xuxiao-dev/ai-dev-kit@latest codex add --multi-agent-investment
# 覆盖同名文件
npx @xuxiao-dev/ai-dev-kit@latest codex add --multi-agent-investment --force
```

| 成员 | 用途 | 包内来源 |
| --- | --- | --- |
| `git-commit` | Git 暂存区提交 | `codex/skills/git-commit/` |
| `docs` | 项目文档组织与维护 | `codex/skills/docs/` |
| `staged-change-report` | 暂存区修改报告 | `codex/packs/multi-agent-investment/skills/staged-change-report/` |
| `project-ui-style` | 投资平台 UI 风格 | `codex/packs/multi-agent-investment/skills/project-ui-style/` |
| `project-verification` | 投资平台验证与本地验收 | `codex/packs/multi-agent-investment/skills/project-verification/` |

前两份复用通用资源，后三份独立保存在 `codex/packs/multi-agent-investment/skills/`；套装清单为 `codex/packs/multi-agent-investment/manifest.json`。

`codex list` 单独列出此套装及其五个成员。`codex add --all`（以及 `codex add skill --all`）安装八个通用 Skill，不包含此套装的三份新增资源。套装选项不能与 `--all` 或任何位置参数混用，仅允许搭配 `--force`。

安装后，五个成员分别位于 `.agents/skills/<成员名>/`，完整保留 `SKILL.md`、`agents/openai.yaml` 及适用的 `references/`。安装前检查清单所列文件及 `AGENTS.md` 受管索引标记；安装沿用现有机制维护索引并保留用户其他内容。默认跳过已有同名目录，`--force` 合并覆盖同名文件，不删除目标目录额外文件。

安装只复制资源并更新索引，不自动执行 Skill 中的测试、报告、暂存或提交操作；生成文件是否提交由使用者决定。UI 与验证规范仅适用于投资平台，使用时仍需核对目标仓库当前实现。

投资平台套装从 `0.2.1` 版本提供，远程用户需在该版本正式发布后使用新选项；包名保持不变。

## 环境变量

当前代码未读取运行时环境变量，仓库中也未提供 `.env.example`，无需额外配置。

## 部署说明

本项目构建产物位于 `bin/`，并通过 `package.json` 的 `bin` 字段暴露为 `ai-dev-kit` 命令。发布前会自动执行 `pnpm build`（`prepublishOnly`）。

发布到 npm 前，请根据实际发布权限确认包名、版本号和 npm 登录状态：

```bash
pnpm build
npm publish
```

更多发布前的暂存与检查步骤可参考 [docs/npm-staged-publish.md](docs/npm-staged-publish.md)。

## 后续计划

- 根据实际使用反馈补充或调整内置资源。
- 继续为其他 CLI 行为补充自动化测试与使用示例。
