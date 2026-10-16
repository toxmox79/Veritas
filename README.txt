Veritas – Gemini-Key-Fix v3.4

PROBLEM:
In v3.3 wurde ein Gemini-Key ausschließlich akzeptiert, wenn er mit "AIza" begann.
Google erstellt seit 2026 auch Authorization Keys, die z. B. mit "AQ." anfangen.

KORREKTUR:
* Keine starre Präfixprüfung mehr (AQ. und AIza werden akzeptiert).
* Grobe Prüfung gegen offensichtlich unvollständige Eingaben / Leerzeichen.
* Erst "Verbindung testen" verifiziert die Zugangsdaten bei Google.
* Fehlermeldungen für 401, 403 und 404 sind aussagekräftiger.
* Service-Worker-Cache auf veritas-shell-v35 aktualisiert.

INSTALLATION:
1. ai-research.js im Hauptverzeichnis von toxmox79/Veritas ersetzen.
2. sw.js im gleichen Verzeichnis ersetzen (zuletzt).
3. GitHub Pages-Veröffentlichung abwarten, App erneut öffnen.
4. Bei einem Updatehinweis "Jetzt aktualisieren" wählen.
5. Unter Einstellungen > KI-Recherche den Schlüssel einfügen und "Verbindung testen".

WICHTIG:
Keine API-Schlüssel in GitHub-Dateien oder Chatnachrichten veröffentlichen.
BLS-Daten, Allergien und andere Browserdaten bleiben bestehen.
Ein erfolgreiches API-Modell-Testsignal prüft noch nicht die Web-Suchfunktion.
Eine Live-Google-API-Anfrage wurde mangels persönlichen Schlüssels nicht durchgeführt.
