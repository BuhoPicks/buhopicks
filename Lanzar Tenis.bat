@echo off
setlocal
cd /d "%~dp0"
title BH Analysis - Server
echo ===========================================
echo    BH Analysis - TENIS PRO
echo ===========================================
echo.

:: Check if port 3333 is already active
netstat -ano | findstr :3333 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] El servidor ya esta encendido.
    echo [INFO] Abriendo navegador en http://localhost:3333/tennis...
    start "" "http://localhost:3333/tennis"
    timeout /t 5
    exit
) else (
    echo [INFO] Iniciando servidor en el puerto 3333...
    echo [INFO] El navegador se abrira en unos segundos...
    echo.
    start "" "http://localhost:3333/tennis"
    
    :: Use call npm.cmd to bypass PowerShell policy issues in some Windows setups
    call npm.cmd run dev -- -p 3333
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema al iniciar la aplicacion.
    echo [HINT] Asegurate de que Node.js este instalado y de que no haya otro programa usando el puerto 3333.
    pause
)
