@echo off
echo.
echo ==========================================
echo   GETTING YOUR LOCAL IP ADDRESS
echo ==========================================
echo.
echo Your IP addresses:
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ==========================================
echo Copy the IPv4 Address (e.g., 192.168.1.109)
echo Paste it in: lib/core/config/app_config.dart
echo Update: backendHost = 'YOUR-IP-HERE'
echo ==========================================
echo.
pause
