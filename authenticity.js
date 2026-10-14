'use strict';
/* Veritas rules v2: explainable, conservative label analysis, not legal/medical judgement. */
function assessAuthenticity(p){
 const name=(p.product_name_de||p.product_name||'').toLowerCase();
 const raw=(p.ingredients_text_de||p.ingredients_text||'').trim();
 const ing=raw.toLowerCase();
 const category=(p.categories||'').toLowerCase()+' '+(p.categories_tags||[]).join(' ').toLowerCase();
 const context=name+' '+category;
 const matches=[];
 const add=(kind,title,reason,evidence)=>{if(!matches.some(x=>x.title===title))matches.push({kind,title,reason,evidence:evidence||''})};
 const has=(pattern,where=ing)=>pattern.test(where);
 // A disclosed substitute and a deceptive label are different things.
 if(has(/\b(analogkäse|kunstkäse|käseimitat|käseersatz|fleischersatz|milchersatz|schokoladenersatz|schokoladenimitat|kakaohaltige fettglasur|schmelzscheiben auf pflanzenfettbasis)\b/,context+' '+ing))
  add('red','Ersatzprodukt oder Ersatzüberzug','Ein Ersatzcharakter ist ausdrücklich benannt. Eine korrekte Kennzeichnung ist keine Täuschung.','Ersatz- oder Imitatbezeichnung');
 const cheese=has(/käse|gouda|emmental|mozzarella|cheddar|feta|parmesan|pizzabelag|pizza[- ]?belag|schmelzscheibe|cheese/,context);
 const meat=has(/fleisch|wurst|schinken|schnitzel|burger|steak|salami|nugget|hähnchen|chicken|leberwurst/,context);
 const cocoa=has(/schokolade|schoko|kakao|chocolate|praline|glasur/,context);
 const dairy=has(/milch|joghurt|yoghurt|quark|sahne|butter|eiscreme|speiseeis/,context);
 const juice=has(/saft|nektar|fruchtdrink|fruchtgetränk|fruchtsaft|getränk/,context);
 const spicesOnly=has(/gewürz|kräuter|pfeffer|paprika|zimt|salz/,context)&&!has(/geschmack|aromatisiert|geschmacksrichtung/,context);
 const veg=has(/\b(vegan|vegane|veganes|veganer|vegetarisch|pflanzliche alternative|plant.based|meat.free|dairy.free)\b/,context);
 if(veg&&(cheese||meat||dairy))add('red','Als pflanzliche Alternative gekennzeichnet','Das Produkt ersetzt eine klassische tierische Produktart. Der Ersatz ist im Namen erkennbar, nicht versteckt.','Vegan/vegetarisch + Produktart');
 if(cheese&&has(/\b(pflanzenfett|pflanzliche fette|kokosfett|palmfett|pflanzenöl|kokosöl|palmöl)\b/)&&!has(/\b(käse|gouda|emmentaler|mozzarella|milch|quark|molke|sahne)\b/))
  add('red','Käseähnliche Rezeptur ohne erkennbare Milchzutat','Pflanzenfett ist deklariert, jedoch keine klassische Käse-/Milchzutat erkennbar. Zutatenliste und Verkehrsbezeichnung prüfen.','Pflanzenfett ohne identifizierbare Milch/Käse-Zutat');
 if(meat&&has(/\b(sojaprotein|erbsenprotein|weizenprotein|seitan|mykoprotein|texturiertes pflanzenprotein|ackerbohnenprotein)\b/)&&!has(/\b(schweinefleisch|rindfleisch|hähnchenfleisch|putenfleisch|geflügelfleisch|fleischanteil|fleischzubereitung)\b/))
  add('red','Fleischähnliche Proteinrezeptur','Die erkennbare Proteinbasis stammt aus Pflanzen oder Pilzen, nicht aus deklariertem Fleisch.','Pflanzen-/Pilzprotein statt Fleisch');
 if(cocoa&&has(/kakaohaltige fettglasur|kakaohaltiger fettüberzug|schokoladenersatz|schokoimitat/))
  add('red','Kakaohaltiger Ersatzüberzug','Der Zutatenwortlaut beschreibt eine Fettglasur statt Schokolade. Dies kann auch nur einen Produktbestandteil betreffen.','Kakaohaltige Fettglasur');
 // Technology changes (e.g. processed cheese) are yellow, not an allegation that it lacks actual cheese.
 if(cheese&&has(/schmelzkäse|schmelzkaese|schmelzkäsezubereitung|schmelzkäsescheiben|schmelzscheiben/,context+' '+ing))
  add('yellow','Schmelzkäse statt traditionellem Schnittkäse','Schmelzkäse kann echten Käse enthalten, wird aber zu einer neuen Rezeptur verarbeitet. Die Menge echten Käses lässt sich ohne Herstellerangaben oft nicht bestimmen.','Schmelzkäse-Bezeichnung');
 if(cheese&&has(/schmelzsalze?|natriumcitrat|kaliumcitrat|diphosphate|polyphosphate|\be\s*3(?:31|32|39|40|41|42|50|51|52)\b/))
  add('yellow','Schmelzsalze in käsebezogenem Produkt','Schmelzsalze verändern die Textur. Sie belegen keine vollständige Ersetzung des Käses.','Schmelzsalz / Phosphat / Citrat');
 if(cocoa&&has(/\b(palmfett|kokosfett|pflanzenfett|pflanzliche fette|palmöl|kokosöl)\b/))
  add('yellow','Zusätzliche Pflanzenfette bei Schokoladenbezug','Kann Füllung oder Überzug betreffen. Allein daraus folgt kein Schokoladenimitat.','Pflanzliches Fett');
 const flavor=has(/\b(aroma|aromen|aromastoffe|natürliches aroma|natürliche aromen|raucharoma|geschmacksaroma|geschmacksstoffe)\b/);
 const flavorName=has(/geschmack|geschmacksrichtung|aromatisiert|\btyp\b|flavou?r/,name);
 if(flavor&&(flavorName||(!spicesOnly&&(cheese||meat||cocoa||dairy||juice))))
  add('yellow','Zugesetzte Aromen bei namensgebendem Geschmack','Aromen können Geschmacksnoten nachbilden oder verstärken; sie beweisen nicht, dass die namensgebende Zutat fehlt.','Aroma in Zutatenliste');
 const flavors=[['Erdbeer',/erdbeer/,/erdbeer/],['Vanille',/vanille/,/vanilleschote|vanilleextrakt|gemahlene vanille|bourbon-vanille/],['Himbeer',/himbeer/,/himbeer/],['Kirsche',/kirsch/,/kirsch/],['Mango',/mango/,/mango/],['Zitrone',/zitrone|zitronen/,/zitrone|zitronensaft/],['Orange',/orange|orangen/,/orange|orangen/],['Apfel',/apfel/,/apfel|äpfel/]];
 if(flavor)for(const [label,n,i] of flavors){if(n.test(name)&&!i.test(ing))add('yellow',label+'geschmack ohne erkennbare '+label+'zutat','In der erfassten Zutatenliste ist keine passende namensgebende Zutat zu erkennen; Rezeptur und vollständige Deklaration prüfen.','Geschmack im Namen, keine entsprechende Zutat erfasst')}
 if(juice&&has(/fruchtsaftgetränk|fruchtnektar|nektar|fruchtdrink|fruchtgetränk/,context))
  add('yellow','Fruchtgetränk statt reinem Saft','Nektar und Fruchtsaftgetränke sind andere Produktarten als 100 % Fruchtsaft; die Zutaten und Fruchtgehalte entscheiden.','Getränke-Verkehrsbezeichnung');
 if(dairy&&has(/\b(milchmischgetränk|milchzubereitung|dessertcreme|puddingpulver|speiseeiszubereitung)\b/,context))
  add('yellow','Zubereitung statt unverarbeitetem Milchprodukt','Die Produktart deutet auf eine zusammengesetzte Rezeptur; der tatsächliche Milchanteil ist anhand der Angaben zu prüfen.','Zubereitungsbezeichnung');
 if(has(/präzisionsfermentation|precision fermentation|zellkultiviert|zellkulturfleisch|cultivated meat|zellkultur/,context+' '+ing))
  add('yellow','Biotechnologisches Herstellungsverfahren benannt','Herstellungsverfahren erkennbar. Ohne Kennzeichnung lässt sich eine solche Herstellung aus dem Barcode allein nicht ausschließen.','Verfahrenshinweis');
 // Broad use of modified starch, protein isolates etc. is a processing signal, not evidence of imitation.
 if(has(/modifizierte stärke|maltodextrin|hydrolysiertes pflanzenprotein|proteinisolat|glukose-fruktose-sirup|glucose-fructose-sirup|gehärtetes pflanzenfett/))
  add('yellow','Industriell aufbereitete Zutat','Ein isolierter oder technisch modifizierter Bestandteil ist deklariert. Das bedeutet nicht automatisch, dass ein Lebensmittel nachgeahmt wird.','Modifizierte/isolierte Zutat');
 const nova=Number(p.nova_group);
 const processing=nova>=1&&nova<=4?nova:null;
 const hasIngredients=Boolean(raw);
 let level=matches.some(x=>x.kind==='red')?'red':matches.some(x=>x.kind==='yellow')?'yellow':hasIngredients?'green':'unknown';
 const heading={red:'Ersatzmerkmale festgestellt',yellow:'Rezeptur oder Verarbeitung prüfen',green:'Keine konkreten Ersatzmerkmale erkennbar',unknown:'Mangels Zutaten nicht beurteilbar'}[level];
 const detail={red:'Die verfügbaren Angaben weisen auf eine Alternativ- oder Ersatzrezeptur hin. Nicht gleichzusetzen mit rechtswidriger Verbrauchertäuschung.',yellow:'Bestimmte Angaben sprechen für Verarbeitung, Geschmacksnachbildung oder eine abweichende Produktart. Kein Beweis für Täuschung.',green:'In den vorliegenden Angaben wurden keine festgelegten Ersatz- oder Nachahmungsmerkmale entdeckt. Weder Natürlichkeit noch vollständige Rezepturtreue ist damit garantiert.',unknown:'Es fehlt eine Zutatenliste. Keine grüne Entwarnung möglich.'}[level];
 return {level,heading,detail,matches,hasIngredients,processing,processingLabel:processing===4?'Hochverarbeitet (NOVA 4)':processing?'NOVA '+processing:'NOVA unbekannt',limits:'Aus den Etikett-/Community-Daten lassen sich Herstellungsverfahren, Herkunft einzelner Moleküle, nicht deklarierte Rückstände und Zutatenmengen nicht sicher bestimmen.'};
}
