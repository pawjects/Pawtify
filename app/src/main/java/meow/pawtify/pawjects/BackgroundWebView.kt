package meow.pawtify.pawjects

import android.content.Context
import android.util.AttributeSet
import android.view.View
import android.webkit.WebView

/**
 * Custom WebView that:
 * 1. Tricks Chromium and WebKit into always treating the window and view as View.VISIBLE
 *    even when the app is minimized, locked, or backgrounded, preventing Chromium from
 *    suspending timers, pausing HTML5 Audio/WebAudio, or throttling playback.
 * 2. Allows natural IME text focus management without aggressive requestFocus triggers.
 */
class BackgroundWebView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : WebView(context, attrs, defStyleAttr) {

    init {
        isFocusable = true
        isFocusableInTouchMode = true
        isClickable = true
    }

    /**
     * Prevents Chromium from detecting that the window was hidden or minimized.
     */
    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(View.VISIBLE)
    }

    /**
     * Prevents Chromium from detecting view hierarchy invisibility.
     */
    override fun onVisibilityChanged(changedView: View, visibility: Int) {
        super.onVisibilityChanged(changedView, View.VISIBLE)
    }

    /**
     * Ensures dispatched window visibility is permanently reported as VISIBLE.
     */
    override fun dispatchWindowVisibilityChanged(visibility: Int) {
        super.dispatchWindowVisibilityChanged(View.VISIBLE)
    }
}
