#!/usr/bin/env bash

# Sync current branch with remote (origin)
# Safe pattern: fetch + pull --rebase

echo "🔄 Fetching latest from origin..."
git fetch origin

# Detect current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "📍 Current branch: ${CURRENT_BRANCH}"

if [ "$CURRENT_BRANCH" = "HEAD" ]; then
  echo "❌ Detached HEAD state detected. Please checkout a branch first."
  exit 1
fi

echo "📥 Pulling latest changes with rebase from origin/${CURRENT_BRANCH}..."
git pull --rebase origin "$CURRENT_BRANCH"

echo "🎉 Sync complete for branch ${CURRENT_BRANCH}!"
