@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   GIATROS LIVE - LOCAL PRINTER AGENT
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  .env δεν βρέθηκε! Τρέχω SETUP.bat...
    echo.
    call SETUP.bat
    if errorlevel 1 exit /b 1
)

REM Show current configuration
for /f "tokens=*" %%A in (.env) do (
    set "%%A"
)

echo 📡 Ρυθμίσεις:
echo   Cloud API: %CLOUD_API_URL%
echo   Εκτυπωτής: %LOCAL_PRINTER_HOST%:%LOCAL_PRINTER_PORT%
echo   Polling: Κάθε %POLL_INTERVAL_SECONDS% δευτερόλεπτα
echo   Status Page: http://localhost:%STATUS_PORT%
echo.
echo ========================================
echo.
echo Ο Agent ξεκίνησε. Για logs:
echo   Άνοιξε: http://localhost:%STATUS_PORT%
echo.
echo Πάτησε CTRL+C για να σταματήσεις.
echo.

npm run local-agent
