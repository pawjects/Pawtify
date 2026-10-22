package meow.pawtify.pawjects

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.dialog.MaterialAlertDialogBuilder

/**
 * Main Activity wrapping the hosted Pawtify PWA inside an optimized Android WebView.
 *
 * Implements:
 * 1. Safe insets handling for camera cutouts and notches without content clipping.
 * 2. SOFT_INPUT_STATE_HIDDEN to prevent keyboard from popping up automatically on resume.
 * 3. Never pausing WebView in onPause/onStop to guarantee continuous background audio.
 * 4. Automatic JavaScript injection into the PWA observing navigator.mediaSession.metadata
 *    and HTML5 audio/video tags to synchronize with native MediaPlaybackService notifications in real time.
 * 5. Full two-way control between Android media notifications and the webapp.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        const val TARGET_WEB_URL = "https://pawtify-meow.vercel.app/"
        private const val PREFS_NAME = "pawtify_prefs"
        private const val KEY_WELCOME_SHOWN = "welcome_dialog_shown"
    }

    private lateinit var webView: BackgroundWebView
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var prefs: SharedPreferences

    private var connectivityManager: ConnectivityManager? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var noInternetDialog: AlertDialog? = null

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                MediaPlaybackService.startOrUpdate(this)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fix 2: Prevent aggressive keyboard popup on app resume or launch
        window.setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
        )

        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        webView = findViewById(R.id.webView)
        loadingSpinner = findViewById(R.id.loadingSpinner)

        setupEdgeToEdgeInsets()
        setupWebView()
        setupBackNavigation()
        setupMediaActionListener()
        setupNetworkMonitoring()

        createNotificationChannel()
        checkAndRequestNotificationPermission()
        MediaPlaybackService.startOrUpdate(this)

        showWelcomeDialogIfNeeded()

        // Handle initial intent for Deep Linking or default target URL
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
     * Fix 1: WindowInsetsCompat listener on root layout to prevent notch / camera cutout clipping.
     */
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

        // Fix 3: Expose AndroidBridge interface to JavaScript
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                loadingSpinner.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                loadingSpinner.visibility = View.GONE
                // Fix 3: Inject MediaSession and Audio element observers to automatically bridge PWA metadata
                injectMediaSessionObserver()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true && !isNetworkAvailable()) {
                    showNoInternetDialog()
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                return super.onConsoleMessage(consoleMessage)
            }
        }
    }

    /**
     * Fix 3: Injects a JavaScript hook that transparently observes navigator.mediaSession
     * and HTML5 audio/video tags, guaranteeing metadata is forwarded to AndroidBridge.
     */
    private fun injectMediaSessionObserver() {
        val injectionScript = """
            (function() {
                if (window.__pawtify_observer_injected) return;
                window.__pawtify_observer_injected = true;
                window.isAndroidContainer = true;

                function extractArtwork(artworkArray) {
                    if (!artworkArray || !artworkArray.length) return '';
                    var last = artworkArray[artworkArray.length - 1];
                    return (last && last.src) ? last.src : '';
                }

                function notifyTrackInfo(meta) {
                    if (!window.AndroidBridge || !meta) return;
                    try {
                        var title = meta.title || 'Pawtify';
                        var artist = meta.artist || 'Ready to Play';
                        var artwork = extractArtwork(meta.artwork);
                        window.AndroidBridge.updateTrackInfo(title, artist, artwork);
                    } catch (e) {}
                }

                function notifyPlayback(isPlaying) {
                    if (!window.AndroidBridge) return;
                    try {
                        window.AndroidBridge.updatePlaybackState(Boolean(isPlaying));
                    } catch (e) {}
                }

                // 1. Hook navigator.mediaSession.metadata setter
                if ('mediaSession' in navigator) {
                    if (navigator.mediaSession.metadata) {
                        notifyTrackInfo(navigator.mediaSession.metadata);
                    }

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
                                    metaDesc.set.call(navigator.mediaSession, val);
                                }
                                notifyTrackInfo(val);
                            }
                        });
                    } catch (e) {}

                    // Hook navigator.mediaSession.playbackState
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
                                    stateDesc.set.call(navigator.mediaSession, val);
                                }
                                notifyPlayback(val === 'playing');
                            }
                        });
                    } catch (e) {}
                }

                // 2. Hook HTML5 audio and video elements
                function bindMedia(el) {
                    if (!el || el.__pawtify_bound) return;
                    el.__pawtify_bound = true;
                    el.addEventListener('play', function() { notifyPlayback(true); });
                    el.addEventListener('playing', function() { notifyPlayback(true); });
                    el.addEventListener('pause', function() { notifyPlayback(false); });
                    el.addEventListener('ended', function() { notifyPlayback(false); });
                    if (!el.paused && el.currentTime > 0) {
                        notifyPlayback(true);
                    }
                }

                document.querySelectorAll('audio, video').forEach(bindMedia);

                var obs = new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                        m.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
                                    bindMedia(node);
                                }
                                if (node.querySelectorAll) {
                                    node.querySelectorAll('audio, video').forEach(bindMedia);
                                }
                            }
                        });
                    });
                });
                obs.observe(document.documentElement || document.body, { childList: true, subtree: true });

                if (window.onAndroidReady) {
                    try { window.onAndroidReady(); } catch (e) {}
                }
            })();
        """.trimIndent()
        evaluateJs(injectionScript)
    }

    /**
     * Fix 3: Two-way control from native notification to WebView playback controls.
     */
    private fun setupMediaActionListener() {
        MediaPlaybackService.mediaActionListener = { action ->
            webView.post {
                when (action) {
                    MediaPlaybackService.ACTION_PLAY -> {
                        evaluateJs("""
                            (function() {
                                if (window.onAndroidPlay) {
                                    window.onAndroidPlay();
                                } else if (window.onAndroidPlayPause) {
                                    window.onAndroidPlayPause();
                                } else {
                                    var audio = document.querySelector('audio') || document.querySelector('video');
                                    if (audio) audio.play();
                                    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
                                }
                            })();
                        """.trimIndent())
                    }
                    MediaPlaybackService.ACTION_PAUSE -> {
                        evaluateJs("""
                            (function() {
                                if (window.onAndroidPause) {
                                    window.onAndroidPause();
                                } else if (window.onAndroidPlayPause) {
                                    window.onAndroidPlayPause();
                                } else {
                                    var audio = document.querySelector('audio') || document.querySelector('video');
                                    if (audio) audio.pause();
                                    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
                                }
                            })();
                        """.trimIndent())
                    }
                    MediaPlaybackService.ACTION_TOGGLE -> {
                        evaluateJs("""
                            (function() {
                                if (window.onAndroidPlayPause) {
                                    window.onAndroidPlayPause();
                                    return;
                                }
                                var audio = document.querySelector('audio') || document.querySelector('video');
                                if ('mediaSession' in navigator && navigator.mediaSession.playbackState) {
                                    if (navigator.mediaSession.playbackState === 'playing') {
                                        if (audio) audio.pause();
                                        navigator.mediaSession.playbackState = 'paused';
                                    } else {
                                        if (audio) audio.play();
                                        navigator.mediaSession.playbackState = 'playing';
                                    }
                                } else if (audio) {
                                    if (audio.paused) audio.play(); else audio.pause();
                                }
                            })();
                        """.trimIndent())
                    }
                    MediaPlaybackService.ACTION_NEXT -> {
                        evaluateJs("""
                            (function() {
                                if (window.onAndroidNext) {
                                    window.onAndroidNext();
                                } else {
                                    var btn = document.querySelector('[data-action="next"]') 
                                           || document.querySelector('.next-btn') 
                                           || document.getElementById('next-track');
                                    if (btn) btn.click();
                                }
                            })();
                        """.trimIndent())
                    }
                    MediaPlaybackService.ACTION_PREVIOUS -> {
                        evaluateJs("""
                            (function() {
                                if (window.onAndroidPrevious) {
                                    window.onAndroidPrevious();
                                } else {
                                    var btn = document.querySelector('[data-action="prev"]') 
                                           || document.querySelector('.prev-btn') 
                                           || document.getElementById('prev-track');
                                    if (btn) btn.click();
                                }
                            })();
                        """.trimIndent())
                    }
                }
            }
        }
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
                            showConfirmExitDialog()
                        }
                    }
                }
            }
        })
    }

    private fun showWelcomeDialogIfNeeded() {
        if (!prefs.getBoolean(KEY_WELCOME_SHOWN, false)) {
            MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_Pawtify_MaterialAlertDialog)
                .setTitle("Welcome to Pawtify 🐾")
                .setMessage("Experience seamless background music streaming, notification controls, and offline capabilities tailored for Android.")
                .setPositiveButton("Let's Play") { dialog, _ ->
                    prefs.edit().putBoolean(KEY_WELCOME_SHOWN, true).apply()
                    dialog.dismiss()
                }
                .setCancelable(false)
                .show()
        }
    }

    private fun setupNetworkMonitoring() {
        connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onLost(network: Network) {
                runOnUiThread {
                    if (!isNetworkAvailable()) {
                        showNoInternetDialog()
                    }
                }
            }

            override fun onAvailable(network: Network) {
                runOnUiThread {
                    noInternetDialog?.dismiss()
                    noInternetDialog = null
                }
            }
        }

        try {
            connectivityManager?.registerNetworkCallback(request, networkCallback!!)
        } catch (ignored: Exception) {}
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = connectivityManager ?: return true
        val activeNetwork = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showNoInternetDialog() {
        if (isFinishing || isDestroyed || noInternetDialog?.isShowing == true) return

        noInternetDialog = MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_Pawtify_MaterialAlertDialog)
            .setTitle("No Internet Connection")
            .setMessage("Pawtify requires an active network connection to stream music. Please check your Wi-Fi or mobile data.")
            .setPositiveButton("Retry") { dialog, _ ->
                dialog.dismiss()
                noInternetDialog = null
                if (isNetworkAvailable()) {
                    webView.reload()
                } else {
                    showNoInternetDialog()
                }
            }
            .setNegativeButton("Exit") { _, _ ->
                MediaPlaybackService.stopService(this)
                finishAffinity()
            }
            .setCancelable(false)
            .show()
    }

    private fun showConfirmExitDialog() {
        MaterialAlertDialogBuilder(this, R.style.ThemeOverlay_Pawtify_MaterialAlertDialog)
            .setTitle("Exit Pawtify?")
            .setMessage("Do you want to exit the app and stop background music playback?")
            .setPositiveButton("Exit") { _, _ ->
                MediaPlaybackService.stopService(this)
                finish()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .show()
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

    private fun evaluateJs(script: String) {
        webView.evaluateJavascript(script, null)
    }

    /**
     * Fix 1: STRICT BACKGROUND AUDIO ENFORCEMENT
     * NEVER call webView.onPause() or webView.pauseTimers() in onPause() or onStop().
     * This keeps the JavaScript engine, AudioContext, and media pipeline running when minimized.
     */
    override fun onPause() {
        super.onPause()
        // Strictly no webView.onPause() here
    }

    override fun onStop() {
        super.onStop()
        // Strictly no webView.pauseTimers() here
    }

    override fun onDestroy() {
        try {
            networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        } catch (ignored: Exception) {}
        noInternetDialog?.dismiss()
        MediaPlaybackService.mediaActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
