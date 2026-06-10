# 📡 PulseCast

> **„XDCC? Ist das nicht dieses uralte IRC-Dateitransfer-Ding aus den 90ern?“**
> Ja, genau! Aber diesmal im schicken Anzug, mit Fernbedienung und ohne dass du Kryptografie studieren musst.

**PulseCast** ist dein lokales Web-Dashboard, um IRC-Bots nach Dateien zu durchsuchen, sie per DCC herunterzuladen und direkt auf deinen Chromecast zu streamen (oder lokal abzuspielen). Suchen, laden, glotzen – alles aus einem modernen Webinterface.

---

## 🚀 Die Features (oder: Was kann das Teil?)

* **🔍 IRC-Suche auf Steroids:** Durchsuche `xdcc.eu` und den legendären `#moviegods` IRC-Kanal gleichzeitig. Inklusive einer Liste der tagesaktuellen Top-Downloads (German), damit du immer weißt, was gerade "in" ist.
* **📥 DCC-Downloads für Menschen:** Echte Fortschrittsbalken, Live-Download-Geschwindigkeit und eine verlässliche ETA. Kein Rätselraten mehr. Er warnt dich sogar, wenn der Bot dir einen anderen Dateinamen unterjubeln will!
* **📺 Chromecast Casting („Cast“):** Das Highlight. Datei fertig geladen? Klick auf „Cast“, wähle deinen Fernseher im Netzwerk und lehn dich zurück. Deine Couch wird es dir danken.
* **🎬 Lokaler Player („Load“):** Zu faul für den Fernseher? Ein Klick öffnet die Datei direkt im Standard-Player deines Rechners (VLC, MPV, etc.).
* **🧹 Die automatische Müllabfuhr:** Deine Festplatte quillt über? Stell einfach in den Einstellungen ein, nach wie vielen Tagen fertige Downloads automatisch gelöscht werden sollen. Weg mit dem Ballast!
* **🎨 Premium Dark Mode:** Ein extrem schickes, modernes Glassmorphism-UI. Schont die Augen bei nächtlichen Suchaktionen.

---

## 🛠️ Installation & Schnellstart

### Voraussetzungen
1. **Node.js**: Aktuelle LTS-Version empfohlen.
2. **System-Utilities**: Da das Tool heruntergeladene Archive entpackt, Medien transkodiert und Audio-Codecs analysiert, müssen folgende Pakete auf dem Betriebssystem installiert sein:
   - **`tar`**: Zum Entpacken von `.tar`, `.tar.gz` und `.tgz` Archiven.
   - **`unrar`** (oder **`7z` / `p7zip`**): Zum Entpacken von `.rar` Archiven.
   - **`ffmpeg`** & **`ffprobe`**: Zur Analyse von Audio-Codecs und für die On-the-Fly Video- und Audio-Transkodierung (z.B. AVI zu MP4, oder DTS/AC-3 zu AAC für Chromecast).

#### Installation unter Linux (Raspberry Pi OS / Debian / Ubuntu):
```bash
sudo apt update
sudo apt install tar unrar p7zip-full ffmpeg
```
*(Hinweis: Falls `unrar` nicht in den Standardquellen enthalten ist, aktiviere die `non-free` Repositories oder nutze `7z` als automatischen Fallback).*

#### Installation unter macOS (Homebrew):
```bash
brew install tar unrar p7zip ffmpeg
```

### Setup in 3 Schritten:

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```
   *(Das installiert automatisch auch alle Frontend-Abhängigkeiten im `client`-Ordner).*

2. **Frontend bauen:**
   ```bash
   npm run build:frontend
   ```

3. **Starten:**
   ```bash
   npm start
   ```

Öffne anschließend dein Browser-Fenster unter **`http://localhost:3000`** und leg los!

---

## ⚙️ Einstellungen
Im Webinterface kannst du über das Zahnrad-Symbol folgendes einstellen:
* **Download-Ordner:** Wo der ganze Kram landen soll.
* **SSL-Standard:** Weil Sicherheit cool ist (selbst im IRC).
* **Aufbewahrungszeit:** Auto-Löschen nach *X* Tagen (0 = deaktiviert).

---

## 🤫 Rechtlicher Disclaimer
Dieses Tool ist nur ein Client. Was du damit suchst und lädst, liegt in deiner eigenen Verantwortung. Sei kein Flegel. 😉
