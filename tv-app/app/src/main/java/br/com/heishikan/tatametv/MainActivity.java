package br.com.heishikan.tatametv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Tatame TV — CT Heishikan
 *
 * O app inteiro é uma aplicação web (assets/index.html) rodando numa WebView
 * otimizada para Android TV / TV Box com controle remoto.
 *
 * Inclui:
 *  - Manter a TV acordada durante o treino;
 *  - Modo imersivo em tela cheia;
 *  - Tradução do botão VOLTAR do controle remoto;
 *  - Teclado virtual da TV;
 *  - Integração com Spotify TV e Web;
 *  - Atualizador OTA automático via GitHub Releases.
 */
public class MainActivity extends Activity {

    private WebView web;

    /** Evita fechar o app sem querer: exige dois VOLTAR seguidos no menu. */
    private long lastBackPress = 0L;
    private static final long EXIT_WINDOW_MS = 2500L;

    private static final String GITHUB_LATEST_RELEASE_URL =
            "https://api.github.com/repos/Colombao/bjjsite/releases/latest";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // a tela não pode apagar no meio de um round
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B0A08"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage: guarda placar, modos e ajustes
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); // gongo/sirene tocam sem toque prévio
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);                     // ignora a fonte gigante do sistema da TV

        // Habilita cookies para login do Spotify
        android.webkit.CookieManager cm = android.webkit.CookieManager.getInstance();
        cm.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cm.setAcceptThirdPartyCookies(web, true);
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Abre links externos ou permite navegação interna
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u == null) return false;
                if ("spotify".equals(u.getScheme())) {
                    openExternal(u);
                    return true;
                }
                String host = u.getHost();
                if (host != null && (host.contains("spotify.com") || host.contains("scdn.co") || host.contains("peerjs.com") || host.contains("cloudflare.com"))) {
                    return false; // Carrega na própria WebView
                }
                return false;
            }
        });

        // Ponte JS: teclado, Spotify e Atualizador OTA
        web.addJavascriptInterface(new TvBridge(), "TV");

        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);

        web.requestFocus();
    }

    /**
     * O que a WebView não consegue fazer sozinha.
     * Seguro de expor porque a página vem de assets locais.
     */
    private class TvBridge {

        /** Retorna a versão instalada no app */
        @JavascriptInterface
        public String getAppVersion() {
            return getCurrentVersionName();
        }

        /** Abre o teclado da TV. */
        @JavascriptInterface
        public void showKeyboard() {
            runOnUiThread(() -> {
                if (web == null) return;
                web.requestFocus();
                InputMethodManager imm =
                        (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.showSoftInput(web, InputMethodManager.SHOW_IMPLICIT);
            });
        }

        @JavascriptInterface
        public void hideKeyboard() {
            runOnUiThread(() -> {
                if (web == null) return;
                InputMethodManager imm =
                        (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                if (imm != null) imm.hideSoftInputFromWindow(web.getWindowToken(), 0);
            });
        }

        /** Abre o app do Spotify da TV. */
        @JavascriptInterface
        public void openSpotify() {
            runOnUiThread(() -> {
                PackageManager pm = getPackageManager();
                String[] pacotes = { "com.spotify.tv.android", "com.spotify.music" };
                for (String pkg : pacotes) {
                    Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
                    if (i == null) i = pm.getLaunchIntentForPackage(pkg);
                    if (i != null) {
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(i);
                        return;
                    }
                }
                toastOnPage("O app do Spotify não está instalado nesta TV");
            });
        }

        /** Abre um link externo (como login do Spotify) em um navegador */
        @JavascriptInterface
        public void openBrowser(String url) {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception e) {
                    toastOnPage("Não foi possível abrir o navegador");
                }
            });
        }

        /** Verifica atualizações no GitHub Releases */
        @JavascriptInterface
        public void checkUpdate(boolean userTriggered) {
            new Thread(() -> {
                HttpURLConnection conn = null;
                try {
                    conn = openConnectionWithRedirects(GITHUB_LATEST_RELEASE_URL);
                    int code = conn.getResponseCode();
                    if (code != HttpURLConnection.HTTP_OK) {
                        notifyJsUpdateError("Não foi possível verificar atualizações (Código " + code + ")");
                        return;
                    }

                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject release = new JSONObject(sb.toString());
                    String tag = release.optString("tag_name", "");
                    String notes = release.optString("body", "");
                    String currentVer = getCurrentVersionName();

                    String downloadUrl = "";
                    JSONArray assets = release.optJSONArray("assets");
                    if (assets != null) {
                        for (int i = 0; i < assets.length(); i++) {
                            JSONObject asset = assets.getJSONObject(i);
                            String name = asset.optString("name", "");
                            if (name.endsWith(".apk")) {
                                downloadUrl = asset.optString("browser_download_url", "");
                                break;
                            }
                        }
                    }

                    boolean hasUpdate = isNewerVersion(tag, currentVer) && !downloadUrl.isEmpty();
                    notifyJsUpdateChecked(hasUpdate, tag, downloadUrl, notes, currentVer, userTriggered);

                } catch (Exception e) {
                    notifyJsUpdateError("Erro ao verificar atualizações: " + e.getMessage());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }).start();
        }

        /** Baixa e instala a atualização do APK */
        @JavascriptInterface
        public void downloadAndInstallUpdate(String apkUrl) {
            new Thread(() -> {
                HttpURLConnection conn = null;
                InputStream in = null;
                FileOutputStream out = null;
                try {
                    notifyJsUpdateProgress(0, "Iniciando download...");
                    conn = openConnectionWithRedirects(apkUrl);
                    if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        notifyJsUpdateError("Erro ao conectar ao servidor do APK: " + conn.getResponseCode());
                        return;
                    }

                    int totalSize = conn.getContentLength();
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) dir = getCacheDir();
                    File apkFile = new File(dir, "tatame-tv-update.apk");
                    if (apkFile.exists()) apkFile.delete();

                    in = conn.getInputStream();
                    out = new FileOutputStream(apkFile);

                    byte[] buffer = new byte[8192];
                    long downloaded = 0;
                    int read;
                    int lastPercent = 0;

                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        downloaded += read;
                        if (totalSize > 0) {
                            int percent = (int) ((downloaded * 100) / totalSize);
                            if (percent >= lastPercent + 2 || percent == 100) {
                                lastPercent = percent;
                                notifyJsUpdateProgress(percent, percent + "% concluído");
                            }
                        }
                    }
                    out.flush();
                    out.close();
                    out = null;
                    in.close();
                    in = null;

                    notifyJsUpdateProgress(100, "Download concluído! Abrindo instalador...");
                    Thread.sleep(600);
                    installApk(apkFile);

                } catch (Exception e) {
                    notifyJsUpdateError("Falha ao baixar o APK: " + e.getMessage());
                } finally {
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    try { if (out != null) out.close(); } catch (Exception ignored) {}
                    if (conn != null) conn.disconnect();
                }
            }).start();
        }
    }

    /** Abre o instalador nativo do Android TV para o arquivo APK */
    private void installApk(File apkFile) {
        runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        if (!getPackageManager().canRequestPackageInstalls()) {
                            boolean openedSettings = false;
                            try {
                                Intent manage = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                                manage.setData(Uri.parse("package:" + getPackageName()));
                                manage.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(manage);
                                openedSettings = true;
                            } catch (Exception e1) {
                                try {
                                    Intent manageAll = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                                    manageAll.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(manageAll);
                                    openedSettings = true;
                                } catch (Exception e2) {
                                    try {
                                        Intent sec = new Intent(Settings.ACTION_SECURITY_SETTINGS);
                                        sec.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        startActivity(sec);
                                        openedSettings = true;
                                    } catch (Exception ignored) {}
                                }
                            }
                            if (openedSettings) {
                                toastOnPage("Autorize o Tatame TV em 'Apps desconhecidos' e volte");
                                return;
                            }
                            // Em muitas TVs (ex: RCA / Philco / TCL), a tela de settings do celular não existe.
                            // Segue direto para o PackageInstaller que gerencia a permissão na própria TV.
                        }
                    } catch (Exception ignored) {}
                }

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    Uri apkUri = FileProvider.getUriForFile(
                            MainActivity.this,
                            getPackageName() + ".provider",
                            apkFile);
                    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } else {
                    Uri apkUri = Uri.fromFile(apkFile);
                    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                }

                startActivity(intent);
            } catch (Exception e) {
                toastOnPage("Erro ao abrir instalador: " + e.getMessage());
            }
        });
    }

    /** Abre conexão HTTP seguindo múltiplos redirecionamentos (302 -> AWS S3) */
    private HttpURLConnection openConnectionWithRedirects(String urlString) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setInstanceFollowRedirects(true);
        conn.setRequestProperty("User-Agent", "TatameTV-AndroidApp");
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        int status = conn.getResponseCode();
        int redirectCount = 0;
        while ((status == HttpURLConnection.HTTP_MOVED_TEMP ||
                status == HttpURLConnection.HTTP_MOVED_PERM ||
                status == HttpURLConnection.HTTP_SEE_OTHER ||
                status == 307 || status == 308) && redirectCount < 8) {
            String newUrl = conn.getHeaderField("Location");
            conn.disconnect();
            url = new URL(newUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "TatameTV-AndroidApp");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);
            status = conn.getResponseCode();
            redirectCount++;
        }
        return conn;
    }

    /** Compara versões semânticas (ex: tv-v1.7 vs 1.6) */
    private boolean isNewerVersion(String remoteTag, String currentVersion) {
        if (remoteTag == null || currentVersion == null) return false;
        String cleanRemote = remoteTag.replaceAll("[^0-9.]", "").trim();
        String cleanCurrent = currentVersion.replaceAll("[^0-9.]", "").trim();
        if (cleanRemote.isEmpty() || cleanCurrent.isEmpty()) {
            return !remoteTag.equalsIgnoreCase(currentVersion);
        }

        String[] rParts = cleanRemote.split("\\.");
        String[] cParts = cleanCurrent.split("\\.");
        int length = Math.max(rParts.length, cParts.length);
        for (int i = 0; i < length; i++) {
            int r = i < rParts.length ? parseIntSafe(rParts[i]) : 0;
            int c = i < cParts.length ? parseIntSafe(cParts[i]) : 0;
            if (r > c) return true;
            if (r < c) return false;
        }
        return false;
    }

    private int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private String getCurrentVersionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "1.6";
        }
    }

    private void notifyJsUpdateChecked(boolean hasUpdate, String tag, String url, String notes, String current, boolean userTriggered) {
        runOnUiThread(() -> {
            if (web == null) return;
            try {
                JSONObject obj = new JSONObject();
                obj.put("hasUpdate", hasUpdate);
                obj.put("tag", tag);
                obj.put("downloadUrl", url);
                obj.put("notes", notes);
                obj.put("currentVersion", current);
                obj.put("userTriggered", userTriggered);
                web.evaluateJavascript("window.__onUpdateChecked && window.__onUpdateChecked(" + obj.toString() + ")", null);
            } catch (Exception ignored) {}
        });
    }

    private void notifyJsUpdateProgress(int percent, String message) {
        runOnUiThread(() -> {
            if (web == null) return;
            try {
                JSONObject obj = new JSONObject();
                obj.put("percent", percent);
                obj.put("message", message);
                web.evaluateJavascript("window.__onUpdateProgress && window.__onUpdateProgress(" + obj.toString() + ")", null);
            } catch (Exception ignored) {}
        });
    }

    private void notifyJsUpdateError(String error) {
        runOnUiThread(() -> {
            if (web == null) return;
            try {
                JSONObject obj = new JSONObject();
                obj.put("error", error);
                web.evaluateJavascript("window.__onUpdateError && window.__onUpdateError(" + obj.toString() + ")", null);
            } catch (Exception ignored) {}
        });
    }

    /** Entrega um link "spotify:playlist:..." ao app do Spotify da TV. */
    private void openExternal(Uri uri) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            toastOnPage("O app do Spotify não está instalado nesta TV");
        }
    }

    /** Esconde barra de status e de navegação — a TV mostra só o app. */
    private void goImmersive() {
        View v = getWindow().getDecorView();
        v.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goImmersive();
    }

    @Override
    protected void onResume() {
        super.onResume();
        goImmersive();
        if (web != null) web.onResume();
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            askPageToGoBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    private void askPageToGoBack() {
        if (web == null) { finish(); return; }
        web.evaluateJavascript(
                "(window.__tvBack ? window.__tvBack() : 'exit')",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        boolean wantsExit = value != null && value.contains("exit");
                        if (!wantsExit) {
                            lastBackPress = 0L;
                            return;
                        }
                        long now = System.currentTimeMillis();
                        if (now - lastBackPress < EXIT_WINDOW_MS) {
                            finish();
                        } else {
                            lastBackPress = now;
                            toastOnPage("Pressione VOLTAR de novo para sair");
                        }
                    }
                });
    }

    /** Aproveita o "toast" que já existe na página. */
    private void toastOnPage(String msg) {
        if (web == null) return;
        String seguro = msg.replace("\\", "\\\\").replace("'", "\\'");
        web.evaluateJavascript("window.toast && window.toast('" + seguro + "')", null);
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
