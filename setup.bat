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

echo Setup complete!
echo To activate the virtual environment manually later, run:
echo venv\Scripts\activate
pause
