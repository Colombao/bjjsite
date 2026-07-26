# BJJ Placar TV App

Aplicativo React Native para Android TV com placar jiu-jitsu (padrão CBJJ) + timer integrado.

## Características

- ⏱️ Timer integrado (start/pause/reset)
- 📊 Placar com pontos, vantagem e penalidade
- 🎮 Navegação com controle remoto (d-pad)
- 📱 Offline-first (sem dependência de internet)
- 📺 Otimizado para TV (full-screen, botões grandes, foco visual)
- 🏃 Performance: ~60fps em Android TV

## Stack

- React Native 0.72+
- TypeScript
- Android TV native

## Setup

### Pré-requisitos

- Node.js 16+
- Android SDK 28+
- Android Studio (recomendado)
- JDK 11+

### Instalação

```bash
# Clone ou navegue ao diretório
cd bjj-tv-app

# Instale dependências
npm install

# Para development no Android TV
npm run android

# Para emulador
npx react-native run-android --variant=release
```

## Desenvolvimento

### Estrutura

```
src/
├── components/        # Componentes reutilizáveis
│   ├── Timer.tsx
│   ├── Placar.tsx
│   └── TVControls.tsx
├── screens/          # Telas principais
│   └── TVScreen.tsx
├── hooks/            # Lógica de estado
│   ├── useTimer.ts
│   └── usePlacar.ts
└── styles/
    └── tvStyles.ts   # Estilos TV-optimized
```

### Controle Remoto (D-Pad)

| Botão | Ação |
|-------|------|
| **↑** | Foco anterior |
| **↓** | Foco próximo |
| **←** | Decrementar valor |
| **→** | Incrementar valor |
| **OK/Enter** | Selecionar/Executar |
| **Back** | Nada (bloqueado) |

## Build & Deploy

### APK Release

```bash
# Gera APK release
npm run build:apk

# APK está em: android/app/build/outputs/apk/release/app-release.apk
```

### Instalação na TV

```bash
# Via ADB (Android Debug Bridge)
adb connect <TV_IP>:5555
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Obter IP da TV

Settings → About → Status → IP Address

## Controles

### Timer
- **+/−**: Adiciona/remove 1 minuto
- **OK**: Start/pause
- **Reset**: Volta para 5:00

### Placar
- **+/−**: Incrementa/decrementa pontos, vantagem ou penalidade
- Cores CBJJ:
  - Verde = Pontos (2)
  - Amarelo = Vantagem (4)
  - Vermelho = Penalidade

### Status da Luta
- **INÍCIO**: Antes de começar
- **DURANTE**: Luta em progresso
- **FINAL**: Luta finalizada

## Performance

- Tamanho APK: ~50MB
- RAM utilizada: ~100-150MB
- CPU: <10% (idle)

## Troubleshooting

### TV não conecta
```bash
# Verifique a conexão
adb devices

# Force reconnect
adb disconnect
adb connect <IP>:5555
```

### App travado ou lento
```bash
# Clear app data
adb shell pm clear com.bjjtvapp

# Reinstale
npm run build:apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Next Steps

- [ ] Implementar persistência (AsyncStorage)
- [ ] Adicionar temas (claro/escuro)
- [ ] Histórico de lutas
- [ ] Suporte a múltiplas categorias de peso
- [ ] Geração de relatórios

## Licença

MIT
