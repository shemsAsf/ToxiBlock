@echo off

:: Check if the 'venv' directory exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

:: Activate the virtual environment
echo Activating the virtual environment...
call venv\Scripts\activate

:: Check if requirements.txt 
echo Installing dependencies from requirements.txt...
pip install -r requirements.txt

:: Check if node_modules directory exists
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
) else (
    echo Node.js dependencies are already installed.
)

:: Install TypeScript locally
if not exist "node_modules\typescript" (
    echo Installing TypeScript locally...
    npm install typescript --save-dev
) else (
    echo TypeScript is already installed locally.
)

echo Setup complete!
echo To activate the virtual environment manually later, run:
echo venv\Scripts\activate
pause
