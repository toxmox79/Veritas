Veritas – Gemini 3.8 / Interactions API Update (v3.5)

Warum?
Gemini 2.5 Flash ist für neu angelegte Google-API-Zugänge nicht mehr verfügbar.
Google empfiehlt Gemini 3.8 Flash und die Interactions API.

Enthaltene Änderungen
- Wechsel von generateContent auf POST /v1beta/interactions.
- Neue Modellwahl: 3.8 Flash (Standard), 3.6 Flash, 3.5 Flash-Lite.
- Bisher gespeicherte 2.5-Modellwahl wird auf 3.8 umgestellt.
- Verbindungstest ruft verfügbare Modelle ab und prüft die Interactions API.
- Neue Struktur für Suchbelege (Annotations der Interactions API).
- Sicherer API-Schlüssel bleibt lokal; kein Schlüssel in diesem ZIP.
- store:false deaktiviert die optionale serverseitige Interaktionsspeicherung.
- Vor Suchaufruf wird auf potenzielle Kosten hingewiesen.
- Offline-Cache aktualisiert auf veritas-shell-v36.

Installation auf toxmox79/Veritas (GitHub Pages)
1. ai-research.js im Hauptverzeichnis ersetzen.
2. sw.js im Hauptverzeichnis zuletzt ersetzen.
3. GitHub-Pages-Deployment abwarten.
4. App öffnen, bei Updatehinweis „Jetzt aktualisieren“ wählen.
5. Einstellungen > KI-Recherche > „Verbindung testen“.

WICHTIGE KOSTEN-INFORMATION
Google Gemini 3.8 Flash hat ein eingeschränktes kostenloses Tokenkontingent.
Google Search Grounding mit Gemini 3.x steht im kostenlosen API-Tarif laut Google-Preisliste nicht allgemein zur Verfügung.
Für das bezahlte Projekt gibt es aktuell 5000 freie Suchanfragen pro Monat, danach kostenpflichtige Abrechnung.
Der App-Verbindungstest prüft ausdrücklich ohne Google-Websuche.

Daten bleiben erhalten
localStorage, IndexedDB und BLS-4.0-Daten werden nicht gelöscht.

Teststatus
Lokale JavaScript- und Mock-API-Tests, kein echter Schlüssel oder Live-Kostentest.
