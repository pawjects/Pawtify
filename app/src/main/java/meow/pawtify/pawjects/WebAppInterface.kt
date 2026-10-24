package meow.pawtify.pawjects

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.ContextCompat

/**
 * JavaScript Bridge exposed as `window.AndroidBridge` to the hosted Pawtify web app.
 *
 * Implements dynamic notification lifecycle:
 * 1. Accurately receives track metadata and caches it.
 * 2. When updatePlaybackState(true) is received, actively launches MediaPlaybackService
 *    via ContextCompat.startForegroundService() to ensure notification display.
 * 3. Updates to paused state when updatePlaybackState(false) is received.
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
     */
    @JavascriptInterface
    fun updateTrackInfo(title: String?, artist: String?, artworkUrl: String?) {
        if (title.isNullOrBlank() || title == "undefined" || title == "null") return
        val cleanTitle = title.trim()
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
     * Called by the web app or injected script when playback state changes.
     * Actively calls ContextCompat.startForegroundService() when isPlaying is true.
     */
    @JavascriptInterface
    fun updatePlaybackState(isPlaying: Boolean) {
        mainHandler.post {
            if (isPlaying) {
                val title = cachedTitle?.takeIf { it.isNotBlank() } ?: "Now Playing"
                val artist = cachedArtist.orEmpty()
                val artworkUrl = cachedArtworkUrl

                // Actively launch MediaPlaybackService as a Foreground Service
                val intent = Intent(context, MediaPlaybackService::class.java).apply {
                    action = MediaPlaybackService.ACTION_START_WITH_METADATA
                    putExtra(MediaPlaybackService.EXTRA_TITLE, title)
                    putExtra(MediaPlaybackService.EXTRA_ARTIST, artist)
                    putExtra(MediaPlaybackService.EXTRA_ARTWORK_URL, artworkUrl)
                    putExtra(MediaPlaybackService.EXTRA_IS_PLAYING, true)
                }
                try {
                    ContextCompat.startForegroundService(context, intent)
                } catch (e: Exception) {
                    try { context.startService(intent) } catch (ignored: Exception) {}
                }

                MediaPlaybackService.activeInstance?.let { service ->
                    service.onTrackInfoChanged(title, artist, artworkUrl)
                    service.onPlaybackStateChanged(true)
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
