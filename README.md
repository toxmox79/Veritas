# Veritas PWA v1.3

## Neuerungen
- **Authentizitäts-Ampel** nach EAN-Scan: Rot = Ersatz-/Imitationsmerkmale in den vorhandenen Daten, Gelb = Verdachtsmerkmale, Grün = keine erkannten definierten Nachahmungsmerkmale, Grau = fehlende Zutatenliste.
- Kategoriebezogene Analyse, z. B. Käsealternativen, fleischähnliche Ersatzprodukte, Schokoladenersatz/Fettglasur, aromatisierte Geschmackssorten.
- Normale Gewürze, E-Nummern und hoher NOVA-Grad lösen allein keinen Nachahmungsalarm aus.
- Warnungen werden mit konkreten Gründen erklärt.

**Wichtig:** Die Ampel erkennt nur Indizien aus öffentlichen Deklarationsdaten. Sie kann nicht sicher sagen, ob Laborprozesse verwendet wurden, ob alle Komponenten natürlichen Ursprungs sind oder ob eine rechtlich relevante Verbrauchertäuschung vorliegt. Grün ist kein Prüfsiegel. Der Einsatz pflanzlicher Alternativen ist nicht automatisch Täuschung.

## Installation
Alle Dateien gemeinsam auf einem HTTPS-Webserver (z. B. GitHub Pages) veröffentlichen. Die Icons im `icons`-Verzeichnis müssen erhalten bleiben. Für Kamera-Scanning ist HTTPS oder localhost nötig. Produktabfragen benötigen Internet.

Veritas nutzt Open Food Facts als Community-Datenquelle (ODbL); die Daten können unvollständig oder veraltet sein. Lokale Einstellungen für Allergien und zu meidende Zusatzstoffe bleiben bei Aktualisierung unter derselben Domain erhalten.


## Version 1.4 – Anzeige und Barrierearmut
- Unter Einstellungen individuell ein-/ausblendbare Analysebereiche (Authentizität, NOVA, Nährwerte, Zutaten, Stoffkunde, Nachahmung).
- Einfachansicht und „Alle anzeigen“.
- Schrift- und Bediengröße 100–150 % sowie optional höherer Kontrast.
- Einstellungen werden lokal gespeichert und sofort angewendet.
- Produktidentität und persönliche Allergie-/Meidungswarnungen können nicht ausgeblendet werden.
- Bestehende Allergie- und Meidungsprofile bleiben beim Update erhalten.

## Version 1.5 – Aussagekräftigere Rezeptur-Ampel
- Produktgruppenübergreifende Prüflogik für Käse/Schmelzkäse, Fleisch und Ersatzprodukte, Kakao/Schokolade, Milchzubereitungen, Fruchtgetränke, aromatisierte Sorten und industrielle Einzelzutaten.
- Erklärte Auslöser pro Befund; Schmelzkäse mit echtem Käse wird gelb eingestuft, nicht pauschal als Imitat bezeichnet.
- Rot = klare Ersatzmerkmale (auch offen deklarierte vegane Alternativen); Gelb = Verarbeitungs-/Aromatisierungs-/Rezepturhinweise; Grün = keine definierten Indizien in vorhandener Zutatenliste; Grau = keine Zutatenliste.
- Separate NOVA-Angabe: hohe Verarbeitung und Nachahmung sind nicht dasselbe. Auch bei grüner Ampel kann ein Produkt stark verarbeitet sein.
- Warnhinweis: kein Herkunfts-, Reinheits-, Laborfreiheits- oder Echtheitszertifikat und keine Feststellung rechtswidriger Täuschung.
- Testfälle gegen plausible Produktgruppen geprüft. Datenabhängige Regeln können falsch-positive und falsch-negative Befunde liefern.


## v1.6 – gesundheitliche Einordnung von Zusatzstoffen
Für eine Auswahl häufig vorkommender E-Nummern existieren lokal verfügbare Stoffsteckbriefe mit Funktion, möglichen Auswirkungen, Risikogruppen, Evidenzhinweis und Links zu regulatorischen Quellen. Für noch nicht kuratierte Stoffe erscheint ausdrücklich **„noch nicht geprüft“**; die App erfindet keine Risikobewertung. Die Zutatenliste enthält meist keine Dosis, daher wird keine persönliche Exposition oder akute Gefahr behauptet. Besonders E452/E450/E451 wird anhand der EFSA-Phosphatbewertung erläutert. Quellenlinks müssen online geöffnet werden.


## v1.7 – Gesundheitsprofil
In den Einstellungen lassen sich freiwillig mehrere Krankheiten/Ernährungsthemen auswählen. Lokale Speicherung unter `veritas-health-profile-v1` ohne Übermittlung der Auswahl an den Produktdatenanbieter. Bei jedem Scan erscheinen separat begründete Warn-, Hinweis- oder Datenlückenmeldungen zu vorhandenen Nährwerten/Zusatzstoffen. Die Schwellenwerte sind allgemeine Kennzeichnungs-Heuristiken, keine individuellen Behandlungsgrenzen. Bei Nierenerkrankungen, PKU und Zöliakie ist keine automatische Freigabe möglich.
