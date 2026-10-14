'use strict';
// Heuristische Zutaten-/Bezeichnungsanalyse, keine rechtliche Täuschungsfeststellung.
function assessAuthenticity(p){
 const name=[p.product_name_de,p.product_name].filter(Boolean).join(' ').toLowerCase();
 const ingredients=[p.ingredients_text_de,p.ingredients_text].find(Boolean)?.toLowerCase()||'';
 const cats=[p.categories,...(p.categories_tags||[])].filter(Boolean).join(' ').toLowerCase();
 const combined=name+' '+cats;
 const matches=[];
 const add=(kind,title,reason)=>{if(!matches.some(x=>x.title===title))matches.push({kind,title,reason})};
 const test=(re,s)=>re.test(s);
 const cheese=test(/käse|cheese|mozzarella|gouda|emmental|feta|pizza[- ]belag|pizzabelag|käsezubereitung/,combined);
 const meat=test(/fleisch|wurst|schinken|schnitzel|burger|steak|hack|salami|nugget|chicken|hähnchen|protein[- ]?stück/,combined);
 const chocolate=test(/schokolad|schoko|kakao|chocolate|cocoa|kakaohaltig|fettglasur/,combined);
 const dairy=test(/joghurt|yoghurt|milch|sahne|quark|pudding|creme/,combined);
 const fruit=test(/frucht|erdbeer|himbeer|vanille|zitrone|orange|apfel|mango|kirsch|pfirsich/,combined);
 const alternative=test(/\b(vegan|vegane|veganer|veganes|vegetarisch|vegetarische|pflanzliche alternative|plant[- ]based|fleischersatz|käseersatz|milchersatz|analogkäse|kunstkäse|imitat|ersatzprodukt|chocolate substitute|schokoladenersatz|kakaohaltige fettglasur)\b/,combined);
 // Red: substantial substitution that is clearly supported by name or recipe. Not an allegation of unlawful deception.
 if(test(/analogkäse|kunstkäse|käseimitat|käseersatz|fleischersatz|milchersatz|schokoladenersatz|schokolade[n]?[ -]?imitat|kakaohaltige fettglasur/,combined))
  add('red','Als Ersatz/Imitat bezeichnet','Die Produktbezeichnung benennt ausdrücklich eine Alternative oder Ersatzrezeptur. Das ist nicht automatisch eine Täuschung.');
 if(alternative&&(cheese||meat||dairy)) add('red','Deklarierte Produktalternative','Der Produktname weist auf eine pflanzliche/vegetarische Alternative zu einem tierischen Produkt hin. Klar gekennzeichnete Alternativen sind keine Täuschung.');
 if(cheese&&test(/pflanzliche[snr]? (fett|öl)|kokosfett|palmfett|kokosöl|palmöl|pflanzenfett/,ingredients)&&!test(/\b(käse|cheese|milch|sahne)\b/,ingredients))
  add('red','Käseähnliche Fett-Rezeptur','Käsebezug im Namen, Pflanzenfett in der Zutatenliste und keine erkennbare Milch-/Käsezutat. Eine genaue Produktprüfung bleibt nötig.');
 if(chocolate&&test(/kakaohaltige fettglasur|schokoladenersatz/,ingredients))add('red','Schokoladenähnlicher Überzug','Die Zutaten nennen kakaohaltige Fettglasur oder einen Schokoladenersatz statt gewöhnlicher Schokolade.');
 if(meat&&test(/\b(sojaprotein|erbsenprotein|weizenprotein|seitan|mykoprotein|texturiertes pflanzenprotein)\b/,ingredients)&&!test(/\b(fleisch|schweinefleisch|rindfleisch|hähnchenfleisch|pute|geflügel)\b/,ingredients))
  add('red','Fleischähnliche pflanzliche Rezeptur','Proteinbasis aus Pflanzen/Pilzen statt einer deklarierten Fleischzutat.');
 // Yellow: plausible substitutes, but not sufficient to claim imitation.
 if(test(/\b(aroma|aromen|aromastoffe|natürliches aroma|natürliche aromen|geschmacksstoff|raucharoma)\b/,ingredients)){
  if(test(/\b(geschmack|geschmacksrichtung|style|typ|flavour|flavor|aromatisiert)\b/,name)||fruit||cheese||meat||chocolate||dairy)
   add('yellow','Geschmack durch zugesetzte Aromen','Aromen sind deklariert und können Geschmack verstärken oder nachbilden. Daraus folgt nicht, dass die namensgebende Zutat fehlt.');
 }
 if(fruit&&test(/\b(geschmack|geschmacksrichtung|aromatisiert)\b/,name)&&!test(/frucht|fruchtpüree|fruchtsaft|erdbeer|himbeer|apfel|mango|kirsch|orange|vanille|zitrone/,ingredients))
  add('yellow','Namensgebende Zutat nicht erkennbar','Der Name beschreibt einen Geschmack; eine entsprechende Frucht-/Pflanzenzutat ist in den verfügbaren Angaben nicht erkennbar.');
 if(cheese&&test(/pflanzenfett|pflanzliche fette|kokosfett|palmfett|pflanzenöl|kokosöl|palmöl/,ingredients))
  add('yellow','Pflanzenfett im käsebezogenen Produkt','Das Fett kann eine technische Funktion haben oder Milchfett ersetzen. Seine Anwesenheit beweist keinen Ersatz.');
 if(chocolate&&test(/\b(palmfett|kokosfett|pflanzenfett|pflanzliche fette|palmöl|kokosöl)\b/,ingredients))
  add('yellow','Pflanzenfett bei Schokoladenbezug','Kann Füllung, Glasur oder Schokoladenanteil betreffen. Ohne Rezepturanteile ist kein Schokoladenersatz bewiesen.');
 if(test(/\b(fermentationsbasiert|präzisionsfermentation|precision fermentation|zellkultiviert|cultivated meat|zellkulturfleisch|lab grown)\b/,combined+' '+ingredients))
  add('yellow','Neuartiges Herstellungsverfahren deklariert','Eine Bezeichnung weist auf Fermentation oder Zellkultur hin. Verfahren und genaue Zutaten müssen getrennt bewertet werden.');
 const serious=matches.some(x=>x.kind==='red'),minor=matches.some(x=>x.kind==='yellow');
 const hasIngredients=Boolean(ingredients.trim());
 const level=serious?'red':minor?'yellow':hasIngredients?'green':'unknown';
 const heading={red:'Ersatz- oder Nachahmungsmerkmale erkannt',yellow:'Rezeptur genauer prüfen',green:'Keine konkreten Nachahmungshinweise',unknown:'Nicht beurteilbar'}[level];
 const detail={red:'Mindestens ein deutlicher Hinweis auf ein Alternativ- oder Ersatzprodukt. Die Kennzeichnung kann dabei völlig korrekt sein.',yellow:'Mindestens ein Verdachtsmerkmal ist erkennbar; die Daten belegen keine Täuschung.',green:'In den erfassten Zutaten und Bezeichnungen wurde kein definiertes Nachahmungsmerkmal gefunden. Das beweist weder Natürlichkeit noch Laborfreiheit.',unknown:'Es fehlt eine Zutatenliste. Eine belastbare Ampelfarbe ist nicht möglich.'}[level];
 return {level,heading,detail,matches,hasIngredients};
}
