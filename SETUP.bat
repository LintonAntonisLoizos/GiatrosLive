@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GIATROS LIVE - SETUP
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js δεν είναι εγκατεστημένο!
    echo Κάνε download από: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js βρέθηκε

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git δεν είναι εγκατεστημένο!
    echo Κάνε download από: https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

echo ✅ Git βρέθηκε

REM Install dependencies
echo.
echo Εγκατάσταση dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Σφάλμα κατά την εγκατάσταση!
    pause
    exit /b 1
)

echo ✅ Dependencies εγκατεστημένα

REM Initialize git if not already
if not exist ".git" (
    echo.
    echo Αρχικοποίηση Git repository...
    git init
    git add .
    git commit -m "Initial commit"
    echo ✅ Git repository δημιουργήθηκε
) else (
    echo ✅ Git repository υπάρχει ήδη
)

REM Create .env file if not exists
if not exist ".env" (
    echo.
    echo Δημιουργία .env αρχείου...
    (
        echo CLOUD_API_URL=https://giatroslive.onrender.com
        echo LOCAL_PRINTER_HOST=192.168.88.4
        echo LOCAL_PRINTER_PORT=9100
        echo POLL_INTERVAL_SECONDS=10
        echo STATUS_PORT=4000
    ) > .env
    echo ✅ .env δημιουργήθηκε
) else (
    echo ✅ .env υπάρχει ήδη
)

echo.
echo ========================================
echo   ✅ SETUP ΟΛΟΚΛΗΡΩΘΗΚΕ
echo ========================================
echo.
echo Τώρα:
echo 1. Δημιούργησε repository στο GitHub
echo 2. Κάνε: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
echo 3. Κάνε: git push -u origin main
echo 4. Σύνδεσε το Render με το GitHub repo
echo.
pause

echo.
echo ========================================
echo   ✅ SETUP ΟΛΟΚΛΗΡΩΘΗΚΕ
echo ========================================
echo.
echo Για να ξεκινήσεις τον agent:
echo   Διπλοκλικ: START-AGENT.bat
echo.
echo ή από Command Prompt:
echo   npm run local-agent
echo.
pause
