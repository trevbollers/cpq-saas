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
git remote add origin https://github.com/trevbollers/cpq-saas.git

echo "🌐 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "🎉 Git setup complete!"
