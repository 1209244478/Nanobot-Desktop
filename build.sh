#!/bin/bash
# Build script for nanobot on macOS/Linux
# Usage: ./build.sh

set -e

echo "========================================="
echo "  nanobot Build Script"
echo "========================================="
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 not found. Please install Python 3.11+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "[1/3] Building frontend..."
    cd web
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    echo "Building frontend..."
    npm run build || echo "Warning: Frontend build failed. Using existing static files."
    cd ..
else
    echo "Warning: Node.js not found. Skipping frontend build."
    echo "The existing static files will be used."
fi

# Check PyInstaller
echo
echo "[2/3] Installing PyInstaller..."
if ! pip show pyinstaller &> /dev/null; then
    pip install pyinstaller
fi

# Clean previous build
if [ -d "dist" ]; then
    echo "Cleaning previous build..."
    rm -rf dist
fi
if [ -d "build" ]; then
    rm -rf build
fi

echo
echo "[3/3] Building executable..."
python3 -m PyInstaller nanobot.spec --noconfirm

if [ $? -ne 0 ]; then
    echo
    echo "Error: Build failed!"
    exit 1
fi

echo
echo "========================================="
echo "  Build completed successfully!"
echo "========================================="
echo
echo "Executable: dist/nanobot"
echo
echo "To run: ./dist/nanobot gateway"
echo

# If on macOS, create DMG
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating DMG installer..."
    chmod +x create_dmg.sh
    ./create_dmg.sh
fi
