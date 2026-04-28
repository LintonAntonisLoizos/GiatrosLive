@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GIATROS LIVE - AUTO UPDATE & START
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git δεν είναι εγκατεστημένο!
    echo Κάνε download από: https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

REM Check if it's a git repository
if not exist ".git" (
    echo ❌ Δεν είναι git repository!
    echo Τρέξε πρώτα το SETUP.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Git βρέθηκε

REM Check for updates
echo.
echo 🔍 Έλεγχος για updates...
git fetch origin main

REM Check if there are updates
for /f %%i in ('git rev-parse HEAD') do set LOCAL=%%i
for /f %%i in ('git rev-parse origin/main') do set REMOTE=%%i

if "%LOCAL%"=="%REMOTE%" (
    echo ✅ Είσαι ήδη up-to-date
) else (
    echo 📥 Βρέθηκαν updates! Κάνω update...
    echo.

    REM Backup current .env if exists
    if exist ".env" (
        copy .env .env.backup >nul
        echo 💾 Backup του .env σε .env.backup
    )

    REM Pull updates
    git pull origin main

    if errorlevel 1 (
        echo ❌ Σφάλμα στο update!
        echo Επαναφορά backup...
        if exist ".env.backup" (
            copy .env.backup .env >nul
            echo ✅ .env επαναφέρθηκε
        )
        pause
        exit /b 1
    )

    echo ✅ Update ολοκληρώθηκε!

    REM Check if dependencies need update
    if exist "package-lock.json" (
        echo 🔧 Έλεγχος dependencies...
        npm install
        if errorlevel 1 (
            echo ⚠️  Προσοχή: npm install απέτυχε, αλλά συνεχίζω...
        ) else (
            echo ✅ Dependencies ενημερώθηκαν
        )
    )
)

echo.
echo ========================================
echo   ΞΕΚΙΝΗΣΗ AGENT
echo ========================================
echo.

REM Now start the agent
call START-AGENT.bat