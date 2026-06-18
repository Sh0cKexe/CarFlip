@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   CarFlip BEZI - hlida flipy z Otomoto
echo   (toto okno nech otevrene)
echo   Zavrenim okna hlidani zastavis.
echo ============================================
echo.
py -3.10 main.py
echo.
echo Program skoncil.
pause
