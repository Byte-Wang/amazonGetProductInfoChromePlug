@echo off
setlocal enabledelayedexpansion

:: ========== 配置区 ==========
set "URL=https://sellercentral.amazon.com.au/payments/dashboard/index.html/ref=xx_payments_favb_xx"
set "INTERVAL=60"  :: 单位：秒（600 = 10分钟）
set "BROWSER=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
:: =========================

echo 正在启动定时任务...
echo 每 %INTERVAL% 秒将打开: %URL%
echo 按 Ctrl+C 可终止脚本。
echo.

:loop
echo [%date% %time%] 正在打开 URL...
start "" "%BROWSER%" "%URL%"

:: 等待 INTERVAL 秒
timeout /t %INTERVAL% /nobreak >nul

goto loop