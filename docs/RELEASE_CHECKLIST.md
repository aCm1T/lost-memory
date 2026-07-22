# Release Checklist — Lost Memory v1

Ship target: static site on GitHub Pages  
URL: https://acm1t.github.io/lost-memory/

## 1. Code readiness

- [x] Phases 1–9 complete (design → PWA/deploy)
- [x] `LICENSE` (MIT)
- [x] `CREDITS.md` + in-game credits view
- [x] README describes play URL, setup, commands, privacy, docs
- [x] `docs/DEPLOYMENT.md` and `docs/QA_CHECKLIST.md` present
- [ ] All automated QA rows in `docs/QA_CHECKLIST.md` still green on release commit
- [ ] Manual smoke items completed (or consciously deferred with notes)

## 2. Version & metadata

- [x] `package.json` `version` set for release (`1.0.0`)
- [x] `package.json` `license`: `MIT`
- [ ] Optional: set GitHub repo description / homepage to the Pages URL

## 3. Merge & Pages

1. Merge the release PR into `main`
2. Confirm Actions workflow **Deploy GitHub Pages** succeeds
3. Repo **Settings → Pages → Source** = **GitHub Actions** (one-time)
4. Open https://acm1t.github.io/lost-memory/ and spot-check home + one investigation route

## 4. Tag (optional but recommended)

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Lost Memory v1.0.0 — Case 001"
git push origin v1.0.0
```

## 5. Post-release

- [ ] Announce / pin Pages URL in README (already present)
- [ ] Watch first-day Actions + browser reports (SW update issues)
- [ ] File post-v1 items under GAME_DESIGN roadmap (extra cases, install prompt polish, real audio)

## Blockers (do not ship if true)

- Lint / test / validate / build failing on `main`
- Pages deploy failing or 404 on base path
- Corrupt-save recovery broken (players cannot reset)
- Deduction cannot reach any ending with valid case data
