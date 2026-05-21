@echo off
title Ligar QG da PRF
echo Iniciando o servidor do aplicativo... Aguarde um instante.
cd /d "%~dp0"
:: Abre o navegador
start http://localhost:5173/qgdaPRFWILSON/
:: Inicia o Vite
npm run dev
pause
