# Setup Detalhado - React Native Android TV

Guia completo para configurar e buildiar o app para Android TV.

## 1. Ambiente Local

### Windows

```bash
# Node.js (recomendado 16+)
https://nodejs.org/

# Android Studio
https://developer.android.com/studio

# Setup Android SDK
- Abra Android Studio
- SDK Manager → SDK Platforms
- Instale: Android 12 (API 31) ou superior

# Setup Java
https://www.oracle.com/java/technologies/downloads/#java11
```

### macOS/Linux

```bash
# Instale Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js
brew install node

# Java 11
brew install openjdk@11
sudo ln -sfn /usr/local/opt/openjdk@11/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-11.jdk

# Android SDK
https://developer.android.com/studio
```

## 2. Crie o Projeto React Native

```bash
# Opção A: Crie novo (este já está pronto)
cd bjj-tv-app
npm install

# Opção B: Init do zero
npx react-native init BJJPlacarTV --template typescript
cd BJJPlacarTV
```

## 3. Configure para Android TV

### Edite `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.bjjtvapp">

    <!-- TV Features -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.software.leanback" android:required="false" />

    <application>
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            
            <!-- TV Intent -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Edite `android/app/build.gradle`

```gradle
android {
    compileSdkVersion 33

    defaultConfig {
        applicationId "com.bjjtvapp"
        minSdkVersion 21  // Android TV min
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## 4. Setup Debug Bridge (ADB)

### Encontre a TV

1. Na TV, vá para: **Settings** → **About** → **Status** → anote o **IP**
2. Habilite ADB em: **Settings** → **Developer Options** → **USB Debugging** ou **Network Debugging**

### Conecte

```bash
# Substitua <TV_IP> pelo IP real (ex: 192.168.1.100)
adb connect <TV_IP>:5555

# Verifique conexão
adb devices
```

## 5. Build & Deploy

### Development (Debug APK)

```bash
# Instala direto na TV conectada
npm run android

# Ou manual
npx react-native run-android
```

### Release (Build APK)

```bash
# Gera APK otimizado
npm run build:apk

# APK localizado em:
# android/app/build/outputs/apk/release/app-release.apk
```

### Instale na TV

```bash
# Via ADB
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Verifique instalação
adb shell pm list packages | grep bjj

# Inicie app
adb shell am start -n com.bjjtvapp/.MainActivity
```

## 6. Teste Controle Remoto

### Emule D-Pad

```bash
# Seta para cima (keycode 19)
adb shell input keyevent 19

# Seta para baixo (keycode 20)
adb shell input keyevent 20

# Seta esquerda (keycode 21)
adb shell input keyevent 21

# Seta direita (keycode 22)
adb shell input keyevent 22

# Center/OK (keycode 23)
adb shell input keyevent 23

# Enter (keycode 66)
adb shell input keyevent 66
```

## 7. Troubleshooting

### Erro: "Metro server not started"

```bash
# Mate o Metro
lsof -ti:8081 | xargs kill -9

# Reinicie
npm start
```

### TV não aparece em `adb devices`

```bash
# Reinicie ADB
adb kill-server
adb start-server

# Reconecte
adb connect <TV_IP>:5555
```

### App não inicia na TV

```bash
# Verifique logs
adb logcat

# Clear app data
adb shell pm clear com.bjjtvapp

# Reinstale
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### APK muito grande (>100MB)

```bash
# Ative minify
# android/app/build.gradle → minifyEnabled true

# Build AAB (Android App Bundle)
npm run build:aab

# Converta AAB para APK
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --ks=my-release-key.jks
```

## 8. Distribuição

### Gere Signing Key

```bash
# Create key
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Place em: android/app/my-release-key.jks
```

### Configure Signing em `android/app/build.gradle`

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

## Próximos Passos

1. ✅ Setup React Native
2. ✅ Configure para TV
3. ✅ Build APK
4. ⏳ Teste na TV
5. ⏳ Implemente persistência (AsyncStorage)
6. ⏳ Distribua para Play Store (opcional)

---

**Status**: Pronto para development. Teste com `npm run android`.
