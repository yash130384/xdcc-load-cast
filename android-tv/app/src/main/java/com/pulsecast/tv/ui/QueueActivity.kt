package com.pulsecast.tv.ui

import android.os.Bundle
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.VerticalGridSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.QueueItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class QueueActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_queue)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.queue_fragment, QueueFragment())
                .commitNow()
        }
    }
}

class QueueFragment : VerticalGridSupportFragment() {

    private lateinit var gridAdapter: ArrayObjectAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        title = "📥 Downloads Warteschlange"
        val gridPresenter = VerticalGridPresenter().apply {
            numberOfColumns = 2
        }
        setGridPresenter(gridPresenter)

        gridAdapter = ArrayObjectAdapter(QueueItemPresenter())
        adapter = gridAdapter

        onItemViewClickedListener = OnItemViewClickedListener { _, item, _, _ ->
            if (item is QueueItem) {
                showItemActions(item)
            }
        }

        startPollingQueue()
    }

    private fun startPollingQueue() {
        lifecycleScope.launch {
            while (isActive) {
                try {
                    val res = withContext(Dispatchers.IO) {
                        ApiClient.api.getDownloadQueue()
                    }
                    val items = res.body()?.queue ?: emptyList()
                    gridAdapter.clear()
                    items.forEach { gridAdapter.add(it) }
                } catch (e: Exception) {
                    // Ignore network fluctuations
                }
                delay(2500) // Poll every 2.5s
            }
        }
    }

    private fun showItemActions(item: QueueItem) {
        val options = arrayOf("Pausieren", "Fortsetzen", "Abbrechen / Löschen")
        android.app.AlertDialog.Builder(requireContext())
            .setTitle(item.filename)
            .setItems(options) { _, which ->
                lifecycleScope.launch {
                    try {
                        withContext(Dispatchers.IO) {
                            when (which) {
                                0 -> ApiClient.api.pauseDownload(item.id)
                                1 -> ApiClient.api.resumeDownload(item.id)
                                2 -> ApiClient.api.cancelDownload(item.id)
                                else -> {}
                            }
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "Fehler: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .show()
    }

    class QueueItemPresenter : Presenter() {
        override fun onCreateViewHolder(parent: android.view.ViewGroup): ViewHolder {
            val cardView = ImageCardView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                setMainImageDimensions(380, 160)
            }
            return ViewHolder(cardView)
        }

        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            val queueItem = item as? QueueItem ?: return
            val cardView = viewHolder.view as ImageCardView
            cardView.titleText = queueItem.filename
            cardView.contentText = "Status: ${queueItem.status} (${String.format("%.1f", queueItem.progressPercent)}%) • ${queueItem.downloadSpeed ?: ""}"
            cardView.mainImage = androidx.core.content.ContextCompat.getDrawable(viewHolder.view.context, R.drawable.ic_download)
        }

        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            val cardView = viewHolder.view as ImageCardView
            cardView.mainImage = null
        }
    }
}
