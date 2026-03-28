#!/bin/sh
set -e

# Ensure Homebrew is on PATH
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

echo "Installing Node.js..."
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node 2>/dev/null || brew link --overwrite node 2>/dev/null || true

eval "$(brew shellenv)"
export NODE_BINARY=$(which node)
echo "Node: $(node --version), npm: $(npm --version)"

echo "Installing npm dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/reactnative"
npm install

echo "Installing CocoaPods dependencies..."
cd ios
pod install

# Fix fmt consteval build error with newer Xcode/Clang versions
# Apple Clang claims consteval support but has a buggy implementation.
# Patch fmt headers to force FMT_USE_CONSTEVAL=0 everywhere.
FMT_BASE="Pods/fmt/include/fmt/base.h"
if [ -f "$FMT_BASE" ]; then
  echo "Patching fmt base.h to disable consteval..."
  sed -i '' 's/define FMT_USE_CONSTEVAL 1/define FMT_USE_CONSTEVAL 0/g' "$FMT_BASE"
fi

echo "Build setup complete."
