# Lost Memory — Technical Design Document

## 1. Goals & Constraints

| Constraint           | Implementation stance                             |
| -------------------- | ------------------------------------------------- |
| No runtime AI        | All narrative in static JSON/assets               |
| No backend           | Static site only                                  |
| GitHub Pages subpath | Vite `base: '/lost-memory/'`; relative asset URLs |
| Refresh-safe routing | Hash router only (`#/…`)                          |
| Offline-friendly     | Optional PWA later; must not break updates        |
| Privacy              | Saves in `localStorage` only; no trackers         |

Stack: **HTML5 + CSS3 + JavaScript ES Modules + JSON + Vite + Vitest + ESLint + Prettier**. No React/Vue/Angular.

---

## 2. Architecture

```text
index.html
  └─ app.js
       ├─ router (hash)
       ├─ game-state + save-manager
       ├─ systems (case, investigation, dialogue, clue, links, timeline, deduction, audio)
       └─ views (home, cases, briefing, investigation, dialogue, archive, timeline, deduction, settings, ending, credits)
```

**Principles**

- Content (JSON) separated from engine (JS)
- Systems are pure where possible; views render from state
- One-way flow: user action → system → state mutation → save → re-render
- Case IDs and character names are never hard-coded in systems

---

## 3. Module Responsibilities

| Module                                            | Responsibility                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `app.js`                                          | Boot, register routes, wire global UI shell                                       |
| `router.js`                                       | Parse `location.hash`, guard invalid routes, restore safe view after refresh      |
| `game-state.js`                                   | In-memory state: flags, clues, topics, hotspot progress, timeline order, settings |
| `save-manager.js`                                 | Serialize/deserialize, version migrate/reset, corrupt recovery                    |
| `case-loader.js`                                  | Load index + case JSON, run validation, expose current case                       |
| `investigation-system.js`                         | Hotspot availability, inspect actions, unlock side effects                        |
| `dialogue-system.js`                              | Topic gates, ask flow, history                                                    |
| `clue-system.js`                                  | Discover, pin, filter helpers                                                     |
| `evidence-link-system.js`                         | Pairwise link lookup from case data                                               |
| `timeline-system.js`                              | Reorder + validate event order                                                    |
| `deduction-system.js`                             | Score submission, pick ending, compute rank                                       |
| `audio-system.js`                                 | BGM/SFX with gesture unlock, mute, missing-file tolerance                         |
| `validation.js` / `scripts/validate-case-data.js` | Schema & reference integrity                                                      |
| Views / components                                | DOM rendering only; call systems for logic                                        |
| `dom.js`, `constants.js`                          | Shared helpers                                                                    |

---

## 4. Data Loading

1. Load `src/data/case-index.json`
2. On case start, dynamic-import or fetch `src/data/cases/case-001.json` (bundled via Vite JSON import preferred for Pages reliability)
3. Validate before entering briefing
4. Fail soft: show error view; never white-screen

### 4.1 Case JSON shape (v1)

```json
{
  "id": "case-001",
  "title": "…",
  "titleZh": "…",
  "summary": "…",
  "difficulty": "normal",
  "estimatedMinutes": 45,
  "coverImage": "assets/images/cases/case-001-cover.svg",
  "briefing": { "background": "…", "time": "…", "place": "…", "victim": {}, "objectives": [] },
  "characters": [],
  "locations": [],
  "clues": [],
  "dialogues": [],
  "evidenceLinks": [],
  "timeline": { "events": [], "correctOrder": [] },
  "deduction": {
    "personOptions": [],
    "motiveOptions": [],
    "methodOptions": [],
    "evidenceOptions": [],
    "correct": { "personId": "", "motiveId": "", "methodId": "", "requiredEvidenceIds": [] },
    "scoring": {}
  },
  "endings": [],
  "flags": []
}
```

Exact field rules for authors: later `docs/CASE_AUTHORING.md` (Phase 3+). Design source of truth for Case 001 content: `docs/CASE_001_DESIGN.md`.

### 4.2 Validation rules (minimum)

- Required fields present
- Unique IDs across characters, locations, hotspots, clues, topics, events, endings
- References resolve (clue ↔ character/location, topic reveals, link clueIds, timeline IDs, deduction answers)
- Unlock conditions reference known flags/clues
- At least one path to deduction unlock + reachable correct ending
- `evidenceLinks` pairs reference existing clues

---

## 5. State Management

### 5.1 Runtime state (conceptual)

```text
{
  dataVersion,
  caseId,
  view,
  flags: Set|Object,
  discoveredClueIds,
  pinnedClueIds,
  inspectedHotspotIds,
  askedTopicIds,
  dialogueHistory,
  timelineOrder,
  timelineSolved,
  deductionAttempts,
  deductionResult,
  endingId,
  rank,
  settings,
  startedAt,
  updatedAt,
  completed
}
```

Mutations go through small APIs (`discoverClue`, `setFlag`, `askTopic`, …) so saves stay consistent.

