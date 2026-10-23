package meow.pawtify.pawjects

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JavaScript Bridge exposed as `window.AndroidBridge` to the hosted Pawtify web app.
 *
 * Implements dynamic notification lifecycle:
 * 1. Only accepts and caches real, valid track metadata (rejecting dummy placeholders).
 * 2. Starts the Foreground Service ONLY when active playback begins (isPlaying == true)
 *    and real track metadata is available.
 * 3. Updates to paused state when isPlaying == false.
 * 4. Stops the service and dismisses the notification when playback is completely stopped.
 */
class WebAppInterface(
    private val context: Context,
    private val onActionRequested: ((action: String) -> Unit)? = null
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    companion object {
        @Volatile
        var cachedTitle: String? = null
            private set
        @Volatile
        var cachedArtist: String? = null
            private set
        @Volatile
        var cachedArtworkUrl: String? = null
            private set

        fun clearCache() {
            cachedTitle = null
            cachedArtist = null
            cachedArtworkUrl = null
        }
    }

    /**
     * Called by the web app or injected script when a track starts playing or changes metadata.
     * Rejects empty or placeholder strings.
     */
    @JavascriptInterface
    fun updateTrackInfo(title: String?, artist: String?, artworkUrl: String?) {
        if (title.isNullOrBlank() || title == "undefined" || title == "null") return
        val cleanTitle = title.trim()
        if (cleanTitle.equals("Pawtify", ignoreCase = true) ||
            cleanTitle.equals("Unknown Title", ignoreCase = true) ||
            cleanTitle.equals("Ready to Play", ignoreCase = true)
        ) {
            return
        }

        val cleanArtist = if (artist.isNullOrBlank() || artist == "undefined" || artist == "null") "" else artist.trim()
        val cleanArtwork = if (artworkUrl.isNullOrBlank() || artworkUrl == "undefined" || artworkUrl == "null") null else artworkUrl.trim()

        cachedTitle = cleanTitle
        cachedArtist = cleanArtist
        cachedArtworkUrl = cleanArtwork

        mainHandler.post {
            MediaPlaybackService.activeInstance?.onTrackInfoChanged(cleanTitle, cleanArtist, cleanArtwork)
        }
    }

    /**
     * Called by the web app or injected script when playback state changes (play, pause, stop).
     */
    @JavascriptInterface
    fun updatePlaybackState(isPlaying: Boolean) {
        mainHandler.post {
            val title = cachedTitle
            if (isPlaying) {
                // Only start foreground service if real metadata is available
                if (!title.isNullOrBlank()) {
                    MediaPlaybackService.startWithMetadata(
                        context,
                        title,
                        cachedArtist.orEmpty(),
                        cachedArtworkUrl,
                        true
                    )
                }
            } else {
                // If paused, update active service notification
                MediaPlaybackService.activeInstance?.onPlaybackStateChanged(false)
            }
        }
    }

    /**
     * Explicit stop/clear callback called by the web app when playback is dismissed.
     */
    @JavascriptInterface
    fun stopPlayback() {
        clearCache()
        mainHandler.post {
            MediaPlaybackService.stopService(context)
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
