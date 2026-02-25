#!/bin/sh
set -e

echo ">>> Installing Node.js via Homebrew"
brew install node

echo ">>> Installing Node dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo ">>> Installing CocoaPods dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
