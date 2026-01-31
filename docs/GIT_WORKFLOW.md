# Git Workflow Guide for FileForge Team

## Branch Structure

```
main (production-ready code)
  │
  └── develop (integration branch)
        │
        ├── feature/auth-system
        ├── feature/file-upload
        └── feature/conversion-api
```

| Branch | Purpose | Who Merges |
|--------|---------|------------|
| `main` | Stable, deployable code | Team lead after testing |
| `develop` | Integration of features | Anyone via PR |
| `feature/*` | Individual features | Each developer |

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/saloni080613/Xvert.git
cd Xvert
```

### 2. Switch to Develop Branch
```bash
git checkout develop
git pull origin develop
```

### 3. Create Your Feature Branch
```bash
git checkout -b feature/your-feature-name
```

---

## Daily Workflow

### Working on Your Feature
```bash
# Make changes, then:
git add .
git commit -m "Add: description of what you did"
git push origin feature/your-feature-name
```

### Commit Message Format
```
Add: new feature description
Fix: bug fix description
Update: modification description
Remove: deleted feature description
```

### Keep Your Branch Updated
```bash
# Get latest changes from develop
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git merge develop
```

---

## Creating a Pull Request (PR)

1. Push your branch: `git push origin feature/your-feature-name`
2. Go to GitHub → **Pull Requests** → **New Pull Request**
3. Set: `feature/your-branch` → `develop`
4. Add description of changes
5. Request review from teammates
6. After approval, merge the PR

---

## Branch Naming Convention

| Type | Format | Example |
|------|--------|---------|
| New Feature | `feature/feature-name` | `feature/auth-login` |
| Bug Fix | `bugfix/issue-name` | `bugfix/upload-crash` |
| Hotfix | `hotfix/issue-name` | `hotfix/security-patch` |

---

## Important Rules

1. **Never push directly to `main` or `develop`** - always use PRs
2. **Pull from develop before starting new work**
3. **Write clear commit messages**
4. **Test your code before creating a PR**
5. **Review your teammates' PRs**

---

## Resolving Merge Conflicts

If you get conflicts when merging:
```bash
# Git will show conflicted files
# Open each file and look for:
<<<<<<< HEAD
your changes
=======
their changes
>>>>>>> develop

# Keep the code you want, remove the markers
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push
```

---

## Quick Reference Commands

```bash
# See current branch
git branch

# See all branches
git branch -a

# Switch branch
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# Check status
git status

# View commit history
git log --oneline -10
```
