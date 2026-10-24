package meow.pawtify.pawjects

import android.Manifest
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.animation.doOnEnd
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

/**
 * Main Activity wrapping the hosted Pawtify PWA inside an optimized Android WebView.
 *
 * Implements:
 * 1. Native AndroidX SplashScreen with a smooth 500ms alpha fade-out transition.
 * 2. True edge-to-edge layout with transparent navigation bar and 0 bottom padding gap.
 * 3. Bulletproof JavaScript playback observer that reliably detects mediaSession state
 *    and launches the Foreground Service.
 * 4. Precise Media Controls via direct JavaScript evaluation (NO KeyEvents).
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TARGET_WEB_URL = "https://pawtify-meow.vercel.app/"
    }

    private lateinit var webView: BackgroundWebView

    // Broadcast receiver to route Media Actions from MediaPlaybackService into the WebView
    private val mediaActionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == MediaPlaybackService.ACTION_BROADCAST_MEDIA_KEY) {
                val action = intent.getStringExtra(MediaPlaybackService.EXTRA_ACTION) ?: ""
                dispatchMediaActionToWebView(action)
            }
        }
    }

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Handled passively; notification is shown when playback begins
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install AndroidX SplashScreen before super.onCreate() and setContentView()
        val splashScreen = installSplashScreen()

        // Smooth exit animation: fade out the splash screen over 500ms before removing it
        splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
            val fadeOut = ObjectAnimator.ofFloat(
                splashScreenViewProvider.view,
                View.ALPHA,
                1f,
                0f
            ).apply {
                interpolator = AccelerateDecelerateInterpolator()
                duration = 500L
                doOnEnd {
                    splashScreenViewProvider.remove()
                }
            }
            fadeOut.start()
        }

        // True edge-to-edge rendering BEFORE setContentView()
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }

        super.onCreate(savedInstanceState)

        // Soft input mode: default hidden upon launch and resume
        window.setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
        )

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        setupEdgeToEdgeInsets()
        setupWebView()
        setupBackNavigation()
        setupMediaActionListener()

        createNotificationChannel()
        checkAndRequestNotificationPermission()

        handleIncomingIntent(intent)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        val appLinkData = intent?.data
        if (appLinkData != null && "https".equals(appLinkData.scheme, ignoreCase = true)
            && "pawtify-meow.vercel.app".equals(appLinkData.host, ignoreCase = true)
        ) {
            webView.loadUrl(appLinkData.toString())
        } else {
            val defaultUrl = runCatching { getString(R.string.target_web_url) }.getOrDefault(TARGET_WEB_URL)
            if (webView.url.isNullOrEmpty()) {
                webView.loadUrl(defaultUrl)
            }
        }
    }

    /**
     * Sets insets for system bars, strictly setting bottom padding to 0
     * so the webapp extends completely behind the transparent navigation bar.
     */
    private fun setupEdgeToEdgeInsets() {
        val rootContainer = findViewById<View>(R.id.rootContainer)

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            // Crucial: Bottom padding set specifically to 0 to eliminate any navigation bar gap
            view.setPadding(insets.left, insets.top, insets.right, 0)
            windowInsets
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.black))
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false

        // Bridge registration
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        // Clean WebViewClient without native progress spinners; webapp's skeleton loader handles UX
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject real-time passive observer
                injectMediaSessionObserver()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return super.onConsoleMessage(consoleMessage)
            }
        }
    }

    /**
     * Dispatches media actions directly to the WebView via JavaScript evaluation.
     * Absolutely NO KeyEvents are dispatched, preventing accidental clicks on focused DOM elements.
     */
    private fun dispatchMediaActionToWebView(action: String) {
        val jsScript = when (action) {
            MediaPlaybackService.ACTION_PLAY -> """
                (function() {
                    try {
                        if (window.onAndroidPlay) { window.onAndroidPlay(); }
                        else if (window.onAndroidPlayPause) { window.onAndroidPlayPause(); }
                        else { document.querySelector('video, audio')?.play(); }
                    } catch (e) {}
                })();
            """.trimIndent()

            MediaPlaybackService.ACTION_PAUSE -> """
                (function() {
                    try {
                        if (window.onAndroidPause) { window.onAndroidPause(); }
                        else if (window.onAndroidPlayPause) { window.onAndroidPlayPause(); }
                        else { document.querySelector('video, audio')?.pause(); }
                    } catch (e) {}
                })();
            """.trimIndent()

            MediaPlaybackService.ACTION_TOGGLE -> """
                (function() {
                    try {
                        if (window.onAndroidPlayPause) { window.onAndroidPlayPause(); }
                        else {
                            var media = document.querySelector('video, audio');
                            if (media) {
                                if (media.paused) media.play(); else media.pause();
                            }
                        }
                    } catch (e) {}
                })();
            """.trimIndent()

            MediaPlaybackService.ACTION_NEXT -> """
                (function() {
                    try {
                        if (window.onAndroidNext) { window.onAndroidNext(); }
                    } catch (e) {}
                })();
            """.trimIndent()

            MediaPlaybackService.ACTION_PREVIOUS -> """
                (function() {
                    try {
                        if (window.onAndroidPrevious) { window.onAndroidPrevious(); }
                    } catch (e) {}
                })();
            """.trimIndent()

            else -> null
        }

        if (jsScript != null) {
            webView.post {
                webView.evaluateJavascript(jsScript, null)
            }
        }
    }

    private fun setupMediaActionListener() {
        // Direct listener callback from MediaPlaybackService
        MediaPlaybackService.mediaActionListener = { action ->
            dispatchMediaActionToWebView(action)
        }

        // Broadcast receiver for inter-process or detached events
        val filter = IntentFilter(MediaPlaybackService.ACTION_BROADCAST_MEDIA_KEY)
        ContextCompat.registerReceiver(
            this,
            mediaActionReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
    }

    /**
     * Injects a bulletproof JavaScript observer in onPageFinished.
     * Constantly checks navigator.mediaSession every 1000ms:
     * - If playing: grabs metadata, passes to updateTrackInfo, and calls updatePlaybackState(true)
     * - If paused: calls updatePlaybackState(false)
     */
    private fun injectMediaSessionObserver() {
        val script = """
            (function() {
                function getArtworkUrl(artwork) {
                    if (!artwork) return '';
                    if (Array.isArray(artwork) && artwork.length > 0) {
                        var item = artwork[artwork.length - 1] || artwork[0];
                        return (item && item.src) ? item.src : (typeof item === 'string' ? item : '');
                    }
                    return typeof artwork === 'string' ? artwork : '';
                }

                function checkMediaSessionPlayback() {
                    if (!window.AndroidBridge) return;
                    try {
                        if ('mediaSession' in navigator) {
                            var pState = navigator.mediaSession.playbackState;
                            if (pState === 'playing') {
                                var meta = navigator.mediaSession.metadata;
                                var title = (meta && meta.title) ? meta.title : 'Now Playing';
                                var artist = (meta && meta.artist) ? meta.artist : '';
                                var artworkUrl = (meta && meta.artwork) ? getArtworkUrl(meta.artwork) : '';

                                window.AndroidBridge.updateTrackInfo(title, artist, artworkUrl);
                                window.AndroidBridge.updatePlaybackState(true);
                            } else if (pState === 'paused') {
                                window.AndroidBridge.updatePlaybackState(false);
                            }
                        }
                    } catch (e) {
                        console.warn('[Pawtify Bridge] checkMediaSessionPlayback error:', e);
                    }
                }

                if (!window.__pawtify_playback_observer_interval) {
                    window.__pawtify_playback_observer_interval = setInterval(checkMediaSessionPlayback, 1000);
                }
                checkMediaSessionPlayback();

                // Capturing event listeners for instant state changes
                document.addEventListener('play', checkMediaSessionPlayback, true);
                document.addEventListener('playing', checkMediaSessionPlayback, true);
                document.addEventListener('pause', function() {
                    if (window.AndroidBridge) {
                        try { window.AndroidBridge.updatePlaybackState(false); } catch (e) {}
                    }
                }, true);
                document.addEventListener('ended', function() {
                    if (window.AndroidBridge) {
                        try { window.AndroidBridge.updatePlaybackState(false); } catch (e) {}
                    }
                }, true);

                window.isAndroidContainer = true;
                if (window.onAndroidReady) {
                    try { window.onAndroidReady(); } catch (e) {}
                }
            })();
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript("window.onAndroidBackPressed ? window.onAndroidBackPressed() : null") { result ->
                    val handledByWebApp = result == "true" || result == "\"true\""
                    if (!handledByWebApp) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            finish()
                        }
                    }
                }
            }
        })
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = getString(R.string.notification_channel_name)
            val descriptionText = getString(R.string.notification_channel_description)
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(MediaPlaybackService.CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setSound(null, null)
                enableLights(false)
                enableVibration(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun checkAndRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permission = Manifest.permission.POST_NOTIFICATIONS
            val isGranted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
            if (!isGranted) {
                requestNotificationPermissionLauncher.launch(permission)
            }
        }
    }

    override fun onPause() {
        super.onPause()
    }

    override fun onStop() {
        super.onStop()
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(mediaActionReceiver)
        } catch (ignored: Exception) {}
        MediaPlaybackService.mediaActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
