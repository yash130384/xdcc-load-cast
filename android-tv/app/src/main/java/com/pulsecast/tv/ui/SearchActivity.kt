package com.pulsecast.tv.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.SearchSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.DownloadRequest
import com.pulsecast.tv.model.SearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SearchActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.search_fragment, SearchFragment())
                .commitNow()
        }

        // Request Record Audio permission for TV remote voice search if needed
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 101)
        }
    }
}

class SearchFragment : SearchSupportFragment(), SearchSupportFragment.SearchResultProvider {

    private lateinit var rowsAdapter: ArrayObjectAdapter
    private var searchJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        rowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        setSearchResultProvider(this)

        setOnItemViewClickedListener { _, item, _, _ ->
            if (item is SearchResult) {
                downloadRelease(item)
            }
        }

        // Load initial top downloads on open
        loadTopDownloads()
    }

    override fun getResultsAdapter(): ObjectAdapter {
        return rowsAdapter
    }

    override fun onQueryTextChange(newQuery: String?): Boolean {
        performSearch(newQuery ?: "")
        return true
    }

    override fun onQueryTextSubmit(query: String?): Boolean {
        performSearch(query ?: "")
        return true
    }

    private fun loadTopDownloads() {
        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.getTopDownloads(query = "german")
                }
                val results = res.body()?.results ?: emptyList()
                if (results.isNotEmpty() && rowsAdapter.size() == 0) {
                    val presenter = SearchResultPresenter()
                    val listAdapter = ArrayObjectAdapter(presenter)
                    results.forEach { listAdapter.add(it) }
                    val header = HeaderItem(0, "🔥 Top Moviegods Releases (${results.size})")
                    rowsAdapter.add(ListRow(header, listAdapter))
                }
            } catch (e: Exception) {
                // Ignore top downloads fetch failure
            }
        }
    }

    private fun performSearch(query: String) {
        searchJob?.cancel()
        if (query.trim().length < 2) {
            rowsAdapter.clear()
            loadTopDownloads()
            return
        }

        searchJob = lifecycleScope.launch {
            delay(350) // Debounce
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.searchXdcc(query.trim(), maxResults = 50)
                }
                val results = res.body()?.results ?: emptyList()

                rowsAdapter.clear()
                val presenter = SearchResultPresenter()
                val listAdapter = ArrayObjectAdapter(presenter)
                results.forEach { listAdapter.add(it) }

                val header = HeaderItem(0, "🎤 Suchergebnisse für \"$query\" (${results.size})")
                rowsAdapter.add(ListRow(header, listAdapter))
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Suchfehler: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun downloadRelease(item: SearchResult) {
        val bot = item.botName ?: return
        val pack = item.packNumber ?: return
        val server = item.server ?: "irc.abjects.net"
        val channel = item.channel ?: "#moviegods"

        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    ApiClient.api.startXdccDownload(
                        DownloadRequest(
                            server = server,
                            channel = channel,
                            botName = bot,
                            packNumber = pack,
                            filename = item.filename
                        )
                    )
                }
                if (res.isSuccessful && res.body()?.success == true) {
                    Toast.makeText(requireContext(), "Download gestartet für: ${item.filename} 📥", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(requireContext(), "Fehler: ${res.body()?.error ?: "Konnte Download nicht starten"}", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Fehler: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    class SearchResultPresenter : Presenter() {
        override fun onCreateViewHolder(parent: android.view.ViewGroup): ViewHolder {
            val cardView = ImageCardView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                setMainImageDimensions(300, 150)
            }
            return ViewHolder(cardView)
        }

        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            val result = item as? SearchResult ?: return
            val cardView = viewHolder.view as ImageCardView
            cardView.titleText = result.filename
            cardView.contentText = "${result.size ?: ""} • Bot: ${result.botName ?: ""} #${result.packNumber ?: ""}"
            cardView.mainImage = ContextCompat.getDrawable(viewHolder.view.context, R.drawable.ic_download)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }
}
