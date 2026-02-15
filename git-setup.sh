#!/usr/bin/env bash

echo "Ì¥í Updating .gitignore..."
cat <<EOF > .gitignore
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

# Environment files (never commit secrets)
.env
.env.*
.env.local
.env.development
.env.production
.env.test

# Logs
*.log
logs
*.pid

# OS
.DS_Store
Thumbs.db

# Editor directories
.vscode/*
!.vscode/tasks.json
!.vscode/settings.json

# Supabase
supabase/.temp
supabase/.branches

# Build artifacts
*.tsbuildinfo
EOF

echo "Ì≥Å Ensuring Git repo is initialized..."
git init

echo "Ì∑π Removing accidentally staged env files..."
git rm --cached .env.local 2>/dev/null

echo "Ì≥¶ Staging all project files..."
git add .

echo "Ì≥ù Creating commit..."
git commit -m "Update .gitignore and initial commit of CPQ SaaS scaffold"

echo "Ì¥ó Setting GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/trevbollers/cpq-saas.git

echo "Ìºê Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Ìæâ Git setup complete!"
