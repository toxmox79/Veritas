# Veritas PWA

Installierbare, statische PWA zum Scannen von EAN-/GTIN-Barcodes und Lesen von Open-Food-Facts-Produktinformationen.

## Start

Der Kamera-Scanner und Service Worker benötigen eine sichere Umgebung (HTTPS oder localhost).

- Entpacken und alle Dateien auf GitHub Pages, Netlify oder einen HTTPS-Webserver hochladen. `index.html` im Stammverzeichnis beibehalten.
- Lokal: In diesem Verzeichnis `python -m http.server 8000` starten und `http://localhost:8000` öffnen.
- Auf Android/Chrome über das Browser-Menü „App installieren“ auswählen.

## Technik

- Keine Anmeldung, keine eigene Datenbank, keine privaten Barcode-Protokolle.
- Online-Produktabfrage über `https://world.openfoodfacts.org/api/v3/product/{EAN}`.
- `BarcodeDetector` nativ wenn verfügbar, sonst ZXing-Browserbibliothek dynamisch vom CDN (nur mit Internet).
- Bildscan per `BarcodeDetector`, wenn unterstützt; manuelle EAN-Eingabe überall.
- App-Hülle offline nutzbar; neue Produktabfragen benötigen Internet.

## Wichtige Grenzen

- E-Nummern: Aus Open Food Facts und optional Etikett-Text. Eine fehlende E-Nummer ist kein chemischer Reinheitsnachweis.
- Natürlich vorkommende Stoffe: nur typische Beispiele aus Zutatenhinweisen, **keine Labormessungen**.
- Die NOVA-Einstufung ist eine Verarbeitungs-Kategorie, kein Urteil über Echtheit, Unbedenklichkeit oder Gesundheitswert.
- Eine rechtlich sichere Aussage „Nachbau“ kann die App nicht automatisch treffen.
- Offenlizenz: Open Food Facts Daten unter ODbL; Lizenzpflichten beachten, insbesondere bei Datenkombination und Weiterverbreitung.


## Version 1.1 – Individuelles Prüfprofil
- Unter „Einstellungen“ 14 EU-Allergengruppen und individuelle E-Nummern auswählen.
- Einstellungen werden nur im Browser per localStorage gespeichert (kein Konto, keine Synchronisation).
- Nach jedem Produktabruf Warnungen für als enthalten gekennzeichnete Allergene, mögliche Spuren und unerwünschte Zusatzstoffe.
- Fehlende Daten werden ausdrücklich als unsicher angezeigt. Die Funktion ersetzt keine Prüfung der Verpackung und ist nicht zur Absicherung einer schweren Allergie geeignet.
