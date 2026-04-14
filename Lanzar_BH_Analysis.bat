@echo off
setlocal enabledelayedexpansion
title BH Analysis - Lanzador Maestro
cd /d "%~dp0"

echo ===========================================
echo    BH Analysis - SPORTS ANALYTICS
echo ===========================================
echo [SISTEMA] Verificando instalacion...

:: Check Node
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se encontro Node.js!
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit
)

:: Check port 3333
netstat -ano | findstr :3333 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] El motor ya esta funcionando.
    echo [ACCION] Abriendo la pagina en tu navegador...
    start "" "http://localhost:3333"
    timeout /t 5
    exit
)

echo [INFO] Iniciando el motor de analisis...
echo [INFO] El servidor tardara unos 10-20 segundos en estar listo.
echo [INFO] NO CIERRES ESTA VENTANA mientras uses la aplicacion.
echo.
echo [ACCION] Abriendo navegador en http://localhost:3333 ...
start "" "http://localhost:3333"

:: Run server
call npm.cmd run dev -- -p 3333

if %errorlevel% neq 0 (
    echo.
    echo ===========================================
    echo [ERROR CRITICO] La aplicacion no pudo arrancar.
    echo Posibles causas:
    echo 1. Los archivos del proyecto estan danados.
    echo 2. El puerto 3333 esta bloqueado por un antivirus.
    echo 3. Falta ejecutar 'npm install'.
    echo ===========================================
    pause
)
