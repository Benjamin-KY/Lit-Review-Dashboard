@echo off
echo ========================================
echo Literature Review Showcase
echo Using YOUR Actual Research Data!
echo ========================================
echo.

REM Verify data files
echo Verifying your research data...
node verify-data.cjs
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ========================================
echo Starting your research showcase...
echo Open browser to: http://localhost:5173
echo ========================================
npm run dev

pause