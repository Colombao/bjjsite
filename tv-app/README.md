# Tatame TV — app para Android TV

App de tatame do **CT Heishikan Aurum**: cronômetro de rounds + placar CBJJ,
feito para rodar na TV e ser operado **só com o controle remoto**.

Dois modos:

- **Timer** — rounds com preparação / combate / descanso, gongo, sirene e
  beeps nos últimos 5 segundos
- **Placar** — a mesma tela do `/placar/display` do site (fundo cinza, faixa
  azul do atleta A, colunas verde / amarelo / vermelho, tempo e status),
  agora com o cronômetro da luta embutido e pontuação CBJJ pelo controle:
  `+2` `+3` `+4` `+V` `+P`, com **desfazer** e **modo corrigir**

Mais:

- **Música pelo Spotify da TV** — um botão abre o app do Spotify, você escolhe
  a playlist lá e volta com VOLTAR; a música segue tocando por trás do timer
- Usa o **teclado nativo da TV** para digitar (com ditado por voz, se o seu
  controle tiver microfone)
- A TV não apaga sozinha durante o treino
- **100% offline** — o app não declara nenhuma permissão de rede

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

## Ligar a depuração na TV (só na primeira vez)

O caminho muda conforme o lançador da TV. Descubra pela tela inicial:

**Android TV clássico** (fileiras horizontais, logo "Android TV"):

1. Configurações (engrenagem, canto superior direito)
2. **Preferências do dispositivo → Sobre**
3. Desça até **Versão de compilação** e aperte **OK 7 vezes**
   → aparece "Agora você é um desenvolvedor"
4. Volte uma tela: **Preferências do dispositivo → Opções do desenvolvedor**
5. Ligue **Depuração USB**. Se existir **Depuração pela rede** (ou *ADB pela
   rede* / *Depuração sem fio*), ligue também.

**Google TV** (abas "Para você / Programas / Filmes / Apps"):

1. Configurações → **Sistema → Sobre**
2. Aperte **OK 7 vezes** em **Versão do Android TV OS**
3. Volte: **Sistema → Opções do desenvolvedor** → **Depuração USB** ligada

**O IP da TV:** Configurações → **Rede e Internet** → clique na rede conectada.
Também aparece em Sobre → Status.

Na primeira conexão a TV mostra um aviso pedindo autorização — marque
**"Sempre permitir deste computador"** e confirme. Sem isso o `adb` fica
travado em *unauthorized*.

> Em TVs de marcas menores a depuração pela rede às vezes vem desativada de
> fábrica e não tem como ligar. Se o `adb connect` não passar, use o pendrive
> (Opção B mais abaixo) — esse caminho funciona em qualquer Android TV e não
> precisa de modo desenvolvedor.

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
do CT Heishikan Aurum.

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

O app **não** tem player embutido. A tentativa anterior usava o player de embed
do Spotify, que sem login só toca prévias de 30 segundos e ainda pesava na
WebView da TV.

Agora é assim: **♫ Música → Abrir o Spotify da TV**. Você escolhe a playlist na
interface real do Spotify (onde estão todas as da sua conta), dá play e volta
para o timer com VOLTAR. A música continua tocando por trás, completa.

Se você tem playlists que usa sempre, salve atalhos em **♫ Música →
＋ Salvar atalho** (cole o link ou só o ID). O atalho pula direto para aquela
playlist dentro do app do Spotify, sem navegar pelos menus dele.

## Sobre o teclado

Para digitar nome de atleta, equipe, nome de modo ou link de playlist, o app
abre um campo de texto e chama o **teclado da própria TV** — com sugestão de
palavra e ditado por voz. A grade de letras que existia antes era lenta na TV.

No campo: **◀ ▶** andam com o cursor, **▲ ▼** saem para os botões,
**OK** confirma, **VOLTAR** cancela. O botão **⌨ Teclado** reabre o teclado da
TV se você fechou sem terminar.

## Estrutura

```
tv-app/
├── app/
│   ├── build.gradle
│   └── src/main/
│       ├── AndroidManifest.xml          ← LEANBACK_LAUNCHER, zero permissões
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
