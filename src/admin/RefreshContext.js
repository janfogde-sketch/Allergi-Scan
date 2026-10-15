// @ts-check
// Fortæller sektionerne, at siden opdateres fra headerens opdateringsikon. Så beholder en side sine allerede viste data og viser ikke en
// "Henter…"-spinner i stedet for dem; ikonet roterer som tegn på, at der hentes. En første indlæsning uden data viser stadig spinneren.
import { createContext, useContext } from "react";

export const RefreshContext = createContext(false);

/**
 * @param {boolean} loading en indlæsning kører
 * @param {boolean} hasData siden har allerede data at vise
 * @returns {boolean} true, når spinneren skal erstatte indholdet
 */
export function useShowSpinner(loading, hasData) {
  const refreshing = useContext(RefreshContext);
  return !!loading && !(refreshing && hasData);
}
