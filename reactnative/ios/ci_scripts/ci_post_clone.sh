#!/bin/sh
set -e

echo "Installing CocoaPods dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/inked-in-www/reactnative/ios"
pod install
echo "CocoaPods installation complete."
