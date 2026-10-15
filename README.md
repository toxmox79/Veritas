# Veritas 2.9 – vollständiger Bundeslebensmittelschlüssel 4.0 als lokale Datenbank

## Wichtig: BLS-Originaldaten importieren
Der BLS-Datensatz selbst ist **nicht im Download-ZIP enthalten**, da der direkte Download
in der Entwicklungsumgebung technisch nicht funktionierte. Das ZIP enthält aber den
fertigen **vollständigen Importer, die lokale Datenbank und den Offline-Nährstoffrechner**.
Einmaliger Datenimport über das **offizielle BLS-4.0-ZIP** (keine kostenpflichtige API):

1. Originaldatei beim Max Rubner-Institut herunterladen: https://blsdb.de/download
2. Veritas über HTTPS (z. B. GitHub Pages) öffnen, **Einstellungen → BLS 4.0** aufklappen.
3. **„Offizielle BLS-ZIP / XLSX importieren“** klicken und die unveränderte Datei auswählen.
4. Nach dem Import meldet Veritas **7.140 Lebensmittel und 138 Nährstoffe**.
5. Unter **„Lebensmittel-Nährstoffdatenbank (BLS 4.0)“** Lebensmittel finden, beliebige
   Nährstoffkomponenten sortieren, Mengen in Gramm rechnen und die Datenherkunft einsehen.
6. Bei Nahrungsergänzungsmitteln basieren die Lebensmittelmengen ab dann auf den BLS-Daten,
   sofern der jeweilige Nährstoff eine belastbare Zuordnung im Datenbestand hat.

**Für Veröffentlichung an andere Nutzer:**
Nach dem Import in Einstellungen auf **„Datenpaket für GitHub Pages exportieren“** klicken.
Die heruntergeladene `bls4-data.json.gz` **neben `index.html`** auf GitHub Pages hochladen.
Die App lädt dieses Datenpaket beim ersten Aufruf neuer Nutzer automatisch und speichert
es in deren lokaler IndexedDB. Danach sind Suche und Mengenberechnung auch offline verfügbar.
Der ZIP-Importer und der Export benötigen moderne Browser mit `DecompressionStream`
und `CompressionStream` (aktuelle Android-Chrome-, Firefox- und Edge-Versionen).

**Technische Umsetzung:** Original-XLSX wird direkt aus dem amtlichen ZIP entpackt, ohne
Drittanbieter-API. Alle 7.140 BLS-Codes, Lebensmittelbezeichnungen, 138 Nährstoffwerte pro
Lebensmittel sowie Datenherkunft und Referenzen werden erfasst. Fehlende Felder werden
als unbekannt angezeigt, nicht als 0. Werte gelten für 100 g essbaren Anteil.
Ein importierter BLS-Code ist **keine EAN eines Markenprodukts**. Der BLS enthält keine
vollständigen Allergenlisten und keine aktuellen Preise. BLS-Rezeptur und Zutaten
werden Markenprodukten nicht automatisch zugeordnet.

**BLS-Lizenz und Namensnennung:**
Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 — Deutsche
Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0.
CC BY 4.0 https://creativecommons.org/licenses/by/4.0/deed.de

**Entwicklungstest:** Browser-XLSX-/ZIP-Import mit synthetisch erzeugten 7.140 Lebensmittel-
zeilen, 138 Nährstoffspalten und einer vollständigen ZIP-Struktur geprüft. Der echte BLS-
Originaldownload und die lokale IndexedDB-Speicherung konnten in der eingeschränkten
Testumgebung nicht vollständig End-to-End geprüft werden. Bitte den ersten Import auf der
veröffentlichten Seite testen, bevor Veritas an andere Nutzer verteilt wird.

---

# Veritas v2.8 – Nährstoffmengen aus Lebensmitteln statt pauschaler Nahrungsergänzungsempfehlungen

## Neu: natürliche Lebensmittel als Mengenvergleich – auch bei Kombipräparaten

