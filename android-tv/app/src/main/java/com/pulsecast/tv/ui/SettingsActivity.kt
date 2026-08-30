package com.pulsecast.tv.ui

import android.os.Bundle
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.GuidedStepSupportFragment
import androidx.leanback.widget.GuidanceStylist
import androidx.leanback.widget.GuidedAction
import androidx.lifecycle.lifecycleScope
import com.pulsecast.tv.PulseCastApp
import com.pulsecast.tv.api.ApiClient
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

    companion object {
        private const val ACTION_SERVER_URL = 1L
        private const val ACTION_TEST_CONNECT = 2L
        private const val ACTION_SAVE = 3L
        private const val ACTION_CHECK_UPDATE = 4L
    }

    override fun onCreateGuidance(savedInstanceState: Bundle?): GuidanceStylist.Guidance {
        return GuidanceStylist.Guidance(
            "⚙️ Server- & Netzwerk-Setup",
            "Gib die lokale LAN-IP (z.B. 192.168.31.242) oder Tailscale-IP (100.x.y.z) deines PulseCast Servers an.",
            "Verbindung",
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
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_CHECK_UPDATE)
                .title("Nach App-Updates suchen 🔄")
                .description("Prüft auf neue Versionen im Git")
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SAVE)
                .title("Speichern & Verbinden 💾")
                .build()
        )
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
