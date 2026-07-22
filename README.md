# Lost Memory

《失落的记忆》— 纯前端互动推理游戏。

**在线试玩：** https://acm1t.github.io/lost-memory/

第一案：**《407 号房的失踪者》**（The Vanishing at Room 407）

## 特点

- 无需账号、后端或运行时 AI；打开页面即可游玩
- 场景调查、人物询问、证据关联、时间线与最终推理
- 本地存档与设置；可选 PWA / 离线壳缓存
- 为 GitHub Pages 子路径设计（Hash 路由 + `base: '/lost-memory/'`）

## 当前状态

v1.0 发布就绪（Phase 1–10）。进度与验收见 [发布检查清单](docs/RELEASE_CHECKLIST.md)、[QA 清单](docs/QA_CHECKLIST.md)。

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认：http://localhost:5173/lost-memory/

## 常用命令

```bash
npm run lint
npm run format:check
npm test
npm run build
npm run preview
npm run validate:case
```

构建产物在 `dist/`。生产构建会生成 `dist/sw.js`（仅生产环境注册 Service Worker）。

## 部署

推送到 `main` 后由 GitHub Actions 自动构建并部署到 Pages。首次使用请在仓库 **Settings → Pages** 将 Source 设为 **GitHub Actions**。详见 [部署指南](docs/DEPLOYMENT.md)。

## 隐私

游戏存档与设置仅保存在用户浏览器本地（`localStorage`）。不收集个人信息，不含分析或广告。

## 许可与致谢

- 源代码：[MIT License](LICENSE)
- 制作与素材致谢：[CREDITS.md](CREDITS.md)

## 文档

- [游戏设计](docs/GAME_DESIGN.md)
- [技术设计](docs/TECHNICAL_DESIGN.md)
- [第一案设计](docs/CASE_001_DESIGN.md)
- [案件编写指南](docs/CASE_AUTHORING.md)
- [部署指南](docs/DEPLOYMENT.md)
- [QA 清单](docs/QA_CHECKLIST.md)
- [发布检查清单](docs/RELEASE_CHECKLIST.md)
