# 📺 PulseCast Android TV App

Die offizielle native Android TV / Google TV App für **PulseCast**. 
Vollständig optimiert für TV-Fernbedienungen (D-Pad-Steuerung), hardwarebeschleunigtes Streaming mit ExoPlayer, automatische Server-Erkennung (mDNS) und direkte XDCC/Moviegods-Suche am Fernseher.

---

## ✨ Features

* **🏠 Native Leanback UI**: Flüssige Navigation für Android TV, Google TV und Fire TV Sticks.
* **💾 Lokale Mediathek & IPTV**:
  * Direkter Zugriff auf alle auf dem Server gespeicherten Filme, Serien, Hörbücher und Musik.
  * Integration von IPTV Live-TV-Sendern, VOD-Filmen und Serien.
* **⚡ Nativer ExoPlayer mit Hardware-Decoding**:
  * Flüssige Wiedergabe in 4K / 1080p, Untertitel- und Audiospur-Auswahl.
  * Automatischer Resume (setzt Wiedergabe an der zuletzt gestoppten Stelle fort).
* **🔍 XDCC & Moviegods Suche am TV**:
  * Suche direkt über die Bildschirmtastatur oder Spracheingabe der Fernbedienung nach neuen Releases.
  * Startet den Download mit einem Klick direkt auf deinem PulseCast Server.
* **📥 Warteschlangen- & Statusmonitor**:
  * Anzeige aller aktiven Downloads mit Geschwindigkeit, Fortschritt und Restzeit.
  * Pausieren, Fortsetzen und Abbrechen direkt vom Sofa aus.
* **📡 Auto-Discovery**:
  * Findet deinen PulseCast-Server im lokalen Netzwerk automatisch über mDNS (`_pulsecast._tcp`).
  * Unterstützt auch manuelle IP- und Tailscale-Eingabe.

---

## 🛠️ APK erstellen (Build)

### Voraussetzungen
* Android Studio (oder JDK 17+ und Android SDK Commandline-Tools)

### Befehl zum Erstellen der APK:
Im Ordner `android-tv/` ausführen:
```bash
# Debug APK bauen
./gradlew assembleDebug
```
Die fertige APK liegt anschließend unter:
📁 `android-tv/app/build/outputs/apk/debug/app-debug.apk`

---

## 📲 APK auf Google TV / Android TV installieren (Sideload)

### Option 1: Per ADB (Sehr schnell & einfach)
1. Aktiviere auf deinem TV die **Entwickleroptionen** und das **USB-/Netzwerk-Debugging** (*Einstellungen -> System -> Info -> 7x auf "Android TV-Betriebssystembuild" klicken*).
2. Verbinde dich vom Computer mit dem TV:
   ```bash
   adb connect <IP-DEINES-TV>:5555
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Über die App „Send Files to TV“
1. Installiere die App **Send Files to TV** auf deinem TV und Smartphone/PC.
2. Sende die `app-debug.apk` an den Fernseher.
3. Öffne die APK mit einem Dateimanager auf dem TV (z.B. *AnExplorer* oder *File Commander*) und klicke auf **Installieren**.

### Option 3: Über USB-Stick
1. Kopiere die `app-debug.apk` auf einen FAT32/exFAT formatierten USB-Stick.
2. Stecke den USB-Stick in den Fernseher.
3. Installiere die APK über einen Dateimanager auf dem TV.
