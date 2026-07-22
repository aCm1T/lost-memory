# Deployment Guide

## GitHub Pages（推荐）

目标地址：

```text
https://acm1t.github.io/lost-memory/
```

### 一次性仓库设置

1. 打开 GitHub 仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 确保仓库允许 Actions 读写 Pages（默认即可）

### 自动部署

工作流文件：

```text
.github/workflows/deploy-pages.yml
```

触发条件：

- 推送到 `main`
- 或手动 `workflow_dispatch`

流水线会执行：

1. `npm ci`
2. `npm run lint`
3. `npm run format:check`
4. `npm test`
5. `npm run validate:case`
6. `npm run build`
7. 上传 `dist/` 并部署到 GitHub Pages

任一检查失败都会阻止部署，并在 Actions 日志中给出错误。

### 本地验证生产构建

```bash
npm run build
npm run preview
```

预览默认也使用 `base: '/lost-memory/'`。

确认 `dist/sw.js` 与 `dist/manifest.webmanifest` 存在。

---

## PWA

### 包含内容

- `manifest.webmanifest`
- 应用图标（SVG 占位）
- 生产环境 Service Worker（构建时生成）

### 缓存策略

| 资源            | 策略                                    |
| --------------- | --------------------------------------- |
| HTML / 导航请求 | Network-first，失败时回退缓存           |
| 同域静态资源    | Cache-first，并写入运行时缓存           |
| 旧缓存          | `activate` 时删除非当前 `CACHE_VERSION` |

构建插件会为每次产物生成新的 `CACHE_VERSION`，避免旧 Service Worker 永久卡住新版本。

### 开发环境

开发服务器**不会**注册 Service Worker，避免调试被旧缓存干扰。

---

## 子路径注意

- Vite `base` 必须为 `/lost-memory/`
- 路由使用 Hash（`#/…`），刷新不会 404
- 不要改成 History API 路径路由，除非另行配置 Pages 回退

---

## 故障排查

| 现象             | 处理                                                           |
| ---------------- | -------------------------------------------------------------- |
| Actions 构建失败 | 查看对应 step 日志；先本地跑同一命令                           |
| 页面 404         | 确认 Pages Source 为 Actions，且 base 路径正确                 |
| 新版本不更新     | 硬刷新；或 Application → Service Workers → Unregister 后再打开 |
| 图标不显示       | 确认 `manifest.webmanifest` 与 `icons/` 已进入 `dist/`         |
