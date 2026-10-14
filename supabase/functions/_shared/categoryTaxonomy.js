// Fast liste over kategorier og underkategorier. Bruges af classify-categories og af natjob-tråden
// (scripts/natjob.mjs), så begge vælger fra samme liste.
export const TAXONOMY = {
  "Drikkevarer": [
    "Mælk & mælkealternativer", "Juice & saft", "Sodavand & læskedrikke", "Vand",
    "Kaffe", "Te", "Øl", "Vin", "Spiritus & cocktails",
    "Sportsdrikke & energidrikke", "Andre drikkevarer",
  ],
  "Kolonial": [
    "Pasta & ris", "Konserves", "Krydderier & smagsgivere", "Olier & eddike",
    "Sovs & dressing", "Bagetilbehør", "Morgenmad & müsli",
    "Nødder & tørret frugt", "Færdiglavede saucer", "Andet kolonial",
  ],
  "Snacks & slik": [
    "Chips & snacks", "Slik & bolsjer", "Chokolade", "Kiks & kager",
    "Nødder (snack)", "Popcorn", "Andet snacks",
  ],
  "Mejeri & æg": [
    "Mælk", "Yoghurt & skyr", "Ost", "Smør & margarine", "Fløde", "Æg",
    "Plantebaserede mejerialternativer", "Andet mejeri",
  ],
  "Frugt & grønt": [
    "Frisk frugt", "Frisk grønt", "Krydderurter", "Salater", "Andet frugt & grønt",
  ],
  "Frost": [
    "Frostgrønt", "Frostfrugt", "Is", "Frosne færdigretter", "Frosne bagværk", "Andet frost",
  ],
  "Brød & bagværk": [
    "Brød", "Rugbrød", "Boller & bagværk", "Kager & wienerbrød", "Knækbrød & kiks", "Andet brød",
  ],
  "Kød & fisk": [
    "Oksekød", "Svinekød", "Lammekød & vildt", "Fjerkræ", "Fisk", "Skaldyr", "Pålæg & charcuteri",
    "Plantebaseret kød-alternativ", "Andet kød & fisk",
  ],
  "Færdigretter": [
    "Kølede færdigretter", "Salater & tilbehør", "Supper", "Sandwich & snackmåltider", "Andet færdigretter",
  ],
  "Andet": ["Andet"],
};

export function isValidCategory(category, subcategory) {
  return Object.hasOwn(TAXONOMY, category) && TAXONOMY[category].includes(subcategory);
}
