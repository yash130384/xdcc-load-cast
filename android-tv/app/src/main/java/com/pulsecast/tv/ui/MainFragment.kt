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

                // 2. Fetch Media Categories
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

                // Row 0: 🟢 Live Status & Connectivity Dashboard
                val statusRowAdapter = ArrayObjectAdapter(StatusCardPresenter())
                val currentUrl = PulseCastApp.instance.prefs.getString(PulseCastApp.KEY_SERVER_URL, ApiClient.baseUrl) ?: ApiClient.baseUrl

                // Server Status Card
                val serverIp = systemStatus?.server?.localIp ?: currentUrl.replace("http://", "").replace(":3000", "")
                statusRowAdapter.add(
                    StatusDashboardItem(
                        StatusType.SERVER,
                        "🟢 Server Online",
                        "IP: $serverIp:3000",
                        "Lokales LAN angebunden"
                    )
                )

                // Tailscale Card
                val tsDetected = systemStatus?.server?.tailscaleDetected == true
                val tsIp = systemStatus?.server?.tailscaleIp
                statusRowAdapter.add(
                    StatusDashboardItem(
                        StatusType.TAILSCALE,
                        if (tsDetected) "🔒 Tailscale Aktiv" else "🔒 Tailscale Bereit",
                        tsIp ?: "Direktverbindung",
                        if (tsDetected) "IP: $tsIp (Unterwegs)" else "Manuelle IP in Settings"
                    )
                )

                // XDCC & Downloads Card
                val activeDl = systemStatus?.xdcc?.activeDownloads ?: 0
                val queueTotal = systemStatus?.xdcc?.queueTotal ?: 0
                statusRowAdapter.add(
                    StatusDashboardItem(
                        StatusType.XDCC_QUEUE,
                        "📥 XDCC & Downloads",
                        "$activeDl aktiv / $queueTotal in Queue",
                        "Moviegods Bot bereit"
                    )
                )

                // Xtream IPTV Card
                val xtreamMovies = systemStatus?.xtream?.moviesCount ?: 0
                val xtreamLive = systemStatus?.xtream?.liveCount ?: 0
                statusRowAdapter.add(
                    StatusDashboardItem(
                        StatusType.XTREAM,
                        "📡 IPTV & Streams",
                        "$xtreamLive Sender • $xtreamMovies VODs",
                        "Xtream Codes angebunden"
                    )
                )

                // Voice Search Trigger Card
                statusRowAdapter.add(
                    StatusDashboardItem(
                        StatusType.SEARCH_VOICE,
                        "🎤 Sprachsuche",
                        "Suchen per Fernbedienung",
                        "XDCC & Moviegods Releases"
                    )
                )

                val statusHeader = HeaderItem(0, "📡 System- & Netzwerkstatus")
                rowsAdapter.add(ListRow(statusHeader, statusRowAdapter))

                val cardPresenter = CardPresenter()

                // Row 1: Lokale Mediathek
                val localItems = localRes?.body()?.items ?: emptyList()
                if (localItems.isNotEmpty()) {
                    val localAdapter = ArrayObjectAdapter(cardPresenter)
                    localItems.forEach { localAdapter.add(it) }
                    val header = HeaderItem(1, "${getString(R.string.category_local)} (${localItems.size})")
                    rowsAdapter.add(ListRow(header, localAdapter))
                }

                // Row 2: Live TV
                val liveItems = liveRes?.body()?.items ?: emptyList()
                if (liveItems.isNotEmpty()) {
                    val liveAdapter = ArrayObjectAdapter(cardPresenter)
                    liveItems.forEach { liveAdapter.add(it) }
                    val header = HeaderItem(2, "${getString(R.string.category_iptv_live)} (${liveItems.size})")
                    rowsAdapter.add(ListRow(header, liveAdapter))
                }

                // Row 3: IPTV Movies
                val movieItems = moviesRes?.body()?.items ?: emptyList()
                if (movieItems.isNotEmpty()) {
                    val movieAdapter = ArrayObjectAdapter(cardPresenter)
                    movieItems.forEach { movieAdapter.add(it) }
                    val header = HeaderItem(3, "${getString(R.string.category_iptv_movies)} (${movieItems.size})")
                    rowsAdapter.add(ListRow(header, movieAdapter))
                }

                // Row 4: IPTV Series
                val seriesItems = seriesRes?.body()?.items ?: emptyList()
                if (seriesItems.isNotEmpty()) {
                    val seriesAdapter = ArrayObjectAdapter(cardPresenter)
                    seriesItems.forEach { seriesAdapter.add(it) }
                    val header = HeaderItem(4, "${getString(R.string.category_iptv_series)} (${seriesItems.size})")
                    rowsAdapter.add(ListRow(header, seriesAdapter))
                }

                // Row 5: Quick System Actions (Warteschlange, Einstellungen)
                val actionsAdapter = ArrayObjectAdapter(ActionCardPresenter())
                actionsAdapter.add(ActionItem(ACTION_QUEUE, getString(R.string.action_queue), "Laufende Server-Downloads"))
                actionsAdapter.add(ActionItem(ACTION_SETTINGS, getString(R.string.action_settings), "Server-IP / Netzwerk"))
                val header = HeaderItem(5, "⚡ Schnellzugriff")
                rowsAdapter.add(ListRow(header, actionsAdapter))

            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Ladefehler: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    companion object {
        const val ACTION_QUEUE = 1
        const val ACTION_SETTINGS = 2
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
