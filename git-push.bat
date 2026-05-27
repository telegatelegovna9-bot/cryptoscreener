@echo off
chcp 65001 >nul
cd /d "C:\Users\fames_rd\Desktop\попытка 505 —"

echo === GIT ADD ===
git add -A

echo === GIT STATUS ===
git status --short

echo === GIT COMMIT ===
git commit -m "feat: premium landing page + fix build deps"

echo === GIT PUSH ===
git push

echo === DONE ===
pause
