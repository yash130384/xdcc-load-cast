package com.pulsecast.tv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.MediaItem
import com.pulsecast.tv.presenter.CardPresenter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainFragment : BrowseSupportFragment() {

    private lateinit var rowsAdapter: ArrayObjectAdapter

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUIElements()
        setupEventListeners()
        loadMediaData()
    }

    private fun setupUIElements() {
        title = getString(R.string.browse_title)
        badgeDrawable = ContextCompat.getDrawable(requireContext(), R.drawable.tv_banner)
        headersState = HEADERS_ENABLED
        isHeadersTransitionOnBackEnabled = true
        brandColor = ContextCompat.getColor(requireContext(), R.color.primary)
        searchAffordanceColor = ContextCompat.getColor(requireContext(), R.color.accent_pink)

        rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        adapter = rowsAdapter
    }

    private fun setupEventListeners() {
        setOnSearchClickedListener {
            startActivity(Intent(requireContext(), SearchActivity::class.java))
        }

        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            if (item is MediaItem) {
                if (item.isGroup) {
                    val intent = Intent(requireContext(), DetailsActivity::class.java).apply {
                        putExtra(DetailsActivity.EXTRA_MEDIA_ITEM, item)
                    }
                    startActivity(intent)
                } else {
                    val intent = Intent(requireContext(), PlayerActivity::class.java).apply {
                        putExtra(PlayerActivity.EXTRA_MEDIA_ITEM, item)
                    }
                    startActivity(intent)
                }
            } else if (item is ActionItem) {
                when (item.id) {
                    ACTION_QUEUE -> startActivity(Intent(requireContext(), QueueActivity::class.java))
                    ACTION_SETTINGS -> startActivity(Intent(requireContext(), SettingsActivity::class.java))
                }
            }
        }
    }

    private fun loadMediaData() {
        lifecycleScope.launch {
            try {
                // 1. Fetch Local Media
                val localRes = withContext(Dispatchers.IO) {
                    ApiClient.api.getMediaLibrary(category = "Lokal", limit = 100)
                }
                // 2. Fetch IPTV Live Channels
                val liveRes = withContext(Dispatchers.IO) {
                    ApiClient.api.getMediaLibrary(category = "Live TV", limit = 100)
                }
                // 3. Fetch IPTV Movies
                val moviesRes = withContext(Dispatchers.IO) {
                    ApiClient.api.getMediaLibrary(category = "Filme", limit = 100)
                }
                // 4. Fetch IPTV Series
                val seriesRes = withContext(Dispatchers.IO) {
                    ApiClient.api.getMediaLibrary(category = "Serien", limit = 100)
                }

                rowsAdapter.clear()
                val cardPresenter = CardPresenter()

                // Row 1: Lokale Mediathek
                val localItems = localRes.body()?.items ?: emptyList()
                if (localItems.isNotEmpty()) {
                    val localAdapter = ArrayObjectAdapter(cardPresenter)
                    localItems.forEach { localAdapter.add(it) }
                    val header = HeaderItem(0, getString(R.string.category_local))
                    rowsAdapter.add(ListRow(header, localAdapter))
                }

                // Row 2: Live TV
                val liveItems = liveRes.body()?.items ?: emptyList()
                if (liveItems.isNotEmpty()) {
                    val liveAdapter = ArrayObjectAdapter(cardPresenter)
                    liveItems.forEach { liveAdapter.add(it) }
                    val header = HeaderItem(1, getString(R.string.category_iptv_live))
                    rowsAdapter.add(ListRow(header, liveAdapter))
                }

                // Row 3: IPTV Movies
                val movieItems = moviesRes.body()?.items ?: emptyList()
                if (movieItems.isNotEmpty()) {
                    val movieAdapter = ArrayObjectAdapter(cardPresenter)
                    movieItems.forEach { movieAdapter.add(it) }
                    val header = HeaderItem(2, getString(R.string.category_iptv_movies))
                    rowsAdapter.add(ListRow(header, movieAdapter))
                }

                // Row 4: IPTV Series
                val seriesItems = seriesRes.body()?.items ?: emptyList()
                if (seriesItems.isNotEmpty()) {
                    val seriesAdapter = ArrayObjectAdapter(cardPresenter)
                    seriesItems.forEach { seriesAdapter.add(it) }
                    val header = HeaderItem(3, getString(R.string.category_iptv_series))
                    rowsAdapter.add(ListRow(header, seriesAdapter))
                }

                // Row 5: Quick System Actions (Warteschlange, Einstellungen)
                val actionsAdapter = ArrayObjectAdapter(ActionCardPresenter())
                actionsAdapter.add(ActionItem(ACTION_QUEUE, getString(R.string.action_queue), "Laufende Server-Downloads"))
                actionsAdapter.add(ActionItem(ACTION_SETTINGS, getString(R.string.action_settings), "Server-IP / Netzwerk"))
                val header = HeaderItem(4, "⚡ System")
                rowsAdapter.add(ListRow(header, actionsAdapter))

            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Fehler beim Laden: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    companion object {
        const val ACTION_QUEUE = 1
        const val ACTION_SETTINGS = 2
    }

    data class ActionItem(val id: Int, val title: String, val description: String)

    class ActionCardPresenter : Presenter() {
        override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
            val cardView = ImageCardView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                setMainImageDimensions(260, 160)
            }
            return ViewHolder(cardView)
        }

        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            val action = item as? ActionItem ?: return
            val cardView = viewHolder.view as ImageCardView
            cardView.titleText = action.title
            cardView.contentText = action.description
            cardView.mainImage = ContextCompat.getDrawable(viewHolder.view.context, R.drawable.tv_banner)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }
}
