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
 * - Notch cutout and navigation bar safe insets via WindowInsetsCompat.
 * - Soft keyboard (IME) resize behavior and touch focusability.
 * - Real-time two-way synchronization with MediaPlaybackService.
 * - Native AMOLED dark Material 3 dialogs (Welcome, No Internet, and Confirm Exit).
 * - App Links / Deep Linking verification for https://pawtify-meow.vercel.app/.
 * - Efficient lifecycle management and clean service teardown.
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

        // Issue 2 Fix: Ensure soft keyboard resizes layout and is immediately interactive
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

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

    /**
     * Issue 6 Fix: Deep Linking and App Links verification handler.
     */
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
     * Issue 1 Fix: WindowInsetsCompat listener on root layout to prevent notch / camera cutout clipping.
     */
    private fun setupEdgeToEdgeInsets() {
        val rootContainer = findViewById<View>(R.id.rootContainer)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            // Apply top padding to safely clear status bar notch and bottom padding for gesture bar
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            windowInsets
        }
    }

    /**
     * Issue 2 Fix: Configures WebView settings and focus for seamless IME input and rendering.
     */
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

        // Ensure focusable for soft keyboard interaction
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true

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
                evaluateJs("window.isAndroidContainer = true; if (window.onAndroidReady) window.onAndroidReady();")
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
     * Issue 3 Fix: Two-way control from native notification to WebView playback controls.
     */
    private fun setupMediaActionListener() {
        MediaPlaybackService.mediaActionListener = { action ->
            webView.post {
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

    /**
     * Issue 5 Fix: Intercepts back navigation to prompt with a styled Confirm Exit Dialog.
     */
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

    /**
     * Issue 5 Fix: Native AMOLED Material 3 Welcome Dialog.
     */
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

    /**
     * Issue 5 Fix: Native AMOLED Material 3 No Internet Dialog with network callback.
     */
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

    /**
     * Issue 5 Fix: Native AMOLED Material 3 Confirm Exit Dialog.
     */
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
     * Background audio continuity: do NOT pause WebView timers or engine when minimized.
     */
    override fun onPause() {
        super.onPause()
    }

    override fun onStop() {
        super.onStop()
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
