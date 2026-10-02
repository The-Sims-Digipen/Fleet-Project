@echo off
setlocal

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js 24 LTS, then run this script again.
  exit /b 1
)

node "%~dp0scripts\run.mjs"
exit /b %errorlevel%
