package meow.pawtify.pawjects

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * Main Activity wrapping the hosted Pawtify PWA inside an optimized Android WebView.
 *
 * Implements:
 * - Direct remote URL loading with easy-to-change target constant.
 * - Continuous background audio execution without calling webView.onPause().
 * - Android 13+ (API 33+) POST_NOTIFICATIONS runtime permission handling.
 * - Two-way JavaScript bridge for media notification synchronization.
 * - Smart back-button override preserving playback session.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        /**
         * The hosted Pawtify Music Streaming PWA endpoint.
         * Easily change this constant or override it via strings.xml.
         */
        const val TARGET_WEB_URL = "https://pawtify-meow.vercel.app/"
    }

    private lateinit var webView: WebView
    private lateinit var loadingSpinner: ProgressBar

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // If granted, system notification will show media controls.
            // If denied, media will still play in background, but notification won't appear.
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        loadingSpinner = findViewById(R.id.loadingSpinner)

        setupWebView()
        setupBackNavigation()
        setupMediaActionListener()
        checkNotificationPermission()

        // Load the hosted Pawtify PWA directly into the WebView
        val urlToLoad = runCatching { getString(R.string.target_web_url) }.getOrDefault(TARGET_WEB_URL)
        webView.loadUrl(urlToLoad)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        // Explicitly disable media playback user gesture requirement
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Modern rendering, hardware acceleration and pure black background
        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.black))
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        // Register the JavaScript Interface for communication with the web app
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                // Keep navigation inside the WebView
                return false
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
                // First attempt SPA back routing in web app
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
     * This keeps the JavaScript AudioContext, audio streams, and WebSockets alive when the
     * screen is turned off or the app is minimized.
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
