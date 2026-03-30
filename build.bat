@echo off
REM Build script for nanobot on Windows
REM Usage: build.bat

echo =========================================
echo   nanobot Build Script for Windows
echo =========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.11+
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo Warning: Node.js not found. Skipping frontend build.
    echo The existing static files will be used.
    goto :build_backend
)

REM Build frontend
echo.
echo [1/3] Building frontend...
cd web
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
echo Building frontend...
call npm run build
if errorlevel 1 (
    echo Warning: Frontend build failed. Using existing static files.
)
cd ..

:build_backend
echo.
echo [2/3] Installing PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    pip install pyinstaller
)

REM Clean previous build
if exist "dist" (
    echo Cleaning previous build...
    rmdir /s /q dist
)
if exist "build" (
    rmdir /s /q build
)

echo.
echo [3/3] Building executable...
python -m PyInstaller nanobot.spec --noconfirm

if errorlevel 1 (
    echo.
    echo Error: Build failed!
    pause
    exit /b 1
)

echo.
echo =========================================
echo   Build completed successfully!
echo =========================================
echo.
echo Executable: dist\nanobot.exe
echo.
echo To run: dist\nanobot.exe gateway
echo.

REM Check if Inno Setup is available
where iscc >nul 2>&1
if not errorlevel 1 (
    echo.
    echo Creating Windows installer...
    iscc setup.iss
    echo.
    echo Installer: installer\nanobot-setup-*.exe
)

pause
