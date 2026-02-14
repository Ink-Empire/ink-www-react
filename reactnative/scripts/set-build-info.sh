#!/bin/bash
# Generates buildInfo.ts with git SHA and build timestamp.
# Run before archiving or add as an Xcode Build Phase.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="$SCRIPT_DIR/../app/buildInfo.ts"

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$OUTPUT" <<EOF
export const BUILD_GIT_SHA = '${GIT_SHA}';
export const BUILD_GIT_BRANCH = '${GIT_BRANCH}';
export const BUILD_DATE = '${BUILD_DATE}';
EOF

echo "Build info written to $OUTPUT"
echo "  SHA: $GIT_SHA ($GIT_BRANCH)"
echo "  Date: $BUILD_DATE"