- **Vitamin C 100 mg**: beispielsweise ca. **190 g Orange**, ca. **80 g rote Paprika** oder ca. **110 g Kiwi** (gerundete Tabellenwerte für essbaren Anteil).
- **Kombipräparate**: Zusammengerechnete, überschlagsmäßige Lebensmittelkombinationen für mehrere Nährstoffe; die Deckung wird für **jeden Nährstoff einzeln** in Prozent und Menge angezeigt. Es handelt sich nicht um eine optimierte Ernährungsplanung.
- **Nicht abgedeckte Stoffe**: werden ausdrücklich aufgeführt, nicht aus der Auswertung verschwiegen. Omega-3 wird nicht pauschal als beliebig austauschbares ALA/EPA/DHA behandelt. Jod wird aufgrund stark schwankender Lebensmitteldaten nicht pauschal hochgerechnet.
- **Plausible Portionen**: bei besonders großen errechneten Einzelportionen erscheint ein Hinweis. Die gemeinsame Lebensmittelkombination beschränkt die Portionen und kann deshalb einige Zielmengen nicht vollständig erreichen.
- **Persönliche Allergien**: bekannte allergenhaltige Referenzlebensmittel werden aus der Alternativenliste ausgeschlossen; das garantiert jedoch keine Allergenfreiheit im Handel. Bei Niereninsuffizienz erscheint ein zusätzlicher Hinweis auf die begrenzte Aussagekraft.
- **Hilfsstoffe aufschlüsseln**: auf dem Etikett ausdrücklich genannte Füllstoffe, Trennmittel, Kapselbestandteile, Süßungsmittel und Aromen erhalten eine kurze Funktionsbezeichnung, keine automatische Schädlichkeitsbehauptung.
- **Keine Arzneimittel**: Die neue Funktion bewertet ausdrücklich Nahrungsergänzungsmittel und ihre Lebensmittelinhaltsstoffe. Keine Medikation oder Therapieempfehlung.
- **Daten**: handverlesene, gerundete Orientierungswerte für derzeit 16 häufige Lebensmittel, basierend auf Referenzwerten aus Lebensmittelzusammensetzungstabellen. Nicht die gesamte BLS-Datenbank eingebaut oder live abgefragt. Es gelten natürliche Schwankungen nach Sorte, Zubereitung, Lagerung und Charge; individuelle Aufnahme kann abweichen.
- **Datenschutz**: Präparate-Etiketten und Profile bleiben wie bisher im Browser. Keine neue Nutzerregistrierung, keine zusätzliche Cloud-Schnittstelle.

### Bedienung
1. EAN scannen, die Produktart **Nahrungsergänzungsmittel** wählen, falls die automatische Erkennung nicht anschlägt.
2. **Angaben vom Etikett ergänzen** öffnen und Tagesportion sowie Nährstoffmengen als `Name; Menge; Einheit` erfassen (z. B. `Vitamin C; 100; mg`, `Magnesium; 150; mg`, `Vitamin B6; 1; mg`).
3. Speichern; im Auswertungsbereich **„Nährstoffe aus Lebensmitteln – Mengenvergleich“** Einzelalternativen und bei mindestens zwei unterstützten Nährstoffen eine kombinierte Lebensmittelberechnung ansehen.

