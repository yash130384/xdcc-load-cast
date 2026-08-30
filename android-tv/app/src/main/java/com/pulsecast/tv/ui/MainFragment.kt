package com.pulsecast.tv.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.PulseCastApp
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.discovery.ServerDiscovery
import com.pulsecast.tv.model.MediaItem
import com.pulsecast.tv.model.SystemStatusResponse
import com.pulsecast.tv.presenter.CardPresenter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainFragment : BrowseSupportFragment() {

    private lateinit var rowsAdapter: ArrayObjectAdapter
    private var systemStatus: SystemStatusResponse? = null

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupUIElements()
        setupEventListeners()

        // Start Auto-Discovery and load data
        ServerDiscovery.startDiscovery(requireContext()) { _ ->
            loadDashboardAndMedia()
        }

        loadDashboardAndMedia()

        // Check for App Updates in background
        com.pulsecast.tv.updater.UpdateManager.checkForUpdate(requireActivity(), manualCheck = false)
    }

    override fun onResume() {
        super.onResume()
        // Refresh continue-watching list when coming back from player
        loadDashboardAndMedia()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        ServerDiscovery.stopDiscovery()
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
            when (item) {
                is MediaItem -> {
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
                }
                is StatusDashboardItem -> {
                    when (item.type) {
                        StatusType.SERVER, StatusType.TAILSCALE -> {
                            startActivity(Intent(requireContext(), SettingsActivity::class.java))
                        }
                        StatusType.XDCC_QUEUE -> {
                            startActivity(Intent(requireContext(), QueueActivity::class.java))
                        }
                        StatusType.XTREAM -> {
                            Toast.makeText(requireContext(), "IPTV Verbunden: ${item.subtitle}", Toast.LENGTH_SHORT).show()
                        }
                        StatusType.SEARCH_VOICE -> {
                            startActivity(Intent(requireContext(), SearchActivity::class.java))
                        }
                    }
                }
                is ActionItem -> {
                    when (item.id) {
                        ACTION_SEARCH -> startActivity(Intent(requireContext(), SearchActivity::class.java))
                        ACTION_QUEUE -> startActivity(Intent(requireContext(), QueueActivity::class.java))
                        ACTION_SETTINGS -> startActivity(Intent(requireContext(), SettingsActivity::class.java))
                    }
                }
            }
        }
    }

    private fun loadDashboardAndMedia() {
        lifecycleScope.launch {
            try {
                // 1. Fetch System & Network Status
                val statusRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getSystemStatus() } catch (e: Exception) { null }
                }
                systemStatus = statusRes?.body()

                // 2. Fetch Multi-Device Continue Watching Row
                val continueRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getContinueWatching() } catch (e: Exception) { null }
                }

                // 3. Fetch Media Categories
                val localRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Lokal", limit = 100) } catch (e: Exception) { null }
                }
                val liveRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Live TV", limit = 100) } catch (e: Exception) { null }
                }
                val moviesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Filme", limit = 100) } catch (e: Exception) { null }
                }
                val seriesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Serien", limit = 100) } catch (e: Exception) { null }
                }

                rowsAdapter.clear()
                val cardPresenter = CardPresenter()
                var rowIndex = 0

                // Row 0: ▶ Weiterschauen (Cross-Device Resume)
                val continueItems = continueRes?.body()?.items ?: emptyList()
                if (continueItems.isNotEmpty()) {
                    val continueAdapter = ArrayObjectAdapter(cardPresenter)
                    continueItems.forEach { continueAdapter.add(it) }
                    val header = HeaderItem(rowIndex.toLong(), "▶ Weiterschauen (${continueItems.size})")
                    rowsAdapter.add(ListRow(header, continueAdapter))
                    rowIndex++
                }

                // Row 1: Lokale Mediathek
                val localItems = localRes?.body()?.items ?: emptyList()
                if (localItems.isNotEmpty()) {
                    val localAdapter = ArrayObjectAdapter(cardPresenter)
                    localItems.forEach { localAdapter.add(it) }
                    val header = HeaderItem(rowIndex.toLong(), "${getString(R.string.category_local)} (${localItems.size})")
                    rowsAdapter.add(ListRow(header, localAdapter))
                    rowIndex++
                }

                // Row 2: Live TV
                val liveItems = liveRes?.body()?.items ?: emptyList()
                if (liveItems.isNotEmpty()) {
                    val liveAdapter = ArrayObjectAdapter(cardPresenter)
                    liveItems.forEach { liveAdapter.add(it) }
                    val header = HeaderItem(rowIndex.toLong(), "${getString(R.string.category_iptv_live)} (${liveItems.size})")
                    rowsAdapter.add(ListRow(header, liveAdapter))
                    rowIndex++
                }

                // Row 3: IPTV Movies
                val movieItems = moviesRes?.body()?.items ?: emptyList()
                if (movieItems.isNotEmpty()) {
                    val movieAdapter = ArrayObjectAdapter(cardPresenter)
                    movieItems.forEach { movieAdapter.add(it) }
                    val header = HeaderItem(rowIndex.toLong(), "${getString(R.string.category_iptv_movies)} (${movieItems.size})")
                    rowsAdapter.add(ListRow(header, movieAdapter))
                    rowIndex++
                }

                // Row 4: IPTV Series
                val seriesItems = seriesRes?.body()?.items ?: emptyList()
                if (seriesItems.isNotEmpty()) {
                    val seriesAdapter = ArrayObjectAdapter(cardPresenter)
                    seriesItems.forEach { seriesAdapter.add(it) }
                    val header = HeaderItem(rowIndex.toLong(), "${getString(R.string.category_iptv_series)} (${seriesItems.size})")
                    rowsAdapter.add(ListRow(header, seriesAdapter))
                    rowIndex++
                }

                // Row 5: ⚡ Erweiterter Modus (Profi-Tools, XDCC, Queue, Status)
                val actionsAdapter = ArrayObjectAdapter(ActionCardPresenter())
                actionsAdapter.add(ActionItem(ACTION_SEARCH, "🔍 XDCC Suche", "Moviegods Bots & Releases"))
                actionsAdapter.add(ActionItem(ACTION_QUEUE, getString(R.string.action_queue), "Laufende Server-Downloads"))
                actionsAdapter.add(ActionItem(ACTION_SETTINGS, getString(R.string.action_settings), "Server-IP / Netzwerk"))
                val header = HeaderItem(rowIndex.toLong(), "⚡ Erweiterter Modus & Werkzeuge")
                rowsAdapter.add(ListRow(header, actionsAdapter))

            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Ladefehler: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    companion object {
        const val ACTION_SEARCH = 1
        const val ACTION_QUEUE = 2
        const val ACTION_SETTINGS = 3
    }

    enum class StatusType {
        SERVER, TAILSCALE, XDCC_QUEUE, XTREAM, SEARCH_VOICE
    }

    data class StatusDashboardItem(
        val type: StatusType,
        val title: String,
        val subtitle: String,
        val detail: String
    )

    data class ActionItem(val id: Int, val title: String, val description: String)

    class StatusCardPresenter : Presenter() {
        override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
            val cardView = ImageCardView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                setMainImageDimensions(260, 130)
            }
            return ViewHolder(cardView)
        }

        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            val status = item as? StatusDashboardItem ?: return
            val cardView = viewHolder.view as ImageCardView
            cardView.titleText = status.title
            cardView.contentText = "${status.subtitle}\n${status.detail}"
            val drawableRes = when (status.type) {
                StatusType.SERVER -> R.drawable.tv_banner
                StatusType.TAILSCALE -> R.drawable.tv_banner
                StatusType.XDCC_QUEUE -> R.drawable.ic_download
                StatusType.XTREAM -> R.drawable.ic_play
                StatusType.SEARCH_VOICE -> R.drawable.ic_search
            }
            cardView.mainImage = ContextCompat.getDrawable(viewHolder.view.context, drawableRes)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }

    class ActionCardPresenter : Presenter() {
        override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
            val cardView = ImageCardView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                setMainImageDimensions(260, 130)
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
