@echo off
chcp 65001 > nul
cd /d "%~dp0liquiditaetstool-dashboard"
npm run dev

