package meow.pawtify.pawjects

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
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
 * Main Activity wrapping the hosted Pawtify PWA (`https://pawtify-meow.vercel.app/`).
 *
 * Implements:
 * 1. BackgroundWebView embedding that suppresses window visibility changes,
 *    allowing YouTube iframes and audio players to play continuously when minimized.
 * 2. Deep linking with autoVerify support for `https://pawtify-meow.vercel.app/`.
 * 3. Never calling webView.onPause() or pauseTimers() on activity minimization.
 * 4. Android 13+ POST_NOTIFICATIONS runtime permission requests.
 * 5. MediaPlaybackService synchronization and notification control dispatch.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TARGET_WEB_URL = "https://pawtify-meow.vercel.app/"
        private const val TARGET_HOST = "pawtify-meow.vercel.app"
    }

    private lateinit var webView: BackgroundWebView
    private lateinit var loadingSpinner: ProgressBar

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Notification permission result. Media will play regardless, but notification
            // controls appear in the status bar if granted.
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

        handleIntentUrl(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntentUrl(intent)
    }

    private fun handleIntentUrl(incomingIntent: Intent?) {
        val appLinkData: Uri? = incomingIntent?.data
        if (appLinkData != null && appLinkData.host.equals(TARGET_HOST, ignoreCase = true)) {
            // Direct deep link navigation (e.g., https://pawtify-meow.vercel.app/playlist/...)
            webView.loadUrl(appLinkData.toString())
        } else if (webView.url.isNullOrEmpty()) {
            val fallbackUrl = runCatching { getString(R.string.target_web_url) }.getOrDefault(TARGET_WEB_URL)
            webView.loadUrl(fallbackUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        // Explicitly disable user gesture requirement for media playback
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.black))
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        // Expose JavaScript Interface to the web app
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url ?: return false
                val host = url.host?.lowercase() ?: ""

                // Keep internal app domain navigation inside the WebView
                if (host == TARGET_HOST || host.endsWith(".$TARGET_HOST")) {
                    return false
                }

                // Allow external links (e.g. documentation, help) to open in browser
                return try {
                    val browserIntent = Intent(Intent.ACTION_VIEW, url)
                    startActivity(browserIntent)
                    true
                } catch (e: Exception) {
                    false
                }
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
                // First check if web app wants to handle back action (e.g. close fullscreen player)
                webView.evaluateJavascript("window.onAndroidBackPressed ? window.onAndroidBackPressed() : null") { result ->
                    val handledByWebApp = result == "true" || result == "\"true\""
                    if (!handledByWebApp) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            // Move app task to back instead of destroying activity, ensuring playback continues
                            moveTaskToBack(true)
                        }
                    }
                }
            }
        })
    }

    private fun setupMediaActionListener() {
        MediaPlaybackService.mediaActionListener = { action ->
            runOnUiThread {
                when (action) {
                    MediaPlaybackService.ACTION_PLAY -> {
                        evaluateJs("window.onAndroidPlay ? window.onAndroidPlay() : (window.onAndroidPlayPause ? window.onAndroidPlayPause() : null);")
                    }
                    MediaPlaybackService.ACTION_PAUSE -> {
                        evaluateJs("window.onAndroidPause ? window.onAndroidPause() : (window.onAndroidPlayPause ? window.onAndroidPlayPause() : null);")
                    }
                    MediaPlaybackService.ACTION_TOGGLE -> {
                        evaluateJs("window.onAndroidPlayPause ? window.onAndroidPlayPause() : null;")
                    }
                    MediaPlaybackService.ACTION_NEXT -> {
                        evaluateJs("window.onAndroidNext ? window.onAndroidNext() : null;")
                    }
                    MediaPlaybackService.ACTION_PREVIOUS -> {
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
     * Never call webView.onPause() or webView.pauseTimers() in onPause() or onStop().
     * This keeps the JavaScript audio context, streaming socket, and YouTube iframe engine
     * active when the activity is stopped or minimized.
     */
    override fun onPause() {
        super.onPause()
    }

    override fun onStop() {
        super.onStop()
    }

    override fun onDestroy() {
        MediaPlaybackService.mediaActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