### 5.2 Unlock conditions

Authorable predicates, evaluated in engine, e.g.:

- `flag:flag_id`
- `clue:clue_id`
- `topic:topic_id`
- `timelineSolved`
- `all: […]` / `any: […]`

No free-form scripts in JSON.

---

## 6. Save Format

**Key:** `lost-memory.save.v1` (or namespaced constant)

```json
{
  "dataVersion": 1,
  "caseId": "case-001",
  "flags": {},
  "discoveredClueIds": [],
  "pinnedClueIds": [],
  "inspectedHotspotIds": [],
  "askedTopicIds": [],
  "dialogueHistory": [],
  "timelineOrder": [],
  "timelineSolved": false,
  "deductionAttempts": 0,
  "endingId": null,
  "rank": null,
  "settings": {
    "bgm": true,
    "sfx": true,
    "volume": 0.7,
    "motion": "full",
    "textSpeed": "normal",
    "language": "zh"
  },
  "startedAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "completed": false
}
```

**Rules**

- Autosave after meaningful actions
- `try/catch` on read/parse; on failure offer reset, do not crash
- Unknown `dataVersion` → migrate if known, else safe reset with user notice

---

## 7. Routing

Hash routes only:

```text
#/home
#/cases
#/case/case-001
#/investigation
#/dialogue/:characterId
#/archive
#/timeline
#/deduction
#/ending
#/settings
#/credits
```

- No History API paths that 404 on Pages refresh
- Invalid hash → `#/home` or last safe view
- Case-required views redirect to briefing/home if no active case

---

## 8. UI Shell & Responsive Breakpoints

| Breakpoint | Layout                               |
| ---------- | ------------------------------------ |
| ≥1024px    | Investigation multi-pane shell       |
| 768–1023px | Compressed panes / collapsible side  |
| ≤767px     | Single column + bottom nav + drawers |
| 320px      | Minimum supported width              |

Shared components: modal (focus trap), toast (`aria-live`), clue card, progress indicator.

---

## 9. Build & Deploy

```js
// vite.config.js
export default defineConfig({
  base: '/lost-memory/',
  // …
});
```

| Command                 | Purpose                     |
| ----------------------- | --------------------------- |
| `npm run dev`           | Local Vite server           |
| `npm run build`         | Static output to `dist/`    |
| `npm run preview`       | Preview production build    |
| `npm test`              | Vitest                      |
| `npm run lint`          | ESLint                      |
| `npm run format:check`  | Prettier check              |
| `npm run validate:case` | Case JSON validation script |

GitHub Actions (Phase 9): on push to `main`, build and deploy `dist/` with official Pages actions. No private servers or secrets required for build.

---

## 10. PWA

Implemented for v1:

- `public/manifest.webmanifest` — name, `start_url` / `scope` under `/lost-memory/`, theme color, SVG icons
- Build plugin `scripts/vite-sw-plugin.js` emits `dist/sw.js` with versioned precache
- Update strategy: network-first for HTML / navigations; cache-first for same-origin assets; old caches deleted on activate
- `src/js/pwa.js` registers the SW only when `import.meta.env.PROD` (disabled in Vite dev)
- Deploy docs: `docs/DEPLOYMENT.md`

GitHub Actions workflow `.github/workflows/deploy-pages.yml` runs lint, format check, tests, case validation, build, then deploys `dist/` on push to `main`.

---

## 11. Audio

- Web Audio or HTMLAudioElement wrapper
- Resume/play after first pointer/key gesture
- Settings: BGM, SFX, volume
- Missing src → log once, no throw

---

## 12. Testing Strategy

| Area            | Tests                                       |
| --------------- | ------------------------------------------- |
| Case validation | Duplicates, broken refs, unreachable ending |
| Save manager    | Round-trip, corrupt JSON, version mismatch  |
| Clue / dialogue | Unlock predicates, discover side effects    |
| Evidence links  | Pair results & flags                        |
| Timeline        | Correct/incorrect orders                    |
| Deduction       | Score matrix, ending selection              |

Manual checklist (Phase 10): Chromium/Firefox, mobile viewport, new/continue/delete, wrong/right deduction, refresh on hash routes, Pages base path, offline cache if SW enabled, muted audio path.

---

## 13. Security & Privacy

- No PII collection, no remote logging of saves
- No analytics/ads by default
- No secrets in repo
- README states: saves exist only in the local browser

---

## 14. Suggested Directory Layout (Phase 2+)

Matches the master structure under `src/`, `public/`, `tests/`, `scripts/`, `docs/`, `.github/workflows/`. Create files only when they have a real role.

---

## 15. Phase 2 Skeleton Acceptance

When Phase 2 stops, the repo must:

1. Install with `npm install`
2. Pass `lint`, `test`, `build` (even with stub tests)
3. Serve home + case select via hash routes under `base: '/lost-memory/'`
4. Contain style tokens aligned with the visual direction
5. Not yet require full case gameplay
