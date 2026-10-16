Veritas 3.7 – Mehrere KI-Anbieter (BYOK)

ANBIETER: Gemini, GroqCloud, NVIDIA NIM, OpenRouter
- Anbieter in Einstellungen → KI-Recherche auswählen.
- Jeder Anbieter hat seinen eigenen API-Schlüssel, Modell und Verbindungstest.
- Groq: GPT-OSS 20B/120B können über Browser Search direkt nach EAN suchen.
- Gemini: Google Search nur sofern dein Tarif das erlaubt.
- NVIDIA / OpenRouter: Hersteller-Webseite selbst öffnen, Quellenlink und Produkttext unten einfügen, dann mit KI auswerten. Keine erfundene Internetsuche!
- Modelle können aus einer API-Modellliste geladen oder manuell als Modell-ID eingegeben werden.
- Ohne Haken „Schlüssel auf diesem Gerät speichern“ bleibt der Schlüssel im sessionStorage.
- Älterer Gemini-Schlüssel wird weiter erkannt.
- Normale BLS-/Allergie-/Prüfprofil-Daten und Etiketten bleiben unangetastet.

INSTALLATION:
1. ai-research.js, ai-research.css im Repository-Hauptordner ersetzen.
2. sw.js zuletzt ersetzen; Browser-PWA erkennt den Versionswechsel.
3. Neue Veritas-Version aktivieren; unter Einstellungen → KI-Recherche Anbieter auswählen.
4. Den passenden Anbieter-Schlüssel eintragen und Verbindung testen.

SICHERHEIT:
Die Keys stehen im Browser (nicht verschlüsselt). Kein Betreiber-Key im GitHub-Code!
Wenn die PWA öffentlich mit gemeinsamem Key betrieben wird, ist ein Backend nötig.
Live-API-Aufrufe können Kosten/Rate-Limits verursachen. Kein automatisches Provider-Fallback und keine automatischen Gebühren.
Nur Quellenlinks und Herstellerangaben auf reale Plausibilität prüfen; keine sichere Herstelleridentifikation durch KI allein.

BEACHTE: Groq Browser Search ist nur bei den dokumentierten GPT-OSS-Modellen möglich.
Groq Compound wurde im September 2026 eingestellt und wird nicht benutzt.
NVIDIA/OpenRouter übernehmen keine reine EAN-Websuche ohne externen Quellenzugriff.
