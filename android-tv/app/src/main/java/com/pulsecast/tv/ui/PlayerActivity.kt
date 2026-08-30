package com.pulsecast.tv.ui

import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.media3.common.MediaItem as ExoMediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.MediaItem
import com.pulsecast.tv.model.ProgressUpdateRequest
import com.pulsecast.tv.model.StreamDownloadRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PlayerActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private var mediaItem: MediaItem? = null
    private var isDownloading = false

    companion object {
        const val EXTRA_MEDIA_ITEM = "extra_media_item"
        private const val TAG = "PlayerActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.player_view)
        @Suppress("DEPRECATION")
        mediaItem = intent.getSerializableExtra(EXTRA_MEDIA_ITEM) as? MediaItem

        if (mediaItem == null) {
            Toast.makeText(this, "Kein Medium ausgewählt", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        setupPlayer()
    }

    private fun setupPlayer() {
        val streamUrl = ApiClient.getStreamUrl(mediaItem?.streamUrl ?: mediaItem?.filename ?: "")
        Log.i(TAG, "Playing stream from URL: $streamUrl")

        player = ExoPlayer.Builder(this).build().apply {
            val exoItem = ExoMediaItem.fromUri(streamUrl)
            setMediaItem(exoItem)

            // Resume progress if present
            val progressSeconds = mediaItem?.progress?.currentTime ?: mediaItem?.progress?.duration ?: 0.0
            if (progressSeconds > 10.0) {
                seekTo((progressSeconds * 1000).toLong())
            }

            addListener(object : Player.Listener {
                override fun onPlayerError(error: PlaybackException) {
                    Log.e(TAG, "ExoPlayer Error: ${error.message}", error)
                    Toast.makeText(this@PlayerActivity, "Wiedergabefehler: ${error.message}", Toast.LENGTH_LONG).show()
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (playbackState == Player.STATE_ENDED) {
                        saveProgress(player?.duration?.toDouble() ?: 0.0, isWatched = true)
                        finish()
                    }
                }
            })

            playWhenReady = true
            prepare()
        }

        playerView.player = player
        playerView.keepScreenOn = true
    }

    private fun saveProgress(currentSeconds: Double, isWatched: Boolean? = null) {
        val item = mediaItem ?: return
        val filename = item.filename.ifEmpty { item.streamUrl ?: "" }
        val durationSeconds = (player?.duration ?: 0L) / 1000.0
        val percentage = if (durationSeconds > 0) (currentSeconds / durationSeconds) * 100 else 0.0

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val req = ProgressUpdateRequest(
                    filename = filename,
                    position = currentSeconds,
                    currentTime = currentSeconds,
                    duration = durationSeconds,
                    seriesTitle = item.metadata?.originalCategory ?: item.metadata?.title,
                    episodeTitle = item.displayTitle,
                    percentage = percentage,
                    isWatched = isWatched ?: (percentage >= 90.0)
                )
                ApiClient.api.saveMediaProgress(req)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save playback progress", e)
            }
        }
    }

    private fun triggerPufferFixDownload() {
        val item = mediaItem ?: return
        if (isDownloading) return
        isDownloading = true

        val streamUrl = item.streamUrl ?: ApiClient.getStreamUrl(item.filename)
        val title = item.displayTitle
        val seriesTitle = item.metadata?.originalCategory ?: item.metadata?.title

        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.downloadStream(
                        StreamDownloadRequest(
                            streamUrl = streamUrl,
                            title = title,
                            seriesTitle = seriesTitle,
                            filename = item.filename
                        )
                    )
                }
                if (res.isSuccessful && res.body()?.success == true) {
                    Toast.makeText(
                        this@PlayerActivity,
                        "📥 Puffer-Fix: Download für \"$title\" auf Server gestartet!",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    Toast.makeText(this@PlayerActivity, "Download-Fehler: ${res.body()?.error}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@PlayerActivity, "Fehler: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                isDownloading = false
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        player?.let { p ->
            return when (keyCode) {
                KeyEvent.KEYCODE_DPAD_LEFT -> {
                    p.seekTo(maxOf(0, p.currentPosition - 10000))
                    playerView.showController()
                    true
                }
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    p.seekTo(minOf(p.duration, p.currentPosition + 30000))
                    playerView.showController()
                    true
                }
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_DPAD_CENTER -> {
                    if (p.isPlaying) p.pause() else p.play()
                    true
                }
                KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                    p.seekTo(minOf(p.duration, p.currentPosition + 30000))
                    true
                }
                KeyEvent.KEYCODE_MEDIA_REWIND -> {
                    p.seekTo(maxOf(0, p.currentPosition - 10000))
                    true
                }
                KeyEvent.KEYCODE_MENU, KeyEvent.KEYCODE_INFO, KeyEvent.KEYCODE_D -> {
                    // Quick Puffer-Fix Download action
                    triggerPufferFixDownload()
                    true
                }
                else -> super.onKeyDown(keyCode, event)
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        player?.let {
            if (it.currentPosition > 0) {
                saveProgress(it.currentPosition / 1000.0)
            }
            it.pause()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.let {
            if (it.currentPosition > 0) {
                saveProgress(it.currentPosition / 1000.0)
            }
            it.release()
        }
        player = null
    }
}
