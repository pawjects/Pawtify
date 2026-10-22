package meow.pawtify.pawjects

import android.content.Context
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import android.webkit.WebView

/**
 * Custom WebView that ensures soft keyboard (IME) input compatibility and focusability.
 *
 * Overrides touch events to guarantee that tapping text input fields inside the WebView
 * requests focus from touch and reliably summons the Android software keyboard.
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

    override fun onTouchEvent(event: MotionEvent?): Boolean {
        if (event != null && (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_UP)) {
            if (!hasFocus()) {
                requestFocus(View.FOCUS_DOWN)
                requestFocusFromTouch()
            }
        }
        return super.onTouchEvent(event)
    }

    override fun onCheckIsTextEditor(): Boolean {
        return true
    }
}
