@echo off
setlocal
cd /d "%~dp0"
title BH Analysis - General
echo ===========================================
echo    BH Analysis - SPORTS ANALYTICS
echo ===========================================
echo.

:: Check if port 3333 is already active
netstat -ano | findstr :3333 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] El servidor ya esta encendido.
    echo [INFO] Abriendo Panel Principal en http://localhost:3333...
    start "" "http://localhost:3333"
    timeout /t 5
    exit
) else (
    echo [INFO] Iniciando servidor y Panel Principal...
    start "" "http://localhost:3333"
    call npm.cmd run dev -- -p 3333
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema al iniciar la aplicacion.
    echo [HINT] Verifica que Node.js este instalado.
    pause
)
