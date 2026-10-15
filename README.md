# Veritas PWA v2.6 – Vorsorgeprinzip und Speiseölbewertung

## Neu in dieser Version

- **Vorsorgeprinzip:** Naturnahe, weniger stark verarbeitete Rezeptur bei vergleichbarem Nutzen standardmäßig bevorzugen. Medizinische Kontraindikationen, Allergien und bessere Fettprofile werden dadurch nicht überstimmt.
- **Einstellungen → Naturnähe & Vorsorgeprinzip:** Vorrang ein-/ausschalten, Ölverwendung für kalte oder warme Speisen wählen. Speicherung erfolgt lokal.
- **Einzelanalyse:** Neues Feld **Körpernutzen & Vorsorge** mit begründeten Beobachtungen und aufklappbaren Wissenslücken.
- **Speiseöle:** Erkennung von Raps-, Oliven-, Sonnenblumen-, Lein-, Walnuss-, Sesam-, Erdnuss-, Kokos- und weiteren Ölen auch ohne Zutatenverzeichnis, wenn die Produktbezeichnung eindeutig ist. Herstellungsangaben (kaltgepresst, nativ, raffiniert) nur bei ausdrücklicher Angabe. Kennzeichnung als Ableitung aus der Produktbezeichnung, keine Laborprüfung.
- **Vergleich:** Öle werden nach Fettsäureprofil und geplanter Verwendung bewertet; nicht nach Kalorien oder der Anzahl deklarierter Zutaten. Preisvergleich bleibt separat.
- **Alternativen:** Sortenreine Öle ohne Zutatenliste werden nicht ausgeschlossen; bei fehlendem Fettprofil keine erfundene Gesundheitsbewertung.

**Grenzen:** Aus dem Barcode lässt sich keine Reinheit, Herstellungs- oder Oxidationsqualität nachweisen. „Natürlich“ bedeutet nicht automatisch gesund, „industriell“ nicht automatisch schädlich. Fehlende Langzeitdaten sind kein Beweis für eine konkrete Gefahr. Vergleiche ersetzen keine individuelle medizinische Beratung oder den Etikett-/Allergenabgleich.

