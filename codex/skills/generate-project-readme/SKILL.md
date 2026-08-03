---
name: generate-project-readme
description: Create or update a GitHub-ready README.md by inspecting the real project structure, dependencies, scripts, and implemented features. Use when the user asks to generate, rewrite, improve, or document a project's README; never invent unverified features or configuration.
---

# 生成项目 README

1. 先检查 `package.json`、锁文件、构建和 TypeScript 配置、现有 README、入口文件及核心源码目录；根据项目类型补充检查路由、组件、服务、环境变量示例和部署配置。
2. 仅从实际代码与配置中总结项目名称、用途、功能、技术栈、目录结构、运行命令、环境变量和部署方式。不能确认的信息写“待补充”。不要暴露 `.env` 的具体值。
3. README 顶部默认放置封面图，再放居中标题和一句简介。封面地址优先级：本次请求明确提供的 OSS/GIF 地址；`docs/images/readme-cover.gif`；`docs/images/readme-cover.png`；否则使用 `https://typorabucket0308.oss-cn-beijing.aliyuncs.com/images/20260603103934962.jpg`。
4. README 至少包含：项目简介、功能特性、技术栈、核心目录结构、本地运行、环境变量、部署说明和后续计划。目录结构只列核心文件。
5. 从实际锁文件选择包管理器：`pnpm-lock.yaml` 用 pnpm，`yarn.lock` 用 yarn，`package-lock.json` 用 npm。只写已存在的 scripts；缺失命令标记“待补充”。
6. 可以将无法确认的部署方式写成“参考”，但不要把它描述为项目既有能力。roadmap 保持保守且贴合当前项目状态。
7. 修改 `README.md` 后，简要说明依据和文件路径。不要凭空添加图片、敏感信息、账号、接口地址或版权风险说明。
