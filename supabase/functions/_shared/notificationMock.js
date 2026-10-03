// supabase/functions/_shared/notificationMock.js
//
// Opdigtede eksempeldata til testafsendelse og forhåndsvisning i admin (Notifikationer).
// Ingen rigtige personer, produkter eller sager — kun til at se, hvordan en besked tager sig ud.

const PRODUCT = { productName: "Arla Økologisk Letmælk", ean: "5760466000000" };
const TICKET = {
  ticketExcerpt: "Scanneren fandt ikke stregkoden på min havregryn.",
  message: "Tak for din tilbagemelding. Vi har set på det og rettet fejlen.",
  ticketId: "00000000-0000-0000-0000-000000000000",
};
const LIST = { listName: "Weekendindkøb", listId: "00000000-0000-0000-0000-000000000000" };

export const MOCK_DATA = {
  "N2a:default": { ...PRODUCT, submissionId: "mock" },
  "N2b:default": { ...PRODUCT, submissionId: "mock" },
  "N3:default": { ...PRODUCT, submissionId: "mock", reason: "Stregkoden kunne ikke aflæses på billedet. Tag et nyt, skarpt billede af bagsiden." },
  "N4:default": { ...PRODUCT, submissionId: "mock" },
  "N5:default": { memberName: "Maria", inviteId: "mock" },
  "N10:default": { memberName: "Maria", inviteId: "mock" },
  "N11:approved": { memberName: "Jan", inviteId: "mock" },
  "N11:declined": { memberName: "Jan", inviteId: "mock" },
  "N6:in_progress": TICKET,
  "N6:resolved": TICKET,
  "N6:reopened": TICKET,
  "N6:reply": TICKET,
  "P1:default": { ...PRODUCT, changeSummary: "Indeholder nu mælk" },
  "P2:default": { inviteId: "mock", expiresAt: "i morgen kl. 14.00" },
  "P3:one": { ...LIST, adders: "Jan", countText: "en vare", itemList: "• Havregryn" },
  "P3:many": { ...LIST, adders: "Jan og Bjørn", countText: "5 varer", itemList: "• Havregryn\n• Mælk\n• Æg\n• Smør\nog 1 flere" },
  "P6:default": {
    ...PRODUCT,
    recallReason: "Produktet kan indeholde spor af nødder, som ikke er angivet på emballagen.",
    affectedBatches: "Partinummer 12345, bedst før 15.11.2026",
    recallAction: "Returnér produktet til butikken mod fuld refusion.",
    recallUrl: "https://foedevarestyrelsen.dk/nyheder/tilbagekaldte-produkter",
    recallId: "mock",
  },
};

export function mockDataFor(key) {
  return { ...(MOCK_DATA[key] ?? {}) };
}
