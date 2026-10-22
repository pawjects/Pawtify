package com.pawtify.app

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.widget.Toast

/**
 * JavaScript Bridge exposed as `window.AndroidBridge` to the embedded Pawtify web app.
 *
 * Allows two-way communication:
 * - Web app informs native Android about current song metadata and playback state.
 * - Native Android media notification controls dispatch actions back into the WebView.
 */
class WebAppInterface(
    private val context: Context,
    private val onActionRequested: ((action: String) -> Unit)? = null
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    /**
     * Called by the web app when a track starts playing or changes.
     */
    @JavascriptInterface
    fun updateTrackInfo(title: String, artist: String, artworkUrl: String) {
        MusicPlaybackService.updateMetadata(context, title, artist, artworkUrl)
    }

    /**
     * Called by the web app when playback state changes (play, pause, stop).
     */
    @JavascriptInterface
    fun updatePlaybackState(isPlaying: Boolean) {
        MusicPlaybackService.updatePlaybackState(context, isPlaying)
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
    fun showToast(message: String) {
        mainHandler.post {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }
}
