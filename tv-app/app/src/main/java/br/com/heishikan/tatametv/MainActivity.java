package br.com.heishikan.tatametv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
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

/**
 * Tatame TV — CT Heishikan
 *
 * O app inteiro é uma página web local (assets/index.html) rodando numa WebView
 * em tela cheia. Não há acesso à internet: nenhuma permissão de rede é declarada
 * no manifesto, então o app funciona 100% offline no tatame.
 *
 * Esta Activity cuida só do que a web não consegue fazer sozinha:
 *  - manter a TV acordada durante o treino;
 *  - esconder as barras do sistema (modo imersivo);
 *  - traduzir o botão VOLTAR do controle para a navegação interna do app.
 */
public class MainActivity extends Activity {

    private WebView web;

    /** Evita fechar o app sem querer: exige dois VOLTAR seguidos no menu. */
    private long lastBackPress = 0L;
    private static final long EXIT_WINDOW_MS = 2500L;

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
        s.setMediaPlaybackRequiresUserGesture(false); // gongo/sirene tocam sem toque prévio
        s.setAllowFileAccess(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);                     // ignora a fonte gigante do sistema da TV

        // O app é fechado: nada abre navegador externo.
        // A exceção é o esquema "spotify:", que entrega a playlist ao app
        // do Spotify instalado na TV (onde toca completa, sem prévia de 30s).
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u != null && "spotify".equals(u.getScheme())) {
                    openExternal(u);
                }
                return true;
            }
        });

        // ponte usada pela página: teclado do sistema e app do Spotify
        web.addJavascriptInterface(new TvBridge(), "TV");

        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);

        web.requestFocus();
    }

    /**
     * O que a WebView não consegue fazer sozinha.
     * Seguro de expor porque a página vem de assets locais, não da internet.
     */
    private class TvBridge {

        /** Abre o teclado da TV. Sem isso, focar um input via JS não levanta o IME. */
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

        /** Abre o app do Spotify da TV, onde estão as playlists da conta. */
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

    /**
     * O botão VOLTAR do controle não chega ao JavaScript sozinho.
     * Perguntamos à página o que fazer: ela fecha um modal ou volta ao menu
     * e responde "handled"; se já estiver no menu, responde "exit".
     */
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
                        // evaluateJavascript devolve a string entre aspas: "exit"
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

    /** Aproveita o "toast" que já existe na página, em vez de criar um do Android. */
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
