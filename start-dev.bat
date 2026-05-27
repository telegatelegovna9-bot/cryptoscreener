@echo off
chcp 65001 >nul
cd /d "C:\Users\fames_rd\Desktop\попытка 505 —\apps\web"
echo Starting dev server on port 3002...
npx next dev --turbopack --port 3002
pause
