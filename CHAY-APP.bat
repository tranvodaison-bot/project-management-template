@echo off
echo.
echo ╔══════════════════════════════════════╗
echo ║   FTZ-ERP Platform — Khoi dong      ║
echo ╚══════════════════════════════════════╝
echo.

REM Kiểm tra Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Chua cai Docker Desktop!
    echo    Tai tai: https://www.docker.com/products/docker-desktop
    echo    Cai xong roi chay lai file nay.
    pause
    exit /b 1
)

echo ✅ Docker da san sang
echo.
echo ⏳ Dang khoi dong FTZ-ERP...
echo    (Lan dau co the mat 3-5 phut)
echo.

docker compose up --build

pause
