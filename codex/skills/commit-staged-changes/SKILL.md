---
name: commit-staged-changes
description: Generate a Chinese Conventional Commit message from Git staged changes and execute exactly one safe commit. Use when the user explicitly asks Codex to commit the current staged changes, says “提交暂存区”, “帮我 commit”, or invokes this skill; do not use for merely explaining Git or reviewing changes without authorization to commit.
---

# 提交暂存区变更

1. 只读取暂存区：先运行 `git diff --cached`，必要时读取 `git diff --cached --stat`。不要把未暂存变更纳入判断。
2. 暂存区为空时，停止并输出：`当前暂存区没有变更，请先执行 git add 后再生成 commit message。`
3. 生成一条中文 Conventional Commit：优先 `<type>(<scope>): <subject>`；scope 不明确时省略。subject 用简短动宾结构，不超过 50 个中文字符，不以句号结尾。
4. 选择最核心的 type：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore` 或 `revert`。scope 使用受影响模块或路径的英文小写名称；无法确定则不编造。
5. 变更多且单行说不清时，补充简短 body，列出真实变更点。
6. 向用户展示推荐 message 和一句选择理由后，直接执行一次 `git commit`。不要 `git push`、`--no-verify`、`--amend`、rebase 或其他历史改写操作。
7. 提交成功后，运行 `git show -s --format=%B HEAD` 自检。提交信息不得包含任何共同作者标记（大小写不敏感的 `Co-authored-by:`）。若发现，报告异常并停止；不要自行 amend。
8. 提交失败时，只输出关键失败原因和 1–2 条下一步建议；不要重复尝试。

不要输出完整 diff、多个无关候选，或暂存区之外的推断。
