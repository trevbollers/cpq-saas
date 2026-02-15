#!/usr/bin/env bash

###############################################
# CONFIG — SET YOUR GITHUB REPO URL HERE
###############################################
GIT_REPO="https://github.com/trevbollers/cpq-saas.git"

echo "🚀 Generating Git helper scripts using repo:"
echo "👉 $GIT_REPO"
echo ""

###############################################
# git-setup.sh
###############################################
echo "📝 Creating git-setup.sh..."

cat <<EOF > git-setup.sh
#!/usr/bin/env bash

# Automated Git Setup Script
# Initializes repo, updates .gitignore, commits, sets remote, pushes initial commit

echo "🔒 Updating .gitignore..."
cat <<EOGIT > .gitignore
# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Next.js
.next/
out/
dist/

# Environment files (NEVER commit secrets)
.env
.env.*
.env.local
.env.development
.env.production
.env.test

# Logs
*.log
logs/
*.pid

# OS files
.DS_Store
Thumbs.db

# VS Code
.vscode/*
!.vscode/tasks.json
!.vscode/settings.json

# Supabase
supabase/.temp
supabase/.branches

# Build artifacts
*.tsbuildinfo
EOGIT

echo "📁 Initializing Git repo..."
git init

echo "🧹 Ensuring env files are NOT tracked..."
git rm --cached .env.local 2>/dev/null

echo "📦 Staging all files..."
git add .

echo "📝 Creating initial commit..."
git commit -m \"Initial CPQ SaaS scaffold with updated .gitignore\"

echo "🔗 Setting GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin $GIT_REPO

echo "🌐 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "🎉 Git setup complete!"
EOF

chmod +x git-setup.sh

###############################################
# git-push.sh
###############################################
echo "📝 Creating git-push.sh..."

cat <<EOF > git-push.sh
#!/usr/bin/env bash

# Simple push script: stage, commit, push current branch

if [ -z "\$1" ]; then
  echo "❌ Please provide a commit message."
  echo "Usage: ./git-push.sh \"your commit message\""
  exit 1
fi

MSG="\$1"

echo "📦 Staging changes..."
git add .

echo "📝 Committing..."
git commit -m "\$MSG"

echo "🌐 Pushing to origin (current branch)..."
git push origin HEAD

echo "🎉 Push complete!"
EOF

chmod +x git-push.sh

###############################################
# git-branch.sh
###############################################
echo "📝 Creating git-branch.sh..."

cat <<EOF > git-branch.sh
#!/usr/bin/env bash

# Branch creation + push helper script

if [ -z "\$1" ]; then
  echo "❌ Please provide a branch name."
  echo "Usage: ./git-branch.sh feature/my-feature"
  exit 1
fi

BRANCH="\$1"

echo "🌿 Creating and switching to branch: \$BRANCH"
git checkout -b "\$BRANCH"

echo "🌐 Pushing branch to GitHub and setting upstream..."
git push -u origin "\$BRANCH"

echo "🎉 Branch \${BRANCH} created and tracking origin/\${BRANCH}!"
EOF

chmod +x git-branch.sh

###############################################
# git-sync.sh
###############################################
echo "📝 Creating git-sync.sh..."

cat <<EOF > git-sync.sh
#!/usr/bin/env bash

# Sync current branch with remote (origin)
# Safe pattern: fetch + pull --rebase

echo "🔄 Fetching latest from origin..."
git fetch origin

# Detect current branch name
CURRENT_BRANCH=\$(git rev-parse --abbrev-ref HEAD)

echo "📍 Current branch: \${CURRENT_BRANCH}"

if [ "\$CURRENT_BRANCH" = "HEAD" ]; then
  echo "❌ Detached HEAD state detected. Please checkout a branch first."
  exit 1
fi

echo "📥 Pulling latest changes with rebase from origin/\${CURRENT_BRANCH}..."
git pull --rebase origin "\$CURRENT_BRANCH"

echo "🎉 Sync complete for branch \${CURRENT_BRANCH}!"
EOF

chmod +x git-sync.sh

echo ""
echo "✅ All git scripts created:"
echo "   - git-setup.sh   (one-time init + first push)"
echo "   - git-push.sh    (stage + commit + push)"
echo "   - git-branch.sh  (create/switch/push new branch)"
echo "   - git-sync.sh    (fetch + rebase from origin)"
echo ""
echo "Use them from your repo root (cpq-saas/):"
echo "   ./git-setup.sh"
echo "   ./git-push.sh \"message\""
echo "   ./git-branch.sh feature/register-flow"
echo "   ./git-sync.sh"
echo ""
echo "🎉 Done!"