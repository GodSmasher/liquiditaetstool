@echo off
chcp 65001 > nul
cd /d "%~dp0liquiditaetstool-dashboard"
echo Fixing .env file name...
if exist ".env local" (
    ren ".env local" ".env.local"
    echo Success! Renamed .env local to .env.local
) else (
    echo .env.local already exists or .env local not found
)
echo.
echo Starting dev server...
npm run dev

