package com.pulsecast.tv.ui

import android.content.Context
import android.os.Bundle
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.GuidedStepSupportFragment
import androidx.leanback.widget.GuidanceStylist
import androidx.leanback.widget.GuidedAction
import com.pulsecast.tv.PulseCastApp
import com.pulsecast.tv.R
import com.pulsecast.tv.api.ApiClient

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
        private const val ACTION_SAVE = 2L
    }

    override fun onCreateGuidance(savedInstanceState: Bundle?): GuidanceStylist.Guidance {
        return GuidanceStylist.Guidance(
            "⚙️ Server-Einstellungen",
            "Gib die IP-Adresse oder Tailscale-Adresse deines PulseCast-Servers an.",
            "Netzwerk",
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
                .description(currentUrl)
                .editTitle(currentUrl)
                .editable(true)
                .build()
        )

        actions.add(
            GuidedAction.Builder(requireContext())
                .id(ACTION_SAVE)
                .title("Speichern & Verbinden")
                .build()
        )
    }

    override fun onGuidedActionClicked(action: GuidedAction) {
        if (action.id == ACTION_SAVE) {
            val urlAction = findActionById(ACTION_SERVER_URL)
            val newUrl = urlAction?.editTitle?.toString()?.trim() ?: ApiClient.baseUrl

            if (newUrl.startsWith("http://") || newUrl.startsWith("https://")) {
                PulseCastApp.instance.prefs.edit()
                    .putString(PulseCastApp.KEY_SERVER_URL, newUrl)
                    .apply()
                ApiClient.updateBaseUrl(newUrl)
                Toast.makeText(requireContext(), "Server-URL gespeichert: $newUrl", Toast.LENGTH_SHORT).show()
                activity?.finish()
            } else {
                Toast.makeText(requireContext(), "Bitte gültige URL eingeben (z.B. http://192.168.1.50:3000)", Toast.LENGTH_LONG).show()
            }
        }
    }
}
