package com.pulsecast.tv.api

import com.pulsecast.tv.model.*
import retrofit2.Response
import retrofit2.http.*

interface PulseCastApi {

    @GET("/api/media-library")
    suspend fun getMediaLibrary(
        @Query("category") category: String = "all",
        @Query("subcategory") subcategory: String = "all",
        @Query("search") search: String = "",
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 100
    ): Response<MediaLibraryResponse>

    @GET("/api/search")
    suspend fun searchXdcc(
        @Query("query") query: String,
        @Query("maxResults") maxResults: Int = 50
    ): Response<SearchResponse>

    @GET("/api/search/topdl")
    suspend fun getTopDownloads(
        @Query("query") query: String = "german"
    ): Response<SearchResponse>

    @POST("/api/download")
    suspend fun startXdccDownload(
        @Body request: DownloadRequest
    ): Response<DownloadResponse>

    @POST("/api/xtream/download")
    suspend fun startXtreamDownload(
        @Body request: XtreamDownloadRequest
    ): Response<DownloadResponse>

    @GET("/api/queue")
    suspend fun getDownloadQueue(): Response<QueueResponse>

    @POST("/api/download/{id}/pause")
    suspend fun pauseDownload(@Path("id") id: String): Response<Void>

    @POST("/api/download/{id}/resume")
    suspend fun resumeDownload(@Path("id") id: String): Response<Void>

    @POST("/api/download/{id}/cancel")
    suspend fun cancelDownload(@Path("id") id: String): Response<Void>

    @POST("/api/progress")
    suspend fun saveProgress(
        @Body progressMap: Map<String, PlayProgress>
    ): Response<Void>

    @GET("/api/status")
    suspend fun getSystemStatus(): Response<SystemStatusResponse>

    @POST("/api/favorites/{key}")
    suspend fun toggleFavorite(
        @Path("key") key: String
    ): Response<Void>
}
