---
name: staged-change-report
description: Generate and stage a concise Chinese Markdown report for the current Git staged changes. Use only when explicitly invoked to document what changed for human and AI readers.
---

# 暂存区修改报告

根据当前 Git 暂存区生成一份中文 Markdown 修改报告，供人和 AI 理解本次变更。仅自动暂存新报告，不修改源码、不暂存其他文件、不运行测试、不提交或推送。

## 先读取暂存区

1. 使用 `git rev-parse --show-toplevel` 确认目标仓库根目录，并在该目录操作。
2. 只以 `git diff --cached` 为变更依据，忽略未暂存和未跟踪内容。所有暂存差异查询均排除 `docs/change-reports/**`，避免报告描述自身或此前报告。
3. 创建报告前捕获暂存快照，包括文件状态、增加／删除行数及完整差异。必要时读取相关上下文，但不得把未暂存改动写入报告；文件存在未暂存修改时，优先使用暂存版本核实。
4. 排除报告目录后没有暂存变更时，停止并提示：`暂存区没有需要记录的代码变更。` 不创建文件或空月份目录。

可使用以下命令读取：

```bash
git diff --cached --quiet -- . ':(exclude)docs/change-reports/**'
git diff --cached --name-status --find-renames -- . ':(exclude)docs/change-reports/**'
git diff --cached --numstat --find-renames -- . ':(exclude)docs/change-reports/**'
git diff --cached --summary --find-renames -- . ':(exclude)docs/change-reports/**'
git diff --cached --no-ext-diff --unified=3 -- . ':(exclude)docs/change-reports/**'
```

## 确定元信息和归档位置

- 从 `git config --get user.name` 和 `git config --get user.email` 读取报告生成者；缺失项使用 `unknown`。称为“报告生成者”，不能把 Git 配置当作实际代码作者的证明。
- 使用本机当地生成时间，报告中包含 UTC 偏移；月份目录、文件名和报告时间采用同一时间戳。
- 报告保存到仓库内的以下位置，仅在确定生成报告时创建目标月份目录：

```text
docs/change-reports/YYYY-MM/YYYY-MM-DD_HH-mm-ss_<sanitized-user-name>.md
```

- 文件名中的用户名去掉首尾空白，将连续空白替换为 `-`，移除路径分隔符及文件名不安全标点；清理后为空则使用 `unknown`。
- 不覆盖已有文件；重名时在 `.md` 前依次添加 `-2`、`-3` 等后缀。
- 每次调用生成独立报告，不合并月度总报告，也不移动历史报告，除非用户另行要求归档。

## 编写报告

内容保持简洁，不复制完整补丁、庞大生成文件或二进制内容。沿用以下结构：

```markdown
# 暂存区代码修改报告

## 基本信息

- 生成时间：<带 UTC 偏移的本机当地 ISO 8601 时间>
- 当前分支：<分支名或 detached HEAD>
- 基准提交：<HEAD 短哈希及主题>
- 报告生成者：<姓名> <<邮箱>>
- 说明：报告生成者来自本地 Git 配置，不代表 Git 暂存区能够证明实际代码作者。

## 修改摘要

<用一至三段说明改动目标、主要行为变化和范围。>

## 变动文件

| 状态 | 文件 | 增加 | 删除 | 内容说明 |
| --- | --- | ---: | ---: | --- |
| 修改 | `path` | 0 | 0 | 简要说明 |

## 具体修改

<按业务模块或职责分组，说明关键文件、符号及其关系。>

## 影响范围

- 接口与数据结构：...
- 配置与部署：...
- 数据库与兼容性：...
- 用户可见行为：...

## 测试与验证建议

- 已暂存的测试变化：...
- 本报告未执行测试。
- 建议验证：...

## AI 快速上下文

- 变更目标：...
- 关键文件与符号：...
- 主要数据流：...
- 风险与注意事项：...
- 后续关注：...
```

- 文件状态使用“新增、修改、删除、重命名、复制、类型变更、未合并”；重命名列出旧路径和新路径，二进制文件行数使用 `—` 并概述用途。
- 影响类别没有暂存差异证据时写“无”。不编造需求、动机、作者、测试结果或运行时表现；明确区分观察到的改动和建议验证项。
- 涉及疑似账号凭证、token、私钥、连接串或个人信息时，只概述并提醒用户可能已暂存敏感材料，不复述其值。

## 完成前检查

1. 确认报告只反映创建前捕获的暂存快照，不包含未暂存内容或历史报告。
2. 仅执行 `git add -- <新报告的精确路径>`，不得使用目录、通配符或其他扩大暂存范围的命令。
3. 使用 `git status --short` 确认新报告已暂存，原有文件的暂存／未暂存状态没有改变。
4. 交付时说明报告路径、汇总的源文件数量，以及本次未提交、未运行测试。不要自动调用其他 Skill 继续提交或整理文档。
