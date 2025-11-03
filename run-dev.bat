@echo off
chcp 65001 > nul
cd /d "%~dp0liquiditaetstool-dashboard"
echo Starting Next.js Dev Server...
echo.
npm run dev

