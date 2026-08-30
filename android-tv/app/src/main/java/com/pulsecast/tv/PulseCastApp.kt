package com.pulsecast.tv

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.discovery.ServerDiscovery

class PulseCastApp : Application() {

    companion object {
        lateinit var instance: PulseCastApp
            private set
        
        const val PREFS_NAME = "pulsecast_tv_prefs"
        const val KEY_SERVER_URL = "key_server_url"
        const val DEFAULT_SERVER_URL = "http://192.168.1.100:3000"
    }

    val prefs: SharedPreferences by lazy {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun onCreate() {
        super.onCreate()
        instance = this

        val savedUrl = prefs.getString(KEY_SERVER_URL, null)
        if (savedUrl != null) {
            ApiClient.updateBaseUrl(savedUrl)
        }

        // Start mDNS server discovery
        ServerDiscovery.startDiscovery(this) { discoveredUrl ->
            if (prefs.getString(KEY_SERVER_URL, null) == null) {
                ApiClient.updateBaseUrl(discoveredUrl)
                prefs.edit().putString(KEY_SERVER_URL, discoveredUrl).apply()
            }
        }
    }
}
