package com.pulsecast.tv.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.GuidedStepSupportFragment
import androidx.leanback.widget.GuidanceStylist
import androidx.leanback.widget.GuidedAction
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.PulseCastApp
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.SystemStatusResponse
import com.pulsecast.tv.updater.UpdateManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SettingsActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState == null) {
            GuidedStepSupportFragment.addAsRoot(this, SettingsFragment(), android.R.id.content)
        }
    }
}

class SettingsFragment : GuidedStepSupportFragment() {

    private var systemStatus: SystemStatusResponse? = null

    companion object {
        private const val ACTION_SERVER_STATUS = 100L
        private const val ACTION_TAILSCALE_STATUS = 101L
        private const val ACTION_XTREAM_STATUS = 102L
        private const val ACTION_XDCC_STATUS = 103L
        private const val ACTION_QUEUE = 200L
        private const val ACTION_SEARCH = 201L
        private const val ACTION_SERVER_URL = 1L
        private const val ACTION_TEST_CONNECT = 2L
        private const val ACTION_CHECK_UPDATE = 3L
        private const val ACTION_SAVE = 4L
    }

    override fun onCreateGuidance(savedInstanceState: Bundle?): GuidanceStylist.Guidance {
        return GuidanceStylist.Guidance(
            "⚙️ Einstellungen & System-Info",
            "Verwalte die Server-Verbindung, Tailscale, Netzwerk und prüfe System-Diagnosen.",
            "PulseCast System",
            null
        )
    }

    override fun onCreateActions(actions: MutableList<GuidedAction>, savedInstanceState: Bundle?) {
        val currentUrl = PulseCastApp.instance.prefs.getString(
            PulseCastApp.KEY_SERVER_URL,
            ApiClient.baseUrl
        ) ?: ApiClient.baseUrl

        
        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_QUEUE)
                .title("📥 Downloads & Warteschlange")
                .description("Aktive Downloads ansehen und verwalten")
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SEARCH)
                .title("🔍 Suche (Moviegods & XDCC)")
                .description("Nach Filmen und Serien suchen (TOPDL verfügbar)")
                .build()
        )

        // Server URL input
        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SERVER_URL)
                .title("Server URL / IP")
                .description("Aktuell: $currentUrl")
                .editTitle(currentUrl)
                .editable(true)
                .build()
        )


        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_TEST_CONNECT)
                .title("Verbindung testen 🔍")
                .description("Prüft Erreichbarkeit des PulseCast Servers")
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_CHECK_UPDATE)
                .title("Nach App-Updates suchen 🔄")
                .description("Aktuelle Version: v1.2.0")
                .build()
        )

        // Live Diagnostic status items (hidden until loaded)
        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SERVER_STATUS)
                .title("🟢 Server Status")
                .description("Lade Server-Informationen...")
                .focusable(false)
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_TAILSCALE_STATUS)
                .title("🔒 Tailscale VPN")
                .description("Prüfe Tailscale Status...")
                .focusable(false)
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_XTREAM_STATUS)
                .title("📡 IPTV & Stream")
                .description("Prüfe IPTV Verbindung...")
                .focusable(false)
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_XDCC_STATUS)
                .title("📥 XDCC & Warteschlange")
                .description("Lade Download-Status...")
                .focusable(false)
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SAVE)
                .title("Speichern & Schließen 💾")
                .build()
        )

        loadLiveStatus()
    }

    private fun loadLiveStatus() {
        lifecycleScope.launch {
            try {
                val res = withContext(Dispatchers.IO) {
                    try { ApiClient.api.getSystemStatus() } catch (e: Exception) { null }
                }
                systemStatus = res?.body()
                systemStatus?.let { s ->
                    val serverAction = findActionById(ACTION_SERVER_STATUS)
                    serverAction?.description = "Online (IP: ${s.server?.localIp ?: "Unbekannt"}, Port: ${s.server?.port ?: 3000}) • ${s.library?.totalLocalFiles ?: 0} lokale Dateien"

                    val tsAction = findActionById(ACTION_TAILSCALE_STATUS)
                    tsAction?.description = if (s.server?.tailscaleDetected == true) {
                        "Aktiv (IP: ${s.server?.tailscaleIp})"
                    } else {
                        "Nicht aktiv / Direkt-LAN"
                    }

                    val xtreamAction = findActionById(ACTION_XTREAM_STATUS)
                    xtreamAction?.description = if (s.xtream?.enabled == true) {
                        "${s.xtream?.liveCount ?: 0} Live Sender • ${s.xtream?.moviesCount ?: 0} Filme • ${s.xtream?.seriesCount ?: 0} Serien"
                    } else {
                        "Deaktiviert"
                    }

                    val xdccAction = findActionById(ACTION_XDCC_STATUS)
                    xdccAction?.description = "${s.xdcc.activeDownloads} aktive Downloads (${s.xdcc.queueTotal} in Queue) • Bot: ${s.xdcc.moviegodsNick.ifEmpty { "Bereit" }}"

                    notifyActionChanged(findActionPositionById(ACTION_SERVER_STATUS))
                    notifyActionChanged(findActionPositionById(ACTION_TAILSCALE_STATUS))
                    notifyActionChanged(findActionPositionById(ACTION_XTREAM_STATUS))
                    notifyActionChanged(findActionPositionById(ACTION_XDCC_STATUS))
                }
            } catch (e: Exception) {
                // Ignore background status failure
            }
        }
    }

    override fun onGuidedActionClicked(action: GuidedAction) {
        val urlAction = findActionById(ACTION_SERVER_URL)
        var rawInput = urlAction?.editTitle?.toString()?.trim() ?: ApiClient.baseUrl

        if (!rawInput.startsWith("http://") && !rawInput.startsWith("https://")) {
            rawInput = "http://$rawInput"
        }
        if (!rawInput.matches(Regex(".+:\\d+$"))) {
            rawInput = "$rawInput:3000"
        }

        
        when (action.id) {
            ACTION_QUEUE -> {
                startActivity(Intent(requireContext(), QueueActivity::class.java))
            }
            ACTION_SEARCH -> {
                startActivity(Intent(requireContext(), SearchActivity::class.java))
            }
            ACTION_TEST_CONNECT -> {

                lifecycleScope.launch {
                    try {
                        ApiClient.updateBaseUrl(rawInput)
                        val res = withContext(Dispatchers.IO) {
                            ApiClient.api.getSystemStatus()
                        }
                        if (res.isSuccessful) {
                            val status = res.body()
                            Toast.makeText(
                                requireContext(),
                                "✅ Verbunden mit ${status?.server?.name ?: "PulseCast"} (${status?.library?.totalLocalFiles ?: 0} Medien)",
                                Toast.LENGTH_LONG
                            ).show()
                            loadLiveStatus()
                        } else {
                            Toast.makeText(requireContext(), "⚠️ Server antwortet mit Status ${res.code()}", Toast.LENGTH_LONG).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(requireContext(), "❌ Verbindung fehlgeschlagen: ${e.message}", Toast.LENGTH_LONG).show()
                    }
                }
            }
            ACTION_CHECK_UPDATE -> {
                UpdateManager.checkForUpdate(requireActivity(), manualCheck = true)
            }
            ACTION_SAVE -> {
                PulseCastApp.instance.prefs.edit()
                    .putString(PulseCastApp.KEY_SERVER_URL, rawInput)
                    .apply()
                ApiClient.updateBaseUrl(rawInput)
                Toast.makeText(requireContext(), "✅ Server gespeichert: $rawInput", Toast.LENGTH_SHORT).show()
                activity?.finish()
            }
        }
    }
}
