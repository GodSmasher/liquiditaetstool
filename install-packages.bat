@echo off
chcp 65001 > nul
cd /d "%~dp0liquiditaetstool-dashboard"
echo Installing Supabase packages...
npm install @supabase/ssr
echo Done!
pause

