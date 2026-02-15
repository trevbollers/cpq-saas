#!/usr/bin/env bash

# Simple push script: stage, commit, push current branch

if [ -z "$1" ]; then
  echo "❌ Please provide a commit message."
  echo "Usage: ./git-push.sh \"your commit message\""
  exit 1
fi

MSG="$1"

echo "📦 Staging changes..."
git add .

echo "📝 Committing..."
git commit -m "$MSG"

echo "🌐 Pushing to origin (current branch)..."
git push origin HEAD

echo "🎉 Push complete!"
