@echo off
REM Sub2API Test Runner Script (Windows)
REM
REM Usage:
REM   run-tests.bat           Run all tests
REM   run-tests.bat unit      Run only unit tests
REM   run-tests.bat e2e       Run only E2E tests
REM   run-tests.bat ci        Run tests in CI mode

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo [INFO] Running tests...

if "%1"=="" goto all
if "%1"=="unit" goto unit
if "%1"=="integration" goto integration
if "%1"=="e2e" goto e2e
if "%1"=="ci" goto ci
goto usage

:unit
echo [INFO] Running backend unit tests...
cd /d "%PROJECT_ROOT%\backend"
go test -short ./...
echo [INFO] Unit tests completed!
goto end

:integration
echo [INFO] Running frontend integration tests...
cd /d "%PROJECT_ROOT%\frontend"
call pnpm test -- --run
echo [INFO] Integration tests completed!
goto end

:e2e
echo [INFO] Running E2E tests...
cd /d "%SCRIPT_DIR%"
call npx playwright test
echo [INFO] E2E tests completed!
goto end

:ci
echo [INFO] Running CI tests (without E2E)...
call :unit
call :integration
echo [INFO] CI tests completed!
goto end

:all
echo [INFO] Running all tests...
call :unit
call :integration
call :e2e
echo [INFO] All tests completed!
goto end

:usage
echo Usage: %~nx0 {unit^|integration^|e2e^|ci^|all}
exit /b 1

:end
endlocal
