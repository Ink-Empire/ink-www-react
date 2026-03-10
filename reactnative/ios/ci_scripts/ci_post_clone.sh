#!/bin/sh
set -e

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

export NODE_BINARY=$(which node)

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
