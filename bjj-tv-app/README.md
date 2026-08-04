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

## Build APK local (recomendado para TV)

Precisa do Android SDK instalado (`ANDROID_HOME`).

```bash
cd bjj-tv-app
npm install
CI=1 npx expo prebuild --platform android
# Ajuste o AndroidManifest para Leanback (TV) se necessário
bash scripts/build-apk.sh
```

APK gerado em: `dist/heishikan-arena-v1.0.0.apk`  
Package: `com.heishikan.arena`

### Instalar na Android TV

1. Ative **Depuração USB / rede** na TV  
2. `adb connect IP_DA_TV:5555`  
3. `adb install -r dist/heishikan-arena-v1.0.0.apk`

### iPhone — o que funciona agora

IPA nativo **não** é gerado no Linux (precisa Mac da Expo/EAS + Apple Developer).

**Hoje no iPhone:** abra o site no Safari → `/apps` → Compartilhar → **Adicionar à Tela de Início**.

### Build na nuvem (EAS)

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview   # APK
eas build -p ios --profile production    # iOS (Apple Developer US$ 99/ano)
eas submit -p ios                        # TestFlight / App Store
```

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
