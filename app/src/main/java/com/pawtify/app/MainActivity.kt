package com.pawtify.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

/**
 * Main Activity embedding the Pawtify web app via WebViewAssetLoader.
 *
 * Implements:
 * - Secure local asset serving via `https://appassets.androidplatform.net/webapp/`
 * - Continuous background audio execution without calling webView.onPause()
 * - Android 13+ POST_NOTIFICATIONS runtime permission request
 * - Two-way JavaScript bridge for media notification synchronization
 * - Back button integration with web app history
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var assetLoader: WebViewAssetLoader

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Notification permission granted or denied.
            // If denied, media will still play, but system notification won't appear.
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        loadingSpinner = findViewById(R.id.loadingSpinner)

        setupAssetLoader()
        setupWebView()
        setupBackNavigation()
        setupMediaActionListener()
        checkNotificationPermission()

        // Load the locally bundled Pawtify PWA
        webView.loadUrl("https://appassets.androidplatform.net/webapp/index.html")
    }

    private fun setupAssetLoader() {
        assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/webapp/", WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Modern rendering and hardware acceleration
        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.black))
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        // Expose JavaScript Interface to the web app
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val url = request.url
                // Let WebViewAssetLoader handle local assets
                val response = assetLoader.shouldInterceptRequest(url)
                if (response != null) {
                    return response
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                loadingSpinner.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                loadingSpinner.visibility = View.GONE
                // Notify the web app that it is running inside the Android container
                evaluateJs("window.isAndroidContainer = true; if (window.onAndroidReady) window.onAndroidReady();")
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return super.onConsoleMessage(consoleMessage)
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // First attempt SPA back routing via window.onAndroidBackPressed()
                webView.evaluateJavascript("window.onAndroidBackPressed ? window.onAndroidBackPressed() : null") { result ->
                    val handledByWebApp = result == "true" || result == "\"true\""
                    if (!handledByWebApp) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            // Move app to background instead of destroying activity, preserving playback
                            moveTaskToBack(true)
                        }
                    }
                }
            }
        })
    }

    private fun setupMediaActionListener() {
        MusicPlaybackService.mediaActionListener = { action ->
            runOnUiThread {
                when (action) {
                    MusicPlaybackService.ACTION_PLAY -> {
                        evaluateJs("window.onAndroidPlay ? window.onAndroidPlay() : (window.onAndroidPlayPause ? window.onAndroidPlayPause() : null);")
                    }
                    MusicPlaybackService.ACTION_PAUSE -> {
                        evaluateJs("window.onAndroidPause ? window.onAndroidPause() : (window.onAndroidPlayPause ? window.onAndroidPlayPause() : null);")
                    }
                    MusicPlaybackService.ACTION_TOGGLE -> {
                        evaluateJs("window.onAndroidPlayPause ? window.onAndroidPlayPause() : null;")
                    }
                    MusicPlaybackService.ACTION_NEXT -> {
                        evaluateJs("window.onAndroidNext ? window.onAndroidNext() : null;")
                    }
                    MusicPlaybackService.ACTION_PREVIOUS -> {
                        evaluateJs("window.onAndroidPrevious ? window.onAndroidPrevious() : null;")
                    }
                }
            }
        }
    }

    private fun evaluateJs(script: String) {
        webView.evaluateJavascript(script, null)
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permission = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                requestNotificationPermissionLauncher.launch(permission)
            }
        }
    }

    /**
     * CRITICAL FOR BACKGROUND AUDIO:
     * Do NOT call webView.onPause() or webView.pauseTimers() in onPause() or onStop().
     * This keeps the JavaScript AudioContext and streaming sockets active when the screen turns off.
     */
    override fun onPause() {
        super.onPause()
    }

    override fun onStop() {
        super.onStop()
    }

    override fun onDestroy() {
        MusicPlaybackService.mediaActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
