@echo off
rem Starts the development server and opens the app in the browser.
rem It calls Vite through node, because PowerShell blocks npm on PCs that only allow signed scripts.
cd /d "%~dp0"
node node_modules\vite\bin\vite.js --open
