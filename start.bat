@echo off
SETLOCAL

IF NOT EXIST "node_modules" (
    echo node_modules not found. Running npm install...
    npm install
)

:: Start the application
echo Starting the application...
npm start
pause