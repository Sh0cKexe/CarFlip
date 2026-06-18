@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   CarFlip - NAJDI TED
echo   Projede aktualni nabidku a posle ti
echo   ziskova auta na Telegram (jen tobe).
echo ============================================
echo.
py -3.10 najdi_ted.py
echo.
echo Hotovo. Muzes zavrit okno.
pause
