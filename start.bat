@echo off


:: Run Webpack in production mode
start cmd /k "npx webpack --mode production"
:: Start the Flask server
start cmd /k "python scripts/server.py"
pause
