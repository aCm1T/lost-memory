# Lost Memory — Game Design Document

## 1. Vision

**Lost Memory**（《失落的记忆》）is a single-player, browser-based interactive mystery. Players investigate cases by exploring scenes, interviewing people, collecting evidence, linking contradictions, reconstructing timelines, and submitting a final deduction.

The game ships as a pure static front-end. All story content is authored offline as data. The published build never calls AI APIs or backends.

**Core theme**

> A person’s memory may be unreliable, but physical evidence and time do not lie.

**Tone**

- Modern urban suspense
- Light psychological tension
- No gore or shock imagery
- Fair-play deduction: the truth is fully supported by discoverable evidence

---

## 2. Player Experience Goals

Players should feel like an investigator reconstructing a night that no single witness remembers cleanly.

| Goal | Design response |
| --- | --- |
| Agency | Choose where to investigate, whom to ask, what to compare |
| Fairness | Every critical conclusion is backed by at least one clue |
| Clarity | Tasks, progress, and unlocks are visible |
| Tension | Testimony conflicts and incomplete memory create doubt |
| Closure | Final deduction yields graded endings and a clear explanation |

Estimated playtime for Case 001: **35–50 minutes**.

---

## 3. Core Loop

```text
Enter game
→ New game / Continue
→ Case briefing
→ Choose location or person
→ Investigate hotspots / ask topics
→ Collect clues & flags
→ Unlock new questions, scenes, or links
→ Review archive & compare evidence
→ Order the timeline
→ Submit final deduction
→ Receive ending + rank
```

Players must make real choices. The game is not a linear “Next” novel.

---

## 4. Systems Overview

### 4.1 Case system

Each case is an independent JSON package registered in `case-index.json`. Core engine code is shared; new cases add data and assets only.

### 4.2 Investigation

Locations contain hotspots. Hotspots may require flags/clues to appear. Interacting yields clues, flags, or narrative beats. Hotspots show unexplored vs explored state and meet touch/keyboard accessibility targets.

### 4.3 Dialogue

Characters expose topics gated by unlock conditions. Answers may reveal clues or set flags. Characters may lie by design; lies are consistent and later explainable.

### 4.4 Clues & archive

Clues have type, source, related entities, and importance. The archive supports filter, detail, pin, and two-clue comparison.

### 4.5 Evidence links

Preset pairs (or ordered pairs) produce: contradiction, corroboration, weak/no link, or a new inference (flag). No runtime NLP.

### 4.6 Timeline

Discovered events can be reordered with up/down controls (and optional drag on desktop). Submitting validates against the authored order and can unlock deduction or late scenes.

### 4.7 Deduction & endings

Players select:

1. Primary responsible person / truth focus
2. Motive or cause
3. How the event unfolded
4. Supporting key evidence

Scoring produces ranks (S / A / B / C) and at least two endings (e.g. truth revealed vs partial closure).

### 4.8 Save

`localStorage` autosave with versioned schema, continue, delete, restart, and corrupt-save recovery.

---

## 5. Case Structure (v1)

| Field | Case 001 target |
| --- | --- |
| Case | `case-001` — The Vanishing at Room 407 / 《407 号房的失踪者》 |
| Characters | 5 interviewable + 1 missing person (via notes/clues) |
| Locations | 4–5 |
| Clues | 12–15 |
| Dialogue topics | 15+ |
| Timeline events | 6–8 ordered events |
| Key contradictions | 3+ |
| Endings | 2+ |
| Difficulty | Normal |

Full truth, timeline, lies, and proof chain: see `docs/CASE_001_DESIGN.md`.

---

## 6. Difficulty Curve (Case 001)

1. **Briefing** — clear missing-person frame; first tasks obvious
2. **Early investigation** — Room 407 + neighbor yield free clues
3. **Mid game** — interviews unlock contradictions; archive comparison becomes useful
4. **Late game** — timeline submission gates final areas / deduction
5. **Deduction** — requires combining person + motive + method + evidence

Red herrings exist but resolve and do not block the true proof chain.

---

## 7. Visual Direction

**Keywords:** Noir · Archive · Evidence board · Hotel mystery · Memory fragments

**Palette direction**

- Deep desaturated blue / slate gray base
- Warm paper / manila accent for documents and archive UI
- Muted amber for alerts and pinned evidence
- Avoid neon, heavy glassmorphism, and pure black + pure white body text

**UI principles**

- Indie game clarity over dashboard clutter
- One job per view
- Restrained motion; honor `prefers-reduced-motion`
- CSS/SVG placeholders first; no copyrighted assets

---

## 8. Audio Direction

| Layer | Role |
| --- | --- |
| BGM | Low, tense ambient loop (optional placeholder silence if needed) |
| UI click | Light archival “stamp/click” |
| Clue found | Soft discovery chime |
| Correct / wrong | Distinct short confirm / reject tones |

Audio starts only after first user gesture; missing files must not break gameplay; settings persist.

---

## 9. Page / View Map

| Route (hash) | Purpose |
| --- | --- |
| `#/home` | Title, New / Continue / Cases / Settings / Credits |
| `#/cases` | Case list (extensible; v1 has one case) |
| `#/case/:id` | Briefing |
| `#/investigation` | Locations, hotspots, progress |
| `#/dialogue/:characterId` | Interview |
| `#/archive` | Clues, filters, compare |
| `#/timeline` | Event ordering |
| `#/deduction` | Final form + confirm |
| `#/ending` | Result, rank, explanation |
| `#/settings` | Audio, motion, text speed, language stub, wipe save |
| `#/credits` | Credits |

Desktop investigation: top bar + left nav + center stage + right progress + bottom utility nav.  
Mobile: single column, bottom nav, panels as drawers/modals, no horizontal page scroll.

---

## 10. Implementation Task List (by phase)

| Phase | Scope |
| --- | --- |
| 0 | Repo inspection |
| 1 | Design docs + Case 001 truth (this phase) |
| 2 | Vite skeleton, hash router, home/cases, lint/test/build |
| 3 | Case JSON, validation, loader, state, briefing |
| 4 | Investigation + dialogue + unlocks |
| 5 | Archive, evidence links, timeline |
| 6 | Deduction, scoring, endings, full clear path |
| 7 | Save, settings, audio |
| 8 | Visual polish, responsive, a11y |
| 9 | PWA + GitHub Pages Actions |
| 10 | Full QA, README/CREDITS/LICENSE, release checklist |

---

## 11. Future Roadmap (post-v1)

- Additional cases via data packs only
- Optional language packs (`en` / `zh`) using existing string fields
- Richer evidence board visualization
- Achievements stored locally
- Optional PWA install prompts polish
- Authoring CLI helpers for case validation

---

## 12. Non-Goals (v1)

- Multiplayer, accounts, analytics, ads
- Runtime AI, backends, databases
- 3D engine or physics
- Full localization UI (fields reserved only)
- Complex inventory crafting
