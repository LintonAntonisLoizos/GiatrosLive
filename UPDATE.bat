@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GIATROS LIVE - UPDATE
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Δεν είναι git repository!
    echo Τρέξε πρώτα το SETUP.bat
    pause
    exit /b 1
)

echo ✅ Git repository βρέθηκε

REM Check for changes
git status --porcelain > temp_status.txt
set /p CHANGES=<temp_status.txt
del temp_status.txt

if "%CHANGES%"=="" (
    echo ℹ️  Δεν υπάρχουν αλλαγές για commit
    echo.
    echo Για να δεις τι έχει αλλάξει:
    echo   git status
    echo.
    pause
    exit /b 0
)

echo 📝 Βρέθηκαν αλλαγές. Θα κάνω commit...

REM Add all changes
git add .

REM Get commit message
set /p COMMIT_MSG="Γράψε μήνυμα για τις αλλαγές (π.χ. 'Fixed printer settings'): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update

REM Commit
git commit -m "%COMMIT_MSG%"

REM Push
echo.
echo 📤 Ανέβασμα στο GitHub...
git push origin main

if errorlevel 1 (
    echo ❌ Σφάλμα στο push!
    echo Ελέγχει τα credentials σου στο GitHub
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ UPDATE ΟΛΟΚΛΗΡΩΘΗΚΕ
echo ========================================
echo.
echo Το Render θα κάνει αυτόματα deploy σε 2-3 λεπτά.
echo.
echo Για να πάρουν οι διαχειριστές τις αλλαγές:
echo   Στο κατάστημα: git pull
echo.
pause
