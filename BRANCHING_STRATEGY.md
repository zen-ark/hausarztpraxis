# 🌿 Branching Strategy

This document outlines our Git branching model for managing live and development environments.

## 📋 Branch Structure

### Main Branches

- **`main`** - 🚀 **LIVE/PRODUCTION** branch
  - Contains stable, production-ready code
  - Protected branch (requires pull request)
  - Auto-deploys to live site
  - Only updated via pull requests from `develop`

- **`develop`** - 🔧 **DEVELOPMENT** branch  
  - Contains latest development features
  - Auto-deploys to development site
  - Integration branch for new features
  - Merged to `main` when ready for production

## 🔄 Workflow

### Development Process

1. **Start new feature:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Work on feature:**
   - Make commits to your feature branch
   - Push regularly: `git push origin feature/your-feature-name`

3. **Merge to develop:**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/your-feature-name
   git push origin develop
   ```

4. **Deploy to production:**
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

### Hotfixes (Emergency fixes to production)

1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/issue-description
   ```

2. **Fix and merge:**
   ```bash
   # After fixing...
   git checkout main
   git merge hotfix/issue-description
   git push origin main
   
   # Also merge back to develop
   git checkout develop
   git merge hotfix/issue-description
   git push origin develop
   ```

## 🚀 Deployment

### Automatic Deployments

- **`main` branch** → Live/Production site
- **`develop` branch** → Development site

### Manual Deployments

You can trigger deployments manually via GitHub Actions:
1. Go to Actions tab in GitHub
2. Select the deployment workflow
3. Click "Run workflow"

## 🛡️ Branch Protection

### Main Branch Protection
- Requires pull request reviews
- Requires status checks to pass
- Requires branches to be up to date
- Restricts pushes to main (only via PR)

### Development Branch
- Open for direct pushes
- Auto-deploys on push
- Used for integration testing

## 📝 Best Practices

1. **Always work in feature branches** - never directly on `main` or `develop`
2. **Keep branches up to date** - regularly pull latest changes
3. **Write descriptive commit messages**
4. **Test thoroughly** before merging to `develop`
5. **Use pull requests** for code review and discussion
6. **Delete feature branches** after merging

## 🔧 Quick Commands

```bash
# Switch to development
git checkout develop

# Switch to production
git checkout main

# Create new feature
git checkout -b feature/new-feature

# Update branches
git pull origin develop
git pull origin main

# See all branches
git branch -a
```

## 🌐 Environment URLs

- **Live Site**: [Your production URL]
- **Development Site**: [Your development URL]

---

*This branching strategy ensures safe, organized development with clear separation between live and development environments.*
