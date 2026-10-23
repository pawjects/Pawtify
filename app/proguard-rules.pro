# Keep JavascriptInterface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebKit and Media classes
-keep class androidx.webkit.** { *; }
-keep class androidx.media.** { *; }
-keep class androidx.media3.** { *; }
