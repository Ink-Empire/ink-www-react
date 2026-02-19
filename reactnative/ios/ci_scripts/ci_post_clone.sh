#!/bin/sh
set -e

echo "Installing Node.js..."
brew install node
export NODE_BINARY=$(which node)

echo "Installing npm dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/reactnative"
npm install

echo "Installing CocoaPods dependencies..."
cd ios
pod install

echo "Build setup complete."
