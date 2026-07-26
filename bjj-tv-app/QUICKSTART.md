# Quick Start - BJJ Placar TV

Comece em 5 minutos.

## 1. Instale dependências

```bash
cd bjj-tv-app
npm install
```

## 2. Conecte sua Android TV

```bash
# Na TV: Settings → Developer Options → Network Debugging → ON
# Anote o IP da TV

# No seu computador:
adb connect <IP_DA_TV>:5555

# Verifique conexão
adb devices
```

## 3. Teste rápido (sem build)

```bash
# Instala e abre na TV
npm run android
```

## 4. Build APK para produção

```bash
# Gera APK otimizado
npm run build:apk

# APK está em:
# android/app/build/outputs/apk/release/app-release.apk
```

## 5. Instale na TV

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Controle Remoto (D-Pad)

| Botão | O quê |
|-------|-------|
| ↑/↓ | Navega entre campos |
| ←/→ | +/− no valor |
| OK | Seleciona |

## Estrutura

```
bjj-tv-app/
├── src/
│   ├── hooks/         # useTimer, usePlacar
│   ├── components/    # Timer, Placar, TVControls
│   ├── screens/       # TVScreen (tela principal)
│   └── styles/        # tvStyles (CSS para TV)
├── android/           # Configuração Android
├── App.tsx            # Entry point
└── package.json
```

## Troubleshoot

**TV não aparece em `adb devices`?**
```bash
adb kill-server && adb start-server
adb connect <IP>:5555
```

**App não compila?**
```bash
npm install
cd android && ./gradlew clean
cd .. && npm run android
```

**APK muito grande?**
```bash
npm run build:aab  # Cria bundle otimizado
```

---

**Próximo**: Leia `SETUP.md` para setup completo e troubleshooting avançado.
