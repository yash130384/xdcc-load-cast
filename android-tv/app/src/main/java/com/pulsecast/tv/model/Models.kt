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
    @SerializedName("metadata") val metadata: MediaMetadata? = null,
    @com.google.gson.annotations.SerializedName("season") val season: Int? = null,
    @com.google.gson.annotations.SerializedName("episodeNum") val episodeNum: Int? = null
) : Serializable {
    val displayTitle: String
        get() {
            val raw = metadata?.title?.takeIf { it.isNotBlank() && it != "Unbekannte Serie" && it != "Unbekannter Film" }
                ?: title?.takeIf { it.isNotBlank() && it != "Unbekannte Serie" && it != "Unbekannter Film" }
                ?: filename
            return cleanTitle(raw)
        }

    val displayPoster: String?
        get() = metadata?.posterUrl ?: posterUrl ?: coverUrl

    val displaySubtitle: String
        get() {
            val cat = metadata?.originalCategory ?: metadata?.category ?: category ?: ""
            val yr = metadata?.year ?: year ?: ""
            return if (yr.isNotEmpty()) "$cat • $yr" else cat
        }

    private fun cleanTitle(raw: String): String {
        var c = raw.substringAfterLast('/').substringAfterLast('\\')
        c = c.replace(Regex("^\\d+_+"), "")
        c = c.replace(Regex("(?i)\\.(mp4|mkv|avi|mov|ts|webm|flac|mp3|m4a|m4b|mpg|mpeg)$"), "")
        c = c.replace(Regex("[._]"), " ")
        c = c.replace(Regex("(?i)\\b(2160p|1080p|720p|480p|4k|uhd|bluray|bdrip|brrip|hdtv|webrip|web-dl|webdl|dvdrip|x264|h264|x265|h265|hevc|aac|dd5\\.1|dts|german|english|multi|dl|dubbed|proper|repack)\\b.*$"), "")
        return c.replace(Regex("\\s+"), " ").trim().ifEmpty { raw }
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

data class StreamDownloadRequest(
    @SerializedName("streamUrl") val streamUrl: String,
    @SerializedName("title") val title: String,
    @SerializedName("seriesTitle") val seriesTitle: String? = null,
    @SerializedName("filename") val filename: String? = null
)

data class BatchEpisodeItem(
    @SerializedName("url") val url: String,
    @SerializedName("title") val title: String
) : Serializable

data class BatchDownloadRequest(
    @SerializedName("seriesTitle") val seriesTitle: String,
    @SerializedName("items") val items: List<BatchEpisodeItem>
)

data class ProgressUpdateRequest(
    @SerializedName("filename") val filename: String,
    @SerializedName("position") val position: Double,
    @SerializedName("currentTime") val currentTime: Double,
    @SerializedName("duration") val duration: Double,
    @SerializedName("seriesTitle") val seriesTitle: String? = null,
    @SerializedName("episodeTitle") val episodeTitle: String? = null,
    @SerializedName("percentage") val percentage: Double,
    @SerializedName("isWatched") val isWatched: Boolean? = null
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

data class SystemStatusResponse(
    @SerializedName("server") val server: ServerInfo = ServerInfo(),
    @SerializedName("xdcc") val xdcc: XdccInfo = XdccInfo(),
    @SerializedName("xtream") val xtream: XtreamInfo = XtreamInfo(),
    @SerializedName("library") val library: LibraryInfo = LibraryInfo()
) : Serializable

data class ServerInfo(
    @SerializedName("name") val name: String = "PulseCast Server",
    @SerializedName("version") val version: String = "1.0.0",
    @SerializedName("uptimeSeconds") val uptimeSeconds: Long = 0L,
    @SerializedName("localIp") val localIp: String = "",
    @SerializedName("tailscaleDetected") val tailscaleDetected: Boolean = false,
    @SerializedName("tailscaleIp") val tailscaleIp: String? = null,
    @SerializedName("port") val port: Int = 3000
) : Serializable

data class XdccInfo(
    @SerializedName("moviegodsNick") val moviegodsNick: String = "",
    @SerializedName("activeDownloads") val activeDownloads: Int = 0,
    @SerializedName("queueTotal") val queueTotal: Int = 0
) : Serializable

data class XtreamInfo(
    @SerializedName("enabled") val enabled: Boolean = false,
    @SerializedName("host") val host: String? = null,
    @SerializedName("moviesCount") val moviesCount: Int = 0,
    @SerializedName("seriesCount") val seriesCount: Int = 0,
    @SerializedName("liveCount") val liveCount: Int = 0,
    @SerializedName("lastFetch") val lastFetch: Long = 0L
) : Serializable

data class LibraryInfo(
    @SerializedName("totalLocalFiles") val totalLocalFiles: Int = 0,
    @SerializedName("localMovies") val localMovies: Int = 0,
    @SerializedName("localSeries") val localSeries: Int = 0,
    @SerializedName("localAudio") val localAudio: Int = 0
) : Serializable

data class AppVersionResponse(
    @SerializedName("name") val name: String = "PulseCast TV",
    @SerializedName("version") val version: String = "1.0.0",
    @SerializedName("apkUrl") val apkUrl: String = "/api/app/apk",
    @SerializedName("githubRawUrl") val githubRawUrl: String? = null,
    @SerializedName("releaseNotes") val releaseNotes: String? = null
) : Serializable


data class XtreamEpisodesResponse(
    @com.google.gson.annotations.SerializedName("episodes") val episodes: List<MediaItem> = emptyList()
) : java.io.Serializable

data class AutoDownloadResponse(
    @com.google.gson.annotations.SerializedName("success") val success: Boolean = false,
    @com.google.gson.annotations.SerializedName("startedCount") val startedCount: Int = 0
) : java.io.Serializable
