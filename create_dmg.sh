#!/bin/bash
# Create DMG installer for nanobot on macOS
# Usage: ./create_dmg.sh

set -e

APP_NAME="nanobot"
VERSION="0.1.4"
AUTHOR="HKUDS"

echo "Creating DMG for $APP_NAME v$VERSION..."

# Check if executable exists
if [ ! -f "dist/$APP_NAME" ]; then
    echo "Error: dist/$APP_NAME not found. Run 'pyinstaller nanobot.spec --clean' first."
    exit 1
fi

# Create app bundle structure
APP_BUNDLE="dist/$APP_NAME.app"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# Copy executable
cp "dist/$APP_NAME" "$APP_BUNDLE/Contents/MacOS/"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

# Copy internal files if exists
if [ -d "dist/_internal" ]; then
    cp -R "dist/_internal" "$APP_BUNDLE/Contents/MacOS/"
fi

# Create Info.plist
cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>com.$AUTHOR.$APP_NAME</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>nanobot</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024 $AUTHOR. All rights reserved.</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

# Create PkgInfo
echo -n "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

# Create DMG
DMG_NAME="$APP_NAME-$VERSION-macos.dmg"
DMG_TEMP="$APP_NAME-temp.dmg"
VOLUME_NAME="$APP_NAME"

echo "Creating DMG disk image..."

# Create temporary DMG
hdiutil create -volname "$VOLUME_NAME" -srcfolder "$APP_BUNDLE" -ov -format UDRW "dist/$DMG_TEMP"

# Convert to compressed DMG
hdiutil convert "dist/$DMG_TEMP" -format UDZO -imagekey zlib-level=9 -o "dist/$DMG_NAME"

# Remove temporary DMG
rm "dist/$DMG_TEMP"

echo ""
echo "========================================="
echo "DMG created successfully!"
echo "Location: dist/$DMG_NAME"
echo "========================================="
echo ""
echo "To install: Open the DMG and drag $APP_NAME.app to Applications folder"