### Referenzquellen
- [Bundeslebensmittelschlüssel 4.0 – Max Rubner-Institut](https://blsdb.de/) – Open Data CC BY 4.0, allgemeine Lebensmittel-Nährstoffdaten (2025).
- [USDA FoodData Central](https://fdc.nal.usda.gov/) – Referenz für Nährstoffzusammensetzungen.

**Grenzen:** Nährstoffgleiche Mengen bedeuten nicht automatisch identische Bioverfügbarkeit, Verträglichkeit oder gesundheitliche Wirkung. Die App erkennt keinen individuellen Bedarf und bewertet keine Schadstoff- oder Pestizidrückstände dieser Lebensmittel. Ein rechnerisches Beispiel ist keine automatische Verzehrempfehlung, gerade bei chronischen Erkrankungen.

---

# Veritas 2.7 – Nahrungsergänzungsmittel & Werbeversprechen

## Neuer Bereich
- Lebensmittelanalysen bleiben bestehen. **Medikamente werden bewusst nicht bewertet.**
- Nach Barcode-Scan Produktart automatisch erkennen; über die Auswahl **„Nahrungsergänzungsmittel“** auch manuell erzwingen. Bei fehlendem Datenbankprodukt können Etikettangaben lokal ergänzt werden. Das ist **kein** amtlich bestätigter Produktdatensatz.
- Eigene Analyseansicht für Nahrungsergänzungsmittel statt Nutri-Score, NOVA und Lebensmittel-Ampel; bestehende Lebensmittelvergleiche bleiben unverändert.
- **Tagesportion und Deklaration:** Nährstoffe, Mengen (mg, µg, g), Zutaten und Werbeversprechen von der Verpackung im Etikett-Editor eintragen. Keine Schätzung aus Nährwerten je 100 g. Mengen ohne geprüfte Einheit (z. B. IE) werden abgewiesen. Die Daten werden **nur im lokalen Browserprofil** unter dem jeweiligen Barcode gespeichert.
- **Dosierungsprüfung:** Derzeit sind quantitative BfR-Vergleiche für Magnesium (250 mg/Tag) und Vitamin B6 (0,9 mg/Tag) hinterlegt. Beide Zahlen sind **Höchstmengenvorschläge pro Tagesverzehrempfehlung eines NEM-Produkts**, keine gesetzlichen Höchstwerte und keine individuellen medizinischen Sicherheitsgrenzen. Mehrere gleich deklarierte Nährstoffmengen werden pro Produkt zusammengerechnet. Für andere Stoffe gilt **„kein geprüfter Richtwert integriert“**, nicht „unbedenklich“.
- **Werbeversprechen:** Je Zeile den Originalwortlaut eintragen. Die PWA kennzeichnet auffällige Heilungsversprechen (z. B. „Heilt Diabetes“), ordnet eine **kleine Auswahl** typischer Aussagen vorsichtig bekannten EU-Claim-Bereichen zu und meldet den Rest als **ungeprüft**. **KEIN vollständiger automatischer Rechts-/EU-Register-Abgleich**, keine Feststellung einer Rechtsverletzung. Eine mögliche Zuordnung bedeutet nicht, dass die verwendete Formulierung, Menge oder Kennzeichnung zulässig ist.
- **Vorsorge:** Hinweise zu natürlichen Lebensmitteln als Quellen, ohne die Nährstoffaufnahme oder eine Therapiegleichwertigkeit zu behaupten. Bereits vorhandene Allergie- und Niereneinstellungen werden ergänzend beachtet. Bei NEM werden möglicherweise unpassende Schwellenwerte pro 100 g der normalen Lebensmittelanalyse verborgen.
- **Lesbarkeit:** Separate Schriftgröße für den neuen Bereich über Einstellungen → Schriftgrößen & Lesbarkeit, 100–180 %.

## Datenqualität / rechtliche Grenzen
- Open Food Facts wird für die EAN-Suche verwendet. Es ist **keine vollständige deutsche Nahrungsergänzungsmittel-Datenbank**. Angaben und Werbeslogans fehlen häufig. Deshalb können Daten direkt von der Verpackung ergänzt werden.
- Das EU-Register der Kommission umfasst zugelassene und abgelehnte Claims sowie Bedingungen. Ein vollautomatischer Text-, Quellen- und Mengenabgleich ist in **v2.7 noch nicht** implementiert. Angaben unter „Werbeversprechen prüfen“ sind vorsortierte Hinweise, **keine verbindliche rechtliche Prüfung**.
- Arzneimittel, Medikationslisten, echte Wechselwirkungsdatenbanken und Einnahmeempfehlungen sind bewusst nicht Bestandteil von Veritas.
- Die Herstellerangaben zu Wirkstoffen sowie Menge und Verunreinigungen sind ohne unabhängige Laboranalyse nicht verifizierbar. Bei Krankheiten, Schwangerschaft, Kindern, bestehenden Medikamenten oder mehreren Präparaten ärztlich bzw. pharmazeutisch prüfen.
- Eine NEM-Anzeige beim BVL ist **keine Zulassung** oder amtliche Bestätigung der Qualität.

## Amtliche Quellen (Stand Oktober 2026)
- [EU-Register der Gesundheits- und Nährwertclaims](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/eu-register-health-claims_en)
- [EU Datensatz Health Claims (Open Data)](https://data.europa.eu/data/datasets/u3yjqnr7wx2gjkbqmajsya?locale=en)
- [BfR-Höchstmengenempfehlungen](https://www.bfr.bund.de/veroeffentlichung/tabelle-hoechstmengenempfehlungen-des-bfr/)
- [BfR Magnesium](https://www.bfr.bund.de/cm/343/hoechstmengenvorschlaege-fuer-magnesium-in-lebensmitteln-inklusive-nahrungsergaenzungsmitteln.pdf)
- [BfR Vitamin B6](https://www.bfr.bund.de/cm/343/aktualisierung-2024-hoechstmengenvorschlaege-fuer-vitamin-b6-in-lebensmitteln-inklusive-nahrungsergaenzungsmitteln.pdf)
- [BVL zu NEM-Anzeigen](https://www.bvl.bund.de/DE/Arbeitsbereiche/01_Lebensmittel/04_AntragstellerUnternehmen/13_FAQ/FAQ_OnlineShops/FAQ_OnlineShops_node.html)

## Installation
Wie zuvor: **alle Dateien aus `lebensmittel-check/` in den Webroot von GitHub Pages übertragen**, einschließlich neuer Dateien `supplements.js` und `supplements.css`, Manifest, Icons und Service Worker. Über HTTPS aufrufen. Alte Profil- und Preisdaten bleiben bei gleicher Adresse erhalten. Falls ein altes Design erscheint, Seite aktualisieren oder PWA schließen und erneut öffnen; Offline-Cache ist auf `veritas-v27` angehoben.

---

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
