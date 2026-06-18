<p align="center">
  <img src="https://typorabucket0308.oss-cn-beijing.aliyuncs.com/images/20260603103934962.jpg" alt="项目预览图" width="800" />
</p>

<h1 align="center">ai-dev-kit</h1>
<p align="center">
  用于把 AI 开发辅助资源安装到项目中的 TypeScript CLI 工具。<br />
  在目标项目根目录执行：<code>npx @xuxiao-dev/ai-dev-kit cursor add --all</code>
</p>

## 项目简介

`@xuxiao-dev/ai-dev-kit` 是一个面向项目开发流程的 npm CLI 工具包，当前主要用于管理和安装 Cursor 相关资源。

在任意项目根目录执行 `npx @xuxiao-dev/ai-dev-kit cursor add --all`，即可将包内置的 Cursor Rules 和 Cursor Commands 复制到 `.cursor/` 目录，适合在多个项目中复用统一的 AI 协作规范、README 生成命令、任务计划命令和提交命令。

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

## 快速开始

在目标项目根目录执行，一次性安装全部内置 Cursor 资源：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add --all
```

资源会复制到当前项目的 `.cursor/rules` 和 `.cursor/commands`。默认跳过已存在文件；如需覆盖，加 `--force`。

## 使用方式

推荐通过 `npx` 直接运行，无需提前安装：

```bash
npx @xuxiao-dev/ai-dev-kit <子命令>
```

查看内置资源：

```bash
npx @xuxiao-dev/ai-dev-kit cursor list
```

安装全部 Cursor 资源：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add --all
```

安装单个 Cursor Rule：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add rule ai-task-workflow-rule
```

安装单个 Cursor Command：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add command readme-command
```

覆盖已存在文件：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add rule ai-task-workflow-rule --force
npx @xuxiao-dev/ai-dev-kit cursor add --all --force
```

### 安装到项目后使用

若已作为开发依赖安装，可省略 `npx` 前缀：

```bash
pnpm add -D @xuxiao-dev/ai-dev-kit
pnpm ai-dev-kit cursor add --all
```

等价于：

```bash
npx @xuxiao-dev/ai-dev-kit cursor add --all
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

### 首次发布

```bash
# 安装依赖
pnpm install

# 构建产物
pnpm build

# 发布到 npm
npm publish
```

首次发布前需要确认：

- npm 包名未被占用，或当前账号拥有该包的发布权限
- `package.json` 中的 `name`、`version`、`bin`、`files` 配置正确
- 已登录正确的 npm 账号

### 更新发布

npm 不允许重复发布同一个包版本。每次更新后，都需要先提交代码，再升级版本号，最后重新构建并发布。

```bash
# 查看当前改动
git status

# 提交本次变更
git add .
git commit -m "type(scope): 本次更新说明"

# 确认工作区干净
git status --short

# 升级版本号
pnpm version patch

# 构建并发布
pnpm build
npm publish
```

版本号选择建议：

- `pnpm version patch`：文档修复、小问题修复
- `pnpm version minor`：新增能力且保持兼容
- `pnpm version major`：包含破坏性变更

注意事项：

- 执行 `pnpm version patch/minor/major` 前，Git 工作区必须是干净的，否则会报 `Git working directory not clean`
- 发布失败并提示 `You cannot publish over the previously published versions` 时，说明该版本已经发布过，需要升级版本号后重新发布
- `pnpm version` 会自动修改版本号并创建对应的 Git commit / tag
- 发布前建议确认已登录正确的 npm 账号，并且账号有当前包的发布权限

## 部署说明

这是一个 npm CLI 工具，不需要像 Web 项目一样部署到服务器。常见交付方式是构建后发布到 npm，再通过 `npx` 或项目内 devDependencies 使用。

npm 包名、发布账号和访问权限请根据实际情况确认。

## 后续计划

- 补充测试用例，覆盖资源列表、复制、跳过和覆盖逻辑
- 补充 npm 发布说明和版本管理规范
- 根据实际使用情况扩展更多 Cursor Rules 和 Commands
- 增加资源名称与 README 内置资源列表的同步检查

## License

待补充
