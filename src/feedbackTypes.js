// @ts-nocheck
// Feedbacktyper (id'erne er gemt i feedback_tickets.type og bruges af admin). Alle ikoner er line-ikoner fra samme `Icon`-bibliotek.
// "crash" hedder "Appen lukker ned" i appen; id'et er uændret, så eksisterende tickets og admin virker som før.
export const FEEDBACK_TYPES = [
  { id: "bug",        icon: "bug",     label: "Fejl / bug" },
  { id: "ui",         icon: "eye",     label: "Design / UI" },
  { id: "missing",    icon: "plus",    label: "Mangler noget" },
  { id: "content",    icon: "file",    label: "Forkert indhold" },
  { id: "crash",      icon: "warning", label: "Appen lukker ned" },
  { id: "suggestion", icon: "bulb",    label: "Forslag" },
];
