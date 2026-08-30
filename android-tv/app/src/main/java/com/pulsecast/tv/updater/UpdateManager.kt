package com.pulsecast.tv.updater

import android.app.Activity
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.FileProvider
import com.pulsecast.tv.api.ApiClient
import com.pulsecast.tv.model.AppVersionResponse
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

object UpdateManager {

    private const val TAG = "UpdateManager"
    private const val GITHUB_RAW_PACKAGE = "https://raw.githubusercontent.com/yash130384/xdcc-load-cast/main/package.json"
    private const val GITHUB_RAW_APK = "https://raw.githubusercontent.com/yash130384/xdcc-load-cast/main/android-tv/PulseCast-TV.apk"

    fun checkForUpdate(
        activity: Activity,
        manualCheck: Boolean = false,
        onNoUpdate: (() -> Unit)? = null
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            val currentVersion = getInstalledVersionName(activity)
            var remoteVersion: AppVersionResponse? = null

            // 1. Try fetching version from connected PulseCast server
            try {
                val res = ApiClient.api.getAppVersion()
                if (res.isSuccessful && res.body() != null) {
                    remoteVersion = res.body()
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to get version from server: ${e.message}")
            }

            // 2. Fallback to GitHub raw package.json if server unreachable
            if (remoteVersion == null) {
                try {
                    val conn = openFollowRedirects(GITHUB_RAW_PACKAGE)
                    if (conn.responseCode == 200) {
                        val text = conn.inputStream.bufferedReader().readText()
                        conn.disconnect()
                        val json = JSONObject(text)
                        val gitVersion = json.optString("version", currentVersion)
                        remoteVersion = AppVersionResponse(
                            version = gitVersion,
                            apkUrl = GITHUB_RAW_APK,
                            githubRawUrl = GITHUB_RAW_APK,
                            releaseNotes = "Neuestes Update aus dem Git Repository"
                        )
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Failed to get version from GitHub: ${e.message}")
                }
            }

            withContext(Dispatchers.Main) {
                if (remoteVersion != null && isNewerVersion(remoteVersion.version, currentVersion)) {
                    showUpdateDialog(activity, remoteVersion, currentVersion)
                } else {
                    if (manualCheck) {
                        Toast.makeText(
                            activity,
                            "✅ PulseCast TV ist auf dem neuesten Stand (v$currentVersion)",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    onNoUpdate?.invoke()
                }
            }
        }
    }

    private fun showUpdateDialog(
        activity: Activity,
        update: AppVersionResponse,
        currentVersion: String
    ) {
        AlertDialog.Builder(activity)
            .setTitle("🎉 Update verfügbar!")
            .setMessage("Eine neue Version von PulseCast TV ist bereit:\n\n" +
                    "• Installiert: v$currentVersion\n" +
                    "• Neu: v${update.version}\n\n" +
                    "${update.releaseNotes ?: "Verbesserungen und neue Funktionen."}\n\n" +
                    "Möchtest du das Update jetzt herunterladen und installieren?")
            .setPositiveButton("Jetzt aktualisieren 🚀") { _, _ ->
                downloadAndInstall(activity, update)
            }
            .setNegativeButton("Später", null)
            .show()
    }

    fun downloadAndInstall(activity: Activity, update: AppVersionResponse) {
        // Request install permission on Android 8+ if not granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!activity.packageManager.canRequestPackageInstalls()) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:${activity.packageName}")
                )
                Toast.makeText(activity, "Bitte erlaube PulseCast das Installieren von Updates", Toast.LENGTH_LONG).show()
                activity.startActivity(intent)
                return
            }
        }

        // Determine download URL (server direct or GitHub)
        val downloadUrl = if (update.apkUrl.startsWith("http")) {
            update.apkUrl
        } else {
            "${ApiClient.baseUrl}${update.apkUrl}"
        }

        // Show progress dialog
        val layout = android.widget.LinearLayout(activity).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(50, 40, 50, 40)
        }
        val progressBar = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = false
            max = 100
        }
        val statusText = TextView(activity).apply {
            text = "Lade Update herunter (0%)..."
            textSize = 16f
            setPadding(0, 20, 0, 0)
        }
        layout.addView(progressBar)
        layout.addView(statusText)

        val progressDialog = AlertDialog.Builder(activity)
            .setTitle("📥 PulseCast TV wird aktualisiert")
            .setView(layout)
            .setCancelable(false)
            .show()

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val apkFile = File(activity.cacheDir, "PulseCast-update.apk")
                if (apkFile.exists()) apkFile.delete()

                val conn = openFollowRedirects(downloadUrl)
                val contentLength = conn.contentLength
                val input = conn.inputStream
                val output = FileOutputStream(apkFile)

                val buffer = ByteArray(16384)
                var bytesRead: Int
                var totalBytesRead = 0L

                while (input.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    totalBytesRead += bytesRead

                    if (contentLength > 0) {
                        val progress = ((totalBytesRead * 100) / contentLength).toInt()
                        withContext(Dispatchers.Main) {
                            progressBar.progress = progress
                            statusText.text = "Lade Update herunter: $progress% (${totalBytesRead / (1024 * 1024)} MB)"
                        }
                    }
                }

                output.flush()
                output.close()
                input.close()
                conn.disconnect()

                if (apkFile.length() < 100_000) {
                    throw IllegalStateException("Heruntergeladene Datei ist unvollständig (${apkFile.length()} Bytes)")
                }

                withContext(Dispatchers.Main) {
                    progressDialog.dismiss()
                    triggerApkInstall(activity, apkFile)
                }

            } catch (e: Exception) {
                Log.e(TAG, "Download failed", e)
                withContext(Dispatchers.Main) {
                    progressDialog.dismiss()
                    Toast.makeText(activity, "Update-Fehler: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun openFollowRedirects(initialUrl: String, maxRedirects: Int = 10): HttpURLConnection {
        var currentUrl = initialUrl
        var redirects = 0

        while (redirects < maxRedirects) {
            val url = URL(currentUrl)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 10000
                readTimeout = 30000
                instanceFollowRedirects = false
                setRequestProperty("User-Agent", "PulseCast-TV-Updater")
            }

            val status = conn.responseCode
            if (status in 300..399) {
                val newUrl = conn.getHeaderField("Location")
                conn.disconnect()
                if (!newUrl.isNullOrEmpty()) {
                    currentUrl = if (newUrl.startsWith("http")) newUrl else URL(url, newUrl).toString()
                    redirects++
                    continue
                }
            }
            return conn
        }
        throw IllegalStateException("Zu viele Weiterleitungen für URL: $initialUrl")
    }

    private fun triggerApkInstall(activity: Activity, apkFile: File) {
        try {
            val apkUri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.fileprovider",
                apkFile
            )

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // Grant read permission to all matching package installer handlers
            val resInfoList = activity.packageManager.queryIntentActivities(installIntent, PackageManager.MATCH_DEFAULT_ONLY)
            for (resolveInfo in resInfoList) {
                val packageName = resolveInfo.activityInfo.packageName
                activity.grantUriPermission(packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            activity.startActivity(installIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start install intent", e)
            Toast.makeText(activity, "Installationsfehler: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun getInstalledVersionName(context: Context): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    private fun isNewerVersion(remote: String, current: String): Boolean {
        val rParts = remote.split(".").mapNotNull { it.toIntOrNull() }
        val cParts = current.split(".").mapNotNull { it.toIntOrNull() }

        val length = maxOf(rParts.size, cParts.size)
        for (i in 0 until length) {
            val r = rParts.getOrElse(i) { 0 }
            val c = cParts.getOrElse(i) { 0 }
            if (r > c) return true
            if (r < c) return false
        }
        return false
    }
}
