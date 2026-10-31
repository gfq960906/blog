@echo off
rem One-click update: build -> commit -> push
rem Usage: double-click or run  deploy.cmd
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
if errorlevel 1 pause
