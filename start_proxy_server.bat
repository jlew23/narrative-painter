@echo off
echo Starting proxy server for Automatic1111...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in the PATH.
    echo Please install Python and try again.
    pause
    exit /b
)

REM Install required packages if not already installed
echo Installing required packages...
pip install flask flask-cors requests

REM Start the proxy server
echo Starting proxy server on port 5050...
python proxy_server.py

pause
