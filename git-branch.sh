#!/usr/bin/env bash

# Branch creation + push helper script

if [ -z "$1" ]; then
  echo "❌ Please provide a branch name."
  echo "Usage: ./git-branch.sh feature/my-feature"
  exit 1
fi

BRANCH="$1"

echo "🌿 Creating and switching to branch: $BRANCH"
git checkout -b "$BRANCH"

echo "🌐 Pushing branch to GitHub and setting upstream..."
git push -u origin "$BRANCH"

echo "🎉 Branch ${BRANCH} created and tracking origin/${BRANCH}!"
