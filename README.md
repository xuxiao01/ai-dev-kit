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
- 默认跳过目标中已存在的资源；使用 `--force` 可覆盖已安装的 Skill 或更新受管理的 `AGENTS.md` 索引区块。

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
npx @xuxiao-dev/ai-dev-kit codex add skill document-project-readme
npx @xuxiao-dev/ai-dev-kit codex add skill vue-component-config
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
| Codex Skill | `content-blog-optimize`、`document-project-docs`、`document-project-readme`、`engineering-bug-review`、`git-commit-staged`、`vue-component-config` |

安装后，Cursor 资源会写入 `.cursor/rules/` 或 `.cursor/commands/`；Codex skills 会写入 `.agents/skills/`，并在目标项目的 `AGENTS.md` 中追加由 ai-dev-kit 管理的 Skill 索引区块。完整 Skill 内容不会写入 `AGENTS.md`。

目标项目中的 Codex 资源结构示例：

```text
project/
├── AGENTS.md
└── .agents/
    └── skills/
        └── vue-component-config/
            └── SKILL.md
```

`AGENTS.md` 只记录 Skill 的用途和路径；具体任务规范保存在对应的 `SKILL.md` 中。

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
- 为 CLI 行为补充自动化测试与使用示例。
