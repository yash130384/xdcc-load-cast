package com.pulsecast.tv.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.DetailsSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.BatchDownloadRequest
import com.pulsecast.tv.model.BatchEpisodeItem
import com.pulsecast.tv.model.MediaItem
import com.pulsecast.tv.model.XtreamDownloadRequest
import com.pulsecast.tv.presenter.CardPresenter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DetailsActivity : FragmentActivity() {

    companion object {
        const val EXTRA_MEDIA_ITEM = "extra_media_item"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)

        if (savedInstanceState == null) {
            val mediaItem = @Suppress("DEPRECATION") intent.getSerializableExtra(EXTRA_MEDIA_ITEM) as? MediaItem
            val fragment = DetailsFragment().apply {
                arguments = Bundle().apply {
                    putSerializable(EXTRA_MEDIA_ITEM, mediaItem)
                }
            }
            supportFragmentManager.beginTransaction()
                .replace(R.id.details_fragment, fragment)
                .commitNow()
        }
    }
}

class DetailsFragment : DetailsSupportFragment() {

    private var mediaItem: MediaItem? = null
    private lateinit var rowsAdapter: ArrayObjectAdapter
    private lateinit var detailsOverview: DetailsOverviewRow
    private val actionAdapter = ArrayObjectAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        @Suppress("DEPRECATION")
        mediaItem = arguments?.getSerializable(DetailsActivity.EXTRA_MEDIA_ITEM) as? MediaItem

        setupDetailsOverview()
        
