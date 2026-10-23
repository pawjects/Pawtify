package meow.pawtify.pawjects

import android.Manifest
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
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
 * 2. Precise Media Controls via direct JavaScript evaluation (NO KeyEvents, avoiding
 *    misclicks on focused DOM elements).
 * 3. Dynamic Notification Lifecycle: Service starts ONLY when playback begins with real metadata,
 *    and terminates when stopped.
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
            // Permission result handled passively; service starts only when music plays
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

    private fun setupEdgeToEdgeInsets() {
        val rootContainer = findViewById<View>(R.id.rootContainer)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
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
     * Injects a passive JavaScript observer in onPageFinished that monitors
     * navigator.mediaSession.metadata and DOM media events, dispatching only REAL metadata.
     */
    private fun injectMediaSessionObserver() {
        val script = """
            (function() {
                function getBestArtwork(meta) {
                    if (!meta || !meta.artwork) return '';
                    if (Array.isArray(meta.artwork) && meta.artwork.length > 0) {
                        var art = meta.artwork[meta.artwork.length - 1] || meta.artwork[0];
                        return (art && art.src) ? art.src : (typeof art === 'string' ? art : '');
                    }
                    return typeof meta.artwork === 'string' ? meta.artwork : '';
                }

                var lastSentTitle = '';
                var lastSentArtist = '';
                var lastSentArt = '';

                function syncRealMetadata() {
                    if (!window.AndroidBridge) return;
                    try {
                        var title = '';
                        var artist = '';
                        var artworkUrl = '';

                        if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
                            var meta = navigator.mediaSession.metadata;
                            title = (meta && meta.title) ? String(meta.title).trim() : '';
                            artist = (meta && meta.artist) ? String(meta.artist).trim() : '';
                            artworkUrl = getBestArtwork(meta);
                        }

                        // Fallback to DOM elements if mediaSession metadata is not yet set
                        if (!title) {
                            var media = document.querySelector('video, audio');
                            if (media && media.title) {
                                title = String(media.title).trim();
                            }
                        }

                        // ONLY dispatch when real non-dummy metadata exists
                        if (title &&
                            title !== 'Pawtify' &&
                            title !== 'Unknown Title' &&
                            title !== 'Ready to Play'
                        ) {
                            if (title !== lastSentTitle || artist !== lastSentArtist || artworkUrl !== lastSentArt) {
                                lastSentTitle = title;
                                lastSentArtist = artist;
                                lastSentArt = artworkUrl;
                                window.AndroidBridge.updateTrackInfo(title, artist, artworkUrl);
                            }
                        }
                    } catch (e) {}
                }

                function syncPlaybackState(isPlaying) {
                    if (!window.AndroidBridge) return;
                    try {
                        window.AndroidBridge.updatePlaybackState(Boolean(isPlaying));
                    } catch (e) {}
                }

                // 1. Hook into document audio/video elements for state (capturing phase)
                document.addEventListener('play', function() { syncRealMetadata(); syncPlaybackState(true); }, true);
                document.addEventListener('playing', function() { syncRealMetadata(); syncPlaybackState(true); }, true);
                document.addEventListener('pause', function() { syncPlaybackState(false); }, true);
                document.addEventListener('ended', function() { syncPlaybackState(false); }, true);

                // 2. Intercept navigator.mediaSession.metadata setter
                if ('mediaSession' in navigator) {
                    try {
                        var proto = Object.getPrototypeOf(navigator.mediaSession);
                        var metaDesc = Object.getOwnPropertyDescriptor(proto, 'metadata')
                                    || Object.getOwnPropertyDescriptor(navigator.mediaSession, 'metadata');
                        var currentMeta = navigator.mediaSession.metadata || null;

                        Object.defineProperty(navigator.mediaSession, 'metadata', {
                            configurable: true,
                            enumerable: true,
                            get: function() {
                                return (metaDesc && metaDesc.get) ? metaDesc.get.call(navigator.mediaSession) : currentMeta;
                            },
                            set: function(val) {
                                currentMeta = val;
                                if (metaDesc && metaDesc.set) {
                                    try { metaDesc.set.call(navigator.mediaSession, val); } catch (err) {}
                                }
                                syncRealMetadata();
                            }
                        });
                    } catch (e) {}
                }

                // 3. Passive polling safety net (every 800ms)
                if (!window.__pawtify_observer_interval) {
                    window.__pawtify_observer_interval = setInterval(function() {
                        syncRealMetadata();
                        var media = document.querySelector('video, audio');
                        if (media) {
                            syncPlaybackState(!media.paused && media.currentTime > 0);
                        } else if ('mediaSession' in navigator && navigator.mediaSession.playbackState) {
                            syncPlaybackState(navigator.mediaSession.playbackState === 'playing');
                        }
                    }, 800);
                }

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
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
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
