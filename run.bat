@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\run.ps1"
set "run_exit=%errorlevel%"
if not "%run_exit%"=="0" (
  echo.
  echo Fleet Project could not start. See the error above.
  pause
)
exit /b %run_exit%
