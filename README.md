# Lost Memory

《失落的记忆》— 纯前端互动推理游戏。

在线试玩（部署后生效）：https://acm1t.github.io/lost-memory/

## 当前进度

- Phase 1：产品 / 技术 / 第一案设计文档完成
- Phase 2：Vite 项目骨架、Hash 路由、首页与案件选择完成
- Phase 3：案件 JSON、数据校验、加载器、完整简报与调查概览完成
- Phase 4：场景调查点、人物询问、条件解锁、对话历史与任务进度完成
- Phase 5：证据档案、证据关联、时间线排序与验证完成

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

构建产物输出到 `dist/`，`vite.config.js` 已设置 `base: '/lost-memory/'` 以兼容 GitHub Pages 子路径。

## 隐私

游戏存档仅保存在用户浏览器本地。

## 文档

- [游戏设计](docs/GAME_DESIGN.md)
- [技术设计](docs/TECHNICAL_DESIGN.md)
- [第一案设计](docs/CASE_001_DESIGN.md)
- [案件编写指南](docs/CASE_AUTHORING.md)