        if (mediaItem?.isGroup == true) {
            loadSeriesEpisodes()
        }
    }

    private fun setupDetailsOverview() {
        val item = mediaItem ?: return

        detailsOverview = DetailsOverviewRow(item)
        val posterUrl = ApiClient.getPosterUrl(item.displayPoster)
        if (!posterUrl.isNullOrEmpty()) {
            Glide.with(this)
                .asBitmap()
                .load(posterUrl)
                .into(object : com.bumptech.glide.request.target.CustomTarget<android.graphics.Bitmap>() {
                    override fun onResourceReady(resource: android.graphics.Bitmap, transition: com.bumptech.glide.request.transition.Transition<in android.graphics.Bitmap>?) {
                        detailsOverview.setImageBitmap(requireContext(), resource)
                        rowsAdapter.notifyArrayItemRangeChanged(0, 1)
                    }
                    override fun onLoadCleared(placeholder: android.graphics.drawable.Drawable?) {}
                })
        }

        if (!item.isGroup) {
            actionAdapter.add(Action(ACTION_PLAY, getString(R.string.action_play)))
            if (item.isXtream && !item.isLive) {
                actionAdapter.add(Action(ACTION_DOWNLOAD, getString(R.string.action_download)))
            }
        } else {
            // Series actions - initially basic, updated after load
            actionAdapter.add(Action(ACTION_PLAY, "▶ Serie abspielen"))
            
            // "Downloadbutton" for Series: Batch Download or Auto Download
            if (item.isXtream) {
                actionAdapter.add(Action(ACTION_BATCH_DOWNLOAD, "📥 Ganze Staffel laden"))
            } else {
                actionAdapter.add(Action(ACTION_BATCH_DOWNLOAD, "📥 Auto-Download / Suche starten"))
            }
        }
        detailsOverview.actionsAdapter = actionAdapter

        val helper = FullWidthDetailsOverviewRowPresenter(object : AbstractDetailsDescriptionPresenter() {
            override fun onBindDescription(viewHolder: ViewHolder, item: Any) {
                val media = item as? MediaItem ?: return
                viewHolder.title.text = media.displayTitle
                viewHolder.subtitle.text = media.displaySubtitle
                viewHolder.body.text = media.cast ?: ""
            }
        })
        helper.backgroundColor = ContextCompat.getColor(requireContext(), R.color.card_background)
        helper.setOnActionClickedListener { action ->
            when (action.id) {
                ACTION_PLAY -> {
                    val playTarget = if (item.isGroup && item.files.isNotEmpty()) item.files.first() else item
                    val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_MEDIA_ITEM, playTarget)
                    }
                    startActivity(intent)
                }
                ACTION_DOWNLOAD -> {
                    triggerDownload(item)
                }
                ACTION_BATCH_DOWNLOAD -> {
                    if (item.isXtream) {
                        triggerBatchDownload(item)
                    } else {
                        // Trigger local check
                        triggerLocalSearch(item)
                    }
                }
            }
        }

        val ps = ClassPresenterSelector().apply {
            addClassPresenter(DetailsOverviewRow::class.java, helper)
            addClassPresenter(ListRow::class.java, ListRowPresenter())
        }

        rowsAdapter = ArrayObjectAdapter(ps)
        rowsAdapter.add(detailsOverview)

        onItemViewClickedListener = OnItemViewClickedListener { _, clickedItem, _, _ ->
            if (clickedItem is MediaItem) {
                val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
                    putExtra(PlayerActivity.EXTRA_MEDIA_ITEM, clickedItem)
                }
                startActivity(intent)
            }
        }

        adapter = rowsAdapter
    }

    private fun loadSeriesEpisodes() {
        val item = mediaItem ?: return
        
        lifecycleScope.launch {
            try {
                var files = item.files
                
                // Fetch Xtream episodes if necessary
                if (item.isXtream && item.xtreamSeriesId != null) {
                    val res = withContext(Dispatchers.IO) {
                        try { ApiClient.api.getXtreamSeriesEpisodes(item.xtreamSeriesId) } catch (e: Exception) { null }
                    }
                    if (res != null && res.isSuccessful) {
                        files = res.body()?.episodes ?: emptyList()
                        // Update mediaItem files so Batch Download works
                        mediaItem = item.copy(files = files)
                    }
                }

                if (files.isEmpty()) return@launch
                
                // Parse seasons
                val seasonMap = mutableMapOf<Int, MutableList<MediaItem>>()
                files.forEach { file ->
                    val season = file.season ?: extractSeason(file)
                    if (!seasonMap.containsKey(season)) seasonMap[season] = mutableListOf()
                    seasonMap[season]!!.add(file)
                }

                val sortedSeasons = seasonMap.keys.sorted()
                var headerId = 1L
                sortedSeasons.forEach { s ->
                    val eps = seasonMap[s]!!.sortedBy { it.episodeNum ?: 1 }
                    val epAdapter = ArrayObjectAdapter(CardPresenter())
                    eps.forEach { epAdapter.add(it) }
                    
                    val title = "Staffel " + s + " (" + eps.size + " Folgen)"
                    rowsAdapter.add(ListRow(HeaderItem(headerId++, title), epAdapter))
                }

            } catch (e: Exception) {
                // Ignore load error
            }
        }
    }

    private fun extractSeason(item: MediaItem): Int {
        val sEp = item.metadata?.seasonEpisode ?: item.filename ?: ""
        val m1 = Regex("(?i)S(\\d+)E\\d+").find(sEp)
        if (m1 != null) return m1.groupValues[1].toInt()
        
        val m2 = Regex("(?i)(\\d+)x\\d+").find(sEp)
        if (m2 != null) return m2.groupValues[1].toInt()
        
        val m3 = Regex("(?i)Staffel\\s*(\\d+)").find(sEp)
        if (m3 != null) return m3.groupValues[1].toInt()
        
        return 1
    }

    private fun triggerDownload(item: MediaItem) {
        val streamUrl = item.streamUrl ?: return
        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.startXtreamDownload(
                        XtreamDownloadRequest(
                            url = streamUrl,
                            title = item.displayTitle,
                            seriesTitle = item.metadata?.title
                        )
                    )
                }
                if (res.isSuccessful && res.body()?.success == true) {
                    Toast.makeText(requireContext(), "Download gestartet! 📥", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(requireContext(), "Fehler: " + res.body()?.error, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Fehler: " + e.message, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun triggerBatchDownload(series: MediaItem) {
        val batchItems = series.files.mapNotNull { ep ->
            val url = ep.streamUrl ?: ""
            if (url.isNotEmpty()) BatchEpisodeItem(url = url, title = ep.displayTitle) else null
        }

        if (batchItems.isEmpty()) {
            Toast.makeText(requireContext(), "Keine herunterladbaren Folgen gefunden. (Wird geladen?)", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.startBatchDownload(
                        BatchDownloadRequest(
                            seriesTitle = series.displayTitle,
                            items = batchItems
                        )
                    )
                }
                if (res.isSuccessful && res.body()?.success == true) {
                    Toast.makeText(
                        requireContext(),
                        "📥 Staffel-Download gestartet! (" + batchItems.size + " Folgen in Warteschlange)",
                        Toast.LENGTH_LONG
                    ).show()
                } else {
                    Toast.makeText(requireContext(), "Fehler: " + res.body()?.error, Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Fehler: " + e.message, Toast.LENGTH_LONG).show()
            }
        }
    }
    
    private fun triggerLocalSearch(series: MediaItem) {
        lifecycleScope.launch {
            try {
                // Call /api/auto-downloads/check
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.checkAutoDownload(mapOf("showId" to (series.imdbId ?: "")))
                }
                if (res.isSuccessful && res.body()?.success == true) {
                    val count = res.body()?.startedCount ?: 0
                    Toast.makeText(requireContext(), "Suche abgeschlossen! " + count + " neue Folge(n) gefunden.", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(requireContext(), "Suche fehlgeschlagen", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Netzwerkfehler bei Suche", Toast.LENGTH_SHORT).show()
            }
        }
    }

    companion object {
        private const val ACTION_PLAY = 1L
        private const val ACTION_DOWNLOAD = 2L
        private const val ACTION_BATCH_DOWNLOAD = 3L
    }
}
