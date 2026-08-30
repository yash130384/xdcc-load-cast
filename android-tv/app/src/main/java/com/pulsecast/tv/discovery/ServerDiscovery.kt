package com.pulsecast.tv.discovery

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import com.pulsecast.tv.PulseCastApp
import com.pulsecast.tv.api.ApiClient
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.Inet4Address
import java.net.NetworkInterface
import java.net.URL

object ServerDiscovery {

    private const val TAG = "ServerDiscovery"
    private const val SERVICE_TYPE = "_pulsecast._tcp."
    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var isDiscovering = false
    private var discoveryScope: CoroutineScope? = null

    fun startDiscovery(context: Context, onServerFound: (String) -> Unit) {
        if (isDiscovering) return
        isDiscovering = true

        discoveryScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

        // 1. Check current saved URL first
        discoveryScope?.launch {
            val savedUrl = PulseCastApp.instance.prefs.getString(
                PulseCastApp.KEY_SERVER_URL,
                ApiClient.baseUrl
            ) ?: ApiClient.baseUrl

            if (checkServerHealth(savedUrl)) {
                Log.i(TAG, "Saved server URL is valid: $savedUrl")
                withContext(Dispatchers.Main) {
                    ApiClient.updateBaseUrl(savedUrl)
                    onServerFound(savedUrl)
                }
                return@launch
            }

            // 2. Start Subnet Scan in background (fast parallel sweep)
            launch {
                scanLocalSubnets { foundUrl ->
                    Log.i(TAG, "Subnet scan found PulseCast server: $foundUrl")
                    PulseCastApp.instance.prefs.edit()
                        .putString(PulseCastApp.KEY_SERVER_URL, foundUrl)
                        .apply()
                    CoroutineScope(Dispatchers.Main).launch {
                        ApiClient.updateBaseUrl(foundUrl)
                        onServerFound(foundUrl)
                    }
                }
            }
        }

        // 3. Start mDNS / NSD Discovery
        startMdnsDiscovery(context, onServerFound)
    }

    private fun startMdnsDiscovery(context: Context, onServerFound: (String) -> Unit) {
        nsdManager = context.getSystemService(Context.NSD_SERVICE) as? NsdManager ?: return

        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(serviceType: String) {
                Log.d(TAG, "mDNS Service discovery started for $serviceType")
            }

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                Log.d(TAG, "mDNS Service found: ${serviceInfo.serviceName}")
                if (serviceInfo.serviceType.contains("pulsecast")) {
                    @Suppress("DEPRECATION")
                    nsdManager?.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                            Log.e(TAG, "Resolve failed: $errorCode")
                        }

                        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
                            @Suppress("DEPRECATION")
                            val host = serviceInfo.host?.hostAddress
                            val port = serviceInfo.port
                            if (host != null && port > 0) {
                                val url = "http://$host:$port"
                                Log.i(TAG, "mDNS PulseCast server resolved at $url")
                                PulseCastApp.instance.prefs.edit()
                                    .putString(PulseCastApp.KEY_SERVER_URL, url)
                                    .apply()
                                CoroutineScope(Dispatchers.Main).launch {
                                    ApiClient.updateBaseUrl(url)
                                    onServerFound(url)
                                }
                            }
                        }
                    })
                }
            }

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {
                Log.d(TAG, "Service lost: ${serviceInfo.serviceName}")
            }

            override fun onDiscoveryStopped(serviceType: String) {
                Log.d(TAG, "Discovery stopped: $serviceType")
            }

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery start failed: $errorCode")
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery stop failed: $errorCode")
            }
        }

        try {
            nsdManager?.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start mDNS discovery", e)
        }
    }

    private suspend fun scanLocalSubnets(onFound: (String) -> Unit) {
        val subnetBases = getLocalSubnetBases()
        if (subnetBases.isEmpty()) return

        coroutineScope {
            for (base in subnetBases) {
                for (i in 1..254) {
                    val targetIp = "$base$i"
                    launch {
                        val testUrl = "http://$targetIp:3000"
                        if (checkServerHealth(testUrl)) {
                            onFound(testUrl)
                        }
                    }
                }
            }
        }
    }

    private fun getLocalSubnetBases(): List<String> {
        val bases = mutableListOf<String>()
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                if (iface.isLoopback || !iface.isUp) continue

                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (addr is Inet4Address && !addr.isLoopbackAddress) {
                        val host = addr.hostAddress ?: continue
                        val lastDot = host.lastIndexOf('.')
                        if (lastDot > 0) {
                            bases.add(host.substring(0, lastDot + 1))
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting local subnet bases", e)
        }
        return bases.distinct()
    }

    private fun checkServerHealth(urlStr: String): Boolean {
        return try {
            val url = URL("$urlStr/api/status")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 400
                readTimeout = 400
                requestMethod = "GET"
            }
            conn.responseCode == 200
        } catch (e: Exception) {
            false
        }
    }

    fun stopDiscovery() {
        discoveryScope?.cancel()
        discoveryScope = null

        if (isDiscovering && nsdManager != null && discoveryListener != null) {
            try {
                nsdManager?.stopServiceDiscovery(discoveryListener)
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping discovery", e)
            }
        }
        isDiscovering = false
    }
}
