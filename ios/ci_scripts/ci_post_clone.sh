#!/bin/sh
set -e

echo ">>> Installing Node.js 22 LTS via Homebrew"
brew install node@22
export PATH="/usr/local/opt/node@22/bin:$PATH"

echo ">>> Installing Node dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

echo ">>> Installing CocoaPods dependencies"
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
