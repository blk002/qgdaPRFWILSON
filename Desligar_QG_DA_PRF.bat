@echo off
title Desligando QG DA PRF
echo ==================================================
echo Encerrando o servidor invisivel do QG da PRF...
echo ==================================================

:: Mata qualquer processo node rodando do Vite
taskkill /F /IM node.exe > NUL 2>&1

echo.
echo Servidor encerrado com sucesso! Memoria liberada.
echo Pressione qualquer tecla para fechar.
pause > NUL
