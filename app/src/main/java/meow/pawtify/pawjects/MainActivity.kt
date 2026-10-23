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
import android.graphics.Bitmap
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
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
 * Features:
 * 1. Native AndroidX SplashScreen with a smooth 500ms alpha fade-out transition.
 * 2. Uncluttered PWA integration: All native dialogs and loaders are stripped out,
 *    allowing the webapp's skeleton loader and responsive design to shine.
 * 3. Two-way media bridge:
 *    - WebApp -> Native Notification: Observes navigator.mediaSession to sync metadata & state.
 *    - Native Notification -> WebApp: Dispatches both hardware KeyEvents and JS fallback triggers.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TARGET_WEB_URL = "https://pawtify-meow.vercel.app/"
    }

    private lateinit var webView: BackgroundWebView

    // Broadcast receiver to route Media Actions from MediaPlaybackService into the WebView
    private val mediaKeyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == MediaPlaybackService.ACTION_BROADCAST_MEDIA_KEY) {
                val action = intent.getStringExtra(MediaPlaybackService.EXTRA_ACTION) ?: ""
                val keyCode = intent.getIntExtra(MediaPlaybackService.EXTRA_KEY_CODE, KeyEvent.KEYCODE_UNKNOWN)
                dispatchMediaActionToWebView(action, keyCode)
            }
        }
    }

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                MediaPlaybackService.startOrUpdate(this)
            }
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
        MediaPlaybackService.startOrUpdate(this)

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
                // Inject real-time two-way media session bridge observer
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
     * Dispatches media actions to the WebView using both hardware KeyEvents and direct JS execution.
     */
    private fun dispatchMediaActionToWebView(action: String, keyCode: Int) {
        webView.post {
            // 1. Dispatch standard Android KeyEvent
            if (keyCode != KeyEvent.KEYCODE_UNKNOWN) {
                webView.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
                webView.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
            }

            // 2. Direct JavaScript execution fallback ensuring the web player responds
            val jsAction = when (action) {
                MediaPlaybackService.ACTION_PLAY -> """
                    (function() {
                        var audio = document.querySelector('audio') || document.querySelector('video');
                        if (audio && audio.paused) { try { audio.play(); } catch(e){} }
                        if (window.onAndroidPlay) { try { window.onAndroidPlay(); } catch(e){} }
                        else if (window.onAndroidPlayPause) { try { window.onAndroidPlayPause(); } catch(e){} }
                        var playBtn = document.querySelector('[data-action="play"], [aria-label*="Play" i], [title*="Play" i], button.play');
                        if (playBtn) { playBtn.click(); }
                    })();
                """.trimIndent()

                MediaPlaybackService.ACTION_PAUSE -> """
                    (function() {
                        var audio = document.querySelector('audio') || document.querySelector('video');
                        if (audio && !audio.paused) { try { audio.pause(); } catch(e){} }
                        if (window.onAndroidPause) { try { window.onAndroidPause(); } catch(e){} }
                        else if (window.onAndroidPlayPause) { try { window.onAndroidPlayPause(); } catch(e){} }
                        var pauseBtn = document.querySelector('[data-action="pause"], [aria-label*="Pause" i], [title*="Pause" i], button.pause');
                        if (pauseBtn) { pauseBtn.click(); }
                    })();
                """.trimIndent()

                MediaPlaybackService.ACTION_TOGGLE -> """
                    (function() {
                        var audio = document.querySelector('audio') || document.querySelector('video');
                        if (audio) {
                            if (audio.paused) { try { audio.play(); } catch(e){} } 
                            else { try { audio.pause(); } catch(e){} }
                            return;
                        }
                        if (window.onAndroidPlayPause) { 
                            try { window.onAndroidPlayPause(); return; } catch(e){} 
                        }
                        var toggleBtn = document.querySelector('[data-action="toggle"], [data-action="play-pause"], [aria-label*="Play" i], [aria-label*="Pause" i], .play-pause-btn');
                        if (toggleBtn) { toggleBtn.click(); }
                    })();
                """.trimIndent()

                MediaPlaybackService.ACTION_NEXT -> """
                    (function() {
                        if (window.onAndroidNext) { try { window.onAndroidNext(); return; } catch(e){} }
                        var btn = document.querySelector('[data-action="next"], [aria-label*="Next" i], [title*="Next" i], #next-track, .next-btn, button.next');
                        if (btn) { btn.click(); }
                    })();
                """.trimIndent()

                MediaPlaybackService.ACTION_PREVIOUS -> """
                    (function() {
                        if (window.onAndroidPrevious) { try { window.onAndroidPrevious(); return; } catch(e){} }
                        var btn = document.querySelector('[data-action="prev"], [data-action="previous"], [aria-label*="Previous" i], [title*="Previous" i], #prev-track, .prev-btn, button.prev');
                        if (btn) { btn.click(); }
                    })();
                """.trimIndent()

                else -> null
            }

            if (jsAction != null) {
                webView.evaluateJavascript(jsAction, null)
            }
        }
    }

    private fun setupMediaActionListener() {
        // Direct listener callback from MediaPlaybackService
        MediaPlaybackService.mediaActionListener = { action, keyCode ->
            dispatchMediaActionToWebView(action, keyCode)
        }

        // Broadcast receiver for inter-process or detached events
        val filter = IntentFilter(MediaPlaybackService.ACTION_BROADCAST_MEDIA_KEY)
        ContextCompat.registerReceiver(
            this,
            mediaKeyReceiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
    }

    /**
     * Injects a real-time JavaScript observer that hooks into navigator.mediaSession
     * and HTML5 audio/video events (capturing phase) to sync metadata & state to the native service.
     */
    private fun injectMediaSessionObserver() {
        val script = """
            (function() {
                function extractArtworkUrl(meta) {
                    if (!meta || !meta.artwork) return '';
                    if (Array.isArray(meta.artwork) && meta.artwork.length > 0) {
                        var last = meta.artwork[meta.artwork.length - 1] || meta.artwork[0];
                        return (last && last.src) ? last.src : (typeof last === 'string' ? last : '');
                    }
                    return typeof meta.artwork === 'string' ? meta.artwork : '';
                }

                var lastDispatchedTitle = '';
                var lastDispatchedArtist = '';
                var lastDispatchedArt = '';

                function notifyTrackIfChanged(force) {
                    if (!window.AndroidBridge) return;
                    try {
                        if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
                            var meta = navigator.mediaSession.metadata;
                            var title = (meta && meta.title) ? String(meta.title).trim() : '';
                            var artist = (meta && meta.artist) ? String(meta.artist).trim() : '';
                            var artworkUrl = extractArtworkUrl(meta);

                            if (title && (force || title !== lastDispatchedTitle || artist !== lastDispatchedArtist || artworkUrl !== lastDispatchedArt)) {
                                lastDispatchedTitle = title;
                                lastDispatchedArtist = artist;
                                lastDispatchedArt = artworkUrl;
                                window.AndroidBridge.updateTrackInfo(title, artist, artworkUrl);
                            }
                        }
                    } catch (e) {
                        console.warn('[Pawtify Bridge] notifyTrackIfChanged error:', e);
                    }
                }

                function notifyPlaybackIfChanged(isPlaying) {
                    if (!window.AndroidBridge) return;
                    try {
                        window.AndroidBridge.updatePlaybackState(Boolean(isPlaying));
                    } catch (e) {}
                }

                // Initial sync immediately
                notifyTrackIfChanged(true);

                if ('mediaSession' in navigator) {
                    // Hook navigator.mediaSession.metadata setter
                    try {
                        var proto = Object.getPrototypeOf(navigator.mediaSession);
                        var metaDesc = Object.getOwnPropertyDescriptor(proto, 'metadata')
                                    || Object.getOwnPropertyDescriptor(navigator.mediaSession, 'metadata');
                        var internalMeta = navigator.mediaSession.metadata || null;

                        Object.defineProperty(navigator.mediaSession, 'metadata', {
                            configurable: true,
                            enumerable: true,
                            get: function() {
                                return (metaDesc && metaDesc.get) ? metaDesc.get.call(navigator.mediaSession) : internalMeta;
                            },
                            set: function(val) {
                                internalMeta = val;
                                if (metaDesc && metaDesc.set) {
                                    try { metaDesc.set.call(navigator.mediaSession, val); } catch (err) {}
                                }
                                notifyTrackIfChanged(true);
                            }
                        });
                    } catch (e) {
                        console.warn('[Pawtify Bridge] Could not hook metadata setter property:', e);
                    }

                    // Hook navigator.mediaSession.playbackState setter
                    try {
                        var stateProto = Object.getPrototypeOf(navigator.mediaSession);
                        var stateDesc = Object.getOwnPropertyDescriptor(stateProto, 'playbackState')
                                     || Object.getOwnPropertyDescriptor(navigator.mediaSession, 'playbackState');
                        var internalState = navigator.mediaSession.playbackState || 'none';

                        Object.defineProperty(navigator.mediaSession, 'playbackState', {
                            configurable: true,
                            enumerable: true,
                            get: function() {
                                return (stateDesc && stateDesc.get) ? stateDesc.get.call(navigator.mediaSession) : internalState;
                            },
                            set: function(val) {
                                internalState = val;
                                if (stateDesc && stateDesc.set) {
                                    try { stateDesc.set.call(navigator.mediaSession, val); } catch (err) {}
                                }
                                notifyPlaybackIfChanged(val === 'playing');
                            }
                        });
                    } catch (e) {}
                }

                // Document media events with capture = true
                document.addEventListener('play', function() { notifyPlaybackIfChanged(true); notifyTrackIfChanged(false); }, true);
                document.addEventListener('playing', function() { notifyPlaybackIfChanged(true); notifyTrackIfChanged(false); }, true);
                document.addEventListener('pause', function() { notifyPlaybackIfChanged(false); }, true);
                document.addEventListener('ended', function() { notifyPlaybackIfChanged(false); }, true);

                // Polling safety loop (every 500ms) to guarantee in-place property mutations are synced
                if (!window.__pawtify_metadata_poll_interval) {
                    window.__pawtify_metadata_poll_interval = setInterval(function() {
                        notifyTrackIfChanged(false);
                        if ('mediaSession' in navigator && navigator.mediaSession.playbackState) {
                            notifyPlaybackIfChanged(navigator.mediaSession.playbackState === 'playing');
                        }
                    }, 500);
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
            unregisterReceiver(mediaKeyReceiver)
        } catch (ignored: Exception) {}
        MediaPlaybackService.mediaActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
