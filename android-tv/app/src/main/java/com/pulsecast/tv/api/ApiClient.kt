package com.pulsecast.tv.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private var currentBaseUrl: String = "http://192.168.1.100:3000"
    private var retrofit: Retrofit? = null
    private var apiService: PulseCastApi? = null

    val baseUrl: String
        get() = currentBaseUrl

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    @Synchronized
    fun updateBaseUrl(newUrl: String) {
        val formatted = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        if (currentBaseUrl != formatted || retrofit == null) {
            currentBaseUrl = formatted
            retrofit = Retrofit.Builder()
                .baseUrl(currentBaseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            apiService = retrofit?.create(PulseCastApi::class.java)
        }
    }

    val api: PulseCastApi
        get() {
            if (apiService == null) {
                updateBaseUrl(currentBaseUrl)
            }
            return apiService!!
        }

    fun getStreamUrl(filenameOrUrl: String): String {
        return if (filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://")) {
            filenameOrUrl
        } else {
            val cleanBase = currentBaseUrl.trimEnd('/')
            "$cleanBase/api/media/${java.net.URLEncoder.encode(filenameOrUrl, "UTF-8")}"
        }
    }

    fun getPosterUrl(posterUrl: String?): String? {
        if (posterUrl.isNullOrEmpty()) return null
        return if (posterUrl.startsWith("http://") || posterUrl.startsWith("https://")) {
            val cleanBase = currentBaseUrl.trimEnd('/')
            "$cleanBase/api/media/${java.net.URLEncoder.encode(posterUrl, "UTF-8")}"
        } else {
            val cleanBase = currentBaseUrl.trimEnd('/')
            "$cleanBase/api/media/${java.net.URLEncoder.encode(posterUrl, "UTF-8")}"
        }
    }
}
