# Local Development & Staging Guide

## Branches

| Branch    | Purpose                        | Railway deployment |
|-----------|--------------------------------|--------------------|
| `main`    | Live production app            | ✅ Auto-deploys    |
| `staging` | Test new features safely       | ❌ Never deploys   |

---

## Running locally

```bash
cd grocery-app
npm run dev
```

Opens:
- Frontend → http://localhost:3006
- Backend  → http://localhost:3007

No database needed — the app falls back to localStorage automatically.
To test with the real DB, paste your Railway DATABASE_URL into `.env.local`.

---

## Workflow for new features

```bash
# 1. Switch to staging branch
git checkout staging

# 2. Make your changes and test locally (npm run dev)

# 3. Commit to staging — does NOT affect live app
git add -A
git commit -m "feat: my new feature"
git push origin staging

# 4. Happy with it? Merge to main → Railway auto-deploys
git checkout main
git merge staging
git push origin main

# 5. Go back to staging for next feature
git checkout staging
```

---

## Keeping staging up to date with main

```bash
git checkout staging
git merge main
```

---

## Quick tips

- `main` push → Railway deploys in ~2 minutes
- `staging` push → nothing happens on Railway, safe to experiment
- `.env.local` is gitignored — your secrets never go to GitHub
