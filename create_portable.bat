@echo off
REM Create portable distribution package for nanobot
REM Usage: create_portable.bat

echo =========================================
echo   nanobot Portable Package Creator
echo =========================================
echo.

set DIST_DIR=dist\nanobot-portable
set VERSION=0.1.4

REM Clean previous build
if exist "dist\nanobot-portable" rmdir /s /q "dist\nanobot-portable"
if exist "dist\nanobot-portable-%VERSION%.zip" del "dist\nanobot-portable-%VERSION%.zip"

REM Create directory structure
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\web"
mkdir "%DIST_DIR%\config"

REM Copy Python source
echo Copying Python source...
xcopy /E /I /Q nanobot "%DIST_DIR%\nanobot"

REM Copy web frontend
echo Copying web frontend...
xcopy /E /I /Q web\src "%DIST_DIR%\web\src"
copy web\package.json "%DIST_DIR%\web\"
copy web\vite.config.ts "%DIST_DIR%\web\"
copy web\tsconfig.json "%DIST_DIR%\web\"
copy web\tsconfig.node.json "%DIST_DIR%\web\"
copy web\index.html "%DIST_DIR%\web\"
copy web\tailwind.config.js "%DIST_DIR%\web\" 2>nul
copy web\postcss.config.js "%DIST_DIR%\web\" 2>nul

REM Copy config files
copy config.json "%DIST_DIR%\config\" 2>nul
copy config.schema.json "%DIST_DIR%\" 2>nul

REM Copy documentation
copy README.md "%DIST_DIR%\"
copy LICENSE "%DIST_DIR%\" 2>nul

REM Create requirements.txt
echo Creating requirements.txt...
pip freeze > "%DIST_DIR%\requirements.txt"

REM Create start scripts
echo Creating start scripts...

REM Windows start script
(
echo @echo off
echo echo Starting nanobot...
echo python -m nanobot gateway
echo pause
) > "%DIST_DIR%\start.bat"

REM Windows install script
(
echo @echo off
echo echo Installing nanobot dependencies...
echo pip install -r requirements.txt
echo echo.
echo echo Building frontend...
echo cd web
echo call npm install
echo call npm run build
echo cd ..
echo echo.
echo echo Installation complete!
echo echo Run start.bat to launch nanobot.
echo pause
) > "%DIST_DIR%\install.bat"

REM Linux/Mac start script
(
echo #!/bin/bash
echo echo "Starting nanobot..."
echo python3 -m nanobot gateway
) > "%DIST_DIR%\start.sh"

REM Create ZIP archive
echo.
echo Creating ZIP archive...
powershell -Command "Compress-Archive -Path '%DIST_DIR%' -DestinationPath 'dist\nanobot-portable-%VERSION%.zip'"

echo.
echo =========================================
echo   Portable package created!
echo =========================================
echo.
echo Location: dist\nanobot-portable-%VERSION%.zip
echo.
echo To use:
echo   1. Extract the ZIP file
echo   2. Run install.bat to install dependencies
echo   3. Run start.bat to launch nanobot
echo.

pause
