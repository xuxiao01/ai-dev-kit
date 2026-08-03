# AI Task Workflow

当用户提供 `local-docs/ai-tasks/briefs/*.brief.md`，进入以下工作流：

```text
Brief → Plan → Checkpoint 执行 → 用户验收 → Final Report
```

所有协作文档放在 `local-docs/ai-tasks/{briefs,plans,reports}/`，命名统一为 `YYYY-MM-DD_task-name`；这些本地协作文档默认不提交 Git。

## Plan

收到“基于 brief 生成 plan”后：读取 brief 和关联项目代码，不修改业务代码或样式，不安装依赖；在 `plans/` 中创建同名 `.plan.md`，然后停下等待确认。

Plan 必须说明：文件对应关系、需求理解、项目现状、涉及文件（含只读参考）、实现思路、2–5 个 checkpoint、风险、待确认问题、验收标准和建议先执行的 checkpoint。

## Checkpoint

只有用户明确确认 plan 并指定 checkpoint 后才能修改。默认每次只执行一个 checkpoint；执行前说明本次目标、修改范围和不处理的内容。

执行时只改当前 checkpoint 的内容，不做计划外优化、不删已有逻辑、不引入未确认依赖。发现计划不合理、不确定点或跨页面风险时暂停并说明。

每个 checkpoint 后停止并汇报：已完成内容、修改文件、验证结果、用户需要验收的重点和下一步建议。未获明确验收不得继续下一个 checkpoint。

## Final report

所有 checkpoint 完成且用户确认结束后，必须在 `reports/` 中创建同名 `.report.md`。报告包含：文件对应关系、目标回顾、完成内容、checkpoint 执行和验收记录、最终修改文件、验证结果、遗留问题与提交建议。

不要在未生成计划或未确认计划时改代码；不要在 checkpoint 后自动推进；不要只在聊天中输出 report；不要伪造验证结果或忽略 brief 中的“不要做”。
