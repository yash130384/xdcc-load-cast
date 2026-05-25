# ⚡ XDCC Load & Cast

> **„XDCC? Ist das nicht dieses uralte IRC-Dateitransfer-Ding aus den 90ern?“**
> Ja, genau! Aber diesmal im schicken Anzug, mit Fernbedienung und ohne dass du Kryptografie studieren musst.

**XDCC Load & Cast** ist dein lokales Web-Dashboard, um IRC-Bots nach Dateien zu durchsuchen, sie per DCC herunterzuladen und direkt auf deinen Chromecast zu streamen (oder lokal abzuspielen). Suchen, laden, glotzen – alles aus einem modernen Webinterface.

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
Du brauchst [Node.js](https://nodejs.org/) (aktuelle LTS-Version empfohlen).

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
