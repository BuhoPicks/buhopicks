# Cómo usar BH Analysis en otra computadora

Para que este programa funcione en otra computadora, no basta con copiar el acceso directo del escritorio. Debes seguir estos pasos:

## 1. Copiar la carpeta del proyecto
Debes copiar toda la carpeta que contiene el código. Actualmente se encuentra en:
`C:\Users\brand\.gemini\antigravity\scratch\sports-picks`

**Nota:** Al copiarla, puedes omitir la carpeta `node_modules` y `.next` para que pese menos (se pueden regenerar después).

## 2. Instalar Node.js
La nueva computadora debe tener **Node.js** instalado (versión 18 o superior).
Puedes descargarlo en: [nodejs.org](https://nodejs.org/)

## 3. Preparar el programa (Primera vez)
Una vez copiada la carpeta y con Node.js instalado, abre una terminal (PowerShell o CMD) dentro de esa carpeta y ejecuta:
```bash
npm install
```
Esto descargará las librerías necesarias.

## 4. Iniciar el programa
Puedes usar los archivos `.bat` que están dentro de la carpeta:
- `Lanzar_BH_Analysis.bat` para iniciar el servidor.
- `Iniciar BH Analysis.bat`

Luego podrás entrar en tu navegador a: `http://localhost:3333`

## 5. Accesos Directos
Si quieres tener los iconos en el escritorio de la nueva PC, haz clic derecho sobre los archivos `.bat` mencionados arriba y selecciona **Enviar a > Escritorio (crear acceso directo)**.

---
### ¿Qué pasa con los datos?
Los partidos y picks se guardan en el archivo `dev.db`. Si copias este archivo, llevarás contigo todo el historial y picks actuales.
