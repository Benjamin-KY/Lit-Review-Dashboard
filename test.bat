@echo off
echo Running Literature Review Showcase Tests...
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

echo Running TypeScript compilation check...
npx tsc --noEmit
if errorlevel 1 (
    echo TypeScript compilation failed
    echo.
)

echo Running ESLint...
npm run lint
if errorlevel 1 (
    echo Linting failed
    echo.
)

echo Running build test...
npm run build
if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)

echo.
echo All tests completed!
echo Build artifacts are in the 'dist' directory
echo.

pause