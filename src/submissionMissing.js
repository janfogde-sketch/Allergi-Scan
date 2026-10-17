// @ts-nocheck
// Hvad indsendelsen af et nyt produkt mangler (Jan, 16. okt. 2026). Bruges af NotFoundScreen.jsx.

// Allergenerne er ikke tjekket automatisk: tjekket fejlede, eller der er ingen læst ingrediensliste.
export function allergensUnchecked({ ocrText, allergenCheckFailed }) {
  return !!allergenCheckFailed || !String(ocrText || "").trim();
}

// Det, der ikke blev registreret, samlet til "Gennemse og send". step = trinnet, hvor det rettes (null = rettes på siden).
export function missingSubmissionItems({ name, hasImage, hasIngredients, ocrUnreadable, nameUnread, unchecked, nutritionCount }) {
  const items = [];
  if (!String(name || "").trim()) items.push({ key:"name", step:null, text: nameUnread ? "Vi kunne ikke læse produktnavnet. Skriv det i feltet herunder." : "Produktnavn mangler. Skriv det i feltet herunder." });
  if (!hasImage) items.push({ key:"image", step:1, text:"Der er intet billede af forsiden." });
  if (!hasIngredients) items.push({ key:"ingredients", step:2, text: ocrUnreadable ? "Vi kunne ikke læse ingredienslisten." : "Der mangler et billede af ingredienslisten." });
  if (hasIngredients && unchecked) items.push({ key:"allergens", step:null, text:"Allergenerne er ikke tjekket automatisk. Vælg dem selv herunder." });
  if (!nutritionCount) items.push({ key:"nutrition", step:3, text:"Der er intet næringsindhold (valgfrit)." });
  return items;
}
