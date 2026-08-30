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

        // Start Auto-Discovery and load media
        ServerDiscovery.startDiscovery(requireContext()) { _ ->
            loadMediaLibrary()
        }

        loadMediaLibrary()

        // Check for App Updates in background
        com.pulsecast.tv.updater.UpdateManager.checkForUpdate(requireActivity(), manualCheck = false)
    }

    override fun onResume() {
        super.onResume()
        loadMediaLibrary()
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

    private fun loadMediaLibrary() {
        lifecycleScope.launch {
            try {
                // 1. Fetch Multi-Device Continue Watching (Weiterschauen)
                val continueRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getContinueWatching() } catch (e: Exception) { null }
                }

                // 2. Fetch Media Categories (50 newest each)
                val localMoviesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Lokal_Filme", limit = 50) } catch (e: Exception) { null }
                }
                val localSeriesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Lokal_Serien", limit = 50) } catch (e: Exception) { null }
                }
                val streamMoviesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Filme", limit = 50) } catch (e: Exception) { null }
                }
                val streamSeriesRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Serien", limit = 50) } catch (e: Exception) { null }
                }
                val liveRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getMediaLibrary(category = "Live TV", limit = 50) } catch (e: Exception) { null }
                }

                rowsAdapter.clear()
                val cardPresenter = CardPresenter()
                var rowIndex = 0L

                // Row 0: ▶ Weiterschauen (falls angefangene Medien vorhanden)
                val continueItems = continueRes?.body()?.items ?: emptyList()
                if (continueItems.isNotEmpty()) {
                    val continueAdapter = ArrayObjectAdapter(cardPresenter)
                    continueItems.forEach { continueAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "▶ Weiterschauen (${continueItems.size})")
                    rowsAdapter.add(ListRow(header, continueAdapter))
                }

                // Row 1: 💾 Lokale Filme (Neueste 50)
                val localMovies = localMoviesRes?.body()?.items ?: emptyList()
                if (localMovies.isNotEmpty()) {
                    val localMoviesAdapter = ArrayObjectAdapter(cardPresenter)
                    localMovies.forEach { localMoviesAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "💾 Lokale Filme (${localMovies.size})")
                    rowsAdapter.add(ListRow(header, localMoviesAdapter))
                }

                // Row 2: 💾 Lokale Serien (Neueste 50)
                val localSeries = localSeriesRes?.body()?.items ?: emptyList()
                if (localSeries.isNotEmpty()) {
                    val localSeriesAdapter = ArrayObjectAdapter(cardPresenter)
                    localSeries.forEach { localSeriesAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "💾 Lokale Serien (${localSeries.size})")
                    rowsAdapter.add(ListRow(header, localSeriesAdapter))
                }

                // Row 3: 🍿 Stream Filme (Neueste 50)
                val streamMovies = streamMoviesRes?.body()?.items ?: emptyList()
                if (streamMovies.isNotEmpty()) {
                    val streamMoviesAdapter = ArrayObjectAdapter(cardPresenter)
                    streamMovies.forEach { streamMoviesAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "🍿 Stream Filme (${streamMovies.size})")
                    rowsAdapter.add(ListRow(header, streamMoviesAdapter))
                }

                // Row 4: 📺 Stream Serien (Neueste 50)
                val streamSeries = streamSeriesRes?.body()?.items ?: emptyList()
                if (streamSeries.isNotEmpty()) {
                    val streamSeriesAdapter = ArrayObjectAdapter(cardPresenter)
                    streamSeries.forEach { streamSeriesAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "📺 Stream Serien (${streamSeries.size})")
                    rowsAdapter.add(ListRow(header, streamSeriesAdapter))
                }

                // Row 5: 📡 Live TV Sender
                val liveItems = liveRes?.body()?.items ?: emptyList()
                if (liveItems.isNotEmpty()) {
                    val liveAdapter = ArrayObjectAdapter(cardPresenter)
                    liveItems.forEach { liveAdapter.add(it) }
                    val header = HeaderItem(rowIndex++, "📡 Live TV Sender (${liveItems.size})")
                    rowsAdapter.add(ListRow(header, liveAdapter))
                }

                // Row 6: ⚡ Erweiterter Modus (XDCC Suche, Warteschlange)
                val advancedAdapter = ArrayObjectAdapter(ActionCardPresenter())
                advancedAdapter.add(ActionItem(ACTION_SEARCH, "🔍 XDCC & Bot Suche", "Moviegods Releases finden"))
                advancedAdapter.add(ActionItem(ACTION_QUEUE, getString(R.string.action_queue), "Laufende Server-Downloads"))
                val advHeader = HeaderItem(rowIndex++, "⚡ Erweiterter Modus & XDCC")
                rowsAdapter.add(ListRow(advHeader, advancedAdapter))

                // Row 7: ⚙️ Einstellungen & System-Info (Zahnrad)
                val settingsAdapter = ArrayObjectAdapter(ActionCardPresenter())
                settingsAdapter.add(ActionItem(ACTION_SETTINGS, "⚙️ Einstellungen & System-Info", "Server-IP, Tailscale, Diagnosen & Updates"))
                val setHeader = HeaderItem(rowIndex++, "⚙️ Einstellungen")
                rowsAdapter.add(ListRow(setHeader, settingsAdapter))

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

    data class ActionItem(val id: Int, val title: String, val description: String)

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
            val drawableRes = when (action.id) {
                ACTION_SEARCH -> R.drawable.ic_search
                ACTION_QUEUE -> R.drawable.ic_download
                ACTION_SETTINGS -> R.drawable.tv_banner
                else -> R.drawable.tv_banner
            }
            cardView.mainImage = ContextCompat.getDrawable(viewHolder.view.context, drawableRes)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }
}
