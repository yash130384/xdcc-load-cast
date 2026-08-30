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
    private val cardPresenter = CardPresenter()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUIElements()
        setupEventListeners()

        ServerDiscovery.startDiscovery(requireContext()) { _ ->
            loadMediaLibrary()
        }
        loadMediaLibrary()
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
                        ACTION_SETTINGS -> startActivity(Intent(requireContext(), SettingsActivity::class.java))
                    }
                }
            }
        }
    }

    private fun loadMediaLibrary() {
        lifecycleScope.launch {
            try {
                // Fetch Weiterschauen
                val continueRes = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getContinueWatching() } catch (e: Exception) { null }
                }

                // Fetch full libraries
                val limit = 2000
                val localMoviesRes = withContext(Dispatchers.IO) { try { ApiClient.api.getMediaLibrary(category = "Lokal_Filme", limit = limit) } catch (e: Exception) { null } }
                val localSeriesRes = withContext(Dispatchers.IO) { try { ApiClient.api.getMediaLibrary(category = "Lokal_Serien", limit = limit) } catch (e: Exception) { null } }
                val streamMoviesRes = withContext(Dispatchers.IO) { try { ApiClient.api.getMediaLibrary(category = "Filme", limit = limit) } catch (e: Exception) { null } }
                val streamSeriesRes = withContext(Dispatchers.IO) { try { ApiClient.api.getMediaLibrary(category = "Serien", limit = limit) } catch (e: Exception) { null } }
                val liveRes = withContext(Dispatchers.IO) { try { ApiClient.api.getMediaLibrary(category = "Live TV", limit = limit) } catch (e: Exception) { null } }

                rowsAdapter.clear()
                var rowIndex = 0L

                // 1. Weiterschauen
                val continueItems = continueRes?.body()?.items ?: emptyList()
                if (continueItems.isNotEmpty()) {
                    val continueAdapter = ArrayObjectAdapter(cardPresenter)
                    continueItems.forEach { continueAdapter.add(it) }
                    rowsAdapter.add(ListRow(HeaderItem(rowIndex++, "▶ Weiterschauen"), continueAdapter))
                }

                // 2. Lokal Section
                val localMovies = localMoviesRes?.body()?.items ?: emptyList()
                val localSeries = localSeriesRes?.body()?.items ?: emptyList()
                if (localMovies.isNotEmpty() || localSeries.isNotEmpty()) {
                    rowsAdapter.add(SectionRow(HeaderItem(rowIndex++, "💾 LOKAL")))
                    
                    if (localMovies.isNotEmpty()) {
                        buildSubcategoryRows("Filme", localMovies, rowIndex).forEach { 
                            rowsAdapter.add(it)
                            rowIndex++
                        }
                    }
                    if (localSeries.isNotEmpty()) {
                        buildSubcategoryRows("Serien", localSeries, rowIndex).forEach { 
                            rowsAdapter.add(it)
                            rowIndex++
                        }
                    }
                }

                // 3. Stream Section
                val streamMovies = streamMoviesRes?.body()?.items ?: emptyList()
                val streamSeries = streamSeriesRes?.body()?.items ?: emptyList()
                if (streamMovies.isNotEmpty() || streamSeries.isNotEmpty()) {
                    rowsAdapter.add(SectionRow(HeaderItem(rowIndex++, "🍿 STREAM")))
                    
                    if (streamMovies.isNotEmpty()) {
                        buildSubcategoryRows("Filme", streamMovies, rowIndex).forEach { 
                            rowsAdapter.add(it)
                            rowIndex++
                        }
                    }
                    if (streamSeries.isNotEmpty()) {
                        buildSubcategoryRows("Serien", streamSeries, rowIndex).forEach { 
                            rowsAdapter.add(it)
                            rowIndex++
                        }
                    }
                }

                // 4. IPTV Section
                val liveItems = liveRes?.body()?.items ?: emptyList()
                if (liveItems.isNotEmpty()) {
                    rowsAdapter.add(SectionRow(HeaderItem(rowIndex++, "📡 IPTV")))
                    val liveAdapter = ArrayObjectAdapter(cardPresenter)
                    liveItems.forEach { liveAdapter.add(it) }
                    rowsAdapter.add(ListRow(HeaderItem(rowIndex++, "Live TV Sender"), liveAdapter))
                }

                // 5. Settings / Zahnradbereich
                rowsAdapter.add(SectionRow(HeaderItem(rowIndex++, "⚙️ SYSTEM")))
                val settingsAdapter = ArrayObjectAdapter(ActionCardPresenter())
                settingsAdapter.add(ActionItem(ACTION_SETTINGS, "⚙️ Einstellungen & Dashboard", "System, Suche, Downloads & Warteschlange öffnen"))
                rowsAdapter.add(ListRow(HeaderItem(rowIndex++, "Erweitert"), settingsAdapter))

            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Ladefehler: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun buildSubcategoryRows(prefix: String, items: List<MediaItem>, startingId: Long): List<ListRow> {
        val grouped = mutableMapOf<String, MutableList<MediaItem>>()
        for (item in items) {
            val sub = item.metadata?.subcategory ?: item.subcategory ?: "Weitere"
            if (!grouped.containsKey(sub)) {
                grouped[sub] = mutableListOf()
            }
            grouped[sub]!!.add(item)
        }

        var currentId = startingId
        val rows = mutableListOf<ListRow>()
        
        // Sort keys but put "Weitere" at the end
        val sortedKeys = grouped.keys.sortedWith(Comparator { a, b ->
            if (a == "Weitere") 1
            else if (b == "Weitere") -1
            else a.compareTo(b)
        })

        for (key in sortedKeys) {
            val catItems = grouped[key]!!.sortedByDescending { it.mtime ?: 0 }
            val adapter = ArrayObjectAdapter(cardPresenter)
            catItems.forEach { adapter.add(it) }
            val headerTitle = if (key == "Weitere") "$prefix ($key)" else "$prefix - $key"
            rows.add(ListRow(HeaderItem(currentId++, headerTitle), adapter))
        }
        
        return rows
    }

    companion object {
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
            cardView.mainImage = ContextCompat.getDrawable(viewHolder.view.context, R.drawable.tv_banner)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }
}
