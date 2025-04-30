@echo off
echo Starting Automatic1111 Stable Diffusion Web UI with CORS enabled...
echo.
echo This script assumes you have Automatic1111 installed in the default location.
echo If not, please modify the path in this script.
echo.

REM Change this path to your Automatic1111 installation directory
set AUTOMATIC1111_DIR=C:\path\to\stable-diffusion-webui

REM Check if the directory exists
if not exist "%AUTOMATIC1111_DIR%" (
    echo Error: Automatic1111 directory not found at %AUTOMATIC1111_DIR%
    echo Please edit this script and set the correct path.
    pause
    exit /b
)

REM Change to the Automatic1111 directory
cd /d "%AUTOMATIC1111_DIR%"

REM Start Automatic1111 with CORS enabled
echo Starting Automatic1111 with CORS enabled...
call webui.bat --api --cors-allow-origins=http://localhost:8080,http://localhost:8081,http://localhost:3000

pause
