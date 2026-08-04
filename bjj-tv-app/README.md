# Heishikan Arena — Timer & Placar

App **Expo** (React Native) do CT Heishikan para:

- **Android** (celular / tablet)
- **iPhone / iPad**
- **Android TV** (APK sideload + launcher Leanback)
- **Web** (preview no navegador)

Reaproveita a lógica do timer de rounds e do placar CBJJ do site.

## Como testar agora

```bash
cd bjj-tv-app
npm install
npm start
```

- Celular: instale o app **Expo Go** e escaneie o QR
- Emulador Android: `npm run android`
- iOS Simulator (macOS): `npm run ios`
- Navegador: `npm run web`

## Build de loja / TV (EAS)

1. Crie conta em [expo.dev](https://expo.dev)
2. No projeto:

```bash
npm i -g eas-cli
eas login
eas build:configure
```

3. Builds:

```bash
# APK Android (celular + TV sideload)
eas build -p android --profile preview

# iOS (precisa Apple Developer)
eas build -p ios --profile production

# AAB para Play Store
eas build -p android --profile production
```

### Instalar na Android TV

1. Ative **Depuração USB / rede** na TV  
2. `adb connect IP_DA_TV:5555`  
3. `adb install caminho/do/app.apk`

## Telas

| Tela | Uso |
|------|-----|
| Home | Escolhe Timer ou Placar |
| Timer | Rounds + preparação/descanso, modos rápidos |
| Placar | Pontos / vantagem / penalidade + timer de luta |

Na TV, o layout fica em landscape com números grandes. No celular, o placar mostra painel de controle (botão **Ctrl/Tela** alterna).

## Relação com o site

O site Next.js continua com `/timer` e `/placar` (TV + controle remoto via QR).  
Este app é a versão **nativa instalável**. O PWA do site (`/apps`) cobre instalação rápida no celular sem App Store.
