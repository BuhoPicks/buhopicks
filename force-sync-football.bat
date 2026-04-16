@echo off
cd /d "%~dp0"
echo [INFO] Forcing Football Sync...
call npx.cmd tsx trigger-football-sync.ts
echo [INFO] Sync Complete.
pause
