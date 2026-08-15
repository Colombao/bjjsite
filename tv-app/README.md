# Tatame TV — app para Android TV

App de tatame do **CT Heishikan**: cronômetro de rounds + placar CBJJ,
feito para rodar na TV e ser operado **só com o controle remoto**.

Dois modos:

- **Timer** — rounds com preparação / combate / descanso, gongo, sirene e
  beeps nos últimos 5 segundos
- **Placar** — a mesma tela do `/placar/display` do site (fundo cinza, faixa
  azul do atleta A, colunas verde / amarelo / vermelho, tempo e status),
  agora com o cronômetro da luta embutido e pontuação CBJJ pelo controle:
  `+2` `+3` `+4` `+V` `+P`, com **desfazer** e **modo corrigir**

Mais:

- **Playlists do Spotify** — as mesmas do `/timer` do site. Toca dentro do app
  ou abre no app do Spotify da TV
- Teclado na tela para digitar nome do atleta, equipe e link de playlist
- A TV não apaga sozinha durante o treino
- Timer e placar funcionam **offline**; a internet só é usada pelo Spotify

## Como o app é feito

Todo o app é um único arquivo web (`app/src/main/assets/index.html`)
rodando numa WebView em tela cheia. A parte Android (`MainActivity.java`)
só cuida do que a web não faz sozinha: manter a tela ligada, esconder as
barras do sistema e traduzir o botão **VOLTAR** do controle.

Isso significa que **para mudar qualquer coisa do app, você edita só o
`index.html`** — e pode testar no navegador do PC antes de gerar o APK.

## Gerar o APK sem instalar nada (recomendado)

O repositório já vem com um workflow do GitHub Actions.

1. Suba o projeto para o GitHub
2. Aba **Actions** → **APK Tatame TV** → **Run workflow**
3. Em ~4 minutos, baixe o APK em **Artifacts**

Para gerar um link de download direto (dá para baixar na própria TV):

```bash
git tag tv-v1.0
git push origin tv-v1.0
```

O APK aparece em **Releases** com uma URL pública.

## Gerar o APK no seu PC (opcional)

Precisa de JDK 17 e do Android SDK (Android Studio já traz os dois).

```bash
cd tv-app
./gradlew assembleRelease          # Linux/macOS
gradlew.bat assembleRelease        # Windows
```

O arquivo sai em `app/build/outputs/apk/release/app-release.apk`.

> O APK é assinado com a chave de debug. Isso é o suficiente para instalar
> na sua TV. Só é preciso uma chave própria para publicar na Play Store.

## Instalar na TV

### Jeito mais fácil: `instalar-na-tv.bat`

Dê dois cliques em **`instalar-na-tv.bat`** (nesta pasta). Ele baixa o `adb`
sozinho, acha o APK em Downloads (inclusive dentro do .zip do GitHub Actions),
pergunta o IP da TV e instala. Da segunda vez em diante o IP já vem preenchido.

Antes de rodar, libere a depuração na TV: **Ajustes → Sistema → Sobre →**
clique 7× em *Versão do build*, depois **Ajustes → Opções do desenvolvedor →
Depuração USB: ATIVADA**. O IP está em **Ajustes → Rede**.

### Opção A — ADB na mão (o que o script faz por baixo)

Na TV: **Configurações → Sistema → Sobre →** clique 7× em *Versão do build*
para liberar o modo desenvolvedor. Depois **Opções do desenvolvedor →
Depuração por USB / Depuração pela rede: ON**. Anote o IP em
**Configurações → Rede**.

No PC:

```bash
adb connect 192.168.0.XX:5555
adb install -r tatame-tv.apk
```

### Opção B — Pendrive

Copie o `tatame-tv.apk` para um pendrive, espete na TV e abra com um
gerenciador de arquivos (o *X-plore* ou o *File Commander* da própria loja
resolvem). Autorize "instalar de fontes desconhecidas" quando a TV pedir.

### Opção C — App "Downloader"

Instale o **Downloader** pela Play Store da TV e digite a URL do APK
publicado em *Releases*. É o caminho mais rápido se você não tem cabo.

Depois de instalado, o app aparece na tela inicial da TV com o banner
do CT Heishikan.

## Controles

| Botão do controle | O que faz |
|---|---|
| ▲ ▼ ◀ ▶ | Navega entre os botões |
| OK | Aciona o botão em foco |
| VOLTAR | Fecha janela / volta ao menu · no menu, 2× seguidos sai |
| Play/Pause | Inicia ou pausa o cronômetro |

No placar, o nome do atleta é um botão: suba até ele com ▲ e aperte OK para
abrir o teclado (ele pede o nome e depois a equipe).

## Sobre o Spotify

O app usa o mesmo player de embed do site. Sem estar logado, o Spotify toca
**prévias de 30 segundos** — é uma limitação do próprio Spotify, não do app.

Por isso cada playlist tem um botão **TV**: ele entrega a playlist ao app do
Spotify instalado na TV, onde ela toca completa. É o caminho recomendado para
o som do tatame.

Para adicionar uma playlist: **♫ Música → ＋ Nova playlist**. Cole o link
(`https://open.spotify.com/playlist/...`) ou digite só o ID da playlist — o
teclado da tela tem maiúsculas, minúsculas e os símbolos de link.

## Estrutura

```
tv-app/
├── app/
│   ├── build.gradle
│   └── src/main/
│       ├── AndroidManifest.xml          ← LEANBACK_LAUNCHER + internet (Spotify)
│       ├── assets/index.html            ← O APP INTEIRO ESTÁ AQUI
│       ├── java/.../MainActivity.java   ← WebView + tela ligada + botão Voltar
│       └── res/
│           ├── drawable/banner.png      ← banner 320×180 da tela inicial da TV
│           └── mipmap-*/ic_launcher.png
├── build.gradle
├── settings.gradle
└── gradlew / gradlew.bat
```

## Atualizando o app

1. Edite `app/src/main/assets/index.html`
2. Teste no navegador do PC (abra o arquivo, tecla `F` = tela cheia,
   setas = D-pad, `Enter` = OK)
3. Gere um APK novo e instale com `adb install -r`

Se você também publica o app no site, mantenha `public/tv/index.html`
e `tv-app/app/src/main/assets/index.html` iguais — são o mesmo arquivo.
