@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   CarFlip - jednorazova instalace knihoven
echo ============================================
echo.
py -3.10 -m pip install --upgrade pip
py -3.10 -m pip install -r requirements.txt
echo.
echo Hotovo! Muzes zavrit toto okno.
pause
