# QA Checklist — Lost Memory v1

Use this list before tagging a release. Automated rows were verified in Phase 10 on branch `feature/initial-game`.

## Automated (CI / local)

| Check                       | Command / artifact                                                        | Status |
| --------------------------- | ------------------------------------------------------------------------- | ------ |
| Lint                        | `npm run lint`                                                            | Pass   |
| Format                      | `npm run format:check`                                                    | Pass   |
| Unit / system tests         | `npm test` (45)                                                           | Pass   |
| Case data validation        | `npm run validate:case`                                                   | Pass   |
| Production build            | `npm run build`                                                           | Pass   |
| Pages base path in build    | `dist/index.html` asset URLs under `/lost-memory/`                        | Pass   |
| Manifest shipped            | `dist/manifest.webmanifest`                                               | Pass   |
| Service worker emitted      | `dist/sw.js` + precache list                                              | Pass   |
| SW registration (prod only) | Bundle registers `/lost-memory/sw.js`; `src/js/pwa.js` no-ops in non-PROD | Pass   |
| Deploy workflow present     | `.github/workflows/deploy-pages.yml`                                      | Pass   |

Covered by automated tests (representative):

- Case JSON integrity & loader
- Investigation / dialogue unlocks
- Evidence links & timeline order
- Deduction scoring & endings
- Save round-trip, corrupt recovery, settings
- Hash router path helpers
- PWA register no-op outside production

## Manual smoke (pre-merge / post-deploy)

Mark when exercised in a real browser.

### Desktop (Chromium)

- [x] Home → brand / primary CTAs visible (Phase 10 preview smoke)
- [x] Credits page lists aCm1T + MIT (Phase 10 preview smoke)
- [x] Cases lists 《407 号房的失踪者》 (Phase 10 preview smoke)
- [x] Settings form loads (BGM/SFX/volume) (Phase 10 preview smoke)
- [x] Hard refresh on hash route (`#/settings`) still loads (Phase 10 preview smoke)
- [ ] Inspect hotspot, discover clue, ask NPC topic (full playthrough)
- [ ] Archive: pin clue, resolve evidence link
- [ ] Timeline: wrong order rejected; correct order unlocks deduction
- [ ] Deduction: wrong answer (retry / lower rank path); correct → ending
- [ ] Settings: mute BGM/SFX, change volume/motion/text speed; reload persists
- [ ] Home: Continue after reload; Settings: restart case / clear save
- [ ] Hard refresh on `#/investigation`, `#/archive`, `#/timeline`, `#/deduction`

### Desktop (Firefox)

- [ ] Same core loop as Chromium (start → investigate → clear)
- [ ] localStorage save survives refresh
- [ ] No console errors on route changes

### Mobile viewport (~390×844)

- [ ] Investigation tabs / bottom nav usable; no horizontal page scroll
- [ ] Dialogue and modals readable; focus not trapped incorrectly after close
- [ ] Touch targets for primary actions workable

### GitHub Pages path

- [ ] Live URL `https://acm1t.github.io/lost-memory/` loads
- [ ] Hash routes work after refresh
- [ ] Assets (CSS/JS/icons/manifest) return 200 under `/lost-memory/`

### PWA / offline (optional)

- [ ] Manifest installable / icons visible in Application panel
- [ ] After first visit, airplane mode still serves shell (network-first HTML falls back to cache)
- [ ] New deploy eventually updates (new `CACHE_VERSION`); hard refresh recovers if stuck

### Audio

- [ ] First click/key unlocks audio without throwing
- [ ] Missing MP3s: procedural tones or silent path; no crash
- [ ] Muted settings: no unexpected playback

## Accessibility spot-check

- [ ] Skip link jumps to `#app-main`
- [ ] Primary interactive controls reachable by keyboard
- [ ] `aria-current` on active nav; status / toast announcements polite
- [ ] Reduced motion setting applied via `data-motion` on `<html>`

## Known deferred (post-v1)

- Optional richer install-prompt UX
- Further cases / language packs (case-002 shipped)
- Real BGM/SFX files (placeholders only today)
