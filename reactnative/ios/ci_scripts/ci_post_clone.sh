#!/bin/sh
set -e

echo "Installing Node.js..."
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
brew install node 2>/dev/null || brew link --overwrite node 2>/dev/null || true
export NODE_BINARY=$(which node)
echo "Node version: $(node --version)"

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
