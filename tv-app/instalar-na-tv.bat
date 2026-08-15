@echo off
chcp 65001 >nul 2>&1
setlocal EnableExtensions EnableDelayedExpansion
title Tatame TV - instalar na Android TV
color 0E

set "BASE=%~dp0"
set "TOOLS=%BASE%_adb"
set "ADB=%TOOLS%\platform-tools\adb.exe"
set "IPFILE=%TOOLS%\ultimo-ip.txt"

echo.
echo  ==============================================
echo    TATAME TV  -  instalar na Android TV
echo    CT Heishikan
echo  ==============================================
echo.

rem ============================================================
rem  1. Baixa o adb (ferramenta oficial do Android) se preciso
rem ============================================================
if exist "%ADB%" (
  echo  [1/4] adb ja esta instalado.
) else (
  echo  [1/4] Baixando o adb do site oficial do Android...
  if not exist "%TOOLS%" mkdir "%TOOLS%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip' -OutFile '%TOOLS%\pt.zip'; Expand-Archive -Path '%TOOLS%\pt.zip' -DestinationPath '%TOOLS%' -Force; Remove-Item '%TOOLS%\pt.zip' -Force"
  if not exist "%ADB%" (
    echo.
    echo  ERRO: nao consegui baixar o adb. Confira a internet e rode de novo.
    echo.
    pause
    exit /b 1
  )
  echo        pronto.
)

rem ============================================================
rem  2. Encontra o APK
rem ============================================================
echo.
echo  [2/4] Procurando o APK...
set "APK="

if exist "%BASE%tatame-tv.apk" set "APK=%BASE%tatame-tv.apk"

if not defined APK (
  for /f "delims=" %%F in ('dir /b /o-d "%USERPROFILE%\Downloads\tatame-tv*.apk" 2^>nul') do (
    set "APK=%USERPROFILE%\Downloads\%%F"
    goto :temapk
  )
)

rem o GitHub Actions entrega o artifact como .zip - extrai sozinho
if not defined APK (
  for /f "delims=" %%F in ('dir /b /o-d "%USERPROFILE%\Downloads\tatame-tv*.zip" 2^>nul') do (
    echo        achei o zip do GitHub Actions: %%F
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "Expand-Archive -Path '%USERPROFILE%\Downloads\%%F' -DestinationPath '%TOOLS%\apk' -Force" >nul 2>&1
    if exist "%TOOLS%\apk\tatame-tv.apk" set "APK=%TOOLS%\apk\tatame-tv.apk"
    goto :temapk
  )
)

:temapk
if not defined APK (
  echo        nao achei em Downloads.
  echo.
  set /p "APK=       Arraste o arquivo .apk para esta janela e tecle Enter: "
)
set APK=!APK:"=!

if not exist "!APK!" (
  echo.
  echo  ERRO: arquivo nao encontrado: !APK!
  echo.
  pause
  exit /b 1
)
echo        usando: !APK!

rem ============================================================
rem  3. Conecta na TV
rem ============================================================
set "LASTIP="
if exist "%IPFILE%" set /p LASTIP=<"%IPFILE%"

echo.
echo  [3/4] Conectando na TV.
echo        Antes, ligue a depuracao na TV:
echo          Android TV: Config ^> Preferencias do dispositivo ^> Sobre
echo          Google TV : Config ^> Sistema ^> Sobre
echo          clique 7x em "Versao de compilacao", volte, e em
echo          Opcoes do desenvolvedor ligue DEPURACAO USB
echo          (se existir "Depuracao pela rede", ligue tambem)
echo        IP: Config ^> Rede e Internet ^> clique na sua rede.
echo.
if defined LASTIP (
  set /p "IP=       IP da TV [Enter usa !LASTIP!]: "
  if "!IP!"=="" set "IP=!LASTIP!"
) else (
  set /p "IP=       IP da TV (ex: 192.168.0.42): "
)
set "IP=!IP: =!"
if "!IP!"=="" (
  echo  ERRO: IP vazio.
  pause
  exit /b 1
)

"%ADB%" kill-server >nul 2>&1
"%ADB%" start-server >nul 2>&1
echo.
"%ADB%" connect !IP!:5555

"%ADB%" devices | find "!IP!:5555" | find "unauthorized" >nul
if not errorlevel 1 (
  echo.
  echo  ATENCAO: a TV pediu autorizacao.
  echo  Olhe a tela da TV, marque "Sempre permitir" e clique OK.
  echo.
  pause
  "%ADB%" connect !IP!:5555
)

"%ADB%" devices | find "!IP!:5555" | find "device" >nul
if errorlevel 1 (
  echo.
  echo  Nao consegui conectar em !IP!:5555.
  echo.
  echo  Coisas para conferir:
  echo    - PC e TV no MESMO Wi-Fi
  echo    - Depuracao USB / pela rede ATIVADA nas opcoes do desenvolvedor
  echo    - IP correto
  echo.
  echo  Se a sua TV pede CODIGO DE PAREAMENTO ^(Google TV mais novo^):
  echo    na TV abra "Depuracao sem fio" ^> "Parear com codigo".
  echo    Ela mostra um IP:PORTA e um codigo de 6 digitos.
  echo.
  set /p "PAIR=       IP:PORTA do pareamento (ou Enter para sair): "
  if "!PAIR!"=="" (
    pause
    exit /b 1
  )
  "%ADB%" pair !PAIR!
  "%ADB%" connect !IP!:5555
  "%ADB%" devices | find "!IP!:5555" | find "device" >nul
  if errorlevel 1 (
    echo.
    echo  Ainda sem conexao. Rode o script de novo.
    pause
    exit /b 1
  )
)

>"%IPFILE%" echo !IP!
echo        conectado.

rem ============================================================
rem  4. Instala e abre
rem ============================================================
echo.
echo  [4/4] Instalando o app na TV...
echo.
"%ADB%" -s !IP!:5555 install -r "!APK!"
if errorlevel 1 (
  echo.
  echo  A instalacao falhou. Se a mensagem citar assinatura
  echo  ^(INSTALL_FAILED_UPDATE_INCOMPATIBLE^), desinstale a versao antiga:
  echo.
  echo      "%ADB%" -s !IP!:5555 uninstall br.com.heishikan.tatametv
  echo.
  pause
  exit /b 1
)

echo.
echo  Abrindo o Tatame TV na TV...
"%ADB%" -s !IP!:5555 shell monkey -p br.com.heishikan.tatametv -c android.intent.category.LEANBACK_LAUNCHER 1 >nul 2>&1

echo.
echo  ==============================================
echo    PRONTO! O app ja esta na tela inicial da TV.
echo.
echo    Para atualizar depois: baixe o APK novo e
echo    rode este script de novo (o IP fica salvo).
echo  ==============================================
echo.
pause
endlocal