**EU-Rechtsgrundlage für Zutatenverzeichnisse:** [Verordnung (EU) Nr. 1169/2011, Artikel 19](https://eur-lex.europa.eu/legal-content/DE-EN/ALL/?uri=CELEX:32011R1169).

**Fettsäure-Einordnung:** [WHO: Gesunde Ernährung](https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet) – die Zusammensetzung der Fette ist ernährungsphysiologisch relevanter als die Kalorienzahl verschiedener Öle.

**Installation:** Dateien aus `lebensmittel-check/` gemeinsam auf GitHub Pages veröffentlichen. Die Manifest- und Service-Worker-Dateien müssen im gleichen Webroot liegen. Installierbare PWA benötigt HTTPS (oder localhost). Die Produktabfrage braucht Internet.

----

# Veritas v2.5 – passende Alternativen finden

## Neu
- Einzelscan: manuell „Passende Alternativen suchen“ starten.
- Vergleich: Alternativen gezielt zu A oder B suchen.
- Suche innerhalb der passenden Lebensmittelkategorie über die Open-Food-Facts-Suche (API v2, begrenzte Ergebnisse, 20-Minuten-Tabcache).
- Drei getrennte Ansichten: naturnähere Rezeptur, günstigeres Nährwertprofil, belegbar günstigerer Kilopreis.
- Begründungen für Vorteile; fehlende Zutaten oder Nährwerte sind **kein** Vorteil.
- Lade-/Fehler-/Leerzustände; aus Empfehlungen direkt zur Produktanalyse oder zum Zweiervergleich.
- Lokale Eingabe von Packungspreis und Packungsgröße; kein Preisfeed und keine behaupteten Echtzeitpreise.
- Bei bekannten persönlichen Allergenen oder Meidungsstoffen keine positive Empfehlung; Datenlücken bleiben ausdrücklich als unsicher markiert.

**Grenzen:** Es wird nur eine begrenzte Auswahl ähnlicher Produkte aus Open Food Facts durchsucht. Nicht alle Lebensmittel sind vollständig erfasst; neue Rezepturen können abweichen. „Naturnäher“, „günstiger“ und „für die Ernährung besser“ sind unterschiedliche Maßstäbe. Krankheitsbezogene Eignung kann durch Barcode-Daten nicht freigegeben werden. Alle lokalen Preise sind manuell einzugeben bzw. als historische Richtpreise gekennzeichnet. Gesundheitsprofile werden nicht an Open Food Facts übertragen.

# Veritas v2.4 – Preis-Leistungs-Vergleich

Neu: Vergleich je Kilogramm/Liter, je 10 g Eiweiß, nachvollziehbare Rezepturvorteile und ausdrücklich gekennzeichnete Referenzpreise. Für alle Produkte können aktuelle Ladenpreise und Packungsgrößen selbst eingetragen werden; diese Daten bleiben lokal im Browser. Preisquellen sind keine Live-Angebote. Bei fehlenden Angaben oder unterschiedlichen Lebensmittelgruppen wird kein universelles Gesundheitsurteil ausgegeben.

Referenzbeispiel (15.10.2026 abgerufene, zuletzt gemeldete Preise): EDEKA 4311501125809, 500 g / 1,39 €; REWE 4337256368810, 200 g / 0,89 €. Quellen: https://www.supermarktcheck.de/product/435403-gutgUEnstig-speisequark-magerstufe-500g-500-g und https://www.supermarktcheck.de/rewe/sortiment/high-protein-quarkcreme . Verpackungsdaten: Handelshof (EAN 4311501125809); FoodDB (EAN 4337256368810).

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

## v1.8 – kompakter Startbildschirm
- Beschreibungstext unter „Was steckt wirklich drin?“ entfernt, um das EAN-Feld und die Kameravorschau auf Mobilgeräten höher zu positionieren.
- Abstände im Startbereich reduziert und die Überschrift auf schmalen Bildschirmen kompakter gestaltet, ohne den Seniorenmodus abzuschalten.
- Beim Öffnen des Kamera-Scanners scrollt die Ansicht zur Scanner-Karte, sodass die Kameravorschau sofort erreichbar ist.
- Offline-Cache auf veritas-v9 aktualisiert. Bestehende persönliche Einstellungen bleiben erhalten.

## v1.9 – Kontexthinweise hinter Fragezeichen
- Allgemeine Bewertungsregeln und methodische Einschränkungen über kompakte, anklickbare **?**-Hinweise in den Ergebnisbereichen verfügbar (Echtheit, NOVA, Zusatzstoffe, Nachahmung, Gesundheitsprofil, Allergie-/Meidungsprofil und Datenquelle).
- Produktbezogene Befunde, konkret erkannte Zutaten, Ampelfarben, Nährwerte, Allergiewarnungen, wichtige Datenlücken und gesundheitliche Warnungen bleiben direkt sichtbar.
- Touch-, Maus- und Tastaturbedienung mit nativen `details`-Elementen, auch bei vergrößerter Schrift.
- Allgemeine Datenschutzhinweise im Footer sind ebenfalls hinter **?** zusammengefasst.
- Offline-Cache `veritas-v10`; bisherige Profileinstellungen bleiben unverändert.


## Veritas v2.0 – Vergleich zweier Produkte

- Auf der Startseite **„Zwei Lebensmittel vergleichen“** öffnen, Produkt A und B per EAN oder Kamera erfassen; alternativ ein bereits geladenes Produkt mit **„Dieses Produkt vergleichen“** übernehmen.
- Rezeptur/Authentizität und NOVA-Verarbeitung getrennt vom Nährwertprofil betrachten. Bei vorhandenen Daten direktes Gegenüberstellen von Nutri-Score, Zucker, Salz, gesättigtem Fett, Ballaststoffen, Kohlenhydraten, E-Nummern und Zutaten.
- Ein Gesamttipp erscheint nur, wenn vergleichbare Produktgruppen und **übereinstimmende, ausreichend belegte Einzelurteile** vorliegen. Sonst werden Unterschiede ohne künstlichen Gesamtsieger beschrieben.
- Vorhandene lokale Allergen-, Zusatzstoff- und Gesundheitsprofile werden berücksichtigt. Ein anderes Produkt wird nicht als allergenfrei/medizinisch sicher behauptet, nur weil kein Eintrag gefunden wurde.
- Vergleiche verwenden Open Food Facts. Internetverbindung erforderlich. Vergleichsdaten werden nicht dauerhaft gespeichert. Mehr Daten bedeuten nicht automatisch bessere Qualität; unterschiedliche Produktgruppen sind nur eingeschränkt vergleichbar.

Installationshinweis: Nach Aktualisierung auf GitHub Pages die Seite bei Bedarf neu laden, damit der neue Service-Worker-Cache aktiv wird.


## Veritas 2.1 – aussagekräftiger Produktvergleich

- **Deklarierte Zutatenprozente** (z. B. 13 % vs. 36 % Haselnüsse) und erste Zutat werden extrahiert und direkt gegenübergestellt. Keine Schätzungen fehlender Werte.
- **Nährwertvorteile je Produkt** (Zucker, Fett, gesättigte Fette, Energie) mit konkreten Differenzen. Kein pauschaler Gesundheitssieger bei gemischtem Ergebnis. Vergleich bevorzugt gleiche Produktgruppen.
- **Ergänzte Produktdaten** für die beiden geprüften EANs 3017620422003 und 4018087009331; Produktquellen erscheinen im Vergleich und in der Einzelansicht. Quellenstand 15.10.2026. Bei anderen EANs werden Open Food Facts v3 und, wenn nötig, v2 abgefragt. Nicht jede EAN hat verlässliche ergänzende Daten.
- **„Etikett ergänzen“**: Produktname, komplette Zutatenliste und Nährwerte können bei fehlenden/abweichenden Informationen per Hand lokal im Browser ergänzt, korrigiert und wieder gelöscht werden. Keine automatische Validierung eingegebener Werte; die konkrete Verpackung bleibt maßgeblich.
- **Wichtiger chargenabhängiger Rückruf (nur ein konkret geprüfter Fall)**: Für Nudossi 300 g / EAN 4018087009331 mit MHD 01.08.2026–30.09.2026 wird der bestätigte Salmonellen-Rückruf samt Herstellerlink angezeigt. Diese lokal gepflegte Meldung ist **kein vollständiger oder automatisch aktualisierter Rückrufdienst**. Die EAN allein erlaubt keine Aussage zur Betroffenheit des einzelnen Glases.
- Nach einem Versionswechsel ggf. PWA schließen, neu öffnen und einmal online aktualisieren, damit die neue Cache-Version geladen wird.

**Nachweise für manuell ergänzte Datensätze:**
- Nutella / EAN 3017620422003: https://www.nutella.com/de/de/produkte/nutella
- Nudossi / EAN 4018087009331: https://www.olial.de/produkt/nudossi-haselnuss-nougat-creme-300g/
- Chargenrückruf Nudossi: https://www.vadossi.de/2026/06/15/produktrueckruf-fuer-nudossi-haselnuss-nougat-creme/

**Einschränkungen:** Unterschiedliche Rezeptur-/Produktstände, länderspezifische Varianten und Allergene können auf Händlerseiten veraltet oder unvollständig sein. Bei Allergien, Gesundheitsprofilen und Rückrufen Etikett/MHD prüfen. „Weniger Zucker“ ersetzt keine Beurteilung der Kohlenhydrate und Portionsgröße bei Diabetes.


## Veritas 2.2 – strukturierte Einstellungen und Bereichsschriftgrößen

- Einstellungen in fünf großen, aufklappbaren Gruppen: Anzeige, Schriftgrößen, Gesundheit, Allergien und Zusatzstoffe.
- Globale Schriftgröße (100–150 %) und eigene zusätzliche Vergrößerung (100–180 %) für Zutatenliste, Zusatzstoffe, Nährwerte, Ampel, Verarbeitung, Rezepturhinweise, persönliche Warnungen und den Produktvergleich.
- Alle Anzeige-/Schriftpräferenzen werden beim Verändern automatisch unter `veritas-display-v1` lokal gespeichert; bestehende Profile werden eingelesen und um Standardwerte für Bereichsschriften erweitert.
- Allergien, Krankheiten und zu meidende Zusatzstoffe werden weiterhin erst mit „Prüfprofil speichern“ übernommen. „Profil zurücksetzen“ betrifft diese persönlichen Angaben, **nicht** Anzeige und Schriftgrößen.
- Auf Smartphones bleiben alle Einstellungsgruppen mit großen Tippflächen erreichbar.


## v2.3 – Keine falsche Datenlücke bei ausgenommenen Zutatenverzeichnissen

- EAN 4311501125809: anhand des EAN-bezogenen Händlereintrags als GUT&GÜNSTIG Speisequark Magerstufe erfasst, inkl. Allergiehinweis Milch und Nährwerten; **keine erfundene konkrete Zutatenliste**.
- Manche Produkte benötigen nach Art. 19 VO (EU) 1169/2011 unter Bedingungen kein Zutatenverzeichnis. Veritas unterscheidet zwischen dieser Möglichkeit und fehlender Datenerfassung.
- Bei Quark vs. Quarkcreme begründete Rezepturtendenz auf Basis dokumentierter Zusatz-/Ersatzmerkmale; kein pauschales Gesundheitsurteil.
- Hersteller-/Händlerangaben und eigene Etikett-Ergänzungen haben in der Produktdarstellung Quellenbelege. Die Originalverpackung hat Vorrang.

- Ausgeschriebene Zusatzstoffnamen (z. B. Guarkernmehl/E412, Acesulfam K/E950, Sucralose/E955) werden ergänzend erkannt, auch wenn keine E-Nummer im Text steht.
