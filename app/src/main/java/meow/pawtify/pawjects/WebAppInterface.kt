package meow.pawtify.pawjects

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JavaScript Bridge exposed as `window.AndroidBridge` to the hosted Pawtify web app.
 *
 * Dispatches real-time track metadata and playback state updates from the browser's
 * navigator.mediaSession and DOM audio events directly to MediaPlaybackService.
 */
class WebAppInterface(
    private val context: Context,
    private val onActionRequested: ((action: String) -> Unit)? = null
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    /**
     * Called by the web app or injected script when a track starts playing or changes metadata.
     */
    @JavascriptInterface
    fun updateTrackInfo(title: String?, artist: String?, artworkUrl: String?) {
        val safeTitle = if (title.isNullOrBlank() || title == "undefined" || title == "null") "Pawtify" else title.trim()
        val safeArtist = if (artist.isNullOrBlank() || artist == "undefined" || artist == "null") "Ready to Play" else artist.trim()
        val safeArtwork = if (artworkUrl.isNullOrBlank() || artworkUrl == "undefined" || artworkUrl == "null") null else artworkUrl.trim()

        mainHandler.post {
            MediaPlaybackService.updateMetadata(context, safeTitle, safeArtist, safeArtwork)
        }
    }

    /**
     * Called by the web app or injected script when playback state changes (play, pause, stop).
     */
    @JavascriptInterface
    fun updatePlaybackState(isPlaying: Boolean) {
        mainHandler.post {
            MediaPlaybackService.updatePlaybackState(context, isPlaying)
        }
    }

    /**
     * Check if currently running inside the Android wrapper.
     */
    @JavascriptInterface
    fun isAndroid(): Boolean = true

    /**
     * Returns the wrapper version.
     */
    @JavascriptInterface
    fun getVersion(): String = "1.0.0"

    /**
     * Optional toast helper for web app debugging / notifications.
     */
    @JavascriptInterface
    fun showToast(message: String?) {
        if (!message.isNullOrBlank()) {
            mainHandler.post {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
