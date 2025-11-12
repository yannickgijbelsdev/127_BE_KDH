@echo off
REM Autosoft Overlay Starter Script
REM Dit script start de Autosoft desktop overlay

echo Starting Autosoft Desktop Overlay...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is niet geinstalleerd!
    echo Download Python van https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Install dependencies if needed
echo Checking dependencies...
pip install -q -r autosoft_overlay_requirements.txt

REM Start the overlay
echo Starting overlay...
pythonw autosoft_overlay.py

REM If pythonw is not available, use python
if errorlevel 1 (
    python autosoft_overlay.py
)
