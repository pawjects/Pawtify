package meow.pawtify.pawjects

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.webkit.WebView

/**
 * Custom WebView designed to prevent Chromium and embedded YouTube iframe APIs from
 * suspending audio playback when the activity is minimized, the window loses focus,
 * or the device screen turns off.
 *
 * By intercepting visibility callbacks and reporting `View.VISIBLE`, the web engine's
 * PageVisibility API (`document.hidden`, `visibilitychange`) is prevented from pausing
 * active media streams.
 */
class BackgroundWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    /**
     * Intercepts window visibility changes and forces View.VISIBLE into the underlying
     * Chromium renderer, preventing YouTube iframes from pausing when backgrounded.
     */
    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(View.VISIBLE)
    }

    override fun dispatchWindowVisibilityChanged(visibility: Int) {
        super.dispatchWindowVisibilityChanged(View.VISIBLE)
    }

    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, View.VISIBLE)
    }

    /**
     * Guard against accidental onPause() calls from external lifecycle observers
     * so JavaScript audio playback continues uninterrupted in the background.
     */
    override fun onPause() {
        // Intentionally no-op to keep AudioContext and media playback active
    }
}
