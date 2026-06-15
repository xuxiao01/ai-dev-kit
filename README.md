<p align="center">
  <img src="https://typorabucket0308.oss-cn-beijing.aliyuncs.com/images/20260603103934962.jpg" alt="项目预览图" width="800" />
</p>

<h1 align="center">ai-dev-kit</h1>
<p align="center">
  用于把 AI 开发辅助资源安装到项目中的 TypeScript CLI 工具。
</p>

## 项目简介

`@xuxiao-dev/ai-dev-kit` 是一个面向项目开发流程的 npm CLI 工具包，当前主要用于管理和安装 Cursor 相关资源。

它可以将包内置的 Cursor Rules 和 Cursor Commands 复制到当前项目的 `.cursor/` 目录，适合在多个项目中复用统一的 AI 协作规范、README 生成命令、任务计划命令和提交命令。

当前项目类型为工具库 / npm 包，入口命令为 `ai-dev-kit`，运行环境要求 Node.js `>=18`。

## 功能特性

- 查看包内置的 Cursor Rules 和 Cursor Commands
- 按名称安装单个 Cursor Rule 到 `.cursor/rules`
- 按名称安装单个 Cursor Command 到 `.cursor/commands`
- 支持一次性安装全部内置 Cursor 资源
- 默认跳过已存在文件，避免覆盖当前项目已有配置
- 支持通过 `--force` 覆盖已存在文件

## 技术栈

- Node.js `>=18`
- TypeScript
- Commander
- fs-extra
- picocolors
- tsup
- tsx
- pnpm

## 目录结构

```text
ai-dev-kit/
├── cursor/
│   ├── commands/
│   └── rules/
├── src/
│   ├── commands/
│   ├── utils/
│   └── cli.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## 内置资源

Cursor Rules：

- `ai-task-workflow-rule`

Cursor Commands：

- `readme-command`
- `create-plan-from-brief`
- `commit`

安装到业务项目后，资源会写入：

```text
.cursor/
├── commands/
│   └── xxx.md
└── rules/
    └── xxx.mdc
```

## 本地运行

安装依赖：

```bash
pnpm install
```

开发环境运行：

```bash
pnpm dev
```

构建 CLI：

```bash
pnpm build
```

构建后可直接执行：

```bash
node bin/ai-dev-kit.js cursor list
```

## 使用方式

直接通过 npm 包运行：

```bash
npx @xuxiao-dev/ai-dev-kit cursor list
```

或安装到项目中使用：

```bash
pnpm add -D @xuxiao-dev/ai-dev-kit
pnpm ai-dev-kit cursor list
```

查看内置资源：

```bash
ai-dev-kit cursor list
```

安装单个 Cursor Rule：

```bash
ai-dev-kit cursor add rule ai-task-workflow-rule
```

安装单个 Cursor Command：

```bash
ai-dev-kit cursor add command readme-command
```

安装全部 Cursor 资源：

```bash
ai-dev-kit cursor add --all
```

覆盖已存在文件：

```bash
ai-dev-kit cursor add rule ai-task-workflow-rule --force
ai-dev-kit cursor add --all --force
```

## 环境变量

当前项目未发现 `.env.example`，也没有从代码中识别到运行时必须配置的环境变量。

## 构建与发布

项目使用 `tsup` 构建，构建入口为 `src/cli.ts`，产物输出到 `bin/` 目录，并带有 Node.js CLI 所需的 shebang。

```bash
pnpm build
```

发布前会执行：

```bash
pnpm prepublishOnly
```

实际发布流程和 npm 权限配置待补充。

## 部署说明

这是一个 npm CLI 工具，不需要像 Web 项目一样部署到服务器。常见交付方式是构建后发布到 npm，再通过 `npx` 或项目内 devDependencies 使用。

如果需要发布到 npm，可参考以下流程：

```bash
pnpm install
pnpm build
npm publish
```

npm 包名、发布账号、版本策略和访问权限请根据实际情况确认。

## 后续计划

- 补充测试用例，覆盖资源列表、复制、跳过和覆盖逻辑
- 补充 npm 发布说明和版本管理规范
- 根据实际使用情况扩展更多 Cursor Rules 和 Commands
- 增加资源名称与 README 内置资源列表的同步检查

## License

待补充
