package com.pulsecast.tv.model

import com.google.gson.annotations.SerializedName
import java.io.Serializable

data class MediaLibraryResponse(
    @SerializedName("items") val items: List<MediaItem> = emptyList(),
    @SerializedName("totalItems") val totalItems: Int = 0,
    @SerializedName("totalPages") val totalPages: Int = 0,
    @SerializedName("currentPage") val currentPage: Int = 1,
    @SerializedName("counts") val counts: Map<String, Int> = emptyMap(),
    @SerializedName("availableSubcategories") val availableSubcategories: List<String> = emptyList()
) : Serializable

data class MediaItem(
    @SerializedName("filename") val filename: String = "",
    @SerializedName("title") val title: String? = null,
    @SerializedName("isGroup") val isGroup: Boolean = false,
    @SerializedName("isXtream") val isXtream: Boolean = false,
    @SerializedName("isLive") val isLive: Boolean = false,
    @SerializedName("streamUrl") val streamUrl: String? = null,
    @SerializedName("coverUrl") val coverUrl: String? = null,
    @SerializedName("posterUrl") val posterUrl: String? = null,
    @SerializedName("category") val category: String? = null,
    @SerializedName("subcategory") val subcategory: String? = null,
    @SerializedName("year") val year: String? = null,
    @SerializedName("cast") val cast: String? = null,
    @SerializedName("imdbId") val imdbId: String? = null,
    @SerializedName("xtreamSeriesId") val xtreamSeriesId: String? = null,
    @SerializedName("xtreamStreamId") val xtreamStreamId: String? = null,
    @SerializedName("sizeBytes") val sizeBytes: Long = 0L,
    @SerializedName("mtime") val mtime: Long = 0L,
    @SerializedName("favorite") val favorite: Boolean = false,
    @SerializedName("progress") val progress: PlayProgress? = null,
    @SerializedName("files") val files: List<MediaItem> = emptyList(),
    @SerializedName("metadata") val metadata: MediaMetadata? = null
) : Serializable {
    val displayTitle: String
        get() = metadata?.title ?: title ?: filename

    val displayPoster: String?
        get() = metadata?.posterUrl ?: posterUrl ?: coverUrl

    val displaySubtitle: String
        get() {
            val cat = metadata?.originalCategory ?: metadata?.category ?: category ?: ""
            val yr = metadata?.year ?: year ?: ""
            return if (yr.isNotEmpty()) "$cat • $yr" else cat
        }
}

data class MediaMetadata(
    @SerializedName("title") val title: String? = null,
    @SerializedName("category") val category: String? = null,
    @SerializedName("originalCategory") val originalCategory: String? = null,
    @SerializedName("subcategory") val subcategory: String? = null,
    @SerializedName("year") val year: String? = null,
    @SerializedName("cast") val cast: String? = null,
    @SerializedName("imdbId") val imdbId: String? = null,
    @SerializedName("posterUrl") val posterUrl: String? = null,
    @SerializedName("seasonEpisode") val seasonEpisode: String? = null,
    @SerializedName("artist") val artist: String? = null,
    @SerializedName("album") val album: String? = null,
    @SerializedName("duration") val duration: Double? = null
) : Serializable

data class PlayProgress(
    @SerializedName("currentTime") val currentTime: Double = 0.0,
    @SerializedName("duration") val duration: Double = 0.0,
    @SerializedName("updatedAt") val updatedAt: Long = 0L
) : Serializable

data class SearchResult(
    @SerializedName("botName") val botName: String? = null,
    @SerializedName("packNumber") val packNumber: String? = null,
    @SerializedName("filename") val filename: String = "",
    @SerializedName("size") val size: String? = null,
    @SerializedName("network") val network: String? = null,
    @SerializedName("channel") val channel: String? = null,
    @SerializedName("server") val server: String? = null,
    @SerializedName("source") val source: String? = null
) : Serializable

data class SearchResponse(
    @SerializedName("results") val results: List<SearchResult> = emptyList(),
    @SerializedName("count") val count: Int = 0
) : Serializable

data class DownloadRequest(
    @SerializedName("server") val server: String,
    @SerializedName("port") val port: Int? = null,
    @SerializedName("useSSL") val useSSL: Boolean? = true,
    @SerializedName("channel") val channel: String,
    @SerializedName("botName") val botName: String,
    @SerializedName("packNumber") val packNumber: String,
    @SerializedName("filename") val filename: String
)

data class XtreamDownloadRequest(
    @SerializedName("url") val url: String,
    @SerializedName("title") val title: String,
    @SerializedName("seriesTitle") val seriesTitle: String? = null
)

data class DownloadResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("id") val id: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("error") val error: String? = null
)

data class QueueItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("filename") val filename: String = "",
    @SerializedName("status") val status: String = "",
    @SerializedName("progressPercent") val progressPercent: Double = 0.0,
    @SerializedName("downloadSpeed") val downloadSpeed: String? = null,
    @SerializedName("etaSeconds") val etaSeconds: Long = 0L,
    @SerializedName("bytesReceived") val bytesReceived: Long = 0L,
    @SerializedName("totalBytes") val totalBytes: Long = 0L
) : Serializable

data class QueueResponse(
    @SerializedName("queue") val queue: List<QueueItem> = emptyList()
) : Serializable
