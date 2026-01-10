#!/bin/bash
# bump-version.sh - Updates package versions for Craft releases
# Called by Craft during `craft prepare` with OLD_VERSION and NEW_VERSION as arguments
set -euo pipefail

OLD_VERSION="${1:-}"
NEW_VERSION="${2:-}"

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 OLD_VERSION NEW_VERSION"
  exit 1
fi

echo "Bumping version from $OLD_VERSION to $NEW_VERSION"

# Update version in packages/spotlight using pnpm
# --no-git-tag-version: Craft handles git tags
cd packages/spotlight
pnpm version "$NEW_VERSION" --no-git-tag-version

echo "Version bump complete"
