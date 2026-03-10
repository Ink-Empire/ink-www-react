#!/bin/sh
set -e

echo "Setting up Homebrew..."
# Xcode Cloud may not have Homebrew paths in PATH by default
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
else
  echo "ERROR: Homebrew not found"
  exit 1
fi

echo "Installing Node.js..."
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node 2>/dev/null || brew link --overwrite node 2>/dev/null || true

# Re-evaluate paths after install
eval "$(brew shellenv)"
export PATH="$(brew --prefix node)/bin:$PATH"
export NODE_BINARY=$(which node)
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo "Installing npm dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/reactnative"
npm install

echo "Setting up CocoaPods repo..."
pod repo remove trunk 2>/dev/null || true
pod repo add-cdn trunk https://cdn.cocoapods.org/

echo "Installing CocoaPods dependencies..."
cd ios
pod install

echo "Build setup complete."
