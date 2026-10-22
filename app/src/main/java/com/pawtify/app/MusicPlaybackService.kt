package com.pawtify.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
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
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.media.app.NotificationCompat.MediaStyle
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.URL

/**
 * Foreground Service responsible for:
 * 1. Maintaining media playback in the background via partial WakeLock and AudioFocus.
 * 2. Displaying an Android MediaStyle notification with Title, Artist, Cover artwork, and Play/Pause/Skip actions.
 * 3. Handling MediaSession transport controls and routing user actions back to the WebView.
 */
class MusicPlaybackService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private var mediaSession: MediaSessionCompat? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null

    private var currentTitle: String = "Pawtify"
    private var currentArtist: String = "Ready to Play"
    private var currentArtworkUrl: String? = null
    private var currentArtworkBitmap: Bitmap? = null
    private var isPlaying: Boolean = false

    companion object {
        const val CHANNEL_ID = "pawtify_media_playback_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_PLAY = "com.pawtify.app.ACTION_PLAY"
        const val ACTION_PAUSE = "com.pawtify.app.ACTION_PAUSE"
        const val ACTION_TOGGLE = "com.pawtify.app.ACTION_TOGGLE"
        const val ACTION_NEXT = "com.pawtify.app.ACTION_NEXT"
        const val ACTION_PREVIOUS = "com.pawtify.app.ACTION_PREVIOUS"
        const val ACTION_STOP = "com.pawtify.app.ACTION_STOP"

        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_ARTIST = "extra_artist"
        const val EXTRA_ARTWORK_URL = "extra_artwork_url"
        const val EXTRA_IS_PLAYING = "extra_is_playing"

        /**
         * Listener interface for UI / WebView notification callbacks.
         */
        var mediaActionListener: ((action: String) -> Unit)? = null

        fun updateMetadata(context: Context, title: String, artist: String, artworkUrl: String?) {
            val intent = Intent(context, MusicPlaybackService::class.java).apply {
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_ARTIST, artist)
                putExtra(EXTRA_ARTWORK_URL, artworkUrl)
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun updatePlaybackState(context: Context, isPlaying: Boolean) {
            val intent = Intent(context, MusicPlaybackService::class.java).apply {
                putExtra(EXTRA_IS_PLAYING, isPlaying)
            }
            ContextCompat.startForegroundService(context, intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        setupMediaSession()
        acquireWakeLock()
        requestAudioFocus()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            when (intent.action) {
                ACTION_PLAY -> {
                    mediaActionListener?.invoke(ACTION_PLAY)
                    updatePlaybackStateInternal(true)
                }
                ACTION_PAUSE -> {
                    mediaActionListener?.invoke(ACTION_PAUSE)
                    updatePlaybackStateInternal(false)
                }
                ACTION_TOGGLE -> {
                    mediaActionListener?.invoke(ACTION_TOGGLE)
                    updatePlaybackStateInternal(!isPlaying)
                }
                ACTION_NEXT -> {
                    mediaActionListener?.invoke(ACTION_NEXT)
                }
                ACTION_PREVIOUS -> {
                    mediaActionListener?.invoke(ACTION_PREVIOUS)
                }
                ACTION_STOP -> {
                    mediaActionListener?.invoke(ACTION_STOP)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    return START_NOT_STICKY
                }
                else -> {
                    // Update metadata if extras present
                    if (intent.hasExtra(EXTRA_TITLE)) {
                        currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: "Pawtify"
                        currentArtist = intent.getStringExtra(EXTRA_ARTIST) ?: "Unknown Artist"
                        val newArtwork = intent.getStringExtra(EXTRA_ARTWORK_URL)
                        if (newArtwork != currentArtworkUrl) {
                            currentArtworkUrl = newArtwork
                            loadArtworkBitmap(newArtwork)
                        }
                    }

                    if (intent.hasExtra(EXTRA_IS_PLAYING)) {
                        isPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, false)
                    }
                }
            }
        }

        updateNotification()
        return START_STICKY
    }

    private fun updatePlaybackStateInternal(playing: Boolean) {
        isPlaying = playing
        if (isPlaying) {
            acquireWakeLock()
            requestAudioFocus()
        } else {
            releaseWakeLock()
        }
        updateNotification()
    }

    private fun setupMediaSession() {
        mediaSession = MediaSessionCompat(this, "PawtifySession").apply {
            setCallback(object : MediaSessionCompat.Callback() {
                override fun onPlay() {
                    mediaActionListener?.invoke(ACTION_PLAY)
                    updatePlaybackStateInternal(true)
                }

                override fun onPause() {
                    mediaActionListener?.invoke(ACTION_PAUSE)
                    updatePlaybackStateInternal(false)
                }

                override fun onSkipToNext() {
                    mediaActionListener?.invoke(ACTION_NEXT)
                }

                override fun onSkipToPrevious() {
                    mediaActionListener?.invoke(ACTION_PREVIOUS)
                }

                override fun onStop() {
                    mediaActionListener?.invoke(ACTION_STOP)
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                }
            })
            isActive = true
        }
    }

    private fun updateNotification() {
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

        val metadataBuilder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)

        if (currentArtworkBitmap != null) {
            metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentArtworkBitmap)
        }
        mediaSession?.setMetadata(metadataBuilder.build())

        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun buildNotification(): Notification {
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
        val prevIntent = Intent(this, MusicPlaybackService::class.java).apply { action = ACTION_PREVIOUS }
        val prevPendingIntent = PendingIntent.getService(
            this, 1, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Play/Pause Action
        val toggleAction = if (isPlaying) ACTION_PAUSE else ACTION_PLAY
        val toggleIcon = if (isPlaying) R.drawable.ic_pause else R.drawable.ic_play
        val toggleLabel = if (isPlaying) getString(R.string.action_pause) else getString(R.string.action_play)
        val toggleIntent = Intent(this, MusicPlaybackService::class.java).apply { action = toggleAction }
        val togglePendingIntent = PendingIntent.getService(
            this, 2, toggleIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Next Action
        val nextIntent = Intent(this, MusicPlaybackService::class.java).apply { action = ACTION_NEXT }
        val nextPendingIntent = PendingIntent.getService(
            this, 3, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSubText("Pawtify")
            .setSmallIcon(R.drawable.ic_music_note)
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .addAction(R.drawable.ic_skip_previous, getString(R.string.action_previous), prevPendingIntent)
            .addAction(toggleIcon, toggleLabel, togglePendingIntent)
            .addAction(R.drawable.ic_skip_next, getString(R.string.action_next), nextPendingIntent)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession?.sessionToken)
                    .setShowActionsInCompactView(0, 1, 2)
            )

        if (currentArtworkBitmap != null) {
            builder.setLargeIcon(currentArtworkBitmap)
        }

        return builder.build()
    }

    private fun loadArtworkBitmap(urlStr: String?) {
        if (urlStr.isNullOrEmpty()) {
            currentArtworkBitmap = null
            updateNotification()
            return
        }

        serviceScope.launch {
            val bitmap = withContext(Dispatchers.IO) {
                try {
                    val connection = URL(urlStr).openConnection()
                    connection.connectTimeout = 5000
                    connection.readTimeout = 5000
                    connection.doInput = true
                    connection.connect()
                    val inputStream = connection.getInputStream()
                    BitmapFactory.decodeStream(inputStream)
                } catch (e: Exception) {
                    null
                }
            }
            if (bitmap != null) {
                currentArtworkBitmap = bitmap
                updateNotification()
            }
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
                setSound(null, null)
                enableLights(false)
                enableVibration(false)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
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
            wakeLock?.acquire(3 * 60 * 60 * 1000L) // 3 hours timeout safety
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
                        AudioManager.AUDIOFOCUS_LOSS -> {
                            mediaActionListener?.invoke(ACTION_PAUSE)
                            updatePlaybackStateInternal(false)
                        }
                        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
                        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                            mediaActionListener?.invoke(ACTION_PAUSE)
                            updatePlaybackStateInternal(false)
                        }
                        AudioManager.AUDIOFOCUS_GAIN -> {
                            mediaActionListener?.invoke(ACTION_PLAY)
                            updatePlaybackStateInternal(true)
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
                        mediaActionListener?.invoke(ACTION_PAUSE)
                        updatePlaybackStateInternal(false)
                    }
                },
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        releaseWakeLock()
        mediaSession?.isActive = false
        mediaSession?.release()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager?.abandonAudioFocusRequest(audioFocusRequest!!)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
