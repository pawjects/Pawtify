package meow.pawtify.pawjects

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Base64
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.media.app.NotificationCompat.MediaStyle
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

/**
 * Foreground Service responsible for:
 * 1. Background audio playback support (WakeLock + AudioFocus).
 * 2. Real-time media notification with actual track metadata and cover artwork.
 * 3. Media control actions (Play, Pause, Toggle, Next, Previous) routed directly
 *    to MainActivity via Intent/callbacks WITHOUT dispatching KeyEvents (avoiding
 *    accidental clicks on focused web elements).
 * 4. Dynamic lifecycle: ONLY runs when real music is playing, and cleanly terminates
 *    when playback is stopped or dismissed.
 */
class MediaPlaybackService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var artworkFetchJob: Job? = null

    private var mediaSession: MediaSessionCompat? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var notificationManager: NotificationManager? = null

    var currentTitle: String? = null
        private set
    var currentArtist: String? = null
        private set
    var currentArtworkUrl: String? = null
        private set
    var currentArtworkBitmap: Bitmap? = null
        private set
    var isPlaying: Boolean = false
        private set

    companion object {
        const val CHANNEL_ID = "pawtify_media_playback_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_PLAY = "meow.pawtify.pawjects.ACTION_PLAY"
        const val ACTION_PAUSE = "meow.pawtify.pawjects.ACTION_PAUSE"
        const val ACTION_TOGGLE = "meow.pawtify.pawjects.ACTION_TOGGLE"
        const val ACTION_NEXT = "meow.pawtify.pawjects.ACTION_NEXT"
        const val ACTION_PREVIOUS = "meow.pawtify.pawjects.ACTION_PREVIOUS"
        const val ACTION_STOP = "meow.pawtify.pawjects.ACTION_STOP"
        const val ACTION_START_WITH_METADATA = "meow.pawtify.pawjects.ACTION_START_WITH_METADATA"

        // Broadcast action for Media Controls to MainActivity (No KeyEvents)
        const val ACTION_BROADCAST_MEDIA_KEY = "meow.pawtify.pawjects.ACTION_BROADCAST_MEDIA_KEY"
        const val EXTRA_ACTION = "extra_action"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ARTWORK_URL = "extra_artwork_url"
        const val EXTRA_IS_PLAYING = "extra_is_playing"

        @Volatile
        var activeInstance: MediaPlaybackService? = null

        /**
         * Listener invoked when the user interacts with notification controls or lock screen.
         */
        var mediaActionListener: ((action: String) -> Unit)? = null

        /**
         * Starts the foreground service with REAL track metadata.
         */
        fun startWithMetadata(
            context: Context,
            title: String,
            artist: String,
            artworkUrl: String?,
            isPlaying: Boolean
        ) {
            val intent = Intent(context, MediaPlaybackService::class.java).apply {
                action = ACTION_START_WITH_METADATA
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_ARTIST, artist)
                putExtra(EXTRA_ARTWORK_URL, artworkUrl)
                putExtra(EXTRA_IS_PLAYING, isPlaying)
            }
            try {
                ContextCompat.startForegroundService(context, intent)
            } catch (ignored: Exception) {}
            activeInstance?.let { instance ->
                instance.onTrackInfoChanged(title, artist, artworkUrl)
                instance.onPlaybackStateChanged(isPlaying)
            }
        }

        fun updateMetadata(context: Context, title: String, artist: String, artworkUrl: String?) {
            activeInstance?.onTrackInfoChanged(title, artist, artworkUrl)
        }

        fun updatePlaybackState(context: Context, isPlaying: Boolean) {
            activeInstance?.onPlaybackStateChanged(isPlaying)
        }

        fun stopService(context: Context) {
            activeInstance?.let { instance ->
                instance.cleanupAndStop()
            } ?: run {
                val intent = Intent(context, MediaPlaybackService::class.java).apply {
                    action = ACTION_STOP
                }
                context.stopService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        activeInstance = this
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        createNotificationChannel()
        setupMediaSession()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()

        if (intent != null) {
            when (intent.action) {
                ACTION_PLAY -> {
                    dispatchMediaAction(ACTION_PLAY)
                    onPlaybackStateChanged(true)
                }
                ACTION_PAUSE -> {
                    dispatchMediaAction(ACTION_PAUSE)
                    onPlaybackStateChanged(false)
                }
                ACTION_TOGGLE -> {
                    dispatchMediaAction(ACTION_TOGGLE)
                    onPlaybackStateChanged(!isPlaying)
                }
                ACTION_NEXT -> {
                    dispatchMediaAction(ACTION_NEXT)
                }
                ACTION_PREVIOUS -> {
                    dispatchMediaAction(ACTION_PREVIOUS)
                }
                ACTION_STOP -> {
                    cleanupAndStop()
                    return START_NOT_STICKY
                }
                ACTION_START_WITH_METADATA -> {
                    val title = intent.getStringExtra(EXTRA_TITLE)
                    val artist = intent.getStringExtra(EXTRA_ARTIST).orEmpty()
                    val artwork = intent.getStringExtra(EXTRA_ARTWORK_URL)
                    val playing = intent.getBooleanExtra(EXTRA_IS_PLAYING, true)

                    if (!title.isNullOrBlank()) {
                        onTrackInfoChanged(title, artist, artwork)
                        onPlaybackStateChanged(playing)
                    }
                }
                else -> {
                    if (intent.hasExtra(EXTRA_TITLE)) {
                        val title = intent.getStringExtra(EXTRA_TITLE)
                        val artist = intent.getStringExtra(EXTRA_ARTIST).orEmpty()
                        val artwork = intent.getStringExtra(EXTRA_ARTWORK_URL)
                        if (!title.isNullOrBlank()) {
                            onTrackInfoChanged(title, artist, artwork)
                        }
                    }

                    if (intent.hasExtra(EXTRA_IS_PLAYING)) {
                        val playing = intent.getBooleanExtra(EXTRA_IS_PLAYING, false)
                        onPlaybackStateChanged(playing)
                    }
                }
            }
        }

        startOrRefreshForeground()
        return START_STICKY
    }

    /**
     * Dispatches media actions directly to MainActivity WITHOUT KeyEvents.
     */
    private fun dispatchMediaAction(action: String) {
        mediaActionListener?.invoke(action)

        val broadcastIntent = Intent(ACTION_BROADCAST_MEDIA_KEY).apply {
            setPackage(packageName)
            putExtra(EXTRA_ACTION, action)
        }
        sendBroadcast(broadcastIntent)
    }

    /**
     * Direct real-time callback when track metadata arrives from WebAppInterface.
     */
    fun onTrackInfoChanged(title: String?, artist: String?, artworkUrl: String?) {
        if (title.isNullOrBlank()) return

        val cleanTitle = title.trim()
        val cleanArtist = artist?.trim().orEmpty()

        val metadataChanged = cleanTitle != currentTitle || cleanArtist != currentArtist
        currentTitle = cleanTitle
        currentArtist = cleanArtist

        if (artworkUrl != currentArtworkUrl) {
            currentArtworkUrl = artworkUrl
            loadArtworkBitmapAsync(artworkUrl)
        } else if (metadataChanged) {
            startOrRefreshForeground()
        }
    }

    /**
     * Direct real-time callback when play/pause state changes in WebAppInterface.
     */
    fun onPlaybackStateChanged(playing: Boolean) {
        isPlaying = playing
        if (isPlaying) {
            acquireWakeLock()
            requestAudioFocus()
        } else {
            releaseWakeLock()
        }
        startOrRefreshForeground()
    }

    private fun setupMediaSession() {
        mediaSession = MediaSessionCompat(this, "PawtifyMediaSession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    dispatchMediaAction(ACTION_PLAY)
                    onPlaybackStateChanged(true)
                }

                override fun onPause() {
                    dispatchMediaAction(ACTION_PAUSE)
                    onPlaybackStateChanged(false)
                }

                override fun onSkipToNext() {
                    dispatchMediaAction(ACTION_NEXT)
                }

                override fun onSkipToPrevious() {
                    dispatchMediaAction(ACTION_PREVIOUS)
                }

                override fun onStop() {
                    cleanupAndStop()
                }
            })
            isActive = true
        }
    }

    /**
     * Updates playback state, media session metadata, and notification.
     * Only displays a notification if real track metadata exists.
     */
    private fun startOrRefreshForeground() {
        val title = currentTitle?.takeIf { it.isNotBlank() } ?: if (isPlaying) "Now Playing" else null
        // Do NOT show notification if no track metadata is available and not playing
        if (title.isNullOrBlank()) {
            if (!isPlaying) {
                cleanupAndStop()
            }
            return
        }

        createNotificationChannel()

        val stateActions = PlaybackStateCompat.ACTION_PLAY or
                PlaybackStateCompat.ACTION_PAUSE or
                PlaybackStateCompat.ACTION_PLAY_PAUSE or
                PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                PlaybackStateCompat.ACTION_STOP

        val playbackState = PlaybackStateCompat.Builder()
            .setActions(stateActions)
            .setState(
                if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
                PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN,
                1.0f
            )
            .build()
        mediaSession?.setPlaybackState(playbackState)

        val metadataArtwork = currentArtworkBitmap
        val metadataBuilder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist.orEmpty())

        if (metadataArtwork != null) {
            metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, metadataArtwork)
            metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, metadataArtwork)
        }
        mediaSession?.setMetadata(metadataBuilder.build())

        val notification = buildNotification(title, currentArtist.orEmpty(), metadataArtwork)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            notificationManager?.notify(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(title: String, artist: String, largeArtwork: Bitmap?): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Previous Action
        val prevIntent = Intent(this, MediaPlaybackService::class.java).apply { action = ACTION_PREVIOUS }
        val prevPendingIntent = PendingIntent.getService(
            this, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Play/Pause Action
        val toggleAction = if (isPlaying) ACTION_PAUSE else ACTION_PLAY
        val toggleIcon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play
        val toggleLabel = if (isPlaying) getString(R.string.action_pause) else getString(R.string.action_play)
        val toggleIntent = Intent(this, MediaPlaybackService::class.java).apply { action = toggleAction }
        val togglePendingIntent = PendingIntent.getService(
            this, 2, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Next Action
        val nextIntent = Intent(this, MediaPlaybackService::class.java).apply { action = ACTION_NEXT }
        val nextPendingIntent = PendingIntent.getService(
            this, 3, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(artist)
            .setSubText("Pawtify")
            .setSmallIcon(R.drawable.ic_music_note)
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setColor(ContextCompat.getColor(this, R.color.cyan_accent))
            .setColorized(true)
            .addAction(R.drawable.ic_skip_previous, getString(R.string.action_previous), prevPendingIntent)
            .addAction(toggleIcon, toggleLabel, togglePendingIntent)
            .addAction(R.drawable.ic_skip_next, getString(R.string.action_next), nextPendingIntent)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession?.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )

        if (largeArtwork != null) {
            builder.setLargeIcon(largeArtwork)
        }

        return builder.build()
    }

    /**
     * Asynchronously fetches cover artwork with standard headers, protocol normalization,
     * and base64 data-URI support.
     */
    private fun loadArtworkBitmapAsync(urlStr: String?) {
        artworkFetchJob?.cancel()

        if (urlStr.isNullOrEmpty()) {
            currentArtworkBitmap = null
            startOrRefreshForeground()
            return
        }

        artworkFetchJob = serviceScope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                try {
                    val finalUrl = when {
                        urlStr.startsWith("//") -> "https:$urlStr"
                        urlStr.startsWith("http://") -> "https://" + urlStr.removePrefix("http://")
                        else -> urlStr
                    }

                    if (finalUrl.startsWith("data:image")) {
                        val base64Data = finalUrl.substringAfter("base64,")
                        val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    } else {
                        val url = URL(finalUrl)
                        val connection = url.openConnection() as HttpURLConnection
                        connection.connectTimeout = 6000
                        connection.readTimeout = 6000
                        connection.instanceFollowRedirects = true
                        connection.doInput = true
                        connection.setRequestProperty(
                            "User-Agent",
                            "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                        )
                        connection.setRequestProperty("Accept", "image/webp,image/apng,image/*,*/*;q=0.8")
                        connection.connect()

                        if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                            connection.inputStream.use { stream ->
                                BitmapFactory.decodeStream(stream)
                            }
                        } else {
                            null
                        }
                    }
                } catch (e: Exception) {
                    null
                }
            }
            currentArtworkBitmap = bitmap
            startOrRefreshForeground()
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = getString(R.string.notification_channel_name)
            val descriptionText = getString(R.string.notification_channel_description)
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                setSound(null, null)
                enableLights(false)
                enableVibration(false)
            }
            notificationManager?.createNotificationChannel(channel)
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = powerManager?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "Pawtify::AudioPlaybackWakeLock"
            )?.apply {
                setReferenceCounted(false)
            }
        }
        if (wakeLock?.isHeld == false) {
            wakeLock?.acquire(24 * 60 * 60 * 1000L) // 24 hour safety timeout
        }
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) {
            try {
                wakeLock?.release()
            } catch (ignored: Exception) {}
        }
    }

    private fun requestAudioFocus() {
        audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val attributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()

            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener { focusChange ->
                    when (focusChange) {
                        AudioManager.AUDIOFOCUS_LOSS,
                        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
                        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                            dispatchMediaAction(ACTION_PAUSE)
                            onPlaybackStateChanged(false)
                        }
                        AudioManager.AUDIOFOCUS_GAIN -> {
                            dispatchMediaAction(ACTION_PLAY)
                            onPlaybackStateChanged(true)
                        }
                    }
                }
                .build()

            audioFocusRequest?.let { audioManager?.requestAudioFocus(it) }
        } else {
            @Suppress("DEPRECATION")
            audioManager?.requestAudioFocus(
                { focusChange ->
                    if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                        dispatchMediaAction(ACTION_PAUSE)
                        onPlaybackStateChanged(false)
                    }
                },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        cleanupAndStop()
    }

    private fun cleanupAndStop() {
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        notificationManager?.cancel(NOTIFICATION_ID)
        mediaSession?.isActive = false
        mediaSession?.release()
        activeInstance = null
        stopSelf()
    }

    override fun onDestroy() {
        activeInstance = null
        serviceScope.cancel()
        releaseWakeLock()
        mediaSession?.isActive = false
        mediaSession?.release()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager?.abandonAudioFocusRequest(audioFocusRequest!!)
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
