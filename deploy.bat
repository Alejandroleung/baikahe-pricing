@echo off
chcp 65001 >nul
title Auto Deploy
cd /d "C:\Users\13426\Desktop\白卡盒算价系统"

echo ========================================
echo  Deploying to GitHub Pages ...
echo ========================================
echo.

git add -A
git commit -m "auto update %date% %time%"
git push

echo.
echo ========================================
echo  Done!
echo ========================================
echo.
echo  Wait 1-2 min for deployment:
echo  https://alejandroleung.github.io/baikahe-pricing/
echo.
pause