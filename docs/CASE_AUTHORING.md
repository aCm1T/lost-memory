# Case Authoring Guide

本指南说明如何为 Lost Memory 新增或修改案件数据。

## 1. 文件位置

| 文件                       | 作用                       |
| -------------------------- | -------------------------- |
| `src/data/case-index.json` | 案件列表（选择页）         |
| `src/data/cases/<id>.json` | 完整案件内容               |
| `public/assets/images/...` | 封面、人物、场景等静态资源 |

引擎代码不应写死某个案件的人名或答案。正确答案只写在案件 JSON 的 `deduction.correct`。

## 2. 注册案件

在 `case-index.json` 增加一条摘要，并添加对应 `src/data/cases/<id>.json`。

```json
{
  "id": "case-002",
  "title": "Example Case",
  "titleZh": "示例案件",
  "summary": "一句话简介",
  "difficulty": "normal",
  "estimatedMinutes": 40,
  "coverImage": "assets/images/cases/case-002-cover.svg",
  "status": "available"
}
```

然后在 `src/js/systems/case-loader.js` 的 `caseModules` 中注册 JSON 模块导入（Phase 3 使用静态 import，保证 GitHub Pages 可靠）。

## 3. ID 命名

| 类型     | 前缀示例     |
| -------- | ------------ |
| 案件     | `case-001`   |
| 人物     | `char-...`   |
| 场景     | `loc-...`    |
| 热点     | `hot-...`    |
| 线索     | `clue-...`   |
| 话题     | `topic-...`  |
| 事件     | `evt-...`    |
| 证据关联 | `link-...`   |
| 结局     | `ending-...` |
| 标记     | `flag_...`   |

同一案件内 ID 必须唯一。

## 4. 条件系统

`unlockConditions` 是数组，**全部**满足才解锁。单条条件可为：

```json
{ "flag": "flag_time_gap" }
{ "clue": "clue-usb-leak" }
{ "topic": "topic-lin-cards" }
{ "timelineSolved": true }
{ "all": [ ... ] }
{ "any": [ ... ] }
```

空数组 `[]` 表示默认解锁。

## 5. 必填结构（摘要）

案件 JSON 至少包含：

- `briefing`（background / time / place / victim / objectives）
- `characters`（含 `interviewable`）
- `locations` + `hotspots`
- `clues`
- `dialogues`（按角色分组的 `topics`，总数 ≥ 15）
- `evidenceLinks`
- `timeline.events` + `timeline.correctOrder`
- `deduction`（选项 + `correct`）
- `endings`（≥ 2）
- `flags`

完整字段示例见 `src/data/cases/case-001.json`、`src/data/cases/case-002.json`，以及对应的 `docs/CASE_001_DESIGN.md` / `docs/CASE_002_DESIGN.md`。

## 6. 验证命令

```bash
npm run validate:case
npm test
```

校验会检查：必填字段、ID 唯一、引用完整性、对话数量、推理答案存在、至少一个默认可进入场景、至少两个结局等。

## 7. 公平推理提醒

- 先写真相与时间线，再写线索
- 禁止超自然强行解释
- 关键结论必须有证据
- 角色可以撒谎，但必须是设计好的谎言
