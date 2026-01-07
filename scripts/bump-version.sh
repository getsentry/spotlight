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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Bumping version from $OLD_VERSION to $NEW_VERSION"

# Update version in packages/spotlight/package.json
SPOTLIGHT_PKG="$REPO_ROOT/packages/spotlight/package.json"
if [ -f "$SPOTLIGHT_PKG" ]; then
  # Use node to update the version to handle JSON properly
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$SPOTLIGHT_PKG', 'utf8'));
    pkg.version = '$NEW_VERSION';
    fs.writeFileSync('$SPOTLIGHT_PKG', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "Updated $SPOTLIGHT_PKG to version $NEW_VERSION"
else
  echo "Error: $SPOTLIGHT_PKG not found"
  exit 1
fi

echo "Version bump complete"

