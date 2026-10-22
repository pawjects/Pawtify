package meow.pawtify.pawjects

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
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
 * Implements standard browser architecture:
 * 1. Native Notification to WebApp via standard Android KeyEvents (KEYCODE_MEDIA_PLAY_PAUSE,
 *    KEYCODE_MEDIA_NEXT, KEYCODE_MEDIA_PREVIOUS) routed directly into the WebView's Chromium engine.
 * 2. WebApp to Native Notification via standard navigator.mediaSession metadata & playbackState observer.
 * 3. Cutout safe insets, hidden soft keyboard on resume, and unthrottled background playback.
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

    // Broadcast receiver to route Media Key Events from MediaPlaybackService into the WebView
    private val mediaKeyReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == MediaPlaybackService.ACTION_BROADCAST_MEDIA_KEY) {
                val keyCode = intent.getIntExtra(MediaPlaybackService.EXTRA_KEY_CODE, KeyEvent.KEYCODE_UNKNOWN)
                if (keyCode != KeyEvent.KEYCODE_UNKNOWN) {
                    dispatchMediaKeyToWebView(keyCode)
                }
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
        super.onCreate(savedInstanceState)

        // Soft input mode: default hidden upon launch and resume
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
        setupMediaKeyListener()
        setupNetworkMonitoring()

        createNotificationChannel()
        checkAndRequestNotificationPermission()
        MediaPlaybackService.startOrUpdate(this)

        showWelcomeDialogIfNeeded()

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
                // Standard MediaSession API Observer injection
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
     * Standard Browser Architecture Fix: Dispatches real hardware media KeyEvents
     * directly into the WebView's Chromium engine.
     */
    private fun dispatchMediaKeyToWebView(keyCode: Int) {
        webView.post {
            webView.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            webView.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_UP, keyCode))
        }
    }

    private fun setupMediaKeyListener() {
        // Direct listener callback from MediaPlaybackService
        MediaPlaybackService.mediaKeyActionListener = { keyCode ->
            dispatchMediaKeyToWebView(keyCode)
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
     * Injects standard navigator.mediaSession observer to forward metadata and playback state
     * to the native Android notification without any hacky DOM lookups.
     */
    private fun injectMediaSessionObserver() {
        val script = """
            (function() {
                if (window.__pawtify_session_hooked) return;
                window.__pawtify_session_hooked = true;
                window.isAndroidContainer = true;

                function syncMetadata(meta) {
                    if (!window.AndroidBridge || !meta) return;
                    try {
                        var title = meta.title || '';
                        var artist = meta.artist || '';
                        var artworkUrl = '';
                        if (meta.artwork && meta.artwork.length > 0) {
                            var art = meta.artwork[meta.artwork.length - 1];
                            artworkUrl = (art && art.src) ? art.src : '';
                        }
                        window.AndroidBridge.updateTrackInfo(title, artist, artworkUrl);
                    } catch (e) {}
                }

                function syncPlayback(state) {
                    if (!window.AndroidBridge) return;
                    try {
                        var isPlaying = (state === 'playing');
                        window.AndroidBridge.updatePlaybackState(isPlaying);
                    } catch (e) {}
                }

                if ('mediaSession' in navigator) {
                    // Initial sync
                    if (navigator.mediaSession.metadata) {
                        syncMetadata(navigator.mediaSession.metadata);
                    }
                    if (navigator.mediaSession.playbackState) {
                        syncPlayback(navigator.mediaSession.playbackState);
                    }

                    // 1. Hook metadata setter
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
                                syncMetadata(val);
                            }
                        });
                    } catch (e) {}

                    // 2. Hook playbackState setter
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
                                syncPlayback(val);
                            }
                        });
                    } catch (e) {}

                    // 3. Robust polling fallback for in-place property mutations
                    var lastTitle = '';
                    var lastArtist = '';
                    var lastState = '';
                    setInterval(function() {
                        try {
                            var m = navigator.mediaSession.metadata;
                            if (m) {
                                if (m.title !== lastTitle || m.artist !== lastArtist) {
                                    lastTitle = m.title || '';
                                    lastArtist = m.artist || '';
                                    syncMetadata(m);
                                }
                            }
                            var s = navigator.mediaSession.playbackState;
                            if (s && s !== lastState) {
                                lastState = s;
                                syncPlayback(s);
                            }
                        } catch (err) {}
                    }, 800);
                }

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
        try {
            networkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
        } catch (ignored: Exception) {}
        noInternetDialog?.dismiss()
        MediaPlaybackService.mediaKeyActionListener = null
        super.onDestroy()
        webView.destroy()
    }
}
