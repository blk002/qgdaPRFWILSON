Set WshShell = CreateObject("WScript.Shell")
' Define o diretório atual para a pasta do projeto
WshShell.CurrentDirectory = "c:\Users\wilso\Downloads\teste"

' Executa o comando npm run dev invisivelmente (0) com Node no PATH
WshShell.Run "cmd /c set PATH=C:\Users\wilso\AppData\Local\Programs\node;%PATH% && npm run dev", 0, False

' Aguarda 2 segundos para o servidor ligar
WScript.Sleep 2000

' Abre o navegador apontando para o servidor seguro
WshShell.Run "http://localhost:5173/qgdaPRFWILSON/", 0, False
