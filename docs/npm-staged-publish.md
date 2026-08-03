# npm 暂存发布流程

本文记录 `@xuxiao-dev/ai-dev-kit@0.1.2` 的成功发布流程。

## 适用场景

当 npm 账户启用了安全密钥（例如 Mac Touch ID / WebAuthn），但直接执行 `npm publish` 返回 `EOTP`，无法提供 6 位认证器验证码时，使用 npm 的暂存发布流程。

## 前置条件

- 已在项目根目录完成代码修改。
- `package.json` 的版本号尚未发布到 npm。
- npm 账户拥有该包的发布权限，并已配置 2FA 安全密钥。
- Node.js 版本不低于 `22.14.0`。
- 暂存发布要求 npm CLI 不低于 `11.15.0`。

## 1. 登录 npm

在本机终端执行：

```bash
npm login
```

按终端给出的 npm 登录链接在浏览器中完成验证。若账户配置的是安全密钥，选择 **Use security key**，然后使用 Touch ID 或硬件安全密钥确认。

确认登录账号：

```bash
npm whoami
```

## 2. 检查线上版本并升级本地版本

```bash
npm view @xuxiao-dev/ai-dev-kit version dist-tags --json
pnpm version patch --no-git-tag-version
```

`--no-git-tag-version` 只更新本地版本号，不自动创建 Git tag 或 commit。

## 3. 构建并检查发布内容

```bash
pnpm build
npm pack --dry-run
```

确认压缩包中包含预期文件，例如 `bin/`、`codex/`、`cursor/`、`README.md` 和 `package.json`。

## 4. 暂存发布

旧版 npm 不支持 `npm stage`。本项目当时的 npm 为 `10.9.2`，因此临时使用 npm `11.15.0`；该操作不会修改项目依赖或全局 npm：

```bash
npx --yes --package=npm@11.15.0 npm stage publish . --access public
```

命令成功后会返回一个 stage ID。此时包已上传至 npm 暂存区，但尚未公开安装。

## 5. 在 npm 网站批准发布

使用包维护者账号登录 npm，打开：

```text
https://www.npmjs.com/settings/<npm-username>/staged-packages
```

找到对应的 `包名@版本号`，点击 **Approve**，再通过安全密钥完成 Touch ID / WebAuthn 验证。批准后版本才会正式发布并指向 `latest`。

> 暂存版本不会出现在普通的包 README 页面；需要在账号级的 **Staged Packages** 页面处理。

## 6. 验证发布结果

```bash
npm view @xuxiao-dev/ai-dev-kit version dist-tags --json
```

本次成功结果：

```json
{
  "version": "0.1.2",
  "dist-tags": {
    "latest": "0.1.2"
  }
}
```

## 常见问题

### `ENOENT: Could not read package.json`

说明在错误目录执行了 `npm publish`。先进入项目根目录，再执行发布命令：

```bash
cd /path/to/ai-dev-kit
```

### `EOTP: This operation requires a one-time password`

直接发布要求 2FA。若没有 6 位认证器验证码但已配置安全密钥，使用上述暂存发布流程，并在网站的 **Staged Packages** 中通过安全密钥批准。

### `npm stage` 不存在

当前 npm 版本过旧。使用 npm `11.15.0` 或更高版本，例如：

```bash
npx --yes --package=npm@11.15.0 npm stage publish . --access public
```
